"""
Rainfall Processor for NASA GPM IMERG V07 Satellite Precipitation Files.
Parses HDF5 internal structure, extracts 'Grid/precipitation' variable,
calculates accumulation, generates time series and spatial GeoJSON grid.
"""
import os
import glob
import logging
import datetime
from typing import Dict, Any, List, Optional
import numpy as np
import h5py

from app.config import DATASET_PATHS, CHENNAI_BBOX

logger = logging.getLogger("hydrocast.rainfall")

class RainfallProcessor:
    _instance = None

    def __init__(self):
        self.gpm_dir: Optional[str] = DATASET_PATHS.get("gpm_dir")
        self.h5_files: List[str] = []
        self.cached_latest: Optional[Dict[str, Any]] = None
        self.cached_timeseries: Optional[List[Dict[str, Any]]] = None
        self.cached_grid_geojson: Optional[Dict[str, Any]] = None
        self.grid_lats: Optional[np.ndarray] = None
        self.grid_lons: Optional[np.ndarray] = None
        self.lat_indices: Optional[np.ndarray] = None
        self.lon_indices: Optional[np.ndarray] = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = RainfallProcessor()
            cls._instance.initialize()
        return cls._instance

    def initialize(self):
        """Discovers all HDF5 files and initializes spatial indices."""
        if not self.gpm_dir or not os.path.exists(self.gpm_dir):
            logger.warning("NASA IMERG directory not found.")
            return

        self.h5_files = sorted(
            glob.glob(os.path.join(self.gpm_dir, "*.HDF5")) + 
            glob.glob(os.path.join(self.gpm_dir, "*.hdf5"))
        )
        logger.info(f"Discovered {len(self.h5_files)} NASA IMERG HDF5 files.")

        if self.h5_files:
            # Read spatial coordinates from first file
            try:
                with h5py.File(self.h5_files[0], 'r') as h5f:
                    grid = h5f['Grid']
                    lats = grid['lat'][:]
                    lons = grid['lon'][:]
                    
                    # Filter for Chennai bounding box
                    lon_mask = (lons >= CHENNAI_BBOX["min_lon"]) & (lons <= CHENNAI_BBOX["max_lon"])
                    lat_mask = (lats >= CHENNAI_BBOX["min_lat"]) & (lats <= CHENNAI_BBOX["max_lat"])
                    
                    self.lon_indices = np.where(lon_mask)[0]
                    self.lat_indices = np.where(lat_mask)[0]
                    self.grid_lons = lons[self.lon_indices]
                    self.grid_lats = lats[self.lat_indices]
                    
                logger.info(f"Initialized Chennai IMERG grid: {len(self.grid_lons)} lon cells x {len(self.grid_lats)} lat cells.")
            except Exception as e:
                logger.error(f"Error reading IMERG grid coordinate indices: {e}", exc_info=True)

    @staticmethod
    def parse_filename_timestamp(filename: str) -> str:
        """Parses UTC datetime from IMERG standard filename format, e.g. 3B-HHR-E.MS.MRG.3IMERG.20260817-S113000-E115959..."""
        base = os.path.basename(filename)
        try:
            parts = base.split('.')
            for p in parts:
                if len(p) >= 15 and '-' in p and p.startswith('20'):
                    # format: 20260817-S113000-E115959
                    dt_part = p.split('-')[0]
                    time_part = p.split('-')[1].replace('S', '')
                    dt = datetime.datetime.strptime(f"{dt_part}{time_part}", "%Y%m%d%H%M%S")
                    return dt.isoformat() + "Z"
        except Exception:
            pass
        return datetime.datetime.utcnow().isoformat() + "Z"

    def process_rainfall(self) -> Dict[str, Any]:
        """Reads latest files, computes current intensity, 24h accumulation and time series."""
        if not self.h5_files:
            return {
                "status": "no_data",
                "message": "No IMERG HDF5 files available."
            }

        # Analyze the latest 48 files (24 hours of 30-min intervals)
        recent_files = self.h5_files[-48:] if len(self.h5_files) >= 48 else self.h5_files
        timeseries = []
        accumulation_grid = np.zeros((len(self.grid_lons), len(self.grid_lats)), dtype=np.float32)
        latest_grid = None
        latest_ts = ""

        for file_idx, fpath in enumerate(recent_files):
            try:
                with h5py.File(fpath, 'r') as h5f:
                    grid = h5f['Grid']
                    # Extract the exact precipitation variable
                    precip_ds = grid.get('precipitation', grid.get('precipitationCal'))
                    if precip_ds is None:
                        continue
                    
                    raw_slice = precip_ds[
                        0, 
                        self.lon_indices.min():self.lon_indices.max() + 1, 
                        self.lat_indices.min():self.lat_indices.max() + 1
                    ]
                    
                    # Clean fill values (< 0)
                    clean_slice = np.where(raw_slice < 0, 0.0, raw_slice)
                    
                    # 30-min accumulation = rate (mm/hr) * 0.5 hr
                    accumulation_grid += clean_slice * 0.5
                    
                    ts = self.parse_filename_timestamp(fpath)
                    mean_rate = float(np.mean(clean_slice))
                    max_rate = float(np.max(clean_slice))
                    min_rate = float(np.min(clean_slice))
                    active_cells = int(np.sum(clean_slice > 0.1))
                    
                    timeseries.append({
                        "timestamp": ts,
                        "file_name": str(os.path.basename(fpath)),
                        "mean_rate_mm_hr": round(float(mean_rate), 3),
                        "max_rate_mm_hr": round(float(max_rate), 3),
                        "min_rate_mm_hr": round(float(min_rate), 3),
                        "active_precip_cells": int(active_cells)
                    })
                    
                    if file_idx == len(recent_files) - 1:
                        latest_grid = clean_slice
                        latest_ts = ts
            except Exception as e:
                logger.warning(f"Error reading IMERG file {fpath}: {e}")

        # Construct spatial GeoJSON grid of rainfall cells
        features = []
        cell_size = 0.1 # 0.1 degree grid resolution
        half = cell_size / 2.0
        
        for i, lon in enumerate(self.grid_lons):
            lon_val = float(lon)
            for j, lat in enumerate(self.grid_lats):
                lat_val = float(lat)
                rate = float(latest_grid[i, j]) if latest_grid is not None else 0.0
                accum = float(accumulation_grid[i, j])
                
                # Polygon cell boundary with pure Python floats
                poly_coords = [[
                    [float(round(lon_val - half, 4)), float(round(lat_val - half, 4))],
                    [float(round(lon_val + half, 4)), float(round(lat_val - half, 4))],
                    [float(round(lon_val + half, 4)), float(round(lat_val + half, 4))],
                    [float(round(lon_val - half, 4)), float(round(lat_val + half, 4))],
                    [float(round(lon_val - half, 4)), float(round(lat_val - half, 4))]
                ]]
                
                # Risk label based on precipitation intensity
                if rate >= 20.0 or accum >= 70.0:
                    intensity_level = "TORRENTIAL"
                elif rate >= 10.0 or accum >= 35.0:
                    intensity_level = "HEAVY"
                elif rate >= 2.5 or accum >= 10.0:
                    intensity_level = "MODERATE"
                elif rate > 0.1 or accum > 1.0:
                    intensity_level = "LIGHT"
                else:
                    intensity_level = "NONE"
                    
                features.append({
                    "type": "Feature",
                    "id": f"cell_{i}_{j}",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": poly_coords
                    },
                    "properties": {
                        "center_lon": float(round(lon_val, 4)),
                        "center_lat": float(round(lat_val, 4)),
                        "current_rate_mm_hr": float(round(rate, 3)),
                        "accum_24h_mm": float(round(accum, 2)),
                        "intensity_level": str(intensity_level)
                    }
                })

        grid_geojson = {
            "type": "FeatureCollection",
            "features": features
        }

        latest_mean = float(np.mean(latest_grid)) if latest_grid is not None else 0.0
        latest_max = float(np.max(latest_grid)) if latest_grid is not None else 0.0
        max_accum = float(np.max(accumulation_grid))
        mean_accum = float(np.mean(accumulation_grid))
        active_count = int(np.sum(latest_grid > 0.1)) if latest_grid is not None else 0

        result = {
            "status": "success",
            "dataset_name": "NASA GPM IMERG V07 Early Run (GPM_3IMERGHHE)",
            "variable_name": "Grid/precipitation",
            "units": "mm/hr",
            "total_files_available": int(len(self.h5_files)),
            "latest_timestamp": str(latest_ts),
            "spatial_extent": {k: float(v) for k, v in CHENNAI_BBOX.items()},
            "latest_metrics": {
                "mean_rate_mm_hr": float(round(latest_mean, 3)),
                "peak_rate_mm_hr": float(round(latest_max, 3)),
                "active_storm_cells": int(active_count)
            },
            "accumulation_summary": {
                "observation_window_hours": float(len(recent_files) * 0.5),
                "mean_accumulation_mm": float(round(mean_accum, 2)),
                "max_accumulation_mm": float(round(max_accum, 2))
            },
            "recent_trend": timeseries,
            "grid_geojson": grid_geojson
        }

        self.cached_latest = result
        return result
