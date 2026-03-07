import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Car, Mail, Phone, Plus, Shield, UserCheck, Users } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { toast } from '@/components/ui/use-toast';
import {
  assignDriverVehicle,
  fetchDrivers,
  fetchDriverStats,
  fetchVehicles,
  upsertDriverProfile,
} from '@/services/api';
import type { DriverProfile, DriverStats, Vehicle } from '@/services/api';

const safeLabel = (value?: string | null): string => value || '--';

const getVehicleIdentifier = (vehicle: Vehicle): string => vehicle.vehicleId || vehicle.id;

const getStatusClasses = (status: DriverProfile['status']): string => {
  if (status === 'AVAILABLE') return 'status-optimal';
  if (status === 'ON_TRIP') return 'status-anomaly';
  return 'status-warning';
};

export default function DriversPage() {
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const refreshDriverData = async () => {
    setLoading(true);
    try {
      const [statsData, listData, vehicleData] = await Promise.all([
        fetchDriverStats(),
        fetchDrivers(),
        fetchVehicles(),
      ]);

      setStats(statsData);
      setDrivers(listData);
      setVehicles(vehicleData);
    } catch (error) {
      console.error('Error fetching drivers data:', error);
      toast({
        title: 'Drivers fetch failed',
        description: 'Unable to load drivers dashboard data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshDriverData();
  }, []);

  const summary = useMemo(() => {
    const assigned = drivers.filter((driver) => Boolean(driver.assignedVehicle)).length;
    const utilization = drivers.length > 0 ? Math.round((assigned / drivers.length) * 100) : 0;

    return { assigned, utilization };
  }, [drivers]);

  const handleCreateDriverProfile = async () => {
    const defaultUserId = drivers[0]?.userId || '';
    const userId = window.prompt('Existing user ID for driver profile', defaultUserId)?.trim();
    if (!userId) return;

    const licenseNumber = window.prompt('License number', `DL-${Date.now().toString().slice(-6)}`)?.trim();
    if (!licenseNumber) return;

    const licenseType = window.prompt('License type', 'HGMV')?.trim() || 'HGMV';
    const yearsExperienceInput = window.prompt('Years of experience', '3')?.trim();
    const yearsExperience = yearsExperienceInput ? Number(yearsExperienceInput) : undefined;

    setActionLoading('create-driver');

    try {
      const created = await upsertDriverProfile({
        userId,
        licenseNumber,
        licenseType,
        yearsExperience: Number.isFinite(yearsExperience) ? yearsExperience : undefined,
      });

      if (!created) {
        toast({
          title: 'Create profile failed',
          description: 'Could not create profile. Ensure the user ID exists in backend users table.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Driver profile saved',
        description: `Profile for ${created.user?.name || created.userId} is now available.`,
      });

      await refreshDriverData();
    } catch (error) {
      console.error('Error creating driver profile:', error);
      toast({
        title: 'Create profile failed',
        description: 'Unexpected error while creating driver profile.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleAssignVehicle = async (driver: DriverProfile) => {
    if (vehicles.length === 0) {
      toast({
        title: 'No vehicles available',
        description: 'Add vehicles before assigning drivers.',
        variant: 'destructive',
      });
      return;
    }

    const suggestions = vehicles
      .slice(0, 5)
      .map((vehicle) => `${vehicle.plate || vehicle.vehicleId} (${vehicle.name})`)
      .join(', ');

    const defaultVehicle = getVehicleIdentifier(vehicles[0]);
    const vehicleId = window.prompt(
      `Vehicle ID for ${driver.user?.name || driver.userId} (examples: ${suggestions})`,
      defaultVehicle,
    )?.trim();

    if (!vehicleId) return;

    setActionLoading(driver.id);

    try {
      const updated = await assignDriverVehicle(driver.userId, vehicleId);

      if (!updated) {
        toast({
          title: 'Assign failed',
          description: `Could not assign vehicle ${vehicleId} to ${driver.user?.name || driver.userId}.`,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Vehicle assigned',
        description: `${updated.user?.name || updated.userId} assigned to ${updated.assignedVehicle?.vehicleNumber || vehicleId}.`,
      });

      await refreshDriverData();
    } catch (error) {
      console.error('Error assigning driver to vehicle:', error);
      toast({
        title: 'Assign failed',
        description: 'Unexpected error while assigning vehicle.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading drivers board...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Driver Management</h1>
            <p className="text-sm text-muted-foreground">Profiles, assignment state, and operational utilization</p>
          </div>
          <button
            type="button"
            onClick={() => void handleCreateDriverProfile()}
            disabled={actionLoading === 'create-driver'}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 text-sm"
          >
            <Plus className="h-4 w-4" />
            {actionLoading === 'create-driver' ? 'Saving...' : 'Add Driver Profile'}
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="glass-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Drivers</p>
                  <p className="text-2xl font-heading font-semibold text-foreground">{stats.total}</p>
                </div>
                <Users className="h-5 w-5 text-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Profiles in system</p>
            </div>

            <div className="glass-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Available Drivers</p>
                  <p className="text-2xl font-heading font-semibold text-optimal">{stats.available}</p>
                </div>
                <UserCheck className="h-5 w-5 text-optimal" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Ready for dispatch</p>
            </div>

            <div className="glass-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">On Trip</p>
                  <p className="text-2xl font-heading font-semibold text-anomaly">{stats.onTrip}</p>
                </div>
                <Car className="h-5 w-5 text-anomaly" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Currently in transit</p>
            </div>

            <div className="glass-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Avg Safety Score</p>
                  <p className="text-2xl font-heading font-semibold text-warning">{stats.avgSafetyScore}</p>
                </div>
                <Shield className="h-5 w-5 text-warning" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Fleet safety baseline</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Off Duty</p>
            <p className="text-2xl font-heading font-semibold text-warning">{stats?.offDuty ?? 0}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Assigned</p>
            <p className="text-2xl font-heading font-semibold text-anomaly">{summary.assigned}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Utilization</p>
            <p className="text-2xl font-heading font-semibold text-foreground">{summary.utilization}%</p>
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-heading font-semibold text-foreground">Driver Directory</h2>
            <span className="text-sm text-muted-foreground">{drivers.length} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="px-5 py-3 text-left text-xs uppercase tracking-wide text-muted-foreground">Driver</th>
                  <th className="px-5 py-3 text-left text-xs uppercase tracking-wide text-muted-foreground">Contact</th>
                  <th className="px-5 py-3 text-left text-xs uppercase tracking-wide text-muted-foreground">License</th>
                  <th className="px-5 py-3 text-left text-xs uppercase tracking-wide text-muted-foreground">Assigned Vehicle</th>
                  <th className="px-5 py-3 text-left text-xs uppercase tracking-wide text-muted-foreground">Status</th>
                  <th className="px-5 py-3 text-left text-xs uppercase tracking-wide text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">
                      No drivers found.
                    </td>
                  </tr>
                )}

                {drivers.map((driver) => (
                  <tr key={driver.id} className="border-b border-border/70 last:border-b-0 hover:bg-secondary/20">
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-medium text-foreground">{driver.user?.name || driver.userId}</p>
                        <p className="text-xs text-muted-foreground">User ID: {driver.userId}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {safeLabel(driver.user?.phone)}
                        </p>
                        <p className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {safeLabel(driver.user?.email)}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-foreground">{safeLabel(driver.licenseNumber)}</td>
                    <td className="px-5 py-4">
                      <p className="text-xs text-foreground">
                        {driver.assignedVehicle
                          ? driver.assignedVehicle.vehicleNumber || safeLabel(driver.assignedVehicle.model)
                          : '--'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {driver.assignedVehicle
                          ? `${safeLabel(driver.assignedVehicle.manufacturer)} ${safeLabel(driver.assignedVehicle.model)}`
                          : 'No active assignment'}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[11px] px-2 py-0.5 rounded border ${getStatusClasses(driver.status)}`}>
                        {driver.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleAssignVehicle(driver)}
                          disabled={actionLoading === driver.id}
                          className="px-3 py-1.5 rounded border border-border text-xs text-foreground hover:bg-secondary disabled:opacity-60"
                        >
                          {actionLoading === driver.id ? 'Assigning...' : 'Assign Vehicle'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            toast({
                              title: 'Driver profile',
                              description: `${driver.user?.name || driver.userId} | License: ${safeLabel(driver.licenseNumber)}`,
                            });
                          }}
                          className="px-3 py-1.5 rounded border border-border text-xs text-foreground hover:bg-secondary"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
