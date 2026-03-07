import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, AlertTriangle, Car, Gauge, Thermometer, Zap } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GaugeChart } from '@/components/GaugeChart';
import { HealthScore } from '@/components/HealthScore';
import { MetricCard } from '@/components/MetricCard';
import { AlertCard } from '@/components/AlertCard';
import {
  fetchVehicles,
  fetchAlerts,
  fetchTelemetry,
  fetchFaultLogs,
  fetchHealthEvaluations,
} from '@/services/api';
import type {
  Vehicle,
  Alert,
  TelemetryPoint,
  FaultLog,
  HealthEvaluation,
} from '@/services/api';

const dashboardChartConfigs: Array<{
  key: keyof TelemetryPoint;
  label: string;
  color: string;
}> = [
  { key: 'engineTemp', label: 'Engine Temperature', color: 'hsl(0, 72%, 51%)' },
  { key: 'engineRpm', label: 'Engine RPM', color: 'hsl(24, 95%, 53%)' },
  { key: 'coolantTemp', label: 'Coolant Temperature', color: 'hsl(199, 89%, 48%)' },
  { key: 'lubOilPressure', label: 'Lub Oil Pressure', color: 'hsl(48, 96%, 53%)' },
  { key: 'fuelPressure', label: 'Fuel Pressure', color: 'hsl(38, 92%, 50%)' },
  { key: 'batteryVoltage', label: 'Battery Voltage', color: 'hsl(142, 71%, 45%)' },
  { key: 'speed', label: 'Speed', color: 'hsl(262, 83%, 58%)' },
  { key: 'vibrationLevel', label: 'Vibration Level', color: 'hsl(330, 81%, 60%)' },
];

const toDisplay = (value: number | null | undefined, digits = 1): string => {
  if (value === null || value === undefined) return '--';
  if (!Number.isFinite(value)) return '--';
  return value.toFixed(digits);
};

const toTimestamp = (value: string | Date | null | undefined): number => {
  if (!value) return 0;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 0;

  return date.getTime();
};

const getVehicleIdentifier = (vehicle: Vehicle): string => vehicle.vehicleId || vehicle.id;

const getVehicleUpdatedAtMs = (vehicle: Vehicle): number => {
  const telemetryTime = toTimestamp(vehicle.latestTelemetry?.recordedAt ?? null);
  if (telemetryTime > 0) return telemetryTime;

  return toTimestamp(vehicle.lastUpdate);
};

