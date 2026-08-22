// GeoJSON IoT Telemetry Sensor markers distributed across Chennai, Tamil Nadu, India
export const sensorsGeoJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "SNS-CHE-041",
      properties: {
        id: "SNS-CHE-041",
        name: "Sensor Node 041",
        type: "Ultrasonic Water Depth Sensor",
        location: "Velachery Lake Inflow Sump",
        value: "48 cm",
        status: "CRITICAL ALERT",
        statusColor: "#ff4d4d",
        lastPing: "2s ago",
        battery: "98%"
      },
      geometry: {
        type: "Point",
        coordinates: [80.2210, 12.9780]
      }
    },
    {
      type: "Feature",
      id: "SNS-CHE-088",
      properties: {
        id: "SNS-CHE-088",
        name: "Sensor Node 088",
        type: "Hydrostatic Pressure Transducer",
        location: "Adyar River Kotturpuram Sluice Gate",
        value: "36 cm",
        status: "CRITICAL ALERT",
        statusColor: "#ff4d4d",
        lastPing: "1s ago",
        battery: "94%"
      },
      geometry: {
        type: "Point",
        coordinates: [80.2460, 13.0130]
      }
    },
    {
      type: "Feature",
      id: "SNS-CHE-102",
      properties: {
        id: "SNS-CHE-102",
        name: "Sensor Node 102",
        type: "Flow Velocity Doppler Radar",
        location: "Pallikaranai Marshland Retention Outfall",
        value: "30 cm (2.8 m/s)",
        status: "WARNING LEVEL",
        statusColor: "#ffaa00",
        lastPing: "3s ago",
        battery: "100%"
      },
      geometry: {
        type: "Point",
        coordinates: [80.2160, 12.9360]
      }
    },
    {
      type: "Feature",
      id: "SNS-CHE-145",
      properties: {
        id: "SNS-CHE-145",
        name: "Sensor Node 145",
        type: "Optical Rain Gauge & Culvert Sump",
        location: "T. Nagar Usman Road Commercial Sump",
        value: "22 cm",
        status: "WARNING LEVEL",
        statusColor: "#ffaa00",
        lastPing: "5s ago",
        battery: "91%"
      },
      geometry: {
        type: "Point",
        coordinates: [80.2341, 13.0418]
      }
    },
    {
      type: "Feature",
      id: "SNS-CHE-210",
      properties: {
        id: "SNS-CHE-210",
        name: "Sensor Node 210",
        type: "Telemetry Gateway Station",
        location: "Guindy Kathipara Interchange Node",
        value: "3 cm (Nominal)",
        status: "SAFE",
        statusColor: "#4edea3",
        lastPing: "1s ago",
        battery: "99%"
      },
      geometry: {
        type: "Point",
        coordinates: [80.2025, 13.0067]
      }
    },
    {
      type: "Feature",
      id: "SNS-CHE-315",
      properties: {
        id: "SNS-CHE-315",
        name: "Sensor Node 315",
        type: "Tidal Surge Radar Monitor",
        location: "Buckingham Canal & Bay of Bengal Estuary",
        value: "18 cm (Tidal Stage)",
        status: "MONITORING",
        statusColor: "#00d2ff",
        lastPing: "4s ago",
        battery: "96%"
      },
      geometry: {
        type: "Point",
        coordinates: [80.2780, 13.0110]
      }
    }
  ]
};
