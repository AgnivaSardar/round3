import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DashboardLayout } from '@/components/DashboardLayout';
import { HealthScore } from '@/components/HealthScore';
import { AlertCard } from '@/components/AlertCard';
import { fetchVehicle, fetchAlerts, fetchTelemetry } from '@/services/api';
import type { Vehicle, Alert, TelemetryPoint } from '@/services/api';
import { Car, User, Gauge, MapPin } from 'lucide-react';

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [vehicleAlerts, setVehicleAlerts] = useState<Alert[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVehicleData() {
      if (!id) return;
      
      setLoading(true);
      try {
        const [vehicleData, alertsData, telemetryData] = await Promise.all([
          fetchVehicle(id),
          fetchAlerts({ vehicleId: id }),
          fetchTelemetry(id, 24),
        ]);
        
        setVehicle(vehicleData || null);
        setVehicleAlerts(alertsData);
        setTelemetry(telemetryData);
      } catch (error) {
        console.error('Error loading vehicle data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadVehicleData();
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
          {[
            { key: 'engineTemp', label: 'Engine Temperature', color: 'hsl(24, 95%, 53%)', unit: '°C' },
            { key: 'batteryVoltage', label: 'Battery Voltage', color: 'hsl(199, 89%, 48%)', unit: 'V' },
            { key: 'speed', label: 'Speed', color: 'hsl(142, 71%, 45%)', unit: 'km/h' },
            { key: 'fuelEfficiency', label: 'Fuel Efficiency', color: 'hsl(48, 96%, 53%)', unit: 'km/L' },
          ].map(chart => (
            <div key={chart.key} className="glass-card p-4">
              <h3 className="text-sm font-heading uppercase tracking-wider text-muted-foreground mb-3">{chart.label}</h3>
              <ResponsiveContainer width="100%" height={180}>
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
      </motion.div>
    </DashboardLayout>
  );
}