const toDateTimeLabel = (value: string | Date | null | undefined): string => {
  const timestamp = toTimestamp(value);
  if (!timestamp) return '--';

  return new Date(timestamp).toLocaleString();
};

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
  const [evaluations, setEvaluations] = useState<HealthEvaluation[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [loading, setLoading] = useState(true);
  const [telemetryLoading, setTelemetryLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      try {
        const [vehiclesData, alertsData, faultLogsData, evaluationsData] = await Promise.all([
          fetchVehicles(),
          fetchAlerts({ isResolved: false }),
          fetchFaultLogs(),
          fetchHealthEvaluations(undefined, 24),
        ]);

        if (cancelled) return;

        setVehicles(vehiclesData);
        setAlerts(alertsData);
        setFaultLogs(faultLogsData);
        setEvaluations(evaluationsData);

        const latestChangedVehicle = [...vehiclesData]
          .sort((a, b) => getVehicleUpdatedAtMs(b) - getVehicleUpdatedAtMs(a))[0];

        if (latestChangedVehicle) {
          setSelectedVehicleId(getVehicleIdentifier(latestChangedVehicle));
        } else if (vehiclesData.length > 0) {
          setSelectedVehicleId(getVehicleIdentifier(vehiclesData[0]));
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedVehicleId) {
      setTelemetry([]);
      return;
    }

    let cancelled = false;

    async function loadVehicleTelemetry() {
      setTelemetryLoading(true);
      try {
        const telemetryData = await fetchTelemetry(selectedVehicleId, 60);
        if (!cancelled) {
          setTelemetry(telemetryData);
        }
      } catch (error) {
        console.error('Error loading selected vehicle telemetry:', error);
        if (!cancelled) {
          setTelemetry([]);
        }
      } finally {
        if (!cancelled) {
          setTelemetryLoading(false);
        }
      }
    }

    loadVehicleTelemetry();

    return () => {
      cancelled = true;
    };
  }, [selectedVehicleId]);

  useEffect(() => {
    if (vehicles.length === 0) return;

    const selectedExists = vehicles.some((vehicle) => getVehicleIdentifier(vehicle) === selectedVehicleId);
    if (selectedExists) return;

    const latestChangedVehicle = [...vehicles]
      .sort((a, b) => getVehicleUpdatedAtMs(b) - getVehicleUpdatedAtMs(a))[0];

    if (latestChangedVehicle) {
      setSelectedVehicleId(getVehicleIdentifier(latestChangedVehicle));
    }
  }, [vehicles, selectedVehicleId]);

  const vehiclesByLatestUpdate = useMemo(
    () => [...vehicles].sort((a, b) => getVehicleUpdatedAtMs(b) - getVehicleUpdatedAtMs(a)),
    [vehicles]
  );

  const latestChangedVehicle = vehiclesByLatestUpdate[0] ?? null;
  const selectedVehicle = vehicles.find((vehicle) => getVehicleIdentifier(vehicle) === selectedVehicleId) || null;

  const selectedVehicleAliases = useMemo(() => {
    if (!selectedVehicle) return null;

    return new Set(
      [selectedVehicle.id, selectedVehicle.vehicleId].filter((value): value is string => Boolean(value))
    );
  }, [selectedVehicle]);

  const avgHealth = vehicles.length > 0 
    ? Math.round(vehicles.reduce((a, v) => a + v.healthScore, 0) / vehicles.length) 
    : 0;

  const activeAlerts = alerts.filter(a => !a.acknowledged);
  const selectedVehicleAlerts = selectedVehicleAliases
    ? activeAlerts.filter((alert) => selectedVehicleAliases.has(alert.vehicleId))
    : activeAlerts;
  const criticalCount = selectedVehicleAlerts.filter((alert) => alert.severity === 'critical').length;

  const selectedVehicleFaultLogs = selectedVehicleAliases
    ? faultLogs.filter((fault) => selectedVehicleAliases.has(fault.vehicleId))
    : faultLogs;

  const selectedVehicleEvaluations = selectedVehicleAliases
    ? evaluations.filter((evaluation) => selectedVehicleAliases.has(evaluation.vehicleId))
    : evaluations;

  const latestPoint = telemetry.length > 0
    ? telemetry[telemetry.length - 1]
    : selectedVehicle?.latestTelemetry || null;

  const latestEvaluation = selectedVehicleEvaluations.length > 0 ? selectedVehicleEvaluations[0] : null;

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
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
        {/* Header */}
        <motion.div variants={itemVariants} className="space-y-2">
          <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">Vehixa Dashboard</h1>
          <p className="text-base text-muted-foreground">Real-time telemetry and fault monitoring by vehicle</p>
          {selectedVehicle && (
            <p className="text-sm text-primary font-medium">
              Showing metrics for {selectedVehicle.name} ({selectedVehicle.plate})
            </p>
          )}
        </motion.div>

        {/* Top metrics */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="glass-card p-6 flex flex-col items-center justify-center gap-3 neon-border">
            <HealthScore score={avgHealth} />
            <div className="text-xl font-heading font-bold text-foreground">
              {avgHealth >= 80 ? 'Good' : avgHealth >= 50 ? 'Fair' : 'Poor'}
            </div>
          </div>
          <MetricCard title="Total Vehicles" value={vehicles.length} icon={<Car className="h-4 w-4" />} subtitle="All active" trend="stable" />
          <MetricCard
            title="Active Alerts"
            value={selectedVehicleAlerts.length}
            icon={<AlertTriangle className="h-4 w-4" />}
            subtitle={selectedVehicle ? `${criticalCount} critical` : `${activeAlerts.length} total`}
            trend="up"
          />
          <MetricCard
            title="Engine Temp"
            value={`${toDisplay(latestPoint?.engineTemp ?? null, 0)}°C`}
            icon={<Thermometer className="h-4 w-4" />}
            subtitle="Latest reading"
            trend="stable"
          />
          <MetricCard
            title="Engine RPM"
            value={toDisplay(latestPoint?.engineRpm ?? null, 0)}
            icon={<Gauge className="h-4 w-4" />}
            subtitle="Latest reading"
            trend="stable"
          />
          <MetricCard
            title="Battery Voltage"
            value={`${toDisplay(latestPoint?.batteryVoltage ?? null, 2)}V`}
            icon={<Zap className="h-4 w-4" />}
            subtitle="Latest reading"
            trend="stable"
          />
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <h3 className="text-base font-heading font-semibold text-foreground">
                Live Telemetry Gauges
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedVehicle
                  ? `Monitoring ${selectedVehicle.name} (${selectedVehicle.plate})`
                  : 'Select a vehicle to view live metrics'}
              </p>
              {latestChangedVehicle && (
                <p className="text-xs text-muted-foreground">
                  Last update: {latestChangedVehicle.name} at{' '}
                  {toDateTimeLabel(latestChangedVehicle.latestTelemetry?.recordedAt || latestChangedVehicle.lastUpdate)}
                </p>
              )}
            </div>

            {vehicles.length > 0 && (
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">Select Vehicle:</label>
                <select
                  value={selectedVehicleId}
                  onChange={(event) => setSelectedVehicleId(event.target.value)}
                  className="bg-secondary/60 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground min-w-[280px] hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  {vehiclesByLatestUpdate.map((vehicle) => (
                    <option key={vehicle.id} value={getVehicleIdentifier(vehicle)}>
                      {vehicle.name} ({vehicle.plate}) - {vehicle.healthScore}%
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {telemetryLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="space-y-3 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground">Loading telemetry data...</p>
              </div>
            </div>
          ) : latestPoint ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6 justify-items-center pt-2">
              <GaugeChart
                value={latestPoint.speed || 0}
                max={180}
                label="Speed"
                unit="km/h"
                size={150}
                thresholds={{ warning: 120, critical: 150 }}
              />
              <GaugeChart
                value={latestPoint.engineRpm || 0}
                max={7000}
                label="Engine RPM"
                unit="rpm"
                size={150}
                thresholds={{ warning: 4500, critical: 6000 }}
              />
              <GaugeChart
                value={latestPoint.engineTemp || 0}
                max={130}
                label="Engine Temp"
                unit="°C"
                size={150}
                thresholds={{ warning: 95, critical: 110 }}
              />
              <GaugeChart
                value={latestPoint.coolantTemp || 0}
                max={130}
                label="Coolant Temp"
                unit="°C"
                size={150}
                thresholds={{ warning: 100, critical: 112 }}
              />
              <GaugeChart
                value={latestPoint.batteryVoltage || 0}
                max={14.5}
                label="Battery"
                unit="V"
                size={150}
                thresholds={{ warning: 11.5, critical: 10.5 }}
              />
              <GaugeChart
                value={latestPoint.lubOilPressure || 0}
                max={10}
                label="Oil Pressure"
                unit="bar"
                size={150}
                thresholds={{ warning: 2, critical: 1 }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">No telemetry data available for this vehicle.</p>
            </div>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Gauge className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-heading font-semibold text-foreground">
                Latest Health Evaluation
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedVehicle ? `${selectedVehicle.name}` : 'All vehicles'}
              </p>
            </div>
          </div>

          {latestEvaluation ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
                <div className="rounded-lg bg-gradient-to-br from-secondary/60 to-secondary/40 px-4 py-3 border border-border/50">
                  <span className="text-xs text-muted-foreground block mb-1">Vehicle</span>
                  <p className="text-sm font-medium text-foreground truncate">{latestEvaluation.vehicleName}</p>
                </div>
                <div className="rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 px-4 py-3 border border-primary/30">
                  <span className="text-xs text-muted-foreground block mb-1">Health Score</span>
                  <p className="text-lg font-bold text-foreground">{Math.round(latestEvaluation.overallHealth)}%</p>
                </div>
                <div className="rounded-lg bg-gradient-to-br from-secondary/60 to-secondary/40 px-4 py-3 border border-border/50">
                  <span className="text-xs text-muted-foreground block mb-1">Status</span>
                  <p className="text-sm font-medium text-foreground">{latestEvaluation.status}</p>
                </div>
                <div className="rounded-lg bg-gradient-to-br from-secondary/60 to-secondary/40 px-4 py-3 border border-border/50">
                  <span className="text-xs text-muted-foreground block mb-1">Risk Level</span>
                  <p className="text-sm font-medium text-foreground">{latestEvaluation.riskLevel}</p>
                </div>
                <div className="rounded-lg bg-gradient-to-br from-secondary/60 to-secondary/40 px-4 py-3 border border-border/50">
                  <span className="text-xs text-muted-foreground block mb-1">Failure Probability</span>
                  <p className="text-sm font-medium text-foreground">{toDisplay((latestEvaluation.failureProbability || 0) * 100, 1)}%</p>
                </div>
                <div className="rounded-lg bg-gradient-to-br from-secondary/60 to-secondary/40 px-4 py-3 border border-border/50">
                  <span className="text-xs text-muted-foreground block mb-1">Confidence</span>
                  <p className="text-sm font-medium text-foreground">{toDisplay((latestEvaluation.confidenceScore || 0) * 100, 1)}%</p>
                </div>
                <div className="rounded-lg bg-gradient-to-br from-secondary/60 to-secondary/40 px-4 py-3 border border-border/50">
                  <span className="text-xs text-muted-foreground block mb-1">Predicted Failure</span>
                  <p className="text-sm font-medium text-foreground">{latestEvaluation.predictedFailureDays} days</p>
                </div>
                <div className="rounded-lg bg-gradient-to-br from-secondary/60 to-secondary/40 px-4 py-3 border border-border/50">
                  <span className="text-xs text-muted-foreground block mb-1">Evaluated At</span>
                  <p className="text-sm font-medium text-foreground">{new Date(latestEvaluation.evaluatedAt).toLocaleTimeString()}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 border-2 border-dashed border-border/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                No evaluations found. Visit the Evaluation tab to run health analysis.
              </p>
            </div>
          )}
        </motion.div>

        {/* Charts */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div>
            <h2 className="text-lg font-heading font-semibold text-foreground mb-1">Telemetry Trends</h2>
            <p className="text-sm text-muted-foreground">Historical data for the selected vehicle over time</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {dashboardChartConfigs.map((chart) => (
              <div key={chart.key} className="glass-card p-5 hover:shadow-lg transition-shadow">
                <h3 className="text-sm font-heading font-medium text-foreground mb-4">{chart.label}</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={telemetry}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 18%)" opacity={0.3} />
                    <XAxis dataKey="time" stroke="hsl(215, 15%, 55%)" fontSize={11} />
                    <YAxis stroke="hsl(215, 15%, 55%)" fontSize={11} />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'hsl(220, 18%, 10%)', 
                        border: '1px solid hsl(220, 13%, 18%)', 
                        borderRadius: 8, 
                        fontSize: 12,
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                      }} 
                    />
                    <Line type="monotone" dataKey={chart.key} stroke={chart.color} strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Latest telemetry snapshot */}
        <motion.div variants={itemVariants} className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-heading font-semibold text-foreground">
                Latest Telemetry Snapshot
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedVehicle ? `Real-time data from ${selectedVehicle.name}` : 'Latest readings'}
              </p>
            </div>
          </div>
          {latestPoint ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              <div className="rounded-lg bg-gradient-to-br from-secondary/60 to-secondary/40 px-4 py-3 border border-border/50">
                <span className="text-xs text-muted-foreground block mb-1">Engine Temp</span>
                <p className="text-base font-semibold text-foreground">{toDisplay(latestPoint.engineTemp ?? null, 1)} °C</p>
              </div>
              <div className="rounded-lg bg-gradient-to-br from-secondary/60 to-secondary/40 px-4 py-3 border border-border/50">
                <span className="text-xs text-muted-foreground block mb-1">Engine RPM</span>
                <p className="text-base font-semibold text-foreground">{toDisplay(latestPoint.engineRpm ?? null, 0)}</p>
              </div>
              <div className="rounded-lg bg-gradient-to-br from-secondary/60 to-secondary/40 px-4 py-3 border border-border/50">
                <span className="text-xs text-muted-foreground block mb-1">Coolant Temp</span>
                <p className="text-base font-semibold text-foreground">{toDisplay(latestPoint.coolantTemp ?? null, 1)} °C</p>
              </div>
              <div className="rounded-lg bg-gradient-to-br from-secondary/60 to-secondary/40 px-4 py-3 border border-border/50">
                <span className="text-xs text-muted-foreground block mb-1">Oil Pressure</span>
                <p className="text-base font-semibold text-foreground">{toDisplay(latestPoint.lubOilPressure ?? null, 2)} bar</p>
              </div>
              <div className="rounded-lg bg-gradient-to-br from-secondary/60 to-secondary/40 px-4 py-3 border border-border/50">
                <span className="text-xs text-muted-foreground block mb-1">Fuel Pressure</span>
                <p className="text-base font-semibold text-foreground">{toDisplay(latestPoint.fuelPressure ?? null, 2)} psi</p>
              </div>
              <div className="rounded-lg bg-gradient-to-br from-secondary/60 to-secondary/40 px-4 py-3 border border-border/50">
                <span className="text-xs text-muted-foreground block mb-1">Battery Voltage</span>
                <p className="text-base font-semibold text-foreground">{toDisplay(latestPoint.batteryVoltage ?? null, 2)} V</p>
              </div>
              <div className="rounded-lg bg-gradient-to-br from-secondary/60 to-secondary/40 px-4 py-3 border border-border/50">
                <span className="text-xs text-muted-foreground block mb-1">Speed</span>
                <p className="text-base font-semibold text-foreground">{toDisplay(latestPoint.speed ?? null, 1)} km/h</p>
              </div>
              <div className="rounded-lg bg-gradient-to-br from-secondary/60 to-secondary/40 px-4 py-3 border border-border/50">
                <span className="text-xs text-muted-foreground block mb-1">Mileage</span>
                <p className="text-base font-semibold text-foreground">{toDisplay(latestPoint.mileage ?? null, 1)} km</p>
              </div>
              <div className="rounded-lg bg-gradient-to-br from-secondary/60 to-secondary/40 px-4 py-3 border border-border/50">
                <span className="text-xs text-muted-foreground block mb-1">Fuel Efficiency</span>
                <p className="text-base font-semibold text-foreground">{toDisplay(latestPoint.fuelEfficiency ?? null, 2)} km/L</p>
              </div>
              <div className="rounded-lg bg-gradient-to-br from-secondary/60 to-secondary/40 px-4 py-3 border border-border/50">
                <span className="text-xs text-muted-foreground block mb-1">Vibration Level</span>
                <p className="text-base font-semibold text-foreground">{toDisplay(latestPoint.vibrationLevel ?? null, 2)}</p>
              </div>
              <div className="rounded-lg bg-gradient-to-br from-secondary/60 to-secondary/40 px-4 py-3 border border-border/50">
                <span className="text-xs text-muted-foreground block mb-1">Coolant Level</span>
                <p className="text-base font-semibold text-foreground">{toDisplay(latestPoint.coolantLevel ?? null, 1)}%</p>
              </div>
              <div className="rounded-lg bg-gradient-to-br from-secondary/60 to-secondary/40 px-4 py-3 border border-border/50">
                <span className="text-xs text-muted-foreground block mb-1">Error Codes</span>
                <p className="text-base font-semibold text-foreground">{toDisplay(latestPoint.errorCodesCount ?? null, 0)}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 border-2 border-dashed border-border/50 rounded-lg">
              <p className="text-sm text-muted-foreground">No telemetry data available yet</p>
            </div>
          )}
        </motion.div>

        {/* Alerts & Fault Logs */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-base font-heading font-semibold text-foreground">
                  Active Alerts
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedVehicle ? selectedVehicle.name : 'All vehicles'}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {selectedVehicleAlerts.length > 0 ? (
                selectedVehicleAlerts.slice(0, 4).map(a => (
                  <AlertCard key={a.id} alert={a} compact />
                ))
              ) : (
                <div className="flex items-center justify-center py-8 border-2 border-dashed border-border/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">No active alerts for this vehicle</p>
                </div>
              )}
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <h3 className="text-base font-heading font-semibold text-foreground">
                  Recent Fault Logs
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedVehicle ? selectedVehicle.name : 'All vehicles'}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {selectedVehicleFaultLogs.length > 0 ? (
                selectedVehicleFaultLogs.slice(0, 5).map(f => (
                  <div key={f.id} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors border border-border/30">
                    <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                      f.severity === 'critical' ? 'bg-destructive' : f.severity === 'warning' ? 'bg-warning' : 'bg-anomaly'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground truncate block">{f.fault}</span>
                      <span className="text-xs text-muted-foreground">{f.vehicleName}</span>
                    </div>
                    <span className={`text-xs font-medium flex-shrink-0 ${f.resolved ? 'text-success' : 'text-muted-foreground'}`}>
                      {f.resolved ? '✓ Resolved' : 'Open'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center py-8 border-2 border-dashed border-border/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">No fault logs for this vehicle</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-heading font-semibold text-foreground">
                Recent Health Evaluations
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedVehicle ? `Historical evaluations for ${selectedVehicle.name}` : 'All vehicles'}
              </p>
            </div>
          </div>

          {selectedVehicleEvaluations.length > 0 ? (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[920px] text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b-2 border-border">
                    <th className="py-3 pr-4 font-semibold">Vehicle</th>
                    <th className="py-3 pr-4 font-semibold">Health</th>
                    <th className="py-3 pr-4 font-semibold">Status</th>
                    <th className="py-3 pr-4 font-semibold">Risk</th>
                    <th className="py-3 pr-4 font-semibold">Failure Probability</th>
                    <th className="py-3 pr-4 font-semibold">Predicted Days</th>
                    <th className="py-3 pr-4 font-semibold">Confidence</th>
                    <th className="py-3 font-semibold">Evaluated At</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedVehicleEvaluations.map((evaluation) => (
                    <tr key={evaluation.predictionId} className="border-b border-border/40 hover:bg-secondary/20 transition-colors">
                      <td className="py-3 pr-4 font-medium text-foreground">{evaluation.vehicleName}</td>
                      <td className="py-3 pr-4 font-semibold text-foreground">{Math.round(evaluation.overallHealth)}%</td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          evaluation.status === 'HEALTHY' 
                            ? 'bg-success/10 text-success' 
                            : evaluation.status === 'WARNING'
                            ? 'bg-warning/10 text-warning'
                            : 'bg-destructive/10 text-destructive'
                        }`}>
                          {evaluation.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          evaluation.riskLevel === 'LOW'
                            ? 'bg-success/10 text-success'
                            : evaluation.riskLevel === 'MODERATE'
                            ? 'bg-warning/10 text-warning'
                            : evaluation.riskLevel === 'HIGH'
                            ? 'bg-orange-500/10 text-orange-400'
                            : 'bg-destructive/10 text-destructive'
                        }`}>
                          {evaluation.riskLevel}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-foreground">{toDisplay((evaluation.failureProbability || 0) * 100, 1)}%</td>
                      <td className="py-3 pr-4 text-foreground">{evaluation.predictedFailureDays} days</td>
                      <td className="py-3 pr-4 text-foreground">{toDisplay((evaluation.confidenceScore || 0) * 100, 1)}%</td>
                      <td className="py-3 text-muted-foreground text-xs">{new Date(evaluation.evaluatedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12 border-2 border-dashed border-border/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                No evaluations found. Visit the Evaluation tab to run health analysis.
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
