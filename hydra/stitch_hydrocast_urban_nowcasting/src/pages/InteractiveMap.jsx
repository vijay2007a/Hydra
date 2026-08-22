import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { InteractiveGeoMap } from '../components/Map/InteractiveGeoMap';
import { floodZonesGeoJSON } from '../data/geo/floodZones';

// Extensive Chennai location coordinates dictionary for rich map navigation
const CHENNAI_LOCATIONS = {
  'chennai': { name: 'Chennai Central Basin', coords: [13.0827, 80.2707], zoneId: 'ZONE-A12' },
  'velachery': { name: 'Velachery Lake Catchment', coords: [12.9780, 80.2210], zoneId: 'ZONE-A12' },
  'adyar': { name: 'Adyar River Corridor', coords: [13.0130, 80.2460], zoneId: 'ZONE-B04' },
  'kotturpuram': { name: 'Kotturpuram Sluice Sector', coords: [13.0160, 80.2400], zoneId: 'ZONE-B04' },
  'saidapet': { name: 'Saidapet Bridge Riverway', coords: [13.0200, 80.2250], zoneId: 'ZONE-B04' },
  'pallikaranai': { name: 'Pallikaranai Wetland Marsh', coords: [12.9360, 80.2160], zoneId: 'ZONE-C18' },
  't nagar': { name: 'T. Nagar Usman Road District', coords: [13.0418, 80.2341], zoneId: 'ZONE-D07' },
  't. nagar': { name: 'T. Nagar Commercial Basin', coords: [13.0418, 80.2341], zoneId: 'ZONE-D07' },
  'guindy': { name: 'Guindy Industrial Plateau', coords: [13.0067, 80.2025], zoneId: 'ZONE-E02' },
  'anna nagar': { name: 'Anna Nagar Storm Basin', coords: [13.0850, 80.2100], zoneId: 'ZONE-D07' },
  'mylapore': { name: 'Mylapore Heritage Ward', coords: [13.0330, 80.2680], zoneId: 'ZONE-B04' },
  'nungambakkam': { name: 'Nungambakkam Canal Sector', coords: [13.0600, 80.2400], zoneId: 'ZONE-D07' },
  'tambaram': { name: 'Tambaram Retention Catchment', coords: [12.9249, 80.1000], zoneId: 'ZONE-C18' },
  'madipakkam': { name: 'Madipakkam Lake Basin', coords: [12.9620, 80.1980], zoneId: 'ZONE-A12' },
  'sholinganallur': { name: 'Sholinganallur IT Floodway', coords: [12.9010, 80.2279], zoneId: 'ZONE-C18' },
  'ambattur': { name: 'Ambattur Industrial Catchment', coords: [13.1143, 80.1548], zoneId: 'ZONE-D07' },
  'perambur': { name: 'Perambur Low-Lying Ward', coords: [13.1100, 80.2330], zoneId: 'ZONE-D07' }
};

