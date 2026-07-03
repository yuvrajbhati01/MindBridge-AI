import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

export default function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex gap-3 justify-start"
    >
      <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20 mt-1">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="glass-strong rounded-2xl rounded-tl-md px-5 py-4 flex items-center gap-1.5">
        <span className="typing-dot w-2 h-2 rounded-full bg-primary-400" />
        <span className="typing-dot w-2 h-2 rounded-full bg-primary-400" />
        <span className="typing-dot w-2 h-2 rounded-full bg-primary-400" />
      </div>
    </motion.div>
  );
}
