import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Plus, Phone, Sparkles, AlertTriangle } from 'lucide-react';
import ChatBubble from '../components/ChatBubble';
import TypingIndicator from '../components/TypingIndicator';
import { startSession, sendMessage } from '../api/client';
import type { ChatMessage, ConversationStep } from '../types';
import { STEP_ORDER, STEP_LABELS } from '../types';

export default function PatientChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<ConversationStep>('greeting');
  const [isTyping, setIsTyping] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [questionIndex, setQuestionIndex] = useState<number | undefined>();
  const [totalQuestions, setTotalQuestions] = useState<number | undefined>();
  const [safetyAlert, setSafetyAlert] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const handleStartSession = useCallback(async () => {
    setMessages([]);
    setCompleted(false);
    setCurrentStep('greeting');
    setQuestionIndex(undefined);
    setSafetyAlert(false);
    setIsTyping(true);

    try {
      const res = await startSession();
      setSessionId(res.session_id);
      setCurrentStep(res.step as ConversationStep);

      // Simulate typing delay
      await new Promise(r => setTimeout(r, 800));
      setIsTyping(false);

      setMessages([{
        role: 'ai',
        text: res.response,
        timestamp: new Date().toISOString(),
      }]);
    } catch {
      setIsTyping(false);
      setMessages([{
        role: 'ai',
        text: '⚠️ Could not connect to TheraAssist AI server. Please ensure the backend is running on port 5000.',
        timestamp: new Date().toISOString(),
      }]);
    }
  }, []);

  // Defer the first request until after the initial render completes.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void handleStartSession();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [handleStartSession]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !sessionId || isTyping) return;

    // Add user message
    const userMsg: ChatMessage = { role: 'user', text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await sendMessage(sessionId, text);

      // Simulate typing delay (longer for AI)
      await new Promise(r => setTimeout(r, 600 + Math.random() * 600));
      setIsTyping(false);

      const aiMsg: ChatMessage = { role: 'ai', text: res.response, timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, aiMsg]);
      setCurrentStep(res.step as ConversationStep);
      setCompleted(res.completed);
      setSafetyAlert(Boolean(res.safety_alert));
      if (res.question_index !== undefined) setQuestionIndex(res.question_index);
      if (res.total_questions !== undefined) setTotalQuestions(res.total_questions);
    } catch {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        role: 'ai',
        text: '⚠️ Something went wrong. Please try again.',
        timestamp: new Date().toISOString(),
      }]);
    }

    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Progress calculation
  const stepIdx = STEP_ORDER.indexOf(currentStep);
  const progress = ((stepIdx + 1) / STEP_ORDER.length) * 100;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-primary-400" />
            <span className="text-sm font-medium text-white/70">Intake Call Simulation</span>
          </div>
          {/* Step indicator */}
          <div className="hidden sm:flex items-center gap-2 ml-4 pl-4 border-l border-white/10">
            <Sparkles className="w-3 h-3 text-primary-400" />
            <span className="text-xs text-white/40">Step:</span>
            <span className="text-xs font-medium text-primary-300">
              {STEP_LABELS[currentStep] || currentStep}
            </span>
            {questionIndex !== undefined && totalQuestions && currentStep === 'questions' && (
              <span className="text-xs text-white/30">
                ({questionIndex + 1}/{totalQuestions})
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleStartSession}
          id="new-session-btn"
          className="btn-primary flex items-center gap-2 text-xs py-2 px-4"
        >
          <Plus className="w-3.5 h-3.5" />
          New Session
        </button>
      </div>

      {safetyAlert && (
        <div className="mx-6 mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 flex gap-3 text-sm text-red-100">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-300" />
          <p><strong>Urgent support notice:</strong> This app cannot provide emergency care. Contact local emergency services, a crisis line, or a trusted person now if there is immediate danger.</p>
        </div>
      )}

      {/* Progress Bar */}
      <div className="h-1 bg-white/5">
        <motion.div
          className="h-full bg-gradient-to-r from-primary-500 to-primary-400"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
          style={{ boxShadow: '0 0 10px rgba(130, 68, 255, 0.5)' }}
        />
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <ChatBubble key={i} message={msg} index={i} />
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {isTyping && <TypingIndicator />}
        </AnimatePresence>

        {/* Completion Card */}
        <AnimatePresence>
          {completed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-6 text-center max-w-md mx-auto"
            >
              <div className="w-14 h-14 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-7 h-7 text-green-400" />
              </div>
              <h3 className="text-lg font-bold text-white/90 mb-1">Intake Complete!</h3>
              <p className="text-sm text-white/50 mb-4">
                Visit the <strong>Dashboard</strong> to view analytics, or download the PDF report.
              </p>
              <button onClick={handleStartSession} className="btn-primary text-sm">
                Start New Session
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-6 py-4 border-t border-white/5">
        <div className="glass-strong rounded-2xl flex items-center gap-3 px-4 py-2 max-w-3xl mx-auto">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={completed ? 'Session complete — start a new one' : 'Type your response...'}
            disabled={completed || isTyping}
            id="chat-input"
            className="flex-1 bg-transparent border-none outline-none text-sm text-white/90 placeholder:text-white/25 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || completed || isTyping}
            id="chat-send-btn"
            className="p-2 rounded-xl bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
