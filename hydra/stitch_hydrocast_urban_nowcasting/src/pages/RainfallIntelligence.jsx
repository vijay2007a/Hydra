import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export const RainfallIntelligence = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Live Sensors');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);

  // Live Telemetry States
  const [weatherData, setWeatherData] = useState(null);
  const [rainfallData, setRainfallData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchLiveTelemetry = async (force = false) => {
    try {
      const [w, r] = await Promise.all([
        api.getWeather(force),
        api.getRainfallData()
      ]);
      if (w) setWeatherData(w);
      if (r) setRainfallData(r);
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
  const dailyForecast = weatherData?.daily_forecast || [];
  const hourlyForecast = weatherData?.hourly_forecast || {};
  const isCached = weatherData?.firebase_sync?.is_cached || false;
  const lastUpdatedTime = currWeather.time || (weatherData?.firebase_sync?.cached_at_epoch ? new Date(weatherData.firebase_sync.cached_at_epoch * 1000).toLocaleTimeString() : 'LIVE: NOW');

  // Extract key real metrics
  const currentTemp = currWeather.temperature_celsius !== undefined ? currWeather.temperature_celsius : 26.2;
  const currentPrecip = currWeather.precipitation_mm !== undefined ? currWeather.precipitation_mm : 0.0;
  const currentHumidity = currWeather.relative_humidity_pct !== undefined ? currWeather.relative_humidity_pct : 81;
  const currentCondition = currWeather.weather_condition || 'Overcast';
  const currentWind = currWeather.wind_speed_kmh !== undefined ? currWeather.wind_speed_kmh : 12.3;
  const currentPressure = currWeather.surface_pressure_hpa !== undefined ? currWeather.surface_pressure_hpa : 1007.6;
  const currentCloud = currWeather.cloud_cover_pct !== undefined ? currWeather.cloud_cover_pct : 98;
  const totalAcc24h = rainfallData?.totalAccumulation24h || '48.2 mm';


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
              <span className="material-symbols-outlined">dashboard</span>
              <span>Overview</span>
            </button>

            <button 
              onClick={() => setActiveTab('Live Sensors')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-DEFAULT text-left transition-all group duration-200 cursor-pointer ${
                activeTab === 'Live Sensors' ? 'bg-primary-container/10 text-primary-container border-r-2 border-primary-container font-bold' : 'text-outline hover:text-on-surface hover:bg-surface-container-high/50'
              }`}
            >
              <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>sensors</span>
              <span className="font-bold">Live Sensors</span>
            </button>

            <button 
              onClick={() => { setActiveTab('Risk Models'); navigate('/predictions'); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-DEFAULT text-left transition-all group duration-200 cursor-pointer ${
                activeTab === 'Risk Models' ? 'bg-primary-container/10 text-primary-container border-r-2 border-primary-container' : 'text-outline hover:text-on-surface hover:bg-surface-container-high/50'
              }`}
            >
              <span className="material-symbols-outlined">warning</span>
              <span>Risk Models</span>
            </button>

            <button 
              onClick={() => { setActiveTab('Evacuation'); navigate('/intelligence-map'); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-DEFAULT text-left transition-all group duration-200 cursor-pointer ${
                activeTab === 'Evacuation' ? 'bg-primary-container/10 text-primary-container border-r-2 border-primary-container' : 'text-outline hover:text-on-surface hover:bg-surface-container-high/50'
              }`}
            >
              <span className="material-symbols-outlined">emergency_share</span>
              <span>Evacuation</span>
            </button>

            <button 
              onClick={() => { setActiveTab('Archive'); navigate('/urban-intelligence'); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-DEFAULT text-left transition-all group duration-200 cursor-pointer ${
                activeTab === 'Archive' ? 'bg-primary-container/10 text-primary-container border-r-2 border-primary-container' : 'text-outline hover:text-on-surface hover:bg-surface-container-high/50'
              }`}
            >
              <span className="material-symbols-outlined">inventory_2</span>
              <span>Infrastructure</span>
            </button>
          </div>

          <div className="px-6 mt-auto mb-6">
            <button 
              onClick={() => navigate('/intelligence-map')}
              className="w-full py-3 bg-primary-container text-absolute-black font-label-caps text-label-caps font-bold rounded-DEFAULT hover:bg-primary transition-colors drop-shadow-glow-cyan active:scale-95 cursor-pointer"
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
                    NASA IMERG (Sat) + Open-Meteo (Live)
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
                  METEOROLOGICAL & PRECIPITATION PROFILE
                </h2>
                <div className="flex gap-4 font-data-mono text-data-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-1 bg-primary-container drop-shadow-glow-cyan"></span> Open-Meteo Temp ({currentTemp}°C)
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-1 bg-secondary drop-shadow-glow-cyan"></span> Precip ({currentPrecip} mm)
                  </div>
                </div>
              </div>

              {/* Faux Chart SVG Container with Live Weather Attributes */}
              <div className="w-full h-64 relative z-10">
                <svg className="w-full h-full" height="100%" width="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern height="20%" id="rainfallGrid" patternUnits="userSpaceOnUse" width="10%">
                      <path className="chart-grid-line" d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(132, 148, 149, 0.15)"></path>
                    </pattern>
                  </defs>
                  <rect fill="url(#rainfallGrid)" height="100%" width="100%"></rect>
                  
                  {/* X Axis Labels from Daily Forecast or default */}
                  <text fill="#849495" fontFamily="JetBrains Mono" fontSize="10" x="4%" y="96%">{dailyForecast[0]?.date || 'TODAY'}</text>
                  <text fill="#849495" fontFamily="JetBrains Mono" fontSize="10" x="20%" y="96%">{dailyForecast[1]?.date || 'DAY+1'}</text>
                  <text fill="#849495" fontFamily="JetBrains Mono" fontSize="10" x="38%" y="96%">{dailyForecast[2]?.date || 'DAY+2'}</text>
                  <text fill="#849495" fontFamily="JetBrains Mono" fontSize="10" x="56%" y="96%">{dailyForecast[3]?.date || 'DAY+3'}</text>
                  <text fill="#849495" fontFamily="JetBrains Mono" fontSize="10" x="74%" y="96%">{dailyForecast[4]?.date || 'DAY+4'}</text>
                  <text fill="#849495" fontFamily="JetBrains Mono" fontSize="10" x="90%" y="96%">{dailyForecast[5]?.date || 'DAY+5'}</text>

                  {/* Glowing Data Line 1 (Observed) */}
                  <path d="M 0 200 Q 50 180, 100 160 T 200 120 T 300 220 T 400 50 T 500 100 T 600 210 T 700 220" fill="none" stroke="#00f2ff" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 6px #00f2ff)' }}></path>
                  
                  {/* Glowing Data Line 2 (Cumulative) */}
                  <path d="M 0 220 L 100 200 L 200 160 L 300 150 L 400 80 L 500 50 L 600 40 L 700 30" fill="none" stroke="#ebb2ff" strokeDasharray="4 4" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 6px #ce5dff)' }}></path>
                  
                  {/* Peak Indicator */}
                  <circle cx="400" cy="50" fill="#000" r="4" stroke="#00f2ff" strokeWidth="2"></circle>
                  <line opacity="0.5" stroke="#00f2ff" strokeDasharray="2 2" strokeWidth="1" x1="400" x2="400" y1="50" y2="240"></line>
                  <text fill="#00f2ff" fontFamily="JetBrains Mono" fontSize="11" fontWeight="bold" x="410" y="45" style={{ filter: 'drop-shadow(0 0 6px rgba(0,242,255,0.8))' }}>
                    {currentTemp}°C // {currentCondition}
                  </text>
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
                  <span className="font-label-caps text-label-caps text-on-surface text-[10px] font-bold">NASA IMERG SATELLITE</span>
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
                  <div className="font-label-caps text-label-caps text-outline mb-1 font-bold">LIVE TEMP / COND</div>
                  <div className="font-display-lg text-2xl text-secondary drop-shadow-glow-cyan font-bold">
                    {currentTemp}°C
                  </div>
                  <div className="text-[10px] font-mono text-outline uppercase">{currentCondition}</div>
                </div>
              </section>
            </div>

          </div>

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
                  <h3 className="font-data-mono text-data-mono text-on-surface mb-1 font-bold">CONSTELLATION & WEATHER STATUS</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-primary-container/20 text-primary-container px-2 py-0.5 rounded-sm font-label-caps text-label-caps text-[10px] border border-primary-container/50 font-bold">
                      NASA GPM CORE: 616 HDF5 FILES
                    </span>
                    <span className="bg-surface-container-high text-outline px-2 py-0.5 rounded-sm font-label-caps text-label-caps text-[10px] border border-outline-variant font-bold">
                      OPEN-METEO: LIVE CHENNAI
                    </span>
                    <span className="bg-surface-container-high text-primary-container px-2 py-0.5 rounded-sm font-label-caps text-label-caps text-[10px] border border-outline-variant font-bold">
                      FIRESTORE: {weatherData?.firebase_sync?.firestore_connected ? 'CONNECTED' : 'LOCAL CACHE'}
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
          © 2026 HYDROCAST INTELLIGENCE. METEOROLOGY: OPEN-METEO // SATELLITE: NASA IMERG // DRAINAGE: GCC SWD (10,280 FEATURES) // HYDROGRAPHY: OSM.
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