export const InteractiveMap = () => {
  const [searchParams] = useSearchParams();

  // Active Target Zone State (Defaults to Chennai Zone A12 - Velachery)
  const defaultZone = floodZonesGeoJSON.features[0].properties;
  const [selectedZone, setSelectedZone] = useState(defaultZone);

  // Layer Visibility States (matching Stitch 5 active toggles)
  const [layers, setLayers] = useState({
    rainfall: true,
    riskZones: true,
    drainage: true,
    waterBodies: true,
    historical: false,
  });

  // Search States
  const [locationSearch, setLocationSearch] = useState(searchParams.get('q') || '');
  const [drainageSearch, setDrainageSearch] = useState('');

  // Map Controls State (connected to Leaflet map engine)
  const [zoomAction, setZoomAction] = useState(null);
  const [flyToLocation, setFlyToLocation] = useState(null);

  // Time scrubber state (0 to 100%, 66% = LIVE: T-0)
  const [scrubberPos, setScrubberPos] = useState(66);
  const [activeTimeLabel, setActiveTimeLabel] = useState('LIVE: T-0');
  const [timelineState, setTimelineState] = useState('NOW');

  // Right Panel State
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [evacInitiated, setEvacInitiated] = useState(false);

  // Handle URL query parameter search on load
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      handleLocationSearchSubmit(q);
    }
  }, [searchParams]);

  const toggleLayer = (key) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleZoomIn = () => {
    setZoomAction('in');
    setTimeout(() => setZoomAction(null), 100);
  };

  const handleZoomOut = () => {
    setZoomAction('out');
    setTimeout(() => setZoomAction(null), 100);
  };

  const handleSelectZone = (zoneProps) => {
    setSelectedZone(zoneProps);
    setRightPanelOpen(true);
    setEvacInitiated(false);
    if (zoneProps.center) {
      setFlyToLocation([...zoneProps.center]);
    }
  };

  const handleLocationSearchSubmit = (query) => {
    const term = (query || locationSearch).toLowerCase().trim();
    if (!term) return;

    // Check direct Chennai location dictionary
    if (CHENNAI_LOCATIONS[term]) {
      const loc = CHENNAI_LOCATIONS[term];
      setFlyToLocation([...loc.coords]);
      const matchedZone = floodZonesGeoJSON.features.find(f => f.properties.id === loc.zoneId);
      if (matchedZone) {
        setSelectedZone(matchedZone.properties);
        setRightPanelOpen(true);
      }
      return;
    }

    // Check fuzzy match on flood zones
    const matched = floodZonesGeoJSON.features.find(f => 
      f.properties.name.toLowerCase().includes(term) ||
      f.properties.category.toLowerCase().includes(term) ||
      f.properties.location.toLowerCase().includes(term) ||
      f.properties.id.toLowerCase().includes(term)
    );

    if (matched) {
      handleSelectZone(matched.properties);
      return;
    }

    // Default to Chennai Central coordinates if general query
    if (term.includes('chennai')) {
      setFlyToLocation([13.0827, 80.2707]);
    }
  };

  const handleTimelineClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    setScrubberPos(percentage);

    if (percentage < 25) {
      setActiveTimeLabel('PAST: -24H');
      setTimelineState('PAST');
    } else if (percentage < 55) {
      setActiveTimeLabel('PAST: -12H');
      setTimelineState('PAST');
    } else if (percentage >= 55 && percentage <= 75) {
      setActiveTimeLabel('LIVE: T-0');
      setTimelineState('NOW');
    } else if (percentage < 90) {
      setActiveTimeLabel('FORECAST: +6H');
      setTimelineState('FUTURE');
    } else {
      setActiveTimeLabel('FORECAST: +12H');
      setTimelineState('FUTURE');
    }
  };

  const activeLayerCount = Object.values(layers).filter(Boolean).length;

  return (
    <main className="relative flex-1 mt-[72px] w-full h-[calc(100vh-72px)] overflow-hidden bg-absolute-black">
      
      {/* Real Interactive Leaflet GIS Map Engine Layer */}
      <div className="absolute inset-0 z-0">
        <InteractiveGeoMap 
          layers={layers}
          selectedZone={selectedZone}
          onSelectZone={handleSelectZone}
          zoomAction={zoomAction}
          flyToLocation={flyToLocation}
          timelineState={timelineState}
        />
      </div>

      {/* Floating UI Overlays (Pointer events none on container, auto on interactive cards) */}
      <div className="absolute inset-0 z-20 pointer-events-none flex justify-between p-gutter">
        
        {/* Left Floating Panel: Controls & Layers */}
        <aside className="w-80 flex flex-col gap-gutter pointer-events-auto">
          
          {/* Locate Target Card */}
          <div className="bg-surface-container-lowest/80 backdrop-blur-xl border border-outline-variant/30 rounded-xl p-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary-container to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -translate-x-full group-hover:translate-x-full ease-in-out"></div>
            
            <h2 className="font-headline-lg-mobile text-on-surface mb-4 flex items-center gap-2 font-bold">
              <span className="material-symbols-outlined text-primary-fixed-dim">my_location</span>
              Locate Target
            </h2>
            
            <div className="flex flex-col gap-4">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-sm">
                  search
                </span>
                <input 
                  value={locationSearch}
                  onChange={(e) => {
                    setLocationSearch(e.target.value);
                    handleLocationSearchSubmit(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleLocationSearchSubmit(locationSearch);
                  }}
                  className="w-full bg-absolute-black border border-outline-variant/50 text-on-surface font-data-mono text-data-mono rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-primary-container focus:shadow-[0_0_15px_rgba(0,242,255,0.2)] transition-all" 
                  placeholder="Search Chennai (Velachery, Adyar...)" 
                  type="text"
                />
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-sm">
                  water
                </span>
                <input 
                  value={drainageSearch}
                  onChange={(e) => {
                    setDrainageSearch(e.target.value);
                    if (e.target.value.toLowerCase().includes('adyar')) {
                      setFlyToLocation([13.0130, 80.2460]);
                    } else if (e.target.value.toLowerCase().includes('cooum')) {
                      setFlyToLocation([13.0720, 80.2550]);
                    } else if (e.target.value.toLowerCase().includes('buckingham')) {
                      setFlyToLocation([13.0150, 80.2680]);
                    }
                  }}
                  className="w-full bg-absolute-black border border-outline-variant/50 text-on-surface font-data-mono text-data-mono rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-primary-container focus:shadow-[0_0_15px_rgba(0,242,255,0.2)] transition-all" 
                  placeholder="Search drainage (Adyar, Cooum...)" 
                  type="text"
                />
              </div>
            </div>
          </div>

          {/* Telemetry Layers Card */}
          <div className="bg-surface-container-lowest/80 backdrop-blur-xl border border-outline-variant/30 rounded-xl p-6 shadow-2xl flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-headline-lg-mobile text-on-surface flex items-center gap-2 font-bold">
                <span className="material-symbols-outlined text-primary-fixed-dim">layers</span>
                Telemetry Layers
              </h2>
              <span className="font-data-mono text-label-caps text-outline bg-surface-container-high px-2 py-1 rounded font-bold">
                {activeLayerCount} ACTIVE
              </span>
            </div>
            
            <div className="flex flex-col gap-3">
              
              {/* Rainfall Data Toggle */}
              <label 
                onClick={() => toggleLayer('rainfall')}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all group ${
                  layers.rainfall 
                    ? 'bg-surface-container-low border-outline-variant/20 hover:bg-surface-bright/20 hover:border-primary-container/50' 
                    : 'bg-absolute-black border-outline-variant/20 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined ${layers.rainfall ? 'text-primary-container group-hover:drop-shadow-glow-cyan' : 'text-outline'} transition-all`}>
                    rainy
                  </span>
                  <span className={`font-data-mono ${layers.rainfall ? 'text-on-surface font-semibold' : 'text-outline group-hover:text-on-surface'}`}>
                    Rainfall Data
                  </span>
                </div>
                <div className={`relative w-10 h-5 rounded-full border transition-all ${
                  layers.rainfall ? 'bg-primary-container/20 border-primary-container/50' : 'bg-surface-container-high border-outline-variant/50'
                }`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
                    layers.rainfall 
                      ? 'right-1 bg-primary-container shadow-[0_0_8px_rgba(0,242,255,0.8)]' 
                      : 'left-1 bg-outline'
                  }`}></div>
                </div>
              </label>

              {/* Critical Risk Zones Toggle */}
              <label 
                onClick={() => toggleLayer('riskZones')}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all group ${
                  layers.riskZones 
                    ? 'bg-error-container/10 border-error/30 hover:bg-error-container/20' 
                    : 'bg-absolute-black border-outline-variant/20 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined ${layers.riskZones ? 'text-error shadow-error' : 'text-outline'} transition-all`}>
                    warning
                  </span>
                  <span className={`font-data-mono ${layers.riskZones ? 'text-error font-bold' : 'text-outline group-hover:text-on-surface'}`}>
                    Critical Risk Zones
                  </span>
                </div>
                <div className={`relative w-10 h-5 rounded-full border transition-all ${
                  layers.riskZones ? 'bg-error/20 border-error/50' : 'bg-surface-container-high border-outline-variant/50'
                }`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
                    layers.riskZones 
                      ? 'right-1 bg-error shadow-[0_0_8px_rgba(255,180,171,0.8)]' 
                      : 'left-1 bg-outline'
                  }`}></div>
                </div>
              </label>

              {/* Drainage Network Toggle */}
              <label 
                onClick={() => toggleLayer('drainage')}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all group ${
                  layers.drainage 
                    ? 'bg-surface-container-low border-outline-variant/20 hover:bg-surface-bright/20 hover:border-primary-container/50' 
                    : 'bg-absolute-black border-outline-variant/20 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined ${layers.drainage ? 'text-primary-container group-hover:drop-shadow-glow-cyan' : 'text-outline'} transition-all`}>
                    account_tree
                  </span>
                  <span className={`font-data-mono ${layers.drainage ? 'text-on-surface font-semibold' : 'text-outline group-hover:text-on-surface'}`}>
                    Drainage Network
                  </span>
                </div>
                <div className={`relative w-10 h-5 rounded-full border transition-all ${
                  layers.drainage ? 'bg-primary-container/20 border-primary-container/50' : 'bg-surface-container-high border-outline-variant/50'
                }`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
                    layers.drainage 
                      ? 'right-1 bg-primary-container shadow-[0_0_8px_rgba(0,242,255,0.8)]' 
                      : 'left-1 bg-outline'
                  }`}></div>
                </div>
              </label>

              {/* Water Bodies Toggle */}
              <label 
                onClick={() => toggleLayer('waterBodies')}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all group ${
                  layers.waterBodies 
                    ? 'bg-surface-container-low border-outline-variant/20 hover:bg-surface-bright/20 hover:border-primary-container/50' 
                    : 'bg-absolute-black border-outline-variant/20 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined ${layers.waterBodies ? 'text-primary-container group-hover:drop-shadow-glow-cyan' : 'text-outline'} transition-all`}>
                    water
                  </span>
                  <span className={`font-data-mono ${layers.waterBodies ? 'text-on-surface font-semibold' : 'text-outline group-hover:text-on-surface'}`}>
                    Water Bodies
                  </span>
                </div>
                <div className={`relative w-10 h-5 rounded-full border transition-all ${
                  layers.waterBodies ? 'bg-primary-container/20 border-primary-container/50' : 'bg-surface-container-high border-outline-variant/50'
                }`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
                    layers.waterBodies 
                      ? 'right-1 bg-primary-container shadow-[0_0_8px_rgba(0,242,255,0.8)]' 
                      : 'left-1 bg-outline'
                  }`}></div>
                </div>
              </label>

              {/* Historical Overlay Toggle */}
              <label 
                onClick={() => toggleLayer('historical')}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all group ${
                  layers.historical 
                    ? 'bg-surface-container-low border-outline-variant/20 hover:bg-surface-bright/20 hover:border-primary-container/50' 
                    : 'bg-absolute-black border-outline-variant/20 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined ${layers.historical ? 'text-secondary-container' : 'text-outline'}`}>
                    history
                  </span>
                  <span className={`font-data-mono ${layers.historical ? 'text-on-surface font-semibold' : 'text-outline group-hover:text-on-surface'}`}>
                    Historical Overlay
                  </span>
                </div>
                <div className={`relative w-10 h-5 rounded-full border transition-all ${
                  layers.historical ? 'bg-secondary-container/20 border-secondary-container/50' : 'bg-surface-container-high border-outline-variant/50'
                }`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
                    layers.historical 
                      ? 'right-1 bg-secondary-container shadow-[0_0_8px_rgba(206,93,255,0.8)]' 
                      : 'left-1 bg-outline'
                  }`}></div>
                </div>
              </label>

            </div>
          </div>
        </aside>

        {/* Right Floating Panel: Selected Area Details */}
        {rightPanelOpen ? (
          <aside className="w-96 flex flex-col pointer-events-auto self-start">
            <div className="bg-surface-container-lowest/80 backdrop-blur-xl border border-outline-variant/30 rounded-xl shadow-2xl overflow-hidden">
              
              {/* Header */}
              <div className="p-6 border-b border-outline-variant/30 bg-gradient-to-b from-error-container/20 to-transparent">
                <div className="flex justify-between items-start mb-2">
                  <div className={`font-label-caps px-2 py-1 rounded border tracking-widest inline-flex items-center gap-1.5 font-bold ${
                    selectedZone.riskLevel === 'CRITICAL' ? 'text-error bg-error/10 border-error/30' :
                    selectedZone.riskLevel === 'WARNING' ? 'text-warning-orange bg-warning-orange/10 border-warning-orange/30' :
                    'text-safe-green bg-safe-green/10 border-safe-green/30'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      selectedZone.riskLevel === 'CRITICAL' ? 'bg-error animate-pulse' :
                      selectedZone.riskLevel === 'WARNING' ? 'bg-warning-orange' : 'bg-safe-green'
                    }`}></span>
                    ACTIVE TARGET
                  </div>
                  <button 
                    onClick={() => setRightPanelOpen(false)}
                    className="text-outline hover:text-on-surface transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>

                <h1 className="font-headline-lg text-on-surface font-bold">{selectedZone.name}</h1>
                <p className="font-data-mono text-primary-container text-xs font-semibold mt-0.5">{selectedZone.location}</p>
                <p className="font-data-mono text-outline mt-1 text-xs">Coordinates: {selectedZone.coordinates}</p>
              </div>

              {/* Telemetry Data */}
              <div className="p-6 flex flex-col gap-5">
                
                {/* Primary Metric: Flood Probability */}
                <div className="flex flex-col gap-1">
                  <span className="font-data-mono text-label-caps text-outline font-bold">FLOOD PROBABILITY</span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display-lg text-error drop-shadow-[0_0_15px_rgba(255,180,171,0.5)] font-bold">
                      {selectedZone.floodProbability}%
                    </span>
                    <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>
                      trending_up
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-surface-container-highest rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full bg-error shadow-[0_0_10px_rgba(255,180,171,1)] transition-all duration-500" 
                      style={{ width: `${selectedZone.floodProbability}%` }}
                    ></div>
                  </div>
                </div>

                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-outline-variant/50 to-transparent"></div>

                {/* Secondary Metric: Expected Onset */}
                <div className="flex flex-col gap-1">
                  <span className="font-data-mono text-label-caps text-outline font-bold">EXPECTED ONSET</span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-headline-lg text-warning-orange drop-shadow-[0_0_10px_rgba(255,170,0,0.5)] font-bold">
                      {selectedZone.expectedOnset.replace(' mins', '')}
                    </span>
                    <span className="font-data-mono text-outline">
                      {selectedZone.expectedOnset.includes('mins') ? 'mins' : ''}
                    </span>
                  </div>
                </div>

                {/* Tertiary Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface-container-low p-3 rounded border border-outline-variant/20">
                    <span className="block font-data-mono text-label-caps text-outline mb-1 font-bold">RAINFALL RATE</span>
                    <span className="font-data-mono text-on-surface text-base font-semibold">
                      {selectedZone.rainfallRate.replace(' mm/h', '')} <span className="text-xs text-outline font-normal">mm/h</span>
                    </span>
                  </div>
                  <div className="bg-surface-container-low p-3 rounded border border-outline-variant/20">
                    <span className="block font-data-mono text-label-caps text-outline mb-1 font-bold">DRAIN CAP</span>
                    <span className="font-data-mono text-error text-base font-semibold">
                      {selectedZone.drainCap}
                    </span>
                  </div>
                  <div className="bg-surface-container-low p-3 rounded border border-outline-variant/20 col-span-2">
                    <div className="flex justify-between items-center">
                      <span className="font-data-mono text-label-caps text-outline font-bold">WATER DEPTH</span>
                      <span className="font-data-mono text-primary-container text-base font-bold">{selectedZone.waterDepth}</span>
                    </div>
                  </div>
                </div>

                {/* Evacuation Alert Message if Active */}
                {evacInitiated && (
                  <div className="p-3 bg-error-container/30 border border-error/50 rounded-lg text-error font-mono text-xs animate-pulse">
                    ✓ EVACUATION DIRECTIVE BROADCASTED TO {selectedZone.name} ({selectedZone.location})
                  </div>
                )}

                {/* Action Button: Initiate Evacuation Protocol */}
                <button 
                  onClick={() => setEvacInitiated(true)}
                  className="w-full mt-1 bg-error text-absolute-black font-label-caps py-3 rounded hover:bg-error/90 hover:shadow-[0_0_20px_rgba(255,180,171,0.4)] transition-all active:scale-95 flex justify-center items-center gap-2 cursor-pointer font-bold"
                >
                  <span className="material-symbols-outlined text-sm">emergency_share</span>
                  {evacInitiated ? 'EVAC PROTOCOL ACTIVE' : 'INITIATE EVAC PROTOCOL'}
                </button>
              </div>
            </div>

            {/* Map Zoom Controls (Wired to Real Leaflet Map) */}
            <div className="mt-4 flex justify-end gap-2">
              <div className="bg-surface-container-lowest/80 backdrop-blur-xl border border-outline-variant/30 rounded-lg shadow-lg flex overflow-hidden">
                <button 
                  onClick={handleZoomIn}
                  className="p-2 text-outline hover:text-primary-container hover:bg-surface-bright/50 transition-colors border-r border-outline-variant/30 cursor-pointer"
                  title="Zoom In"
                >
                  <span className="material-symbols-outlined text-xl">add</span>
                </button>
                <button 
                  onClick={handleZoomOut}
                  className="p-2 text-outline hover:text-primary-container hover:bg-surface-bright/50 transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <span className="material-symbols-outlined text-xl">remove</span>
                </button>
              </div>
            </div>
          </aside>
        ) : (
          <aside className="pointer-events-auto self-start">
            <button
              onClick={() => setRightPanelOpen(true)}
              className="bg-surface-container-lowest/80 backdrop-blur-xl border border-outline-variant/30 text-primary-container p-3 rounded-xl shadow-2xl hover:bg-surface-bright/30 transition-all cursor-pointer flex items-center gap-2 font-mono text-xs font-bold"
            >
              <span className="material-symbols-outlined text-sm">open_in_new</span>
              Inspect {selectedZone.name} ({selectedZone.location})
            </button>
          </aside>
        )}

      </div>

      {/* Bottom Floating Panel: Time Slider */}
      <div className="absolute bottom-gutter left-1/2 -translate-x-1/2 w-full max-w-4xl z-20 pointer-events-auto px-gutter">
        <div className="bg-surface-container-lowest/90 backdrop-blur-2xl border border-outline-variant/40 rounded-xl p-4 shadow-[0_20px_40px_rgba(0,0,0,0.8)] flex flex-col gap-2">
          <div className="flex justify-between items-end px-2">
            <span className="font-data-mono text-label-caps text-outline font-bold">LAST 24H</span>
            <div className="font-data-mono text-primary-container bg-primary-container/10 px-3 py-1 rounded border border-primary-container/30 flex items-center gap-2 font-bold">
              <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
              {activeTimeLabel}
            </div>
            <span className="font-data-mono text-label-caps text-outline font-bold">FORECAST +12H</span>
          </div>

          {/* Custom Timeline Scrubber */}
          <div 
            onClick={handleTimelineClick}
            className="relative w-full h-12 flex items-center group cursor-pointer px-2"
          >
            {/* Base track */}
            <div className="absolute left-2 right-2 h-1 bg-surface-container-high rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-container/30 transition-all duration-150" 
                style={{ width: `${scrubberPos}%` }}
              ></div>
            </div>
            {/* Markers */}
            <div className="absolute left-2 w-[2px] h-3 bg-outline top-1/2 -translate-y-1/2"></div>
            <div className="absolute left-1/4 w-[1px] h-2 bg-outline-variant top-1/2 -translate-y-1/2"></div>
            <div className="absolute left-1/2 w-[1px] h-2 bg-outline-variant top-1/2 -translate-y-1/2"></div>
            <div className="absolute right-2 w-[2px] h-3 bg-outline top-1/2 -translate-y-1/2"></div>
            {/* The Scrubber Handle */}
            <div 
              className="absolute -translate-x-1/2 w-4 h-8 bg-primary-container rounded-sm shadow-[0_0_15px_rgba(0,242,255,0.8)] border border-primary z-10 group-hover:scale-110 transition-all duration-150 flex items-center justify-center pointer-events-none"
              style={{ left: `${scrubberPos}%` }}
            >
              <div className="w-[1px] h-4 bg-absolute-black"></div>
            </div>
          </div>

          <div className="flex justify-between px-2 text-[10px] font-data-mono text-outline-variant font-bold">
            <span>-24h</span>
            <span>-12h</span>
            <span className="text-primary-container pl-16">NOW</span>
            <span>+6h</span>
            <span>+12h</span>
          </div>
        </div>
      </div>

    </main>
  );
};
