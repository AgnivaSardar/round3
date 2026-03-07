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
  const rawPayload =
    point.rawPayload && typeof point.rawPayload === 'object'
      ? (point.rawPayload as Record<string, unknown>)
      : null;

  const getRawValue = (...keys: string[]): unknown => {
    if (!rawPayload) return undefined;

    for (const key of keys) {
      const value = rawPayload[key];
      if (value !== undefined && value !== null && value !== '') return value;
    }

    return undefined;
  };

  const getRawNumber = (...keys: string[]): number | null => {
    const value = getRawValue(...keys);
    if (value === undefined || value === null || value === '') return null;

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const speedValue =
    point.speed !== undefined && point.speed !== null
      ? Number(point.speed)
      : getRawNumber('speed', 'vehicleSpeed', 'vehicle_speed') !== null
      ? Number(getRawNumber('speed', 'vehicleSpeed', 'vehicle_speed'))
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
    engineLoad: point.engineLoad ?? getRawNumber('engineLoad', 'engine_load') ?? null,
    throttlePosition:
      point.throttlePosition ??
      getRawNumber('throttlePosition', 'throttle_position') ??
      null,
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

    ambientTemperature:
      point.ambientTemperature ?? getRawNumber('ambientTemperature', 'ambient_temperature') ?? null,
    errorCodesCount: point.errorCodesCount ?? null,
    activeFaultCodes:
      point.activeFaultCodes ??
      getRawValue('activeFaultCodes', 'active_fault_codes') ??
      null,

    batteryStateOfCharge:
      point.batteryStateOfCharge ??
      getRawNumber('batteryStateOfCharge', 'battery_state_of_charge', 'soc') ??
      null,
    batteryTemp: point.batteryTemp ?? getRawNumber('batteryTemp', 'battery_temp') ?? null,
    motorTemp: point.motorTemp ?? getRawNumber('motorTemp', 'motor_temp') ?? null,
    inverterTemp: point.inverterTemp ?? getRawNumber('inverterTemp', 'inverter_temp') ?? null,

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

// Fleet Management Types

export interface InsuranceStats {
  totalVehicles: number;
  vehiclesWithInsurance: number;
  coveragePercentage: number;
  expiringWithin7Days: number;
  expiredPolicies: number;
  uninsuredCount: number;
  totalExpiredOrUninsured?: number;
}

export interface InsurancePolicy {
  id: string;
  vehicleId: string;
  provider: string;
  policyNumber: string;
  startDate?: string | null;
  expiryDate: string;
  documentUrl?: string | null;
  daysRemaining?: number;
  urgencyLevel?: 'expired' | 'critical' | 'warning';
  isExpired?: boolean;
  vehicle?: {
    vehicleId?: string;
    vehicleNumber?: string;
    manufacturer?: string;
    model?: string;
    year?: number;
    status?: string;
  };
}

export interface DispatchStats {
  pending: number;
  active: number;
  highPriority: number;
  completed: number;
  rejected?: number;
  total?: number;
}

export interface DispatchRequest {
  id: string;
  ticketNumber: string;
  origin: string;
  destination: string;
  cargoType?: string | null;
  cargoWeight?: string | null;
  priority: 'STANDARD' | 'HIGH';
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'REJECTED';
  progressPct: number;
  createdAt: string;
  updatedAt?: string;
  driverId?: string | null;
  vehicleId?: string | null;
  driver?: {
    userId?: string;
    name?: string;
    email?: string;
    phone?: string;
  } | null;
  vehicle?: {
    vehicleId?: string;
    vehicleNumber?: string;
    manufacturer?: string;
    model?: string;
    year?: number;
    fuelLevel?: number | null;
    currentLocation?: string | null;
  } | null;
  driverLocations?: Array<{
    latitude: number;
    longitude: number;
    speed?: number | null;
    timestamp: string;
  }>;
}

export interface MaintenanceStats {
  vehiclesInMaintenance: number;
  activeOrders: number;
  completedThisMonth: number;
  totalCostThisMonth: number;
  overdueOrders: number;
  highPriorityPending?: number;
  avgDowntimeDays: number;
}

export interface MaintenanceOrder {
  id: string;
  vehicleId: string;
  title: string;
  description?: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'SCHEDULED' | 'IN_SERVICE' | 'AWAITING_PARTS' | 'READY' | 'COMPLETED';
  orderType: 'CORRECTIVE' | 'PROACTIVE';
  mechanicName?: string | null;
  scheduledDate?: string | null;
  completedDate?: string | null;
  estimatedCost?: number | null;
  actualCost?: number | null;
  vehicle: {
    vehicleId?: string;
    vehicleNumber?: string;
    manufacturer?: string;
    model?: string;
    year?: number;
    status?: string;
  };
}

export interface DriverStats {
  total: number;
  available: number;
  onTrip: number;
  offDuty: number;
  avgSafetyScore: number;
}

export interface DriverProfile {
  id: string;
  userId: string;
  licenseNumber?: string;
  licenseType?: string;
  safetyScore: number;
  milesThisMonth: number;
  totalIncidents: number;
  onTimeRate: number;
  yearsExperience: number;
  status: 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY';
  licenseExpiry?: string | null;
  user: {
    userId?: string;
    name?: string;
    email?: string;
    phone?: string | null;
    fleetRole?: string;
    isActive?: boolean;
    isApproved?: boolean;
  };
  assignedVehicle?: {
    vehicleId?: string;
    vehicleNumber?: string;
    manufacturer?: string;
    model?: string;
    status?: string;
    fuelLevel?: number | null;
  } | null;
}

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
  message?: string;
}

