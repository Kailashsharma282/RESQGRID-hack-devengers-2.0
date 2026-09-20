import React, { useState, useEffect } from 'react';
import { Settings, Users, ShieldAlert, History, Key, Server, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';

export const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'audit' | 'users' | 'config'>('audit');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [uRes, logRes] = await Promise.all([api.getUsers(), api.getAuditLogs(50)]);
      if (uRes.success) setUsers(uRes.data);
      if (logRes.success) setAuditLogs(logRes.data);
    } catch (e) {
      console.warn('Failed to fetch admin data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono mb-2">
            <Settings size={14} />
            <span>SYSTEM AUDIT & ADMINISTRATION</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-mono">Platform Admin Operations</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Cryptographic audit trails, identity roles, and emergency pipeline configuration.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-100 hover:bg-surface-50 text-slate-300 border border-slate-700 text-xs font-medium self-start sm:self-auto"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-mono">
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'audit'
              ? 'bg-blue-600 text-white font-bold'
              : 'text-slate-400 hover:text-white hover:bg-surface-200'
          }`}
        >
          <History size={15} />
          <span>Audit Log Trail ({auditLogs.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'users'
              ? 'bg-blue-600 text-white font-bold'
              : 'text-slate-400 hover:text-white hover:bg-surface-200'
          }`}
        >
          <Users size={15} />
          <span>User Directory ({users.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'config'
              ? 'bg-blue-600 text-white font-bold'
              : 'text-slate-400 hover:text-white hover:bg-surface-200'
          }`}
        >
          <Server size={15} />
          <span>System Config & Telemetry</span>
        </button>
      </div>

      {/* TAB 1: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="rounded-2xl bg-surface-card border border-slate-800 shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Traceable Operational Event Log (Immutable)
            </span>
            <span className="text-xs text-emerald-400 font-mono">● LIVE RECORDING</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-200/60 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Metadata Payload</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {auditLogs.slice(0, 30).map((log) => (
                  <tr key={log.id} className="hover:bg-surface-200/40">
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-cyan-300 border border-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{log.entityType}</td>
                    <td className="py-3 px-4 text-slate-200">{log.user?.name || 'System Auto-Engine'}</td>
                    <td className="py-3 px-4 text-slate-400 max-w-[320px] truncate text-[11px]">
                      {log.metadata ? JSON.stringify(log.metadata) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400 text-[11px]">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: User Directory */}
      {activeTab === 'users' && (
        <div className="rounded-2xl bg-surface-card border border-slate-800 shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Authorized Personnel & Security Roles
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-200/60 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Email Contact</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-200/40">
                    <td className="py-3 px-4 font-semibold text-white">{u.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-blue-950 text-blue-300 border border-blue-800">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono">{u.email}</td>
                    <td className="py-3 px-4 text-slate-400">{u.phone || '—'}</td>
                    <td className="py-3 px-4 text-emerald-400 font-mono text-xs">Active</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: System Config & Telemetry */}
      {activeTab === 'config' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-surface-card border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white font-mono uppercase">AI Engine Status</h3>
            <div className="text-xs space-y-2 font-mono text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span>Model Engine:</span>
                <span className="text-cyan-400">GPT-4o / Deterministic Heuristic Hybrid</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span>Output Schema:</span>
                <span className="text-emerald-400">Strict Zod Object Validation</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span>Offline Fallback:</span>
                <span className="text-purple-400">100% Deterministic Guarantee</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Confidence Threshold:</span>
                <span className="text-white">0.65 Minimum Deduplication</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-surface-card border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white font-mono uppercase">Geospatial Grid Configuration</h3>
            <div className="text-xs space-y-2 font-mono text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span>Geodetic Algorithm:</span>
                <span className="text-cyan-400">Haversine Great-Circle Formula</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span>Clustering Window:</span>
                <span className="text-emerald-400">2.5 km spatial / 12 hr temporal</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span>Sector Center:</span>
                <span className="text-white">37.7749° N, -122.4194° W</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Real-Time Broker:</span>
                <span className="text-emerald-400">Socket.IO WebSockets Active</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
