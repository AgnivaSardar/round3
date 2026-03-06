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
  latestTelemetry?: any;
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
  time: string;
  engineTemp?: number;
  batteryVoltage?: number;
  speed?: number;
  fuelEfficiency?: number;
  vibration?: number;
  vibrationLevel?: number;
  engineRpm?: number;
  rpm?: number;
  coolantTemp?: number;
  lubOilPressure?: number;
  recordedAt?: string;
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

// API Functions

export async function fetchVehicles(): Promise<Vehicle[]> {
  try {
    const response = await api.get('/vehicles');
    return response.data.vehicles || [];
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return [];
  }
}

export async function fetchVehicle(id: string): Promise<Vehicle | undefined> {
  try {
    const response = await api.get(`/vehicles/${id}`);
    return response.data.vehicle;
  } catch (error) {
    console.error(`Error fetching vehicle ${id}:`, error);
    return undefined;
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
    
    // Transform to match chart format
    return telemetryData.map((point: any, index: number) => {
      const date = new Date(point.recordedAt);
      return {
        time: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`,
        engineTemp: point.engineTemp || point.lubOilTemp || 0,
        batteryVoltage: point.batteryVoltage || 0,
        speed: point.rpm ? point.rpm / 100 : 0, // Approximate speed from RPM
        fuelEfficiency: point.fuelEfficiency || 0,
        vibration: point.vibrationLevel || 0,
        vibrationLevel: point.vibrationLevel || 0,
        engineRpm: point.engineRpm || point.rpm || 0,
        rpm: point.engineRpm || point.rpm || 0,
        coolantTemp: point.coolantTemp || 0,
        lubOilPressure: point.lubOilPressure || 0,
        recordedAt: point.recordedAt,
      };
    });
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
    
    const date = new Date(point.recordedAt);
    return {
      time: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`,
      engineTemp: point.engineTemp || point.lubOilTemp || 0,
      batteryVoltage: point.batteryVoltage || 0,
      speed: point.rpm ? point.rpm / 100 : 0,
      fuelEfficiency: point.fuelEfficiency || 0,
      vibration: point.vibrationLevel || 0,
      vibrationLevel: point.vibrationLevel || 0,
      engineRpm: point.engineRpm || point.rpm || 0,
      rpm: point.engineRpm || point.rpm || 0,
      coolantTemp: point.coolantTemp || 0,
      lubOilPressure: point.lubOilPressure || 0,
      recordedAt: point.recordedAt,
    };
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

