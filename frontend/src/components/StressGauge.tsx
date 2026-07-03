import { motion } from 'framer-motion';

interface Props {
  value: number;       // 0–100
  label: string;
  color?: string;
  size?: number;
}

export default function StressGauge({ value, label, color = '#8244ff', size = 120 }: Props) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / 100) * circumference;

  // Color based on value
  const getColor = () => {
    if (value >= 70) return '#ef4444'; // red
    if (value >= 40) return '#f59e0b'; // amber
    return '#22c55e'; // green
  };

  const fillColor = color === '#8244ff' ? getColor() : color;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={fillColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 8px ${fillColor}40)` }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-2xl font-bold text-white/90"
          >
            {value}
          </motion.span>
          <span className="text-[10px] text-white/30 font-medium">/ 100</span>
        </div>
      </div>
      <p className="text-xs text-white/50 font-medium">{label}</p>
    </div>
  );
}
