import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import type { ChatMessage } from '../types';
import SafeMessageText from './SafeMessageText';

interface Props {
  message: ChatMessage;
  index: number;
}

export default function ChatBubble({ message, index }: Props) {
  const isAI = message.role === 'ai';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className={`flex gap-3 ${isAI ? 'justify-start' : 'justify-end'}`}
    >
      {/* AI Avatar */}
      {isAI && (
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20 mt-1">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Bubble */}
      <div
        className={`relative max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isAI
            ? 'glass-strong rounded-tl-md text-white/90'
            : 'bg-gradient-to-r from-primary-600 to-primary-500 rounded-tr-md text-white shadow-lg shadow-primary-500/20'
        }`}
      >
        <SafeMessageText text={message.text} />
        <p className={`text-[10px] mt-2 ${isAI ? 'text-white/30' : 'text-white/50'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* User Avatar */}
      {!isAI && (
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center shadow-lg shadow-cyan-500/20 mt-1">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </motion.div>
  );
}
