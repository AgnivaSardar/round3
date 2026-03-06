import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, AlertTriangle, Car, Activity, BarChart3 } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/alerts', label: 'Alerts', icon: AlertTriangle },
  { to: '/vehicles', label: 'Vehicles', icon: Car },
  { to: '/telemetry', label: 'Telemetry', icon: Activity },
  { to: '/insights', label: 'Insights', icon: BarChart3 },
];

export function TopNav() {
  const location = useLocation();

  return (
    <header className="h-14 border-b border-border bg-card/60 backdrop-blur-md flex items-center px-6 sticky top-0 z-50">
      <div className="flex items-center gap-2 mr-8">
        <Activity className="h-6 w-6 text-primary" />
        <span className="font-display text-lg tracking-wider text-primary">
          VEHIXA
        </span>
      </div>

      <nav className="flex items-center gap-1">
        {navItems.map(item => {
          const isActive = location.pathname.startsWith(item.to);
          return (
            <RouterNavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary/10 text-primary neon-text'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span className="hidden md:inline">{item.label}</span>
            </RouterNavLink>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-3">
        <ThemeToggle />
        <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
        <span className="text-xs text-muted-foreground">System Online</span>
      </div>
    </header>
  );
}
