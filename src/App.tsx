import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { IntakePage } from './pages/IntakePage';
import { ExtractionPage } from './pages/ExtractionPage';
import { TriagePage } from './pages/TriagePage';
import { LowTouchPage } from './pages/LowTouchPage';
import { ModerateTouchPage } from './pages/ModerateTouchPage';
import { HighTouchPage } from './pages/HighTouchPage';
import { ConfirmationPage } from './pages/ConfirmationPage';

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<IntakePage />} />
        <Route path="/extraction" element={<ExtractionPage />} />
        <Route path="/triage" element={<TriagePage />} />
        <Route path="/processing" element={<Navigate to="/processing/low" replace />} />
        <Route path="/processing/low" element={<LowTouchPage />} />
        <Route path="/processing/moderate" element={<ModerateTouchPage />} />
        <Route path="/processing/high" element={<HighTouchPage />} />
        <Route path="/confirmation" element={<ConfirmationPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
