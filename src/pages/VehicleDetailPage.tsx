import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/DashboardLayout';
import { HealthScore } from '@/components/HealthScore';
import { AlertCard } from '@/components/AlertCard';
import { SafeRangeLineChart } from '@/components/SafeRangeLineChart';
import { fetchVehicle, fetchAlerts, fetchTelemetry } from '@/services/api';
import type { Vehicle, Alert, TelemetryPoint } from '@/services/api';
import { Car, User, Gauge, MapPin, Download } from 'lucide-react';

const chartConfigs: Array<{
  key: keyof TelemetryPoint;
  label: string;
  color: string;
}> = [
  { key: 'engineRpm', label: 'Engine RPM', color: 'hsl(24, 95%, 53%)' },
  { key: 'engineTemp', label: 'Engine Temp (deg C)', color: 'hsl(0, 72%, 51%)' },
  { key: 'coolantTemp', label: 'Coolant Temp (deg C)', color: 'hsl(199, 89%, 48%)' },
  { key: 'lubOilPressure', label: 'Lub Oil Pressure', color: 'hsl(48, 96%, 53%)' },
  { key: 'batteryVoltage', label: 'Battery Voltage (V)', color: 'hsl(142, 71%, 45%)' },
  { key: 'speed', label: 'Speed (km/h)', color: 'hsl(262, 83%, 58%)' },
];

const latestMetricDefinitions: Array<{
  key: keyof TelemetryPoint;
  label: string;
  unit: string;
}> = [
  { key: 'engineRpm', label: 'Engine RPM', unit: '' },
  { key: 'rpm', label: 'RPM', unit: '' },
  { key: 'engineLoad', label: 'Engine Load', unit: '%' },
  { key: 'throttlePosition', label: 'Throttle Position', unit: '%' },
  { key: 'engineTemp', label: 'Engine Temp', unit: 'deg C' },
  { key: 'lubOilPressure', label: 'Lub Oil Pressure', unit: 'bar' },
  { key: 'oilPressure', label: 'Oil Pressure', unit: 'bar' },
  { key: 'lubOilTemp', label: 'Lub Oil Temp', unit: 'deg C' },
  { key: 'coolantTemp', label: 'Coolant Temp', unit: 'deg C' },
  { key: 'coolantPressure', label: 'Coolant Pressure', unit: 'bar' },
  { key: 'coolantLevel', label: 'Coolant Level', unit: '%' },
  { key: 'fuelPressure', label: 'Fuel Pressure', unit: 'psi' },
  { key: 'fuelEfficiency', label: 'Fuel Efficiency', unit: 'km/L' },
  { key: 'batteryVoltage', label: 'Battery Voltage', unit: 'V' },
  { key: 'speed', label: 'Speed', unit: 'km/h' },
  { key: 'mileage', label: 'Mileage', unit: 'km' },
  { key: 'vibrationLevel', label: 'Vibration Level', unit: '' },
  { key: 'ambientTemperature', label: 'Ambient Temp', unit: 'deg C' },
  { key: 'errorCodesCount', label: 'Error Codes', unit: '' },
  { key: 'batteryStateOfCharge', label: 'Battery SoC', unit: '%' },
  { key: 'batteryTemp', label: 'Battery Temp', unit: 'deg C' },
  { key: 'motorTemp', label: 'Motor Temp', unit: 'deg C' },
  { key: 'inverterTemp', label: 'Inverter Temp', unit: 'deg C' },
];

const formatMetricValue = (value: unknown, unit = ''): string => {
  if (value === null || value === undefined) return '--';

  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) {
    const formatted = numericValue.toFixed(2).replace(/\.00$/, '');
    return unit ? `${formatted} ${unit}` : formatted;
  }

  return String(value);
};

