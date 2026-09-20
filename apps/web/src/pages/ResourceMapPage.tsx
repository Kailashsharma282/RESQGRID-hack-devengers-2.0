import React, { useState, useEffect } from 'react';
import { Truck, Search, Filter, Phone, MapPin, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import { Resource, ResourceStatus, ResourceType } from '@resqgrid/types';

export const ResourceMapPage: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const loadResources = async () => {
    setIsLoading(true);
    try {
      const res = await api.getResources();
      if (res.success) {
        setResources(res.data);
      }
    } catch (e) {
      console.warn('Failed to fetch resources');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  const toggleStatus = async (resource: Resource) => {
    const nextStatus = resource.status === ResourceStatus.AVAILABLE ? ResourceStatus.UNAVAILABLE : ResourceStatus.AVAILABLE;
    try {
      await api.updateResource(resource.id, { status: nextStatus });
      setResources((prev) => prev.map((r) => (r.id === resource.id ? { ...r, status: nextStatus } : r)));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const filtered = resources.filter((res) => {
    if (typeFilter !== 'ALL' && res.type !== typeFilter) return false;
    if (statusFilter !== 'ALL' && res.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        res.name.toLowerCase().includes(q) ||
        res.organization.toLowerCase().includes(q) ||
        res.type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-xs font-mono mb-2">
            <Truck size={14} />
            <span>OPERATIONAL UNIT DEPLOYMENT</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-mono">Resource & Apparatus Grid</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Monitor 20 emergency apparatus, paramedic crews, heavy rescue boats, and trauma teams.
          </p>
        </div>

        <button
          onClick={loadResources}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-100 hover:bg-surface-50 text-slate-300 border border-slate-700 text-xs font-medium self-start sm:self-auto"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh Fleet</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-surface-card border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search apparatus, battalion, city..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-200 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-surface-200 border border-slate-700/80 text-slate-200 text-xs focus:outline-none cursor-pointer"
        >
          <option value="ALL">All Unit Classes</option>
          <option value="AMBULANCE">Ambulances</option>
          <option value="FIRE_TRUCK">Fire Trucks / Ladder</option>
          <option value="FIRE_TEAM">Fire Response Teams</option>
          <option value="MEDICAL_TEAM">Medical & Trauma Teams</option>
          <option value="POLICE_TEAM">Police Patrols</option>
          <option value="RESCUE_BOAT">Rescue Boats</option>
          <option value="VOLUNTEER_TEAM">Volunteer Teams</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-surface-200 border border-slate-700/80 text-slate-200 text-xs focus:outline-none cursor-pointer"
        >
          <option value="ALL">All Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="EN_ROUTE">En Route</option>
          <option value="ON_SCENE">On Scene</option>
          <option value="UNAVAILABLE">Unavailable / Maintenance</option>
        </select>
      </div>

      {/* Resource Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((res) => {
          const isAvail = res.status === ResourceStatus.AVAILABLE;
          const isAssigned = res.status === ResourceStatus.ASSIGNED || res.status === ResourceStatus.EN_ROUTE || res.status === ResourceStatus.ON_SCENE;

          return (
            <div
              key={res.id}
              className={`p-4 rounded-2xl bg-surface-card border transition-all space-y-3 ${
                isAvail
                  ? 'border-slate-800 hover:border-slate-700'
                  : isAssigned
                  ? 'border-amber-500/50 bg-amber-950/10'
                  : 'border-slate-800/60 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm text-white">{res.name}</h3>
                  <span className="text-[11px] font-mono text-cyan-400">{res.type}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                    isAvail
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                      : isAssigned
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-700/60'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {res.status}
                </span>
              </div>

              <div className="text-xs text-slate-400 space-y-1">
                <p>🏢 {res.organization}</p>
                <p className="flex items-center gap-1">
                  <Phone size={12} /> {res.contact}
                </p>
                <p className="flex items-center gap-1 font-mono text-[11px]">
                  <MapPin size={12} /> Lat: {res.latitude.toFixed(4)}, Lon: {res.longitude.toFixed(4)}
                </p>
              </div>

              {/* Capabilities Tags */}
              <div className="flex flex-wrap gap-1 pt-1">
                {res.capabilities?.map((cap: string) => (
                  <span
                    key={cap}
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-surface-200 text-slate-300 border border-slate-700/60"
                  >
                    {cap}
                  </span>
                ))}
              </div>

              {/* Quick Status Toggle Button */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">Capacity: {res.capacity} crew/seats</span>
                <button
                  onClick={() => toggleStatus(res)}
                  className="text-xs text-blue-400 hover:text-blue-300 underline font-medium"
                >
                  Toggle Standby
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
