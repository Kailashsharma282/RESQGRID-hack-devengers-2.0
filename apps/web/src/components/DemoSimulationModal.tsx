import React from 'react';
import { useDemo, DEMO_STEPS } from '../context/DemoContext';
import { X, Play, RotateCcw, CheckCircle2, ChevronRight, Zap, ShieldAlert } from 'lucide-react';

export const DemoSimulationModal: React.FC = () => {
  const {
    showModal,
    setShowModal,
    currentStep,
    isAutoRunning,
    runFullScenario,
    executeStep,
    resetDemo,
    demoLogs,
  } = useDemo();

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-3xl rounded-2xl bg-surface-card border border-blue-500/40 shadow-[0_0_50px_rgba(37,99,235,0.25)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-surface-200/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-950/80 border border-red-500/50 text-red-400">
              <Zap size={20} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Live Scenario Simulation
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/60 border border-blue-700 text-blue-300 font-normal">
                  Campus Chemical Fire Demo
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Witness the full lifecycle: Citizen report → AI extraction → Signal fusion → Resource match → Dispatch → Resolution
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-surface-200/50 border border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={runFullScenario}
                disabled={isAutoRunning}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50"
              >
                <Play size={16} className={isAutoRunning ? 'animate-spin' : ''} />
                {isAutoRunning ? 'Executing Live Sequence...' : 'Run Auto 3-Min Sequence'}
              </button>
              <button
                onClick={resetDemo}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm border border-slate-700"
              >
                <RotateCcw size={14} /> Reset State
              </button>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Scenario Target: <span className="font-mono text-slate-200">RQ-2026-0042</span>
            </div>
          </div>

          {/* Stepper Progression */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Emergency Signal Lifecycle (Click any step to trigger on demand)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {DEMO_STEPS.map((s) => {
                const isActive = currentStep === s.step;
                const isCompleted = currentStep > s.step;

                return (
                  <button
                    key={s.step}
                    onClick={() => executeStep(s.step)}
                    disabled={isAutoRunning}
                    className={`text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                      isActive
                        ? 'bg-blue-950/60 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                        : isCompleted
                        ? 'bg-surface-200/40 border-emerald-700/60 text-slate-300'
                        : 'bg-surface-200/20 border-slate-800/80 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="mt-0.5">
                      {isCompleted ? (
                        <CheckCircle2 size={18} className="text-emerald-400" />
                      ) : (
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border ${
                            isActive
                              ? 'border-blue-400 bg-blue-500 text-white'
                              : 'border-slate-700 text-slate-500'
                          }`}
                        >
                          {s.step}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-200">{s.title}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                            isActive
                              ? 'bg-blue-900 text-blue-300'
                              : isCompleted
                              ? 'bg-emerald-950 text-emerald-300'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {s.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{s.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real-Time Simulation Console Log */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span>Telemetry & Audit Stream</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </h3>
            <div className="h-32 rounded-xl bg-slate-950 border border-slate-800/80 p-3 font-mono text-[11px] text-slate-300 overflow-y-auto space-y-1">
              {demoLogs.length === 0 ? (
                <div className="text-slate-600 italic">Ready to run scenario. Click "Run Auto 3-Min Sequence" or step 1.</div>
              ) : (
                demoLogs.map((log, i) => (
                  <div key={i} className="leading-tight">
                    <span className="text-blue-400">{log}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-surface-200/40 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Current Scenario Stage: <strong className="text-white">{currentStep > 0 ? `Stage ${currentStep} of 6` : 'Standby'}</strong>
          </span>
          <button
            onClick={() => setShowModal(false)}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
