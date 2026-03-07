import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CalendarClock, CheckCircle2, ShieldCheck } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { toast } from '@/components/ui/use-toast';
import {
  addInsurancePolicy,
  fetchInsuranceStats,
  fetchUpcomingRenewals,
  fetchUrgentPolicies,
  fetchVehicles,
  renewInsurancePolicy,
} from '@/services/api';
import type { InsurancePolicy, InsuranceStats, Vehicle } from '@/services/api';

const getVehicleIdentifier = (vehicle: Vehicle): string => vehicle.vehicleId || vehicle.id;

const toDateLabel = (dateValue?: string | null): string => {
  if (!dateValue) return '--';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleDateString();
};

const getUrgencyClasses = (urgencyLevel?: string): string => {
  if (urgencyLevel === 'expired') return 'status-critical';
  if (urgencyLevel === 'critical') return 'status-warning';
  if (urgencyLevel === 'warning') return 'status-anomaly';
  return 'bg-secondary text-secondary-foreground border-border';
};

export default function InsurancePage() {
  const [stats, setStats] = useState<InsuranceStats | null>(null);
  const [urgentPolicies, setUrgentPolicies] = useState<InsurancePolicy[]>([]);
  const [upcomingRenewals, setUpcomingRenewals] = useState<InsurancePolicy[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const refreshInsuranceData = async () => {
    setLoading(true);
    try {
      const [statsData, urgentData, upcomingData, vehiclesData] = await Promise.all([
        fetchInsuranceStats(),
        fetchUrgentPolicies(),
        fetchUpcomingRenewals(),
        fetchVehicles(),
      ]);

      setStats(statsData);
      setUrgentPolicies(urgentData);
      setUpcomingRenewals(upcomingData);
      setVehicles(vehiclesData);
    } catch (error) {
      console.error('Error fetching insurance data:', error);
      toast({
        title: 'Insurance fetch failed',
        description: 'Unable to load insurance data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshInsuranceData();
  }, []);

  const vehicleHints = useMemo(() => {
    return vehicles
      .slice(0, 5)
      .map((vehicle) => `${vehicle.plate || vehicle.vehicleId} (${vehicle.name})`)
      .join(', ');
  }, [vehicles]);

  const handleAddPolicy = async () => {
    if (vehicles.length === 0) {
      toast({
        title: 'No vehicles available',
        description: 'Create a vehicle first, then add an insurance policy.',
        variant: 'destructive',
      });
      return;
    }

    const defaultVehicleId = getVehicleIdentifier(vehicles[0]);
    const vehicleId = window.prompt(
      `Vehicle ID (examples: ${vehicleHints || defaultVehicleId})`,
      defaultVehicleId
    )?.trim();

    if (!vehicleId) return;

    const provider = window.prompt('Insurance provider', 'HDFC ERGO')?.trim();
    if (!provider) return;

    const policyNumber = window.prompt('Policy number', `AUTO-${Date.now()}`)?.trim();
    if (!policyNumber) return;

    const expiryDate = window.prompt('Expiry date (YYYY-MM-DD)', '2027-12-31')?.trim();
    if (!expiryDate) return;

    setActionLoading('add-policy');

    try {
      const created = await addInsurancePolicy({
        vehicleId,
        provider,
        policyNumber,
        expiryDate,
        startDate: new Date().toISOString().slice(0, 10),
      });

      if (!created) {
        toast({
          title: 'Add policy failed',
          description: 'Check vehicle ID and retry.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Policy added',
        description: `${created.policyNumber} has been added successfully.`,
      });

      await refreshInsuranceData();
    } catch (error) {
      console.error('Error adding policy:', error);
      toast({
        title: 'Add policy failed',
        description: 'Unexpected error while adding policy.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRenewPolicy = async (policy: InsurancePolicy) => {
    const existingExpiry = new Date(policy.expiryDate);
    const baseDate = Number.isNaN(existingExpiry.getTime()) ? new Date() : existingExpiry;
    const renewedDate = new Date(baseDate);
    renewedDate.setFullYear(baseDate.getFullYear() + 1);

    const nextExpiry = window
      .prompt('Renew until date (YYYY-MM-DD)', renewedDate.toISOString().slice(0, 10))
      ?.trim();

    if (!nextExpiry) return;

    setActionLoading(policy.id);

    try {
      const renewed = await renewInsurancePolicy(policy.id, { expiryDate: nextExpiry });

      if (!renewed) {
        toast({
          title: 'Renewal failed',
          description: `Could not renew ${policy.policyNumber}.`,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Policy renewed',
        description: `${policy.policyNumber} renewed to ${toDateLabel(nextExpiry)}.`,
      });

      await refreshInsuranceData();
    } catch (error) {
      console.error('Error renewing policy:', error);
      toast({
        title: 'Renewal failed',
        description: 'Unexpected error while renewing policy.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewPolicy = (policy: InsurancePolicy) => {
    const vehicleLabel = `${policy.vehicle?.manufacturer || 'Unknown'} ${policy.vehicle?.model || ''}`.trim();
    const urgency = policy.urgencyLevel || 'active';

    toast({
      title: `${policy.policyNumber}`,
      description: `${vehicleLabel} • ${policy.provider} • Expires ${toDateLabel(policy.expiryDate)} • ${urgency.toUpperCase()}`,
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading insurance dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Insurance Management</h1>
            <p className="text-sm text-muted-foreground">Coverage, renewals, and urgent policy actions</p>
          </div>
          <button
            type="button"
            onClick={() => void handleAddPolicy()}
            disabled={actionLoading === 'add-policy'}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 text-sm"
          >
            {actionLoading === 'add-policy' ? 'Adding...' : 'Add Policy'}
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="glass-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Coverage</p>
                  <p className="text-2xl font-heading font-semibold text-foreground">{stats.coveragePercentage}%</p>
                </div>
                <ShieldCheck className="h-5 w-5 text-success" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.vehiclesWithInsurance} / {stats.totalVehicles} vehicles insured
              </p>
            </div>

            <div className="glass-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Expiring 7 Days</p>
                  <p className="text-2xl font-heading font-semibold text-warning">{stats.expiringWithin7Days}</p>
                </div>
                <CalendarClock className="h-5 w-5 text-warning" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Immediate renewal queue</p>
            </div>

            <div className="glass-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Expired</p>
                  <p className="text-2xl font-heading font-semibold text-destructive">{stats.expiredPolicies}</p>
                </div>
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Critical compliance risk</p>
            </div>

            <div className="glass-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Uninsured</p>
                  <p className="text-2xl font-heading font-semibold text-destructive">{stats.uninsuredCount}</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Vehicles with no policy</p>
            </div>
          </div>
        )}

        <div className="glass-card p-5">
          <h2 className="text-lg font-heading font-semibold text-foreground mb-3">
            Urgent Actions ({urgentPolicies.length})
          </h2>

          <div className="space-y-3">
            {urgentPolicies.length === 0 && (
              <div className="text-sm text-muted-foreground">No urgent policies. Great job keeping renewals on track.</div>
            )}

            {urgentPolicies.map((policy) => (
              <div key={policy.id} className="border border-border rounded-md px-4 py-3 bg-card/60">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-foreground">
                        {policy.vehicle?.manufacturer} {policy.vehicle?.model}
                      </span>
                      <span className={`text-[11px] px-2 py-0.5 rounded border ${getUrgencyClasses(policy.urgencyLevel)}`}>
                        {policy.urgencyLevel === 'expired'
                          ? 'EXPIRED'
                          : `${policy.daysRemaining ?? '--'} days left`}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {policy.vehicle?.vehicleNumber} • {policy.provider} • {policy.policyNumber}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Expiry: {toDateLabel(policy.expiryDate)}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleViewPolicy(policy)}
                      className="px-3 py-1.5 rounded border border-border text-xs text-foreground hover:bg-secondary"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleRenewPolicy(policy)}
                      disabled={actionLoading === policy.id}
                      className="px-3 py-1.5 rounded bg-primary text-primary-foreground text-xs hover:bg-primary/90 disabled:opacity-60"
                    >
                      {actionLoading === policy.id ? 'Renewing...' : 'Renew'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-5">
          <h2 className="text-lg font-heading font-semibold text-foreground mb-3">
            Upcoming Renewals (30 Days) - {upcomingRenewals.length}
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border text-muted-foreground">
                  <th className="py-2 pr-3">Vehicle</th>
                  <th className="py-2 pr-3">Provider</th>
                  <th className="py-2 pr-3">Policy</th>
                  <th className="py-2 pr-3">Expiry</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {upcomingRenewals.map((policy) => (
                  <tr key={policy.id} className="border-b border-border/60 last:border-b-0">
                    <td className="py-3 pr-3 text-foreground">
                      {(policy.vehicle?.manufacturer || '--') + ' ' + (policy.vehicle?.model || '')}
                      <div className="text-xs text-muted-foreground">{policy.vehicle?.vehicleNumber || '--'}</div>
                    </td>
                    <td className="py-3 pr-3 text-foreground">{policy.provider}</td>
                    <td className="py-3 pr-3 text-foreground">{policy.policyNumber}</td>
                    <td className="py-3 pr-3 text-foreground">{toDateLabel(policy.expiryDate)}</td>
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() => handleViewPolicy(policy)}
                        className="px-3 py-1.5 rounded border border-border text-xs text-foreground hover:bg-secondary"
                      >
                        View
                      </button>
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
