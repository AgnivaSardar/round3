import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GaugeChart } from '@/components/GaugeChart';
import { generateLiveTelemetry } from '@/data/mockData';
import type { TelemetryPoint } from '@/data/mockData';
import { Play, Pause, Radio } from 'lucide-react';

export default function LiveTelemetryPage() {
  const [data, setData] = useState<TelemetryPoint[]>([]);
  const [latest, setLatest] = useState(generateLiveTelemetry());
  const [running, setRunning] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        const point = generateLiveTelemetry();
        setLatest(point);
        setData(prev => [...prev.slice(-30), point]);
      }, 2000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

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
            <GaugeChart value={latest.speed} max={180} label="Speed" unit="km/h" size={140} thresholds={{ warning: 120, critical: 150 }} />
            <GaugeChart value={latest.engineTemp} max={130} label="Engine Temp" unit="°C" size={140} thresholds={{ warning: 95, critical: 110 }} />
            <GaugeChart value={latest.batteryVoltage} max={14.5} label="Battery" unit="V" size={140} thresholds={{ warning: 11.5, critical: 10.5 }} />
            <GaugeChart value={latest.fuelEfficiency} max={16} label="Fuel Eff." unit="km/L" size={140} />
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
                <LineChart data={data} className="text-muted-foreground">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 18%)" />
                  <XAxis dataKey="time" stroke="currentColor" fontSize={10} />
                  <YAxis stroke="currentColor" fontSize={10} />
                  <Tooltip contentStyle={{ background: 'hsl(220, 18%, 10%)', border: '1px solid hsl(220, 13%, 18%)', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: 'hsl(215, 15%, 55%)' }} itemStyle={{ color: chart.color }} />
                  <Line type="monotone" dataKey={chart.key} stroke={chart.color} strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