const getEnvelopeData = <T>(responseData: ApiEnvelope<T> | T | undefined, fallback: T): T => {
  if (!responseData) return fallback;
  if (typeof responseData === 'object' && responseData !== null && 'data' in responseData) {
    const envelope = responseData as ApiEnvelope<T>;
    return envelope.data ?? fallback;
  }
  return responseData as T;
};

// Fleet Management API

export async function fetchInsuranceStats(): Promise<InsuranceStats | null> {
  try {
    const response = await api.get('/insurance/stats');
    return getEnvelopeData<InsuranceStats | null>(response.data, null);
  } catch (error) {
    console.error('Error fetching insurance stats:', error);
    return null;
  }
}

export async function fetchUrgentPolicies(): Promise<InsurancePolicy[]> {
  try {
    const response = await api.get('/insurance/urgent');
    return getEnvelopeData<InsurancePolicy[]>(response.data, []);
  } catch (error) {
    console.error('Error fetching urgent insurance policies:', error);
    return [];
  }
}

export async function fetchUpcomingRenewals(): Promise<InsurancePolicy[]> {
  try {
    const response = await api.get('/insurance/upcoming');
    return getEnvelopeData<InsurancePolicy[]>(response.data, []);
  } catch (error) {
    console.error('Error fetching upcoming renewals:', error);
    return [];
  }
}

export async function addInsurancePolicy(payload: {
  vehicleId: string;
  provider: string;
  policyNumber: string;
  startDate?: string;
  expiryDate: string;
}): Promise<InsurancePolicy | null> {
  try {
    const response = await api.post('/insurance', payload);
    return getEnvelopeData<InsurancePolicy | null>(response.data, null);
  } catch (error) {
    console.error('Error adding insurance policy:', error);
    return null;
  }
}

export async function renewInsurancePolicy(
  policyId: string,
  payload: { startDate?: string; expiryDate: string; provider?: string; policyNumber?: string }
): Promise<InsurancePolicy | null> {
  try {
    const response = await api.put(`/insurance/${policyId}`, payload);
    return getEnvelopeData<InsurancePolicy | null>(response.data, null);
  } catch (error) {
    console.error(`Error renewing insurance policy ${policyId}:`, error);
    return null;
  }
}

export async function fetchDispatchStats(): Promise<DispatchStats | null> {
  try {
    const response = await api.get('/dispatch/stats');
    return getEnvelopeData<DispatchStats | null>(response.data, null);
  } catch (error) {
    console.error('Error fetching dispatch stats:', error);
    return null;
  }
}

export async function fetchPendingDispatchRequests(): Promise<DispatchRequest[]> {
  try {
    const response = await api.get('/dispatch/pending');
    return getEnvelopeData<DispatchRequest[]>(response.data, []);
  } catch (error) {
    console.error('Error fetching pending dispatch requests:', error);
    return [];
  }
}

export async function fetchActiveDispatchTrips(): Promise<DispatchRequest[]> {
  try {
    const response = await api.get('/dispatch/active');
    return getEnvelopeData<DispatchRequest[]>(response.data, []);
  } catch (error) {
    console.error('Error fetching active dispatch trips:', error);
    return [];
  }
}

export async function fetchDispatchHistory(): Promise<DispatchRequest[]> {
  try {
    const response = await api.get('/dispatch/history');
    return getEnvelopeData<DispatchRequest[]>(response.data, []);
  } catch (error) {
    console.error('Error fetching dispatch history:', error);
    return [];
  }
}

