import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export const AIRiskPredictions = () => {
  const navigate = useNavigate();
  const [sliderPos, setSliderPos] = useState(40);
  const [selectedScenario, setSelectedScenario] = useState('High Intensity');
  const [reportGenerated, setReportGenerated] = useState(false);

  // Live Telemetry States
  const [predictions, setPredictions] = useState([]);
  const [weather, setWeather] = useState(null);
  const [systemStats, setSystemStats] = useState(null);

  useEffect(() => {
    Promise.all([
      api.getPredictions(),
      api.getWeather(),
      api.getSystemStatus()
    ]).then(([preds, w, s]) => {
      if (preds) setPredictions(preds);
      if (w) setWeather(w);
      if (s) setSystemStats(s);
    }).catch(e => console.warn('[AIRiskPredictions] Telemetry load error:', e));
  }, []);

  const getPeakTimeLabel = (pos) => {
    const hours = (pos / 100) * 24;
    return `T+ ${hours.toFixed(1)} Hrs`;
  };

  const handleSliderClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    setSliderPos(percentage);
  };

  // Compute live score from predictions or scenario
  const meanScore = predictions.length > 0
    ? Math.round(predictions.reduce((acc, p) => acc + (p.riskScore || 35), 0) / predictions.length)
    : 48;
  const activeScore = selectedScenario === 'Flash Flood Event' ? 84 : (selectedScenario === 'High Intensity' ? 68 : 34);
  const riskStatus = activeScore > 75 ? 'STATUS: HIGH' : (activeScore > 50 ? 'STATUS: ELEVATED' : 'STATUS: MODERATE');

  return (
    <div className="bg-absolute-black text-on-surface font-body-md antialiased min-h-screen flex flex-col relative overflow-x-hidden pt-[72px]">
      
      {/* Global Background Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #004f54 0%, transparent 60%)' }}></div>

      <div className="flex flex-1 pt-8 pb-8 h-full z-10 relative">
        <main className="flex-1 px-margin-mobile md:px-margin-desktop w-full max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-gutter">
          
          {/* Header Section */}
          <div className="col-span-1 md:col-span-12 mb-4">
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-primary-container mb-2 font-bold">
              AI FLOOD PREDICTIONS
            </h1>
            <p className="font-data-mono text-data-mono text-outline">
              Predict Risk. Act Earlier. // 10,280 GCC SWD Segments Evaluated // NASA IMERG + Open-Meteo Forcing
            </p>
            <div className="aurora-divider mt-6 w-full h-px bg-gradient-to-r from-transparent via-primary-container/50 to-transparent"></div>
          </div>

          {/* Left Column: Risk Score & Timeline (Bento Layout) */}
          <div className="col-span-1 md:col-span-4 flex flex-col gap-gutter">
            
            {/* Main Risk Score */}
            <div className="bg-surface-dim/70 backdrop-blur-xl border border-outline-variant/50 rounded-xl p-glass-padding flex flex-col items-center justify-center relative overflow-hidden scanning-border shadow-[0_0_30px_rgba(206,93,255,0.1)]">
              <div className="absolute inset-0 bg-gradient-to-b from-secondary-container/10 to-transparent pointer-events-none"></div>
              <span className="font-label-caps text-label-caps text-secondary-container mb-4 z-10 font-bold">OVERALL RISK SCORE</span>
              
              <div className="relative w-48 h-48 flex items-center justify-center rounded-full pulse-ring border-2 border-secondary-container/50 bg-surface-container-low/80 z-10">
                <div className="flex flex-col items-center">
                  <span className="font-display-lg text-display-lg text-white font-bold">{activeScore}</span>
                  <span className="font-data-mono text-data-mono text-outline mt-[-8px]">/100</span>
                </div>
              </div>

              <div className="mt-6 bg-error/20 px-6 py-2 rounded-full border border-error/50 z-10">
                <span className="font-label-caps text-label-caps text-error font-bold">{riskStatus}</span>
              </div>
            </div>

            {/* Prediction Timeline Slider */}
            <div className="bg-surface-dim/70 backdrop-blur-xl border border-outline-variant/30 rounded-xl p-glass-padding relative">
              <span className="font-label-caps text-label-caps text-primary-fixed mb-4 block font-bold">PREDICTION TIMELINE</span>
              
              <div className="relative mt-8 mb-6 cursor-pointer" onClick={handleSliderClick}>
                {/* Custom Slider Track */}
                <div className="h-1 bg-surface-container-highest rounded-full w-full relative">
                  <div className="absolute top-0 left-0 h-full bg-primary-container rounded-full" style={{ width: `${sliderPos}%` }}></div>
                  {/* Thumb */}
                  <div 
                    className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-primary-fixed rounded-full shadow-[0_0_10px_rgba(0,242,255,0.8)] border border-absolute-black cursor-pointer"
                    style={{ left: `${sliderPos}%` }}
                  ></div>
                  {/* Tick Marks */}
                  <div className="absolute -bottom-6 left-0 font-data-mono text-[10px] text-outline">NOW</div>
                  <div className="absolute -bottom-6 left-1/4 font-data-mono text-[10px] text-outline transform -translate-x-1/2">+6H</div>
                  <div className="absolute -bottom-6 left-1/2 font-data-mono text-[10px] text-outline transform -translate-x-1/2">+12H</div>
                  <div className="absolute -bottom-6 left-3/4 font-data-mono text-[10px] text-outline transform -translate-x-1/2">+18H</div>
                  <div className="absolute -bottom-6 right-0 font-data-mono text-[10px] text-outline">+24H</div>
                </div>
              </div>

              <div className="mt-8 flex justify-between items-center text-sm">
                <span className="font-data-mono text-primary-fixed-dim font-bold">{getPeakTimeLabel(sliderPos)}</span>
                <span className="font-data-mono text-outline">PEAK PROBABILITY</span>
              </div>
            </div>

            {/* Explainable AI */}
            <div className="bg-surface-dim/70 backdrop-blur-xl border border-outline-variant/30 rounded-xl p-glass-padding relative">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary-container text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                  psychology
                </span>
                <span className="font-label-caps text-label-caps text-primary-container font-bold">WHY THIS PREDICTION?</span>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between font-data-mono text-[12px] mb-1">
                    <span className="text-on-surface">Drainage Deficit (GCC SWD)</span>
                    <span className="text-secondary-container font-bold">35% weight</span>
                  </div>
                  <div className="h-1 bg-surface-container-highest w-full">
                    <div className="h-full bg-secondary-container w-[35%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between font-data-mono text-[12px] mb-1">
                    <span className="text-on-surface">Precipitation Hazard (IMERG + Open-Meteo)</span>
                    <span className="text-primary-container font-bold">30% weight</span>
                  </div>
                  <div className="h-1 bg-surface-container-highest w-full">
                    <div className="h-full bg-primary-container w-[30%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between font-data-mono text-[12px] mb-1">
                    <span className="text-on-surface">Hydro Proximity (OSM Waterways)</span>
                    <span className="text-outline font-bold">20% weight</span>
                  </div>
                  <div className="h-1 bg-surface-container-highest w-full">
                    <div className="h-full bg-outline w-[20%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between font-data-mono text-[12px] mb-1">
                    <span className="text-on-surface">Reservoir System Headroom</span>
                    <span className="text-primary-container font-bold">15% weight</span>
                  </div>
                  <div className="h-1 bg-surface-container-highest w-full">
                    <div className="h-full bg-primary-container w-[15%]"></div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Charts & Scenarios */}
          <div className="col-span-1 md:col-span-8 flex flex-col gap-gutter">
            
            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
              {/* Cumulative Rainfall Projection */}
              <div className="bg-surface-dim/70 backdrop-blur-xl border border-outline-variant/30 rounded-xl p-glass-padding h-64 flex flex-col relative group">
                <span className="font-label-caps text-label-caps text-on-surface-variant mb-2 font-bold">CUMULATIVE RAINFALL PROJECTION</span>
                <div className="flex-1 w-full relative flex items-end border-b border-l border-outline-variant/20 pb-2 pl-2 overflow-hidden">
                  <div className="absolute bottom-0 left-0 w-full h-[60%] bg-gradient-to-t from-primary-container/20 to-transparent" style={{ clipPath: 'polygon(0 100%, 0 80%, 20% 70%, 40% 60%, 60% 40%, 80% 20%, 100% 10%, 100% 100%)' }}></div>
                  <svg className="absolute bottom-0 left-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <polyline fill="none" points="0,80 20,70 40,60 60,40 80,20 100,10" stroke="#00f2ff" strokeWidth="2"></polyline>
                  </svg>
                  {/* Grid lines */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(132,148,149,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(132,148,149,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                </div>
              </div>

              {/* Drainage Saturation Model */}
              <div className="bg-surface-dim/70 backdrop-blur-xl border border-outline-variant/30 rounded-xl p-glass-padding h-64 flex flex-col relative group">
                <span className="font-label-caps text-label-caps text-on-surface-variant mb-2 font-bold">DRAINAGE SATURATION MODEL</span>
                <div className="flex-1 w-full relative flex items-end gap-2 justify-around border-b border-outline-variant/20 pb-2">
                  <div className="w-1/6 bg-outline-variant/50 h-[30%] relative group-hover:bg-primary-container/50 transition-colors">
                    <div className="absolute top-[-20px] w-full text-center font-data-mono text-[10px] text-outline">N01</div>
                  </div>
                  <div className="w-1/6 bg-outline-variant/50 h-[50%] relative group-hover:bg-primary-container/50 transition-colors">
                    <div className="absolute top-[-20px] w-full text-center font-data-mono text-[10px] text-outline">N04</div>
                  </div>
                  <div className="w-1/6 bg-secondary-container/50 h-[85%] relative group-hover:bg-secondary-container transition-colors">
                    <div className="absolute top-[-20px] w-full text-center font-data-mono text-[10px] text-secondary-container shadow-[0_0_10px_rgba(206,93,255,0.8)] font-bold">N08</div>
                  </div>
                  <div className="w-1/6 bg-outline-variant/50 h-[60%] relative group-hover:bg-primary-container/50 transition-colors">
                    <div className="absolute top-[-20px] w-full text-center font-data-mono text-[10px] text-outline">N11</div>
                  </div>
                  <div className="w-1/6 bg-outline-variant/50 h-[40%] relative group-hover:bg-primary-container/50 transition-colors">
                    <div className="absolute top-[-20px] w-full text-center font-data-mono text-[10px] text-outline">N15</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Scenario Cards */}
            <div className="bg-surface-dim/70 backdrop-blur-xl border border-outline-variant/30 rounded-xl p-glass-padding">
              <span className="font-label-caps text-label-caps text-on-surface mb-6 block font-bold">PREDICTIVE SCENARIOS</span>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Standard Flow */}
                <div 
                  onClick={() => setSelectedScenario('Standard Flow')}
                  className={`border p-4 rounded-lg transition-all cursor-pointer group ${
                    selectedScenario === 'Standard Flow' 
                      ? 'border-primary-container/60 bg-primary-container/10 shadow-[0_0_15px_rgba(0,242,255,0.15)]' 
                      : 'border-outline-variant/30 bg-surface-container-low hover:border-primary-container/50 hover:bg-surface-container/80'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`font-data-mono text-sm ${selectedScenario === 'Standard Flow' ? 'text-primary-container font-bold' : 'text-outline group-hover:text-primary-container'}`}>
                      Standard Flow
                    </span>
                    <span className="material-symbols-outlined text-outline text-sm">water</span>
                  </div>
                  <div className="font-display-lg text-2xl text-on-surface mb-1 font-bold">24%</div>
                  <div className="font-label-caps text-[10px] text-outline">PROBABILITY</div>
                </div>

                {/* High Intensity */}
                <div 
                  onClick={() => setSelectedScenario('High Intensity')}
                  className={`border p-4 rounded-lg relative overflow-hidden cursor-pointer ${
                    selectedScenario === 'High Intensity'
                      ? 'border-primary-container/50 bg-primary-container/10 shadow-[0_0_15px_rgba(0,242,255,0.2)]'
                      : 'border-outline-variant/30 bg-surface-container-low hover:border-primary-container/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2 relative z-10">
                    <span className="font-data-mono text-sm text-primary-container font-bold">High Intensity</span>
                    <span className="material-symbols-outlined text-primary-container text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      tsunami
                    </span>
                  </div>
                  <div className="font-display-lg text-2xl text-white mb-1 relative z-10 font-bold">68%</div>
                  <div className="font-label-caps text-[10px] text-primary-container relative z-10 font-bold">
                    {selectedScenario === 'High Intensity' ? 'PROBABILITY (ACTIVE)' : 'PROBABILITY'}
                  </div>
                </div>

                {/* Flash Flood Event */}
                <div 
                  onClick={() => setSelectedScenario('Flash Flood Event')}
                  className={`border p-4 rounded-lg transition-all cursor-pointer group ${
                    selectedScenario === 'Flash Flood Event'
                      ? 'border-secondary-container/60 bg-secondary-container/20 shadow-[0_0_15px_rgba(206,93,255,0.25)]'
                      : 'border-outline-variant/30 bg-surface-container-low hover:border-secondary-container/50 hover:bg-secondary-container/10'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`font-data-mono text-sm ${selectedScenario === 'Flash Flood Event' ? 'text-secondary-container font-bold' : 'text-outline group-hover:text-secondary-container'}`}>
                      Flash Flood Event
                    </span>
                    <span className="material-symbols-outlined text-outline text-sm group-hover:text-secondary-container">warning</span>
                  </div>
                  <div className="font-display-lg text-2xl text-on-surface mb-1 font-bold">08%</div>
                  <div className="font-label-caps text-[10px] text-outline">PROBABILITY</div>
                </div>
              </div>

              {/* Generate Report Message */}
              {reportGenerated && (
                <div className="mt-4 p-3 rounded-lg bg-primary-container/10 border border-primary-container/40 text-primary-container font-mono text-xs animate-pulse flex items-center justify-between">
                  <span>✓ HydroGNN Spatio-Temporal Prediction Dossier v4.2 Compiled.</span>
                  <span onClick={() => navigate('/protocol')} className="underline cursor-pointer">Inspect Model Protocol</span>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button 
                  onClick={() => setReportGenerated(true)}
                  className="bg-primary-container text-absolute-black font-label-caps text-label-caps px-6 py-3 rounded border border-primary-container hover:bg-primary-fixed hover:shadow-[0_0_15px_rgba(0,242,255,0.5)] transition-all flex items-center gap-2 active:scale-95 cursor-pointer font-bold"
                >
                  GENERATE DETAILED REPORT
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_forward</span>
                </button>
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* Footer with Distinct Data Source Attribution */}
      <footer className="w-full py-8 border-t border-outline-variant/10 bg-absolute-black flex flex-col md:flex-row justify-between items-center px-margin-desktop gap-4 z-40 relative">
        <div className="font-label-caps text-on-surface text-label-caps opacity-80">
          © 2026 HYDROCAST INTELLIGENCE. MODEL: HFVI DETERMINISTIC // SATELLITE: NASA IMERG // WEATHER: OPEN-METEO // DRAINAGE: GCC SWD (10,280 FEATURES).
        </div>
        <div className="flex gap-6">
          <span onClick={() => navigate('/protocol')} className="font-data-mono text-label-caps text-outline hover:text-on-surface hover:underline decoration-primary-container opacity-80 cursor-pointer">Protocol</span>
          <span onClick={() => navigate('/urban-intelligence')} className="font-data-mono text-label-caps text-outline hover:text-on-surface hover:underline decoration-primary-container opacity-80 cursor-pointer">Infrastructure</span>
          <span onClick={() => navigate('/intelligence-map')} className="font-data-mono text-label-caps text-outline hover:text-on-surface hover:underline decoration-primary-container opacity-80 cursor-pointer">GIS Map</span>
        </div>
      </footer>

    </div>
  );
};

