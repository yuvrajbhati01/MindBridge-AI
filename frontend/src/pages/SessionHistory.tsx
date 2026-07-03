import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, CheckCircle2, Clock, X, Phone, Calendar,
  MessageSquare, FileText, ChevronRight, RefreshCw
} from 'lucide-react';
import { listSessions, getSession, getDownloadUrl } from '../api/client';
import type { SessionSummary, Session, ChatMessage } from '../types';
import SafeMessageText from '../components/SafeMessageText';

export default function SessionHistory() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [filtered, setFiltered] = useState<SessionSummary[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  useEffect(() => { loadSessions(); }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(sessions);
    } else {
      const q = search.toLowerCase();
      setFiltered(sessions.filter(s =>
        s.patient_name?.toLowerCase().includes(q) ||
        s.phone?.includes(q) ||
        s.session_id.includes(q)
      ));
    }
  }, [search, sessions]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const all = await listSessions();
      setSessions(all);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (sessionId: string) => {
    try {
      const data = await getSession(sessionId);
      setSelectedSession(data);
    } catch (err) {
      console.error('Failed to load session:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
          <RefreshCw className="w-8 h-8 text-primary-400" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 h-[calc(100vh-64px)] overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white/90">Session History</h1>
          <p className="text-sm text-white/40 mt-1">{sessions.length} sessions recorded</p>
        </div>
        {/* Search */}
        <div className="glass-strong rounded-xl flex items-center gap-2 px-3 py-2 w-full sm:w-72">
          <Search className="w-4 h-4 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            id="session-search"
            className="flex-1 bg-transparent border-none outline-none text-sm text-white/80 placeholder:text-white/25"
          />
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-10 text-center max-w-md mx-auto mt-12"
        >
          <MessageSquare className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/50 text-sm">
            {sessions.length === 0
              ? 'No sessions yet. Start a patient chat to see history here.'
              : 'No sessions match your search.'}
          </p>
        </motion.div>
      ) : (
        /* Session List */
        <div className="space-y-3">
          {filtered.map((s, i) => (
            <motion.div
              key={s.session_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => openDetail(s.session_id)}
              className="glass-card p-4 cursor-pointer flex items-center gap-4 group"
            >
              {/* Status */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                s.completed ? 'bg-green-500/15' : 'bg-amber-500/15'
              }`}>
                {s.completed
                  ? <CheckCircle2 className="w-5 h-5 text-green-400" />
                  : <Clock className="w-5 h-5 text-amber-400" />
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white/85 truncate">
                    {s.patient_name || 'Unknown Patient'}
                  </p>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    s.completed
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {s.completed ? 'Complete' : `Step: ${s.current_step}`}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-white/30">
                  {s.phone && (
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{s.phone}</span>
                  )}
                  {s.appointment_date && (
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{s.appointment_date}</span>
                  )}
                  <span>{new Date(s.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}
            onClick={() => setSelectedSession(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="glass-strong rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <div>
                  <h2 className="text-lg font-bold text-white/90">
                    {selectedSession.patient_info.name || 'Unknown Patient'}
                  </h2>
                  <p className="text-xs text-white/30 font-mono">{selectedSession.session_id}</p>
                </div>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/50" />
                </button>
              </div>

              {/* Modal Body: Conversation Log */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {selectedSession.conversation_log.length === 0 ? (
                  <p className="text-sm text-white/30 text-center">No messages recorded.</p>
                ) : (
                  selectedSession.conversation_log.map((msg: ChatMessage, i: number) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                        msg.role === 'ai'
                          ? 'bg-white/5 text-white/70 rounded-tl-md'
                          : 'bg-primary-600/30 text-white/80 rounded-tr-md'
                      }`}>
                        <SafeMessageText text={msg.text} />
                        <p className="text-[10px] text-white/20 mt-1">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3 border-t border-white/5 flex justify-between items-center">
                <div className="text-xs text-white/30">
                  {selectedSession.completed ? '✅ Completed' : `🔄 Step: ${selectedSession.current_step}`}
                </div>
                {selectedSession.completed && (
                  <button
                    onClick={() => window.open(getDownloadUrl(selectedSession.session_id), '_blank')}
                    className="btn-primary text-xs flex items-center gap-2"
                  >
                    <FileText className="w-3.5 h-3.5" /> View Report PDF
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
