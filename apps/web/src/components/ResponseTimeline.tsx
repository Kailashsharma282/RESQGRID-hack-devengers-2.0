import React from 'react';
import { CheckCircle2, Clock, Circle } from 'lucide-react';
import { Incident } from '@resqgrid/types';

interface ResponseTimelineProps {
  incident: Incident | null;
}

const STAGES = [
  { id: 'REPORTED', label: 'Report Received', desc: 'Signal ingested' },
  { id: 'ANALYZED', label: 'AI Analyzed', desc: 'Entities & severity scored' },
  { id: 'VERIFIED', label: 'Verified', desc: 'Command validated' },
  { id: 'MATCHED', label: 'Units Matched', desc: 'Optimal candidates ranked' },
  { id: 'DISPATCHING', label: 'Dispatched', desc: 'Units assigned' },
  { id: 'ACCEPTED', label: 'Accepted', desc: 'En route' },
  { id: 'ON_SCENE', label: 'On Scene', desc: 'First responders active' },
  { id: 'RESOLVED', label: 'Resolved', desc: 'Hazard contained' },
];

export const ResponseTimeline: React.FC<ResponseTimelineProps> = ({ incident }) => {
  if (!incident) {
    return (
      <div className="p-4 rounded-xl bg-surface-card border border-slate-800 text-center text-xs text-slate-500">
        Select an incident to view live operational lifecycle progression
      </div>
    );
  }

  // Calculate current stage index based on incident status and dispatches
  const status = incident.status;
  let activeIndex = 1; // At least REPORTED and AI ANALYZED are done
  if (status === 'VERIFIED') activeIndex = 2;
  else if (status === 'DISPATCHING') activeIndex = 4;
  else if (status === 'RESPONDING') activeIndex = 5;
  else if (status === 'ON_SCENE') activeIndex = 6;
  else if (status === 'RESOLVED' || status === 'CLOSED') activeIndex = 7;

  return (
    <div className="p-4 rounded-xl bg-surface-card border border-slate-800 shadow-xl overflow-x-auto">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock size={15} className="text-blue-400" />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
            Incident Response Lifecycle
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Created: {new Date(incident.createdAt).toLocaleTimeString()}
          {incident.resolvedAt ? ` • Resolved: ${new Date(incident.resolvedAt).toLocaleTimeString()}` : ''}
        </span>
      </div>

      <div className="flex items-center min-w-[700px] justify-between relative py-2">
        {/* Connecting line */}
        <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-0.5 bg-slate-800 -z-0" />
        <div
          className="absolute top-1/2 left-4 -translate-y-1/2 h-0.5 bg-blue-500 transition-all duration-500 -z-0"
          style={{ width: `${(activeIndex / (STAGES.length - 1)) * 96}%` }}
        />

        {STAGES.map((stg, i) => {
          const isDone = i <= activeIndex;
          const isCurrent = i === activeIndex;

          return (
            <div key={stg.id} className="relative z-10 flex flex-col items-center group">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  isCurrent
                    ? 'bg-blue-600 border-2 border-white shadow-[0_0_12px_rgba(59,130,246,0.8)] text-white scale-110'
                    : isDone
                    ? 'bg-emerald-600 text-white'
                    : 'bg-surface-200 border border-slate-700 text-slate-600'
                }`}
              >
                {isDone ? <CheckCircle2 size={15} /> : <Circle size={10} />}
              </div>
              <span
                className={`text-[11px] font-medium mt-1.5 whitespace-nowrap ${
                  isCurrent ? 'text-blue-300 font-bold' : isDone ? 'text-slate-200' : 'text-slate-500'
                }`}
              >
                {stg.label}
              </span>
              <span className="text-[9px] text-slate-500 hidden sm:block whitespace-nowrap">{stg.desc}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
