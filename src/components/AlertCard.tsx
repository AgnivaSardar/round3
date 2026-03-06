import { motion } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info, Check } from 'lucide-react';
import type { Alert } from '@/data/mockData';

interface AlertCardProps {
  alert: Alert;
  onAcknowledge?: (id: string) => void;
  compact?: boolean;
}

export function AlertCard({ alert, onAcknowledge, compact = false }: AlertCardProps) {
  const severityConfig = {
    critical: {
      icon: AlertCircle,
      containerClass: 'status-critical border pulse-critical',
      badge: 'bg-destructive text-destructive-foreground',
      label: 'CRITICAL',
    },
    warning: {
      icon: AlertTriangle,
      containerClass: 'status-warning border',
      badge: 'bg-warning text-warning-foreground',
      label: 'WARNING',
    },
    anomaly: {
      icon: Info,
      containerClass: 'status-anomaly border',
      badge: 'bg-anomaly text-anomaly-foreground',
      label: 'ANOMALY',
    },
  };

  const config = severityConfig[alert.severity];
  const Icon = config.icon;

  if (compact) {
    return (
      <div className={`flex items-center gap-3 px-3 py-2 rounded-md ${config.containerClass}`}>
        <Icon className="h-4 w-4 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium truncate block">{alert.type}</span>
          <span className="text-xs opacity-70">{alert.vehicleName}</span>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${config.badge}`}>{config.label}</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg p-4 ${config.containerClass}`}
    >
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-heading font-semibold text-sm">{alert.type}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${config.badge}`}>{config.label}</span>
          </div>
          <p className="text-xs opacity-80 mb-2">{alert.message}</p>
          <div className="flex items-center gap-4 text-xs opacity-60">
            <span>Vehicle: {alert.vehicleName} ({alert.vehicleId})</span>
            <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
          </div>
          {alert.suggestedAction && (
            <p className="text-xs mt-2 opacity-70 italic">💡 {alert.suggestedAction}</p>
          )}
        </div>
        {onAcknowledge && !alert.acknowledged && (
          <button
            onClick={() => onAcknowledge(alert.id)}
            className="shrink-0 flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            <Check className="h-3 w-3" />
            ACK
          </button>
        )}
        {alert.acknowledged && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Check className="h-3 w-3" /> Acked
          </span>
        )}
      </div>
    </motion.div>
  );
}
