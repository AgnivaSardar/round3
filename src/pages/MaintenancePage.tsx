import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, DollarSign, TrendingDown, Wrench } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { toast } from '@/components/ui/use-toast';
import {
  createMaintenanceOrder,
  fetchMaintenanceOrders,
  fetchMaintenanceStats,
  fetchVehicles,
  updateMaintenanceOrderStatus,
} from '@/services/api';
import type { MaintenanceOrder, MaintenanceStats, Vehicle } from '@/services/api';

const statusColumns: Array<{ key: MaintenanceOrder['status']; label: string }> = [
  { key: 'SCHEDULED', label: 'Scheduled' },
  { key: 'IN_SERVICE', label: 'In Service' },
  { key: 'AWAITING_PARTS', label: 'Awaiting Parts' },
  { key: 'READY', label: 'Ready' },
  { key: 'COMPLETED', label: 'Completed' },
];

const statusFlow: Record<MaintenanceOrder['status'], MaintenanceOrder['status'] | null> = {
  SCHEDULED: 'IN_SERVICE',
  IN_SERVICE: 'AWAITING_PARTS',
  AWAITING_PARTS: 'READY',
  READY: 'COMPLETED',
  COMPLETED: null,
};

const getVehicleIdentifier = (vehicle: Vehicle): string => vehicle.vehicleId || vehicle.id;

const getPriorityClasses = (priority: string): string => {
  if (priority === 'HIGH') return 'status-critical';
  if (priority === 'MEDIUM') return 'status-warning';
  return 'status-anomaly';
};

const toDateLabel = (value?: string | null): string => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleDateString();
};

