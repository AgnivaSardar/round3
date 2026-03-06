export interface Vehicle {
  id: string;
  name: string;
  plate: string;
  type: string;
  healthScore: number;
  status: 'healthy' | 'warning' | 'critical';
  lastUpdate: string;
  driver: string;
  mileage: number;
}

export interface Alert {
  id: string;
  vehicleId: string;
  vehicleName: string;
  type: string;
  severity: 'critical' | 'warning' | 'anomaly';
  message: string;
  suggestedAction: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface TelemetryPoint {
  time: string;
  engineTemp: number;
  batteryVoltage: number;
  speed: number;
  fuelEfficiency: number;
  vibration: number;
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

export const vehicles: Vehicle[] = [
  { id: 'V001', name: 'Fleet Truck Alpha', plate: 'TX-4821', type: 'Heavy Truck', healthScore: 92, status: 'healthy', lastUpdate: '2 min ago', driver: 'James Wilson', mileage: 124500 },
  { id: 'V002', name: 'Fleet Van Beta', plate: 'CA-7733', type: 'Delivery Van', healthScore: 67, status: 'warning', lastUpdate: '5 min ago', driver: 'Sarah Chen', mileage: 89200 },
  { id: 'V003', name: 'Sedan Gamma', plate: 'NY-1156', type: 'Sedan', healthScore: 34, status: 'critical', lastUpdate: '1 min ago', driver: 'Mike Torres', mileage: 203100 },
  { id: 'V004', name: 'SUV Delta', plate: 'FL-9902', type: 'SUV', healthScore: 88, status: 'healthy', lastUpdate: '8 min ago', driver: 'Lisa Park', mileage: 56700 },
  { id: 'V005', name: 'Truck Epsilon', plate: 'OH-3347', type: 'Heavy Truck', healthScore: 71, status: 'warning', lastUpdate: '3 min ago', driver: 'David Brown', mileage: 178900 },
  { id: 'V006', name: 'Van Zeta', plate: 'WA-5518', type: 'Delivery Van', healthScore: 95, status: 'healthy', lastUpdate: '1 min ago', driver: 'Emma Davis', mileage: 42300 },
  { id: 'V007', name: 'Sedan Eta', plate: 'IL-6641', type: 'Sedan', healthScore: 45, status: 'critical', lastUpdate: '12 min ago', driver: 'Carlos Rivera', mileage: 156800 },
  { id: 'V008', name: 'Truck Theta', plate: 'PA-2289', type: 'Heavy Truck', healthScore: 83, status: 'healthy', lastUpdate: '4 min ago', driver: 'Anna Kim', mileage: 98400 },
];

export const alerts: Alert[] = [
  { id: 'A001', vehicleId: 'V003', vehicleName: 'Sedan Gamma', type: 'Engine Overheating', severity: 'critical', message: 'Engine temperature exceeded 110°C threshold', suggestedAction: 'Immediately pull over and shut down engine. Schedule emergency maintenance.', timestamp: '2026-03-06T14:32:00Z', acknowledged: false },
  { id: 'A002', vehicleId: 'V002', vehicleName: 'Fleet Van Beta', type: 'Battery Voltage Drop', severity: 'warning', message: 'Battery voltage dropped below 11.5V', suggestedAction: 'Schedule battery inspection within 24 hours.', timestamp: '2026-03-06T14:28:00Z', acknowledged: false },
  { id: 'A003', vehicleId: 'V005', vehicleName: 'Truck Epsilon', type: 'Fuel Efficiency Drop', severity: 'warning', message: 'Fuel efficiency decreased by 18% over last 50km', suggestedAction: 'Check fuel injectors and air filter. Schedule maintenance.', timestamp: '2026-03-06T14:15:00Z', acknowledged: true },
  { id: 'A004', vehicleId: 'V007', vehicleName: 'Sedan Eta', type: 'Sudden Braking Anomaly', severity: 'critical', message: 'Detected 3 sudden braking events in 10 minutes', suggestedAction: 'Check brake system and driver behavior. Immediate inspection recommended.', timestamp: '2026-03-06T14:10:00Z', acknowledged: false },
  { id: 'A005', vehicleId: 'V003', vehicleName: 'Sedan Gamma', type: 'Sensor Malfunction', severity: 'anomaly', message: 'Vibration sensor reporting inconsistent readings', suggestedAction: 'Recalibrate vibration sensor during next service.', timestamp: '2026-03-06T13:55:00Z', acknowledged: true },
  { id: 'A006', vehicleId: 'V002', vehicleName: 'Fleet Van Beta', type: 'Engine Overheating', severity: 'warning', message: 'Engine temperature approaching upper threshold at 98°C', suggestedAction: 'Monitor closely. Reduce speed if temperature continues rising.', timestamp: '2026-03-06T13:40:00Z', acknowledged: false },
  { id: 'A007', vehicleId: 'V007', vehicleName: 'Sedan Eta', type: 'Battery Voltage Drop', severity: 'critical', message: 'Battery voltage critically low at 10.2V', suggestedAction: 'Vehicle may stall. Pull over safely and request roadside assistance.', timestamp: '2026-03-06T13:30:00Z', acknowledged: false },
  { id: 'A008', vehicleId: 'V005', vehicleName: 'Truck Epsilon', type: 'Sensor Malfunction', severity: 'anomaly', message: 'Speed sensor intermittent signal loss', suggestedAction: 'Schedule sensor replacement at next maintenance window.', timestamp: '2026-03-06T13:20:00Z', acknowledged: true },
];

export const faultLogs: FaultLog[] = [
  { id: 'F001', vehicleId: 'V003', vehicleName: 'Sedan Gamma', fault: 'Engine Overheating', severity: 'critical', timestamp: '2026-03-06T14:32:00Z', resolved: false },
  { id: 'F002', vehicleId: 'V002', vehicleName: 'Fleet Van Beta', fault: 'Low Battery', severity: 'warning', timestamp: '2026-03-06T14:28:00Z', resolved: false },
  { id: 'F003', vehicleId: 'V007', vehicleName: 'Sedan Eta', fault: 'Brake System Alert', severity: 'critical', timestamp: '2026-03-06T14:10:00Z', resolved: false },
  { id: 'F004', vehicleId: 'V005', vehicleName: 'Truck Epsilon', fault: 'Fuel Injector Issue', severity: 'warning', timestamp: '2026-03-06T13:50:00Z', resolved: true },
  { id: 'F005', vehicleId: 'V001', vehicleName: 'Fleet Truck Alpha', fault: 'Tire Pressure Low', severity: 'anomaly', timestamp: '2026-03-06T12:15:00Z', resolved: true },
];

export function generateTelemetryData(points: number = 24): TelemetryPoint[] {
  const data: TelemetryPoint[] = [];
  for (let i = 0; i < points; i++) {
    const hour = i;
    data.push({
      time: `${hour.toString().padStart(2, '0')}:00`,
      engineTemp: 75 + Math.random() * 30 + (i > 18 ? 15 : 0),
      batteryVoltage: 12.2 + Math.random() * 1.5 - (i > 20 ? 1.5 : 0),
      speed: 40 + Math.random() * 80,
      fuelEfficiency: 8 + Math.random() * 6 - (i > 16 ? 2 : 0),
      vibration: 0.2 + Math.random() * 0.8,
    });
  }
  return data;
}

export function generateLiveTelemetry(): TelemetryPoint {
  const now = new Date();
  return {
    time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`,
    engineTemp: 80 + Math.random() * 25,
    batteryVoltage: 11.5 + Math.random() * 2,
    speed: 30 + Math.random() * 90,
    fuelEfficiency: 6 + Math.random() * 8,
    vibration: 0.1 + Math.random() * 1,
  };
}

export const insightsData = {
  commonFaults: [
    { name: 'Engine Overheating', count: 23, fill: 'hsl(0, 72%, 51%)' },
    { name: 'Battery Issues', count: 18, fill: 'hsl(24, 95%, 53%)' },
    { name: 'Brake Anomaly', count: 12, fill: 'hsl(38, 92%, 50%)' },
    { name: 'Fuel Efficiency', count: 15, fill: 'hsl(199, 89%, 48%)' },
    { name: 'Sensor Malfunction', count: 8, fill: 'hsl(48, 96%, 53%)' },
  ],
  severityBreakdown: [
    { name: 'Critical', value: 28, fill: 'hsl(0, 72%, 51%)' },
    { name: 'Warning', value: 42, fill: 'hsl(24, 95%, 53%)' },
    { name: 'Anomaly', value: 30, fill: 'hsl(48, 96%, 53%)' },
  ],
  topAlertVehicles: [
    { vehicle: 'Sedan Gamma', alerts: 14 },
    { vehicle: 'Sedan Eta', alerts: 11 },
    { vehicle: 'Truck Epsilon', alerts: 8 },
    { vehicle: 'Fleet Van Beta', alerts: 7 },
    { vehicle: 'Fleet Truck Alpha', alerts: 3 },
  ],
};
