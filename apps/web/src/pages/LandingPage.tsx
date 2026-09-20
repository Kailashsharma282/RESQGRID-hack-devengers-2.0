import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  ArrowRight,
  Radio,
  Cpu,
  Flame,
  Zap,
  CheckCircle,
  Clock,
  Layers,
  Sparkles,
  Users,
  Activity,
  ChevronRight,
  GitMerge,
  Radar,
} from 'lucide-react';
import { useDemo } from '../context/DemoContext';

export const LandingPage: React.FC = () => {
  const { setShowModal } = useDemo();

  return (
    <div className="min-h-screen bg-background text-slate-100 selection:bg-brand-primary selection:text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-slate-800/80">
        {/* Ambient background glow and grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-600/20 to-cyan-500/20 blur-[130px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          {/* Tag Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-950/80 border border-blue-500/40 text-blue-300 text-xs font-mono mb-8 shadow-[0_0_20px_rgba(59,130,246,0.3)] animate-pulse">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>HACKATHON: HACK DEVENGERS 2.0</span>
            <span className="text-slate-500">|</span>
            <span className="text-cyan-300 font-semibold">BY POCHIRAJU KAILASH RAM MARKANDEYA SHARMA</span>
          </div>

          {/* Master Slogan */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.1] mb-6 font-mono">
            TURN <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-yellow-300">CHAOS</span> INTO{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300">
              COORDINATED RESPONSE.
            </span>
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-10 font-normal leading-relaxed">
            ResQGrid fuses fragmented citizen reports, audio transcripts, images, and telemetry into structured incidents,
            deduplicates chaotic signals, and dispatches responders in real time.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
            <Link
              to="/command"
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all hover:scale-105"
            >
              <Radar className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
              <span>Open Command Center</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/report"
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-red-950/80 hover:bg-red-900/80 border border-red-500/60 text-red-200 font-semibold text-base transition-all hover:scale-105 shadow-lg shadow-red-950/40"
            >
              <Flame className="w-5 h-5 text-red-400" />
              <span>Report Emergency</span>
            </Link>

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-surface-100 hover:bg-surface-50 border border-slate-700 text-slate-200 font-medium text-base transition-all"
            >
              <Zap className="w-5 h-5 text-yellow-400 animate-pulse" />
              <span>Run Live Scenario Demo</span>
            </button>
          </div>

          {/* Real-time KPI summary ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto p-4 rounded-2xl bg-surface-card/80 border border-slate-800 shadow-2xl backdrop-blur-md text-left">
            <div className="p-3 border-r border-slate-800/80">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">Response Time</span>
              <p className="text-2xl sm:text-3xl font-bold text-white mt-1">
                2.8 <span className="text-sm font-normal text-emerald-400">min avg</span>
              </p>
            </div>
            <div className="p-3 border-r border-slate-800/80">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">Signal Fusion</span>
              <p className="text-2xl sm:text-3xl font-bold text-white mt-1">
                94% <span className="text-sm font-normal text-blue-400">dedup rate</span>
              </p>
            </div>
            <div className="p-3 border-r border-slate-800/80">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">Active Units</span>
              <p className="text-2xl sm:text-3xl font-bold text-white mt-1">
                20 <span className="text-sm font-normal text-cyan-400">connected</span>
              </p>
            </div>
            <div className="p-3">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">Decision Support</span>
              <p className="text-2xl sm:text-3xl font-bold text-white mt-1">
                100% <span className="text-sm font-normal text-purple-400">human verified</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Differentiator: Emergency Signal Fusion */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-700/60 text-purple-300 text-xs font-mono mb-4">
            <Sparkles size={14} /> CORE INNOVATION
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white font-mono">
            Emergency Signal Fusion
          </h2>
          <p className="text-slate-400 mt-4 text-base sm:text-lg">
            Traditional 911 dispatch treats every call independently, causing operator overload. ResQGrid continuously
            fuses crowd reports into one evolving operational picture.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Pillar 1: DETECT */}
          <div className="p-8 rounded-2xl bg-surface-card border border-slate-800/80 hover:border-blue-500/50 transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-950 border border-blue-600/50 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                <Radio className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono text-blue-400 uppercase tracking-wider">Pillar 01</span>
              <h3 className="text-xl font-bold text-white mt-2 mb-3">DETECT</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Ingests unstructured natural language from voice transcripts, citizen mobile uploads, and text reports.
                Extracts categories, casualty counts, trapped individuals, and required resource classes using validated AI.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center text-xs text-blue-400 font-medium gap-1">
              <span>Structured Zod Extraction</span>
              <ChevronRight size={14} />
            </div>
          </div>

          {/* Pillar 2: DECIDE */}
          <div className="p-8 rounded-2xl bg-surface-card border border-slate-800/80 hover:border-amber-500/50 transition-all hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-950 border border-amber-600/50 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform">
                <GitMerge className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono text-amber-400 uppercase tracking-wider">Pillar 02</span>
              <h3 className="text-xl font-bold text-white mt-2 mb-3">DECIDE</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Deduplication pipeline combines Haversine spatial radius, temporal windows, and token similarity to merge duplicate reports.
                Deterministic severity engine normalizes priority scores (0-100) and matches optimal nearby units.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center text-xs text-amber-400 font-medium gap-1">
              <span>Multi-Factor Candidate Ranking</span>
              <ChevronRight size={14} />
            </div>
          </div>

          {/* Pillar 3: RESPOND */}
          <div className="p-8 rounded-2xl bg-surface-card border border-slate-800/80 hover:border-emerald-500/50 transition-all hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-600/50 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">Pillar 03</span>
              <h3 className="text-xl font-bold text-white mt-2 mb-3">RESPOND</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Operators dispatch units in 1-click. First responders receive mobile-optimized alerts to accept, mark en route,
                and arrive on scene. Command center monitors live telemetry without page refreshes over WebSockets.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center text-xs text-emerald-400 font-medium gap-1">
              <span>Real-Time WebSocket Sync</span>
              <ChevronRight size={14} />
            </div>
          </div>
        </div>
      </section>

      {/* System Architecture Section */}
      <section className="py-20 border-t border-slate-800/80 bg-surface-200/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl font-bold text-white font-mono">Platform Architecture</h2>
            <p className="text-slate-400 mt-2">
              Modular monolith built for extreme hackathon reliability with real LLM integration and deterministic offline fallback.
            </p>
          </div>

          {/* Architecture Visual Grid */}
          <div className="p-8 rounded-2xl bg-surface-card border border-slate-800 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
              {/* Box 1 */}
              <div className="p-4 rounded-xl bg-surface-200 border border-slate-700 text-center">
                <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-white">Citizen & Sensors</h4>
                <p className="text-[11px] text-slate-400 mt-1">Text, Voice, Media, Geolocation</p>
              </div>

              <div className="text-center text-slate-500 hidden md:block">➔</div>

              {/* Box 2 */}
              <div className="p-4 rounded-xl bg-blue-950/50 border border-blue-700/60 text-center">
                <Cpu className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-white">AI Intelligence Engine</h4>
                <p className="text-[11px] text-slate-400 mt-1">Zod Extraction + Fallback Mode</p>
              </div>

              <div className="text-center text-slate-500 hidden md:block">➔</div>

              {/* Box 3 */}
              <div className="p-4 rounded-xl bg-purple-950/50 border border-purple-700/60 text-center">
                <GitMerge className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-white">Fusion & Deduplication</h4>
                <p className="text-[11px] text-slate-400 mt-1">Haversine + Semantic Cluster</p>
              </div>
            </div>

            <div className="my-6 border-t border-dashed border-slate-800" />

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
              {/* Box 4 */}
              <div className="p-4 rounded-xl bg-amber-950/50 border border-amber-700/60 text-center">
                <Layers className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-white">Matching & Priority</h4>
                <p className="text-[11px] text-slate-400 mt-1">Capability + Proximity + ETA</p>
              </div>

              <div className="text-center text-slate-500 hidden md:block">➔</div>

              {/* Box 5 */}
              <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-700/60 text-center">
                <Radar className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-white">Live Command Center</h4>
                <p className="text-[11px] text-slate-400 mt-1">Leaflet Radar + Operator Dispatch</p>
              </div>

              <div className="text-center text-slate-500 hidden md:block">➔</div>

              {/* Box 6 */}
              <div className="p-4 rounded-xl bg-surface-200 border border-slate-700 text-center">
                <Activity className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-white">Responder Mobile Unit</h4>
                <p className="text-[11px] text-slate-400 mt-1">Accept, Arrive & Resolve</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-800 text-center text-xs text-slate-400 space-y-1">
        <p className="font-semibold text-slate-200">
          ResQGrid — Engineered for <span className="text-blue-400">Hack Devengers 2.0</span> by{' '}
          <span className="text-cyan-300 font-bold">POCHIRAJU KAILASH RAM MARKANDEYA SHARMA</span>
        </p>
        <p className="text-slate-500">
          AI-Powered Emergency Intelligence & Response Coordination Platform • TypeScript, NestJS, Prisma, React, Leaflet & Socket.IO.
        </p>
      </footer>
    </div>
  );
};
