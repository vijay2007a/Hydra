"""
System Analytics and Aggregated Statistics Router.
"""
from fastapi import APIRouter
import datetime
from app.core.data_loader import DataLoader
from app.core.rainfall_processor import RainfallProcessor
from app.core.risk_engine import RiskEngine

router = APIRouter(prefix="/api", tags=["Analytics & Statistics"])

@router.get("/statistics", summary="Get Aggregated System Statistics")
def get_statistics():
    """
    Returns aggregated system analytics across all modules:
    - GCC Storm Water Drain infrastructure breakdown
    - NASA IMERG satellite rainfall telemetry summary
    - Chennai reservoir network capacity and level summary
    - Baseline flood risk distribution and hotspot counts
    """
    loader = DataLoader.get_instance()
    rainfall_proc = RainfallProcessor.get_instance()
    risk_engine = RiskEngine.get_instance()

    gdf_drains = loader.drains_gdf
    df_res = loader.reservoirs_df
    rainfall_data = rainfall_proc.process_rainfall()
    risk_data = risk_engine.compute_risk()

    # Drains stats
    total_drains = len(gdf_drains) if gdf_drains is not None else 0
    total_length_km = round(float(gdf_drains['dlen_km'].sum()), 2) if gdf_drains is not None else 0.0
    status_counts = gdf_drains['status'].value_counts().to_dict() if gdf_drains is not None else {}
    obstacle_count = int((~gdf_drains['obstacles'].isin(['', '0', 'N/A', 'nan', ' ', 'None', 'none'])).sum()) if gdf_drains is not None else 0
    obstacle_pct = round((obstacle_count / total_drains) * 100.0, 1) if total_drains > 0 else 0.0

    # Reservoir stats
    total_cap = round(float(df_res['Capacity'].sum()), 2) if df_res is not None else 0.0
    total_lvl = round(float(df_res['Water Level'].sum()), 2) if df_res is not None else 0.0
    avg_fill_pct = round((total_lvl / total_cap) * 100.0, 1) if total_cap > 0 else 0.0

    # Risk stats
    risk_dist = risk_data.get("risk_distribution", {})
    risk_pct = risk_data.get("risk_percentages", {})
    mean_score = risk_data.get("mean_risk_score", 0.0)
    hotspots = risk_data.get("high_priority_hotspots_count", 0)

    # Live Weather stats
    from app.core.weather_service import WeatherService
    weather_svc = WeatherService.get_instance()
    weather_summary = {}
    try:
        w_data = weather_svc.get_weather()
        weather_summary = {
            "source": "Open-Meteo",
            "condition": w_data.get("current", {}).get("weather_condition"),
            "temperature_celsius": w_data.get("current", {}).get("temperature_celsius"),
            "relative_humidity_pct": w_data.get("current", {}).get("relative_humidity_pct"),
            "precipitation_mm": w_data.get("current", {}).get("precipitation_mm"),
            "wind_speed_kmh": w_data.get("current", {}).get("wind_speed_kmh"),
            "surface_pressure_hpa": w_data.get("current", {}).get("surface_pressure_hpa")
        }
    except Exception:
        weather_summary = {"status": "unavailable"}

    return {
        "status": "success",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "storm_water_drains": {
            "total_segments_count": total_drains,
            "total_network_length_km": total_length_km,
            "condition_distribution": status_counts,
            "segments_with_obstacles": obstacle_count,
            "obstacle_frequency_pct": obstacle_pct
        },
        "rainfall_monitoring": {
            "satellite_product": rainfall_data.get("dataset_name", "NASA GPM IMERG V07"),
            "variable": rainfall_data.get("variable_name", "Grid/precipitation"),
            "total_observation_files": rainfall_data.get("total_files_available", 0),
            "latest_peak_rate_mm_hr": rainfall_data.get("latest_metrics", {}).get("peak_rate_mm_hr", 0.0),
            "mean_accumulation_24h_mm": rainfall_data.get("accumulation_summary", {}).get("mean_accumulation_mm", 0.0),
            "max_accumulation_24h_mm": rainfall_data.get("accumulation_summary", {}).get("max_accumulation_mm", 0.0)
        },
        "live_weather": weather_summary,
        "reservoir_system": {
            "monitored_reservoirs_count": len(df_res) if df_res is not None else 0,
            "total_storage_capacity_mcft": total_cap,
            "current_water_level_mcft": total_lvl,
            "average_capacity_filled_pct": avg_fill_pct,
            "stress_index": "NORMAL" if avg_fill_pct < 60.0 else ("WATCH" if avg_fill_pct < 80.0 else "CRITICAL")
        },
        "flood_vulnerability": {
            "total_segments_evaluated": total_drains,
            "mean_risk_score": mean_score,
            "risk_distribution": risk_dist,
            "risk_percentages": risk_pct,
            "high_priority_hotspots": hotspots
        },
        "spatial_coverage": {
            "region": "Greater Chennai Corporation (GCC) & Chennai Metropolitan Area",
            "bounding_box": {
                "min_longitude": 79.8,
                "max_longitude": 80.45,
                "min_latitude": 12.8,
                "max_latitude": 13.4
            },
            "crs": "EPSG:4326 (WGS84)"
        }
    }

