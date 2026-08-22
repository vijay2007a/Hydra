"""
Health and System Status Router.
"""
from fastapi import APIRouter
import datetime
from app.config import DATASET_PATHS, FIREBASE_PROJECT_ID, FIRESTORE_WEATHER_COLLECTION
from app.core.data_loader import DataLoader
from app.core.rainfall_processor import RainfallProcessor
from app.core.firebase import FirebaseManager

router = APIRouter(prefix="/api", tags=["Health"])

@router.get("/health", summary="System Health and Dataset Status")
def get_health():
    """
    Returns system operational health, timestamps, and real dataset connectivity status.
    """
    loader = DataLoader.get_instance()
    rainfall = RainfallProcessor.get_instance()
    firebase = FirebaseManager.get_instance()

    drains_count = len(loader.drains_gdf) if loader.drains_gdf is not None else 0
    res_count = len(loader.reservoirs_df) if loader.reservoirs_df is not None else 0
    h5_count = len(rainfall.h5_files)
    osm_waterways_count = len(loader.waterways_gdf) if loader.waterways_gdf is not None else 0
    osm_waterbodies_count = len(loader.waterbodies_gdf) if loader.waterbodies_gdf is not None else 0
    firestore_connected = firebase.is_connected()

    return {
        "status": "healthy",
        "service": "HydroCast Flood Intelligence API",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "version": "1.0.0",
        "firebase": {
            "project_id": FIREBASE_PROJECT_ID,
            "firestore_connected": firestore_connected,
            "weather_collection": FIRESTORE_WEATHER_COLLECTION,
            "init_mode": firebase.init_mode
        },
        "datasets": {
            "gcc_storm_water_drains": {
                "discovered": bool(DATASET_PATHS.get("drainage")),
                "path": DATASET_PATHS.get("drainage"),
                "features_count": drains_count,
                "status": "ready" if drains_count > 0 else "missing"
            },
            "nasa_gpm_imerg_precipitation": {
                "discovered": bool(DATASET_PATHS.get("gpm_dir")),
                "path": DATASET_PATHS.get("gpm_dir"),
                "total_hdf5_files": h5_count,
                "status": "ready" if h5_count > 0 else "missing"
            },
            "chennai_reservoirs": {
                "discovered": bool(DATASET_PATHS.get("reservoir_capacity") and DATASET_PATHS.get("reservoir_level")),
                "capacity_file": DATASET_PATHS.get("reservoir_capacity"),
                "level_file": DATASET_PATHS.get("reservoir_level"),
                "reservoirs_monitored": res_count,
                "status": "ready" if res_count > 0 else "missing"
            },
            "osm_geopackage": {
                "discovered": bool(DATASET_PATHS.get("osm_gpkg")),
                "path": DATASET_PATHS.get("osm_gpkg"),
                "waterways_count": osm_waterways_count,
                "waterbodies_count": osm_waterbodies_count,
                "status": "ready" if (osm_waterways_count + osm_waterbodies_count) > 0 else "missing"
            }
        }
    }
