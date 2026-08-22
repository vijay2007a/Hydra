export const mockPredictions = [
  {
    horizon: "+15 Min",
    riskLevel: "CRITICAL",
    predictedDepth: "54.2 cm",
    confidence: "96.4%",
    zoneName: "Central Metro Underpass",
    primaryFactor: "Convective Cell Intensification",
    timeSeries: [
      { time: "-30m", depth: 15, predicted: 15 },
      { time: "-15m", depth: 32, predicted: 32 },
      { time: "NOW", depth: 48, predicted: 48 },
      { time: "+15m", depth: null, predicted: 54.2 },
      { time: "+30m", depth: null, predicted: 58.0 },
      { time: "+45m", depth: null, predicted: 51.5 },
      { time: "+60m", depth: null, predicted: 39.0 }
    ]
  },
  {
    horizon: "+30 Min",
    riskLevel: "CRITICAL",
    predictedDepth: "42.0 cm",
    confidence: "94.1%",
    zoneName: "Riverside Parkway",
    primaryFactor: "Sluice Gate Saturation",
    timeSeries: [
      { time: "-30m", depth: 10, predicted: 10 },
      { time: "-15m", depth: 22, predicted: 22 },
      { time: "NOW", depth: 34, predicted: 34 },
      { time: "+15m", depth: null, predicted: 39.5 },
      { time: "+30m", depth: null, predicted: 42.0 },
      { time: "+45m", depth: null, predicted: 38.0 },
      { time: "+60m", depth: null, predicted: 28.0 }
    ]
  },
  {
    horizon: "+1 Hour",
    riskLevel: "HIGH",
    predictedDepth: "29.5 cm",
    confidence: "91.8%",
    zoneName: "East Canal Basin",
    primaryFactor: "Upstream Catchment Inflow",
    timeSeries: [
      { time: "-30m", depth: 8, predicted: 8 },
      { time: "-15m", depth: 14, predicted: 14 },
      { time: "NOW", depth: 22, predicted: 22 },
      { time: "+15m", depth: null, predicted: 25.0 },
      { time: "+30m", depth: null, predicted: 28.2 },
      { time: "+45m", depth: null, predicted: 29.5 },
      { time: "+60m", depth: null, predicted: 26.0 }
    ]
  },
  {
    horizon: "+3 Hours",
    riskLevel: "MODERATE",
    predictedDepth: "14.1 cm",
    confidence: "88.5%",
    zoneName: "North Highway Underpass",
    primaryFactor: "Storm Front Receding",
    timeSeries: [
      { time: "-30m", depth: 5, predicted: 5 },
      { time: "-15m", depth: 12, predicted: 12 },
      { time: "NOW", depth: 18, predicted: 18 },
      { time: "+15m", depth: null, predicted: 19.0 },
      { time: "+30m", depth: null, predicted: 17.5 },
      { time: "+45m", depth: null, predicted: 15.0 },
      { time: "+60m", depth: null, predicted: 14.1 }
    ]
  }
];

export const aiModelTelemetry = {
  modelArchitecture: "HydroGNN + SpatioTemporal Transformer (v4.2)",
  trainingEpochs: 1500,
  spatialResolution: "5 meter grid",
  temporalStep: "1 min step",
  inferenceLatency: "380 ms",
  sensorFusionSources: ["Dual-Pol Doppler Radar", "Urban IoT Sensors", "Satellite Micro-Altimetry", "Drainage Flowmeters"]
};
