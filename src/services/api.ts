import { vehicles, alerts, faultLogs, generateTelemetryData, generateLiveTelemetry, insightsData } from '@/data/mockData';
import type { Vehicle, Alert, TelemetryPoint, FaultLog } from '@/data/mockData';

// Mock API layer - replace with real axios calls when backend is ready
// import axios from 'axios';
// const api = axios.create({ baseURL: '/api' });

export async function fetchVehicles(): Promise<Vehicle[]> {
  await delay(300);
  return vehicles;
}

export async function fetchVehicle(id: string): Promise<Vehicle | undefined> {
  await delay(200);
  return vehicles.find(v => v.id === id);
}

export async function fetchAlerts(): Promise<Alert[]> {
  await delay(300);
  return [...alerts];
}

export async function fetchTelemetry(vehicleId?: string): Promise<TelemetryPoint[]> {
  await delay(200);
  return generateTelemetryData();
}

export async function fetchFaultLogs(): Promise<FaultLog[]> {
  await delay(200);
  return faultLogs;
}

export async function fetchLiveTelemetry(): Promise<TelemetryPoint> {
  await delay(100);
  return generateLiveTelemetry();
}

export async function fetchInsights() {
  await delay(300);
  return insightsData;
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
