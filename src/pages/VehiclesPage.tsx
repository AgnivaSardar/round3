import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/DashboardLayout';
import { HealthScore } from '@/components/HealthScore';
import { fetchVehicles, fetchTelemetry } from '@/services/api';
import type { Vehicle, TelemetryPoint } from '@/services/api';
import { Car, User, Gauge } from 'lucide-react';

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

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>([]);
  const [telemetryLoading, setTelemetryLoading] = useState(false);

  useEffect(() => {
    async function loadVehicles() {
      setLoading(true);
      try {
        const data = await fetchVehicles();
        setVehicles(data);
        if (data.length > 0) {
          setSelectedVehicleId(data[0].vehicleId || data[0].id);
        }
      } catch (error) {
        console.error('Error loading vehicles:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadVehicles();
  }, []);

  useEffect(() => {
    async function loadVehicleTelemetry() {
      if (!selectedVehicleId) {
        setTelemetryHistory([]);
        return;
      }

      setTelemetryLoading(true);
      try {
        const data = await fetchTelemetry(selectedVehicleId, 180);
        setTelemetryHistory(data);
      } catch (error) {
        console.error('Error loading selected vehicle telemetry:', error);
        setTelemetryHistory([]);
      } finally {
        setTelemetryLoading(false);
      }
    }

    loadVehicleTelemetry();
  }, [selectedVehicleId]);

  const selectedVehicle = vehicles.find(
    (vehicle) => (vehicle.vehicleId || vehicle.id) === selectedVehicleId
  );

  const latestTelemetry = telemetryHistory.length > 0
    ? telemetryHistory[telemetryHistory.length - 1]
    : selectedVehicle?.latestTelemetry || null;

  const telemetryRows = [...telemetryHistory].reverse();

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
              <h3 className="text-sm font-heading uppercase tracking-wider text-muted-foreground mb-3">
                Minute-wise Telemetry History
              </h3>

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
      </div>
    </DashboardLayout>
  );
}
