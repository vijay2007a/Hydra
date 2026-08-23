"""
Open-Meteo Weather Service and Firestore Snapshot Persistence.
Fetches real meteorological telemetry for Chennai and synchronizes with Firestore.
"""
import logging
import datetime
import urllib.request
import json
from typing import Dict, Any, List, Optional, Tuple
from google.cloud import firestore

from app.config import (
    FIRESTORE_WEATHER_COLLECTION, 
    CHENNAI_WEATHER_COORDS, 
    WEATHER_REFRESH_MINUTES
)
from app.core.firebase import FirebaseManager

logger = logging.getLogger("hydrocast.weather")

WMO_WEATHER_CODES = {
    0: "Clear Sky",
    1: "Mainly Clear",
    2: "Partly Cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing Rime Fog",
    51: "Light Drizzle",
    53: "Moderate Drizzle",
    55: "Dense Drizzle",
    56: "Light Freezing Drizzle",
    57: "Dense Freezing Drizzle",
    61: "Slight Rain",
    63: "Moderate Rain",
    65: "Heavy Rain",
    66: "Light Freezing Rain",
    67: "Heavy Freezing Rain",
    71: "Slight Snow",
    73: "Moderate Snow",
    75: "Heavy Snow",
    77: "Snow Grains",
    80: "Slight Rain Showers",
    81: "Moderate Rain Showers",
    82: "Violent Rain Showers",
    85: "Slight Snow Showers",
    86: "Heavy Snow Showers",
    95: "Thunderstorm",
    96: "Thunderstorm with Slight Hail",
    99: "Thunderstorm with Heavy Hail"
}

