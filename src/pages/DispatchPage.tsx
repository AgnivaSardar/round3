import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock3, PackageCheck, Truck } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  approveDispatchRequest,
  completeDispatchTrip,
  createDispatchRequest,
  fetchActiveDispatchTrips,
  fetchDispatchHistory,
  fetchDispatchStats,
  fetchPendingDispatchRequests,
  rejectDispatchRequest,
} from '@/services/api';
import type { DispatchRequest, DispatchStats } from '@/services/api';

const toDateTimeLabel = (value?: string): string => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleString();
};

const getPriorityClasses = (priority: string): string => {
  if (priority === 'HIGH') return 'status-critical';
  return 'bg-secondary text-secondary-foreground border-border';
};

const getStatusClasses = (status: string): string => {
  if (status === 'ACTIVE') return 'status-anomaly';
  if (status === 'COMPLETED') return 'status-healthy';
  if (status === 'REJECTED') return 'status-critical';
  if (status === 'PENDING') return 'status-warning';
  return 'bg-secondary text-secondary-foreground border-border';
};

export default function DispatchPage() {
  const [stats, setStats] = useState<DispatchStats | null>(null);
  const [pendingRequests, setPendingRequests] = useState<DispatchRequest[]>([]);
  const [activeTrips, setActiveTrips] = useState<DispatchRequest[]>([]);
  const [history, setHistory] = useState<DispatchRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const refreshDispatchData = async () => {
    setLoading(true);
    try {
      const [statsData, pendingData, activeData, historyData] = await Promise.all([
        fetchDispatchStats(),
        fetchPendingDispatchRequests(),
        fetchActiveDispatchTrips(),
        fetchDispatchHistory(),
      ]);

      setStats(statsData);
      setPendingRequests(pendingData);
      setActiveTrips(activeData);
      setHistory(historyData);
    } catch (error) {
      console.error('Error fetching dispatch data:', error);
      toast({
        title: 'Dispatch fetch failed',
        description: 'Unable to load dispatch dashboard data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshDispatchData();
  }, []);

  const handleCreateDispatch = async () => {
    const origin = window.prompt('Origin location', 'Mumbai Warehouse')?.trim();
    if (!origin) return;

    const destination = window.prompt('Destination location', 'Pune Distribution Center')?.trim();
    if (!destination) return;

    const cargoType = window.prompt('Cargo type', 'Electronics')?.trim() || undefined;
    const cargoWeight = window.prompt('Cargo weight', '2 Tonnes')?.trim() || undefined;
    const priorityInput = window.prompt('Priority (STANDARD/HIGH)', 'STANDARD')?.trim().toUpperCase();
    const priority = priorityInput === 'HIGH' ? 'HIGH' : 'STANDARD';

    setActionLoading('create-dispatch');

    try {
      const created = await createDispatchRequest({
        origin,
        destination,
        cargoType,
        cargoWeight,
        priority,
      });

      if (!created) {
        toast({
          title: 'Create dispatch failed',
          description: 'Could not create dispatch request.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Dispatch created',
        description: `${created.ticketNumber} is now pending approval.`,
      });

      await refreshDispatchData();
    } catch (error) {
      console.error('Error creating dispatch request:', error);
      toast({
        title: 'Create dispatch failed',
        description: 'Unexpected error while creating dispatch request.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (request: DispatchRequest) => {
    setActionLoading(request.id);
    try {
      const approved = await approveDispatchRequest(request.id, {
        driverId: request.driver?.userId,
        vehicleId: request.vehicle?.vehicleId,
      });

      if (!approved) {
        toast({
          title: 'Approval failed',
          description: `Could not approve ${request.ticketNumber}.`,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Dispatch approved',
        description: `${request.ticketNumber} moved to ACTIVE.`,
      });

      await refreshDispatchData();
    } catch (error) {
      console.error('Error approving dispatch:', error);
      toast({
        title: 'Approval failed',
        description: 'Unexpected error while approving request.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (request: DispatchRequest) => {
    if (!window.confirm(`Reject dispatch request ${request.ticketNumber}?`)) return;

    setActionLoading(request.id);
    try {
      const ok = await rejectDispatchRequest(request.id);
      if (!ok) {
        toast({
          title: 'Reject failed',
          description: `Could not reject ${request.ticketNumber}.`,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Dispatch rejected',
        description: `${request.ticketNumber} has been rejected.`,
      });

      await refreshDispatchData();
    } catch (error) {
      console.error('Error rejecting dispatch:', error);
      toast({
        title: 'Reject failed',
        description: 'Unexpected error while rejecting request.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteTrip = async (request: DispatchRequest) => {
    if (!window.confirm(`Mark ${request.ticketNumber} as completed?`)) return;

    setActionLoading(request.id);
    try {
      const completed = await completeDispatchTrip(request.id);

      if (!completed) {
        toast({
          title: 'Completion failed',
          description: `Could not complete ${request.ticketNumber}.`,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Trip completed',
        description: `${request.ticketNumber} moved to COMPLETED.`,
      });

      await refreshDispatchData();
    } catch (error) {
      console.error('Error completing trip:', error);
      toast({
        title: 'Completion failed',
        description: 'Unexpected error while completing trip.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetails = (request: DispatchRequest) => {
    const details = [
      `${request.ticketNumber}`,
      `${request.origin} -> ${request.destination}`,
      `Priority: ${request.priority}`,
      `Status: ${request.status}`,
      request.driver?.name ? `Driver: ${request.driver.name}` : 'Driver: Unassigned',
      request.vehicle?.vehicleNumber ? `Vehicle: ${request.vehicle.vehicleNumber}` : 'Vehicle: Unassigned',
      `Progress: ${request.progressPct}%`,
    ].join(' | ');

    toast({
      title: 'Dispatch details',
      description: details,
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading dispatch board...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Dispatch Management</h1>
            <p className="text-sm text-muted-foreground">Request lifecycle from pending to completion</p>
          </div>
          <button
            type="button"
            onClick={() => void handleCreateDispatch()}
            disabled={actionLoading === 'create-dispatch'}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 text-sm"
          >
            {actionLoading === 'create-dispatch' ? 'Creating...' : 'Create Dispatch'}
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="glass-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Pending</p>
                  <p className="text-2xl font-heading font-semibold text-warning">{stats.pending}</p>
                </div>
                <Clock3 className="h-5 w-5 text-warning" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Awaiting decisions</p>
            </div>

            <div className="glass-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Active Trips</p>
                  <p className="text-2xl font-heading font-semibold text-anomaly">{stats.active}</p>
                </div>
                <Truck className="h-5 w-5 text-anomaly" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Currently moving</p>
            </div>

            <div className="glass-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">High Priority</p>
                  <p className="text-2xl font-heading font-semibold text-destructive">{stats.highPriority}</p>
                </div>
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Critical attention</p>
            </div>

            <div className="glass-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Completed</p>
                  <p className="text-2xl font-heading font-semibold text-success">{stats.completed}</p>
                </div>
                <PackageCheck className="h-5 w-5 text-success" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Delivered successfully</p>
            </div>
          </div>
        )}

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-xl">
            <TabsTrigger value="pending">Pending ({pendingRequests.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({activeTrips.length})</TabsTrigger>
            <TabsTrigger value="history">History ({history.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            <div className="glass-card p-5 space-y-3">
              {pendingRequests.length === 0 && (
                <div className="text-sm text-muted-foreground">No pending dispatch requests.</div>
              )}

              {pendingRequests.map((request) => (
                <div key={request.id} className="border border-border rounded-md p-4 bg-card/60">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">{request.ticketNumber}</span>
                        <span className={`text-[11px] px-2 py-0.5 rounded border ${getPriorityClasses(request.priority)}`}>
                          {request.priority}
                        </span>
                        <span className={`text-[11px] px-2 py-0.5 rounded border ${getStatusClasses(request.status)}`}>
                          {request.status}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">
                        {request.origin}{' -> '}{request.destination}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {request.cargoType || 'General Cargo'} • {request.cargoWeight || '--'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Created: {toDateTimeLabel(request.createdAt)}</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleApprove(request)}
                        disabled={actionLoading === request.id}
                        className="px-3 py-1.5 rounded border border-border text-xs text-foreground hover:bg-secondary disabled:opacity-60"
                      >
                        {actionLoading === request.id ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleReject(request)}
                        disabled={actionLoading === request.id}
                        className="px-3 py-1.5 rounded bg-destructive text-destructive-foreground text-xs hover:bg-destructive/90 disabled:opacity-60"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="active" className="mt-4">
            <div className="glass-card p-5 space-y-3">
              {activeTrips.length === 0 && (
                <div className="text-sm text-muted-foreground">No active trips right now.</div>
              )}

              {activeTrips.map((trip) => (
                <div key={trip.id} className="border border-border rounded-md p-4 bg-card/60">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">{trip.ticketNumber}</span>
                        <span className={`text-[11px] px-2 py-0.5 rounded border ${getPriorityClasses(trip.priority)}`}>
                          {trip.priority}
                        </span>
                        <span className={`text-[11px] px-2 py-0.5 rounded border ${getStatusClasses(trip.status)}`}>
                          {trip.status}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{trip.origin}{' -> '}{trip.destination}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Driver: {trip.driver?.name || 'Unassigned'} • Vehicle: {trip.vehicle?.vehicleNumber || 'Unassigned'}
                      </p>
                    </div>

                    <div className="text-xs text-muted-foreground">Progress: {trip.progressPct}%</div>
                  </div>

                  <div className="w-full bg-secondary rounded-full h-2 mb-3">
                    <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${trip.progressPct}%` }} />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleViewDetails(trip)}
                      className="px-3 py-1.5 rounded border border-border text-xs text-foreground hover:bg-secondary"
                    >
                      View Details
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleCompleteTrip(trip)}
                      disabled={actionLoading === trip.id}
                      className="px-3 py-1.5 rounded bg-primary text-primary-foreground text-xs hover:bg-primary/90 disabled:opacity-60"
                    >
                      {actionLoading === trip.id ? 'Completing...' : 'Mark Complete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <div className="glass-card p-5">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-border text-muted-foreground">
                      <th className="py-2 pr-3">Ticket</th>
                      <th className="py-2 pr-3">Route</th>
                      <th className="py-2 pr-3">Driver</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((trip) => (
                      <tr key={trip.id} className="border-b border-border/60 last:border-b-0">
                        <td className="py-3 pr-3 font-medium text-foreground">{trip.ticketNumber}</td>
                        <td className="py-3 pr-3 text-foreground">{trip.origin}{' -> '}{trip.destination}</td>
                        <td className="py-3 pr-3 text-foreground">{trip.driver?.name || 'Unassigned'}</td>
                        <td className="py-3 pr-3">
                          <span className={`text-[11px] px-2 py-0.5 rounded border ${getStatusClasses(trip.status)}`}>
                            {trip.status}
                          </span>
                        </td>
                        <td className="py-3 text-foreground">{toDateTimeLabel(trip.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
}
