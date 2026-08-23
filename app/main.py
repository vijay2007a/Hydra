import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import WEATHER_REFRESH_MINUTES, PORT
from app.core.data_loader import DataLoader
from app.core.rainfall_processor import RainfallProcessor
from app.core.risk_engine import RiskEngine
from app.core.firebase import FirebaseManager
from app.core.weather_service import WeatherService

from app.routers import health, drains, rainfall, reservoirs, risk, statistics, weather

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("hydrocast.main")

async def periodic_weather_poller():
    """
    Background worker that periodically fetches live Open-Meteo telemetry
    and persists weather snapshots into Firestore at configured intervals.
    """
    logger.info(f"Started automatic weather sync worker (interval: {WEATHER_REFRESH_MINUTES} minutes).")
    interval_seconds = max(60, WEATHER_REFRESH_MINUTES * 60)
    while True:
        try:
            await asyncio.sleep(interval_seconds)
            logger.info("Executing scheduled weather sync cycle...")
            ws = WeatherService.get_instance()
            snapshot = ws.fetch_open_meteo_live()
            success, doc_id = ws.save_snapshot_to_firestore(snapshot)
            if success:
                logger.info(f"Scheduled weather sync successfully persisted snapshot '{doc_id}' to Firestore.")
            else:
                logger.info(f"Scheduled weather sync completed with status: {doc_id}")
        except asyncio.CancelledError:
            logger.info("Automatic weather sync worker cancelled.")
            break
        except Exception as e:
            logger.error(f"Error in automatic weather sync cycle: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initializes datasets, Firebase, and precomputes spatial indices on startup."""
    logger.info("Initializing HydroCast data pipelines on startup...")
    
    # 1. Load Datasets
    DataLoader.get_instance()
    RainfallProcessor.get_instance()
    RiskEngine.get_instance().precalculate_spatial_indices()
    
    # 2. Initialize Firebase & Firestore
    fb = FirebaseManager.get_instance()
    if fb.is_connected():
        logger.info("Firestore connected. Syncing initial weather snapshot...")
        try:
            ws = WeatherService.get_instance()
            ws.get_latest_weather(force_refresh=False)
        except Exception as e:
            logger.warning(f"Initial weather sync warning: {e}")
    else:
        logger.info("Firebase initialized in local fallback mode.")

    # 3. Start background periodic weather sync task
    poller_task = asyncio.create_task(periodic_weather_poller())

    logger.info("HydroCast backend ready to serve requests.")
    try:
        yield
    finally:
        logger.info("Shutting down HydroCast backend...")
        poller_task.cancel()
        try:
            await poller_task
        except asyncio.CancelledError:
            pass


app = FastAPI(
    title="HydroCast Urban Flood Intelligence API",
    description="Real-Time Urban Flood Prediction, Radar Nowcasting, Firebase Telemetry, and Spatial Risk Analytics for Greater Chennai Corporation.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for the existing frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(health.router)
app.include_router(drains.router)
app.include_router(rainfall.router)
app.include_router(reservoirs.router)
app.include_router(risk.router)
app.include_router(statistics.router)
app.include_router(weather.router)

@app.get("/", tags=["Root"])
def root():
    return {
        "service": "HydroCast Urban Flood Intelligence API",
        "status": "online",
        "documentation": "/docs",
        "endpoints": {
            "health": "/api/health",
            "drains": "/api/drains",
            "rainfall": "/api/rainfall",
            "reservoirs": "/api/reservoirs",
            "risk": "/api/risk",
            "statistics": "/api/statistics",
            "weather_latest": "/api/weather/latest",
            "weather_history": "/api/weather/history"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=PORT, reload=True)
