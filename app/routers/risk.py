"""
Transparent Flood Risk Scoring and Inundation Vulnerability Router.
"""
from fastapi import APIRouter, Query
from typing import Optional
from app.core.risk_engine import RiskEngine

router = APIRouter(prefix="/api", tags=["Flood Risk Intelligence"])

@router.get("/risk", summary="Get Transparent Multi-Criteria Flood Risk Layer")
def get_risk(
    risk_level: Optional[str] = Query(None, description="Filter by risk category: LOW, MEDIUM, HIGH, VERY HIGH"),
    zone: Optional[str] = Query(None, description="Filter by GCC Zone (e.g. N01, N02)"),
    min_score: Optional[float] = Query(None, description="Filter by minimum composite risk score (0-100)"),
    force_recompute: Optional[bool] = Query(False, description="Force fresh recalculation across all features")
):
    """
    Returns the deterministic, transparent baseline flood risk scoring system.
    
    Features analyzed:
    - NASA IMERG satellite rainfall rate and 24h accumulation
    - GCC Storm Water Drain capacity, physical condition, and blockage/obstacles
    - Distance to OpenStreetMap waterways (rivers, canals) and water bodies
    - Urban density & surface impermeability
    - Upstream reservoir capacity and water level stress
    
    Produces risk categories:
    - LOW (0 - 24.9)
    - MEDIUM (25 - 49.9)
    - HIGH (50 - 74.9)
    - VERY HIGH (75 - 100)
    """
    engine = RiskEngine.get_instance()
    summary = engine.compute_risk(force_recompute=force_recompute)

    if summary.get("status") != "success":
        return summary

    # If filters applied, filter the GeoJSON features
    if risk_level or zone or min_score is not None:
        features = summary["geojson"]["features"]
        filtered_features = []

        for f in features:
            props = f.get("properties", {})
            if risk_level and props.get("risk_level", "").upper() != risk_level.upper():
                continue
            if zone and props.get("zone", "").upper() != zone.upper():
                continue
            if min_score is not None and props.get("composite_risk_score", 0.0) < min_score:
                continue
            filtered_features.append(f)

        filtered_summary = dict(summary)
        filtered_summary["total_zones_evaluated"] = len(filtered_features)
        filtered_summary["geojson"] = {
            "type": "FeatureCollection",
            "features": filtered_features
        }
        return filtered_summary

    return summary
