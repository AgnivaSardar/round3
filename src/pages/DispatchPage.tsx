import { useState, useEffect } from "react";
import { Truck, PackageCheck, Clock, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

interface DispatchStats {
  pending: number;
  active: number;
  highPriority: number;
  completed: number;
}

interface DispatchRequest {
  id: string;
  ticketNumber: string;
  origin: string;
  destination: string;
  cargoType?: string;
  cargoWeight?: string;
  priority: string;
  status: string;
  progressPct: number;
  createdAt: string;
  driver?: {
    name: string;
    email: string;
  };
  vehicle?: {
    vehicleNumber: string;
    manufacturer: string;
    model: string;
  };
}

export default function DispatchPage() {
  const [stats, setStats] = useState<DispatchStats | null>(null);
  const [pendingRequests, setPendingRequests] = useState<DispatchRequest[]>([]);
  const [activeTrips, setActiveTrips] = useState<DispatchRequest[]>([]);
  const [history, setHistory] = useState<DispatchRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDispatchData();
  }, []);

  const fetchDispatchData = async () => {
    try {
      setLoading(true);
      const [statsRes, pendingRes, activeRes, historyRes] = await Promise.all([
        fetch(`${API_BASE}/dispatch/stats`),
        fetch(`${API_BASE}/dispatch/pending`),
        fetch(`${API_BASE}/dispatch/active`),
        fetch(`${API_BASE}/dispatch/history`),
      ]);

      const statsData = await statsRes.json();
      const pendingData = await pendingRes.json();
      const activeData = await activeRes.json();
      const historyData = await historyRes.json();

      if (statsData.success) setStats(statsData.data);
      if (pendingData.success) setPendingRequests(pendingData.data);
      if (activeData.success) setActiveTrips(activeData.data);
      if (historyData.success) setHistory(historyData.data);
    } catch (error) {
      console.error("Error fetching dispatch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    return priority === "HIGH"
      ? "bg-red-100 text-red-800 border-red-300"
      : "bg-gray-100 text-gray-800 border-gray-300";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "ACTIVE":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
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
        <h1 className="text-3xl font-bold">Dispatch Management</h1>
        <Button>Create Dispatch</Button>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <h3 className="text-2xl font-bold">{stats.pending}</h3>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Awaiting approval</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Trips</p>
                <h3 className="text-2xl font-bold text-blue-600">{stats.active}</h3>
              </div>
              <Truck className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Currently on road</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">High Priority</p>
                <h3 className="text-2xl font-bold text-red-600">
                  {stats.highPriority}
                </h3>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Urgent trips</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <h3 className="text-2xl font-bold text-green-600">
                  {stats.completed}
                </h3>
              </div>
              <PackageCheck className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Total completed</p>
          </Card>
        </div>
      )}

      {/* Tabs for different views */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="active">Active ({activeTrips.length})</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Pending Requests</h2>
            <div className="space-y-3">
              {pendingRequests.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No pending dispatch requests
                </p>
              ) : (
                pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{request.ticketNumber}</h3>
                        <Badge className={getPriorityColor(request.priority)}>
                          {request.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {request.origin} → {request.destination}
                      </p>
                      {request.cargoType && (
                        <p className="text-xs text-gray-500 mt-1">
                          {request.cargoType} • {request.cargoWeight}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Created: {new Date(request.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Approve
                      </Button>
                      <Button variant="destructive" size="sm">
                        Reject
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="mt-4">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Active Trips</h2>
            <div className="space-y-3">
              {activeTrips.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No active trips at the moment
                </p>
              ) : (
                activeTrips.map((trip) => (
                  <div
                    key={trip.id}
                    className="p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{trip.ticketNumber}</h3>
                        <Badge className={getPriorityColor(trip.priority)}>
                          {trip.priority}
                        </Badge>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">
                        {trip.progressPct}% Complete
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {trip.origin} → {trip.destination}
                    </p>
                    {trip.driver && (
                      <p className="text-sm text-gray-600">
                        Driver: {trip.driver.name}
                      </p>
                    )}
                    {trip.vehicle && (
                      <p className="text-sm text-gray-600">
                        Vehicle: {trip.vehicle.vehicleNumber} (
                        {trip.vehicle.manufacturer} {trip.vehicle.model})
                      </p>
                    )}
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${trip.progressPct}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      <Button size="sm">Mark Complete</Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Trip History</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Ticket#
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Route
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Driver
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {history.map((trip) => (
                    <tr key={trip.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">
                        {trip.ticketNumber}
                      </td>
                      <td className="px-4 py-3">
                        {trip.origin} → {trip.destination}
                      </td>
                      <td className="px-4 py-3">
                        {trip.driver?.name || "Unassigned"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getStatusColor(trip.status)}>
                          {trip.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {new Date(trip.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
