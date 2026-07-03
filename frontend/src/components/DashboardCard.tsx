import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: 'up' | 'down' | 'neutral';
  delay?: number;
  children?: ReactNode;
}

export default function DashboardCard({ title, value, subtitle, icon: Icon, iconColor = '#8244ff', trend, delay = 0, children }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="glass-card p-5 flex flex-col gap-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${iconColor}20` }}
          >
            <Icon className="w-5 h-5" style={{ color: iconColor }} />
          </div>
          <div>
            <p className="text-xs text-white/40 font-medium uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold text-white/90 mt-0.5">{value}</p>
          </div>
        </div>
        {trend && (
          <div className={`text-xs font-semibold px-2 py-1 rounded-lg ${
            trend === 'up' ? 'bg-green-500/20 text-green-400' :
            trend === 'down' ? 'bg-red-500/20 text-red-400' :
            'bg-white/10 text-white/50'
          }`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '–'}
          </div>
        )}
      </div>
      {subtitle && <p className="text-xs text-white/30">{subtitle}</p>}
      {children && <div className="mt-1">{children}</div>}
    </motion.div>
  );
}
