import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Car, Gauge, Thermometer, Zap } from 'lucide-react';
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
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
        {/* Header */}
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl font-heading font-bold text-foreground">Vehixa Dashboard</h1>
          <p className="text-sm text-muted-foreground">Real-time telemetry and fault monitoring by vehicle</p>
          <p className="text-xs text-muted-foreground mt-1">
            {selectedVehicle
              ? `Showing metrics for ${selectedVehicle.name} (${selectedVehicle.plate})`
              : 'Waiting for vehicle data...'}
          </p>
        </motion.div>

        {/* Top metrics */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
          <MetricCard
            title="Selected Alerts"
            value={selectedVehicleAlerts.length}
            icon={<AlertTriangle className="h-4 w-4" />}
            subtitle={selectedVehicle ? `${criticalCount} critical` : `${activeAlerts.length} active`}
            trend="up"
          />
          <MetricCard
            title="Engine Temp"
            value={`${toDisplay(latestPoint?.engineTemp ?? null, 0)}°C`}
            icon={<Thermometer className="h-4 w-4" />}
            subtitle={selectedVehicle ? `Latest - ${selectedVehicle.name}` : 'Latest sample'}
            trend="stable"
          />
          <MetricCard
            title="Engine RPM"
            value={toDisplay(latestPoint?.engineRpm ?? null, 0)}
            icon={<Gauge className="h-4 w-4" />}
            subtitle={selectedVehicle ? `Latest - ${selectedVehicle.name}` : 'Latest sample'}
            trend="stable"
          />
          <MetricCard
            title="Battery Voltage"
            value={`${toDisplay(latestPoint?.batteryVoltage ?? null, 2)}V`}
            icon={<Zap className="h-4 w-4" />}
            subtitle={selectedVehicle ? `Latest - ${selectedVehicle.name}` : 'Latest sample'}
            trend="stable"
          />
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <h3 className="text-sm font-heading uppercase tracking-wider text-muted-foreground">
                Vehicle Telemetry Gauges
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedVehicle
                  ? `Focused on ${selectedVehicle.name} (${selectedVehicle.plate})`
                  : 'Select a vehicle to inspect live metrics'}
              </p>
              {latestChangedVehicle && (
                <p className="text-xs text-muted-foreground mt-1">
                  Latest changed vehicle: {latestChangedVehicle.name} ({latestChangedVehicle.plate}) at{' '}
                  {toDateTimeLabel(latestChangedVehicle.latestTelemetry?.recordedAt || latestChangedVehicle.lastUpdate)}
                </p>
              )}
            </div>

            {vehicles.length > 0 && (
              <select
                value={selectedVehicleId}
                onChange={(event) => setSelectedVehicleId(event.target.value)}
                className="bg-secondary/50 border border-border rounded px-3 py-2 text-xs text-foreground min-w-64"
              >
                {vehiclesByLatestUpdate.map((vehicle) => (
                  <option key={vehicle.id} value={getVehicleIdentifier(vehicle)}>
                    {vehicle.name} ({vehicle.plate})
                  </option>
                ))}
              </select>
            )}
          </div>

          {telemetryLoading ? (
            <p className="text-sm text-muted-foreground py-6">Loading selected vehicle telemetry...</p>
          ) : latestPoint ? (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6 justify-items-center">
              <GaugeChart
                value={latestPoint.speed || 0}
                max={180}
                label="Speed"
                unit="km/h"
                size={140}
                thresholds={{ warning: 120, critical: 150 }}
              />
              <GaugeChart
                value={latestPoint.engineRpm || 0}
                max={7000}
                label="Engine RPM"
                unit="rpm"
                size={140}
                thresholds={{ warning: 4500, critical: 6000 }}
              />
              <GaugeChart
                value={latestPoint.engineTemp || 0}
                max={130}
                label="Engine Temp"
                unit="deg C"
                size={140}
                thresholds={{ warning: 95, critical: 110 }}
              />
              <GaugeChart
                value={latestPoint.coolantTemp || 0}
                max={130}
                label="Coolant Temp"
                unit="deg C"
                size={140}
                thresholds={{ warning: 100, critical: 112 }}
              />
              <GaugeChart
                value={latestPoint.batteryVoltage || 0}
                max={14.5}
                label="Battery"
                unit="V"
                size={140}
                thresholds={{ warning: 11.5, critical: 10.5 }}
              />
              <GaugeChart
                value={latestPoint.lubOilPressure || 0}
                max={10}
                label="Lub Oil P"
                unit="bar"
                size={140}
                thresholds={{ warning: 2, critical: 1 }}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-6">No telemetry samples available for this vehicle.</p>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card p-4">
          <h3 className="text-sm font-heading uppercase tracking-wider text-muted-foreground mb-3">
            Latest Live Evaluation {selectedVehicle ? `- ${selectedVehicle.name}` : ''}
          </h3>

          {latestEvaluation ? (
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2 text-xs">
              <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Vehicle</span><p className="text-sm text-foreground mt-1 truncate">{latestEvaluation.vehicleName}</p></div>
              <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Health</span><p className="text-sm text-foreground mt-1">{Math.round(latestEvaluation.overallHealth)}%</p></div>
              <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Status</span><p className="text-sm text-foreground mt-1">{latestEvaluation.status}</p></div>
              <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Risk</span><p className="text-sm text-foreground mt-1">{latestEvaluation.riskLevel}</p></div>
              <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Failure Probability</span><p className="text-sm text-foreground mt-1">{toDisplay((latestEvaluation.failureProbability || 0) * 100, 1)}%</p></div>
              <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Confidence</span><p className="text-sm text-foreground mt-1">{toDisplay((latestEvaluation.confidenceScore || 0) * 100, 1)}%</p></div>
              <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Predicted Failure</span><p className="text-sm text-foreground mt-1">{latestEvaluation.predictedFailureDays} days</p></div>
              <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Evaluated At</span><p className="text-sm text-foreground mt-1">{new Date(latestEvaluation.evaluatedAt).toLocaleTimeString()}</p></div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No live evaluations found for the selected vehicle yet. Open Evaluation tab and run an evaluation.
            </p>
          )}
        </motion.div>

        {/* Charts */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {dashboardChartConfigs.map((chart) => (
            <div key={chart.key} className="glass-card p-4">
              <h3 className="text-sm font-heading uppercase tracking-wider text-muted-foreground mb-3">{chart.label}</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={telemetry}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 18%)" />
                  <XAxis dataKey="time" stroke="hsl(215, 15%, 55%)" fontSize={10} />
                  <YAxis stroke="hsl(215, 15%, 55%)" fontSize={10} />
                  <Tooltip contentStyle={{ background: 'hsl(220, 18%, 10%)', border: '1px solid hsl(220, 13%, 18%)', borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey={chart.key} stroke={chart.color} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </motion.div>

        {/* Latest telemetry snapshot */}
        <motion.div variants={itemVariants} className="glass-card p-4">
          <h3 className="text-sm font-heading uppercase tracking-wider text-muted-foreground mb-3">
            Latest Telemetry Snapshot {selectedVehicle ? `- ${selectedVehicle.name}` : ''}
          </h3>
          {latestPoint ? (
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-2 text-xs">
              <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Engine Temp</span><p className="text-foreground text-sm mt-1">{toDisplay(latestPoint.engineTemp ?? null, 1)} deg C</p></div>
              <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Engine RPM</span><p className="text-foreground text-sm mt-1">{toDisplay(latestPoint.engineRpm ?? null, 0)}</p></div>
              <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Coolant Temp</span><p className="text-foreground text-sm mt-1">{toDisplay(latestPoint.coolantTemp ?? null, 1)} deg C</p></div>
              <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Lub Oil Pressure</span><p className="text-foreground text-sm mt-1">{toDisplay(latestPoint.lubOilPressure ?? null, 2)} bar</p></div>
              <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Fuel Pressure</span><p className="text-foreground text-sm mt-1">{toDisplay(latestPoint.fuelPressure ?? null, 2)} psi</p></div>
              <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Battery Voltage</span><p className="text-foreground text-sm mt-1">{toDisplay(latestPoint.batteryVoltage ?? null, 2)} V</p></div>
              <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Speed</span><p className="text-foreground text-sm mt-1">{toDisplay(latestPoint.speed ?? null, 1)} km/h</p></div>
              <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Mileage</span><p className="text-foreground text-sm mt-1">{toDisplay(latestPoint.mileage ?? null, 1)} km</p></div>
              <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Fuel Efficiency</span><p className="text-foreground text-sm mt-1">{toDisplay(latestPoint.fuelEfficiency ?? null, 2)} km/L</p></div>
              <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Vibration Level</span><p className="text-foreground text-sm mt-1">{toDisplay(latestPoint.vibrationLevel ?? null, 2)}</p></div>
              <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Coolant Level</span><p className="text-foreground text-sm mt-1">{toDisplay(latestPoint.coolantLevel ?? null, 1)}%</p></div>
              <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Error Codes</span><p className="text-foreground text-sm mt-1">{toDisplay(latestPoint.errorCodesCount ?? null, 0)}</p></div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-3">No telemetry samples available yet</p>
          )}
        </motion.div>

        {/* Alerts & Fault Logs */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass-card p-4">
            <h3 className="text-sm font-heading uppercase tracking-wider text-muted-foreground mb-3">
              Active Alerts {selectedVehicle ? `- ${selectedVehicle.name}` : ''}
            </h3>
            <div className="space-y-2">
              {selectedVehicleAlerts.length > 0 ? (
                selectedVehicleAlerts.slice(0, 4).map(a => (
                  <AlertCard key={a.id} alert={a} compact />
                ))
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">No active alerts for this vehicle</p>
              )}
            </div>
          </div>

          <div className="glass-card p-4">
            <h3 className="text-sm font-heading uppercase tracking-wider text-muted-foreground mb-3">
              Recent Fault Logs {selectedVehicle ? `- ${selectedVehicle.name}` : ''}
            </h3>
            <div className="space-y-2">
              {selectedVehicleFaultLogs.length > 0 ? (
                selectedVehicleFaultLogs.slice(0, 5).map(f => (
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
                <p className="text-sm text-muted-foreground py-4 text-center">No fault logs for this vehicle</p>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card p-4">
          <h3 className="text-sm font-heading uppercase tracking-wider text-muted-foreground mb-3">
            Recent Evaluations {selectedVehicle ? `- ${selectedVehicle.name}` : ''}
          </h3>

          {selectedVehicleEvaluations.length > 0 ? (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[860px] text-xs">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border/60">
                    <th className="py-2 pr-3 font-medium">Vehicle</th>
                    <th className="py-2 pr-3 font-medium">Health</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
                    <th className="py-2 pr-3 font-medium">Risk</th>
                    <th className="py-2 pr-3 font-medium">Failure Probability</th>
                    <th className="py-2 pr-3 font-medium">Predicted Failure Days</th>
                    <th className="py-2 pr-3 font-medium">Confidence</th>
                    <th className="py-2 font-medium">Evaluated At</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedVehicleEvaluations.map((evaluation) => (
                    <tr key={evaluation.predictionId} className="border-b border-border/40 text-foreground">
                      <td className="py-2 pr-3">{evaluation.vehicleName}</td>
                      <td className="py-2 pr-3">{Math.round(evaluation.overallHealth)}%</td>
                      <td className="py-2 pr-3">{evaluation.status}</td>
                      <td className="py-2 pr-3">{evaluation.riskLevel}</td>
                      <td className="py-2 pr-3">{toDisplay((evaluation.failureProbability || 0) * 100, 1)}%</td>
                      <td className="py-2 pr-3">{evaluation.predictedFailureDays}</td>
                      <td className="py-2 pr-3">{toDisplay((evaluation.confidenceScore || 0) * 100, 1)}%</td>
                      <td className="py-2">{new Date(evaluation.evaluatedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No evaluations found for this vehicle yet.
            </p>
          )}
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
