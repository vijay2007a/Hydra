export const mockRainfallData = {
  currentIntensity: "42.5 mm/hr",
  peakPrecipitation: "68.0 mm/hr",
  stormMovement: "ENE @ 24 km/h",
  radarReflectivity: "52 dBZ",
  totalAccumulation: "84.2 mm",
  radarSatellites: ["SENTINEL-3B", "NOAA-20", "DOPPLER-RAD-04"],
  hourlyBreakdown: [
    { hour: "14:00", rate: 12.4, accumulation: 12.4 },
    { hour: "14:30", rate: 18.2, accumulation: 21.5 },
    { hour: "15:00", rate: 35.0, accumulation: 39.0 },
    { hour: "15:30", rate: 68.0, accumulation: 73.0 },
    { hour: "16:00 (NOW)", rate: 42.5, accumulation: 84.2 },
    { hour: "16:30 (FORECAST)", rate: 24.0, accumulation: 96.2 },
    { hour: "17:00 (FORECAST)", rate: 8.5, accumulation: 100.5 }
  ],
  radarGridNodes: [
    { id: "NODE-A1", sector: "North-West Basin", intensity: "54 dBZ", status: "Severe Heavy Rain", color: "#ff4d4d" },
    { id: "NODE-A2", sector: "Central Business Dist", intensity: "48 dBZ", status: "Heavy Rain", color: "#ffaa00" },
    { id: "NODE-A3", sector: "Eastern Catchment", intensity: "38 dBZ", status: "Moderate Rain", color: "#00f2ff" },
    { id: "NODE-A4", sector: "Southern Uplands", intensity: "22 dBZ", status: "Light Showers", color: "#4edea3" }
  ]
};
