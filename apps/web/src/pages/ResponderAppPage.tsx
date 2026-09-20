import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Clock,
  Phone,
  ArrowRight,
  ShieldAlert,
  Flame,
  Check,
} from 'lucide-react';
import { api } from '../lib/api';
import { SeverityBadge } from '../components/SeverityBadge';
import { DispatchStatus, ResourceStatus, IncidentStatus } from '@resqgrid/types';
import confetti from 'canvas-confetti';

export const ResponderAppPage: React.FC = () => {
  const [activeDispatch, setActiveDispatch] = useState<any | null>(null);
  const [allDispatches, setAllDispatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [responderNotes, setResponderNotes] = useState('');

  const loadDispatches = async () => {
    setIsLoading(true);
    try {
      const res = await api.getDispatches();
      if (res.success && res.data.length > 0) {
        setAllDispatches(res.data);
        // Look for active dispatch (ASSIGNED, ACCEPTED, EN_ROUTE, ON_SCENE)
        const active = res.data.find(
          (d: any) => d.status !== 'COMPLETED' && d.status !== 'CANCELLED'
        );
        setActiveDispatch(active || res.data[0]);
      }
    } catch (e) {
      console.warn('Failed to load dispatches');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDispatches();
  }, []);

  const handleStatusUpdate = async (nextStatus: DispatchStatus) => {
    if (!activeDispatch) return;
    try {
      const res = await api.updateDispatchStatus(activeDispatch.id, nextStatus, responderNotes);
      if (res.success) {
        setActiveDispatch(res.data);
        if (nextStatus === DispatchStatus.COMPLETED) {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        }
        loadDispatches();
      }
    } catch (e: any) {
      alert(`Status update error: ${e.message}`);
    }
  };

  return (
    <div className="min-h-screen py-6 px-4 max-w-lg mx-auto space-y-4">
      {/* Mobile Device Mockup Header */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-surface-card border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <Smartphone size={16} className="text-blue-400" />
          <span className="font-mono font-bold text-slate-200">TACTICAL MOBILE TERMINAL</span>
        </div>
        <div className="flex items-center gap-1 text-emerald-400 font-mono text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>MDT CONNECTED</span>
        </div>
      </div>

      {/* Dispatch Selector if multiple */}
      {allDispatches.length > 1 && (
        <div className="p-3 rounded-xl bg-surface-card border border-slate-800 space-y-1">
          <label className="text-[10px] uppercase font-mono text-slate-400">Select Active Unit / Callout:</label>
          <select
            value={activeDispatch?.id || ''}
            onChange={(e) => {
              const d = allDispatches.find((x) => x.id === e.target.value);
              if (d) setActiveDispatch(d);
            }}
            className="w-full px-3 py-2 rounded-lg bg-surface-200 border border-slate-700 text-white text-xs"
          >
            {allDispatches.slice(0, 10).map((disp) => (
              <option key={disp.id} value={disp.id}>
                {disp.resource?.name} ➔ {disp.incident?.incidentCode} ({disp.status})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Main Mission Card */}
      {activeDispatch ? (
        <div className="rounded-2xl bg-surface-card border border-blue-500/50 shadow-2xl overflow-hidden space-y-4 p-5 animate-in fade-in">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                ASSIGNED UNIT: {activeDispatch.resource?.name}
              </span>
              <h2 className="text-lg font-bold text-white mt-0.5">{activeDispatch.incident?.title}</h2>
              <span className="font-mono text-xs text-slate-400">{activeDispatch.incident?.incidentCode}</span>
            </div>
            <SeverityBadge severity={activeDispatch.incident?.severity || 'HIGH'} size="md" />
          </div>

          {/* Location & Navigation */}
          <div className="p-3.5 rounded-xl bg-surface-200/80 border border-slate-800 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono">Scene Address</span>
                <p className="text-sm font-semibold text-white mt-0.5">{activeDispatch.incident?.address}</p>
              </div>
              <a
                href={`https://maps.google.com/?q=${activeDispatch.incident?.latitude},${activeDispatch.incident?.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg flex items-center gap-1 text-xs font-semibold"
              >
                <Navigation size={14} />
                <span>Nav</span>
              </a>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/60 text-xs font-mono">
              <div>
                <span className="text-slate-400 text-[10px]">Distance:</span>
                <p className="text-slate-200 font-bold">{activeDispatch.distanceKm} km</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px]">Estimated ETA:</span>
                <p className="text-emerald-400 font-bold">{activeDispatch.etaMinutes} minutes</p>
              </div>
            </div>
          </div>

          {/* Incident Situational Intelligence */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
              Situational Briefing
            </span>
            <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-800/40 text-xs text-slate-200 leading-relaxed">
              {activeDispatch.incident?.aiSummary || activeDispatch.incident?.description}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-1">
              <span>Affected: <strong className="text-white">{activeDispatch.incident?.affectedPeople}</strong></span>
              <span>Trapped: <strong className="text-red-400">{activeDispatch.incident?.vulnerablePeople}</strong></span>
              <span>Current Status: <strong className="text-cyan-400">{activeDispatch.status}</strong></span>
            </div>
          </div>

          {/* Quick Notes / SITREP */}
          <div>
            <label className="text-xs text-slate-400 block mb-1">Field SITREP Notes (Optional):</label>
            <input
              type="text"
              value={responderNotes}
              onChange={(e) => setResponderNotes(e.target.value)}
              placeholder="e.g. 2nd floor search commencing, ventilation fan staged"
              className="w-full px-3 py-2 rounded-xl bg-surface-200 border border-slate-700 text-xs text-white placeholder-slate-500"
            />
          </div>

          {/* Operational Action Workflow Buttons */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            {activeDispatch.status === DispatchStatus.ASSIGNED && (
              <button
                onClick={() => handleStatusUpdate(DispatchStatus.ACCEPTED)}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(59,130,246,0.4)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check size={18} />
                <span>1. Accept Assignment</span>
              </button>
            )}

            {activeDispatch.status === DispatchStatus.ACCEPTED && (
              <button
                onClick={() => handleStatusUpdate(DispatchStatus.EN_ROUTE)}
                className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Navigation size={18} />
                <span>2. Mark Unit En Route</span>
              </button>
            )}

            {activeDispatch.status === DispatchStatus.EN_ROUTE && (
              <button
                onClick={() => handleStatusUpdate(DispatchStatus.ON_SCENE)}
                className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Radio size={18} className="animate-pulse" />
                <span>3. Mark Arrived On Scene</span>
              </button>
            )}

            {activeDispatch.status === DispatchStatus.ON_SCENE && (
              <button
                onClick={() => handleStatusUpdate(DispatchStatus.COMPLETED)}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 size={18} />
                <span>4. Complete Call & Return Available</span>
              </button>
            )}

            {activeDispatch.status === DispatchStatus.COMPLETED && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-600/60 text-center text-xs text-emerald-300 font-bold">
                ✓ Call Completed. Unit Returned to Available Grid.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-surface-card border border-slate-800 text-center text-xs text-slate-500">
          No active emergency callouts currently assigned to this unit.
        </div>
      )}
    </div>
  );
};
