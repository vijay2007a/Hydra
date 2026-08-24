import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

// Build Dynamic SVG Trend Path and Cumulative Line from 48 NASA IMERG Half-Hourly Observations
const buildTrendPaths = (points) => {
  if (!points || !Array.isArray(points) || points.length === 0) {
    return {
      rateLine: 'M 20 200 L 680 200',
      rateArea: 'M 20 200 L 680 200 Z',
      cumulativeLine: 'M 20 200 L 680 200',
      peakPoint: { x: 350, y: 200, val: 0, label: '0.00 mm/hr' },
      xLabels: ['T-24H', 'T-18H', 'T-12H', 'T-6H', 'NOW']
    };
  }

  const rawRates = points.map(p => Math.max(0, Number(p?.max_rate_mm_hr ?? p?.mean_rate_mm_hr ?? 0)));
  const n = rawRates.length;
  const minVal = 0;
  const maxVal = Math.max(...rawRates);
  const valRange = maxVal > 0 ? maxVal : 1.0;

  // X bounds: 20 to 680, Y bounds: 40 (top) to 200 (bottom baseline)
  const coords = rawRates.map((val, idx) => {
    const x = n > 1 ? 20 + (idx / (n - 1)) * 660 : 350;
    const norm = (val - minVal) / valRange;
    const y = 200 - norm * 150;
    return { x, y, val };
  });

  // Build Rate Line (SVG path)
  let rateLine = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
  for (let i = 1; i < coords.length; i++) {
    rateLine += ` L ${coords[i].x.toFixed(1)} ${coords[i].y.toFixed(1)}`;
  }

  // Build Rate Area Fill
  const rateArea = `${rateLine} L ${coords[coords.length - 1].x.toFixed(1)} 200 L ${coords[0].x.toFixed(1)} 200 Z`;

  // Build Cumulative Sum Line
  let cumSum = 0;
  const cumVals = rawRates.map(v => {
    cumSum += v * 0.5; // half-hour accumulation in mm
    return cumSum;
  });
  const maxCum = Math.max(...cumVals) > 0 ? Math.max(...cumVals) : 1.0;
  const cumCoords = cumVals.map((cVal, idx) => {
    const x = n > 1 ? 20 + (idx / (n - 1)) * 660 : 350;
    const norm = cVal / maxCum;
    const y = 200 - norm * 140;
    return { x, y, cVal };
  });
  let cumulativeLine = `M ${cumCoords[0].x.toFixed(1)} ${cumCoords[0].y.toFixed(1)}`;
  for (let i = 1; i < cumCoords.length; i++) {
    cumulativeLine += ` L ${cumCoords[i].x.toFixed(1)} ${cumCoords[i].y.toFixed(1)}`;
  }

  // Find Peak Index
  let peakIdx = 0;
  let peakVal = rawRates[0];
  rawRates.forEach((v, idx) => {
    if (v >= peakVal) {
      peakVal = v;
      peakIdx = idx;
    }
  });

  const peakPoint = {
    x: coords[peakIdx].x,
    y: coords[peakIdx].y,
    val: peakVal,
    label: `${peakVal.toFixed(2)} mm/hr Peak`
  };

  // Generate 5 dynamic time labels across observations
  const labelIndices = [0, Math.floor(n * 0.25), Math.floor(n * 0.5), Math.floor(n * 0.75), n - 1];
  const xLabels = labelIndices.map(idx => {
    const pt = points[idx];
    if (pt?.timestamp) {
      const d = new Date(pt.timestamp);
      return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}Z`;
    }
    return `T-${Math.round((n - 1 - idx) * 0.5)}h`;
  });

  return { rateLine, rateArea, cumulativeLine, peakPoint, xLabels };
};

export const RainfallIntelligence = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Live Sensors');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);

  // Live Telemetry States
  const [weatherData, setWeatherData] = useState(null);
  const [rainfallData, setRainfallData] = useState(null);
  const [weatherHistory, setWeatherHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLiveTelemetry = async (force = false) => {
    try {
      if (force) {
        await api.refreshWeather();
      }
      const [w, r, hist] = await Promise.all([
        api.getWeather(force),
        api.getRainfallData(true),
        api.getWeatherHistory(6)
      ]);
      if (w) setWeatherData(w);
      if (r) setRainfallData(r);
      if (hist && hist.history) setWeatherHistory(hist.history);
    } catch (e) {
      console.warn('[RainfallIntelligence] Error loading telemetry:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveTelemetry();
    // Auto refresh every 5 minutes (300,000 ms)
    const interval = setInterval(() => {
      fetchLiveTelemetry(false);
    }, 300000);
    return () => clearInterval(interval);
  }, []);

  const handleForceRefresh = async () => {
    setIsRefreshing(true);
    await fetchLiveTelemetry(true);
    setIsRefreshing(false);
    setRefreshSuccess(true);
    setTimeout(() => setRefreshSuccess(false), 3000);
  };

  const currWeather = weatherData?.current || {};
  const isCached = weatherData?.firebase_sync?.is_cached || false;
  const lastUpdatedTime = currWeather.time || (weatherData?.firebase_sync?.cached_at_epoch ? new Date(weatherData.firebase_sync.cached_at_epoch * 1000).toLocaleTimeString() : 'LIVE: NOW');

  // Extract key real metrics
  const currentTemp = currWeather.temperature_celsius !== undefined ? currWeather.temperature_celsius : 28.4;
  const currentPrecip = currWeather.precipitation_mm !== undefined ? currWeather.precipitation_mm : 0.0;
  const currentHumidity = currWeather.relative_humidity_pct !== undefined ? currWeather.relative_humidity_pct : 82;
  const currentCondition = currWeather.weather_condition || 'Overcast';
  const currentWind = currWeather.wind_speed_kmh !== undefined ? currWeather.wind_speed_kmh : 7.9;
  const currentPressure = currWeather.surface_pressure_hpa !== undefined ? currWeather.surface_pressure_hpa : 1007.6;
  const currentCloud = currWeather.cloud_cover_pct !== undefined ? currWeather.cloud_cover_pct : 100;
  const totalAcc24h = rainfallData?.totalAccumulation24h || '0.0 mm';
  const peakRate = rainfallData?.currentPeakRate || '0.0 mm/hr';
  const meanRate = rainfallData?.currentMeanRate || '0.0 mm/hr';
  const datasetProduct = rainfallData?.satelliteProduct || 'NASA GPM IMERG V07';

  // Recent trend points from IMERG
  const trendPoints = rainfallData?.recentTrend || [];
  const svgData = buildTrendPaths(trendPoints);

  return (
    <div className="bg-absolute-black text-on-surface font-body-md antialiased min-h-screen flex flex-col pt-[72px]">
      
      <div className="flex flex-1">
        {/* Tactical SideNavBar matching Stitch */}
        <aside className="hidden md:flex flex-col h-[calc(100vh-72px)] w-64 border-r border-outline-variant/20 bg-surface-container-lowest/80 backdrop-blur-2xl shadow-2xl py-glass-padding fixed left-0 top-[72px] z-40">
          <div className="px-6 mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-DEFAULT bg-primary-container/20 border border-primary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-primary-container text-sm">rocket_launch</span>
              </div>
              <div>
                <h2 className="font-headline-lg text-primary text-sm font-bold tracking-widest">COMMAND</h2>
                <div className="font-data-mono text-data-mono text-[10px] text-outline">V3.2 Active</div>
              </div>
            </div>
          </div>

          <div className="flex-1 px-4 space-y-1 font-data-mono text-data-mono overflow-y-auto">
            <button 
              onClick={() => { setActiveTab('Overview'); navigate('/predictions'); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-DEFAULT text-left transition-all group duration-200 cursor-pointer ${
                activeTab === 'Overview' ? 'bg-primary-container/10 text-primary-container border-r-2 border-primary-container' : 'text-outline hover:text-on-surface hover:bg-surface-container-high/50'
              }`}
            >
              <span className="material-symbols-outlined text-sm group-hover:text-primary-container transition-colors">dashboard</span>
              <span className="text-xs">Command Hub</span>
            </button>

            <button 
              onClick={() => { setActiveTab('Map'); navigate('/intelligence-map'); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-DEFAULT text-outline hover:text-on-surface transition-all hover:bg-surface-container-high/50 text-left cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">map</span>
              <span className="text-xs">Intelligence GIS</span>
            </button>

            <button 
              onClick={() => { setActiveTab('Live Sensors'); navigate('/rainfall'); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-DEFAULT bg-primary-container/10 text-primary-container border-r-2 border-primary-container text-left cursor-pointer font-bold"
            >
              <span className="material-symbols-outlined text-sm">water_drop</span>
              <span className="text-xs">Rainfall Analytics</span>
            </button>

            <button 
              onClick={() => { setActiveTab('Infrastructure'); navigate('/urban-intelligence'); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-DEFAULT text-outline hover:text-on-surface transition-all hover:bg-surface-container-high/50 text-left cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">domain</span>
              <span className="text-xs">Drainage & SCADA</span>
            </button>

            <button 
              onClick={() => { setActiveTab('AI Models'); navigate('/predictions'); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-DEFAULT text-outline hover:text-on-surface transition-all hover:bg-surface-container-high/50 text-left cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">psychology</span>
              <span className="text-xs">AI Predictions</span>
            </button>
          </div>

          <div className="px-6 py-4 border-t border-outline-variant/20">
            <button 
              onClick={() => navigate('/intelligence-map')}
              className="w-full py-2 bg-gradient-to-r from-primary-container to-secondary text-surface-container-lowest font-label-caps text-label-caps rounded-DEFAULT font-bold shadow-[0_0_15px_rgba(0,242,255,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              DEPLOY RESPONSE
            </button>
          </div>

          <div className="px-4 space-y-1 font-data-mono text-data-mono border-t border-outline-variant/20 pt-4 bg-surface-container-low">
            <button 
              onClick={() => navigate('/protocol')}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-DEFAULT text-outline hover:text-on-surface transition-all hover:bg-surface-container-high/50 text-left cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">settings</span>
              <span className="text-xs">Settings</span>
            </button>
            <button 
              onClick={() => navigate('/protocol')}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-DEFAULT text-outline hover:text-on-surface transition-all hover:bg-surface-container-high/50 text-left cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">help</span>
              <span className="text-xs">Support</span>
            </button>
          </div>
        </aside>

        {/* Main Content Canvas */}
        <main className="flex-1 md:ml-64 p-margin-mobile md:p-margin-desktop bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-surface-container-highest/20 via-absolute-black to-absolute-black min-h-screen">
          
          {/* Page Header */}
          <header className="mb-8">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary drop-shadow-glow-cyan flex items-center gap-3 font-bold">
                  <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>water_drop</span>
                  RAINFALL ANALYTICS
                </h1>
                <p className="font-data-mono text-data-mono text-outline mt-2 flex items-center gap-2 uppercase font-bold flex-wrap">
                  <span className={`w-2 h-2 rounded-full ${isCached ? 'bg-warning-orange' : 'bg-primary-container'} animate-pulse`}></span>
                  <span>Live Feed // Chennai Sector (13.08°N, 80.27°E) // {currentCondition.toUpperCase()}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded border font-mono ${
                    isCached 
                      ? 'border-warning-orange/40 bg-warning-orange/10 text-warning-orange' 
                      : 'border-primary-container/40 bg-primary-container/10 text-primary-container'
                  }`}>
                    {isCached ? 'CACHED' : 'LIVE'} // LAST UPDATED: {lastUpdatedTime}
                  </span>
                </p>
              </div>

              <div className="hidden lg:flex items-center gap-4 bg-surface-container-low border border-outline-variant/30 px-4 py-2 rounded-DEFAULT backdrop-blur-md">
                <span className="material-symbols-outlined text-primary-container">satellite_alt</span>
                <div>
                  <div className="font-label-caps text-label-caps text-primary-container text-[10px] font-bold">DATA SOURCES</div>
                  <div className="font-data-mono text-data-mono text-on-surface font-bold text-xs">
                    {datasetProduct} + Open-Meteo (Live)
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
            
            {/* Main Chart Panel (Spans 8 cols) */}
            <section className="lg:col-span-8 bg-surface-container-low border border-outline-variant/30 rounded-lg p-6 backdrop-blur-xl relative overflow-hidden group flex flex-col justify-between">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-container/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="flex justify-between items-center mb-4 relative z-10">
                <h2 className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-2 font-bold">
                  <span className="material-symbols-outlined text-sm">show_chart</span>
                  NASA IMERG PRECIPITATION &amp; METEOROLOGICAL PROFILE
                </h2>
                <div className="flex gap-4 font-data-mono text-data-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-1 bg-primary-container drop-shadow-glow-cyan"></span> Open-Meteo Temp ({currentTemp}°C)
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-1 bg-secondary drop-shadow-glow-cyan"></span> Mean Rate ({meanRate})
                  </div>
                </div>
              </div>

              {/* Dynamic Chart SVG Container with Live NASA IMERG Trend */}
              <div className="w-full h-64 relative z-10">
                <svg className="w-full h-full" height="100%" width="100%" viewBox="0 0 700 240" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern height="40" id="rainfallGrid" patternUnits="userSpaceOnUse" width="70">
                      <path className="chart-grid-line" d="M 70 0 L 0 0 0 40" fill="none" stroke="rgba(132, 148, 149, 0.15)"></path>
                    </pattern>
                    <linearGradient id="rainfallGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00f2ff" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#00f2ff" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid Background */}
                  <rect fill="url(#rainfallGrid)" height="200" width="700" x="0" y="0"></rect>
                  
                  {/* Real Dynamic NASA IMERG Area Fill */}
                  <path d={svgData.rateArea} fill="url(#rainfallGradient)" />

                  {/* Real Dynamic NASA IMERG Observed Rate Line (Cyan Glow) */}
                  <path 
                    d={svgData.rateLine} 
                    fill="none" 
                    stroke="#00f2ff" 
                    strokeWidth="2.5" 
                    style={{ filter: 'drop-shadow(0 0 6px #00f2ff)' }}
                  />
                  
                  {/* Real Dynamic Cumulative Line (Purple Accent) */}
                  <path 
                    d={svgData.cumulativeLine} 
                    fill="none" 
                    stroke="#ebb2ff" 
                    strokeDasharray="4 4" 
                    strokeWidth="1.5" 
                    style={{ filter: 'drop-shadow(0 0 4px #ce5dff)' }}
                  />
                  
                  {/* Peak Rate Indicator */}
                  <circle 
                    cx={svgData.peakPoint.x} 
                    cy={svgData.peakPoint.y} 
                    fill="#000" 
                    r="4.5" 
                    stroke="#00f2ff" 
                    strokeWidth="2"
                  />
                  <line 
                    opacity="0.5" 
                    stroke="#00f2ff" 
                    strokeDasharray="2 2" 
                    strokeWidth="1" 
                    x1={svgData.peakPoint.x} 
                    x2={svgData.peakPoint.x} 
                    y1={svgData.peakPoint.y} 
                    y2="200"
                  />
                  <text 
                    fill="#00f2ff" 
                    fontFamily="JetBrains Mono" 
                    fontSize="11" 
                    fontWeight="bold" 
                    x={Math.min(540, Math.max(30, svgData.peakPoint.x - 40))} 
                    y={Math.max(25, svgData.peakPoint.y - 12)} 
                    style={{ filter: 'drop-shadow(0 0 6px rgba(0,242,255,0.8))' }}
                  >
                    {svgData.peakPoint.label}
                  </text>

                  {/* Dynamic Time Axis Labels (5 observations) */}
                  {svgData.xLabels.map((lbl, idx) => {
                    const xPos = 20 + idx * 160;
                    return (
                      <text 
                        key={idx} 
                        fill="#849495" 
                        fontFamily="JetBrains Mono" 
                        fontSize="10" 
                        x={xPos} 
                        y="225"
                      >
                        {lbl}
                      </text>
                    );
                  })}
                </svg>
              </div>

              {/* Live Meteorological Badges Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-3 border-t border-outline-variant/20 relative z-10 font-mono text-xs">
                <div className="bg-surface-container-lowest/60 p-2 rounded border border-outline-variant/30">
                  <div className="text-[10px] text-outline">HUMIDITY (2m)</div>
                  <div className="text-primary font-bold text-sm">{currentHumidity}%</div>
                </div>
                <div className="bg-surface-container-lowest/60 p-2 rounded border border-outline-variant/30">
                  <div className="text-[10px] text-outline">WIND SPEED</div>
                  <div className="text-secondary font-bold text-sm">{currentWind} km/h</div>
                </div>
                <div className="bg-surface-container-lowest/60 p-2 rounded border border-outline-variant/30">
                  <div className="text-[10px] text-outline">PRESSURE</div>
                  <div className="text-on-surface font-bold text-sm">{currentPressure} hPa</div>
                </div>
                <div className="bg-surface-container-lowest/60 p-2 rounded border border-outline-variant/30">
                  <div className="text-[10px] text-outline">CLOUD COVER</div>
                  <div className="text-primary-container font-bold text-sm">{currentCloud}%</div>
                </div>
              </div>
            </section>

            {/* Right Side Panel (Spans 4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-gutter">
              {/* Satellite Intensity Heatmap */}
              <section className="bg-surface-container-low border border-outline-variant/30 rounded-lg p-1 backdrop-blur-xl relative overflow-hidden h-64 shadow-[0_0_20px_rgba(0,242,255,0.15)]">
                <div className="absolute top-4 left-4 z-10 bg-absolute-black/80 px-3 py-1 border border-outline-variant/50 rounded-DEFAULT backdrop-blur-md">
                  <span className="font-label-caps text-label-caps text-on-surface text-[10px] font-bold">{datasetProduct}</span>
                </div>
                
                {/* Satellite Heatmap Image */}
                <div className="w-full h-full rounded-DEFAULT overflow-hidden relative">
                  <img 
                    alt="Satellite Precipitation Heatmap" 
                    className="w-full h-full object-cover opacity-80 mix-blend-screen" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCjeZsOZ4ASOSwcAsu842iGF92vi2mkGGkGe4SagrYavekUe_7ez5eYp1WzFS1nhc6GPP_GvrYJO6bTfcmeYFHZcuXDpMl3XvjCjlHf2ZY1zxQQfkzNJ3ZKLo12l07dUn-JxIOdtfG_F-i_5fAVjdoEj1yYnEErpklpk17sqSAVWVw6cNPmUqTg1HbAzjC7cyf4JIGo442sIqR2jRf3qZD4konbEhmatyG_WeuqQFqNn-6Aj0i3puae"
                  />
                  {/* Grid Overlay */}
                  <div className="absolute inset-0 pointer-events-none opacity-40 bg-[linear-gradient(to_right,rgba(132,148,149,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(132,148,149,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                  {/* Target Reticle */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 border border-primary-container rounded-full opacity-70 drop-shadow-glow-cyan flex items-center justify-center pointer-events-none">
                    <div className="w-1 h-1 bg-primary-container rounded-full"></div>
                    <div className="absolute w-full h-[1px] bg-primary-container/50"></div>
                    <div className="absolute h-full w-[1px] bg-primary-container/50"></div>
                  </div>
                </div>
              </section>

              {/* Key Metrics Bento */}
              <section className="grid grid-cols-2 gap-4 flex-1">
                {/* Metric 1 */}
                <div className="bg-surface-container-low border border-outline-variant/30 rounded-lg p-4 backdrop-blur-md flex flex-col justify-center">
                  <div className="font-label-caps text-label-caps text-outline mb-1 font-bold">TOTAL ACCUMULATION</div>
                  <div className="font-display-lg text-display-lg text-primary drop-shadow-glow-cyan font-bold">
                    {totalAcc24h.replace(' mm', '')}<span className="text-lg text-outline font-normal">mm</span>
                  </div>
                </div>
                {/* Metric 2 */}
                <div className="bg-surface-container-low border border-outline-variant/30 rounded-lg p-4 backdrop-blur-md flex flex-col justify-center">
                  <div className="font-label-caps text-label-caps text-outline mb-1 font-bold">PEAK RAIN RATE</div>
                  <div className="font-display-lg text-2xl text-secondary drop-shadow-glow-cyan font-bold">
                    {peakRate}
                  </div>
                  <div className="text-[10px] font-mono text-outline uppercase">IMERG Satellite</div>
                </div>
              </section>
            </div>

          </div>

          {/* Firestore Historical Snapshots Section */}
          {weatherHistory.length > 0 && (
            <div className="mt-8">
              <div className="bg-surface-container-low border border-outline-variant/30 rounded-lg p-6 backdrop-blur-xl">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-label-caps text-label-caps text-secondary font-bold">FIRESTORE WEATHER SNAPSHOT HISTORY (weather_snapshots)</span>
                  <span className="text-xs font-mono text-outline">{weatherHistory.length} chronological documents</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
                  {weatherHistory.map((snap, i) => (
                    <div key={snap.doc_id || i} className="bg-surface-container p-3 rounded border border-outline-variant/20">
                      <div className="text-primary-container text-[11px] font-bold truncate">{snap.doc_id || `Doc ${i+1}`}</div>
                      <div className="text-on-surface font-semibold mt-1">{snap.current?.temperature_celsius ?? snap.current?.temperature_c ?? 26.5}°C</div>
                      <div className="text-[10px] text-outline truncate">{snap.current?.weather_condition || 'Clear'}</div>
                      <div className="text-[9px] text-outline-variant mt-1">{snap.created_at ? new Date(snap.created_at).toLocaleTimeString() : 'Recent'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Lower Section: Constellation Status & Live Open-Meteo Synchronization */}
          <div className="mt-gutter">
            <div className="aurora-divider mb-6 h-px bg-gradient-to-r from-transparent via-primary-container/50 to-transparent"></div>
            
            <section className="bg-surface-container-low border border-outline-variant/30 rounded-lg p-6 backdrop-blur-xl flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-6">
                {/* Constellation Radar Viz */}
                <div className="relative w-16 h-16 rounded-full border border-outline-variant/50 flex items-center justify-center bg-surface-container-lowest overflow-hidden">
                  <div className="absolute inset-0 bg-primary-container/10 rounded-full animate-ping opacity-20"></div>
                  <div className="w-full h-[1px] bg-outline-variant/50 absolute top-1/2"></div>
                  <div className="h-full w-[1px] bg-outline-variant/50 absolute left-1/2"></div>
                  <div className="w-2 h-2 bg-primary-container rounded-full drop-shadow-glow-cyan absolute top-4 left-10"></div>
                  <div className="w-1.5 h-1.5 bg-secondary rounded-full absolute bottom-4 left-4 opacity-70"></div>
                  <span className="material-symbols-outlined text-outline-variant text-xl z-10">satellite</span>
                </div>

                <div>
                  <h3 className="font-data-mono text-data-mono text-on-surface mb-1 font-bold">CONSTELLATION &amp; WEATHER STATUS</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-primary-container/20 text-primary-container px-2 py-0.5 rounded-sm font-label-caps text-label-caps text-[10px] border border-primary-container/50 font-bold">
                      NASA GPM CORE: {rainfallData?.rawRainfall?.total_files_available || 308} HDF5 FILES
                    </span>
                    <span className="bg-surface-container-high text-outline px-2 py-0.5 rounded-sm font-label-caps text-label-caps text-[10px] border border-outline-variant font-bold">
                      OPEN-METEO: LIVE CHENNAI
                    </span>
                    <span className="bg-surface-container-high text-primary-container px-2 py-0.5 rounded-sm font-label-caps text-label-caps text-[10px] border border-outline-variant font-bold">
                      FIRESTORE: {weatherData?.firebase_sync?.firestore_connected ? 'CONNECTED (hydra-1963e)' : 'LOCAL CACHE'}
                    </span>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleForceRefresh}
                disabled={isRefreshing}
                className="px-6 py-2 border border-primary-container text-primary-container font-label-caps text-label-caps rounded-DEFAULT hover:bg-primary-container/10 transition-colors drop-shadow-glow-cyan flex items-center gap-2 group cursor-pointer font-bold active:scale-95"
              >
                <span className={`material-symbols-outlined text-sm ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`}>
                  sync
                </span>
                {isRefreshing ? 'SYNCING TELEMETRY...' : refreshSuccess ? '✓ SYNC COMPLETE' : 'FORCE REFRESH'}
              </button>
            </section>
          </div>

        </main>
      </div>

      {/* Footer with Distinct Data Source Attribution */}
      <footer className="w-full py-8 border-t border-outline-variant/10 bg-absolute-black flex flex-col md:flex-row justify-between items-center px-margin-desktop gap-4 z-40 relative md:ml-64">
        <div className="font-label-caps text-on-surface font-bold tracking-widest text-sm">HYDROCAST</div>
        <div className="font-data-mono text-label-caps text-outline text-[10px] tracking-wider text-center">
          © 2026 HYDROCAST INTELLIGENCE. METEOROLOGY: OPEN-METEO // SATELLITE: NASA IMERG // DRAINAGE: GCC SWD // HYDROGRAPHY: OSM.
        </div>
        <div className="flex gap-6 font-data-mono text-label-caps text-[10px]">
          <span onClick={() => navigate('/protocol')} className="text-outline hover:text-on-surface hover:underline decoration-primary-container opacity-80 cursor-pointer">Protocol</span>
          <span onClick={() => navigate('/urban-intelligence')} className="text-outline hover:text-on-surface hover:underline decoration-primary-container opacity-80 cursor-pointer">Infrastructure</span>
          <span onClick={() => navigate('/intelligence-map')} className="text-outline hover:text-on-surface hover:underline decoration-primary-container opacity-80 cursor-pointer">GIS Map</span>
        </div>
      </footer>

    </div>
  );
};
