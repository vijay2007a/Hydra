"""
Pydantic Schemas for API Request and Response Models.
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# Health Schema
class DatasetStatus(BaseModel):
    discovered: bool
    path: Optional[str] = None
    records_count: Optional[int] = None
    details: Optional[Dict[str, Any]] = None

class HealthResponse(BaseModel):
    status: str = Field(..., example="healthy")
    timestamp: str
    version: str = Field(..., example="1.0.0")
    datasets: Dict[str, DatasetStatus]

# GeoJSON Standard Schemas
class GeoJSONFeature(BaseModel):
    type: str = Field("Feature", example="Feature")
    id: Optional[Any] = None
    geometry: Dict[str, Any]
    properties: Dict[str, Any]

class GeoJSONFeatureCollection(BaseModel):
    type: str = Field("FeatureCollection", example="FeatureCollection")
    features: List[GeoJSONFeature]
    metadata: Optional[Dict[str, Any]] = None

# Reservoir Schema
class ReservoirItem(BaseModel):
    name: str = Field(..., example="Chembarambakkam")
    full_name: str
    basin: str
    capacity_mcft: float = Field(..., description="Full reservoir capacity")
    current_level_mcft: float = Field(..., description="Current water storage level")
    storage_percentage: float = Field(..., description="Percentage of reservoir filled")
    status: str = Field(..., example="NORMAL")
    latitude: float
    longitude: float

class ReservoirResponse(BaseModel):
    status: str
    timestamp: str
    data_note: str = Field(
        "Five current observations treated as latest reference operational data (not historical ML training labels)",
        description="Dataset provenance context"
    )
    total_capacity_mcft: float
    total_current_storage_mcft: float
    average_storage_percentage: float
    reservoirs: List[ReservoirItem]
    geojson: GeoJSONFeatureCollection

# Rainfall Schema
class RainfallObservation(BaseModel):
    timestamp: str
    file_name: str
    mean_rate_mm_hr: float
    max_rate_mm_hr: float
    min_rate_mm_hr: float
    active_precip_cells_count: int

class RainfallResponse(BaseModel):
    status: str
    dataset_name: str = Field("NASA GPM IMERG V07 Early Run", description="Satellite sensor product")
    variable_name: str = Field("Grid/precipitation", description="Extracted HDF5 precipitation rate variable (mm/hr)")
    total_files_available: int
    latest_timestamp: str
    spatial_extent: Dict[str, float]
    latest_metrics: Dict[str, Any]
    accumulation_summary: Dict[str, Any]
    recent_trend: List[Dict[str, Any]]
    grid_geojson: GeoJSONFeatureCollection

# Risk Scoring Schema
class RiskFactorBreakdown(BaseModel):
    precipitation_hazard_score: float
    drainage_deficit_score: float
    hydro_proximity_score: float
    urban_exposure_score: float
    reservoir_stress_score: float

class RiskFeatureProperties(BaseModel):
    objectid: int
    zone: str
    ward: str
    location: str
    drain_type: str
    drain_status: str
    obstacles: str
    composite_risk_score: float
    risk_level: str = Field(..., example="HIGH")
    factors: RiskFactorBreakdown
    mitigation_action: str

class FloodRiskResponse(BaseModel):
    status: str
    scoring_system: str = Field(
        "Transparent Baseline Multi-Criteria Hydrological Vulnerability Index (HFVI)",
        description="Transparent scoring methodology"
    )
    methodology_note: str = Field(
        "Deterministic multi-criteria physical and geospatial vulnerability model based on real IMERG rainfall, GCC SWD capacity, OSM hydro proximity, and reservoir status.",
        description="Verification context"
    )
    total_zones_evaluated: int
    risk_distribution: Dict[str, int]
    risk_percentages: Dict[str, float]
    mean_risk_score: float
    high_priority_hotspots_count: int
    geojson: GeoJSONFeatureCollection

# Statistics Schema
class StatisticsResponse(BaseModel):
    status: str
    timestamp: str
    storm_water_drains: Dict[str, Any]
    rainfall_monitoring: Dict[str, Any]
    reservoir_system: Dict[str, Any]
    flood_vulnerability: Dict[str, Any]
    spatial_coverage: Dict[str, Any]
    live_weather: Optional[Dict[str, Any]] = None

# Weather Schemas
class WeatherLocation(BaseModel):
    city: str = "Chennai"
    state: str = "Tamil Nadu"
    country: str = "India"
    latitude: float
    longitude: float
    elevation_meters: float
    timezone: str

class WeatherCurrent(BaseModel):
    time: Optional[str] = None
    temperature_celsius: Optional[float] = None
    relative_humidity_pct: Optional[float] = None
    precipitation_mm: Optional[float] = None
    rain_mm: Optional[float] = None
    weather_code: Optional[int] = None
    weather_condition: Optional[str] = None
    cloud_cover_pct: Optional[float] = None
    wind_speed_kmh: Optional[float] = None
    wind_direction_degrees: Optional[float] = None
    surface_pressure_hpa: Optional[float] = None

class DailyForecastItem(BaseModel):
    date: str
    weather_code: int
    condition: str
    temp_max_celsius: float
    temp_min_celsius: float
    precipitation_sum_mm: float
    rain_sum_mm: float
    precipitation_hours: float
    precipitation_probability_max_pct: float
    wind_speed_max_kmh: float
    wind_gusts_max_kmh: float

class WeatherResponse(BaseModel):
    status: str
    source: str = "Open-Meteo Meteorological Forecast API"
    location: WeatherLocation
    current: WeatherCurrent
    hourly_forecast: Dict[str, List[Any]]
    daily_forecast: List[DailyForecastItem]
    firebase_sync: Dict[str, Any]

class WeatherHistoryResponse(BaseModel):
    status: str
    collection: str = "weather_readings"
    count: int
    readings: List[Dict[str, Any]]

