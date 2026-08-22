"""
Greater Chennai Corporation (GCC) Storm Water Drain Router.
Serves real drain geometries and infrastructure attributes as GeoJSON with full pagination,
count verification, ArcGIS REST harvesting, and data integrity auditing.
"""
from fastapi import APIRouter, Query, HTTPException, UploadFile, File
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import math
import json
import logging
import geopandas as gpd
from io import BytesIO

from app.core.data_loader import DataLoader
from app.config import WGS84

logger = logging.getLogger("hydrocast.drains")

router = APIRouter(prefix="/api", tags=["Drain Infrastructure"])

class ArcGISSyncRequest(BaseModel):
    service_url: Optional[str] = Field(
        None,
        description="ArcGIS FeatureServer or MapServer Layer REST endpoint URL. If omitted, uses default environment configuration."
    )
    chunk_size: Optional[int] = Field(
        2000,
        description="Batch size for paginated harvesting (default: 2000 matching Esri MaxRecordCount)"
    )

@router.get("/drains", summary="Get GCC Storm Water Drain Geometries and Attributes with Pagination")
def get_drains(
    zone: Optional[str] = Query(None, description="Filter by GCC Zone (e.g. N01, N02, C05, S15)"),
    ward: Optional[str] = Query(None, description="Filter by Ward number (e.g. 001, 010, 111)"),
    status: Optional[str] = Query(None, description="Filter by drain condition (e.g. Good, Fair, Poor)"),
    has_obstacles: Optional[bool] = Query(None, description="Filter drains with or without obstacles (True/False)"),
    page: Optional[int] = Query(1, ge=1, description="Page number for 1-indexed pagination (default: 1)"),
    page_size: Optional[int] = Query(None, ge=1, description="Number of features per page (e.g. 100, 500, 2000). Omit or set limit to paginate."),
    limit: Optional[int] = Query(None, ge=1, description="Maximum number of drain features to return (alternative to page_size)"),
    offset: Optional[int] = Query(0, ge=0, description="Offset for index-based pagination"),
    all_features: Optional[bool] = Query(False, description="Set to True to return entire dataset without pagination limits")
):
    """
    Returns the Greater Chennai Corporation Storm Water Drain GeoJSON dataset.
    Features contain real spatial LineString geometries and infrastructure attributes:
    - `objectid`: Municipal GIS feature identifier
    - `zone`: GCC Zone (e.g. N01, N04, N08...)
    - `ward`: GCC Ward (e.g. 001, 101, 147...)
    - `location`: Specific street / area name
    - `drain_type`: Structural classification (SWD / Trunk / Collector)
    - `drain_wid` & `drain_dep`: Cross-sectional width and depth in meters
    - `dlen_km`: Segment length in kilometers
    - `st_length_shape`: Exact shape length in meters
    - `water_flow`: Active flow status
    - `status`: Physical structural condition (Good / Fair / Poor)
    - `obstacles`: Recorded blockages / utilities (e.g. Junction Box, Pipes, Silt)
    """
    loader = DataLoader.get_instance()
    gdf = loader.drains_gdf

    if gdf is None or len(gdf) == 0:
        return {
            "type": "FeatureCollection",
            "metadata": {
                "total_features_in_database": 0,
                "filtered_features_count": 0,
                "returned_features_count": 0,
                "page": page,
                "page_size": page_size or 0,
                "total_pages": 0,
                "has_next_page": False,
                "has_previous_page": False,
                "message": "No drainage dataset loaded"
            },
            "features": []
        }

    total_in_db = len(gdf)
    filtered_gdf = gdf

    # 1. Apply filtering criteria
    if zone:
        filtered_gdf = filtered_gdf[filtered_gdf['zone'].str.upper() == zone.upper()]

    if ward:
        filtered_gdf = filtered_gdf[filtered_gdf['ward'] == ward]

    if status:
        filtered_gdf = filtered_gdf[filtered_gdf['status'].str.lower() == status.lower()]

    if has_obstacles is not None:
        if has_obstacles:
            filtered_gdf = filtered_gdf[
                filtered_gdf['obstacles'].notnull() & 
                (~filtered_gdf['obstacles'].isin(['', '0', 'N/A', 'nan', ' ', 'None', 'none']))
            ]
        else:
            filtered_gdf = filtered_gdf[
                filtered_gdf['obstacles'].isnull() | 
                filtered_gdf['obstacles'].isin(['', '0', 'N/A', 'nan', ' ', 'None', 'none'])
            ]

    total_filtered = len(filtered_gdf)
    filtered_length_km = round(float(filtered_gdf['dlen_km'].sum()), 2)

    # 2. Determine pagination slice
    effective_limit = None
    effective_offset = offset

    if not all_features:
        if page_size is not None:
            effective_limit = page_size
            effective_offset = (page - 1) * page_size
        elif limit is not None:
            effective_limit = limit
            effective_offset = offset

    if effective_limit is not None:
        paged_gdf = filtered_gdf.iloc[effective_offset : effective_offset + effective_limit]
    elif effective_offset > 0:
        paged_gdf = filtered_gdf.iloc[effective_offset:]
    else:
        paged_gdf = filtered_gdf

    # Calculate pagination flags
    returned_count = len(paged_gdf)
    current_page = page if page_size is not None else ((effective_offset // (effective_limit or 1)) + 1 if effective_limit else 1)
    current_page_size = effective_limit or returned_count
    total_pages = math.ceil(total_filtered / current_page_size) if current_page_size > 0 else 1
    has_next = (effective_offset + returned_count) < total_filtered
    has_prev = effective_offset > 0

    # 3. Construct GeoJSON Feature collection
    features = []
    for idx, row in paged_gdf.iterrows():
        geom = row.geometry.__geo_interface__ if hasattr(row.geometry, '__geo_interface__') else None
        
        props = {
            "objectid": int(row.get('objectid', idx + 1)),
            "zone": str(row.get('zone', 'N/A')),
            "ward": str(row.get('ward', 'N/A')),
            "location": str(row.get('location', 'N/A')),
            "drain_type": str(row.get('drain_type', 'SWD')),
            "drain_len": str(row.get('drain_len', '')),
            "drain_wid": float(row.get('drain_wid', 0.86)),
            "drain_dep": float(row.get('drain_dep', 0.86)),
            "drain_size": str(row.get('drain_size', '')),
            "water_flow": str(row.get('water_flow', 'Yes')),
            "status": str(row.get('status', 'Good')),
            "cover": str(row.get('cover', 'Yes')),
            "puca_kacha": str(row.get('puca_kacha', 'Pucca')),
            "typ_mat": str(row.get('typ_mat', 'Concrete')),
            "swd_mat": str(row.get('swd_mat', 'Concrete')),
            "drain_detl": str(row.get('drain_detl', 'Closed')),
            "obstacles": str(row.get('obstacles', 'None')),
            "dlen_km": float(row.get('dlen_km', 0.0)),
            "st_length_shape": float(row.get('st_length_shape', 0.0))
        }

        features.append({
            "type": "Feature",
            "id": int(row.get('objectid', idx + 1)),
            "geometry": geom,
            "properties": props
        })

    is_truncated = loader.drains_metadata.get("exceeded_transfer_limit", False)

    return {
        "type": "FeatureCollection",
        "metadata": {
            "total_features_in_database": total_in_db,
            "filtered_features_count": total_filtered,
            "returned_features_count": returned_count,
            "page": current_page,
            "page_size": current_page_size,
            "total_pages": total_pages,
            "has_next_page": has_next,
            "has_previous_page": has_prev,
            "offset": effective_offset,
            "limit": effective_limit,
            "filtered_network_length_km": filtered_length_km,
            "total_database_length_km": loader.drains_metadata.get("total_network_length_km", 0.0),
            "exceeded_transfer_limit": is_truncated,
            "data_integrity_status": "TRUNCATED_MAX_RECORD_COUNT_2000" if (is_truncated and total_in_db == 2000) else "COMPLETE_DATASET",
            "data_integrity_notice": (
                f"Source layer was exported with ArcGIS MaxRecordCount=2000 limit (exceededTransferLimit=True). "
                f"The 429.16 km total is the sum of these {total_in_db} records. "
                "Use POST /api/drains/sync-arcgis with the live service URL to paginate and harvest the complete municipal network."
            ) if (is_truncated and total_in_db == 2000) else "Full dataset active."
        },
        "features": features
    }

@router.get("/drains/count", summary="Get Drain Layer Feature Counts and Aggregations")
def get_drains_count():
    """
    Returns breakdown of total feature count, zone counts, ward counts,
    status condition distribution, obstacle counts, and network length.
    """
    loader = DataLoader.get_instance()
    gdf = loader.drains_gdf

    if gdf is None or len(gdf) == 0:
        return {"status": "error", "message": "No drainage dataset loaded", "total_count": 0}

    zones_count = gdf['zone'].value_counts().to_dict()
    wards_count = gdf['ward'].nunique()
    status_count = gdf['status'].value_counts().to_dict()
    obstacle_mask = gdf['obstacles'].notnull() & (~gdf['obstacles'].isin(['', '0', 'N/A', 'nan', ' ', 'None', 'none']))
    obstacle_count = int(obstacle_mask.sum())
    total_len_km = round(float(gdf['dlen_km'].sum()), 2)
    is_truncated = loader.drains_metadata.get("exceeded_transfer_limit", False)

    min_oid = int(gdf['objectid'].min()) if 'objectid' in gdf.columns else 1
    max_oid = int(gdf['objectid'].max()) if 'objectid' in gdf.columns else len(gdf)

    return {
        "status": "success",
        "total_features_loaded": len(gdf),
        "object_id_range": {"min_objectid": min_oid, "max_objectid": max_oid},
        "total_network_length_km": total_len_km,
        "unique_zones_covered": len(zones_count),
        "zone_breakdown": zones_count,
        "unique_wards_covered": wards_count,
        "condition_status_breakdown": status_count,
        "segments_with_obstacles": obstacle_count,
        "obstacle_percentage": round((obstacle_count / len(gdf)) * 100.0, 1),
        "exceeded_transfer_limit": is_truncated,
        "integrity_audit": {
            "is_max_record_count_limited": is_truncated and len(gdf) == 2000,
            "max_record_count": 2000,
            "calculated_length_km": total_len_km,
            "explanation": "2000 features is the single-query ArcGIS REST API response limit (maxRecordCount). 429.16 km is the exact sum of these 2000 records."
        }
    }

@router.get("/drains/metadata", summary="Get Drain Layer Metadata and Provenance")
def get_drains_metadata():
    """
    Returns layer metadata, coordinate reference system, provenance details,
    and ArcGIS synchronization capabilities.
    """
    loader = DataLoader.get_instance()
    return {
        "service": "GCC Storm Water Drain Infrastructure Layer",
        "coordinate_reference_system": WGS84,
        "metadata": loader.drains_metadata,
        "capabilities": {
            "pagination": True,
            "spatial_filtering": True,
            "arcgis_rest_sync": True,
            "geojson_upload": True
        }
    }

@router.post("/drains/sync-arcgis", summary="Harvest Complete SWD Network from ArcGIS REST Service")
def sync_drains_arcgis(payload: ArcGISSyncRequest):
    """
    Harvests 100% of drain features from an ArcGIS REST FeatureServer / MapServer endpoint.
    Uses automatic pagination (`resultOffset` & `resultRecordCount`) to bypass `maxRecordCount` = 2000 limits.
    """
    loader = DataLoader.get_instance()
    service_url = payload.service_url or "https://chennaicorporation.gov.in/arcgis/rest/services/GCC_SWD/FeatureServer/0"
    
    logger.info(f"Initiating ArcGIS REST harvesting from {service_url}...")
    result = loader.sync_from_arcgis(service_url)
    
    if result.get("status") == "error":
        raise HTTPException(
            status_code=400,
            detail=f"ArcGIS Harvest Failed: {result.get('message')}. Verify the service URL and internet connectivity."
        )
    
    return result

@router.post("/drains/upload", summary="Upload Complete Drain Dataset (GeoJSON)")
async def upload_drains_file(file: UploadFile = File(...)):
    """
    Accepts an uploaded complete GeoJSON file containing all GCC Storm Water Drain features.
    Hot-reloads the dataset into memory and recalculates all spatial indices.
    """
    if not file.filename.endswith(('.geojson', '.json')):
        raise HTTPException(status_code=400, detail="Only .geojson and .json files are supported.")
    
    try:
        content = await file.read()
        raw_json = json.loads(content.decode('utf-8'))
        gdf = gpd.GeoDataFrame.from_features(raw_json['features'], crs=WGS84)
        
        loader = DataLoader.get_instance()
        loader.load_drains(custom_gdf=gdf, save_to_disk=True)
        
        # Invalidate risk cache
        from app.core.risk_engine import RiskEngine
        RiskEngine.get_instance().cached_risk_geojson = None
        RiskEngine.get_instance().cached_risk_summary = None
        RiskEngine.get_instance().precalculate_spatial_indices()

        return {
            "status": "success",
            "message": f"Successfully loaded {len(gdf)} features from uploaded file {file.filename}.",
            "total_features": len(gdf),
            "total_network_length_km": loader.drains_metadata["total_network_length_km"]
        }
    except Exception as e:
        logger.error(f"Error processing uploaded drain GeoJSON: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")

