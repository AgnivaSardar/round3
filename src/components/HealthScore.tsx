import { motion } from 'framer-motion';

interface HealthScoreProps {
  score: number;
  size?: 'sm' | 'lg';
}

export function HealthScore({ score, size = 'lg' }: HealthScoreProps) {
  const isLg = size === 'lg';
  const r = isLg ? 54 : 28;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);
  const dim = isLg ? 128 : 68;

  const color = score >= 80 ? 'text-success' : score >= 50 ? 'text-warning' : 'text-destructive';
  const strokeColor = score >= 80 ? 'stroke-success' : score >= 50 ? 'stroke-warning' : 'stroke-destructive';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} className="-rotate-90">
          <circle cx={dim / 2} cy={dim / 2} r={r} className="gauge-track" strokeWidth={isLg ? 8 : 5} />
          <motion.circle
            cx={dim / 2}
            cy={dim / 2}
            r={r}
            className={`${strokeColor} fill-none`}
            strokeWidth={isLg ? 8 : 5}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 6px currentColor)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-display font-bold ${color} ${isLg ? 'text-2xl' : 'text-sm'}`}>{score}</span>
          {isLg && <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Health</span>}
        </div>
      </div>
    </div>
  );
}
