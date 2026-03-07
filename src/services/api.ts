import axios from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface Vehicle {
  id: string;
  vehicleId: string;
  name: string;
  plate: string;
  type: string;
  healthScore: number;
  status: 'healthy' | 'warning' | 'critical';
  lastUpdate: string | Date;
  driver: string;
  mileage: number;
  activeAlerts?: number;
  manufacturer?: string;
  model?: string;
  year?: number;
  vin?: string;
  fuelType?: string;
  latestTelemetry?: TelemetryPoint | null;
}

export interface Alert {
  id: string;
  alertId: string;
  vehicleId: string;
  vehicleName: string;
  vehiclePlate?: string;
  type: string;
  severity: 'critical' | 'warning' | 'anomaly' | 'high' | 'medium' | 'low';
  message: string;
  suggestedAction: string;
  timestamp: string | Date;
  acknowledged: boolean;
  isResolved: boolean;
}

export interface TelemetryPoint {
  id?: string;
  vehicleId?: string;
  source?: string | null;

  time: string;

  // Engine metrics
  engineRpm?: number | null;
  rpm?: number | null;
  engineLoad?: number | null;
  throttlePosition?: number | null;
  engineTemp?: number | null;

  // Oil system
  lubOilPressure?: number | null;
  oilPressure?: number | null;
  lubOilTemp?: number | null;

  // Cooling system
  coolantTemp?: number | null;
  coolantPressure?: number | null;
  coolantLevel?: number | null;

  // Fuel system
  fuelPressure?: number | null;
  batteryVoltage?: number | null;
  speed?: number | null;
  fuelEfficiency?: number | null;

  // Vehicle movement / health
  mileage?: number | null;
  vibration?: number | null;
  vibrationLevel?: number | null;

  // Environment / diagnostics
  ambientTemperature?: number | null;
  errorCodesCount?: number | null;
  activeFaultCodes?: unknown;

  // EV metrics
  batteryStateOfCharge?: number | null;
  batteryTemp?: number | null;
  motorTemp?: number | null;
  inverterTemp?: number | null;

  recordedAt?: string;
  receivedAt?: string;
  rawPayload?: unknown;
}

export interface FaultLog {
  id: string;
  vehicleId: string;
  vehicleName: string;
  fault: string;
  severity: 'critical' | 'warning' | 'anomaly';
  timestamp: string;
  resolved: boolean;
}

export interface InsightsData {
  commonFaults: Array<{ name: string; count: number; fill?: string }>;
  severityBreakdown: Array<{ name: string; value: number; fill?: string }>;
  topAlertVehicles: Array<{ vehicle: string; alerts: number }>;
}

export interface HealthEvaluation {
  predictionId: string;
  vehicleId: string;
  vehicleName: string;
  vehiclePlate?: string;
  telemetryId?: string;
  overallHealth: number;
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';
  failureProbability: number;
  confidenceScore: number;
  predictedFailureDays: number;
  modelVersion: string;
  diagnosticAnalysis?: string;
  topInfluentialFeatures?: string[];
  components?: {
    engine: number;
    transmission: number;
    battery: number;
    cooling: number;
    suspension: number;
    [key: string]: number;
  };
  recommendations?: string[];
  source?: string | null;
  telemetryRecordedAt?: string | null;
  evaluatedAt: string;
  alert?: {
    alertId?: string;
    alertType?: string;
    severity?: string;
    title?: string;
    message?: string;
  } | null;
}

export interface CreateVehiclePayload {
  userId?: string;
  vehicleNumber?: string;
  model?: string;
  manufacturer?: string;
  year?: number;
  vehicleType?: string;
  vin?: string;
  engineType?: string;
  fuelType: string;
  registrationDate?: string;
  status?: string;
}

