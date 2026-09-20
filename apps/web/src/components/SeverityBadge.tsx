import React from 'react';
import { IncidentSeverity } from '@resqgrid/types';

interface SeverityBadgeProps {
  severity: IncidentSeverity | string;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  size = 'md',
  pulse = true,
}) => {
  const sev = String(severity).toUpperCase();

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5 font-semibold',
  }[size];

  switch (sev) {
    case 'CRITICAL':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider bg-red-950/80 border border-red-500/80 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.35)] ${sizeClasses}`}
        >
          {pulse && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />}
          {!pulse && <span className="w-2 h-2 rounded-full bg-red-500" />}
          CRITICAL
        </span>
      );
    case 'HIGH':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-medium uppercase tracking-wider bg-amber-950/80 border border-amber-500/70 text-amber-300 ${sizeClasses}`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          HIGH
        </span>
      );
    case 'MEDIUM':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-medium uppercase tracking-wider bg-yellow-950/60 border border-yellow-500/50 text-yellow-300 ${sizeClasses}`}
        >
          <span className="w-2 h-2 rounded-full bg-yellow-400" />
          MEDIUM
        </span>
      );
    case 'LOW':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-medium uppercase tracking-wider bg-cyan-950/60 border border-cyan-500/50 text-cyan-300 ${sizeClasses}`}
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          LOW
        </span>
      );
    case 'RESOLVED':
    case 'CLOSED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-medium uppercase tracking-wider bg-emerald-950/70 border border-emerald-500/60 text-emerald-300 ${sizeClasses}`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          RESOLVED
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 ${sizeClasses}`}>
          {sev}
        </span>
      );
  }
};
