import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GaugeChart } from '@/components/GaugeChart';
import { fetchLiveTelemetry } from '@/services/api';
import type { TelemetryPoint } from '@/services/api';
import { Play, Pause, Radio } from 'lucide-react';

export default function LiveTelemetryPage() {
  const [data, setData] = useState<TelemetryPoint[]>([]);
  const [latest, setLatest] = useState<TelemetryPoint | null>(null);
  const [running, setRunning] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const point = await fetchLiveTelemetry();
        if (point) {
          setLatest(point);
          setData(prev => [...prev.slice(-30), point]);
        }
      } catch (error) {
        console.error('Error fetching live telemetry:', error);
      }
    }

    // Initial fetch
    fetchData();

    if (running) {
      intervalRef.current = setInterval(() => {
        fetchData();
      }, 3000); // Poll every 3 seconds
    }
    
    return () => { 
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [running]);

  const defaultPoint: TelemetryPoint = {
    time: '00:00:00',
    speed: 0,
    engineTemp: 0,
    batteryVoltage: 0,
    fuelEfficiency: 0,
    vibration: 0,
  };

  const currentPoint = latest || defaultPoint;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
              <Radio className="h-5 w-5 text-primary animate-pulse" />
              Live Telemetry
            </h1>
            <p className="text-sm text-muted-foreground">Real-time streaming vehicle data</p>
          </div>
          <button
            onClick={() => setRunning(!running)}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors text-sm font-medium"
          >
            {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {running ? 'Pause' : 'Resume'}
          </button>
        </div>

        {/* Gauges */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 justify-items-center">
            <GaugeChart 
              value={currentPoint.speed || 0} 
              max={180} 
              label="Speed" 
              unit="km/h" 
              size={140} 
              thresholds={{ warning: 120, critical: 150 }} 
            />
            <GaugeChart 
              value={currentPoint.engineTemp || 0} 
              max={130} 
              label="Engine Temp" 
              unit="°C" 
              size={140} 
              thresholds={{ warning: 95, critical: 110 }} 
            />
            <GaugeChart 
              value={currentPoint.batteryVoltage || 0} 
              max={14.5} 
              label="Battery" 
              unit="V" 
              size={140} 
              thresholds={{ warning: 11.5, critical: 10.5 }} 
            />
            <GaugeChart 
              value={currentPoint.fuelEfficiency || 0} 
              max={16} 
              label="Fuel Eff." 
              unit="km/L" 
              size={140} 
            />
          </div>
        </motion.div>

        {/* Live Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[
            { key: 'speed', label: 'Speed (km/h)', color: 'hsl(199, 89%, 48%)' },
            { key: 'engineTemp', label: 'Engine Temperature (°C)', color: 'hsl(24, 95%, 53%)' },
            { key: 'batteryVoltage', label: 'Battery Voltage (V)', color: 'hsl(142, 71%, 45%)' },
            { key: 'vibration', label: 'Vibration Level', color: 'hsl(48, 96%, 53%)' },
          ].map(chart => (
            <div key={chart.key} className="glass-card p-4">
              <h3 className="text-sm font-heading uppercase tracking-wider text-muted-foreground mb-3">{chart.label}</h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 18%)" />
                  <XAxis dataKey="time" stroke="hsl(215, 15%, 55%)" fontSize={10} />
                  <YAxis stroke="hsl(215, 15%, 55%)" fontSize={10} />
                  <Tooltip contentStyle={{ background: 'hsl(220, 18%, 10%)', border: '1px solid hsl(220, 13%, 18%)', borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey={chart.key} stroke={chart.color} strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>

        {data.length === 0 && (
          <div className="glass-card p-8 text-center">
            <p className="text-muted-foreground">No live telemetry data available. Make sure the backend is running and receiving data.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
