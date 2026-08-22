// GeoJSON Water Bodies and Urban Retention Basins across Chennai, Tamil Nadu, India
export const waterBodiesGeoJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "WB-ADYAR-ESTUARY",
      properties: {
        name: "Adyar River Estuary & Coastal Basin",
        type: "Natural Estuarine Basin & Bay Outlet",
        capacity: "82% High Stage",
        color: "#00d2ff"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [80.2450, 13.0180],
          [80.2780, 13.0140],
          [80.2850, 13.0080],
          [80.2750, 13.0020],
          [80.2460, 13.0060],
          [80.2450, 13.0180]
        ]]
      }
    },
    {
      type: "Feature",
      id: "WB-PALLIKARANAI-MARSH",
      properties: {
        name: "Pallikaranai Wetland Sanctuary & Catchment",
        type: "Freshwater Marshland Retention Ecosystem",
        capacity: "76% Volume Inundated",
        color: "#00d2ff"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [80.2020, 12.9550],
          [80.2310, 12.9530],
          [80.2330, 12.9200],
          [80.2030, 12.9220],
          [80.2020, 12.9550]
        ]]
      }
    },
    {
      type: "Feature",
      id: "WB-COOUM-BASIN",
      properties: {
        name: "Cooum River Central Urban Basin",
        type: "Arterial Urban River Basin",
        capacity: "68% Volume Utilized",
        color: "#00d2ff"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [80.2350, 13.0780],
          [80.2880, 13.0720],
          [80.2890, 13.0640],
          [80.2360, 13.0680],
          [80.2350, 13.0780]
        ]]
      }
    },
    {
      type: "Feature",
      id: "WB-PORUR-LAKE",
      properties: {
        name: "Porur Catchment & Retention Reservoir",
        type: "Freshwater Urban Retention Basin",
        capacity: "58% Normal High Stage",
        color: "#00d2ff"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [80.1450, 13.0420],
          [80.1650, 13.0430],
          [80.1630, 13.0280],
          [80.1430, 13.0290],
          [80.1450, 13.0420]
        ]]
      }
    }
  ]
};
