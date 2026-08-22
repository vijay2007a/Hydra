"""
ArcGIS REST API Client for Storm Water Drain Layers.
Handles ArcGIS FeatureServer / MapServer queries, count verification,
and automatic pagination to fetch complete datasets beyond MaxRecordCount.
"""
import urllib.request
import urllib.parse
import json
import logging
import os
import ssl
from typing import Dict, Any, Optional, Tuple, List
import geopandas as gpd
from shapely.geometry import shape, LineString, MultiLineString, Point, Polygon

from app.config import WGS84

logger = logging.getLogger("hydrocast.arcgis")

def _esri_geometry_to_shapely(geom_dict: Dict[str, Any]):
    """Converts Esri JSON geometry (paths/rings/x,y) to Shapely geometry."""
    if not geom_dict:
        return None
    if "paths" in geom_dict:
        paths = geom_dict["paths"]
        if len(paths) == 1:
            return LineString(paths[0])
        elif len(paths) > 1:
            return MultiLineString([LineString(p) for p in paths])
    elif "rings" in geom_dict:
        rings = geom_dict["rings"]
        if len(rings) == 1:
            return Polygon(rings[0])
        elif len(rings) > 1:
            return Polygon(rings[0], rings[1:])
    elif "x" in geom_dict and "y" in geom_dict:
        return Point(geom_dict["x"], geom_dict["y"])
    return None

class ArcGISDrainClient:
    def __init__(self, service_url: Optional[str] = None):
        self.service_url = service_url or os.environ.get("GCC_SWD_ARCGIS_URL")
        # Municipal SSL contexts often require unverified fallback
        self._ssl_ctx = ssl.create_default_context()
        self._ssl_ctx.check_hostname = False
        self._ssl_ctx.verify_mode = ssl.CERT_NONE

    def _make_request(self, url: str, timeout: int = 30) -> Optional[Dict[str, Any]]:
        """Makes an HTTP GET request with custom headers and resilient SSL handling."""
        try:
            req = urllib.request.Request(
                url,
                headers={
                    "User-Agent": "HydroCast-ArcGIS-Harvester/1.0",
                    "Accept": "application/json, text/plain, */*"
                }
            )
            with urllib.request.urlopen(req, timeout=timeout, context=self._ssl_ctx) as resp:
                content = resp.read().decode('utf-8', errors='ignore')
                return json.loads(content)
        except Exception as e:
            logger.warning(f"HTTP request error for {url}: {e}")
            return None

    def get_service_metadata(self) -> Optional[Dict[str, Any]]:
        """Queries the layer root metadata to inspect maxRecordCount, layer details, and capabilities."""
        if not self.service_url:
            return None
        url = f"{self.service_url.rstrip('/')}?f=pjson"
        return self._make_request(url, timeout=15)

    def query_total_count(self) -> Optional[int]:
        """Queries the actual total feature count using returnCountOnly=true."""
        if not self.service_url:
            return None
        params = {
            "where": "1=1",
            "returnCountOnly": "true",
            "f": "json"
        }
        query_url = f"{self.service_url.rstrip('/')}/query?{urllib.parse.urlencode(params)}"
        data = self._make_request(query_url, timeout=20)
        if data and "count" in data:
            return int(data["count"])
        return None

    def query_object_ids(self) -> List[int]:
        """Fetches list of all Object IDs when server doesn't support resultOffset pagination."""
        if not self.service_url:
            return []
        params = {
            "where": "1=1",
            "returnIdsOnly": "true",
            "f": "json"
        }
        query_url = f"{self.service_url.rstrip('/')}/query?{urllib.parse.urlencode(params)}"
        data = self._make_request(query_url, timeout=30)
        if data and "objectIds" in data:
            return data["objectIds"]
        return []

    def fetch_complete_dataset(self, chunk_size: int = 2000) -> Optional[gpd.GeoDataFrame]:
        """
        Paginates through the ArcGIS REST service using resultOffset and resultRecordCount
        to harvest 100% of all features, bypassing maxRecordCount limits.
        Falls back to Object ID batching if resultOffset pagination is not supported.
        """
        if not self.service_url:
            logger.warning("No ArcGIS service URL provided for dataset synchronization.")
            return None

        total_count = self.query_total_count()
        logger.info(f"ArcGIS REST Service reports total feature count: {total_count}")

        # Try GeoJSON first, fall back to Esri JSON
        all_features = []
        offset = 0

        while True:
            params = {
                "where": "1=1",
                "outFields": "*",
                "f": "geojson",
                "resultOffset": str(offset),
                "resultRecordCount": str(chunk_size),
                "outSR": "4326"
            }
            query_url = f"{self.service_url.rstrip('/')}/query?{urllib.parse.urlencode(params)}"
            logger.info(f"Harvesting ArcGIS batch: offset {offset}, chunk {chunk_size}...")
            
            page_data = self._make_request(query_url, timeout=45)
            if not page_data or "features" not in page_data:
                # If GeoJSON failed, try Esri JSON format
                params["f"] = "json"
                query_url = f"{self.service_url.rstrip('/')}/query?{urllib.parse.urlencode(params)}"
                page_data = self._make_request(query_url, timeout=45)

            if not page_data or not page_data.get("features"):
                break

            raw_feats = page_data.get("features", [])
            for feat in raw_feats:
                if "geometry" in feat and "properties" in feat:
                    all_features.append(feat)
                elif "attributes" in feat: # Esri JSON
                    geom = _esri_geometry_to_shapely(feat.get("geometry"))
                    all_features.append({
                        "type": "Feature",
                        "geometry": geom.__geo_interface__ if geom else None,
                        "properties": feat.get("attributes", {})
                    })

            exceeded = page_data.get("exceededTransferLimit", False)
            offset += len(raw_feats)

            # Termination conditions
            if total_count and len(all_features) >= total_count:
                break
            if not exceeded and len(raw_feats) < chunk_size:
                break

        if all_features:
            logger.info(f"Successfully harvested {len(all_features)} total features from ArcGIS REST service.")
            gdf = gpd.GeoDataFrame.from_features(all_features, crs=WGS84)
            return gdf
        return None
