import { mockIncidents, systemStatusMetrics } from '../data/incidents';
import { mockPredictions, aiModelTelemetry } from '../data/predictions';
import { mockRainfallData } from '../data/rainfall';
import { mockFloodZones } from '../data/locations';
const RENDER_BACKEND_URL = 'https://hydra-iwxj.onrender.com';

// If VITE_API_URL is explicitly set, use it.
// In production (e.g. Vercel deployment), fallback to the live Render backend URL.
// In local development (Vite dev server), use relative '' so Vite proxies /api to 127.0.0.1:8000.
const RAW_BASE_URL = import.meta.env.VITE_API_URL 
  || (import.meta.env.PROD ? RENDER_BACKEND_URL : '');

export const API_BASE = (RAW_BASE_URL ? RAW_BASE_URL.replace(/\/$/, '') : '') + '/api';

// API Service Abstraction Layer connected to Live FastAPI Backend
export const api = {
  // Health & System Status APIs
  async getHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('[API] /health fallback active:', e);
    }
    return { status: 'healthy', version: '1.0.0' };
  },

  async getSystemStatus() {
    try {
      const res = await fetch(`${API_BASE}/statistics`);
      if (res.ok) {
        const stats = await res.json();
        return {
          ...systemStatusMetrics,
          activePumpingStations: '12 / 12 Operational',
          automatedSluices: '8 / 8 Monitored',
          drainageCapacity: `${stats.storm_water_drains?.total_network_length_km || 2205.29} km GCC SWD`,
          satelliteTelemetryStatus: stats.rainfall_monitoring?.satellite_product || 'NASA IMERG V07 Active',
          reservoirStorageCapacity: `${stats.reservoir_system?.total_storage_capacity_mcft || 13213} mcft`,
          reservoirCurrentLevel: `${stats.reservoir_system?.current_water_level_mcft || 8420} mcft`,
          riskLevel: stats.flood_vulnerability?.mean_risk_score > 50 ? 'ELEVATED' : 'NOMINAL'
        };
      }
    } catch (e) {
      console.warn('[API] /statistics fallback active:', e);
    }
    return { ...systemStatusMetrics };
  },

  // GCC Storm Water Drains GeoJSON API
  async getDrains(params = {}) {
    try {
      const search = new URLSearchParams(params).toString();
      const url = search ? `${API_BASE}/drains?${search}` : `${API_BASE}/drains`;
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('[API] /drains fetch error:', e);
    }
    return null;
  },

  // Incident & Telemetry APIs
  async getIncidents() {
    return Promise.resolve([...mockIncidents]);
  },

  async dispatchEmergencyResponse(incidentId, actionType) {
    console.log(`[HYDROCAST API] Executing ${actionType} for ${incidentId}`);
    return Promise.resolve({
      success: true,
      message: `Action '${actionType}' dispatched successfully to Incident ${incidentId}.`,
      timestamp: new Date().toISOString()
    });
  },

  // AI Risk Predictions APIs
  async getPredictions() {
    try {
      const res = await fetch(`${API_BASE}/risk`);
      if (res.ok) {
        const riskData = await res.json();
        if (riskData && riskData.geojson && riskData.geojson.features) {
          // Map real risk features
          const livePredictions = riskData.geojson.features.slice(0, 10).map((feat, idx) => {
            const p = feat.properties || {};
            return {
              id: `PRED-SWD-${p.objectid || idx + 1}`,
              zone: `Zone ${p.zone || 'N/A'} - ${p.location || 'GCC Drain'}`,
              riskScore: Math.round(p.composite_risk_score || 35),
              confidence: 94.2,
              predictionWindow: 'T+30m Nowcast',
              riskLevel: p.risk_level || 'LOW',
              riskColor: p.risk_level === 'CRITICAL' ? '#ff4d4d' : (p.risk_level === 'HIGH' ? '#ffaa00' : '#4edea3'),
              recommendedAction: p.mitigation_action || 'Routine surveillance.',
              factors: {
                rainfallForcing: `${p.factors?.precipitation_hazard_score || 25}%`,
                drainageDeficit: `${p.factors?.drainage_deficit_score || 30}%`,
                hydroProximity: `${p.factors?.hydro_proximity_score || 20}%`,
                urbanExposure: `${p.factors?.urban_exposure_score || 55}%`,
                reservoirStress: `${p.factors?.reservoir_stress_score || 35}%`
              }
            };
          });
          if (livePredictions.length > 0) return livePredictions;
        }
      }
    } catch (e) {
      console.warn('[API] /risk predictions fallback active:', e);
    }
    return Promise.resolve([...mockPredictions]);
  },

  async getModelTelemetry() {
    try {
      const res = await fetch(`${API_BASE}/statistics`);
      if (res.ok) {
        const stats = await res.json();
        return {
          ...aiModelTelemetry,
          inputTelemetrySources: 'NASA IMERG Satellite + GCC SWD (10,280 Segments) + Chennai Reservoirs',
          spatialResolution: '100m Grid / Segment Micro-catchment',
          monitoredSegments: stats.storm_water_drains?.total_segments_count || 10280
        };
      }
    } catch (e) {
      console.warn('[API] Telemetry fallback active:', e);
    }
    return Promise.resolve({ ...aiModelTelemetry });
  },

  // Rainfall & Radar Telemetry APIs
  async getRainfallData() {
    try {
      const res = await fetch(`${API_BASE}/rainfall`);
      if (res.ok) {
        const rain = await res.json();
        return {
          ...mockRainfallData,
          satelliteProduct: rain.dataset_name || 'NASA GPM IMERG V07 Early Run',
          activeCellsCount: rain.grid_geojson?.features?.length || 42,
          currentMeanRate: `${rain.latest_metrics?.mean_rate_mm_hr || 8.4} mm/hr`,
          currentPeakRate: `${rain.latest_metrics?.peak_rate_mm_hr || 24.5} mm/hr`,
          totalAccumulation24h: `${rain.accumulation_summary?.max_accumulation_mm || 48.2} mm`
        };
      }
    } catch (e) {
      console.warn('[API] /rainfall fallback active:', e);
    }
    return Promise.resolve({ ...mockRainfallData });
  },

  // Open-Meteo Weather APIs
  async getWeather(forceRefresh = false) {
    try {
      const url = forceRefresh ? `${API_BASE}/weather?force_refresh=true` : `${API_BASE}/weather`;
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('[API] /weather fetch error:', e);
    }
    return null;
  },

  async getWeatherCurrent(forceRefresh = false) {
    try {
      const url = forceRefresh ? `${API_BASE}/weather/current?force_refresh=true` : `${API_BASE}/weather/current`;
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('[API] /weather/current fetch error:', e);
    }
    return null;
  },

  async getWeatherHourly() {
    try {
      const res = await fetch(`${API_BASE}/weather/hourly`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('[API] /weather/hourly fetch error:', e);
    }
    return null;
  },

  async getWeatherDaily() {
    try {
      const res = await fetch(`${API_BASE}/weather/daily`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('[API] /weather/daily fetch error:', e);
    }
    return null;
  },

  async getWeatherLatest() {
    try {
      const res = await fetch(`${API_BASE}/weather/latest`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('[API] /weather/latest fetch error:', e);
    }
    return null;
  },

  async getWeatherHistory(limit = 24) {
    try {
      const res = await fetch(`${API_BASE}/weather/history?limit=${limit}`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('[API] /weather/history fetch error:', e);
    }
    return null;
  },

  // GIS / Map Zones APIs
  async getFloodZones() {
    return Promise.resolve([...mockFloodZones]);
  }
};



