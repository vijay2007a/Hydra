import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export const Home = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // Initialize WebGL Aurora Shader as subtle fallback background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId;
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    function syncSize() {
      const w = canvas.parentElement?.clientWidth || window.innerWidth;
      const h = canvas.parentElement?.clientHeight || window.innerHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }
    syncSize();

    const resizeObserver = new ResizeObserver(syncSize);
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    const vs = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fs = `
      precision highp float;
      varying vec2 v_texCoord;
      uniform float u_time;
      uniform vec2 u_resolution;

      void main() {
        vec2 uv = v_texCoord;
        float time = u_time * 0.2;
        
        vec3 color = vec3(0.02, 0.04, 0.08);
        
        float noise1 = sin(uv.x * 3.0 + time) * 0.5 + 0.5;
        float noise2 = cos(uv.y * 2.0 - time * 0.8) * 0.5 + 0.5;
        
        vec3 cyan = vec3(0.0, 0.95, 1.0);
        vec3 purple = vec3(0.7, 0.0, 1.0);
        
        float mask = smoothstep(0.4, 0.6, noise1 * noise2);
        color = mix(color, cyan * 0.2, mask);
        color = mix(color, purple * 0.15, 1.0 - mask);
        
        vec2 grid = fract(uv * 40.0);
        float line = step(0.98, grid.x) + step(0.98, grid.y);
        color += line * cyan * 0.05;
        
        float scan = sin(uv.y * 400.0 + u_time * 5.0) * 0.02;
        color += scan;

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    function cs(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, cs(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, cs(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');
    let startTime = Date.now();

    function render() {
      const t = Date.now() - startTime;
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animId = requestAnimationFrame(render);
    }
    render();

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen overflow-x-hidden selection:bg-primary-container selection:text-on-primary-container">
      
      {/* Hero Section */}
      <header className="relative min-h-screen flex items-center justify-center pt-24 overflow-hidden isolate">
        
        {/* Layer 1: Fallback Shader Canvas behind video */}
        <div className="absolute inset-0 w-full h-full -z-40 block opacity-25">
          <canvas ref={canvasRef} className="block w-full h-full" />
        </div>

        {/* Layer 2: Chennai Flood Video — fully visible, opacity 1 */}
        <div className="absolute inset-0 w-full h-full -z-30 overflow-hidden bg-absolute-black">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="w-full h-full object-cover object-center opacity-100"
            src="/videos/chennai-flood.mp4"
          />
        </div>

        {/* Layer 3: Subtle Global Cinematic Base Tint (Lightened from heavy black to light tint) */}
        <div className="absolute inset-0 bg-black/25 -z-20 pointer-events-none"></div>

        {/* Layer 4: Directional Left Gradient for Text Readability & Subtle Bottom Transition */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent -z-10 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/90 -z-10 pointer-events-none"></div>

        {/* Layer 5: Subtle Cyber Atmospheric Aura & Grid */}
        <div className="absolute inset-0 aurora-bg opacity-25 -z-10 pointer-events-none"></div>
        <div className="absolute inset-0 cyber-grid opacity-20 -z-10 pointer-events-none"></div>

        {/* Layer 6: Hero UI Content Container */}
        <div className="relative z-10 container mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 md:grid-cols-12 gap-gutter items-center mt-12 md:mt-0">
          
          {/* Hero Content */}
          <div className="md:col-span-8 flex flex-col items-start gap-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-error-container/20 border border-error-container text-error font-label-caps text-label-caps backdrop-blur-md">
              <span className="relative flex h-2 w-2 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-error"></span>
              </span>
              SYSTEM ONLINE / REGION: CHENNAI
            </div>

            <h1 className="font-display-lg text-[48px] md:text-display-lg text-primary text-glow leading-tight drop-shadow-[0_4px_25px_rgba(0,0,0,0.95)]">
              SEE THE FLOOD <br/> BEFORE IT HAPPENS.
            </h1>

            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl border-l-2 border-primary-container pl-4 drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
              AI-powered urban flood intelligence combining satellite rainfall data, real-time monitoring and predictive risk analysis for Chennai.
            </p>

            <div className="flex flex-wrap gap-4 mt-8">
              <button 
                onClick={() => navigate('/intelligence-map')}
                className="bg-primary-container text-absolute-black font-label-caps text-label-caps px-8 py-4 rounded hover:bg-primary transition-colors cyber-glow flex items-center gap-2 cursor-pointer font-bold active:scale-95 shadow-2xl"
              >
                <span className="material-symbols-outlined">explore</span>
                Explore Live Intelligence
              </button>

              <button 
                onClick={() => navigate('/intelligence-map')}
                className="bg-glass-surface backdrop-blur-md border border-primary-container text-primary-container font-label-caps text-label-caps px-8 py-4 rounded hover:bg-primary-container/10 transition-colors flex items-center gap-2 cursor-pointer font-bold active:scale-95 shadow-2xl"
              >
                <span className="material-symbols-outlined">map</span>
                View Flood Map
              </button>
            </div>
          </div>

          {/* Floating Data Cards */}
          <div className="md:col-span-4 relative h-full flex flex-col justify-center gap-6 mt-12 md:mt-0">
            {/* Live Rainfall Card */}
            <div className="bg-glass-surface/90 backdrop-blur-xl border border-outline-variant/30 rounded-lg p-6 shadow-2xl relative overflow-hidden cyber-border transform md:translate-x-12">
              <div className="absolute top-0 right-0 p-2 opacity-20">
                <span className="material-symbols-outlined text-6xl">water_drop</span>
              </div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="font-label-caps text-label-caps text-on-surface-variant font-bold">Live Rainfall Intensity</div>
                <span className="material-symbols-outlined text-primary-container">satellite_alt</span>
              </div>
              <div className="flex items-baseline gap-2 relative z-10">
                <span className="font-headline-lg text-headline-lg text-primary font-bold">72</span>
                <span className="font-data-mono text-data-mono text-primary-container">mm/hr</span>
              </div>
              <div className="w-full bg-surface-container-highest h-1 mt-4 rounded overflow-hidden">
                <div className="bg-primary-container h-full w-[72%] shadow-[0_0_10px_#00f2ff]"></div>
              </div>
            </div>

            {/* Alert Status Card */}
            <div className="bg-glass-surface/90 backdrop-blur-xl border border-error-container/30 rounded-lg p-6 shadow-2xl relative overflow-hidden transform md:-translate-x-4">
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="font-label-caps text-label-caps text-error font-bold">Alert Status</div>
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75 pulse-dot"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-error"></span>
                </div>
              </div>
              <div className="flex items-center gap-3 relative z-10">
                <span className="material-symbols-outlined text-error text-3xl">warning</span>
                <span className="font-headline-lg text-headline-lg-mobile text-error font-bold">ACTIVE</span>
              </div>
              <div className="font-data-mono text-data-mono text-on-surface-variant mt-2 text-xs">
                T-MINUS 04:22:10 TO CRITICAL LEVEL
              </div>
            </div>
          </div>

        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce cursor-pointer">
          <span className="font-label-caps text-[10px] text-on-surface-variant tracking-[0.2em] font-bold">INITIATE PROTOCOL</span>
          <span className="material-symbols-outlined text-primary-container">keyboard_double_arrow_down</span>
        </div>
      </header>

      <main className="relative z-10 pb-32">
        {/* Aurora Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-primary-container/50 to-transparent my-16"></div>

        {/* Intelligence Workflow Section */}
        <section className="container mx-auto px-margin-mobile md:px-margin-desktop py-16">
          <div className="mb-12 text-center">
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">INTELLIGENCE WORKFLOW</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-4 max-w-2xl mx-auto">From orbital sensors to actionable ground truth in milliseconds.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-px bg-outline-variant/30 -z-10">
              <div className="h-full bg-primary-container/50 w-full animate-[scan-border_3s_linear_infinite]" style={{ background: 'linear-gradient(90deg, transparent, #00f2ff, transparent)', backgroundSize: '50% 100%' }}></div>
            </div>

            {/* Step 1 */}
            <div className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-8 flex flex-col items-center text-center relative cyber-border group hover:bg-surface-container/50 transition-colors">
              <div className="w-16 h-16 rounded-full bg-surface-container-high border border-primary-container/30 flex items-center justify-center mb-6 group-hover:shadow-[0_0_15px_rgba(0,242,255,0.3)] transition-shadow">
                <span className="material-symbols-outlined text-primary-container text-3xl">satellite_alt</span>
              </div>
              <h3 className="font-label-caps text-label-caps text-primary mb-3 font-bold">1. ORBITAL ACQUISITION</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">Continuous ingestion of NASA IMERG Late Run multi-satellite precipitation data streams.</p>
            </div>

            {/* Step 2 */}
            <div className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-8 flex flex-col items-center text-center relative cyber-border group hover:bg-surface-container/50 transition-colors">
              <div className="w-16 h-16 rounded-full bg-surface-container-high border border-secondary-container/30 flex items-center justify-center mb-6 group-hover:shadow-[0_0_15px_rgba(206,93,255,0.3)] transition-shadow">
                <span className="material-symbols-outlined text-secondary-container text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  neurology
                </span>
              </div>
              <h3 className="font-label-caps text-label-caps text-secondary mb-3 font-bold">2. AI PROCESSING</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">Geospatial neural networks process topological maps against live rainfall velocity to predict inundation.</p>
            </div>

            {/* Step 3 */}
            <div className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-8 flex flex-col items-center text-center relative cyber-border group hover:bg-surface-container/50 transition-colors">
              <div className="w-16 h-16 rounded-full bg-surface-container-high border border-error-container/30 flex items-center justify-center mb-6 group-hover:shadow-[0_0_15px_rgba(255,170,0,0.3)] transition-shadow">
                <span className="material-symbols-outlined text-warning-orange text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  emergency_share
                </span>
              </div>
              <h3 className="font-label-caps text-label-caps text-warning-orange mb-3 font-bold">3. TACTICAL DISSEMINATION</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">Actionable risk maps and alerts routed to command centers and mobile operators instantly.</p>
            </div>
          </div>
        </section>

        {/* Live Intelligence Preview Section (Bento Grid) */}
        <section className="container mx-auto px-margin-mobile md:px-margin-desktop py-16">
          <div className="mb-12 flex justify-between items-end">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">LIVE INTELLIGENCE</h2>
              <p className="font-data-mono text-data-mono text-primary-container mt-2">TERMINAL ACCESS: GRANTED</p>
            </div>
            <button 
              onClick={() => navigate('/intelligence-map')}
              className="hidden md:flex bg-transparent border border-outline-variant text-on-surface font-label-caps text-label-caps px-6 py-2 rounded hover:border-primary-container hover:text-primary-container transition-colors items-center gap-2 cursor-pointer font-bold"
            >
              FULL DASHBOARD <span className="material-symbols-outlined text-sm">open_in_new</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
            {/* Main Map Area */}
            <div 
              onClick={() => navigate('/intelligence-map')}
              className="md:col-span-8 bg-surface-container-lowest border border-outline-variant/20 rounded-xl overflow-hidden relative min-h-[400px] cursor-pointer group"
            >
              <div className="absolute top-4 left-4 z-10 bg-glass-surface backdrop-blur-md border border-outline-variant/30 rounded px-3 py-1 font-data-mono text-[10px] text-primary-container flex items-center gap-2 font-bold">
                <span className="w-2 h-2 bg-primary-container rounded-full animate-pulse"></span>
                LIVE SAT-LINK
              </div>
              
              <div className="w-full h-full bg-surface-container flex items-center justify-center relative">
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-60 mix-blend-screen grayscale-[20%] sepia-[10%] hue-rotate-[180deg] group-hover:scale-105 transition-transform duration-700" 
                  style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCYDXHyXg4VRzxH4P4s4I6ttTdizWoExI2E3U7Kw_VaC7kkpSTatSQuf5RkBj7jNt6-f0toDZtwrG_pH4XIt0zwitkI5_VqnbXBT5eWr4JugbFkEAhBI2hJkmb7r3WZtnDCAYVroYdkVc56nPS-e_0fQ_J6WzHPkUhTAtmqsV6ODs91C7hglD8hclB0uJVuPOId0Ck880IgwRRf-iBaewx6V1IulS6TVRW9Gb1VfzrEQ8YQI7yfCryw')" }}
                ></div>
                {/* Simulated Radar Sweep */}
                <div className="absolute inset-0 border-[0.5px] border-primary-container/20 rounded-full w-[800px] h-[800px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none"></div>
                <div className="absolute inset-0 border-[0.5px] border-primary-container/20 rounded-full w-[600px] h-[600px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30 pointer-events-none"></div>
              </div>
            </div>

            {/* Right Side Data Stack */}
            <div className="md:col-span-4 flex flex-col gap-gutter">
              {/* Velocity Trend Chart Card */}
              <div className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-label-caps text-label-caps text-on-surface font-bold">VELOCITY TREND</h3>
                  <span className="material-symbols-outlined text-outline-variant text-sm">timeline</span>
                </div>
                <div className="flex-1 flex items-end gap-1 mt-4 relative">
                  {/* Simulated Chart Bars */}
                  <div className="w-full bg-primary-container/10 h-[20%] rounded-t hover:bg-primary-container/30 transition-colors"></div>
                  <div className="w-full bg-primary-container/20 h-[35%] rounded-t hover:bg-primary-container/40 transition-colors"></div>
                  <div className="w-full bg-primary-container/30 h-[45%] rounded-t hover:bg-primary-container/50 transition-colors"></div>
                  <div className="w-full bg-primary-container/40 h-[60%] rounded-t hover:bg-primary-container/60 transition-colors"></div>
                  <div className="w-full bg-error-container/60 h-[85%] rounded-t border-t border-error relative group">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-error text-absolute-black font-data-mono text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold">SPIKE</div>
                  </div>
                  <div className="w-full bg-primary-container/50 h-[70%] rounded-t hover:bg-primary-container/70 transition-colors"></div>
                  {/* Threshold line */}
                  <div className="absolute top-[30%] w-full h-px bg-warning-orange/50 border-b border-dashed border-warning-orange/30"></div>
                </div>
              </div>

              {/* Critical Zones List Card */}
              <div className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-6 flex-1">
                <h3 className="font-label-caps text-label-caps text-on-surface mb-4 font-bold">CRITICAL ZONES</h3>
                <div className="flex flex-col gap-2">
                  <div 
                    onClick={() => navigate('/intelligence-map?q=Velachery')}
                    className="flex justify-between items-center p-2 rounded bg-error-container/10 border border-error-container/30 hover:bg-error-container/20 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
                      <span className="font-data-mono text-data-mono text-on-surface">Velachery</span>
                    </div>
                    <span className="font-data-mono text-[10px] text-error font-bold">94% RISK</span>
                  </div>
                  <div 
                    onClick={() => navigate('/intelligence-map?q=T%20Nagar')}
                    className="flex justify-between items-center p-2 rounded bg-warning-orange/5 border border-warning-orange/20 hover:bg-warning-orange/10 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-warning-orange"></span>
                      <span className="font-data-mono text-data-mono text-on-surface">T Nagar</span>
                    </div>
                    <span className="font-data-mono text-[10px] text-warning-orange font-bold">72% RISK</span>
                  </div>
                  <div 
                    onClick={() => navigate('/intelligence-map?q=Adyar')}
                    className="flex justify-between items-center p-2 rounded bg-surface-bright/20 border border-outline-variant/20 hover:bg-surface-bright/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                      <span className="font-data-mono text-data-mono text-on-surface">Adyar</span>
                    </div>
                    <span className="font-data-mono text-[10px] text-primary-container font-bold">31% RISK</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={() => navigate('/intelligence-map')}
            className="md:hidden w-full mt-6 bg-surface-container-high border border-outline-variant text-on-surface font-label-caps text-label-caps px-6 py-3 rounded hover:border-primary-container hover:text-primary-container transition-colors flex items-center justify-center gap-2 font-bold"
          >
            FULL DASHBOARD <span className="material-symbols-outlined text-sm">open_in_new</span>
          </button>
        </section>

        {/* Aurora Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-secondary-container/30 to-transparent my-16"></div>

        {/* Technology Partner Section */}
        <section className="container mx-auto px-margin-mobile md:px-margin-desktop py-16">
          <div className="text-center mb-10">
            <h3 className="font-label-caps text-label-caps text-outline tracking-[0.2em] font-bold">POWERED BY ADVANCED TELEMETRY</h3>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="flex flex-col items-center gap-2 group cursor-pointer">
              <span className="material-symbols-outlined text-5xl text-on-surface group-hover:text-primary-container transition-colors">rocket_launch</span>
              <span className="font-data-mono text-[12px] text-outline group-hover:text-primary-container transition-colors font-bold">NASA IMERG</span>
            </div>
            <div className="flex flex-col items-center gap-2 group cursor-pointer">
              <span className="material-symbols-outlined text-5xl text-on-surface group-hover:text-secondary-container transition-colors">memory</span>
              <span className="font-data-mono text-[12px] text-outline group-hover:text-secondary-container transition-colors font-bold">TENSOR FLOW AI</span>
            </div>
            <div className="flex flex-col items-center gap-2 group cursor-pointer">
              <span className="material-symbols-outlined text-5xl text-on-surface group-hover:text-primary-container transition-colors">public</span>
              <span className="font-data-mono text-[12px] text-outline group-hover:text-primary-container transition-colors font-bold">GEO-SPATIAL API</span>
            </div>
          </div>
        </section>
      </main>

      {/* Landing Footer */}
      <footer className="w-full py-8 border-t border-outline-variant/10 bg-absolute-black z-10 relative">
        <div className="flex flex-col md:flex-row justify-between items-center px-margin-desktop gap-4">
          <div className="font-data-mono text-label-caps text-outline opacity-80">
            © 2026 HYDROCAST INTELLIGENCE. DATA SOURCE: NASA IMERG LATE RUN.
          </div>
          <div className="flex gap-6">
            <span onClick={() => navigate('/protocol')} className="font-data-mono text-label-caps text-outline hover:text-on-surface hover:underline decoration-primary-container opacity-80 hover:opacity-100 transition-opacity cursor-pointer">Protocol</span>
            <span onClick={() => navigate('/intelligence-map')} className="font-data-mono text-label-caps text-outline hover:text-on-surface hover:underline decoration-primary-container opacity-80 hover:opacity-100 transition-opacity cursor-pointer">Terminal</span>
            <span onClick={() => navigate('/intelligence-map')} className="font-data-mono text-label-caps text-outline hover:text-on-surface hover:underline decoration-primary-container opacity-80 hover:opacity-100 transition-opacity cursor-pointer">GIS API</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
