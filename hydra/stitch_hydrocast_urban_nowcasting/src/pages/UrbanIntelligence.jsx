import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export const UrbanIntelligence = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [selectedStation, setSelectedStation] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [systemStats, setSystemStats] = useState(null);

  useEffect(() => {
    Promise.all([
      api.getWeather(),
      api.getSystemStatus()
    ]).then(([w, s]) => {
      if (w) setWeatherData(w);
      if (s) setSystemStats(s);
    }).catch(e => console.warn('[UrbanIntelligence] Error loading telemetry:', e));
  }, []);

  const infrastructureNodes = [
    {
      id: 'PS-CHN-01',
      name: 'Central Basin Main Pumping Station',
      type: 'Pump Station',
      location: 'Downtown Basin Core',
      capacity: '120,000 L/min',
      load: 88,
      status: 'HIGH LOAD',
      statusColor: '#ffaa00',
      pumpsOnline: '5 / 6 Online',
      sluiceState: 'Open 85%',
      telemetry: '48 cm Water Depth',
      lastPing: '1s ago'
    },
    {
      id: 'SG-RIV-04',
      name: 'Riverside Automated Sluice Gate 04',
      type: 'Sluice Gate',
      location: 'Riverside Parkway Weir',
      capacity: '65,000 L/s',
      load: 94,
      status: 'CRITICAL',
      statusColor: '#ff4d4d',
      pumpsOnline: 'Emergency Divert Engaged',
      sluiceState: 'Open 100%',
      telemetry: '36 cm Overflow Stage',
      lastPing: 'Just now'
    },
    {
      id: 'SN-CAN-12',
      name: 'East Canal Culvert Ultrasonic Node',
      type: 'Sensor Mesh',
      location: 'East Industrial Trunk',
      capacity: 'Flow: 3.8 m/s',
      load: 62,
      status: 'WARNING',
      statusColor: '#ffaa00',
      pumpsOnline: 'Passive Flow Monitor',
      sluiceState: 'Culvert Clear',
      telemetry: '22 cm Runoff',
      lastPing: '2s ago'
    },
    {
      id: 'PS-PLT-08',
      name: 'South Plateau Gravity Retention Sump',
      type: 'Pump Station',
      location: 'South Residential Basin',
      capacity: '45,000 L/min',
      load: 18,
      status: 'NOMINAL',
      statusColor: '#4edea3',
      pumpsOnline: '1 / 4 Online',
      sluiceState: 'Nominal Gravity Drain',
      telemetry: '3 cm Normal Stage',
      lastPing: '1s ago'
    }
  ];

  const filteredNodes = activeFilter === 'ALL' 
    ? infrastructureNodes 
    : infrastructureNodes.filter(n => n.type.toUpperCase().includes(activeFilter));

  const currTemp = weatherData?.current?.temperature_celsius ?? 26.2;
  const currPrecip = weatherData?.current?.precipitation_mm ?? 0.0;
  const currCond = weatherData?.current?.weather_condition ?? 'Overcast';

  return (
    <div className="bg-absolute-black text-on-surface font-body-md antialiased min-h-screen flex flex-col pt-[72px]">
      
      {/* Background Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, #004f54 0%, transparent 60%)' }}></div>

      <main className="flex-1 px-margin-mobile md:px-margin-desktop py-8 max-w-[1440px] mx-auto w-full relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary-container text-3xl">domain</span>
              <h1 className="font-headline-lg text-primary font-bold tracking-tight">
                URBAN INFRASTRUCTURE INTELLIGENCE
              </h1>
            </div>
            <p className="font-data-mono text-data-mono text-outline mt-2">
              SCADA Drainage Mesh Telemetry // 10,280 GCC SWD Segments // Open-Meteo: {currTemp}°C ({currCond})
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 bg-surface-container-low p-1.5 rounded-lg border border-outline-variant/30 font-label-caps text-label-caps">
            {['ALL', 'PUMP', 'SLUICE', 'SENSOR'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-1.5 rounded font-bold transition-all cursor-pointer ${
                  activeFilter === filter
                    ? 'bg-primary-container text-absolute-black shadow-[0_0_10px_rgba(0,242,255,0.4)]'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Top KPI Metrics Bento */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-8">
          <div className="bg-surface-container-low/80 backdrop-blur-xl border border-outline-variant/30 rounded-xl p-5 border-t-2 border-t-primary-container shadow-xl">
            <span className="font-label-caps text-label-caps text-outline block mb-2 font-bold">TOTAL PUMP CAPACITY</span>
            <div className="font-display-lg text-3xl text-primary-container font-bold font-sora">
              230K <span className="text-sm font-data-mono text-outline font-normal">L/min</span>
            </div>
            <div className="text-[11px] font-data-mono text-primary-fixed-dim mt-2">84% Aggregate Utilization</div>
          </div>

          <div className="bg-surface-container-low/80 backdrop-blur-xl border border-outline-variant/30 rounded-xl p-5 border-t-2 border-t-error shadow-xl">
            <span className="font-label-caps text-label-caps text-outline block mb-2 font-bold">ACTIVE SLUICE SURCHARGES</span>
            <div className="font-display-lg text-3xl text-error font-bold font-sora">
              02 <span className="text-sm font-data-mono text-outline font-normal">Gates Engaged</span>
            </div>
            <div className="text-[11px] font-data-mono text-error mt-2">Riverside &amp; Central Sluices</div>
          </div>

          <div className="bg-surface-container-low/80 backdrop-blur-xl border border-outline-variant/30 rounded-xl p-5 border-t-2 border-t-warning-orange shadow-xl">
            <span className="font-label-caps text-label-caps text-outline block mb-2 font-bold">LIVE WEATHER FORCING</span>
            <div className="font-display-lg text-3xl text-warning-orange font-bold font-sora">
              {currTemp}°C <span className="text-sm font-data-mono text-outline font-normal">/ {currPrecip} mm</span>
            </div>
            <div className="text-[11px] font-data-mono text-warning-orange mt-2">Open-Meteo: {currCond}</div>
          </div>

          <div className="bg-surface-container-low/80 backdrop-blur-xl border border-outline-variant/30 rounded-xl p-5 border-t-2 border-t-safe-green shadow-xl">
            <span className="font-label-caps text-label-caps text-outline block mb-2 font-bold">SCADA TELEMETRY SYNC</span>
            <div className="font-display-lg text-3xl text-safe-green font-bold font-sora">
              99.8<span className="text-sm font-data-mono text-outline font-normal">%</span>
            </div>
            <div className="text-[11px] font-data-mono text-safe-green mt-2">All 142 Nodes Responding</div>
          </div>
        </div>


        {/* Nodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter mb-8">
          {filteredNodes.map((node) => (
            <div 
              key={node.id}
              onClick={() => setSelectedStation(node)}
              className="bg-surface-container-low/80 backdrop-blur-xl border border-outline-variant/30 rounded-xl p-6 hover:border-primary-container/60 hover:bg-surface-container/60 transition-all cursor-pointer group shadow-2xl relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-data-mono text-xs text-primary-container font-bold bg-primary-container/10 px-2 py-0.5 rounded border border-primary-container/30">
                      {node.id}
                    </span>
                    <span className="font-data-mono text-xs text-outline font-semibold">{node.type}</span>
                  </div>
                  <h3 className="font-sora text-lg text-on-surface font-bold mt-2 group-hover:text-primary-container transition-colors">
                    {node.name}
                  </h3>
                  <p className="font-data-mono text-xs text-outline mt-0.5">{node.location}</p>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold font-mono" style={{ color: node.statusColor, borderColor: `${node.statusColor}50`, backgroundColor: `${node.statusColor}15` }}>
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: node.statusColor }}></span>
                  {node.status}
                </div>
              </div>

              {/* Progress Bar for Station Load */}
              <div className="mb-4">
                <div className="flex justify-between text-xs font-data-mono mb-1">
                  <span className="text-outline">Station Load / Capacity</span>
                  <span className="font-bold" style={{ color: node.statusColor }}>{node.load}%</span>
                </div>
                <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ width: `${node.load}%`, backgroundColor: node.statusColor, boxShadow: `0 0 8px ${node.statusColor}` }}
                  ></div>
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-3 gap-2 bg-surface-container p-3 rounded-lg border border-outline-variant/20 text-xs font-data-mono">
                <div>
                  <span className="text-outline text-[10px] block">RATED CAPACITY</span>
                  <span className="text-on-surface font-semibold">{node.capacity}</span>
                </div>
                <div>
                  <span className="text-outline text-[10px] block">PUMP STATUS</span>
                  <span className="text-primary-container font-semibold">{node.pumpsOnline}</span>
                </div>
                <div>
                  <span className="text-outline text-[10px] block">LIVE WATER DEPTH</span>
                  <span className="text-on-surface font-semibold">{node.telemetry}</span>
                </div>
              </div>

              <div className="mt-4 flex justify-between items-center text-xs font-data-mono text-outline">
                <span>SLUICE: <strong className="text-on-surface">{node.sluiceState}</strong></span>
                <span>PING: {node.lastPing}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Modal for Station Detail */}
        {selectedStation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-absolute-black/80 backdrop-blur-md">
            <div className="w-full max-w-xl bg-surface-container-lowest border border-primary-container/50 rounded-2xl p-6 shadow-[0_0_40px_rgba(0,242,255,0.3)]">
              <div className="flex justify-between items-start border-b border-outline-variant/30 pb-4 mb-4">
                <div>
                  <span className="font-mono text-xs text-primary-container font-bold">{selectedStation.id}</span>
                  <h2 className="font-sora text-xl font-bold text-on-surface mt-1">{selectedStation.name}</h2>
                  <p className="font-mono text-xs text-outline">{selectedStation.location}</p>
                </div>
                <button 
                  onClick={() => setSelectedStation(null)}
                  className="text-outline hover:text-on-surface cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div className="p-3 bg-surface-container rounded-lg border border-outline-variant/30 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-outline">Station Status:</span>
                    <span className="font-bold" style={{ color: selectedStation.statusColor }}>{selectedStation.status} ({selectedStation.load}% Load)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">Sluice Gate Position:</span>
                    <span className="text-on-surface">{selectedStation.sluiceState}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">Telemetry Reading:</span>
                    <span className="text-primary-container font-bold">{selectedStation.telemetry}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      setSelectedStation(null);
                      navigate(`/intelligence-map?q=${encodeURIComponent(selectedStation.name)}`);
                    }}
                    className="flex-1 py-3 bg-primary-container text-absolute-black font-bold rounded font-sora text-xs hover:bg-primary transition-all cursor-pointer shadow-[0_0_15px_rgba(0,242,255,0.4)]"
                  >
                    VIEW ON GEOSPATIAL MAP
                  </button>
                  <button 
                    onClick={() => setSelectedStation(null)}
                    className="px-5 py-3 bg-surface-bright text-on-surface rounded font-mono text-xs hover:bg-surface-container-high cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="w-full py-8 border-t border-outline-variant/10 bg-absolute-black flex flex-col md:flex-row justify-between items-center px-margin-desktop gap-4 z-20 relative">
        <div className="font-label-caps text-on-surface opacity-80">
          © 2026 HYDROCAST INTELLIGENCE. SCADA URBAN TELEMETRY PROTOCOL.
        </div>
        <div className="flex gap-4">
          <span onClick={() => navigate('/protocol')} className="font-data-mono text-label-caps text-outline hover:text-on-surface hover:underline decoration-primary-container opacity-80 cursor-pointer">Protocol</span>
          <span onClick={() => navigate('/predictions')} className="font-data-mono text-label-caps text-outline hover:text-on-surface hover:underline decoration-primary-container opacity-80 cursor-pointer">AI Predictions</span>
          <span onClick={() => navigate('/intelligence-map')} className="font-data-mono text-label-caps text-outline hover:text-on-surface hover:underline decoration-primary-container opacity-80 cursor-pointer">GIS Map</span>
        </div>
      </footer>

    </div>
  );
};
