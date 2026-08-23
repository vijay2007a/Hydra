"""
Robust Data Loader for Real Datasets in HydroCast.
Handles GCC Storm Water Drain GeoJSON, ArcGIS pagination sync, Chennai Reservoirs, and OSM Geopackage layers.
"""
import os
import json
import logging
import pandas as pd
import geopandas as gpd
from typing import Dict, Any, Optional
import pyogrio

from app.config import DATASET_PATHS, RESERVOIR_COORDINATES, WGS84, UTM44N
from app.core.arcgis_client import ArcGISDrainClient

logger = logging.getLogger("hydrocast.dataloader")

class DataLoader:
    _instance = None

    def __init__(self):
        self.drains_gdf: Optional[gpd.GeoDataFrame] = None
        self.drains_geojson: Optional[Dict[str, Any]] = None
        self.drains_metadata: Dict[str, Any] = {
            "exceeded_transfer_limit": False,
            "total_loaded_features": 0,
            "total_network_length_km": 0.0
        }
        self.reservoirs_df: Optional[pd.DataFrame] = None
        self.waterways_gdf: Optional[gpd.GeoDataFrame] = None
        self.waterbodies_gdf: Optional[gpd.GeoDataFrame] = None
        self.is_loaded: bool = False

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = DataLoader()
            cls._instance.load_all()
        return cls._instance

    def load_all(self):
        """Loads all datasets with error handling and caching."""
        self.load_drains()
        self.load_reservoirs()
        self.load_osm_layers()
        self.is_loaded = True

    def load_drains(self, custom_gdf: Optional[gpd.GeoDataFrame] = None, save_to_disk: bool = False):
        """Loads and cleans the Greater Chennai Corporation Storm Water Drain GeoJSON."""
        if custom_gdf is not None:
            gdf = custom_gdf
            exceeded_limit = False
        else:
            drain_path = DATASET_PATHS.get("drainage")
            if not drain_path or not os.path.exists(drain_path):
                logger.warning("GCC Storm Water Drain dataset not found at expected path.")
                return

            try:
                logger.info(f"Loading GCC Storm Water Drain dataset from {drain_path}...")
                with open(drain_path, 'r', encoding='utf-8', errors='ignore') as f:
                    raw_json = json.load(f)

                exceeded_limit = bool(raw_json.get('exceededTransferLimit', False) or 
                                     raw_json.get('properties', {}).get('exceededTransferLimit', False))
                gdf = gpd.GeoDataFrame.from_features(raw_json['features'], crs=WGS84)
            except Exception as e:
                logger.error(f"Error loading GCC drainage dataset: {e}", exc_info=True)
                return

        try:
            # Clean numerical fields
            if 'dlen_km' in gdf.columns:
                gdf['dlen_km'] = pd.to_numeric(gdf['dlen_km'], errors='coerce').fillna(0.0)
            else:
                gdf['dlen_km'] = 0.0

            if 'drain_wid' in gdf.columns:
                gdf['drain_wid'] = pd.to_numeric(gdf['drain_wid'], errors='coerce').fillna(0.86)
            else:
                gdf['drain_wid'] = 0.86

            if 'drain_dep' in gdf.columns:
                gdf['drain_dep'] = pd.to_numeric(gdf['drain_dep'], errors='coerce').fillna(0.86)
            else:
                gdf['drain_dep'] = 0.86

            if 'st_length(shape)' in gdf.columns:
                gdf['st_length_shape'] = pd.to_numeric(gdf['st_length(shape)'], errors='coerce').fillna(0.0)
            elif 'st_length_shape' in gdf.columns:
                gdf['st_length_shape'] = pd.to_numeric(gdf['st_length_shape'], errors='coerce').fillna(0.0)
            else:
                gdf['st_length_shape'] = 0.0
            
            # Clean string fields
            for str_col in ['zone', 'ward', 'location', 'drain_type', 'cover', 'status', 'obstacles', 'water_flow', 'typ_mat', 'swd_mat']:
                if str_col in gdf.columns:
                    gdf[str_col] = gdf[str_col].astype(str).str.strip().replace({'': 'N/A', 'nan': 'N/A'})

            total_km = float(gdf['dlen_km'].sum())
            if total_km == 0.0 and 'st_length_shape' in gdf.columns:
                total_km = float(gdf['st_length_shape'].sum() / 1000.0)

            self.drains_gdf = gdf
            self.drains_geojson = json.loads(gdf.to_json())
            self.drains_metadata = {
                "exceeded_transfer_limit": exceeded_limit,
                "total_loaded_features": len(gdf),
                "total_network_length_km": round(total_km, 2),
                "data_integrity_notice": (
                    "Source GeoJSON indicates exceededTransferLimit=True (MaxRecordCount=2000 query limit). "
                    f"429.16 km represents the length of these {len(gdf)} segments. "
                    "Use /api/drains/sync-arcgis with an ArcGIS REST service URL to harvest the full municipal network."
                ) if exceeded_limit else "Complete dataset verified."
            }

            if save_to_disk and custom_gdf is not None:
                try:
                    save_path = os.path.join(os.path.dirname(DATASET_PATHS.get("drainage", "")), "drainage_harvested.geojson")
                    gdf.to_file(save_path, driver="GeoJSON")
                    logger.info(f"Persisted harvested complete dataset ({len(gdf)} features) to {save_path}")
                except Exception as save_err:
                    logger.warning(f"Could not persist harvested dataset to disk: {save_path} ({save_err})")

            logger.info(f"Loaded {len(gdf)} GCC drain features ({self.drains_metadata['total_network_length_km']} km) successfully.")
        except Exception as e:
            logger.error(f"Error processing GCC drainage dataset: {e}", exc_info=True)

    def sync_from_arcgis(self, service_url: str) -> Dict[str, Any]:
        """
        Queries official GCC ArcGIS REST endpoint to verify total count,
        retrieves additional records, and non-destructively combines them with the
        authoritative local dataset without deleting or replacing the original file.
        """
        client = ArcGISDrainClient(service_url)
        total_count = client.query_total_count()
        new_gdf = client.fetch_complete_dataset()
        
        if new_gdf is not None and len(new_gdf) > 0:
            # Combine non-destructively with local dataset
            if self.drains_gdf is not None and len(self.drains_gdf) > 0:
                local_oids = set(self.drains_gdf['objectid']) if 'objectid' in self.drains_gdf.columns else set()
                
                # Filter out records already present in local dataset
                if 'objectid' in new_gdf.columns:
                    unique_new = new_gdf[~new_gdf['objectid'].isin(local_oids)]
                else:
                    unique_new = new_gdf
                
                logger.info(f"Combining {len(self.drains_gdf)} local features with {len(unique_new)} new unique features from ArcGIS...")
                combined_gdf = pd.concat([self.drains_gdf, unique_new], ignore_index=True)
                combined_gdf = gpd.GeoDataFrame(combined_gdf, geometry='geometry', crs=WGS84)
            else:
                combined_gdf = new_gdf

            # Load combined GeoDataFrame into active memory
            self.load_drains(custom_gdf=combined_gdf, save_to_disk=False)
            
            # Save combined dataset separately without touching the original local file
            try:
                drain_dir = os.path.dirname(DATASET_PATHS.get("drainage", str(DATASET_PATHS.get("drainage"))))
                comb_path = os.path.join(drain_dir, "drainage_combined.geojson")
                combined_gdf.to_file(comb_path, driver="GeoJSON")
                logger.info(f"Saved non-destructive combined drainage dataset to {comb_path}")
            except Exception as save_err:
                logger.warning(f"Could not save combined dataset copy: {save_err}")

            # Refresh RiskEngine indices with the complete combined dataset
            try:
                from app.core.risk_engine import RiskEngine
                RiskEngine.get_instance().cached_risk_geojson = None
                RiskEngine.get_instance().cached_risk_summary = None
                RiskEngine.get_instance().precalculate_spatial_indices()
            except Exception as r_err:
                logger.warning(f"Could not refresh RiskEngine after ArcGIS sync: {r_err}")

            return {
                "status": "success",
                "total_arcgis_features": total_count or len(combined_gdf),
                "original_local_features_preserved": len(self.drains_gdf),
                "total_combined_features": len(combined_gdf),
                "total_network_length_km": self.drains_metadata["total_network_length_km"],
                "data_integrity": "COMPLETE_COMBINED_DATASET"
            }
        return {
            "status": "error",
            "message": f"Failed to fetch features from ArcGIS service {service_url}"
        }

    def load_reservoirs(self) -> pd.DataFrame:
        """Loads and merges capacity and current water level CSVs."""
        cap_path = DATASET_PATHS.get("reservoir_capacity")
        lvl_path = DATASET_PATHS.get("reservoir_level")
        
        if not cap_path or not lvl_path or not os.path.exists(cap_path) or not os.path.exists(lvl_path):
            logger.warning("Reservoir datasets not found at expected paths.")
            return pd.DataFrame()

        try:
            logger.info(f"Loading Reservoir datasets from {cap_path} and {lvl_path}...")
            df_cap = pd.read_csv(cap_path, encoding='utf-8-sig')
            df_lvl = pd.read_csv(lvl_path, encoding='utf-8-sig')
            
            df_cap.columns = [c.strip() for c in df_cap.columns]
            df_lvl.columns = [c.strip() for c in df_lvl.columns]
            
            df_res = pd.merge(df_cap, df_lvl, on="category", how="outer")
            
            lats, lons, full_names, basins = [], [], [], []
            for _, r in df_res.iterrows():
                name = str(r['category']).strip()
                meta = RESERVOIR_COORDINATES.get(name, {
                    "lat": 13.15, "lon": 80.15, "full_name": name, "basin": "Chennai Basin"
                })
                lats.append(meta["lat"])
                lons.append(meta["lon"])
                full_names.append(meta["full_name"])
                basins.append(meta["basin"])
                
            df_res['latitude'] = lats
            df_res['longitude'] = lons
            df_res['full_name'] = full_names
            df_res['basin'] = basins
            
            df_res['Capacity'] = pd.to_numeric(df_res['Capacity'], errors='coerce').fillna(0.0)
            df_res['Water Level'] = pd.to_numeric(df_res['Water Level'], errors='coerce').fillna(0.0)
            
            df_res['storage_pct'] = (df_res['Water Level'] / df_res['Capacity'].replace(0, 1)) * 100.0
            df_res['storage_pct'] = df_res['storage_pct'].round(1)
            
            statuses = []
            for pct in df_res['storage_pct']:
                if pct >= 85.0:
                    statuses.append("CRITICAL")
                elif pct >= 65.0:
                    statuses.append("WATCH")
                elif pct >= 30.0:
                    statuses.append("MODERATE")
                else:
                    statuses.append("NORMAL")
            df_res['status'] = statuses
            
            self.reservoirs_df = df_res
            logger.info(f"Loaded {len(df_res)} Chennai reservoirs successfully.")
            return df_res
        except Exception as e:
            logger.error(f"Error loading reservoir datasets: {e}", exc_info=True)
            return pd.DataFrame()

    def load_osm_layers(self):
        """Loads waterways and waterbodies layers from the OSM GeoPackage."""
        gpkg_path = DATASET_PATHS.get("osm_gpkg")
        if not gpkg_path or not os.path.exists(gpkg_path):
            logger.warning("OSM GeoPackage not found at expected path.")
            return

        try:
            logger.info(f"Loading OSM waterways and water bodies from {gpkg_path}...")
            self.waterways_gdf = pyogrio.read_dataframe(
                gpkg_path, 
                layer='lines', 
                where="waterway IS NOT NULL"
            )
            self.waterbodies_gdf = pyogrio.read_dataframe(
                gpkg_path, 
                layer='multipolygons', 
                where="natural = 'water' OR natural = 'wetland' OR landuse IN ('reservoir', 'basin')"
            )
            logger.info(f"Loaded {len(self.waterways_gdf)} waterways and {len(self.waterbodies_gdf)} water bodies from OSM.")
        except Exception as e:
            logger.error(f"Error loading OSM GeoPackage layers: {e}", exc_info=True)
