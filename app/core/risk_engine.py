"""
Transparent Baseline Flood-Risk Scoring Engine for HydroCast.
Deterministically computes multi-criteria Hydrological Flood Vulnerability Index (HFVI)
using real available features without unverified supervised ML claims.
"""
import json
import logging
from typing import Dict, Any, Optional
import numpy as np
import pandas as pd
import geopandas as gpd

from app.core.data_loader import DataLoader
from app.core.rainfall_processor import RainfallProcessor
from app.core.spatial import compute_distances_to_hydro
from app.config import WGS84

logger = logging.getLogger("hydrocast.risk")

class RiskEngine:
    _instance = None

    def __init__(self):
        self.cached_risk_geojson: Optional[Dict[str, Any]] = None
        self.cached_risk_summary: Optional[Dict[str, Any]] = None
        self.dist_waterways: Optional[pd.Series] = None
        self.dist_waterbodies: Optional[pd.Series] = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = RiskEngine()
        return cls._instance

    def precalculate_spatial_indices(self):
        """Calculates distance indices once and caches them."""
        loader = DataLoader.get_instance()
        if loader.drains_gdf is not None and loader.waterways_gdf is not None:
            logger.info("Precomputing metric distances from drains to OSM waterways and water bodies...")
            dist_ww, dist_wb = compute_distances_to_hydro(
                loader.drains_gdf, 
                loader.waterways_gdf, 
                loader.waterbodies_gdf
            )
            self.dist_waterways = dist_ww
            self.dist_waterbodies = dist_wb
            logger.info("Spatial distances computed successfully.")

    def compute_risk(self, force_recompute: bool = False) -> Dict[str, Any]:
        """
        Computes the Transparent Multi-Criteria Flood Risk Index across all GCC drain features.
        
        Formula:
          FRIS = 0.30 * S_rain + 0.25 * S_drain + 0.20 * S_hydro + 0.15 * S_urban + 0.10 * S_res
        
        Risk Categories:
          - LOW:       0 <= FRIS < 25
          - MEDIUM:   25 <= FRIS < 50
          - HIGH:     50 <= FRIS < 75
          - VERY HIGH: 75 <= FRIS <= 100
        """
        if self.cached_risk_geojson is not None and not force_recompute:
            return self.cached_risk_summary

        loader = DataLoader.get_instance()
        if loader.drains_gdf is None or len(loader.drains_gdf) == 0:
            return {"status": "error", "message": "GCC Drainage dataset is not loaded."}

        if self.dist_waterways is None:
            self.precalculate_spatial_indices()

        rainfall_proc = RainfallProcessor.get_instance()
        rainfall_data = rainfall_proc.process_rainfall()
        
        # 1. Rainfall & Meteorological Forcing Sub-score (S_rain in [0, 100])
        latest_m = rainfall_data.get("latest_metrics", {})
        accum_m = rainfall_data.get("accumulation_summary", {})
        r_rate = latest_m.get("peak_rate_mm_hr", 12.0)
        r_accum = accum_m.get("max_accumulation_mm", 45.0)
        
        # Ingest live Open-Meteo weather forcing
        from app.core.weather_service import WeatherService
        live_w = None
        try:
            live_w = WeatherService.get_instance().get_weather()
        except Exception:
            pass

        if live_w and "current" in live_w:
            live_precip = float(live_w["current"].get("precipitation_mm", 0.0) or 0.0)
            live_humidity = float(live_w["current"].get("relative_humidity_pct", 80.0) or 80.0)
            effective_rate = max(r_rate, live_precip * 3.0)
            humidity_factor = min(1.15, max(0.85, live_humidity / 80.0))
            s_rain = min(100.0, ((effective_rate / 30.0) * 50.0 + (r_accum / 100.0) * 50.0) * humidity_factor)
        else:
            s_rain = min(100.0, (r_rate / 30.0) * 50.0 + (r_accum / 100.0) * 50.0)

        # 2. Reservoir Stress Sub-score (S_res in [0, 100])
        res_df = loader.reservoirs_df
        if res_df is not None and len(res_df) > 0 and 'storage_pct' in res_df.columns:
            s_res = float(res_df['storage_pct'].mean())
        else:
            s_res = 35.0


        # Process each drain feature
        gdf = loader.drains_gdf
        features = []
        scores = []
        levels = []
        risk_counts = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "VERY HIGH": 0}

        for idx, row in gdf.iterrows():
            # Drainage structural vulnerability & blockage
            status_val = str(row.get('status', 'Good')).strip().lower()
            if status_val in ['good', 'pucca']:
                s_status = 15.0
            elif status_val in ['fair', 'moderate', 'average']:
                s_status = 50.0
            elif status_val in ['poor', 'damaged', 'kacha', 'bad']:
                s_status = 85.0
            else:
                s_status = 40.0

            obstacles_val = str(row.get('obstacles', '')).strip()
            has_obstacles = bool(obstacles_val and obstacles_val not in ['0', 'N/A', 'nan', ' ', 'None', 'none'])
            s_obstacles = 30.0 if has_obstacles else 0.0

            water_flow_val = str(row.get('water_flow', 'Yes')).strip().lower()
            flow_penalty = 20.0 if water_flow_val in ['no', 'false', '0', 'blocked'] else 0.0

            # Hydraulic cross-section (drain_wid x drain_dep)
            wid = float(row.get('drain_wid') or 0.86)
            dep = float(row.get('drain_dep') or 0.86)
            area = wid * dep
            s_dim = max(0.0, min(50.0, (1.5 - area) * 35.0))

            s_drain = min(100.0, s_status * 0.4 + s_obstacles + flow_penalty + s_dim * 0.3)

            # Hydrological Proximity Sub-score (S_hydro in [0, 100])
            d_ww = self.dist_waterways.iloc[idx] if self.dist_waterways is not None else 1000.0
            d_wb = self.dist_waterbodies.iloc[idx] if self.dist_waterbodies is not None else 1000.0

            s_ww = 100.0 if d_ww < 100 else (70.0 if d_ww < 500 else (40.0 if d_ww < 1500 else 10.0))
            s_wb = 100.0 if d_wb < 150 else (60.0 if d_wb < 600 else 15.0)
            s_hydro = 0.6 * s_ww + 0.4 * s_wb

            # Urban density & Imperviousness Sub-score
            s_urban = 55.0 # baseline urban exposure

            # Composite Multi-criteria Risk Score
            fris = 0.30 * s_rain + 0.25 * s_drain + 0.20 * s_hydro + 0.15 * s_urban + 0.10 * s_res
            fris = round(max(0.0, min(100.0, fris)), 1)

            # Categorize Risk Level
            if fris < 25.0:
                lvl = "LOW"
                action = "Standard routine surveillance; storm drain network clear."
            elif fris < 50.0:
                lvl = "MEDIUM"
                action = "Monitor catchment flow rates and maintain culvert clearances."
            elif fris < 75.0:
                lvl = "HIGH"
                if has_obstacles:
                    action = f"Immediate desiltation required: Clear '{obstacles_val}' and mobilize suction pumps."
                else:
                    action = "Pre-deploy mobile dewatering units and prepare sluice gate adjustments."
            else:
                lvl = "VERY HIGH"
                action = "CRITICAL: Immediate evacuation advisory, barrier deployment, and emergency response activation."

            scores.append(fris)
            levels.append(lvl)
            risk_counts[lvl] = risk_counts.get(lvl, 0) + 1

            # Prepare GeoJSON Feature
            geom = row.geometry.__geo_interface__ if hasattr(row.geometry, '__geo_interface__') else None
            
            features.append({
                "type": "Feature",
                "id": int(row.get('objectid', idx + 1)),
                "geometry": geom,
                "properties": {
                    "objectid": int(row.get('objectid', idx + 1)),
                    "zone": str(row.get('zone', 'N/A')),
                    "ward": str(row.get('ward', 'N/A')),
                    "location": str(row.get('location', 'N/A')),
                    "drain_type": str(row.get('drain_type', 'SWD')),
                    "drain_len": str(row.get('drain_len', '')),
                    "drain_wid": float(wid),
                    "drain_dep": float(dep),
                    "water_flow": str(row.get('water_flow', 'Yes')),
                    "status": str(row.get('status', 'Good')),
                    "obstacles": str(row.get('obstacles', 'None')),
                    "dlen_km": float(row.get('dlen_km', 0.0)),
                    "composite_risk_score": fris,
                    "risk_level": lvl,
                    "factors": {
                        "precipitation_hazard_score": round(s_rain, 1),
                        "drainage_deficit_score": round(s_drain, 1),
                        "hydro_proximity_score": round(s_hydro, 1),
                        "urban_exposure_score": round(s_urban, 1),
                        "reservoir_stress_score": round(s_res, 1)
                    },
                    "mitigation_action": action
                }
            })

        risk_geojson = {
            "type": "FeatureCollection",
            "features": features
        }

        total_zones = len(gdf)
        percentages = {k: round((v / total_zones) * 100.0, 1) for k, v in risk_counts.items()}
        mean_score = round(float(np.mean(scores)), 1) if scores else 0.0
        hotspots = risk_counts.get("HIGH", 0) + risk_counts.get("VERY HIGH", 0)

        summary = {
            "status": "success",
            "scoring_system": "Transparent Baseline Multi-Criteria Hydrological Vulnerability Index (HFVI)",
            "methodology_note": (
                "Deterministic multi-criteria physical and geospatial vulnerability model based on real "
                "IMERG rainfall, GCC SWD capacity, OSM hydro proximity, and reservoir status."
            ),
            "total_zones_evaluated": total_zones,
            "risk_distribution": risk_counts,
            "risk_percentages": percentages,
            "mean_risk_score": mean_score,
            "high_priority_hotspots_count": hotspots,
            "geojson": risk_geojson
        }

        self.cached_risk_geojson = risk_geojson
        self.cached_risk_summary = summary
        return summary
