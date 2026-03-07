import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

interface TicketStats {
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  highPriority: number;
  emergencySOS: number;
}

interface SupportTicket {
  id: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  driver: {
    name: string;
    email: string;
    phone: string | null;
  };
}

export default function SupportPage() {
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchSupportData();
  }, [filter]);

  const fetchSupportData = async () => {
    try {
      setLoading(true);
      const [statsRes, ticketsRes] = await Promise.all([
        fetch(`${API_BASE}/support/tickets/stats`),
        fetch(
          `${API_BASE}/support/tickets${filter !== "all" ? `?status=${filter}` : ""}`
        ),
      ]);

      const statsData = await statsRes.json();
      const ticketsData = await ticketsRes.json();

      if (statsData.success) setStats(statsData.data);
      if (ticketsData.success) setTickets(ticketsData.data);
    } catch (error) {
      console.error("Error fetching support data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-red-100 text-red-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      case "CLOSED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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

  const getCategoryIcon = (category: string) => {
    if (category === "EMERGENCY_SOS") return <AlertTriangle className="h-5 w-5 text-red-500" />;
    if (category === "VEHICLE_ISSUE") return <AlertCircle className="h-5 w-5 text-orange-500" />;
    return <AlertCircle className="h-5 w-5 text-gray-500" />;
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
        <h1 className="text-3xl font-bold">Support Tickets</h1>
        <Button>New Ticket</Button>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6 cursor-pointer hover:shadow-md" onClick={() => setFilter("OPEN")}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Open Tickets</p>
                <h3 className="text-2xl font-bold text-red-600">{stats.open}</h3>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Requires attention</p>
          </Card>

          <Card className="p-6 cursor-pointer hover:shadow-md" onClick={() => setFilter("IN_PROGRESS")}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">In Progress</p>
                <h3 className="text-2xl font-bold text-blue-600">
                  {stats.inProgress}
                </h3>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Being worked on</p>
          </Card>

          <Card className="p-6 cursor-pointer hover:shadow-md" onClick={() => setFilter("RESOLVED")}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Resolved</p>
                <h3 className="text-2xl font-bold text-green-600">
                  {stats.resolved}
                </h3>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Awaiting closure</p>
          </Card>

          <Card className="p-6 cursor-pointer hover:shadow-md" onClick={() => setFilter("all")}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Emergency SOS</p>
                <h3 className="text-2xl font-bold text-red-600">
                  {stats.emergencySOS}
                </h3>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Critical alerts</p>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All Tickets
        </Button>
        <Button
          variant={filter === "OPEN" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("OPEN")}
        >
          Open
        </Button>
        <Button
          variant={filter === "IN_PROGRESS" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("IN_PROGRESS")}
        >
          In Progress
        </Button>
        <Button
          variant={filter === "RESOLVED" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("RESOLVED")}
        >
          Resolved
        </Button>
      </div>

      {/* Tickets List */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">
          {filter === "all" ? "All Tickets" : `${filter} Tickets`} ({tickets.length})
        </h2>
        <div className="space-y-3">
          {tickets.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No tickets found</p>
          ) : (
            tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="mt-1">{getCategoryIcon(ticket.category)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{ticket.subject}</h3>
                    <Badge className={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                    <Badge className={getStatusColor(ticket.status)}>
                      {ticket.status.replace("_", " ")}
                    </Badge>
                    {ticket.category === "EMERGENCY_SOS" && (
                      <Badge className="bg-red-500 text-white">SOS</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Driver: {ticket.driver.name}</span>
                    {ticket.driver.phone && <span>📞 {ticket.driver.phone}</span>}
                    <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                  {ticket.status === "OPEN" && (
                    <Button size="sm">Start Working</Button>
                  )}
                  {ticket.status === "IN_PROGRESS" && (
                    <Button size="sm" variant="default">
                      Resolve
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
