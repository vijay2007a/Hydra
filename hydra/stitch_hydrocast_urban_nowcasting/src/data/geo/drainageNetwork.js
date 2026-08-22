// GeoJSON Drainage Network LineStrings across Chennai, Tamil Nadu, India
export const drainageNetworkGeoJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "DRAIN-ADYAR-TRUNK",
      properties: {
        name: "Adyar River Arterial Storm Trunk",
        diameter: "4.5m Main Channel",
        flowVelocity: "4.8 m/s",
        status: "High Capacity Flow",
        color: "#00f2ff"
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [80.1450, 13.0040],
          [80.1800, 13.0080],
          [80.2150, 13.0110],
          [80.2460, 13.0130],
          [80.2780, 13.0100]
        ]
      }
    },
    {
      type: "Feature",
      id: "DRAIN-COOUM-BYPASS",
      properties: {
        name: "Cooum River Urban Relief Channel",
        diameter: "3.8m Floodway",
        flowVelocity: "3.9 m/s",
        status: "Engaged 85%",
        color: "#00f2ff"
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [80.1650, 13.0760],
          [80.2050, 13.0710],
          [80.2400, 13.0740],
          [80.2680, 13.0730],
          [80.2880, 13.0670]
        ]
      }
    },
    {
      type: "Feature",
      id: "DRAIN-BUCKINGHAM-CANAL",
      properties: {
        name: "Buckingham Canal North-South Diversion",
        diameter: "3.2m Tidal Channel",
        flowVelocity: "2.6 m/s",
        status: "Active Tidal Flow",
        color: "#ce5dff"
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [80.2810, 13.1180],
          [80.2760, 13.0650],
          [80.2680, 13.0150],
          [80.2540, 12.9650],
          [80.2430, 12.9050]
        ]
      }
    },
    {
      type: "Feature",
      id: "DRAIN-MAMBALAM-VELACHERY",
      properties: {
        name: "Mambalam Canal & Velachery Link Conduit",
        diameter: "2.8m Secondary Trunk",
        flowVelocity: "3.4 m/s",
        status: "Surcharged Discharge",
        color: "#00f2ff"
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [80.2341, 13.0418],
          [80.2320, 13.0180],
          [80.2240, 12.9950],
          [80.2210, 12.9780]
        ]
      }
    }
  ]
};
