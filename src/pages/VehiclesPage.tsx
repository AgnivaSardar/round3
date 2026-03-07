import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/DashboardLayout';
import { HealthScore } from '@/components/HealthScore';
import { fetchVehicles, fetchTelemetry, fetchAlerts } from '@/services/api';
import type { Vehicle, TelemetryPoint, Alert } from '@/services/api';
import { Car, User, Gauge, Download, X } from 'lucide-react';

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
  const numberValue = Number(value);
  if (Number.isFinite(numberValue)) {
    const formatted = numberValue.toFixed(2).replace(/\.00$/, '');
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

const VEHICLES_LIST_POLL_MS = 8000;
const VEHICLE_TELEMETRY_POLL_MS = 3000;
const CRITICAL_ALERT_POLL_MS = 3000;
const CRITICAL_ALERT_MODAL_MS = 5000;

interface CriticalAlertModalState {
  id: string;
  title: string;
  message: string;
  vehicleName?: string;
  timestamp?: string | Date;
}

const getAlertIdentity = (alert: Alert): string | null => alert.alertId || alert.id || null;

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>([]);
  const [telemetryLoading, setTelemetryLoading] = useState(false);
  const [criticalAlertModal, setCriticalAlertModal] = useState<CriticalAlertModalState | null>(null);
  const alertDismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seenCriticalAlertIdsRef = useRef<Set<string>>(new Set());

  const showCriticalAlertModalForFiveSeconds = (alert: Alert) => {
    const alertId = getAlertIdentity(alert);
    if (!alertId) return;

    setCriticalAlertModal({
      id: alertId,
      title: alert.type || 'Critical alert detected',
      message: alert.message,
      vehicleName: alert.vehicleName,
      timestamp: alert.timestamp,
    });

    if (alertDismissTimeoutRef.current) {
      clearTimeout(alertDismissTimeoutRef.current);
    }

    alertDismissTimeoutRef.current = setTimeout(() => {
      setCriticalAlertModal((current) => (current?.id === alertId ? null : current));
      alertDismissTimeoutRef.current = null;
    }, CRITICAL_ALERT_MODAL_MS);
  };

  useEffect(() => {
    return () => {
      if (alertDismissTimeoutRef.current) {
        clearTimeout(alertDismissTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    let intervalId = null;

    async function loadVehicles(showLoader = false) {
      if (inFlight) return;
      inFlight = true;

      if (showLoader) {
        setLoading(true);
      }

      try {
        const data = await fetchVehicles();
        if (!cancelled) {
          setVehicles(data);

          setSelectedVehicleId((currentSelectedVehicleId) => {
            if (currentSelectedVehicleId) {
              const selectedStillExists = data.some(
                (vehicle) => (vehicle.vehicleId || vehicle.id) === currentSelectedVehicleId
              );

              if (selectedStillExists) return currentSelectedVehicleId;
            }

            return data.length > 0 ? data[0].vehicleId || data[0].id : '';
          });
        }
      } catch (error) {
        console.error('Error loading vehicles:', error);
      } finally {
        if (!cancelled && showLoader) {
          setLoading(false);
        }

        inFlight = false;
      }
    }

    void loadVehicles(true);

    intervalId = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      void loadVehicles(false);
    }, VEHICLES_LIST_POLL_MS);

    return () => {
      cancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  useEffect(() => {
    if (!selectedVehicleId) {
      setTelemetryHistory([]);
      return;
    }

    let cancelled = false;
    let inFlight = false;
    let intervalId = null;

    async function loadVehicleTelemetry(showLoader = false) {
      if (inFlight) return;
      inFlight = true;

      if (showLoader) {
        setTelemetryLoading(true);
      }

      try {
        const data = await fetchTelemetry(selectedVehicleId, 180);
        if (!cancelled) {
          setTelemetryHistory(data);
        }
      } catch (error) {
        console.error('Error loading selected vehicle telemetry:', error);
        if (!cancelled && showLoader) {
          setTelemetryHistory([]);
        }
      } finally {
        if (!cancelled && showLoader) {
          setTelemetryLoading(false);
        }

        inFlight = false;
      }
    }

    void loadVehicleTelemetry(true);

    intervalId = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      void loadVehicleTelemetry(false);
    }, VEHICLE_TELEMETRY_POLL_MS);

    return () => {
      cancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [selectedVehicleId]);

  useEffect(() => {
    if (!selectedVehicleId) return;

    let cancelled = false;

    async function showCriticalAlertForSelectedVehicle() {
      try {
        const vehicleCriticalAlerts = await fetchAlerts({
          vehicleId: selectedVehicleId,
          severity: 'CRITICAL',
          isResolved: false,
          limit: 1,
        });

        if (cancelled) return;

        const latestVehicleCriticalAlert = vehicleCriticalAlerts[0];
        if (!latestVehicleCriticalAlert) return;

        const alertId = getAlertIdentity(latestVehicleCriticalAlert);
        if (alertId) {
          seenCriticalAlertIdsRef.current.add(alertId);
        }

        showCriticalAlertModalForFiveSeconds(latestVehicleCriticalAlert);
      } catch (error) {
        console.error('Error loading critical alert for selected vehicle:', error);
      }
    }

    void showCriticalAlertForSelectedVehicle();

    return () => {
      cancelled = true;
    };
  }, [selectedVehicleId]);

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    let intervalId = null;

    async function pollCriticalAlerts() {
      if (inFlight) return;
      inFlight = true;

      try {
        const criticalAlerts = await fetchAlerts({
          severity: 'CRITICAL',
          isResolved: false,
          limit: 30,
        });

        if (cancelled) return;

        const criticalAlertIds = criticalAlerts
          .map((alert) => getAlertIdentity(alert))
          .filter((id): id is string => Boolean(id));

        const newCriticalAlert = criticalAlerts.find((alert) => {
          const alertId = getAlertIdentity(alert);
          return Boolean(alertId) && !seenCriticalAlertIdsRef.current.has(alertId);
        });

        criticalAlertIds.forEach((id) => seenCriticalAlertIdsRef.current.add(id));

        if (newCriticalAlert) {
          showCriticalAlertModalForFiveSeconds(newCriticalAlert);
        }
      } catch (error) {
        console.error('Error polling critical alerts:', error);
      } finally {
        inFlight = false;
      }
    }

    void pollCriticalAlerts();

    intervalId = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      void pollCriticalAlerts();
    }, CRITICAL_ALERT_POLL_MS);

    return () => {
      cancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  const selectedVehicle = vehicles.find(
    (vehicle) => (vehicle.vehicleId || vehicle.id) === selectedVehicleId
  );

  const latestTelemetry = telemetryHistory.length > 0
    ? telemetryHistory[telemetryHistory.length - 1]
    : selectedVehicle?.latestTelemetry || null;

  const telemetryRows = [...telemetryHistory].reverse();

  const downloadTelemetryHistoryCsv = () => {
    if (telemetryRows.length === 0) return;

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

    telemetryRows.forEach((point) => {
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

    const vehicleLabel =
      selectedVehicle?.plate || selectedVehicle?.name || selectedVehicleId || 'vehicle';

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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading vehicles...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Vehicles</h1>
            <p className="text-sm text-muted-foreground">{vehicles.length} vehicles in Vehixa fleet</p>
          </div>
          <Link
            to="/vehicles/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Car className="h-4 w-4" />
            Add Vehicle
          </Link>
        </div>

        {vehicles.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <p className="text-muted-foreground">No vehicles found in the fleet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {vehicles.map((v, i) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="glass-card-hover p-5">
                  <div className="flex items-start gap-4">
                    <HealthScore score={v.healthScore} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-heading font-semibold text-foreground truncate">{v.name}</h3>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          v.status === 'healthy' ? 'status-healthy' : v.status === 'warning' ? 'status-warning' : 'status-critical'
                        }`}>{v.status}</span>
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1"><Car className="h-3 w-3" /> {v.type} · {v.plate}</div>
                        <div className="flex items-center gap-1"><User className="h-3 w-3" /> {v.driver}</div>
                        <div className="flex items-center gap-1"><Gauge className="h-3 w-3" /> {Math.round(v.mileage).toLocaleString()} km</div>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-2">
                        Updated {new Date(v.lastUpdate).toLocaleString()}
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => setSelectedVehicleId(v.vehicleId || v.id)}
                          className={`text-[10px] px-2 py-1 rounded border ${
                            (v.vehicleId || v.id) === selectedVehicleId
                              ? 'border-primary text-primary bg-primary/10'
                              : 'border-border text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {(v.vehicleId || v.id) === selectedVehicleId ? 'Selected' : 'Inspect telemetry'}
                        </button>
                        <Link
                          to={`/vehicles/${v.id}`}
                          className="text-[10px] px-2 py-1 rounded border border-border text-muted-foreground hover:text-foreground"
                        >
                          Open details
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {selectedVehicle && (
          <div className="space-y-4">
            <div className="glass-card p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-sm font-heading uppercase tracking-wider text-muted-foreground">
                    {selectedVehicle.name} - Latest Telemetry Attributes
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Complete telemetry snapshot from the most recent record
                  </p>
                </div>
                <select
                  value={selectedVehicleId}
                  onChange={(event) => setSelectedVehicleId(event.target.value)}
                  className="bg-secondary/50 border border-border rounded px-3 py-2 text-xs text-foreground"
                >
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.vehicleId || vehicle.id}>
                      {vehicle.name} ({vehicle.plate})
                    </option>
                  ))}
                </select>
              </div>

              {telemetryLoading ? (
                <p className="text-sm text-muted-foreground py-4">Loading telemetry snapshot...</p>
              ) : latestTelemetry ? (
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
                <p className="text-sm text-muted-foreground py-4">No telemetry records available for this vehicle</p>
              )}
            </div>

            <div className="glass-card p-4">
              <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h3 className="text-sm font-heading uppercase tracking-wider text-muted-foreground">
                  Minute-wise Telemetry History
                </h3>
                <button
                  type="button"
                  onClick={downloadTelemetryHistoryCsv}
                  disabled={telemetryRows.length === 0}
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/70 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download CSV
                </button>
              </div>

              {telemetryLoading ? (
                <p className="text-sm text-muted-foreground py-4">Loading telemetry history...</p>
              ) : telemetryRows.length > 0 ? (
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
                      {telemetryRows.map((point) => (
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
                <p className="text-sm text-muted-foreground py-4">No telemetry history available</p>
              )}
            </div>
          </div>
        )}

        {criticalAlertModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/75 px-4 backdrop-blur-sm">
            <div className="relative w-full max-w-lg rounded-xl border border-destructive/40 bg-card p-5 shadow-2xl">
              <button
                type="button"
                onClick={() => {
                  setCriticalAlertModal(null);
                  if (alertDismissTimeoutRef.current) {
                    clearTimeout(alertDismissTimeoutRef.current);
                    alertDismissTimeoutRef.current = null;
                  }
                }}
                className="absolute right-3 top-3 rounded-md border border-border/60 p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                aria-label="Close alert modal"
              >
                <X className="h-4 w-4" />
              </button>

              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-destructive">
                Critical Alert
              </p>

              <h3 className="mt-2 text-lg font-heading font-semibold text-foreground">
                {criticalAlertModal.title || 'Critical fault detected'}
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                {criticalAlertModal.message || 'A critical vehicle issue was detected.'}
              </p>

              {criticalAlertModal.vehicleName ? (
                <p className="mt-3 text-sm text-foreground">
                  Vehicle: <span className="font-medium">{criticalAlertModal.vehicleName}</span>
                </p>
              ) : null}

              <div className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {criticalAlertModal.timestamp
                  ? `Detected at ${new Date(criticalAlertModal.timestamp).toLocaleString()} - auto-closing in 5 seconds`
                  : 'Immediate attention required - auto-closing in 5 seconds'}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
