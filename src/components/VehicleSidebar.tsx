import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchVehicles } from '@/services/api';
import type { Vehicle } from '@/services/api';

export function VehicleSidebar() {
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const location = useLocation();

  useEffect(() => {
    async function loadVehicles() {
      try {
        const data = await fetchVehicles();
        setVehicles(data);
      } catch (error) {
        console.error('Error loading vehicles:', error);
      }
    }
    
    loadVehicles();
  }, []);

  const filtered = vehicles.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.plate.toLowerCase().includes(search.toLowerCase()) ||
    v.id.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-success';
      case 'warning': return 'bg-warning';
      case 'critical': return 'bg-destructive';
      default: return 'bg-muted-foreground';
    }
  };

  if (collapsed) {
    return (
      <aside className="w-12 border-r border-border bg-sidebar flex flex-col items-center py-3 shrink-0">
        <button onClick={() => setCollapsed(false)} className="p-1.5 rounded hover:bg-sidebar-accent text-sidebar-foreground mb-4">
          <ChevronRight className="h-4 w-4" />
        </button>
        <div className="flex flex-col gap-2">
          {vehicles.slice(0, 6).map(v => (
            <Link key={v.id} to={`/vehicles/${v.id}`} title={v.name}>
              <div className={`h-3 w-3 rounded-full ${statusColor(v.status)} ${v.status === 'critical' ? 'pulse-critical' : ''}`} />
            </Link>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-60 border-r border-border bg-sidebar flex flex-col shrink-0 overflow-hidden">
      <div className="p-3 border-b border-sidebar-border flex items-center justify-between">
        <span className="text-xs font-heading font-semibold text-sidebar-foreground uppercase tracking-wider">Vehicles</span>
        <button onClick={() => setCollapsed(true)} className="p-1 rounded hover:bg-sidebar-accent text-sidebar-foreground">
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      <div className="p-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            placeholder="Search vehicles..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-sidebar-accent text-sm rounded-md pl-7 pr-3 py-1.5 text-sidebar-foreground placeholder:text-muted-foreground border border-sidebar-border focus:outline-none focus:border-primary/50"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filtered.map(v => {
          const isActive = location.pathname === `/vehicles/${v.id}`;
          return (
            <Link
              key={v.id}
              to={`/vehicles/${v.id}`}
              className={`block px-3 py-2.5 border-b border-sidebar-border/50 transition-colors ${
                isActive ? 'bg-sidebar-accent border-l-2 border-l-primary' : 'hover:bg-sidebar-accent/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${statusColor(v.status)} ${v.status === 'critical' ? 'pulse-critical' : ''}`} />
                <span className="text-sm font-medium text-sidebar-foreground truncate">{v.name}</span>
              </div>
              <div className="flex items-center justify-between mt-1 ml-4">
                <span className="text-xs text-muted-foreground">{v.plate}</span>
                <span className={`text-xs font-semibold ${
                  v.healthScore >= 80 ? 'text-success' : v.healthScore >= 50 ? 'text-warning' : 'text-destructive'
                }`}>{v.healthScore}%</span>
              </div>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
