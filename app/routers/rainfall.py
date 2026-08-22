"""
NASA GPM IMERG Satellite Rainfall Intelligence Router.
Reads real HDF5 precipitation rate datasets ('Grid/precipitation') and serves telemetry and grids.
"""
from fastapi import APIRouter, Query
from app.core.rainfall_processor import RainfallProcessor

router = APIRouter(prefix="/api", tags=["Rainfall Intelligence"])

@router.get("/rainfall", summary="Get NASA GPM IMERG Rainfall and Radar Intelligence")
def get_rainfall(
    include_grid: bool = Query(True, description="Whether to include spatial GeoJSON grid features")
):
    """
    Reads the actual NASA GPM IMERG V07 satellite files (GPM_3IMERGHHE product).
    Extracts the 'Grid/precipitation' variable (mm/hr), computes Chennai regional accumulation,
    returns time-series telemetry, and provides a 0.1-degree spatial GeoJSON grid.
    """
    processor = RainfallProcessor.get_instance()
    data = processor.process_rainfall()

    if not include_grid and "grid_geojson" in data:
        resp = dict(data)
        resp["grid_geojson"] = {"type": "FeatureCollection", "features": []}
        return resp

    return data
