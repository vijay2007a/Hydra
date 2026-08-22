// GeoJSON dataset for Urban Flood Risk Zones across Chennai, Tamil Nadu, India
export const floodZonesGeoJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "ZONE-A12",
      properties: {
        id: "ZONE-A12",
        name: "Zone A12",
        category: "Velachery Lake & Residential Basin",
        location: "Velachery, Chennai",
        riskLevel: "CRITICAL",
        riskColor: "#ff4d4d",
        floodProbability: 87,
        expectedOnset: "35 mins",
        rainfallRate: "42 mm/h",
        drainCap: "94% FULL",
        coordinates: "12.9780° N, 80.2210° E",
        center: [12.9780, 80.2210],
        waterDepth: "48 cm",
        pumpsActive: 6,
        summary: "Severe water accumulation across Velachery low-lying transit corridors and lake catchment buffer."
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [80.2100, 12.9860],
          [80.2320, 12.9870],
          [80.2300, 12.9700],
          [80.2110, 12.9690],
          [80.2100, 12.9860]
        ]]
      }
    },
    {
      type: "Feature",
      id: "ZONE-B04",
      properties: {
        id: "ZONE-B04",
        name: "Zone B04",
        category: "Adyar River & Kotturpuram Sluice Corridor",
        location: "Adyar / Kotturpuram, Chennai",
        riskLevel: "CRITICAL",
        riskColor: "#ff4d4d",
        floodProbability: 79,
        expectedOnset: "45 mins",
        rainfallRate: "38 mm/h",
        drainCap: "88% FULL",
        coordinates: "13.0130° N, 80.2460° E",
        center: [13.0130, 80.2460],
        waterDepth: "36 cm",
        pumpsActive: 4,
        summary: "Adyar riverbank discharge approaching high-tide surcharge threshold near Kotturpuram sluice."
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [80.2350, 13.0220],
          [80.2580, 13.0200],
          [80.2550, 13.0050],
          [80.2340, 13.0060],
          [80.2350, 13.0220]
        ]]
      }
    },
    {
      type: "Feature",
      id: "ZONE-C18",
      properties: {
        id: "ZONE-C18",
        name: "Zone C18",
        category: "Pallikaranai Marshland Catchment",
        location: "Pallikaranai, Chennai",
        riskLevel: "WARNING",
        riskColor: "#ffaa00",
        floodProbability: 65,
        expectedOnset: "75 mins",
        rainfallRate: "28 mm/h",
        drainCap: "78% FULL",
        coordinates: "12.9360° N, 80.2160° E",
        center: [12.9360, 80.2160],
        waterDepth: "30 cm",
        pumpsActive: 3,
        summary: "Pallikaranai wetland buffer receiving heavy inflow from south IT corridor storm trunks."
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [80.2050, 12.9490],
          [80.2280, 12.9480],
          [80.2260, 12.9240],
          [80.2040, 12.9250],
          [80.2050, 12.9490]
        ]]
      }
    },
    {
      type: "Feature",
      id: "ZONE-D07",
      properties: {
        id: "ZONE-D07",
        name: "Zone D07",
        category: "T. Nagar & Usman Road Commercial Basin",
        location: "T. Nagar, Chennai",
        riskLevel: "WARNING",
        riskColor: "#ffaa00",
        floodProbability: 58,
        expectedOnset: "90 mins",
        rainfallRate: "22 mm/h",
        drainCap: "65% FULL",
        coordinates: "13.0418° N, 80.2341° E",
        center: [13.0418, 80.2341],
        waterDepth: "22 cm",
        pumpsActive: 2,
        summary: "Surface runoff along Usman Road commercial hub draining toward Mambalam canal."
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [80.2230, 13.0500],
          [80.2460, 13.0490],
          [80.2440, 13.0340],
          [80.2220, 13.0350],
          [80.2230, 13.0500]
        ]]
      }
    },
    {
      type: "Feature",
      id: "ZONE-E02",
      properties: {
        id: "ZONE-E02",
        name: "Zone E02",
        category: "Guindy Elevated Plateau Sector",
        location: "Guindy, Chennai",
        riskLevel: "SAFE",
        riskColor: "#4edea3",
        floodProbability: 14,
        expectedOnset: "Nominal",
        rainfallRate: "4 mm/h",
        drainCap: "20% FULL",
        coordinates: "13.0067° N, 80.2025° E",
        center: [13.0067, 80.2025],
        waterDepth: "3 cm",
        pumpsActive: 1,
        summary: "Optimal gravity drainage gradient. Storm sewer network operating well within nominal baseline."
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [80.1910, 13.0160],
          [80.2150, 13.0150],
          [80.2130, 12.9980],
          [80.1900, 12.9990],
          [80.1910, 13.0160]
        ]]
      }
    }
  ]
};
