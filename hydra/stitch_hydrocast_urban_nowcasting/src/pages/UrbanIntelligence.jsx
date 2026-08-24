import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export const UrbanIntelligence = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [selectedStation, setSelectedStation] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [systemStats, setSystemStats] = useState(null);
  const [reservoirsData, setReservoirsData] = useState(null);
  const [drainCountData, setDrainCountData] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getWeather(),
      api.getSystemStatus(),
      api.getReservoirs(),
      api.getDrainCount()
    ]).then(([w, s, res, drains]) => {
      if (w) setWeatherData(w);
      if (s) setSystemStats(s);
      if (res) setReservoirsData(res);
      if (drains) setDrainCountData(drains);
    }).catch(e => console.warn('[UrbanIntelligence] Error loading telemetry:', e));
  }, []);

  // Infrastructure SCADA nodes combined with live Reservoir and Drain data
  const baseNodes = [
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

  // Map real Chennai reservoirs into the node matrix
  const reservoirNodes = (reservoirsData?.reservoirs || []).map((r, i) => ({
    id: `RES-CHN-0${i + 1}`,
    name: r.full_name || `${r.name} Reservoir`,
    type: 'Reservoir',
    location: `${r.basin} Basin Catchment`,
    capacity: `${r.capacity_mcft.toLocaleString()} mcft Capacity`,
    load: Math.round(r.storage_percentage),
    status: r.status.toUpperCase(),
    statusColor: r.storage_percentage > 80 ? '#ff4d4d' : (r.storage_percentage > 60 ? '#ffaa00' : '#4edea3'),
    pumpsOnline: `Basin: ${r.basin}`,
    sluiceState: `${r.current_level_mcft.toLocaleString()} mcft Stored`,
    telemetry: `${r.storage_percentage}% Storage Filled`,
    lastPing: 'Telemetry Active',
    isRealDataset: true,
    raw: r
  }));

  const allInfrastructureNodes = [...reservoirNodes, ...baseNodes];

  const filteredNodes = activeFilter === 'ALL' 
    ? allInfrastructureNodes 
    : allInfrastructureNodes.filter(n => n.type.toUpperCase().includes(activeFilter.toUpperCase()));

  const currTemp = weatherData?.current?.temperature_celsius ?? 26.2;
  const currPrecip = weatherData?.current?.precipitation_mm ?? 0.0;
  const currCond = weatherData?.current?.weather_condition ?? 'Overcast';

  // Real stats
  const totalDrainsCount = drainCountData?.total_features_loaded || 2000;
  const totalDrainKm = drainCountData?.total_network_length_km || 429.16;
  const obstaclePct = drainCountData?.obstacle_percentage || 44.5;
  const totalResCapacity = reservoirsData?.total_capacity_mcft || 13213;
  const totalResLevel = reservoirsData?.total_current_storage_mcft || 8420;
  const avgResFill = reservoirsData?.average_storage_percentage || 63.7;

  // Handle GeoJSON File Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus(null);
    try {
      const res = await api.uploadDrainsGeoJSON(file);
      setUploadStatus({
        success: true,
        message: `Successfully ingested ${res.features_ingested || 'new'} drain features (${res.total_length_km || 'N/A'} km).`
      });
      // Refresh count
      const updatedCount = await api.getDrainCount();
      if (updatedCount) setDrainCountData(updatedCount);
    } catch (err) {
      setUploadStatus({
        success: false,
        message: err.message || 'Failed to upload GeoJSON file.'
      });
    } finally {
      setIsUploading(false);
    }
  };

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
              SCADA Drainage Mesh Telemetry // {totalDrainsCount.toLocaleString()} GCC SWD Segments ({totalDrainKm} km) // Open-Meteo: {currTemp}°C ({currCond})
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 bg-surface-container-low p-1.5 rounded-lg border border-outline-variant/30 font-label-caps text-label-caps overflow-x-auto">
            {['ALL', 'RESERVOIR', 'PUMP', 'SLUICE', 'SENSOR'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3.5 py-1.5 rounded font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
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
            <span className="font-label-caps text-label-caps text-outline block mb-2 font-bold">TOTAL RESERVOIR STORAGE</span>
            <div className="font-display-lg text-3xl text-primary-container font-bold font-sora">
              {totalResLevel.toLocaleString()} <span className="text-sm font-data-mono text-outline font-normal">/ {totalResCapacity.toLocaleString()} mcft</span>
            </div>
            <div className="text-[11px] font-data-mono text-primary-fixed-dim mt-2">{avgResFill}% 5 Major Reservoirs Filled</div>
          </div>

          <div className="bg-surface-container-low/80 backdrop-blur-xl border border-outline-variant/30 rounded-xl p-5 border-t-2 border-t-secondary shadow-xl">
            <span className="font-label-caps text-label-caps text-outline block mb-2 font-bold">GCC DRAIN NETWORK</span>
            <div className="font-display-lg text-3xl text-secondary font-bold font-sora">
              {totalDrainKm} <span className="text-sm font-data-mono text-outline font-normal">km</span>
            </div>
            <div className="text-[11px] font-data-mono text-secondary mt-2">{totalDrainsCount.toLocaleString()} Segments | {obstaclePct}% Obstacles</div>
          </div>

          <div className="bg-surface-container-low/80 backdrop-blur-xl border border-outline-variant/30 rounded-xl p-5 border-t-2 border-t-warning-orange shadow-xl">
            <span className="font-label-caps text-label-caps text-outline block mb-2 font-bold">LIVE WEATHER FORCING</span>
            <div className="font-display-lg text-3xl text-warning-orange font-bold font-sora">
              {currTemp}°C <span className="text-sm font-data-mono text-outline font-normal">/ {currPrecip} mm</span>
            </div>
            <div className="text-[11px] font-data-mono text-warning-orange mt-2">Open-Meteo: {currCond}</div>
          </div>

          <div className="bg-surface-container-low/80 backdrop-blur-xl border border-outline-variant/30 rounded-xl p-5 border-t-2 border-t-safe-green shadow-xl">
            <span className="font-label-caps text-label-caps text-outline block mb-2 font-bold">SCADA &amp; FIRESTORE SYNC</span>
            <div className="font-display-lg text-3xl text-safe-green font-bold font-sora">
              ONLINE <span className="text-sm font-data-mono text-outline font-normal">(hydra-1963e)</span>
            </div>
            <div className="text-[11px] font-data-mono text-safe-green mt-2">15-Min Cadence Active</div>
          </div>
        </div>

        {/* Chennai Major Reservoirs Real-time Bar Status Section */}
        {reservoirsData && reservoirsData.reservoirs && (
          <div className="bg-surface-container-low/80 backdrop-blur-xl border border-outline-variant/30 rounded-xl p-6 mb-8 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="font-label-caps text-label-caps text-primary-container font-bold">CHENNAI MAJOR RESERVOIRS TELEMETRY</span>
                <p className="font-data-mono text-xs text-outline mt-0.5">Real-time water levels &amp; storage capacities from Chennai Metrowater observation telemetry</p>
              </div>
              <button 
                onClick={() => navigate('/intelligence-map')}
                className="font-mono text-xs text-primary-container hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View on GIS Map</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {reservoirsData.reservoirs.map((res) => (
                <div key={res.name} className="bg-surface-container p-4 rounded-lg border border-outline-variant/20 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs font-bold text-primary-container">{res.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-container-highest text-outline">{res.basin}</span>
                    </div>
                    <div className="font-sora text-sm text-on-surface font-semibold mt-1 truncate" title={res.full_name}>{res.full_name}</div>
                    
                    <div className="mt-3">
                      <div className="flex justify-between text-[11px] font-mono mb-1">
                        <span className="text-outline">Storage</span>
                        <strong className="text-on-surface">{res.storage_percentage}%</strong>
                      </div>
                      <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${res.storage_percentage}%`, 
                            backgroundColor: res.storage_percentage > 80 ? '#ff4d4d' : (res.storage_percentage > 60 ? '#ffaa00' : '#00f2ff'),
                            boxShadow: `0 0 8px ${res.storage_percentage > 80 ? '#ff4d4d' : '#00f2ff'}`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-outline-variant/20 text-[10px] font-mono flex justify-between text-outline">
                    <span>{res.current_level_mcft.toLocaleString()} mcft</span>
                    <span>Cap: {res.capacity_mcft.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
                  <span className="text-outline">Storage / Utilization</span>
                  <span className="font-bold" style={{ color: node.statusColor }}>{node.load}%</span>
                </div>
                <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, node.load)}%`, backgroundColor: node.statusColor, boxShadow: `0 0 8px ${node.statusColor}` }}
                  ></div>
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-3 gap-2 bg-surface-container p-3 rounded-lg border border-outline-variant/20 text-xs font-data-mono">
                <div>
                  <span className="text-outline text-[10px] block">RATED CAPACITY</span>
                  <span className="text-on-surface font-semibold truncate block">{node.capacity}</span>
                </div>
                <div>
                  <span className="text-outline text-[10px] block">SYSTEM METRIC</span>
                  <span className="text-primary-container font-semibold truncate block">{node.pumpsOnline}</span>
                </div>
                <div>
                  <span className="text-outline text-[10px] block">LIVE STATE</span>
                  <span className="text-on-surface font-semibold truncate block">{node.telemetry}</span>
                </div>
              </div>

              <div className="mt-4 flex justify-between items-center text-xs font-data-mono text-outline">
                <span>STAGE: <strong className="text-on-surface">{node.sluiceState}</strong></span>
                <span>STATUS: {node.lastPing}</span>
              </div>
            </div>
          ))}
        </div>

        {/* GCC Drainage GeoJSON Ingestion Card */}
        <div className="bg-surface-container-low/80 backdrop-blur-xl border border-outline-variant/30 rounded-xl p-6 shadow-2xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="font-label-caps text-label-caps text-secondary font-bold">GCC STORM WATER DRAINAGE INGESTION</span>
              <h3 className="font-sora text-lg text-on-surface font-bold mt-1">Upload Updated Municipal Drain GeoJSON</h3>
              <p className="font-data-mono text-xs text-outline mt-1">
                Ingest updated ArcGIS / GeoJSON shapefiles directly into the HydroCast live spatial graph.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="bg-primary-container/20 border border-primary-container text-primary-container hover:bg-primary-container hover:text-absolute-black px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">upload_file</span>
                <span>{isUploading ? 'Uploading...' : 'Upload GeoJSON'}</span>
                <input 
                  type="file" 
                  accept=".geojson,.json" 
                  onChange={handleFileUpload} 
                  disabled={isUploading}
                  className="hidden" 
                />
              </label>
            </div>
          </div>

          {uploadStatus && (
            <div className={`mt-4 p-3 rounded-lg border font-mono text-xs ${
              uploadStatus.success 
                ? 'bg-safe-green/10 border-safe-green/30 text-safe-green' 
                : 'bg-error/10 border-error/30 text-error'
            }`}>
              {uploadStatus.message}
            </div>
          )}
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
                  className="text-outline hover:text-on-surface cursor-pointer p-1"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div className="p-3 bg-surface-container rounded-lg border border-outline-variant/30 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-outline">Facility Type:</span>
                    <span className="text-on-surface font-semibold">{selectedStation.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">Rated Capacity:</span>
                    <span className="text-primary-container font-semibold">{selectedStation.capacity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">Operational Stage:</span>
                    <span className="text-on-surface font-semibold">{selectedStation.telemetry}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">Status Level:</span>
                    <span className="font-bold" style={{ color: selectedStation.statusColor }}>{selectedStation.status} ({selectedStation.load}%)</span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button 
                    onClick={() => setSelectedStation(null)}
                    className="px-4 py-2 rounded-lg bg-surface-container text-on-surface font-mono text-xs hover:bg-surface-container-high transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedStation(null);
                      navigate('/intelligence-map');
                    }}
                    className="px-4 py-2 rounded-lg bg-primary-container text-absolute-black font-mono text-xs font-bold hover:bg-primary transition-colors cursor-pointer shadow-[0_0_15px_rgba(0,242,255,0.4)]"
                  >
                    Inspect in GIS Matrix
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
