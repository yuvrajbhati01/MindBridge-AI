import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Heart, Moon, Brain, Shield, Zap, Calendar,
  Users, FileText, Download, RefreshCw, AlertTriangle
} from 'lucide-react';
import DashboardCard from '../components/DashboardCard';
import MoodChart from '../components/MoodChart';
import StressGauge from '../components/StressGauge';
import RiskBadge from '../components/RiskBadge';
import { listSessions, getSession, generateReport, getDownloadUrl } from '../api/client';
import type { SessionSummary, Analytics, Report } from '../types';

export default function TherapistDashboard() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const allSessions = await listSessions();
      setSessions(allSessions);

      // Find most recent completed session
      const completed = allSessions.find(s => s.completed);
      if (completed) {
        setSelectedSessionId(completed.session_id);
        const sessionData = await getSession(completed.session_id);
        if (sessionData.analytics) setAnalytics(sessionData.analytics);

        const reportData = await generateReport(completed.session_id);
        setReport(reportData);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = () => {
    if (!selectedSessionId) return;
    window.open(getDownloadUrl(selectedSessionId), '_blank');
  };

  const completedCount = sessions.filter(s => s.completed).length;
  const activeCount = sessions.filter(s => !s.completed).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        >
          <RefreshCw className="w-8 h-8 text-primary-400" />
        </motion.div>
      </div>
    );
  }

  // No completed sessions — show empty state
  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-10 text-center max-w-lg"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-primary-400" />
          </div>
          <h2 className="text-xl font-bold text-white/90 mb-2">No Completed Sessions</h2>
          <p className="text-sm text-white/50">
            Complete a patient intake chat first. Once a session is finished, analytics and reports will appear here.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-64px)]">
      {/* Top Title Row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white/90">Therapist Dashboard</h1>
          <p className="text-sm text-white/40 mt-1">
            Patient analytics for session <span className="text-primary-400 font-mono text-xs">{selectedSessionId?.slice(0, 8)}…</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={loadData} className="glass-card px-4 py-2 text-sm text-white/60 hover:text-white/80 flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button onClick={downloadPdf} id="download-pdf-btn" className="btn-primary flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </div>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard title="Total Sessions" value={sessions.length} icon={Users} iconColor="#8244ff" delay={0} />
        <DashboardCard title="Completed" value={completedCount} icon={FileText} iconColor="#22c55e" delay={0.1} />
        <DashboardCard title="In Progress" value={activeCount} icon={Calendar} iconColor="#f59e0b" delay={0.2} />
        <DashboardCard title="Session Readiness" value={`${analytics.readiness_score}%`} icon={Zap} iconColor="#22d3ee" delay={0.3} />
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Stress Gauge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6 flex flex-col items-center gap-4"
        >
          <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider w-full">Stress Score</h3>
          <StressGauge value={analytics.stress_score} label="Stress Level" />
        </motion.div>

        {/* Mood Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6 lg:col-span-2"
        >
          <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">Mood Breakdown</h3>
          <MoodChart data={analytics.mood_breakdown} />
        </motion.div>
      </div>

      {/* Second Row: Health Scores + Risk */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard title="Mood Stability" value={`${analytics.mood_stability}%`} icon={Heart} iconColor="#ec4899" delay={0.6} subtitle="Higher is more stable" />
        <DashboardCard title="Sleep Health" value={`${analytics.sleep_health}%`} icon={Moon} iconColor="#818cf8" delay={0.7} subtitle="Higher is better" />
        <DashboardCard title="Risk Score" value={analytics.risk_score} icon={Shield} iconColor={analytics.risk_level === 'High' ? '#ef4444' : analytics.risk_level === 'Moderate' ? '#f59e0b' : '#22c55e'} delay={0.8}>
          <div className="mt-2">
            <RiskBadge level={analytics.risk_level} />
          </div>
        </DashboardCard>
        <DashboardCard title="Flags" value={analytics.appetite_energy_flag ? 'Active' : 'None'} icon={AlertTriangle} iconColor="#fb923c" delay={0.9} subtitle="Appetite/Energy changes">
          <div className="flex flex-wrap gap-1 mt-1">
            {analytics.appetite_energy_flag && (
              <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">Appetite</span>
            )}
            {analytics.chronicity && (
              <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Chronic</span>
            )}
          </div>
        </DashboardCard>
      </div>

      {/* Report Preview */}
      {report && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider">Report Preview</h3>
            <span className="text-[10px] text-white/20 font-mono">{report.generated_at}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Patient Info */}
            <div>
              <h4 className="text-xs font-semibold text-primary-400 uppercase tracking-wider mb-2">Patient Info</h4>
              <p className="text-sm text-white/70"><strong>Name:</strong> {report.patient_info.name}</p>
              <p className="text-sm text-white/70"><strong>Phone:</strong> {report.patient_info.phone}</p>
              <p className="text-sm text-white/70 mt-1"><strong>Appointment:</strong> {report.appointment.date} at {report.appointment.time} ({report.appointment.timezone})</p>
            </div>

            {/* Primary Concern */}
            <div>
              <h4 className="text-xs font-semibold text-primary-400 uppercase tracking-wider mb-2">Primary Concern</h4>
              <p className="text-sm text-white/60 italic">"{report.primary_concern}"</p>
            </div>

            {/* Risk Flags */}
            <div>
              <h4 className="text-xs font-semibold text-primary-400 uppercase tracking-wider mb-2">Risk Flags</h4>
              <ul className="space-y-1">
                {report.risk_flags.map((flag, i) => (
                  <li key={i} className="text-sm text-white/60">{flag}</li>
                ))}
              </ul>
            </div>

            {/* Therapy Suggestions */}
            <div>
              <h4 className="text-xs font-semibold text-primary-400 uppercase tracking-wider mb-2">Suggested Direction</h4>
              <ul className="space-y-1">
                {report.suggested_therapy_direction.map((s, i) => (
                  <li key={i} className="text-sm text-white/60">• {s}</li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
