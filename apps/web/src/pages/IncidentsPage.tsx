import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  CheckCircle,
  Clock,
  MapPin,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { api } from '../lib/api';
import { SeverityBadge } from '../components/SeverityBadge';
import { CategoryIcon } from '../components/CategoryIcon';
import { Incident } from '@resqgrid/types';

export const IncidentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'priority' | 'time' | 'affected'>('priority');

  const loadIncidents = async () => {
    setIsLoading(true);
    try {
      const res = await api.getIncidents();
      if (res.success) {
        setIncidents(res.data);
      }
    } catch (e) {
      console.warn('Failed to load incidents');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  const filtered = incidents
    .filter((inc) => {
      if (categoryFilter !== 'ALL' && inc.category !== categoryFilter) return false;
      if (severityFilter !== 'ALL' && inc.severity !== severityFilter) return false;
      if (statusFilter !== 'ALL' && inc.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          inc.title.toLowerCase().includes(q) ||
          inc.incidentCode.toLowerCase().includes(q) ||
          inc.address.toLowerCase().includes(q) ||
          inc.description.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'priority') return (b.priorityScore || 0) - (a.priorityScore || 0);
      if (sortBy === 'affected') return (b.affectedPeople || 0) - (a.affectedPeople || 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/70 border border-blue-500/40 text-blue-300 text-xs font-mono mb-2">
            <ShieldAlert size={14} />
            <span>INCIDENT INVENTORY GRID</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-mono">Incident Management Operations</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Query, filter, and audit verified emergency incidents across the grid sector.
          </p>
        </div>

        <button
          onClick={loadIncidents}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-100 hover:bg-surface-50 text-slate-300 border border-slate-700 text-xs font-medium self-start sm:self-auto"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Control Bar */}
      <div className="p-4 rounded-2xl bg-surface-card border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search size={15} className="absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code, title, street address..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-200 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-surface-200 border border-slate-700/80 text-slate-200 text-xs focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="FIRE">Fire</option>
            <option value="FLOOD">Flood</option>
            <option value="MEDICAL">Medical</option>
            <option value="ACCIDENT">Accident</option>
            <option value="HAZMAT">Hazmat</option>
            <option value="STRUCTURAL">Structural</option>
            <option value="SECURITY">Security</option>
            <option value="MISSING_PERSON">Missing Person</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-surface-200 border border-slate-700/80 text-slate-200 text-xs focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-surface-200 border border-slate-700/80 text-slate-200 text-xs focus:outline-none cursor-pointer"
          >
            <option value="priority">Sort: Priority Score</option>
            <option value="time">Sort: Most Recent</option>
            <option value="affected">Sort: Most Casualties</option>
          </select>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="rounded-2xl bg-surface-card border border-slate-800 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-200/70 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Code</th>
                <th className="py-3.5 px-4">Emergency Title</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Severity</th>
                <th className="py-3.5 px-4">Priority Score</th>
                <th className="py-3.5 px-4">Affected</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Created</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No matching incidents found
                  </td>
                </tr>
              ) : (
                filtered.map((inc) => (
                  <tr
                    key={inc.id}
                    onClick={() => navigate('/command')}
                    className="hover:bg-surface-100/60 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">{inc.incidentCode}</td>
                    <td className="py-3.5 px-4 max-w-[260px]">
                      <div className="font-semibold text-white truncate">{inc.title}</div>
                      <div className="text-[11px] text-slate-400 truncate">{inc.address}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <CategoryIcon category={inc.category} size={15} />
                        <span>{inc.category}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <SeverityBadge severity={inc.severity} size="sm" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full ${
                              (inc.priorityScore ?? 50) >= 80
                                ? 'bg-red-500'
                                : (inc.priorityScore ?? 50) >= 60
                                ? 'bg-amber-500'
                                : 'bg-blue-500'
                            }`}
                            style={{ width: `${inc.priorityScore || 50}%` }}
                          />
                        </div>
                        <span className="font-mono text-slate-300 text-[11px]">{Math.round(inc.priorityScore || 50)}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono">
                      {inc.affectedPeople} {inc.vulnerablePeople > 0 && <span className="text-red-400">({inc.vulnerablePeople} trapped)</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                        {inc.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/command');
                        }}
                        className="p-1.5 rounded-lg bg-surface-200 hover:bg-blue-600 text-slate-300 hover:text-white transition-colors"
                        title="Inspect in Command Center"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