class WeatherService:
    _instance = None

    def __init__(self):
        self.firebase = FirebaseManager.get_instance()
        self.cached_local_snapshot: Optional[Dict[str, Any]] = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = WeatherService()
        return cls._instance

    def fetch_open_meteo_live(self) -> Dict[str, Any]:
        """Fetches real current, hourly, and daily weather data from Open-Meteo for Chennai."""
        lat = CHENNAI_WEATHER_COORDS["latitude"]
        lon = CHENNAI_WEATHER_COORDS["longitude"]
        
        url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={lat}&longitude={lon}&"
            f"current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&"
            f"hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,rain&"
            f"daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&"
            f"timezone=Asia%2FKolkata"
        )
        
        logger.info(f"Fetching real weather telemetry from Open-Meteo API for Chennai ({lat}, {lon})...")
        req = urllib.request.Request(url, headers={"User-Agent": "HydroCastFloodPlatform/1.0"})
        with urllib.request.urlopen(req, timeout=12) as resp:
            raw_data = json.loads(resp.read().decode('utf-8'))

        now_utc = datetime.datetime.now(datetime.timezone.utc)
        current = raw_data.get("current", {})
        hourly = raw_data.get("hourly", {})
        daily = raw_data.get("daily", {})
        wcode = current.get("weather_code", 0)

        # Parse next 24 hours forecast
        hourly_forecast = []
        if "time" in hourly:
            times = hourly.get("time", [])
            precips = hourly.get("precipitation", [])
            probs = hourly.get("precipitation_probability", [])
            temps = hourly.get("temperature_2m", [])
            hums = hourly.get("relative_humidity_2m", [])
            for i in range(min(24, len(times))):
                hourly_forecast.append({
                    "time": times[i],
                    "precipitation_mm": float(precips[i]) if i < len(precips) else 0.0,
                    "precipitation_probability_pct": int(probs[i]) if i < len(probs) else 0,
                    "temperature_c": float(temps[i]) if i < len(temps) else 0.0,
                    "relative_humidity_pct": int(hums[i]) if i < len(hums) else 0
                })

        # Parse daily forecast
        daily_forecast = []
        if "time" in daily:
            d_times = daily.get("time", [])
            d_codes = daily.get("weather_code", [])
            d_tmax = daily.get("temperature_2m_max", [])
            d_tmin = daily.get("temperature_2m_min", [])
            d_precip = daily.get("precipitation_sum", [])
            d_prob = daily.get("precipitation_probability_max", [])
            for i in range(len(d_times)):
                code_i = d_codes[i] if i < len(d_codes) else 0
                daily_forecast.append({
                    "date": d_times[i],
                    "weather_code": int(code_i),
                    "condition": WMO_WEATHER_CODES.get(code_i, "Unknown"),
                    "temperature_max_c": float(d_tmax[i]) if i < len(d_tmax) else 0.0,
                    "temperature_min_c": float(d_tmin[i]) if i < len(d_tmin) else 0.0,
                    "precipitation_sum_mm": float(d_precip[i]) if i < len(d_precip) else 0.0,
                    "precipitation_probability_pct": int(d_prob[i]) if i < len(d_prob) else 0
                })

        temp_val = float(current.get("temperature_2m", 0.0))
        condition_str = WMO_WEATHER_CODES.get(wcode, "Unknown")
        is_connected = self.firebase.is_connected()

        snapshot = {
            "source": "Open-Meteo Global Meteorological Model",
            "location": CHENNAI_WEATHER_COORDS,
            "timestamp_local": current.get("time"),
            "created_at_utc": now_utc.isoformat(),
            "created_at_epoch": int(now_utc.timestamp()),
            "current": {
                "time": current.get("time"),
                "temperature_c": temp_val,
                "temperature_celsius": temp_val,
                "apparent_temperature_c": float(current.get("apparent_temperature", 0.0)),
                "relative_humidity_pct": int(current.get("relative_humidity_2m", 0)),
                "precipitation_mm": float(current.get("precipitation", 0.0)),
                "rain_mm": float(current.get("rain", 0.0)),
                "showers_mm": float(current.get("showers", 0.0)),
                "weather_code": int(wcode),
                "weather_condition": condition_str,
                "cloud_cover_pct": int(current.get("cloud_cover", 0)),
                "pressure_hpa": float(current.get("pressure_msl", 1013.25)),
                "surface_pressure_hpa": float(current.get("surface_pressure", 1013.0)),
                "wind_speed_kmh": float(current.get("wind_speed_10m", 0.0)),
                "wind_direction_deg": int(current.get("wind_direction_10m", 0)),
                "wind_gusts_kmh": float(current.get("wind_gusts_10m", 0.0)),
                "is_day": bool(current.get("is_day", 1))
            },
            "hourly_forecast": hourly_forecast,
            "daily_forecast": daily_forecast,
            "elevation_meters": float(raw_data.get("elevation", 7.0)),
            "firebase_sync": {
                "firestore_connected": is_connected,
                "is_cached": False,
                "cached_at_epoch": int(now_utc.timestamp()),
                "collection": FIRESTORE_WEATHER_COLLECTION
            }
        }

        self.cached_local_snapshot = snapshot
        return snapshot

    def save_snapshot_to_firestore(self, snapshot: Dict[str, Any]) -> Tuple[bool, str]:
        """Saves a weather snapshot document to the Firestore weather_snapshots collection."""
        db = self.firebase.get_firestore()
        if db is None:
            logger.warning("Firestore client not available to persist weather snapshot.")
            return False, "Firestore not connected"

        try:
            doc_id = f"chennai_{int(datetime.datetime.now(datetime.timezone.utc).timestamp())}"
            coll_ref = db.collection(FIRESTORE_WEATHER_COLLECTION)
            coll_ref.document(doc_id).set(snapshot)
            logger.info(f"Persisted weather snapshot to Firestore collection '{FIRESTORE_WEATHER_COLLECTION}' (doc ID: {doc_id}).")
            return True, doc_id
        except Exception as e:
            logger.error(f"Error saving snapshot to Firestore: {e}")
            return False, str(e)

    def get_latest_weather(self, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Retrieves the latest weather snapshot.
        Checks Firestore first. If missing or force_refresh is requested,
        fetches from Open-Meteo, saves to Firestore, and returns.
        """
        db = self.firebase.get_firestore()

        # If not forcing refresh and Firestore is available, try fetching latest document from Firestore
        if db is not None and not force_refresh:
            try:
                coll_ref = db.collection(FIRESTORE_WEATHER_COLLECTION)
                query = coll_ref.order_by("created_at_epoch", direction=firestore.Query.DESCENDING).limit(1)
                docs = list(query.stream())

                if docs:
                    doc = docs[0]
                    data = doc.to_dict()
                    data["doc_id"] = doc.id
                    data["data_source"] = "firestore"
                    if "firebase_sync" not in data:
                        data["firebase_sync"] = {}
                    data["firebase_sync"]["firestore_connected"] = True
                    data["firebase_sync"]["is_cached"] = True
                    data["firebase_sync"]["cached_at_epoch"] = data.get("created_at_epoch")
                    logger.info(f"Loaded latest weather snapshot from Firestore doc '{doc.id}'.")
                    return data
            except Exception as e:
                logger.warning(f"Error querying Firestore for latest snapshot: {e}")

        # Fetch fresh snapshot from Open-Meteo
        snapshot = self.fetch_open_meteo_live()

        # Save to Firestore if connected
        if db is not None:
            success, doc_id = self.save_snapshot_to_firestore(snapshot)
            if success:
                snapshot["doc_id"] = doc_id
                snapshot["data_source"] = "firestore"
                snapshot["firebase_sync"]["firestore_connected"] = True
                snapshot["firebase_sync"]["is_cached"] = False
            else:
                snapshot["data_source"] = "local_fallback"
                snapshot["firestore_sync_error"] = doc_id
        else:
            snapshot["data_source"] = "local_fallback"

        return snapshot

    def get_weather(self, force_refresh: bool = False) -> Dict[str, Any]:
        """Convenience alias for get_latest_weather."""
        return self.get_latest_weather(force_refresh=force_refresh)

    def get_weather_history(self, limit: int = 5) -> Dict[str, Any]:
        """
        Retrieves weather snapshot history from Firestore collection 'weather_snapshots'.
        """
        db = self.firebase.get_firestore()

        if db is not None:
            try:
                coll_ref = db.collection(FIRESTORE_WEATHER_COLLECTION)
                query = coll_ref.order_by("created_at_epoch", direction=firestore.Query.DESCENDING).limit(limit)
                docs = list(query.stream())

                if docs:
                    history = []
                    for doc in docs:
                        d = doc.to_dict()
                        d["doc_id"] = doc.id
                        d["data_source"] = "firestore"
                        history.append(d)

                    return {
                        "status": "success",
                        "data_source": "firestore",
                        "collection": FIRESTORE_WEATHER_COLLECTION,
                        "returned_count": len(history),
                        "history": history
                    }
            except Exception as e:
                logger.warning(f"Error querying Firestore history: {e}")

        # Fallback to current snapshot in history if Firestore is empty/unavailable
        latest = self.cached_local_snapshot or self.fetch_open_meteo_live()
        return {
            "status": "success",
            "data_source": "local_fallback",
            "collection": FIRESTORE_WEATHER_COLLECTION,
            "returned_count": 1,
            "history": [latest]
        }

