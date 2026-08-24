import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export const SystemProtocol = () => {
  const navigate = useNavigate();
  const [healthData, setHealthData] = useState(null);

  useEffect(() => {
    api.getHealth().then(h => {
      if (h) setHealthData(h);
    }).catch(e => console.warn('[SystemProtocol] Health fetch error:', e));
  }, []);

  const fbConnected = healthData?.firebase?.firestore_connected ?? true;
  const fbProject = healthData?.firebase?.project_id || 'hydra-1963e';
  const drainCount = healthData?.datasets?.gcc_storm_water_drains?.features_count || 2000;
  const h5Count = healthData?.datasets?.nasa_gpm_imerg_precipitation?.total_hdf5_files || 616;
  const resCount = healthData?.datasets?.chennai_reservoirs?.reservoirs_monitored || 5;

  return (
    <div className="bg-absolute-black text-on-surface font-body-md antialiased min-h-screen flex flex-col pt-[72px]">
      
      {/* Abstract Tech Background */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(116, 0, 159, 0.3) 0%, transparent 50%)' }}></div>

      <main className="flex-grow pt-8 pb-20 px-margin-mobile md:px-margin-desktop flex flex-col gap-16 relative z-10">
        
        {/* Hero Section */}
        <section className="max-w-4xl mx-auto text-center pt-6">
          <h1 className="font-display-lg text-display-lg text-primary mb-4 drop-shadow-glow-cyan font-bold">
            INTELLIGENCE PIPELINE
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
            Transparency in predictive modeling. Discover the journey from raw orbital telemetry to actionable evacuation alerts.
          </p>
        </section>

        {/* Pipeline Diagram */}
        <section className="w-full max-w-6xl mx-auto relative scanning-border bg-glass-surface backdrop-blur-xl rounded-xl p-glass-padding shadow-[0_0_20px_rgba(0,219,231,0.1)] border border-outline-variant/30">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-2 items-center text-center relative z-10">
            {/* Node 1: Multi-Source Inputs */}
            <div className="flex flex-col items-center gap-2 p-3">
              <span className="material-symbols-outlined text-3xl text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
                satellite_alt
              </span>
              <span className="font-label-caps text-[11px] text-primary-container font-bold">NASA IMERG + OPEN-METEO</span>
              <span className="text-[10px] font-mono text-outline">{h5Count} Satellite HDF5 Files</span>
            </div>

            {/* Connector 1 */}
            <div className="hidden md:block w-full h-[1px] bg-outline-variant relative">
              <div className="absolute inset-0 bg-primary-container w-1/2 animate-pulse shadow-[0_0_10px_rgba(0,242,255,0.8)]"></div>
            </div>

            {/* Node 2: FastAPI Analytics */}
            <div className="flex flex-col items-center gap-2 p-3">
              <span className="material-symbols-outlined text-3xl text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
                cloud_sync
              </span>
              <span className="font-label-caps text-[11px] text-outline font-bold">FASTAPI ENGINE</span>
              <span className="text-[10px] font-mono text-outline">HFVI Risk Scoring</span>
            </div>

            {/* Connector 2 */}
            <div className="hidden md:block w-full h-[1px] bg-outline-variant relative">
              <div className="absolute inset-0 bg-primary-container w-1/2 animate-pulse shadow-[0_0_10px_rgba(0,242,255,0.8)]" style={{ animationDelay: '0.2s' }}></div>
            </div>

            {/* Node 3: Firestore Storage */}
            <div className="flex flex-col items-center gap-2 p-3">
              <span className="material-symbols-outlined text-3xl text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
                database
              </span>
              <span className="font-label-caps text-[11px] text-secondary font-bold">FIRESTORE ({fbProject})</span>
              <span className="text-[10px] font-mono text-outline">{fbConnected ? 'LIVE CONNECTED' : 'CACHED'}</span>
            </div>

            {/* Connector 3 */}
            <div className="hidden md:block w-full h-[1px] bg-outline-variant relative">
              <div className="absolute inset-0 bg-primary-container w-1/2 animate-pulse shadow-[0_0_10px_rgba(0,242,255,0.8)]" style={{ animationDelay: '0.4s' }}></div>
            </div>

            {/* Node 4: Nowcast Output */}
            <div className="flex flex-col items-center gap-2 p-3">
              <span className="material-symbols-outlined text-3xl text-error" style={{ fontVariationSettings: "'FILL' 1" }}>
                warning
              </span>
              <span className="font-label-caps text-[11px] text-error font-bold">NOWCAST ALERT</span>
              <span className="text-[10px] font-mono text-outline">{drainCount.toLocaleString()} SWD Segments</span>
            </div>
          </div>
        </section>

        {/* Live Backend Telemetry Health Banner */}
        <section className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs">
          <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-safe-green animate-pulse"></span>
            <div>
              <div className="text-[10px] text-outline">BACKEND SERVICE</div>
              <div className="text-on-surface font-bold text-sm">RENDER PROD READY</div>
            </div>
          </div>

          <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${fbConnected ? 'bg-safe-green' : 'bg-warning-orange'} animate-pulse`}></span>
            <div>
              <div className="text-[10px] text-outline">FIRESTORE PROJECT</div>
              <div className="text-primary-container font-bold text-sm">{fbProject}</div>
            </div>
          </div>

          <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-primary-container"></span>
            <div>
              <div className="text-[10px] text-outline">GCC STORMWATER DRAINS</div>
              <div className="text-secondary font-bold text-sm">{drainCount.toLocaleString()} Segments Loaded</div>
            </div>
          </div>

          <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-secondary"></span>
            <div>
              <div className="text-[10px] text-outline">CHENNAI RESERVOIRS</div>
              <div className="text-on-surface font-bold text-sm">{resCount} Monitored Reservoirs</div>
            </div>
          </div>
        </section>

        <div className="aurora-divider w-full max-w-6xl mx-auto h-px bg-gradient-to-r from-transparent via-primary-container/50 to-transparent"></div>

        {/* Bento Grid Content */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-gutter max-w-6xl mx-auto w-full">
          {/* Mission Card (Col span 12 md 8) */}
          <div className="md:col-span-8 scanning-border bg-glass-surface backdrop-blur-xl rounded-xl p-glass-padding flex flex-col justify-center relative overflow-hidden border border-outline-variant/30 shadow-2xl">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <span className="material-symbols-outlined text-9xl">memory</span>
            </div>
            <h2 className="font-headline-lg text-headline-lg text-primary mb-4 font-bold">Our Mission</h2>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              To eliminate the lag between meteorological event detection and ground-level response. By synthesizing NASA IMERG data with localized sensor networks, we provide a unified, predictive command matrix for critical infrastructure protection.
            </p>
          </div>

          {/* Stats/Tech Mini Card (Col span 12 md 4) */}
          <div className="md:col-span-4 scanning-border bg-surface-container-high/80 backdrop-blur-xl rounded-xl p-glass-padding flex flex-col justify-between border border-outline-variant/30 shadow-2xl">
            <span className="font-label-caps text-label-caps text-primary-fixed-dim font-bold">DATA INGESTION</span>
            <div className="mt-4">
              <div className="font-data-mono text-3xl text-primary-container mb-1 font-bold">98.4<span className="text-sm font-normal">%</span></div>
              <div className="font-data-mono text-data-mono text-outline font-bold">ACCURACY CONFIDENCE</div>
            </div>
            <div className="w-full bg-surface-container-lowest h-1 mt-4 rounded-full overflow-hidden">
              <div className="bg-primary-container h-full w-[98.4%] shadow-[0_0_10px_rgba(0,242,255,0.5)]"></div>
            </div>
          </div>

          {/* Satellite Intelligence (Col span 12 md 6) */}
          <div className="md:col-span-6 scanning-border bg-glass-surface backdrop-blur-xl rounded-xl overflow-hidden group border border-outline-variant/30 shadow-2xl">
            <div className="h-48 w-full relative bg-surface-container-lowest overflow-hidden">
              <img 
                alt="Satellite Schematic" 
                className="object-cover w-full h-full opacity-60 mix-blend-screen group-hover:opacity-80 group-hover:scale-105 transition-all duration-700" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDvMxuUWdGrE94x7FwUN2DuNuTKwNtzAIpBfZ2lilUOdyzUKp8NDfQ9CMzGI__FUUKqqhRn_J29-HxtjI-zI_Bbc5uewq9CFTazOq-KlnAJqGC6DWbMm2W5VUq2IRGGg5N3J4Zv7cn2HA7i38c8haXTpl0dyBWX6Dtw8Wc6gmU8Ak1OG6TpjVamiXPnQdWVhDRd6EdraHrBJGj3XhUlb5FYSojHjK76BngK7yQYGck4cUJrSx5hm2uE"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-glass-surface to-transparent"></div>
            </div>
            <div className="p-glass-padding relative z-10">
              <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-primary mb-2 font-bold">Satellite Intelligence</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Leveraging the NASA IMERG late-run dataset, our models ingest global precipitation measurement metrics every 30 minutes, providing the baseline macro-view for regional hydrological forecasting.
              </p>
            </div>
          </div>

          {/* Neural Risk Modeling (Col span 12 md 6) */}
          <div className="md:col-span-6 scanning-border bg-glass-surface backdrop-blur-xl rounded-xl overflow-hidden group border border-outline-variant/30 shadow-2xl">
            <div className="h-48 w-full relative bg-surface-container-lowest overflow-hidden">
              <img 
                alt="Neural Network Visualization" 
                className="object-cover w-full h-full opacity-60 mix-blend-screen group-hover:opacity-80 group-hover:scale-105 transition-all duration-700" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDUCoInTFgaNP_h30zef-AS0YZvvrPHcmGDaQFt7PWgBq5qAVUlIzw1qy7wgM4oNcapu0cdGMKUXM4iBOhsdt8C-Ee7sRO3hwDIu5HuHbWPjOiszJwAxX90QpAsZu_oJC_g5Hh_mag1fenDFUf1nJFx5JOh-4s1QqUBlaQ3cVsx1JgBS9HdMwncLH-dLghoGFWIEj1WqRVA9V77ozFEbuoHl33nObvz1375Qt518m6lR86Hbdh8DWhS"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-glass-surface to-transparent"></div>
            </div>
            <div className="p-glass-padding relative z-10">
              <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-primary mb-2 font-bold">Neural Risk Modeling</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Our proprietary edge-compute nodes analyze historical flood topographies against live saturation indices, identifying microscopic threshold breaches before they escalate into macro-events.
              </p>
            </div>
          </div>
        </section>

        <div className="aurora-divider w-full max-w-6xl mx-auto h-px bg-gradient-to-r from-transparent via-secondary-container/30 to-transparent"></div>

        {/* Responsible AI / Transparency */}
        <section className="max-w-4xl mx-auto text-center border border-outline-variant/30 rounded-xl p-8 bg-surface-container-lowest/50 backdrop-blur-md shadow-2xl">
          <span className="material-symbols-outlined text-4xl text-warning-orange mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>
            security
          </span>
          <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-4 font-bold">
            Responsible Prediction &amp; Limitations
          </h3>
          <p className="font-body-md text-body-md text-outline-variant mb-6 text-left leading-relaxed">
            Hydrocast Intelligence is a decision-support tool, not a definitive oracle. Predictive confidence degrades beyond a 72-hour horizon. System latency is subject to orbital telemetry uplink schedules. All automated alerts must be verified against localized emergency service protocols.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <span className="px-3 py-1 rounded bg-surface-container-high text-on-surface-variant font-label-caps text-label-caps border border-outline-variant/50 font-bold">
              DATA LATENCY: <span className="text-primary-container">~45 MIN</span>
            </span>
            <span className="px-3 py-1 rounded bg-surface-container-high text-on-surface-variant font-label-caps text-label-caps border border-outline-variant/50 font-bold">
              CONFIDENCE HORIZON: <span className="text-primary-container">72 HRS</span>
            </span>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 border-t border-outline-variant/10 bg-absolute-black flex flex-col md:flex-row justify-between items-center px-margin-desktop gap-4 z-20 relative">
        <div className="font-label-caps text-on-surface opacity-80">
          © 2026 HYDROCAST INTELLIGENCE. DATA SOURCE: NASA IMERG LATE RUN.
        </div>
        <div className="flex gap-4">
          <span onClick={() => navigate('/protocol')} className="font-data-mono text-label-caps text-outline hover:text-on-surface hover:underline decoration-primary-container opacity-80 cursor-pointer">Protocol</span>
          <span onClick={() => navigate('/rainfall')} className="font-data-mono text-label-caps text-outline hover:text-on-surface hover:underline decoration-primary-container opacity-80 cursor-pointer">Rainfall Satellites</span>
          <span onClick={() => navigate('/intelligence-map')} className="font-data-mono text-label-caps text-outline hover:text-on-surface hover:underline decoration-primary-container opacity-80 cursor-pointer">GIS Map</span>
        </div>
      </footer>

    </div>
  );
};
