import React, { createContext, useContext, useState } from 'react';
import { api } from '../lib/api';
import confetti from 'canvas-confetti';

export interface DemoStep {
  step: number;
  title: string;
  description: string;
  badge: string;
}

export const DEMO_STEPS: DemoStep[] = [
  { step: 1, title: 'Initial Report & AI Extraction', description: 'Raw citizen report parsed into structured incident RQ-2026-0042 (CRITICAL FIRE).', badge: 'AI EXTRACTION' },
  { step: 2, title: 'Signal Fusion & Deduplication', description: 'Second crowd report corroborates chemical fire. Fused with 94% similarity.', badge: 'DEDUPLICATION' },
  { step: 3, title: 'Operator Verification', description: 'Command Center operator validates AI analysis and confirms emergency.', badge: 'OPERATOR APPROVAL' },
  { step: 4, title: 'Intelligent Multi-Unit Dispatch', description: 'Engine 02, Medic 04, Trauma Team 07 dispatched with optimal ETA ranking.', badge: 'SMART DISPATCH' },
  { step: 5, title: 'Units Arrived On Scene', description: 'Field responders reach chemistry building, begin evacuation and containment.', badge: 'ON SCENE' },
  { step: 6, title: 'Incident Resolved & Units Freed', description: 'Fire extinguished, 14 victims evacuated safely. Analytics updated.', badge: 'RESOLUTION' },
];

interface DemoContextType {
  isSimulating: boolean;
  currentStep: number;
  isAutoRunning: boolean;
  demoLogs: string[];
  runFullScenario: () => Promise<void>;
  executeStep: (stepNumber: number) => Promise<void>;
  resetDemo: () => Promise<void>;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [demoLogs, setDemoLogs] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);

  const addLog = (msg: string) => {
    setDemoLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 20)]);
  };

  const executeStep = async (step: number) => {
    setIsSimulating(true);
    setCurrentStep(step);

    try {
      if (step === 1) {
        addLog('Triggering Step 1: Initial emergency report intake...');
        const res = await api.runDemoScenario();
        addLog(`Created incident ${res.data.incidentCode}: ${res.data.title} (${res.data.severity})`);
      } else if (step === 2) {
        addLog('Triggering Step 2: Ingesting second crowd report...');
        await api.demoStepDuplicate();
        addLog('Duplicate detected (94% confidence). Reports fused into single incident.');
      } else if (step === 3) {
        addLog('Triggering Step 3: Command Center operator verification...');
        await api.demoStepVerify();
        addLog('Incident verified by Commander Sarah Jenkins.');
      } else if (step === 4) {
        addLog('Triggering Step 4: Computing multi-factor resource match and dispatching...');
        const res = await api.demoStepDispatch();
        addLog(`Dispatched ${res.dispatches.length} emergency units (Fire Team #02, Ambulance #04, Medical Team #07).`);
      } else if (step === 5) {
        addLog('Triggering Step 5: Field responders marking arrived on scene...');
        await api.demoStepArrived();
        addLog('All units arrived on scene at Chemistry Building Block C.');
      } else if (step === 6) {
        addLog('Triggering Step 6: Hazard neutralized and incident resolved...');
        await api.demoStepResolve();
        addLog('Incident RQ-2026-0042 resolved! Units returned to Available.');
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (err: any) {
      addLog(`Error during step ${step}: ${err.message}`);
    }
  };

  const runFullScenario = async () => {
    setIsAutoRunning(true);
    setShowModal(true);
    setDemoLogs([]);
    addLog('🚀 Commencing 3-Minute Live Emergency Demonstration...');

    for (let s = 1; s <= 6; s++) {
      await executeStep(s);
      if (s < 6) {
        // Pause 3.5 seconds between steps for realistic observation
        await new Promise((resolve) => setTimeout(resolve, 3500));
      }
    }

    setIsAutoRunning(false);
    addLog('✨ Full Emergency Lifecycle Demonstration Complete!');
  };

  const resetDemo = async () => {
    setCurrentStep(0);
    setIsSimulating(false);
    setIsAutoRunning(false);
    setDemoLogs([]);
    try {
      await api.demoStepResolve();
      addLog('Simulation reset.');
    } catch (e) {
      // ignore
    }
  };

  return (
    <DemoContext.Provider
      value={{
        isSimulating,
        currentStep,
        isAutoRunning,
        demoLogs,
        runFullScenario,
        executeStep,
        resetDemo,
        showModal,
        setShowModal,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) throw new Error('useDemo must be used within DemoProvider');
  return context;
};
