import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/DashboardLayout';
import { HealthScore } from '@/components/HealthScore';
import { fetchVehicles } from '@/services/api';
import type { Vehicle } from '@/services/api';
import { Car, User, Gauge } from 'lucide-react';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVehicles() {
      setLoading(true);
      try {
        const data = await fetchVehicles();
        setVehicles(data);
      } catch (error) {
        console.error('Error loading vehicles:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadVehicles();
  }, []);

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
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Fleet Vehicles</h1>
          <p className="text-sm text-muted-foreground">{vehicles.length} vehicles in fleet</p>
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
                <Link to={`/vehicles/${v.id}`} className="block glass-card-hover p-5">
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
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
