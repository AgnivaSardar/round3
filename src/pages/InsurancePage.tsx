import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

interface InsuranceStats {
  totalVehicles: number;
  vehiclesWithInsurance: number;
  coveragePercentage: number;
  expiringWithin7Days: number;
  expiredPolicies: number;
  uninsuredCount: number;
}

interface InsurancePolicy {
  id: string;
  vehicleId: string;
  provider: string;
  policyNumber: string;
  expiryDate: string;
  daysRemaining?: number;
  urgencyLevel?: string;
  vehicle: {
    vehicleNumber: string;
    manufacturer: string;
    model: string;
    year: number;
  };
}

export default function InsurancePage() {
  const [stats, setStats] = useState<InsuranceStats | null>(null);
  const [urgentPolicies, setUrgentPolicies] = useState<InsurancePolicy[]>([]);
  const [upcomingRenewals, setUpcomingRenewals] = useState<InsurancePolicy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsuranceData();
  }, []);

  const fetchInsuranceData = async () => {
    try {
      setLoading(true);
      const [statsRes, urgentRes, upcomingRes] = await Promise.all([
        fetch(`${API_BASE}/insurance/stats`),
        fetch(`${API_BASE}/insurance/urgent`),
        fetch(`${API_BASE}/insurance/upcoming`),
      ]);

      const statsData = await statsRes.json();
      const urgentData = await urgentRes.json();
      const upcomingData = await upcomingRes.json();

      if (statsData.success) setStats(statsData.data);
      if (urgentData.success) setUrgentPolicies(urgentData.data);
      if (upcomingData.success) setUpcomingRenewals(upcomingData.data);
    } catch (error) {
      console.error("Error fetching insurance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgencyLevel?: string) => {
    switch (urgencyLevel) {
      case "expired":
        return "bg-red-500 text-white";
      case "critical":
        return "bg-orange-500 text-white";
      case "warning":
        return "bg-yellow-500 text-black";
      default:
        return "bg-gray-500 text-white";
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
        <h1 className="text-3xl font-bold">Insurance Management</h1>
        <Button>Add Policy</Button>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Coverage</p>
                <h3 className="text-2xl font-bold">{stats.coveragePercentage}%</h3>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats.vehiclesWithInsurance} of {stats.totalVehicles} vehicles
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Expiring Soon</p>
                <h3 className="text-2xl font-bold text-orange-600">
                  {stats.expiringWithin7Days}
                </h3>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Within 7 days</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Expired</p>
                <h3 className="text-2xl font-bold text-red-600">
                  {stats.expiredPolicies}
                </h3>
              </div>
              <Clock className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Requires renewal</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Uninsured</p>
                <h3 className="text-2xl font-bold text-red-600">
                  {stats.uninsuredCount}
                </h3>
              </div>
              <TrendingUp className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">No active policy</p>
          </Card>
        </div>
      )}

      {/* Urgent Policies */}
      {urgentPolicies.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 text-red-600">
            Urgent Actions Required ({urgentPolicies.length})
          </h2>
          <div className="space-y-3">
            {urgentPolicies.map((policy) => (
              <div
                key={policy.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">
                      {policy.vehicle.manufacturer} {policy.vehicle.model}
                    </h3>
                    <Badge className={getUrgencyColor(policy.urgencyLevel)}>
                      {policy.urgencyLevel === "expired"
                        ? "EXPIRED"
                        : `${policy.daysRemaining} days left`}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {policy.vehicle.vehicleNumber} • {policy.provider} •{" "}
                    {policy.policyNumber}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Expiry: {new Date(policy.expiryDate).toLocaleDateString()}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Renew
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Upcoming Renewals */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">
          Upcoming Renewals (Next 30 Days) - {upcomingRenewals.length}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Vehicle</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Provider</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Policy Number
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Expiry Date
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {upcomingRenewals.map((policy) => (
                <tr key={policy.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium">
                        {policy.vehicle.manufacturer} {policy.vehicle.model}
                      </div>
                      <div className="text-sm text-gray-500">
                        {policy.vehicle.vehicleNumber}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{policy.provider}</td>
                  <td className="px-4 py-3">{policy.policyNumber}</td>
                  <td className="px-4 py-3">
                    {new Date(policy.expiryDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
