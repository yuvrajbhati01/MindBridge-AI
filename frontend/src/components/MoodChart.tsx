import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { MoodBreakdown } from '../types';

const MOOD_COLORS: Record<string, string> = {
  Sad:          '#818cf8',
  Anxious:      '#a78bfa',
  Angry:        '#f87171',
  Numb:         '#64748b',
  Overwhelmed:  '#fb923c',
};

interface Props {
  data: MoodBreakdown[];
}

export default function MoodChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-white/30 text-sm">
        No mood data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="mood"
          tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: 'rgba(13, 13, 43, 0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            color: '#f0eeff',
            fontSize: '12px',
          }}
          cursor={{ fill: 'rgba(130, 68, 255, 0.1)' }}
        />
        <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={40}>
          {data.map((entry, idx) => (
            <Cell key={idx} fill={MOOD_COLORS[entry.mood] || '#8244ff'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
