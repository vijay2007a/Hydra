"""
Spatial Utility Functions for Geospatial Distances and Projections.
"""
import logging
import geopandas as gpd
from typing import Tuple
from app.config import WGS84, UTM44N

logger = logging.getLogger("hydrocast.spatial")

def compute_distances_to_hydro(
    gdf_drains: gpd.GeoDataFrame, 
    gdf_waterways: gpd.GeoDataFrame, 
    gdf_waterbodies: gpd.GeoDataFrame
) -> Tuple[gpd.GeoSeries, gpd.GeoSeries]:
    """
    Computes metric Euclidean distance (meters) from each drain centroid
    to the nearest OSM waterway line and OSM waterbody polygon.
    """
    try:
        # Project to UTM 44N (metric coordinates for Chennai)
        drains_m = gdf_drains.to_crs(UTM44N)
        centroids_m = drains_m.geometry.centroid

        dist_waterways = None
        dist_waterbodies = None

        if gdf_waterways is not None and len(gdf_waterways) > 0:
            ww_m = gdf_waterways.to_crs(UTM44N)
            ww_union = ww_m.geometry.union_all()
            dist_waterways = centroids_m.distance(ww_union)

        if gdf_waterbodies is not None and len(gdf_waterbodies) > 0:
            wb_m = gdf_waterbodies.to_crs(UTM44N)
            wb_union = wb_m.geometry.union_all()
            dist_waterbodies = centroids_m.distance(wb_union)

        return dist_waterways, dist_waterbodies
    except Exception as e:
        logger.error(f"Error computing spatial distances: {e}", exc_info=True)
        # Fallback default series
        return None, None