const toMinuteLabel = (recordedAt?: string): string => {
  if (!recordedAt) return '--:--';
  const date = new Date(recordedAt);
  if (Number.isNaN(date.getTime())) return '--:--';

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const csvEscape = (value: unknown): string => {
  const text =
    value === null || value === undefined
      ? ''
      : typeof value === 'object'
      ? JSON.stringify(value)
      : String(value);

  const escaped = text.replace(/"/g, '""');
  return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
};

const toSafeFileToken = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const VEHICLE_DETAIL_POLL_MS = 5000;

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [vehicleAlerts, setVehicleAlerts] = useState<Alert[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let inFlight = false;
    let intervalId = null;

    async function loadVehicleData(showLoader = false) {
      if (!id || inFlight) return;
      inFlight = true;

      if (showLoader) {
        setLoading(true);
      }

      try {
        const [vehicleData, alertsData, telemetryData] = await Promise.all([
          fetchVehicle(id),
          fetchAlerts({ vehicleId: id }),
          fetchTelemetry(id, 120),
        ]);

        if (!cancelled) {
          setVehicle(vehicleData || null);
          setVehicleAlerts(alertsData);
          setTelemetry(telemetryData);
        }
      } catch (error) {
        console.error('Error loading vehicle data:', error);
      } finally {
        if (!cancelled && showLoader) {
          setLoading(false);
        }

        inFlight = false;
      }
    }

    void loadVehicleData(true);

    intervalId = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      void loadVehicleData(false);
    }, VEHICLE_DETAIL_POLL_MS);

    return () => {
      cancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading vehicle...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!vehicle) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Vehicle not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const faultProbabilities = [
    { name: 'Engine Failure', probability: vehicle.healthScore < 50 ? 72 : 12 },
    { name: 'Battery Failure', probability: vehicle.healthScore < 50 ? 58 : 8 },
    { name: 'Brake Issue', probability: vehicle.healthScore < 70 ? 34 : 5 },
    { name: 'Transmission', probability: vehicle.healthScore < 60 ? 41 : 3 },
  ];

  const latestTelemetry = telemetry.length > 0
    ? telemetry[telemetry.length - 1]
    : vehicle.latestTelemetry || null;

  const telemetryHistory = [...telemetry].reverse();

  const downloadTelemetryHistoryCsv = () => {
    if (telemetryHistory.length === 0) return;

    const headers = [
      'recordedAt',
      'time',
      'engineRpm',
      'engineTemp',
      'coolantTemp',
      'lubOilPressure',
      'fuelPressure',
      'batteryVoltage',
      'speed',
      'mileage',
      'vibrationLevel',
      'fuelEfficiency',
      'errorCodesCount',
      'ambientTemperature',
      'batteryStateOfCharge',
      'motorTemp',
      'inverterTemp',
      'source',
    ];

    const lines = [headers.map(csvEscape).join(',')];

    telemetryHistory.forEach((point) => {
      const row = [
        point.recordedAt ?? '',
        point.time ?? '',
        point.engineRpm ?? '',
        point.engineTemp ?? '',
        point.coolantTemp ?? '',
        point.lubOilPressure ?? '',
        point.fuelPressure ?? '',
        point.batteryVoltage ?? '',
        point.speed ?? '',
        point.mileage ?? '',
        point.vibrationLevel ?? '',
        point.fuelEfficiency ?? '',
        point.errorCodesCount ?? '',
        point.ambientTemperature ?? '',
        point.batteryStateOfCharge ?? '',
        point.motorTemp ?? '',
        point.inverterTemp ?? '',
        point.source ?? '',
      ];

      lines.push(row.map(csvEscape).join(','));
    });

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const vehicleLabel = vehicle.plate || vehicle.name || vehicle.vehicleId || vehicle.id;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `telemetry-history-${toSafeFileToken(vehicleLabel)}-${timestamp}.csv`;

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        {/* Header */}
        <motion.div
          layoutId={`vehicle-card-${vehicle.id}`}
          className="glass-card p-5 flex flex-col md:flex-row items-start md:items-center gap-6"
        >
          <HealthScore score={vehicle.healthScore} />
          <div className="flex-1">
            <h1 className="text-xl font-heading font-bold text-foreground">{vehicle.name}</h1>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Car className="h-3.5 w-3.5" /> {vehicle.type}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {vehicle.plate}</span>
              <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> {vehicle.driver}</span>
              <span className="flex items-center gap-1"><Gauge className="h-3.5 w-3.5" /> {Math.round(vehicle.mileage).toLocaleString()} km</span>
            </div>
          </div>
          <div className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase ${
            vehicle.status === 'healthy' ? 'status-healthy' : vehicle.status === 'warning' ? 'status-warning' : 'status-critical'
          }`}>
            {vehicle.status}
          </div>
        </motion.div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {chartConfigs.map((chart) => (
            <div key={chart.key} className="glass-card p-4">
              <h3 className="text-sm font-heading uppercase tracking-wider text-muted-foreground mb-3">{chart.label}</h3>
              <SafeRangeLineChart
                data={telemetry}
                metricKey={chart.key}
                color={chart.color}
                height={180}
                strokeWidth={2}
              />
            </div>
          ))}
        </div>

        {/* Latest full telemetry snapshot */}
        <div className="glass-card p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
            <h3 className="text-sm font-heading uppercase tracking-wider text-muted-foreground">
              Latest Telemetry Snapshot
            </h3>
            <span className="text-xs text-muted-foreground">
              {latestTelemetry?.recordedAt
                ? `Recorded ${new Date(latestTelemetry.recordedAt).toLocaleString()}`
                : 'No telemetry received yet'}
            </span>
          </div>

          {latestTelemetry ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {latestMetricDefinitions.map((metric) => (
                <div key={metric.key} className="rounded-md bg-secondary/40 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {metric.label}
                  </div>
                  <div className="text-sm font-medium text-foreground mt-1">
                    {formatMetricValue(latestTelemetry[metric.key], metric.unit)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No telemetry snapshot available for this vehicle
            </p>
          )}
        </div>

        {/* Fault Probability & Alert Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass-card p-4">
            <h3 className="text-sm font-heading uppercase tracking-wider text-muted-foreground mb-4">Fault Probability</h3>
            <div className="space-y-3">
              {faultProbabilities.map(fp => (
                <div key={fp.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-foreground">{fp.name}</span>
                    <span className={fp.probability > 50 ? 'text-destructive' : fp.probability > 20 ? 'text-warning' : 'text-success'}>
                      {fp.probability}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${fp.probability > 50 ? 'bg-destructive' : fp.probability > 20 ? 'bg-warning' : 'bg-success'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${fp.probability}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-4">
            <h3 className="text-sm font-heading uppercase tracking-wider text-muted-foreground mb-3">Alert Timeline</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
              {vehicleAlerts.length > 0 ? vehicleAlerts.map(a => (
                <AlertCard key={a.id} alert={a} compact />
              )) : (
                <p className="text-sm text-muted-foreground py-4 text-center">No alerts for this vehicle</p>
              )}
            </div>
          </div>
        </div>

        {/* Minute-wise historical telemetry table */}
        <div className="glass-card p-4">
          <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h3 className="text-sm font-heading uppercase tracking-wider text-muted-foreground">
              Telemetry History (Minute-wise)
            </h3>
            <button
              type="button"
              onClick={downloadTelemetryHistoryCsv}
              disabled={telemetryHistory.length === 0}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/70 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              Download CSV
            </button>
          </div>

          {telemetryHistory.length > 0 ? (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[1280px] text-xs">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border/60">
                    <th className="py-2 pr-3 font-medium">Time</th>
                    <th className="py-2 pr-3 font-medium">RPM</th>
                    <th className="py-2 pr-3 font-medium">Engine Temp</th>
                    <th className="py-2 pr-3 font-medium">Coolant Temp</th>
                    <th className="py-2 pr-3 font-medium">Lub Oil P</th>
                    <th className="py-2 pr-3 font-medium">Fuel P</th>
                    <th className="py-2 pr-3 font-medium">Battery V</th>
                    <th className="py-2 pr-3 font-medium">Speed</th>
                    <th className="py-2 pr-3 font-medium">Mileage</th>
                    <th className="py-2 pr-3 font-medium">Vibration</th>
                    <th className="py-2 pr-3 font-medium">Fuel Eff.</th>
                    <th className="py-2 pr-3 font-medium">Err Codes</th>
                    <th className="py-2 pr-3 font-medium">Ambient</th>
                    <th className="py-2 pr-3 font-medium">Battery SoC</th>
                    <th className="py-2 pr-3 font-medium">Motor Temp</th>
                    <th className="py-2 pr-3 font-medium">Inverter Temp</th>
                    <th className="py-2 font-medium">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {telemetryHistory.map((point) => (
                    <tr key={point.id || `${point.vehicleId}-${point.recordedAt}`} className="border-b border-border/40 text-foreground">
                      <td className="py-2 pr-3">{toMinuteLabel(point.recordedAt)}</td>
                      <td className="py-2 pr-3">{formatMetricValue(point.engineRpm)}</td>
                      <td className="py-2 pr-3">{formatMetricValue(point.engineTemp, 'deg C')}</td>
                      <td className="py-2 pr-3">{formatMetricValue(point.coolantTemp, 'deg C')}</td>
                      <td className="py-2 pr-3">{formatMetricValue(point.lubOilPressure, 'bar')}</td>
                      <td className="py-2 pr-3">{formatMetricValue(point.fuelPressure, 'psi')}</td>
                      <td className="py-2 pr-3">{formatMetricValue(point.batteryVoltage, 'V')}</td>
                      <td className="py-2 pr-3">{formatMetricValue(point.speed, 'km/h')}</td>
                      <td className="py-2 pr-3">{formatMetricValue(point.mileage, 'km')}</td>
                      <td className="py-2 pr-3">{formatMetricValue(point.vibrationLevel)}</td>
                      <td className="py-2 pr-3">{formatMetricValue(point.fuelEfficiency, 'km/L')}</td>
                      <td className="py-2 pr-3">{formatMetricValue(point.errorCodesCount)}</td>
                      <td className="py-2 pr-3">{formatMetricValue(point.ambientTemperature, 'deg C')}</td>
                      <td className="py-2 pr-3">{formatMetricValue(point.batteryStateOfCharge, '%')}</td>
                      <td className="py-2 pr-3">{formatMetricValue(point.motorTemp, 'deg C')}</td>
                      <td className="py-2 pr-3">{formatMetricValue(point.inverterTemp, 'deg C')}</td>
                      <td className="py-2">{point.source || '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">No historical telemetry data available</p>
          )}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
