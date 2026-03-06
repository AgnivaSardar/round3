import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'stable';
  className?: string;
}

export function MetricCard({ title, value, subtitle, icon, trend, className = '' }: MetricCardProps) {
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card-hover p-4 ${className}`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-heading uppercase tracking-wider text-muted-foreground">{title}</span>
        {icon && <div className="text-primary">{icon}</div>}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-display font-bold text-foreground">{value}</span>
        {subtitle && <span className={`text-xs mb-1 ${trendColor}`}>{subtitle}</span>}
      </div>
    </motion.div>
  );
}
