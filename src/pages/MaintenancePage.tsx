import { useState, useEffect } from "react";
import { Wrench, AlertCircle, TrendingDown, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

interface MaintenanceStats {
  vehiclesInMaintenance: number;
  activeOrders: number;
  completedThisMonth: number;
  totalCostThisMonth: number;
  overdueOrders: number;
  avgDowntimeDays: number;
}

interface MaintenanceOrder {
  id: string;
  vehicleId: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  orderType: string;
  mechanicName?: string;
  scheduledDate?: string;
  estimatedCost?: number;
  actualCost?: number;
  vehicle: {
    vehicleNumber: string;
    manufacturer: string;
    model: string;
  };
}

const statusColumns = [
  { key: "SCHEDULED", label: "Scheduled", color: "bg-gray-100" },
  { key: "IN_SERVICE", label: "In Service", color: "bg-blue-100" },
  { key: "AWAITING_PARTS", label: "Awaiting Parts", color: "bg-yellow-100" },
  { key: "READY", label: "Ready", color: "bg-green-100" },
  { key: "COMPLETED", label: "Completed", color: "bg-purple-100" },
];

export default function MaintenancePage() {
  const [stats, setStats] = useState<MaintenanceStats | null>(null);
  const [orders, setOrders] = useState<MaintenanceOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMaintenanceData();
  }, []);

  const fetchMaintenanceData = async () => {
    try {
      setLoading(true);
      const [statsRes, ordersRes] = await Promise.all([
        fetch(`${API_BASE}/maintenance/stats`),
        fetch(`${API_BASE}/maintenance`),
      ]);

      const statsData = await statsRes.json();
      const ordersData = await ordersRes.json();

      if (statsData.success) setStats(statsData.data);
      if (ordersData.success) setOrders(ordersData.data);
    } catch (error) {
      console.error("Error fetching maintenance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getOrdersByStatus = (status: string) => {
    return orders.filter((order) => order.status === status);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-800";
      case "MEDIUM":
        return "bg-orange-100 text-orange-800";
      case "LOW":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Maintenance Management</h1>
        <Button>Create Work Order</Button>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Vehicles in Maintenance</p>
                <h3 className="text-2xl font-bold">{stats.vehiclesInMaintenance}</h3>
              </div>
              <Wrench className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Currently under service</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Orders</p>
                <h3 className="text-2xl font-bold">{stats.activeOrders}</h3>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats.overdueOrders} overdue
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg Downtime</p>
                <h3 className="text-2xl font-bold">{stats.avgDowntimeDays} days</h3>
              </div>
              <TrendingDown className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Per maintenance event</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Cost This Month</p>
                <h3 className="text-2xl font-bold">
                  ₹{(stats.totalCostThisMonth / 1000).toFixed(1)}K
                </h3>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats.completedThisMonth} completed
            </p>
          </Card>
        </div>
      )}

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {statusColumns.map((column) => {
            const columnOrders = getOrdersByStatus(column.key);
            return (
              <Card
                key={column.key}
                className={`${column.color} w-80 flex-shrink-0`}
              >
                <div className="p-4 border-b bg-white">
                  <h3 className="font-bold">
                    {column.label}
                    <span className="ml-2 text-gray-500">
                      ({columnOrders.length})
                    </span>
                  </h3>
                </div>
                <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                  {columnOrders.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">
                      No orders
                    </p>
                  ) : (
                    columnOrders.map((order) => (
                      <Card key={order.id} className="p-4 bg-white hover:shadow-md cursor-pointer">
                        <div className="flex items-start justify-between mb-2">
                          <Badge className={getPriorityColor(order.priority)}>
                            {order.priority}
                          </Badge>
                          <Badge variant="outline">{order.orderType}</Badge>
                        </div>
                        <h4 className="font-semibold mb-1">{order.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {order.vehicle.vehicleNumber}
                        </p>
                        <p className="text-xs text-gray-500">
                          {order.vehicle.manufacturer} {order.vehicle.model}
                        </p>
                        {order.mechanicName && (
                          <p className="text-xs text-gray-500 mt-2">
                            Mechanic: {order.mechanicName}
                          </p>
                        )}
                        {order.scheduledDate && (
                          <p className="text-xs text-gray-500">
                            Scheduled:{" "}
                            {new Date(order.scheduledDate).toLocaleDateString()}
                          </p>
                        )}
                        {order.estimatedCost && (
                          <p className="text-xs text-gray-700 font-medium mt-2">
                            Est: ₹{order.estimatedCost.toLocaleString()}
                          </p>
                        )}
                        {order.actualCost && (
                          <p className="text-xs text-gray-700 font-medium">
                            Actual: ₹{order.actualCost.toLocaleString()}
                          </p>
                        )}
                      </Card>
                    ))
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Summary Section */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Maintenance Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded">
            <p className="text-sm text-gray-600">Proactive Maintenance</p>
            <p className="text-2xl font-bold">
              {orders.filter((o) => o.orderType === "PROACTIVE").length}
            </p>
          </div>
          <div className="p-4 bg-orange-50 rounded">
            <p className="text-sm text-gray-600">Corrective Repairs</p>
            <p className="text-2xl font-bold">
              {orders.filter((o) => o.orderType === "CORRECTIVE").length}
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded">
            <p className="text-sm text-gray-600">Completion Rate</p>
            <p className="text-2xl font-bold">
              {orders.length > 0
                ? Math.round(
                    (orders.filter((o) => o.status === "COMPLETED").length /
                      orders.length) *
                      100
                  )
                : 0}
              %
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
