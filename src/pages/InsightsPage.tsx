import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { DashboardLayout } from '@/components/DashboardLayout';
import { insightsData } from '@/data/mockData';
import { TrendingUp, PieChart as PieIcon, BarChart3 } from 'lucide-react';

export default function InsightsPage() {
  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">System Insights</h1>
          <p className="text-sm text-muted-foreground">Analytics and fault distribution overview</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Common Faults Bar Chart */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-heading uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Most Common Faults
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={insightsData.commonFaults} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 18%)" />
                <XAxis type="number" stroke="hsl(215, 15%, 55%)" fontSize={10} />
                <YAxis type="category" dataKey="name" stroke="hsl(215, 15%, 55%)" fontSize={11} width={120} />
                <Tooltip wrapperStyle={{ zIndex: 1000 }} contentStyle={{ background: 'hsl(220, 43%, 99%)', border: '1px solid hsl(220, 13%, 18%)', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: 'hsl(215, 15%, 55%)' }} itemStyle={{ color: 'hsl(215, 15%, 55%)' }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {insightsData.commonFaults.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Severity Breakdown Pie Chart */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-heading uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-accent" /> Alert Severity Breakdown
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={insightsData.severityBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {insightsData.severityBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Legend
                  formatter={(value) => <span style={{ color: 'hsl(210, 20%, 85%)', fontSize: 12 }}>{value}</span>}
                />
                <Tooltip wrapperStyle={{ zIndex: 1000 }} contentStyle={{ background: 'hsl(223, 47%, 97%)', border: '1px solid hsl(220, 13%, 18%)', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: 'hsl(215, 15%, 55%)' }} itemStyle={{ color: 'hsl(215, 15%, 55%)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top Alert Vehicles */}
          <div className="glass-card p-4 lg:col-span-2">
            <h3 className="text-sm font-heading uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-warning" /> Vehicles with Highest Alert Frequency
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={insightsData.topAlertVehicles}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 18%)" />
                <XAxis dataKey="vehicle" stroke="hsl(215, 15%, 55%)" fontSize={11} />
                <YAxis stroke="hsl(215, 15%, 55%)" fontSize={10} />
                <Tooltip wrapperStyle={{ zIndex: 1000 }} contentStyle={{ background: 'hsl(180, 14%, 99%)', border: '1px solid hsl(220, 13%, 18%)', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: 'hsl(215, 15%, 55%)' }} itemStyle={{ color: 'hsl(215, 15%, 55%)' }} />
                <Bar dataKey="alerts" fill="hsl(199, 89%, 48%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
