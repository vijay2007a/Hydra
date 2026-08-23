import React, { useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { floodZonesGeoJSON } from '../../data/geo/floodZones';
import { drainageNetworkGeoJSON } from '../../data/geo/drainageNetwork';
import { sensorsGeoJSON } from '../../data/geo/sensors';
import { waterBodiesGeoJSON } from '../../data/geo/waterBodies';
import { api } from '../../services/api';

// Controller component to handle external programmatic map commands and size sync
const MapController = ({ zoomAction, flyToLocation, onMapClick }) => {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);

  useEffect(() => {
    if (zoomAction === 'in') {
      map.zoomIn();
    } else if (zoomAction === 'out') {
      map.zoomOut();
    }
  }, [zoomAction, map]);

  useEffect(() => {
    if (flyToLocation && flyToLocation.length === 2) {
      map.flyTo(flyToLocation, 14, { duration: 1.5 });
    }
  }, [flyToLocation, map]);

  useEffect(() => {
    const handleClick = () => {
      if (onMapClick) onMapClick();
    };
    map.on('click', handleClick);
    return () => map.off('click', handleClick);
  }, [map, onMapClick]);

  return null;
};

// Create custom glowing HTML DivIcons for sensors
const createSensorIcon = (statusColor) => {
  return L.divIcon({
    className: 'custom-sensor-marker',
    html: `
      <div style="position: relative; width: 16px; height: 16px;">
        <div style="
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 1px solid ${statusColor};
          animation: pulse-ring 2.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        "></div>
        <div style="
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: ${statusColor};
          border: 2px solid #000;
          box-shadow: 0 0 12px ${statusColor};
        "></div>
      </div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

export const InteractiveGeoMap = ({ 
  layers, 
  selectedZone, 
  onSelectZone, 
  zoomAction, 
  flyToLocation,
  timelineState
}) => {
  // Chennai, Tamil Nadu, India center coordinates
  const mapCenter = [13.0250, 80.2300];

  // Live Drainage Data state
  const [liveDrains, setLiveDrains] = React.useState(null);

  React.useEffect(() => {
    api.getDrains({ all_features: true })
      .then(data => {
        if (data && data.features && data.features.length > 0) {
          console.log(`[HYDROCAST GIS] Loaded ${data.features.length} real GCC Storm Water Drain features.`);
          setLiveDrains(data);
        }
      })
      .catch(err => {
        console.warn('[HYDROCAST GIS] API drains fetch error, fallback active:', err);
      });
  }, []);

  // Styling for Flood Risk Zone Polygons
  const getZoneStyle = (feature) => {
    const isSelected = selectedZone?.id === feature.properties.id;
    const risk = feature.properties.riskLevel;

    let fillColor = '#4edea3';
    let borderColor = '#6ffbbe';

    if (risk === 'CRITICAL') {
      fillColor = '#ff4d4d';
      borderColor = '#ffb4ab';
    } else if (risk === 'WARNING') {
      fillColor = '#ffaa00';
      borderColor = '#ffddb8';
    }

    return {
      fillColor: fillColor,
      weight: isSelected ? 3 : 1.5,
      opacity: 0.9,
      color: isSelected ? '#00f2ff' : borderColor,
      dashArray: isSelected ? '' : '3',
      fillOpacity: isSelected ? 0.45 : (timelineState === 'PAST' ? 0.15 : 0.28),
      className: isSelected ? 'selected-zone-glow' : ''
    };
  };

  // Styling for Drainage Lines
  const getDrainageStyle = (feature) => ({
    color: feature?.properties?.color || '#00f2ff',
    weight: 2.5,
    opacity: 0.85,
    dashArray: '4, 4'
  });

  // Feature tooltip for Drainage Lines
  const onEachDrainFeature = (feature, layer) => {
    const p = feature.properties || {};
    const title = p.location && p.location !== 'N/A' ? p.location : (p.name || `Drain ID: ${feature.id || p.objectid}`);
    layer.bindTooltip(`
      <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; background: #0e141a; color: #dde3ec; padding: 4px 8px; border: 1px solid #00f2ff; border-radius: 4px; box-shadow: 0 0 10px rgba(0,242,255,0.4);">
        <strong style="color: #00f2ff;">${title}</strong><br/>
        <span>Zone: ${p.zone || 'N/A'} | Ward: ${p.ward || 'N/A'}</span><br/>
        <span>Length: ${(p.dlen_km || 0).toFixed(3)} km | Dim: ${p.drain_wid || 0.86}m x ${p.drain_dep || 0.86}m</span><br/>
        <span style="color: ${p.status === 'Good' ? '#4edea3' : '#ff4d4d'}">Condition: ${p.status || 'Good'} | Obstacles: ${p.obstacles || 'None'}</span>
      </div>
    `, { sticky: true, opacity: 0.95 });
  };

  // Styling for Water Bodies
  const getWaterBodyStyle = () => ({
    fillColor: '#00d2ff',
    weight: 1.5,
    opacity: 0.7,
    color: '#00f2ff',
    fillOpacity: 0.35
  });

  // Styling for Historical Inundation Overlay
  const getHistoricalStyle = () => ({
    fillColor: '#ce5dff',
    weight: 2,
    opacity: 0.8,
    color: '#ebb2ff',
    dashArray: '4, 4',
    fillOpacity: 0.35
  });

  // Feature interactions
  const onEachZoneFeature = (feature, layer) => {
    layer.on({
      click: () => {
        if (onSelectZone) {
          onSelectZone(feature.properties);
        }
      },
      mouseover: (e) => {
        const l = e.target;
        l.setStyle({
          weight: 3,
          color: '#00f2ff',
          fillOpacity: 0.5
        });
      },
      mouseout: (e) => {
        const l = e.target;
        l.setStyle(getZoneStyle(feature));
      }
    });

    layer.bindTooltip(`
      <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; background: #0e141a; color: #dde3ec; padding: 4px 8px; border: 1px solid #00f2ff; border-radius: 4px; box-shadow: 0 0 10px rgba(0,242,255,0.4);">
        <strong style="color: #00f2ff;">${feature.properties.name} (${feature.properties.location})</strong><br/>
        <span style="color: ${feature.properties.riskColor}">${feature.properties.riskLevel} (${feature.properties.floodProbability}%)</span>
      </div>
    `, { sticky: true, opacity: 0.95 });
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-absolute-black">
      <MapContainer
        center={mapCenter}
        zoom={12}
        minZoom={10}
        maxZoom={18}
        zoomControl={false}
        attributionControl={false}
        className="w-full h-full"
        style={{ background: '#000000' }}
      >
        {/* CartoDB Dark Matter High-Contrast Basemap Tiles */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />

        {/* Map Controller for external zoom / pan integration and size sync */}
        <MapController 
          zoomAction={zoomAction} 
          flyToLocation={flyToLocation} 
        />

        {/* Historical Flood Inundation Overlay (when enabled) */}
        {layers.historical && (
          <GeoJSON 
            key="historical-overlay" 
            data={waterBodiesGeoJSON} 
            style={getHistoricalStyle} 
          />
        )}

        {/* Water Bodies Layer */}
        {layers.waterBodies && (
          <GeoJSON 
            key="water-bodies" 
            data={waterBodiesGeoJSON} 
            style={getWaterBodyStyle} 
          />
        )}

        {/* Drainage Network Layer (consumes real 10,280 GCC Storm Water Drains) */}
        {layers.drainage && (
          <GeoJSON 
            key={`drainage-network-${liveDrains ? liveDrains.features.length : 'static'}`} 
            data={liveDrains || drainageNetworkGeoJSON} 
            style={getDrainageStyle} 
            onEachFeature={onEachDrainFeature}
          />
        )}

        {/* Flood Risk Zones Layer */}
        {layers.riskZones && (
          <GeoJSON 
            key={`flood-zones-${selectedZone?.id || 'none'}-${timelineState}`} 
            data={floodZonesGeoJSON} 
            style={getZoneStyle} 
            onEachFeature={onEachZoneFeature} 
          />
        )}

        {/* IoT Sensor Markers Layer */}
        {layers.rainfall && sensorsGeoJSON.features.map((sensor) => {
          const coords = [sensor.geometry.coordinates[1], sensor.geometry.coordinates[0]];
          const icon = createSensorIcon(sensor.properties.statusColor);

          return (
            <Marker 
              key={sensor.id} 
              position={coords} 
              icon={icon}
            >
              <Popup className="cyber-leaflet-popup">
                <div className="bg-surface-container-lowest text-on-surface p-2.5 rounded border border-primary-container/60 font-mono text-xs shadow-2xl">
                  <div className="font-bold text-primary-container flex items-center justify-between border-b border-outline-variant/30 pb-1 mb-1">
                    <span>{sensor.properties.id}</span>
                    <span style={{ color: sensor.properties.statusColor }}>{sensor.properties.status}</span>
                  </div>
                  <div className="text-on-surface font-semibold">{sensor.properties.name}</div>
                  <div className="text-outline-variant text-[11px] mt-0.5">{sensor.properties.location}</div>
                  <div className="mt-1.5 pt-1 border-t border-outline-variant/30 flex justify-between text-[11px]">
                    <span>STAGE: <strong className="text-primary-container">{sensor.properties.value}</strong></span>
                    <span className="text-outline-variant">PING: {sensor.properties.lastPing}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Cyber Ambient Vignette Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-radial-gradient from-transparent via-absolute-black/30 to-absolute-black/80 z-[10]" />
    </div>
  );
};
