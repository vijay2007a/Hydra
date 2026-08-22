"""
Configuration and Dataset Auto-Discovery for HydroCast Backend.
Recursively detects and dynamically configures dataset paths without requiring hardcoded paths.
Loads environment variables for Firebase and external APIs.
"""
import os
import glob
from pathlib import Path
from dotenv import load_dotenv

# Base directories
APP_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = APP_DIR.parent

# Load environment variables from .env file
load_dotenv(PROJECT_ROOT / ".env")

# Firebase / Firestore configuration
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "hydra-1963e")
FIREBASE_SERVICE_ACCOUNT_PATH = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", r"C:\Users\vijay\secrets\firebase-key.json")
FIRESTORE_WEATHER_COLLECTION = os.getenv("FIRESTORE_WEATHER_COLLECTION", "weather_snapshots")
WEATHER_REFRESH_MINUTES = int(os.getenv("WEATHER_REFRESH_MINUTES", "15"))

# Open-Meteo Coordinates for Chennai
CHENNAI_WEATHER_COORDS = {
    "city": "Chennai",
    "state": "Tamil Nadu",
    "country": "India",
    "latitude": 13.0827,
    "longitude": 80.2707,
    "timezone": "Asia/Kolkata"
}

def find_dataset_paths():
    """
    Recursively scans the project directory to discover all required datasets dynamically.
    """
    candidates = {
        "drainage": None,
        "reservoir_capacity": None,
        "reservoir_level": None,
        "gpm_dir": None,
        "osm_gpkg": None
    }
    
    for root, dirs, files in os.walk(PROJECT_ROOT):
        if any(skip in root for skip in ['node_modules', '.git', '.gemini', '__pycache__', 'venv']):
            continue
            
        for f in files:
            full_p = os.path.join(root, f)
            f_lower = f.lower()
            
            # Drain GeoJSON
            if f_lower == "drainage" or (f_lower.endswith((".geojson", ".json")) and "drain" in f_lower):
                if candidates["drainage"] is None and os.path.getsize(full_p) > 10000:
                    candidates["drainage"] = full_p
                    
            # Reservoir CSVs
            if f_lower.endswith(".csv"):
                try:
                    with open(full_p, 'r', encoding='utf-8-sig', errors='ignore') as csv_f:
                        header = csv_f.readline().lower()
                        if "capacity" in header:
                            candidates["reservoir_capacity"] = full_p
                        elif "water level" in header or "water_level" in header or "level" in header:
                            candidates["reservoir_level"] = full_p
                except Exception:
                    pass
                    
            # OSM GeoPackage
            if f_lower.endswith(".gpkg") and ("planet" in f_lower or "osm" in f_lower or "chennai" in f_lower):
                candidates["osm_gpkg"] = full_p

        # NASA IMERG HDF5
        for d in dirs:
            if "GPM" in d or "IMERG" in d:
                dir_path = os.path.join(root, d)
                h5_count = len(glob.glob(os.path.join(dir_path, "*.HDF5")) + glob.glob(os.path.join(dir_path, "*.hdf5")))
                if h5_count > 0:
                    candidates["gpm_dir"] = dir_path

    return candidates

# Discovered Paths
DATASET_PATHS = find_dataset_paths()

# Spatial Bounding Box for Greater Chennai
CHENNAI_BBOX = {
    "min_lon": 79.8,
    "max_lon": 80.45,
    "min_lat": 12.8,
    "max_lat": 13.4
}

# Coordinate Reference Systems
WGS84 = "EPSG:4326"
UTM44N = "EPSG:32644"

# Known Chennai Reservoir Geocoordinates (WGS84)
RESERVOIR_COORDINATES = {
    "Poondi": {"lat": 13.1884, "lon": 79.8596, "full_name": "Sathyamurthy Sagar (Poondi)", "basin": "Kosasthalaiyar"},
    "Chembarambakkam": {"lat": 13.0116, "lon": 80.0594, "full_name": "Chembarambakkam Lake", "basin": "Adyar"},
    "Red Hills": {"lat": 13.1550, "lon": 80.1770, "full_name": "Puzhal Reservoir (Red Hills)", "basin": "Kosasthalaiyar"},
    "Cholavaram": {"lat": 13.2383, "lon": 80.1450, "full_name": "Cholavaram Tank", "basin": "Kosasthalaiyar"},
    "Thervoy Kandigal": {"lat": 13.3765, "lon": 80.0528, "full_name": "Thervoy Kandigal Reservoir", "basin": "Araniyar"}
}
