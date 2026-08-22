import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/Layout/AppShell';

// Pages
import { Home } from './pages/Home';
import { InteractiveMap } from './pages/InteractiveMap';
import { AIRiskPredictions } from './pages/AIRiskPredictions';
import { RainfallIntelligence } from './pages/RainfallIntelligence';
import { UrbanIntelligence } from './pages/UrbanIntelligence';
import { SystemProtocol } from './pages/SystemProtocol';

export const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          {/* Main Canonical Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/intelligence-map" element={<InteractiveMap />} />
          <Route path="/predictions" element={<AIRiskPredictions />} />
          <Route path="/rainfall" element={<RainfallIntelligence />} />
          <Route path="/urban-intelligence" element={<UrbanIntelligence />} />
          <Route path="/protocol" element={<SystemProtocol />} />
          <Route path="/system-protocol" element={<SystemProtocol />} />

          {/* Clean Redirects for Removed & Legacy Routes */}
          <Route path="/command" element={<Navigate to="/" replace />} />
          <Route path="/command-center" element={<Navigate to="/" replace />} />
          <Route path="/cyber-command" element={<Navigate to="/" replace />} />
          <Route path="/historical" element={<Navigate to="/" replace />} />

          {/* Catch-all redirect to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
