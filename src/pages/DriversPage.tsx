import { useState, useEffect } from "react";
import { User, MapPin, TrendingUp, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

interface DriverStats {
  total: number;
  available: number;
  onTrip: number;
  offDuty: number;
  avgSafetyScore: number;
}

interface Driver {
  id: string;
  userId: string;
  licenseExpiry: string | null;
  safetyScore: number;
  milesThisMonth: number;
  totalIncidents: number;
  onTimeRate: number;
  yearsExperience: number;
  status: string;
  user: {
    name: string;
    email: string;
    phone: string | null;
  };
  assignedVehicle: {
    vehicleNumber: string;
    manufacturer: string;
    model: string;
    status: string;
    fuelLevel: number | null;
  } | null;
}

export default function DriversPage() {
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDriverData();
  }, []);

  const fetchDriverData = async () => {
    try {
      setLoading(true);
      const [statsRes, driversRes] = await Promise.all([
        fetch(`${API_BASE}/drivers/stats`),
        fetch(`${API_BASE}/drivers`),
      ]);

      const statsData = await statsRes.json();
      const driversData = await driversRes.json();

      if (statsData.success) setStats(statsData.data);
      if (driversData.success) setDrivers(driversData.data);
    } catch (error) {
      console.error("Error fetching driver data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-100 text-green-800";
      case "ON_TRIP":
        return "bg-blue-100 text-blue-800";
      case "OFF_DUTY":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
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
        <h1 className="text-3xl font-bold">Driver Management</h1>
        <Button>Add Driver</Button>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Drivers</p>
                <h3 className="text-2xl font-bold">{stats.total}</h3>
              </div>
              <User className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Registered drivers</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Available</p>
                <h3 className="text-2xl font-bold text-green-600">
                  {stats.available}
                </h3>
              </div>
              <MapPin className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Ready for dispatch</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">On Trip</p>
                <h3 className="text-2xl font-bold text-blue-600">
                  {stats.onTrip}
                </h3>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Currently driving</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg Safety Score</p>
                <h3 className="text-2xl font-bold text-purple-600">
                  {stats.avgSafetyScore}
                </h3>
              </div>
              <Award className="h-8 w-8 text-purple-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Fleet average</p>
          </Card>
        </div>
      )}

      {/* Driver List */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Driver Roster</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drivers.map((driver) => (
            <Card key={driver.id} className="p-4 hover:shadow-md">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{driver.user.name}</h3>
                    <p className="text-xs text-gray-500">{driver.user.email}</p>
                  </div>
                </div>
                <Badge className={getStatusColor(driver.status)}>
                  {driver.status.replace("_", " ")}
                </Badge>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Safety Score:</span>
                  <span className={`font-bold ${getScoreColor(driver.safetyScore)}`}>
                    {driver.safetyScore}/100
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">On-Time Rate:</span>
                  <span className="font-medium">{driver.onTimeRate}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Miles (Month):</span>
                  <span className="font-medium">
                    {driver.milesThisMonth.toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Experience:</span>
                  <span className="font-medium">{driver.yearsExperience} years</span>
                </div>
              </div>

              {driver.assignedVehicle ? (
                <div className="bg-gray-50 p-2 rounded text-sm">
                  <p className="font-medium">
                    {driver.assignedVehicle.vehicleNumber}
                  </p>
                  <p className="text-xs text-gray-600">
                    {driver.assignedVehicle.manufacturer}{" "}
                    {driver.assignedVehicle.model}
                  </p>
                  {driver.assignedVehicle.fuelLevel !== null && (
                    <p className="text-xs text-gray-500 mt-1">
                      Fuel: {driver.assignedVehicle.fuelLevel}%
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-yellow-50 p-2 rounded text-sm text-center">
                  <p className="text-yellow-700">No vehicle assigned</p>
                </div>
              )}

              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  View Profile
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Assign Vehicle
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
