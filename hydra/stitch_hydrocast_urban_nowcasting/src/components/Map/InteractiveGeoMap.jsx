import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { floodZonesGeoJSON } from '../../data/geo/floodZones';
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
      map.flyTo(flyToLocation, 13, { duration: 1.5 });
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

// Create custom glowing HTML DivIcons for Chennai Reservoirs
const createReservoirIcon = (storagePct) => {
  const color = storagePct > 80 ? '#ff4d4d' : (storagePct > 60 ? '#ffaa00' : '#00f2ff');
  return L.divIcon({
    className: 'custom-reservoir-marker',
    html: `
      <div style="position: relative; width: 22px; height: 22px;">
        <div style="
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          border: 1px dashed ${color};
          animation: pulse-ring 3s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        "></div>
        <div style="
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #0e141a;
          border: 2px solid ${color};
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 14px ${color};
          color: ${color};
          font-size: 11px;
          font-weight: bold;
          font-family: 'JetBrains Mono', monospace;
        ">
          R
        </div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
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

  // Authoritative Backend Live Datasets State
  const [liveDrains, setLiveDrains] = useState(null);
  const [drainsLoading, setDrainsLoading] = useState(true);
  const [drainsError, setDrainsError] = useState(false);
  const [liveReservoirs, setLiveReservoirs] = useState(null);
  const [liveRainfallGrid, setLiveRainfallGrid] = useState(null);

  useEffect(() => {
    // 1. Fetch Real GCC Storm Water Drains (Authoritative Backend)
    setDrainsLoading(true);
    setDrainsError(false);
    api.getDrains({ all_features: true })
      .then(data => {
        if (data && data.features && data.features.length > 0) {
          console.log(`[HYDROCAST GIS] Loaded ${data.features.length} real GCC Storm Water Drain features.`);
          setLiveDrains(data);
        } else {
          setDrainsError(true);
        }
      })
      .catch(err => {
        console.warn('[HYDROCAST GIS] API drains fetch error:', err);
        setDrainsError(true);
      })
      .finally(() => {
        setDrainsLoading(false);
      });

    // 2. Fetch Real Chennai Reservoirs
    api.getReservoirs()
      .then(data => {
        if (data && data.reservoirs && data.reservoirs.length > 0) {
          console.log(`[HYDROCAST GIS] Loaded ${data.reservoirs.length} real Chennai reservoirs.`);
          setLiveReservoirs(data);
        }
      })
      .catch(err => {
        console.warn('[HYDROCAST GIS] Reservoirs fetch error:', err);
      });

    // 3. Fetch Real NASA IMERG Rainfall Grid
    api.getRainfallData(true)
      .then(data => {
        if (data && data.gridGeoJSON && data.gridGeoJSON.features && data.gridGeoJSON.features.length > 0) {
          setLiveRainfallGrid(data.gridGeoJSON);
        }
      })
      .catch(err => {
        console.warn('[HYDROCAST GIS] Rainfall grid fetch error:', err);
      });
  }, []);

  // Styling for Flood Risk Zone Polygons
  const getZoneStyle = (feature) => {
    const isSelected = selectedZone?.id === feature.properties.id;
    const risk = feature.properties.riskLevel;

    let fillColor = '#4edea3';
    let borderColor = '#6ffbbe';

    if (risk === 'CRITICAL' || risk === 'VERY HIGH') {
      fillColor = '#ff4d4d';
      borderColor = '#ffb4ab';
    } else if (risk === 'WARNING' || risk === 'HIGH') {
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

  // Feature tooltip for Real GCC Drainage Lines
  const onEachDrainFeature = (feature, layer) => {
    const p = feature.properties || {};
    const location = (p.location && p.location !== 'N/A') ? p.location : `GCC Drain #${feature.id || p.objectid || 'N/A'}`;
    const zone = (p.zone && p.zone !== 'N/A') ? p.zone : 'N/A';
    const ward = (p.ward && p.ward !== 'N/A') ? p.ward : 'N/A';
    const dlenKm = Number(p.dlen_km ?? (p.st_length_shape ? p.st_length_shape / 1000 : 0)) || 0;
    const drainWid = Number(p.drain_wid ?? 0) || 0;
    const drainDep = Number(p.drain_dep ?? 0) || 0;
    const status = p.status || 'Good';
    const obstacles = (p.obstacles && p.obstacles !== 'N/A' && p.obstacles.trim() !== '') ? p.obstacles : 'None';

    const dimText = (drainWid > 0 && drainDep > 0) ? `${drainWid}m x ${drainDep}m` : 'Standard Section';

    layer.bindTooltip(`
      <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; background: #0e141a; color: #dde3ec; padding: 6px 10px; border: 1px solid #00f2ff; border-radius: 4px; box-shadow: 0 0 12px rgba(0,242,255,0.4); line-height: 1.5;">
        <strong style="color: #00f2ff; font-size: 12px;">${location}</strong><br/>
        <span>Zone: <strong style="color: #ffffff;">${zone}</strong> | Ward: <strong style="color: #ffffff;">${ward}</strong></span><br/>
        <span>Length: <strong style="color: #4edea3;">${dlenKm.toFixed(3)} km</strong> | Dim: ${dimText}</span><br/>
        <span>Condition: <strong style="color: ${status.toLowerCase() === 'good' ? '#4edea3' : '#ff4d4d'};">${status}</strong> | Obstacles: <span style="color: ${obstacles !== 'None' ? '#ffaa00' : '#849495'};">${obstacles}</span></span>
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

  // Feature interactions for Risk Zones
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
        <span style="color: ${feature.properties.riskColor}">${feature.properties.riskLevel} (${feature.properties.floodProbability || 45}%)</span>
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

        {/* Authoritative Real GCC Drainage Network Layer (Render ONLY liveDrains) */}
        {layers.drainage && liveDrains && liveDrains.features && liveDrains.features.length > 0 && (
          <GeoJSON 
            key={`drainage-network-live-${liveDrains.features.length}`} 
            data={liveDrains} 
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

        {/* Real Chennai Reservoirs Layer (When Water Bodies is enabled) */}
        {layers.waterBodies && liveReservoirs && liveReservoirs.reservoirs && liveReservoirs.reservoirs.map((res) => {
          const coords = [res.latitude, res.longitude];
          const icon = createReservoirIcon(res.storage_percentage);

          return (
            <Marker 
              key={`reservoir-${res.name}`} 
              position={coords} 
              icon={icon}
            >
              <Popup className="cyber-leaflet-popup">
                <div className="bg-surface-container-lowest text-on-surface p-3 rounded border border-primary-container/80 font-mono text-xs shadow-2xl min-w-[200px]">
                  <div className="font-bold text-primary-container flex items-center justify-between border-b border-outline-variant/30 pb-1 mb-2">
                    <span>{res.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary-container/20 text-primary-container border border-primary-container/40">{res.basin}</span>
                  </div>
                  <div className="text-on-surface text-[11px] font-semibold">{res.full_name}</div>
                  <div className="mt-2 space-y-1 text-[11px] bg-surface-container/60 p-2 rounded border border-outline-variant/20">
                    <div className="flex justify-between">
                      <span className="text-outline">STORAGE:</span>
                      <strong className="text-primary-container">{res.current_level_mcft} / {res.capacity_mcft} mcft</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-outline">FILLED:</span>
                      <strong style={{ color: res.storage_percentage > 80 ? '#ff4d4d' : (res.storage_percentage > 60 ? '#ffaa00' : '#4edea3') }}>
                        {res.storage_percentage}%
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-outline">STATUS:</span>
                      <span className="font-semibold text-on-surface">{res.status}</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

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

      {/* Non-blocking Telemetry Status Pill for Drainage Layer */}
      {layers.drainage && (drainsLoading || drainsError) && (
        <div className="absolute top-4 left-4 z-[1000] bg-surface-container-lowest/90 border border-outline-variant/50 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-xl font-mono text-xs flex items-center gap-2 pointer-events-none">
          {drainsLoading ? (
            <>
              <span className="w-2 h-2 rounded-full bg-primary-container animate-ping"></span>
              <span className="text-primary-container font-semibold">STREAMING 2,000 GCC DRAIN VECTORS...</span>
            </>
          ) : drainsError ? (
            <>
              <span className="w-2 h-2 rounded-full bg-warning-orange"></span>
              <span className="text-warning-orange">DRAINAGE DATA UNAVAILABLE</span>
            </>
          ) : null}
        </div>
      )}

      {/* Cyber Ambient Vignette Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-radial-gradient from-transparent via-absolute-black/30 to-absolute-black/80 z-[10]" />
    </div>
  );
};
