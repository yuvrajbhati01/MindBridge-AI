import { motion } from 'framer-motion';
import { ShieldAlert, ShieldCheck, Shield } from 'lucide-react';

interface Props {
  level: 'Low' | 'Moderate' | 'High';
}

const CONFIG = {
  Low: {
    icon: ShieldCheck,
    bg: 'bg-green-500/15',
    text: 'text-green-400',
    border: 'border-green-500/30',
    glow: 'shadow-green-500/10',
    label: 'Low Risk',
  },
  Moderate: {
    icon: Shield,
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    glow: 'shadow-amber-500/10',
    label: 'Moderate Risk',
  },
  High: {
    icon: ShieldAlert,
    bg: 'bg-red-500/15',
    text: 'text-red-400',
    border: 'border-red-500/30',
    glow: 'shadow-red-500/10',
    label: 'High Risk',
  },
};

export default function RiskBadge({ level }: Props) {
  const c = CONFIG[level];
  const Icon = c.icon;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${c.bg} ${c.border} ${c.text} shadow-lg ${c.glow}`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-semibold">{c.label}</span>
    </motion.div>
  );
}
