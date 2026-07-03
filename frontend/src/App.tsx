import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import PatientChatPage from './pages/PatientChatPage';
import TherapistDashboard from './pages/TherapistDashboard';
import SessionHistory from './pages/SessionHistory';

export default function App() {
  return (
    <div className="flex min-h-screen">
      {/* Background mesh */}
      <div className="bg-mesh" />

      {/* Sidebar */}
      <Sidebar />

      {/* Main content (offset for sidebar) */}
      <div className="flex-1 ml-[260px] flex flex-col min-h-screen transition-all duration-300">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<PatientChatPage />} />
            <Route path="/dashboard" element={<TherapistDashboard />} />
            <Route path="/history" element={<SessionHistory />} />
          </Routes>
        </main>
        <footer className="px-6 py-3 text-center text-[11px] text-white/30 border-t border-white/5">
          Academic prototype • Not for diagnosis or emergency use • Enhanced by Yuvraj Bharti (see NOTICE.md)
        </footer>
      </div>
    </div>
  );
}
