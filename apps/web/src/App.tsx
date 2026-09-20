import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DemoProvider } from './context/DemoContext';
import { Navbar } from './components/Navbar';
import { DemoSimulationModal } from './components/DemoSimulationModal';
import { LandingPage } from './pages/LandingPage';
import { CommandCenterPage } from './pages/CommandCenterPage';
import { ReportEmergencyPage } from './pages/ReportEmergencyPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { ResourceMapPage } from './pages/ResourceMapPage';
import { ResponderAppPage } from './pages/ResponderAppPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AdminPage } from './pages/AdminPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DemoProvider>
          <div className="min-h-screen bg-background text-slate-100 flex flex-col font-sans">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/command" element={<CommandCenterPage />} />
                <Route path="/report" element={<ReportEmergencyPage />} />
                <Route path="/incidents" element={<IncidentsPage />} />
                <Route path="/resources" element={<ResourceMapPage />} />
                <Route path="/responder" element={<ResponderAppPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/admin" element={<AdminPage />} />
              </Routes>
            </main>
            <DemoSimulationModal />
          </div>
        </DemoProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};
