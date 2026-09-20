import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Flame,
  Radio,
  Users,
  Truck,
  CheckCircle,
  AlertTriangle,
  Send,
  GitMerge,
  Search,
  Filter,
  Layers,
  Clock,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { api } from '../lib/api';
import { getSocket, WS_EVENTS } from '../lib/socket';
import { EmergencyMap } from '../components/EmergencyMap';
import { SeverityBadge } from '../components/SeverityBadge';
import { CategoryIcon } from '../components/CategoryIcon';
import { ResponseTimeline } from '../components/ResponseTimeline';
import { Incident, Resource, ResourceMatchCandidate, IncidentStatus } from '@resqgrid/types';
import confetti from 'canvas-confetti';

export const CommandCenterPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [recommendations, setRecommendations] = useState<ResourceMatchCandidate[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  // Filters & Search
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [mobileTab, setMobileTab] = useState<'map' | 'feed' | 'intel'>('map');

  // Load Initial Data
  const loadData = async () => {
    try {
      const [incRes, resRes, statsRes] = await Promise.all([
        api.getIncidents(),
        api.getResources(),
        api.getAnalyticsOverview(),
      ]);

      if (incRes.success) {
        setIncidents(incRes.data);
        if (incRes.data.length > 0 && !selectedIncident) {
          // Select first critical or first incident
          const defaultInc = incRes.data.find((i: Incident) => i.severity === 'CRITICAL') || incRes.data[0];
          handleSelectIncident(defaultInc);
        }
      }

      if (resRes.success) {
        setResources(resRes.data);
      }

      if (statsRes.success) {
        setAnalytics(statsRes.data);
      }
    } catch (err) {
      console.error('Error loading command center data:', err);
    }
  };

  const handleSelectIncident = async (incident: Incident) => {
    setSelectedIncident(incident);
    try {
      const res = await api.getIncidentById(incident.id);
      if (res.success) {
        setSelectedIncident(res.data);
        setRecommendations(res.data.recommendations || []);
      }
    } catch (e) {
      console.warn('Could not fetch detailed recommendations');
    }
  };

  useEffect(() => {
    loadData();

    const socket = getSocket();

    const onIncidentCreated = (newInc: Incident) => {
      setIncidents((prev) => [newInc, ...prev]);
      handleSelectIncident(newInc);
    };

    const onIncidentUpdated = (updated: any) => {
      setIncidents((prev) => prev.map((i) => (i.id === updated.id ? { ...i, ...updated } : i)));
      if (selectedIncident?.id === updated.id) {
        setSelectedIncident((prev) => (prev ? { ...prev, ...updated } : null));
      }
    };

    const onResourceUpdated = () => {
      api.getResources().then((r) => r.success && setResources(r.data));
    };

    socket.on(WS_EVENTS.INCIDENT_CREATED, onIncidentCreated);
    socket.on(WS_EVENTS.INCIDENT_UPDATED, onIncidentUpdated);
    socket.on(WS_EVENTS.RESOURCE_ASSIGNED, onResourceUpdated);
    socket.on(WS_EVENTS.RESOURCE_UPDATED, onResourceUpdated);

    return () => {
      socket.off(WS_EVENTS.INCIDENT_CREATED, onIncidentCreated);
      socket.off(WS_EVENTS.INCIDENT_UPDATED, onIncidentUpdated);
      socket.off(WS_EVENTS.RESOURCE_ASSIGNED, onResourceUpdated);
      socket.off(WS_EVENTS.RESOURCE_UPDATED, onResourceUpdated);
    };
  }, [selectedIncident?.id]);

  // Dispatch Action
  const handleDispatchTopUnits = async () => {
    if (!selectedIncident) return;
    setIsDispatching(true);

    try {
      const availableUnits = recommendations.filter((r) => r.recommended).slice(0, 3);
      const resourceIds = availableUnits.length > 0
        ? availableUnits.map((c) => c.resource.id)
        : recommendations.slice(0, 2).map((c) => c.resource.id);

      if (resourceIds.length === 0) {
        alert('No candidate resources available to dispatch.');
        setIsDispatching(false);
        return;
      }

      await api.dispatchToIncident(selectedIncident.id, resourceIds, undefined, 'Immediate Code 3 Response');
      // Refresh selected incident details
      const res = await api.getIncidentById(selectedIncident.id);
      if (res.success) {
        setSelectedIncident(res.data);
        setRecommendations(res.data.recommendations || []);
      }
      loadData();
    } catch (e: any) {
      alert(`Dispatch error: ${e.message}`);
    } finally {
      setIsDispatching(false);
    }
  };

  // Verify Action
  const handleVerify = async () => {
    if (!selectedIncident) return;
    setIsVerifying(true);
    try {
      await api.verifyIncident(selectedIncident.id);
      const res = await api.getIncidentById(selectedIncident.id);
      if (res.success) setSelectedIncident(res.data);
      loadData();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsVerifying(false);
    }
  };

  // Resolve Action
  const handleResolve = async () => {
    if (!selectedIncident) return;
    setIsResolving(true);
    try {
      await api.resolveIncident(selectedIncident.id);
      const res = await api.getIncidentById(selectedIncident.id);
      if (res.success) setSelectedIncident(res.data);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      loadData();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsResolving(false);
    }
  };

  // Filtered list
  const filteredIncidents = incidents.filter((inc) => {
    if (filterSeverity !== 'ALL' && inc.severity !== filterSeverity) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        inc.title.toLowerCase().includes(q) ||
        inc.incidentCode.toLowerCase().includes(q) ||
        inc.category.toLowerCase().includes(q) ||
        inc.address.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] p-3 sm:p-4 space-y-4 max-w-[1700px] mx-auto">
      {/* Top Tactical KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl bg-surface-card border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Active Incidents</span>
            <p className="text-2xl font-bold font-mono text-white mt-0.5">
              {analytics?.activeIncidents ?? incidents.filter((i) => i.status !== 'RESOLVED').length}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-800/60 text-red-400">
            <Radio size={18} className="animate-pulse" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-card border border-red-900/60 bg-red-950/20 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-red-400 uppercase tracking-wider">Critical Priority</span>
            <p className="text-2xl font-bold font-mono text-red-400 mt-0.5">
              {incidents.filter((i) => i.severity === 'CRITICAL' && i.status !== 'RESOLVED').length}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-red-900/40 text-red-300">
            <Flame size={18} />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-card border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Active Responders</span>
            <p className="text-2xl font-bold font-mono text-cyan-400 mt-0.5">{analytics?.respondersActive ?? 16}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-800/60 text-cyan-400">
            <Users size={18} />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-card border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Units Dispatched</span>
            <p className="text-2xl font-bold font-mono text-amber-400 mt-0.5">
              {resources.filter((r) => r.status !== 'AVAILABLE').length}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-800/60 text-amber-400">
            <Truck size={18} />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-card border border-slate-800 flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">People Affected</span>
            <p className="text-2xl font-bold font-mono text-purple-400 mt-0.5">
              {incidents.reduce((sum, i) => sum + (i.affectedPeople || 0), 0)}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-purple-950/60 border border-purple-800/60 text-purple-400">
            <ShieldAlert size={18} />
          </div>
        </div>
      </div>

      {/* Mobile / Tablet Segmented View Switcher (< 1024px) */}
      <div className="lg:hidden flex items-center p-1.5 rounded-xl bg-surface-card border border-slate-800 text-xs font-mono gap-1">
        <button
          onClick={() => setMobileTab('map')}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === 'map' ? 'bg-blue-600 text-white font-bold shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers size={14} />
          <span>Radar Map</span>
        </button>
        <button
          onClick={() => setMobileTab('feed')}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === 'feed' ? 'bg-blue-600 text-white font-bold shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Radio size={14} />
          <span>Feed ({filteredIncidents.length})</span>
        </button>
        <button
          onClick={() => setMobileTab('intel')}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === 'intel' ? 'bg-blue-600 text-white font-bold shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles size={14} />
          <span>Intelligence</span>
        </button>
      </div>

      {/* Main 3-Column Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-18rem)] min-h-[560px]">
        {/* LEFT COLUMN: Incident Feed (3 cols) */}
        <div className={`lg:col-span-3 flex-col h-full rounded-2xl bg-surface-card border border-slate-800 overflow-hidden shadow-xl ${
          mobileTab === 'feed' ? 'flex' : 'hidden lg:flex'
        }`}>
          {/* Feed Header & Filters */}
          <div className="p-3.5 border-b border-slate-800 space-y-2.5 bg-surface-200/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono text-slate-200 flex items-center gap-1.5">
                <Radio size={14} className="text-red-400 animate-pulse" />
                INCIDENT FEED ({filteredIncidents.length})
              </span>
              <button
                onClick={loadData}
                className="p-1 rounded text-slate-400 hover:text-white"
                title="Refresh feed"
              >
                <RefreshCw size={13} />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search code, title, address..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-surface-300 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Severity Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto text-[10px] font-mono">
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    filterSeverity === sev
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-surface-100 text-slate-400 hover:text-white'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* Incident Feed List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-1.5 space-y-1">
            {filteredIncidents.map((inc) => {
              const isSelected = selectedIncident?.id === inc.id;
              const hasDuplicates = (inc.reports?.length || 0) > 1;

              return (
                <div
                  key={inc.id}
                  onClick={() => {
                    handleSelectIncident(inc);
                    if (window.innerWidth < 1024) setMobileTab('intel');
                  }}
                  className={`p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-950/60 border border-blue-500/80 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                      : 'hover:bg-surface-200/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5">
                      <CategoryIcon category={inc.category} size={15} />
                      <span className="text-xs font-mono font-bold text-slate-200">{inc.incidentCode}</span>
                    </div>
                    <SeverityBadge severity={inc.severity} size="sm" />
                  </div>

                  <h4 className="text-xs font-semibold text-white truncate mb-1">{inc.title}</h4>
                  <p className="text-[11px] text-slate-400 truncate mb-2">{inc.address}</p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>{inc.affectedPeople} affected</span>
                    <div className="flex items-center gap-1.5">
                      {hasDuplicates && (
                        <span className="px-1.5 py-0.5 rounded bg-purple-950/90 text-purple-300 border border-purple-800 text-[9px] font-mono flex items-center gap-1">
                          <GitMerge size={10} /> {inc.reports?.length} signals
                        </span>
                      )}
                      <span className="text-blue-400 font-medium uppercase">{inc.status}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CENTER COLUMN: Tactical Leaflet Map (5 cols) */}
        <div className={`lg:col-span-5 h-full flex-col ${
          mobileTab === 'map' ? 'flex' : 'hidden lg:flex'
        }`}>
          <EmergencyMap
            incidents={incidents}
            resources={resources}
            selectedIncident={selectedIncident}
            recommendedResources={recommendations}
            onSelectIncident={(inc) => {
              handleSelectIncident(inc);
              if (window.innerWidth < 1024) setMobileTab('intel');
            }}
          />
        </div>

        {/* RIGHT COLUMN: Selected Incident Intelligence Drawer (4 cols) */}
        <div className={`lg:col-span-4 flex-col h-full rounded-2xl bg-surface-card border border-slate-800 overflow-hidden shadow-xl ${
          mobileTab === 'intel' ? 'flex' : 'hidden lg:flex'
        }`}>
          {selectedIncident ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Incident Header */}
              <div className="pb-3 border-b border-slate-800">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-mono text-sm font-bold text-cyan-400 tracking-wider">
                    {selectedIncident.incidentCode}
                  </span>
                  <SeverityBadge severity={selectedIncident.severity} size="md" />
                </div>
                <h3 className="text-base font-bold text-white leading-snug">{selectedIncident.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedIncident.address}</p>
              </div>

              {/* AI Recommendation Banner (Notice: human-in-the-loop) */}
              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-600/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-blue-300 text-xs font-semibold">
                    <Sparkles size={14} className="text-blue-400" />
                    <span>AI Recommendation</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    Operator Decision Required
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">{selectedIncident.aiSummary}</p>
                {selectedIncident.aiReasoning && (
                  <p className="text-[11px] text-slate-400 italic pt-1 border-t border-blue-900/60">
                    {selectedIncident.aiReasoning}
                  </p>
                )}
              </div>

              {/* Casualty Counters */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 rounded-xl bg-surface-200/70 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Affected People</span>
                  <p className="text-xl font-bold font-mono text-white mt-0.5">{selectedIncident.affectedPeople}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-surface-200/70 border border-slate-800 text-center">
                  <span className="text-[10px] text-red-400 uppercase font-mono">Trapped / Vulnerable</span>
                  <p className="text-xl font-bold font-mono text-red-400 mt-0.5">{selectedIncident.vulnerablePeople}</p>
                </div>
              </div>

              {/* Recommended Candidate Emergency Units */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                    Smart Candidate Matching
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Multi-Factor Weighted Fit
                  </span>
                </div>

                <div className="space-y-2">
                  {recommendations.slice(0, 3).map((candidate) => (
                    <div
                      key={candidate.resource.id}
                      className={`p-3 rounded-xl border transition-all ${
                        candidate.recommended
                          ? 'bg-blue-950/30 border-blue-600/60'
                          : 'bg-surface-200/40 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white">{candidate.resource.name}</span>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {candidate.matchingScore}% Fit
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-1 font-mono">
                        <span>📍 {candidate.distanceKm} km</span>
                        <span>⏱️ ETA {candidate.etaMinutes} min</span>
                        <span className="text-slate-300">{candidate.resource.type}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 italic line-clamp-1">{candidate.reasoning}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Corroborated Duplicate Reports */}
              {selectedIncident.reports && selectedIncident.reports.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <GitMerge size={13} className="text-purple-400" />
                    <span>Corroborated Crowd Signals ({selectedIncident.reports.length})</span>
                  </span>
                  <div className="space-y-1.5">
                    {selectedIncident.reports.map((rep: any) => (
                      <div key={rep.id} className="p-2.5 rounded-lg bg-surface-200/50 border border-slate-800/80 text-xs">
                        <p className="text-slate-300">{rep.text}</p>
                        <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                          Source: {rep.source} • {new Date(rep.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Operator Action Buttons */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <button
                  onClick={handleDispatchTopUnits}
                  disabled={isDispatching || selectedIncident.status === 'RESOLVED'}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Send size={15} />
                  <span>{isDispatching ? 'Dispatching...' : 'Dispatch Recommended Units'}</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleVerify}
                    disabled={isVerifying || selectedIncident.status === 'VERIFIED' || selectedIncident.status === 'RESOLVED'}
                    className="py-2 rounded-lg bg-surface-100 hover:bg-surface-50 text-slate-300 text-xs font-medium border border-slate-700 disabled:opacity-50"
                  >
                    {selectedIncident.status === 'VERIFIED' ? '✓ Verified' : 'Verify Incident'}
                  </button>
                  <button
                    onClick={handleResolve}
                    disabled={isResolving || selectedIncident.status === 'RESOLVED'}
                    className="py-2 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-xs font-medium disabled:opacity-50"
                  >
                    {selectedIncident.status === 'RESOLVED' ? '✓ Resolved' : 'Resolve Incident'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6 text-center text-slate-500 text-xs">
              Select an incident from the feed to inspect intelligence & dispatch response.
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM SECTION: Live Response Timeline */}
      <ResponseTimeline incident={selectedIncident} />
    </div>
  );
};