const toTimeLabel = (value?: string, includeSeconds = false): string => {
  if (!value) return '--:--';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--';

  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  if (!includeSeconds) {
    return `${hours}:${minutes}`;
  }

  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

const toTelemetryPoint = (
  point: any,
  includeSeconds = false
): TelemetryPoint => {
  const speedValue =
    point.speed !== undefined && point.speed !== null
      ? Number(point.speed)
      : point.rpm !== undefined && point.rpm !== null
      ? Number(point.rpm) / 100
      : null;

  return {
    id: point.id,
    vehicleId: point.vehicleId,
    source: point.source ?? null,

    time: toTimeLabel(point.recordedAt, includeSeconds),

    engineRpm: point.engineRpm ?? null,
    rpm: point.rpm ?? null,
    engineLoad: point.engineLoad ?? null,
    throttlePosition: point.throttlePosition ?? null,
    engineTemp: point.engineTemp ?? point.lubOilTemp ?? null,

    lubOilPressure: point.lubOilPressure ?? null,
    oilPressure: point.oilPressure ?? null,
    lubOilTemp: point.lubOilTemp ?? null,

    coolantTemp: point.coolantTemp ?? null,
    coolantPressure: point.coolantPressure ?? null,
    coolantLevel: point.coolantLevel ?? null,

    fuelPressure: point.fuelPressure ?? null,
    fuelEfficiency: point.fuelEfficiency ?? null,

    batteryVoltage: point.batteryVoltage ?? null,

    speed: Number.isFinite(speedValue) ? speedValue : null,
    mileage: point.mileage ?? null,

    vibration: point.vibrationLevel ?? null,
    vibrationLevel: point.vibrationLevel ?? null,

    ambientTemperature: point.ambientTemperature ?? null,
    errorCodesCount: point.errorCodesCount ?? null,
    activeFaultCodes: point.activeFaultCodes ?? null,

    batteryStateOfCharge: point.batteryStateOfCharge ?? null,
    batteryTemp: point.batteryTemp ?? null,
    motorTemp: point.motorTemp ?? null,
    inverterTemp: point.inverterTemp ?? null,

    recordedAt: point.recordedAt,
    receivedAt: point.receivedAt,
    rawPayload: point.rawPayload,
  };
};

// API Functions

export async function fetchVehicles(): Promise<Vehicle[]> {
  try {
    const response = await api.get('/vehicles');
    const vehicles = response.data.vehicles || [];

    return vehicles.map((vehicle: Vehicle) => ({
      ...vehicle,
      latestTelemetry: vehicle.latestTelemetry
        ? toTelemetryPoint(vehicle.latestTelemetry)
        : null,
    }));
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return [];
  }
}

export async function fetchVehicle(id: string): Promise<Vehicle | undefined> {
  try {
    const response = await api.get(`/vehicles/${id}`);

    const vehicle = response.data.vehicle;
    if (!vehicle) return undefined;

    return {
      ...vehicle,
      latestTelemetry: vehicle.latestTelemetry
        ? toTelemetryPoint(vehicle.latestTelemetry)
        : null,
    };
  } catch (error) {
    console.error(`Error fetching vehicle ${id}:`, error);
    return undefined;
  }
}

export async function createVehicle(payload: CreateVehiclePayload): Promise<Vehicle | null> {
  try {
    const response = await api.post('/vehicles', payload);
    const vehicleData = response.data?.vehicle || response.data;

    if (!vehicleData) return null;

    const vehicle = vehicleData as Vehicle;
    return {
      ...vehicle,
      latestTelemetry: vehicle.latestTelemetry
        ? toTelemetryPoint(vehicle.latestTelemetry as any)
        : null,
    };
  } catch (error) {
    console.error('Error creating vehicle:', error);
    return null;
  }
}

export async function fetchAlerts(params?: {
  vehicleId?: string;
  severity?: string;
  isResolved?: boolean;
  limit?: number;
}): Promise<Alert[]> {
  try {
    const response = await api.get('/alerts', { params });
    const alerts = response.data.alerts || [];
    
    // Normalize severity values to match frontend expectations
    return alerts.map((alert: Alert) => ({
      ...alert,
      severity: normalizeSeverity(alert.severity),
    }));
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return [];
  }
}

export async function acknowledgeAlert(alertId: string): Promise<Alert | null> {
  try {
    const response = await api.patch(`/alerts/${alertId}/acknowledge`);
    return response.data.alert;
  } catch (error) {
    console.error(`Error acknowledging alert ${alertId}:`, error);
    return null;
  }
}

export async function fetchTelemetry(vehicleId?: string, limit?: number): Promise<TelemetryPoint[]> {
  try {
    const params: any = {};
    if (vehicleId) params.vehicleId = vehicleId;
    if (limit) params.limit = limit;
    
    const response = await api.get('/telemetry', { params });
    const telemetryData = response.data.telemetry || [];

    // Backend returns newest first; reverse to oldest->newest for charts/tables.
    return telemetryData
      .map((point: any) => toTelemetryPoint(point))
      .reverse();
  } catch (error) {
    console.error('Error fetching telemetry:', error);
    return [];
  }
}

export async function fetchLatestTelemetry(vehicleId?: string): Promise<TelemetryPoint | null> {
  try {
    const params: any = {};
    if (vehicleId) params.vehicleId = vehicleId;
    
    const response = await api.get('/telemetry/latest', { params });
    const point = response.data.telemetry;
    
    if (!point) return null;

    return toTelemetryPoint(point, true);
  } catch (error) {
    console.error('Error fetching latest telemetry:', error);
    return null;
  }
}

export async function fetchLiveTelemetry(vehicleId?: string): Promise<TelemetryPoint | null> {
  return fetchLatestTelemetry(vehicleId);
}

export async function fetchFaultLogs(): Promise<FaultLog[]> {
  try {
    const alerts = await fetchAlerts({ isResolved: false });
    
    // Transform alerts to fault log format
    return alerts.map(alert => ({
      id: alert.id,
      vehicleId: alert.vehicleId,
      vehicleName: alert.vehicleName,
      fault: alert.type,
      severity: alert.severity as 'critical' | 'warning' | 'anomaly',
      timestamp: alert.timestamp.toString(),
      resolved: alert.isResolved,
    }));
  } catch (error) {
    console.error('Error fetching fault logs:', error);
    return [];
  }
}

export async function fetchInsights(): Promise<InsightsData> {
  try {
    const response = await api.get('/alerts/stats');
    const stats = response.data;
    
    // Transform to match expected format
    const commonFaults = (stats.commonFaults || []).map((fault: any, index: number) => ({
      name: fault.name,
      count: fault.count,
      fill: getFaultColor(index),
    }));
    
    const severityBreakdown = [
      { name: 'Critical', value: stats.severityBreakdown?.critical || 0, fill: 'hsl(0, 72%, 51%)' },
      { name: 'Warning', value: (stats.severityBreakdown?.high || 0) + (stats.severityBreakdown?.medium || 0), fill: 'hsl(24, 95%, 53%)' },
      { name: 'Anomaly', value: stats.severityBreakdown?.low || 0, fill: 'hsl(48, 96%, 53%)' },
    ];
    
    const topAlertVehicles = (stats.topAlertVehicles || []).map((item: any) => ({
      vehicle: item.vehicle,
      alerts: item.alerts,
    }));
    
    return {
      commonFaults,
      severityBreakdown,
      topAlertVehicles,
    };
  } catch (error) {
    console.error('Error fetching insights:', error);
    return {
      commonFaults: [],
      severityBreakdown: [],
      topAlertVehicles: [],
    };
  }
}

export async function fetchHealthEvaluations(
  vehicleId?: string,
  limit?: number
): Promise<HealthEvaluation[]> {
  try {
    const params: any = {};
    if (vehicleId) params.vehicleId = vehicleId;
    if (limit) params.limit = limit;

    const response = await api.get('/health-predictions', { params });
    return response.data.predictions || [];
  } catch (error) {
    console.error('Error fetching health evaluations:', error);
    return [];
  }
}

export async function evaluateVehicleLive(
  vehicleId: string
): Promise<HealthEvaluation | null> {
  try {
    const response = await api.post('/health-predictions/evaluate', { vehicleId });
    return response.data as HealthEvaluation;
  } catch (error) {
    console.error('Error evaluating live vehicle health:', error);
    return null;
  }
}

export async function fetchHealthEvaluation(
  predictionId: string
): Promise<HealthEvaluation | null> {
  try {
    const response = await api.get(`/health-predictions/${predictionId}`);
    return response.data.prediction || null;
  } catch (error) {
    console.error(`Error fetching health evaluation ${predictionId}:`, error);
    return null;
  }
}

// Helper functions

function normalizeSeverity(severity: string): 'critical' | 'warning' | 'anomaly' {
  const normalized = severity.toLowerCase();
  if (normalized === 'critical') return 'critical';
  if (normalized === 'high' || normalized === 'warning' || normalized === 'medium') return 'warning';
  return 'anomaly';
}

function getFaultColor(index: number): string {
  const colors = [
    'hsl(0, 72%, 51%)',
    'hsl(24, 95%, 53%)',
    'hsl(38, 92%, 50%)',
    'hsl(199, 89%, 48%)',
    'hsl(48, 96%, 53%)',
  ];
  return colors[index % colors.length];
}