export async function createDispatchRequest(payload: {
  origin: string;
  destination: string;
  cargoType?: string;
  cargoWeight?: string;
  priority?: 'STANDARD' | 'HIGH';
  driverId?: string;
  vehicleId?: string;
}): Promise<DispatchRequest | null> {
  try {
    const response = await api.post('/dispatch', payload);
    return getEnvelopeData<DispatchRequest | null>(response.data, null);
  } catch (error) {
    console.error('Error creating dispatch request:', error);
    return null;
  }
}

export async function approveDispatchRequest(
  requestId: string,
  payload: { driverId?: string; vehicleId?: string } = {}
): Promise<DispatchRequest | null> {
  try {
    const response = await api.put(`/dispatch/${requestId}/approve`, payload);
    return getEnvelopeData<DispatchRequest | null>(response.data, null);
  } catch (error) {
    console.error(`Error approving dispatch request ${requestId}:`, error);
    return null;
  }
}

export async function rejectDispatchRequest(requestId: string): Promise<boolean> {
  try {
    await api.delete(`/dispatch/${requestId}/reject`);
    return true;
  } catch (error) {
    console.error(`Error rejecting dispatch request ${requestId}:`, error);
    return false;
  }
}

export async function completeDispatchTrip(requestId: string): Promise<DispatchRequest | null> {
  try {
    const response = await api.put(`/dispatch/${requestId}/complete`);
    return getEnvelopeData<DispatchRequest | null>(response.data, null);
  } catch (error) {
    console.error(`Error completing dispatch trip ${requestId}:`, error);
    return null;
  }
}

export async function fetchMaintenanceStats(): Promise<MaintenanceStats | null> {
  try {
    const response = await api.get('/maintenance/stats');
    return getEnvelopeData<MaintenanceStats | null>(response.data, null);
  } catch (error) {
    console.error('Error fetching maintenance stats:', error);
    return null;
  }
}

export async function fetchMaintenanceOrders(): Promise<MaintenanceOrder[]> {
  try {
    const response = await api.get('/maintenance');
    return getEnvelopeData<MaintenanceOrder[]>(response.data, []);
  } catch (error) {
    console.error('Error fetching maintenance orders:', error);
    return [];
  }
}

export async function createMaintenanceOrder(payload: {
  vehicleId: string;
  title: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  orderType?: 'CORRECTIVE' | 'PROACTIVE';
  mechanicName?: string;
  scheduledDate?: string;
  estimatedCost?: number;
}): Promise<MaintenanceOrder | null> {
  try {
    const response = await api.post('/maintenance', payload);
    return getEnvelopeData<MaintenanceOrder | null>(response.data, null);
  } catch (error) {
    console.error('Error creating maintenance order:', error);
    return null;
  }
}

export async function updateMaintenanceOrderStatus(
  orderId: string,
  status: MaintenanceOrder['status']
): Promise<MaintenanceOrder | null> {
  try {
    const response = await api.patch(`/maintenance/${orderId}/status`, { status });
    return getEnvelopeData<MaintenanceOrder | null>(response.data, null);
  } catch (error) {
    console.error(`Error updating maintenance order ${orderId}:`, error);
    return null;
  }
}

export async function fetchDriverStats(): Promise<DriverStats | null> {
  try {
    const response = await api.get('/drivers/stats');
    return getEnvelopeData<DriverStats | null>(response.data, null);
  } catch (error) {
    console.error('Error fetching driver stats:', error);
    return null;
  }
}

export async function fetchDrivers(): Promise<DriverProfile[]> {
  try {
    const response = await api.get('/drivers');
    return getEnvelopeData<DriverProfile[]>(response.data, []);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return [];
  }
}

export async function assignDriverVehicle(
  userId: string,
  vehicleId: string | null
): Promise<DriverProfile | null> {
  try {
    const response = await api.put(`/drivers/${userId}/vehicle`, { vehicleId });
    return getEnvelopeData<DriverProfile | null>(response.data, null);
  } catch (error) {
    console.error(`Error assigning vehicle for driver ${userId}:`, error);
    return null;
  }
}

export async function upsertDriverProfile(payload: {
  userId: string;
  licenseNumber?: string;
  licenseType?: string;
  yearsExperience?: number;
  safetyScore?: number;
  onTimeRate?: number;
}): Promise<DriverProfile | null> {
  try {
    const response = await api.post('/drivers', payload);
    return getEnvelopeData<DriverProfile | null>(response.data, null);
  } catch (error) {
    console.error('Error creating/updating driver profile:', error);
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

