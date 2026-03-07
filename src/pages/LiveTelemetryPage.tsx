import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GaugeChart } from '@/components/GaugeChart';
import { fetchLiveTelemetry } from '@/services/api';
import type { TelemetryPoint } from '@/services/api';
import { Play, Pause, Radio } from 'lucide-react';

const liveChartConfigs: Array<{
  key: keyof TelemetryPoint;
  label: string;
  color: string;
}> = [
  { key: 'speed', label: 'Speed (km/h)', color: 'hsl(199, 89%, 48%)' },
  { key: 'engineRpm', label: 'Engine RPM', color: 'hsl(24, 95%, 53%)' },
  { key: 'engineTemp', label: 'Engine Temperature (deg C)', color: 'hsl(0, 72%, 51%)' },
  { key: 'coolantTemp', label: 'Coolant Temperature (deg C)', color: 'hsl(262, 83%, 58%)' },
  { key: 'lubOilPressure', label: 'Lub Oil Pressure', color: 'hsl(48, 96%, 53%)' },
  { key: 'fuelPressure', label: 'Fuel Pressure', color: 'hsl(38, 92%, 50%)' },
  { key: 'batteryVoltage', label: 'Battery Voltage (V)', color: 'hsl(142, 71%, 45%)' },
  { key: 'vibrationLevel', label: 'Vibration Level', color: 'hsl(330, 81%, 60%)' },
];

const toDisplay = (value: number | null | undefined, digits = 2): string => {
  if (value === null || value === undefined) return '--';
  if (!Number.isFinite(value)) return '--';
  return value.toFixed(digits).replace(/\.00$/, '');
};

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
    engineRpm: 0,
    engineTemp: 0,
    coolantTemp: 0,
    lubOilPressure: 0,
    fuelPressure: 0,
    batteryVoltage: 0,
    fuelEfficiency: 0,
    vibration: 0,
    vibrationLevel: 0,
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
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6 justify-items-center">
            <GaugeChart 
              value={currentPoint.speed || 0} 
              max={180} 
              label="Speed" 
              unit="km/h" 
              size={140} 
              thresholds={{ warning: 120, critical: 150 }} 
            />
            <GaugeChart
              value={currentPoint.engineRpm || 0}
              max={7000}
              label="Engine RPM"
              unit="rpm"
              size={140}
              thresholds={{ warning: 4500, critical: 6000 }}
            />
            <GaugeChart 
              value={currentPoint.engineTemp || 0} 
              max={130} 
              label="Engine Temp" 
              unit="deg C" 
              size={140} 
              thresholds={{ warning: 95, critical: 110 }} 
            />
            <GaugeChart
              value={currentPoint.coolantTemp || 0}
              max={130}
              label="Coolant Temp"
              unit="deg C"
              size={140}
              thresholds={{ warning: 100, critical: 112 }}
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
              value={currentPoint.lubOilPressure || 0}
              max={10}
              label="Lub Oil P"
              unit="bar"
              size={140} 
              thresholds={{ warning: 2.0, critical: 1.0 }}
            />
          </div>
        </motion.div>

        <div className="glass-card p-4">
          <h3 className="text-sm font-heading uppercase tracking-wider text-muted-foreground mb-3">Latest Telemetry Packet</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-2 text-xs">
            <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Time</span><p className="text-sm text-foreground mt-1">{currentPoint.time}</p></div>
            <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Engine RPM</span><p className="text-sm text-foreground mt-1">{toDisplay(currentPoint.engineRpm ?? null, 0)}</p></div>
            <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Engine Temp</span><p className="text-sm text-foreground mt-1">{toDisplay(currentPoint.engineTemp ?? null, 1)} deg C</p></div>
            <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Coolant Temp</span><p className="text-sm text-foreground mt-1">{toDisplay(currentPoint.coolantTemp ?? null, 1)} deg C</p></div>
            <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Lub Oil Pressure</span><p className="text-sm text-foreground mt-1">{toDisplay(currentPoint.lubOilPressure ?? null, 2)} bar</p></div>
            <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Fuel Pressure</span><p className="text-sm text-foreground mt-1">{toDisplay(currentPoint.fuelPressure ?? null, 2)} psi</p></div>
            <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Battery Voltage</span><p className="text-sm text-foreground mt-1">{toDisplay(currentPoint.batteryVoltage ?? null, 2)} V</p></div>
            <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Speed</span><p className="text-sm text-foreground mt-1">{toDisplay(currentPoint.speed ?? null, 1)} km/h</p></div>
            <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Mileage</span><p className="text-sm text-foreground mt-1">{toDisplay(currentPoint.mileage ?? null, 1)} km</p></div>
            <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Fuel Efficiency</span><p className="text-sm text-foreground mt-1">{toDisplay(currentPoint.fuelEfficiency ?? null, 2)} km/L</p></div>
            <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Vibration</span><p className="text-sm text-foreground mt-1">{toDisplay(currentPoint.vibrationLevel ?? null, 2)}</p></div>
            <div className="rounded bg-secondary/40 px-3 py-2"><span className="text-muted-foreground">Error Codes</span><p className="text-sm text-foreground mt-1">{toDisplay(currentPoint.errorCodesCount ?? null, 0)}</p></div>
          </div>
        </div>

        {/* Live Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {liveChartConfigs.map((chart) => (
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
