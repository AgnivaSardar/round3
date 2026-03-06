import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Activity, AlertTriangle, Car, Thermometer } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { HealthScore } from '@/components/HealthScore';
import { MetricCard } from '@/components/MetricCard';
import { AlertCard } from '@/components/AlertCard';
import { fetchVehicles, fetchAlerts, fetchTelemetry, fetchFaultLogs } from '@/services/api';
import type { Vehicle, Alert, TelemetryPoint, FaultLog } from '@/services/api';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>([]);
  const [faultLogs, setFaultLogs] = useState<FaultLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [vehiclesData, alertsData, telemetryData, faultLogsData] = await Promise.all([
          fetchVehicles(),
          fetchAlerts({ isResolved: false }),
          fetchTelemetry(undefined, 24),
          fetchFaultLogs(),
        ]);
        
        setVehicles(vehiclesData);
        setAlerts(alertsData);
        setTelemetry(telemetryData);
        setFaultLogs(faultLogsData);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  const avgHealth = vehicles.length > 0 
    ? Math.round(vehicles.reduce((a, v) => a + v.healthScore, 0) / vehicles.length) 
    : 0;
  const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length;
  const activeAlerts = alerts.filter(a => !a.acknowledged);
  const latestTemp = telemetry.length > 0 ? telemetry[telemetry.length - 1]?.engineTemp || 0 : 0;

  const chartStyle = {
    background: 'transparent',
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
        {/* Header */}
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl font-heading font-bold text-foreground">Vehixa Dashboard</h1>
          <p className="text-sm text-muted-foreground">Real-time vehicle telemetry & fault monitoring</p>
        </motion.div>

        {/* Top metrics */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5 flex items-center gap-4 neon-border">
            <HealthScore score={avgHealth} />
            <div>
              <div className="text-xs font-heading uppercase tracking-wider text-muted-foreground">Fleet Health</div>
              <div className="text-lg font-heading font-semibold text-foreground">
                {avgHealth >= 80 ? 'Good' : avgHealth >= 50 ? 'Fair' : 'Poor'}
              </div>
            </div>
          </div>
          <MetricCard title="Total Vehicles" value={vehicles.length} icon={<Car className="h-4 w-4" />} subtitle="All active" trend="stable" />
          <MetricCard title="Active Alerts" value={activeAlerts.length} icon={<AlertTriangle className="h-4 w-4" />} subtitle={`${criticalCount} critical`} trend="up" />
          <MetricCard title="Avg Engine Temp" value={`${latestTemp.toFixed(0)}°C`} icon={<Thermometer className="h-4 w-4" />} subtitle="Normal range" trend="stable" />
        </motion.div>

        {/* Charts */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass-card p-4">
            <h3 className="text-sm font-heading uppercase tracking-wider text-muted-foreground mb-3">Engine Temperature</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={telemetry} style={chartStyle}>
                <defs>
                  <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(24, 95%, 53%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(24, 95%, 53%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 18%)" />
                <XAxis dataKey="time" stroke="hsl(215, 15%, 55%)" fontSize={10} />
                <YAxis stroke="hsl(215, 15%, 55%)" fontSize={10} />
                <Tooltip contentStyle={{ background: 'hsl(220, 18%, 10%)', border: '1px solid hsl(220, 13%, 18%)', borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="engineTemp" stroke="hsl(24, 95%, 53%)" fill="url(#tempGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-4">
            <h3 className="text-sm font-heading uppercase tracking-wider text-muted-foreground mb-3">Battery Voltage</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={telemetry} style={chartStyle}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 18%)" />
                <XAxis dataKey="time" stroke="hsl(215, 15%, 55%)" fontSize={10} />
                <YAxis stroke="hsl(215, 15%, 55%)" fontSize={10} domain={[10, 14]} />
                <Tooltip contentStyle={{ background: 'hsl(220, 18%, 10%)', border: '1px solid hsl(220, 13%, 18%)', borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="batteryVoltage" stroke="hsl(199, 89%, 48%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-4">
            <h3 className="text-sm font-heading uppercase tracking-wider text-muted-foreground mb-3">Speed</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={telemetry} style={chartStyle}>
                <defs>
                  <linearGradient id="speedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 18%)" />
                <XAxis dataKey="time" stroke="hsl(215, 15%, 55%)" fontSize={10} />
                <YAxis stroke="hsl(215, 15%, 55%)" fontSize={10} />
                <Tooltip contentStyle={{ background: 'hsl(220, 18%, 10%)', border: '1px solid hsl(220, 13%, 18%)', borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="speed" stroke="hsl(199, 89%, 48%)" fill="url(#speedGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-4">
            <h3 className="text-sm font-heading uppercase tracking-wider text-muted-foreground mb-3">Fuel Efficiency</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={telemetry} style={chartStyle}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 18%)" />
                <XAxis dataKey="time" stroke="hsl(215, 15%, 55%)" fontSize={10} />
                <YAxis stroke="hsl(215, 15%, 55%)" fontSize={10} />
                <Tooltip contentStyle={{ background: 'hsl(220, 18%, 10%)', border: '1px solid hsl(220, 13%, 18%)', borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="fuelEfficiency" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Alerts & Fault Logs */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass-card p-4">
            <h3 className="text-sm font-heading uppercase tracking-wider text-muted-foreground mb-3">Active Alerts</h3>
            <div className="space-y-2">
              {activeAlerts.length > 0 ? (
                activeAlerts.slice(0, 4).map(a => (
                  <AlertCard key={a.id} alert={a} compact />
                ))
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">No active alerts</p>
              )}
            </div>
          </div>

          <div className="glass-card p-4">
            <h3 className="text-sm font-heading uppercase tracking-wider text-muted-foreground mb-3">Recent Fault Logs</h3>
            <div className="space-y-2">
              {faultLogs.length > 0 ? (
                faultLogs.slice(0, 5).map(f => (
                  <div key={f.id} className="flex items-center gap-3 px-3 py-2 rounded-md bg-secondary/50">
                    <div className={`h-2 w-2 rounded-full ${
                      f.severity === 'critical' ? 'bg-destructive' : f.severity === 'warning' ? 'bg-warning' : 'bg-anomaly'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground truncate block">{f.fault}</span>
                      <span className="text-xs text-muted-foreground">{f.vehicleName}</span>
                    </div>
                    <span className={`text-xs ${f.resolved ? 'text-success' : 'text-muted-foreground'}`}>
                      {f.resolved ? '✓ Resolved' : 'Open'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">No fault logs</p>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
