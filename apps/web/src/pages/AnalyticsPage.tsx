import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Clock,
  ShieldCheck,
  Zap,
  Users,
  GitMerge,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../lib/api';

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#38bdf8',
};

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await api.getAnalyticsOverview();
        if (res.success) {
          setData(res.data);
        }
      } catch (e) {
        console.warn('Failed to load analytics');
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (isLoading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">
        Generating real-time emergency telemetry...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/70 border border-blue-500/40 text-blue-300 text-xs font-mono mb-2">
          <BarChart3 size={14} />
          <span>EXECUTIVE DISPATCH METRICS & SYSTEM IMPACT</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white font-mono">Emergency Intelligence Analytics</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Real-time analysis of response velocity, signal fusion savings, and resource saturation.
        </p>
      </div>

      {/* SYSTEM IMPACT RIBBON */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 via-purple-950/30 to-slate-900 border border-blue-500/40 shadow-2xl">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={18} className="text-yellow-400 animate-pulse" />
          <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
            Quantified System Impact
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-surface-card/80 border border-slate-800">
            <span className="text-xs text-slate-400">People Assisted</span>
            <p className="text-3xl font-bold font-mono text-white mt-1">
              {data.peopleAssistedTotal}+
            </p>
            <span className="text-[10px] text-emerald-400 font-mono mt-1 block">Live scene triage</span>
          </div>

          <div className="p-4 rounded-xl bg-surface-card/80 border border-slate-800">
            <span className="text-xs text-slate-400">Signal Deduplication</span>
            <p className="text-3xl font-bold font-mono text-purple-400 mt-1">
              {data.duplicateReportsMerged}
            </p>
            <span className="text-[10px] text-purple-300 font-mono mt-1 block">Duplicate calls fused</span>
          </div>

          <div className="p-4 rounded-xl bg-surface-card/80 border border-slate-800">
            <span className="text-xs text-slate-400">Operator Time Saved</span>
            <p className="text-3xl font-bold font-mono text-cyan-400 mt-1">
              {data.estimatedTimeSavedMinutes} <span className="text-base font-normal">min</span>
            </p>
            <span className="text-[10px] text-cyan-300 font-mono mt-1 block">Triage overhead reduced</span>
          </div>

          <div className="p-4 rounded-xl bg-surface-card/80 border border-slate-800">
            <span className="text-xs text-slate-400">Average Dispatch Speed</span>
            <p className="text-3xl font-bold font-mono text-emerald-400 mt-1">
              {data.avgDispatchTimeMinutes} <span className="text-base font-normal">min</span>
            </p>
            <span className="text-[10px] text-emerald-300 font-mono mt-1 block">Sub-3 min deployment</span>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Incidents by Category */}
        <div className="p-5 rounded-2xl bg-surface-card border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Incidents by Emergency Category
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Current Sector</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.incidentsByCategory}>
                <XAxis dataKey="category" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0d1527', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Severity Distribution */}
        <div className="p-5 rounded-2xl bg-surface-card border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Severity Distribution
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Priority Ratio</span>
          </div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.incidentsBySeverity}
                  dataKey="count"
                  nameKey="severity"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {data.incidentsBySeverity.map((entry: any) => (
                    <Cell key={entry.severity} fill={SEVERITY_COLORS[entry.severity] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0d1527', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-4 text-xs font-mono">
            {data.incidentsBySeverity.map((entry: any) => (
              <div key={entry.severity} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: SEVERITY_COLORS[entry.severity] || '#64748b' }}
                />
                <span className="text-slate-300">{entry.severity}: {entry.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 3: Hourly Emergency Activity */}
        <div className="p-5 rounded-2xl bg-surface-card border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Hourly Call Volume Trend
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">24h Rolling Window</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.hourlyActivity}>
                <defs>
                  <linearGradient id="callVol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0d1527', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="count" stroke="#06b6d4" fillOpacity={1} fill="url(#callVol)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Resource Utilization */}
        <div className="p-5 rounded-2xl bg-surface-card border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Apparatus Fleet Utilization
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Dispatched vs Standby</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.resourceUtilization}>
                <XAxis dataKey="type" stroke="#64748b" fontSize={9} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0d1527', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="total" fill="#1e293b" name="Total in Fleet" radius={[4, 4, 0, 0]} />
                <Bar dataKey="inUse" fill="#f59e0b" name="Dispatched Active" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
