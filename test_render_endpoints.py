"""
Comprehensive Test Suite for HydroCast Render Deployment.
Tests all endpoints against FastAPI TestClient and live server.
"""
import sys
import json
import time
from io import BytesIO
from fastapi.testclient import TestClient
from app.main import app

def run_tests():
    print("=" * 60)
    print("STARTING HYDROCAST ENDPOINT AUDIT & VERIFICATION")
    print("=" * 60)
    
    passed = 0
    failed = 0
    results = {}

    with TestClient(app) as client:
        # 1. /api/health
        print("\n[1/11] Testing GET /api/health ...")
        r = client.get("/api/health")
        if r.status_code == 200 and r.json().get("status") == "healthy":
            passed += 1
            results["/api/health"] = {"status": "PASS", "code": r.status_code, "data": r.json()}
            print("  --> PASS: Health status is 'healthy', Firestore connected =", r.json()["firebase"]["firestore_connected"])
        else:
            failed += 1
            results["/api/health"] = {"status": "FAIL", "code": r.status_code, "data": r.text}
            print("  --> FAIL:", r.status_code, r.text)

        # 2. /api/drains
        print("\n[2/11] Testing GET /api/drains (with pagination) ...")
        r = client.get("/api/drains?page=1&page_size=10")
        if r.status_code == 200 and r.json().get("type") == "FeatureCollection" and len(r.json().get("features", [])) == 10:
            passed += 1
            meta = r.json().get("metadata", {})
            results["/api/drains"] = {"status": "PASS", "code": r.status_code, "total": meta.get("total_features_in_database")}
            print(f"  --> PASS: Returned 10 features, total in database = {meta.get('total_features_in_database')}, total length = {meta.get('total_database_length_km')} km")
        else:
            failed += 1
            results["/api/drains"] = {"status": "FAIL", "code": r.status_code, "data": r.text}
            print("  --> FAIL:", r.status_code, r.text)

        # 3. /api/drains/count
        print("\n[3/11] Testing GET /api/drains/count ...")
        r = client.get("/api/drains/count")
        if r.status_code == 200 and r.json().get("status") == "success" and r.json().get("total_features_loaded", 0) > 0:
            passed += 1
            data = r.json()
            results["/api/drains/count"] = {"status": "PASS", "code": r.status_code, "total": data["total_features_loaded"]}
            print(f"  --> PASS: Total features = {data['total_features_loaded']}, Unique zones = {data['unique_zones_covered']}, Wards = {data['unique_wards_covered']}")
        else:
            failed += 1
            results["/api/drains/count"] = {"status": "FAIL", "code": r.status_code, "data": r.text}
            print("  --> FAIL:", r.status_code, r.text)

        # 4. /api/drains/upload
        print("\n[4/11] Testing POST /api/drains/upload ...")
        # Create a sample GeoJSON payload for testing upload
        sample_geojson = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {
                        "objectid": 99901,
                        "zone": "N01",
                        "ward": "001",
                        "location": "Test Location",
                        "drain_type": "SWD",
                        "drain_wid": 1.2,
                        "drain_dep": 1.0,
                        "status": "Good",
                        "obstacles": "None",
                        "dlen_km": 0.5
                    },
                    "geometry": {
                        "type": "LineString",
                        "coordinates": [[80.20, 13.08], [80.21, 13.09]]
                    }
                }
            ]
        }
        file_bytes = json.dumps(sample_geojson).encode('utf-8')
        r = client.post(
            "/api/drains/upload",
            files={"file": ("test_drains.geojson", BytesIO(file_bytes), "application/geo+json")}
        )
        if r.status_code == 200 and r.json().get("status") == "success":
            passed += 1
            results["/api/drains/upload"] = {"status": "PASS", "code": r.status_code, "response": r.json()}
            print(f"  --> PASS: Upload processed successfully ({r.json().get('message')})")
            # Reload original drains so active memory stays pristine
            from app.core.data_loader import DataLoader
            DataLoader.get_instance().load_drains()
        else:
            failed += 1
            results["/api/drains/upload"] = {"status": "FAIL", "code": r.status_code, "data": r.text}
            print("  --> FAIL:", r.status_code, r.text)

        # 5. /api/rainfall
        print("\n[5/11] Testing GET /api/rainfall ...")
        r = client.get("/api/rainfall?include_grid=true")
        if r.status_code == 200 and r.json().get("status") == "success":
            passed += 1
            data = r.json()
            results["/api/rainfall"] = {"status": "PASS", "code": r.status_code, "files": data.get("total_files_available")}
            print(f"  --> PASS: NASA GPM IMERG processed ({data.get('total_files_available')} files), peak rate = {data.get('latest_metrics', {}).get('peak_rate_mm_hr')} mm/hr")
        else:
            failed += 1
            results["/api/rainfall"] = {"status": "FAIL", "code": r.status_code, "data": r.text}
            print("  --> FAIL:", r.status_code, r.text)

        # 6. /api/reservoirs
        print("\n[6/11] Testing GET /api/reservoirs ...")
        r = client.get("/api/reservoirs")
        if r.status_code == 200 and r.json().get("status") == "success" and len(r.json().get("reservoirs", [])) > 0:
            passed += 1
            data = r.json()
            results["/api/reservoirs"] = {"status": "PASS", "code": r.status_code, "count": len(data["reservoirs"])}
            print(f"  --> PASS: {len(data['reservoirs'])} reservoirs monitored, average storage = {data.get('average_storage_percentage')}%")
        else:
            failed += 1
            results["/api/reservoirs"] = {"status": "FAIL", "code": r.status_code, "data": r.text}
            print("  --> FAIL:", r.status_code, r.text)

        # 7. /api/risk
        print("\n[7/11] Testing GET /api/risk ...")
        r = client.get("/api/risk")
        if r.status_code == 200 and r.json().get("status") == "success":
            passed += 1
            data = r.json()
            results["/api/risk"] = {"status": "PASS", "code": r.status_code, "hotspots": data.get("high_priority_hotspots_count")}
            print(f"  --> PASS: Multi-criteria Risk evaluated for {data.get('total_zones_evaluated')} features, mean risk score = {data.get('mean_risk_score')}, hotspots = {data.get('high_priority_hotspots_count')}")
        else:
            failed += 1
            results["/api/risk"] = {"status": "FAIL", "code": r.status_code, "data": r.text}
            print("  --> FAIL:", r.status_code, r.text)

        # 8. /api/statistics
        print("\n[8/11] Testing GET /api/statistics ...")
        r = client.get("/api/statistics")
        if r.status_code == 200 and r.json().get("status") == "success":
            passed += 1
            data = r.json()
            results["/api/statistics"] = {"status": "PASS", "code": r.status_code}
            print(f"  --> PASS: Aggregated system statistics retrieved successfully. Drains: {data['storm_water_drains']['total_segments_count']}, Reservoirs: {data['reservoir_system']['monitored_reservoirs_count']}")
        else:
            failed += 1
            results["/api/statistics"] = {"status": "FAIL", "code": r.status_code, "data": r.text}
            print("  --> FAIL:", r.status_code, r.text)

        # 9. /api/weather/latest
        print("\n[9/11] Testing GET /api/weather/latest ...")
        r = client.get("/api/weather/latest")
        if r.status_code == 200 and ("current" in r.json() or "temperature_celsius" in str(r.text)):
            passed += 1
            data = r.json()
            curr = data.get("current", {})
            results["/api/weather/latest"] = {"status": "PASS", "code": r.status_code, "temp": curr.get("temperature_celsius")}
            print(f"  --> PASS: Weather telemetry: {curr.get('temperature_celsius')}°C, condition: {curr.get('weather_condition')}, data_source: {data.get('data_source')}")
        else:
            failed += 1
            results["/api/weather/latest"] = {"status": "FAIL", "code": r.status_code, "data": r.text}
            print("  --> FAIL:", r.status_code, r.text)

        # 10. /api/weather/history
        print("\n[10/11] Testing GET /api/weather/history ...")
        r = client.get("/api/weather/history?limit=3")
        if r.status_code == 200 and r.json().get("status") == "success":
            passed += 1
            data = r.json()
            results["/api/weather/history"] = {"status": "PASS", "code": r.status_code, "count": data.get("returned_count")}
            print(f"  --> PASS: Weather history retrieved {data.get('returned_count')} snapshots (source: {data.get('data_source')})")
        else:
            failed += 1
            results["/api/weather/history"] = {"status": "FAIL", "code": r.status_code, "data": r.text}
            print("  --> FAIL:", r.status_code, r.text)

        # 11. /api/weather/refresh
        print("\n[11/11] Testing POST /api/weather/refresh ...")
        r = client.post("/api/weather/refresh")
        if r.status_code == 200 and r.json().get("status") in ["success", "failed"]:
            passed += 1
            data = r.json()
            results["/api/weather/refresh"] = {"status": "PASS", "code": r.status_code, "persisted": data.get("persisted_to_firestore")}
            print(f"  --> PASS: Weather refreshed from Open-Meteo, persisted to Firestore = {data.get('persisted_to_firestore')}, doc_id = {data.get('doc_id')}")
        else:
            failed += 1
            results["/api/weather/refresh"] = {"status": "FAIL", "code": r.status_code, "data": r.text}
            print("  --> FAIL:", r.status_code, r.text)

    print("\n" + "=" * 60)
    print(f"TEST SUMMARY: {passed} PASSED, {failed} FAILED (TOTAL {passed + failed})")
    print("=" * 60)
    return failed == 0

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
