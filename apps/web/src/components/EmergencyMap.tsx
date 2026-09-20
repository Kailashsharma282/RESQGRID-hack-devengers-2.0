import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Incident, Resource, ResourceMatchCandidate } from '@resqgrid/types';
import { SeverityBadge } from './SeverityBadge';
import { CategoryIcon } from './CategoryIcon';

interface EmergencyMapProps {
  incidents: Incident[];
  resources: Resource[];
  selectedIncident: Incident | null;
  recommendedResources?: ResourceMatchCandidate[];
  onSelectIncident: (incident: Incident) => void;
}

// Map center controller helper
const ChangeMapView: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
};

// Create custom SVG markers for Incidents
function createIncidentIcon(severity: string, isSelected: boolean) {
  const sev = severity.toUpperCase();
  let color = '#ef4444'; // critical
  if (sev === 'HIGH') color = '#f97316';
  else if (sev === 'MEDIUM') color = '#eab308';
  else if (sev === 'LOW') color = '#38bdf8';
  else if (sev === 'RESOLVED') color = '#10b981';

  const pulseHtml = sev === 'CRITICAL' || isSelected
    ? `<span style="position:absolute; top:-6px; left:-6px; right:-6px; bottom:-6px; border-radius:50%; border:2px solid ${color}; animation:pulseRadar 2s infinite;"></span>`
    : '';

  const html = `
    <div style="position:relative; width:28px; height:28px; display:flex; align-items:center; justify-content:center;">
      ${pulseHtml}
      <div style="width:24px; height:24px; border-radius:50%; background:${color}; border:2px solid #ffffff; box-shadow:0 0 10px ${color}; display:flex; align-items:center; justify-content:center; color:#fff; font-size:12px; font-weight:bold;">
        !
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-incident-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

// Create custom SVG markers for Emergency Units
function createResourceIcon(type: string, status: string) {
  let color = '#3b82f6';
  let symbol = '🚑';
  if (type.includes('FIRE')) {
    color = '#f97316';
    symbol = '🚒';
  } else if (type.includes('BOAT')) {
    color = '#06b6d4';
    symbol = '🚤';
  } else if (type.includes('POLICE')) {
    color = '#6366f1';
    symbol = '🚓';
  } else if (type.includes('MEDICAL')) {
    color = '#ef4444';
    symbol = '⚕️';
  }

  const isAssigned = status === 'ASSIGNED' || status === 'EN_ROUTE' || status === 'ON_SCENE';

  const html = `
    <div style="position:relative; width:26px; height:26px; display:flex; align-items:center; justify-content:center;">
      <div style="width:22px; height:22px; border-radius:6px; background:#0f172a; border:2px solid ${color}; display:flex; align-items:center; justify-content:center; font-size:11px; box-shadow:0 0 8px ${color}80;">
        ${symbol}
      </div>
      ${isAssigned ? `<span style="position:absolute; top:-2px; right:-2px; width:7px; height:7px; border-radius:50%; background:#eab308; border:1px solid #000;"></span>` : ''}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-resource-marker',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

export const EmergencyMap: React.FC<EmergencyMapProps> = ({
  incidents,
  resources,
  selectedIncident,
  recommendedResources = [],
  onSelectIncident,
}) => {
  const defaultCenter: [number, number] = [37.7749, -122.4194];
  const center: [number, number] = selectedIncident
    ? [selectedIncident.latitude, selectedIncident.longitude]
    : defaultCenter;

  // Best recommended unit route
  const topCandidate = recommendedResources[0]?.resource;

  return (
    <div className="relative w-full h-full min-h-[450px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      <MapContainer
        center={defaultCenter}
        zoom={14}
        className="w-full h-full dark-tiles"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {selectedIncident && <ChangeMapView center={center} zoom={15} />}

        {/* Selected Incident Radar Circle */}
        {selectedIncident && (
          <Circle
            center={[selectedIncident.latitude, selectedIncident.longitude]}
            radius={350}
            pathOptions={{
              color: '#3b82f6',
              fillColor: '#3b82f6',
              fillOpacity: 0.12,
              weight: 1.5,
              dashArray: '4, 4',
            }}
          />
        )}

        {/* Tactical Route Line between selected incident and top recommended unit */}
        {selectedIncident && topCandidate && (
          <Polyline
            positions={[
              [selectedIncident.latitude, selectedIncident.longitude],
              [topCandidate.latitude, topCandidate.longitude],
            ]}
            pathOptions={{
              color: '#60a5fa',
              weight: 3,
              opacity: 0.8,
              dashArray: '6, 8',
            }}
          />
        )}

        {/* Incident Markers */}
        {incidents.map((incident) => {
          const isSelected = selectedIncident?.id === incident.id;
          return (
            <Marker
              key={incident.id}
              position={[incident.latitude, incident.longitude]}
              icon={createIncidentIcon(incident.severity, isSelected)}
              eventHandlers={{
                click: () => onSelectIncident(incident),
              }}
            >
              <Popup>
                <div className="p-2 space-y-1.5 min-w-[200px]">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-xs text-blue-400 font-bold">{incident.incidentCode}</span>
                    <SeverityBadge severity={incident.severity} size="sm" />
                  </div>
                  <h4 className="font-bold text-xs text-white leading-tight">{incident.title}</h4>
                  <p className="text-[11px] text-slate-300 line-clamp-2">{incident.address}</p>
                  <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800">
                    <span>{incident.affectedPeople} affected</span>
                    <span className="text-emerald-400 font-medium">{incident.status}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Resource Markers */}
        {resources.map((resource) => (
          <Marker
            key={resource.id}
            position={[resource.latitude, resource.longitude]}
            icon={createResourceIcon(resource.type, resource.status)}
          >
            <Popup>
              <div className="p-2 space-y-1 min-w-[180px]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">{resource.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {resource.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{resource.organization}</p>
                <p className="text-[10px] text-slate-500">{resource.contact}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Tactical Overlays */}
      <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2">
        <div className="px-3 py-1.5 rounded-lg bg-surface-card/90 border border-slate-700/80 backdrop-blur text-xs font-mono flex items-center gap-2 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300">GRID SECTOR: SAN FRANCISCO DOWNTOWN / TECH CAMPUS</span>
        </div>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 z-[400] p-2.5 rounded-xl bg-surface-card/90 border border-slate-800/90 backdrop-blur text-[11px] font-mono space-y-1 shadow-xl hidden sm:block">
        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Radar Legend</div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span>Critical Incident</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>High Incident</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
          <span>Available Emergency Unit</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-sm bg-yellow-500" />
          <span>Dispatched / Active Unit</span>
        </div>
      </div>
    </div>
  );
};
