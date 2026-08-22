"""
Chennai Reservoirs Intelligence Router.
Reads real reservoir capacity and water level observation CSVs.
"""
from fastapi import APIRouter
import datetime
from app.core.data_loader import DataLoader

router = APIRouter(prefix="/api", tags=["Reservoirs"])

@router.get("/reservoirs", summary="Get Chennai Reservoir Storage and Water Levels")
def get_reservoirs():
    """
    Returns the real Chennai major reservoir dataset (Poondi, Chembarambakkam, Red Hills, Cholavaram, Thervoy Kandigal).
    
    NOTE: The five current observations are treated as reference/latest operational data,
    not as historical ML training labels.
    """
    loader = DataLoader.get_instance()
    df_res = loader.reservoirs_df

    if df_res is None or len(df_res) == 0:
        return {
            "status": "error",
            "message": "Reservoir datasets not loaded."
        }

    reservoirs_list = []
    geojson_features = []

    total_capacity = float(df_res['Capacity'].sum())
    total_level = float(df_res['Water Level'].sum())
    avg_storage_pct = round((total_level / total_capacity) * 100.0, 1) if total_capacity > 0 else 0.0

    for idx, row in df_res.iterrows():
        name = str(row['category']).strip()
        cap = float(row['Capacity'])
        lvl = float(row['Water Level'])
        pct = float(row['storage_pct'])
        lat = float(row['latitude'])
        lon = float(row['longitude'])
        full_name = str(row['full_name'])
        basin = str(row['basin'])
        status = str(row['status'])

        item = {
            "name": name,
            "full_name": full_name,
            "basin": basin,
            "capacity_mcft": cap,
            "current_level_mcft": lvl,
            "storage_percentage": pct,
            "status": status,
            "latitude": lat,
            "longitude": lon
        }
        reservoirs_list.append(item)

        # GeoJSON Point
        geojson_features.append({
            "type": "Feature",
            "id": f"res_{idx + 1}",
            "geometry": {
                "type": "Point",
                "coordinates": [lon, lat]
            },
            "properties": {
                "name": name,
                "full_name": full_name,
                "basin": basin,
                "capacity_mcft": cap,
                "current_level_mcft": lvl,
                "storage_percentage": pct,
                "status": status
            }
        })

    return {
        "status": "success",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "data_note": "Five current observations treated as latest reference operational data (not historical ML training labels)",
        "total_capacity_mcft": round(total_capacity, 2),
        "total_current_storage_mcft": round(total_level, 2),
        "average_storage_percentage": avg_storage_pct,
        "reservoirs": reservoirs_list,
        "geojson": {
            "type": "FeatureCollection",
            "features": geojson_features
        }
    }
