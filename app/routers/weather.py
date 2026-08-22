"""
Live Weather Intelligence and Firestore Snapshot Router.
"""
from fastapi import APIRouter, Query
from app.core.weather_service import WeatherService

router = APIRouter(prefix="/api/weather", tags=["Live Weather & Firestore Telemetry"])

@router.get("/latest", summary="Get Latest Weather Snapshot from Firestore")
@router.get("", summary="Get Latest Weather Snapshot")
@router.get("/current", summary="Get Current Weather Snapshot")
def get_latest_weather(
    force_refresh: bool = Query(False, description="Whether to bypass Firestore cache and fetch fresh Open-Meteo data")
):
    """
    Retrieves the latest weather snapshot from the Firestore 'weather_snapshots' collection.
    If no snapshot exists or force_refresh is requested, fetches fresh Open-Meteo telemetry
    and persists it to Firestore.
    """
    service = WeatherService.get_instance()
    return service.get_latest_weather(force_refresh=force_refresh)

@router.get("/history", summary="Get Weather Snapshot History from Firestore")
def get_weather_history(
    limit: int = Query(5, ge=1, le=50, description="Maximum number of historical weather snapshots to retrieve")
):
    """
    Retrieves chronological weather snapshot documents from the Firestore 'weather_snapshots' collection.
    """
    service = WeatherService.get_instance()
    return service.get_weather_history(limit=limit)

@router.post("/refresh", summary="Force Fetch and Save New Snapshot to Firestore")
def refresh_weather():
    """
    Forces an immediate live poll from Open-Meteo and writes a new document to Firestore.
    """
    service = WeatherService.get_instance()
    snapshot = service.fetch_open_meteo_live()
    success, doc_id = service.save_snapshot_to_firestore(snapshot)
    return {
        "status": "success" if success else "failed",
        "persisted_to_firestore": success,
        "doc_id": doc_id if success else None,
        "snapshot": snapshot
    }