export default function MaintenancePage() {
  const [stats, setStats] = useState<MaintenanceStats | null>(null);
  const [orders, setOrders] = useState<MaintenanceOrder[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const refreshMaintenanceData = async () => {
    setLoading(true);
    try {
      const [statsData, orderData, vehicleData] = await Promise.all([
        fetchMaintenanceStats(),
        fetchMaintenanceOrders(),
        fetchVehicles(),
      ]);

      setStats(statsData);
      setOrders(orderData);
      setVehicles(vehicleData);
    } catch (error) {
      console.error('Error fetching maintenance data:', error);
      toast({
        title: 'Maintenance fetch failed',
        description: 'Unable to load maintenance dashboard data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshMaintenanceData();
  }, []);

  const orderSummary = useMemo(() => {
    const proactive = orders.filter((order) => order.orderType === 'PROACTIVE').length;
    const corrective = orders.filter((order) => order.orderType === 'CORRECTIVE').length;
    const completed = orders.filter((order) => order.status === 'COMPLETED').length;
    const completionRate = orders.length > 0 ? Math.round((completed / orders.length) * 100) : 0;

    return { proactive, corrective, completionRate };
  }, [orders]);

  const getOrdersByStatus = (status: MaintenanceOrder['status']) => {
    return orders.filter((order) => order.status === status);
  };

  const handleCreateOrder = async () => {
    if (vehicles.length === 0) {
      toast({
        title: 'No vehicles available',
        description: 'Create vehicles before adding maintenance orders.',
        variant: 'destructive',
      });
      return;
    }

    const defaultVehicleId = getVehicleIdentifier(vehicles[0]);
    const vehiclePrompt = vehicles
      .slice(0, 5)
      .map((vehicle) => `${vehicle.plate || vehicle.vehicleId} (${vehicle.name})`)
      .join(', ');

    const vehicleId = window.prompt(`Vehicle ID (examples: ${vehiclePrompt})`, defaultVehicleId)?.trim();
    if (!vehicleId) return;

    const title = window.prompt('Work order title', 'Routine Inspection')?.trim();
    if (!title) return;

    const description = window.prompt('Description', 'Preventive maintenance checklist')?.trim() || undefined;
    const priorityInput = window.prompt('Priority (LOW/MEDIUM/HIGH)', 'MEDIUM')?.trim().toUpperCase();
    const orderTypeInput = window.prompt('Order Type (PROACTIVE/CORRECTIVE)', 'PROACTIVE')?.trim().toUpperCase();

    const priority = priorityInput === 'HIGH' ? 'HIGH' : priorityInput === 'LOW' ? 'LOW' : 'MEDIUM';
    const orderType = orderTypeInput === 'CORRECTIVE' ? 'CORRECTIVE' : 'PROACTIVE';

    setActionLoading('create-order');

    try {
      const created = await createMaintenanceOrder({
        vehicleId,
        title,
        description,
        priority,
        orderType,
        scheduledDate: new Date().toISOString(),
      });

      if (!created) {
        toast({
          title: 'Create order failed',
          description: 'Could not create maintenance order. Check vehicle ID.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Order created',
        description: `${created.title} has been added to Scheduled.`,
      });

      await refreshMaintenanceData();
    } catch (error) {
      console.error('Error creating maintenance order:', error);
      toast({
        title: 'Create order failed',
        description: 'Unexpected error while creating order.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleAdvanceStatus = async (order: MaintenanceOrder) => {
    const nextStatus = statusFlow[order.status];
    if (!nextStatus) {
      toast({
        title: 'Already completed',
        description: `${order.title} is already in COMPLETED state.`,
      });
      return;
    }

    setActionLoading(order.id);

    try {
      const updated = await updateMaintenanceOrderStatus(order.id, nextStatus);

      if (!updated) {
        toast({
          title: 'Update failed',
          description: `Could not move ${order.title} to ${nextStatus}.`,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Status updated',
        description: `${order.title} moved to ${nextStatus.replace('_', ' ')}.`,
      });

      await refreshMaintenanceData();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: 'Update failed',
        description: 'Unexpected error while updating status.',
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
          <p className="text-muted-foreground">Loading maintenance board...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Maintenance Management</h1>
            <p className="text-sm text-muted-foreground">Kanban workflow for preventive and corrective orders</p>
          </div>
          <button
            type="button"
            onClick={() => void handleCreateOrder()}
            disabled={actionLoading === 'create-order'}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 text-sm"
          >
            {actionLoading === 'create-order' ? 'Creating...' : 'Create Work Order'}
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="glass-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Vehicles in Maintenance</p>
                  <p className="text-2xl font-heading font-semibold text-anomaly">{stats.vehiclesInMaintenance}</p>
                </div>
                <Wrench className="h-5 w-5 text-anomaly" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Currently under service</p>
            </div>

            <div className="glass-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Active Orders</p>
                  <p className="text-2xl font-heading font-semibold text-warning">{stats.activeOrders}</p>
                </div>
                <AlertCircle className="h-5 w-5 text-warning" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Overdue: {stats.overdueOrders}</p>
            </div>

            <div className="glass-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Avg Downtime</p>
                  <p className="text-2xl font-heading font-semibold text-success">{stats.avgDowntimeDays} days</p>
                </div>
                <TrendingDown className="h-5 w-5 text-success" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Per completed order</p>
            </div>

            <div className="glass-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Monthly Cost</p>
                  <p className="text-2xl font-heading font-semibold text-foreground">
                    ?{(stats.totalCostThisMonth / 1000).toFixed(1)}K
                  </p>
                </div>
                <DollarSign className="h-5 w-5 text-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Completed this month: {stats.completedThisMonth}</p>
            </div>
          </div>
        )}

        <div className="overflow-x-auto pb-2">
          <div className="flex gap-4 min-w-max">
            {statusColumns.map((column) => {
              const columnOrders = getOrdersByStatus(column.key);

              return (
                <div key={column.key} className="glass-card w-80 flex-shrink-0">
                  <div className="px-4 py-3 border-b border-border">
                    <h3 className="font-heading font-semibold text-foreground">
                      {column.label} <span className="text-muted-foreground">({columnOrders.length})</span>
                    </h3>
                  </div>

                  <div className="p-4 space-y-3 max-h-[620px] overflow-y-auto scrollbar-thin">
                    {columnOrders.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-3">No orders</p>
                    )}

                    {columnOrders.map((order) => (
                      <div key={order.id} className="border border-border rounded-md p-3 bg-card/70">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className={`text-[11px] px-2 py-0.5 rounded border ${getPriorityClasses(order.priority)}`}>
                            {order.priority}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded border border-border text-muted-foreground">
                            {order.orderType}
                          </span>
                        </div>

                        <h4 className="text-sm font-semibold text-foreground mb-1">{order.title}</h4>
                        <p className="text-xs text-muted-foreground">{order.vehicle.vehicleNumber || '--'}</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          {(order.vehicle.manufacturer || '--') + ' ' + (order.vehicle.model || '')}
                        </p>

                        {order.mechanicName && (
                          <p className="text-xs text-muted-foreground">Mechanic: {order.mechanicName}</p>
                        )}
                        <p className="text-xs text-muted-foreground">Scheduled: {toDateLabel(order.scheduledDate)}</p>
                        {order.estimatedCost !== null && order.estimatedCost !== undefined && (
                          <p className="text-xs text-foreground mt-1">Estimated: ?{Number(order.estimatedCost).toLocaleString()}</p>
                        )}

                        <div className="mt-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void handleAdvanceStatus(order)}
                            disabled={actionLoading === order.id}
                            className="px-3 py-1.5 rounded border border-border text-xs text-foreground hover:bg-secondary disabled:opacity-60"
                          >
                            {actionLoading === order.id
                              ? 'Updating...'
                              : statusFlow[order.status]
                              ? `Move to ${statusFlow[order.status]?.replace('_', ' ')}`
                              : 'Completed'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Proactive</p>
            <p className="text-2xl font-heading font-semibold text-foreground">{orderSummary.proactive}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Corrective</p>
            <p className="text-2xl font-heading font-semibold text-foreground">{orderSummary.corrective}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Completion Rate</p>
            <p className="text-2xl font-heading font-semibold text-foreground">{orderSummary.completionRate}%</p>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
