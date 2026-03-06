import { motion } from 'framer-motion';

interface GaugeChartProps {
  value: number;
  max: number;
  label: string;
  unit: string;
  size?: number;
  thresholds?: { warning: number; critical: number };
}

export function GaugeChart({ value, max, label, unit, size = 120, thresholds }: GaugeChartProps) {
  const radius = (size - 16) / 2;
  const circumference = Math.PI * radius;
  const percentage = Math.min(value / max, 1);
  const offset = circumference * (1 - percentage);

  let colorClass = 'gauge-fill-primary';
  if (thresholds) {
    if (value >= thresholds.critical) colorClass = 'gauge-fill-danger';
    else if (value >= thresholds.warning) colorClass = 'gauge-fill-warning';
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`}>
        <path
          d={`M 8 ${size / 2 + 2} A ${radius} ${radius} 0 0 1 ${size - 8} ${size / 2 + 2}`}
          className="gauge-track"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <motion.path
          d={`M 8 ${size / 2 + 2} A ${radius} ${radius} 0 0 1 ${size - 8} ${size / 2 + 2}`}
          className={colorClass}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="text-center -mt-4">
        <span className="text-xl font-display font-bold text-foreground">{value.toFixed(1)}</span>
        <span className="text-xs text-muted-foreground ml-1">{unit}</span>
      </div>
      <span className="text-xs text-muted-foreground font-heading uppercase tracking-wider">{label}</span>
    </div>
  );
}
