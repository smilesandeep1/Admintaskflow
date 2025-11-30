import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { reportsApi } from "@/db/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { ClipboardList, TrendingUp, FolderKanban } from "lucide-react";

export default function Reports() {
  const [stats, setStats] = useState<{
    total: number;
    byStatus: Record<string, number>;
    bySection: Record<string, number>;
  } | null>(null);
  const [userActivity, setUserActivity] = useState<{
    created: Record<string, number>;
    assigned: Record<string, number>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const [statsData, activityData] = await Promise.all([
        reportsApi.getTaskStats(),
        reportsApi.getUserActivity()
      ]);
      setStats(statsData);
      setUserActivity(activityData);
    } catch (error) {
      console.error("Error loading reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    pending: "hsl(var(--warning))",
    task_initiated: "hsl(var(--primary))",
    completed: "hsl(var(--success))"
  };

  const statusLabels = {
    pending: "PENDING",
    task_initiated: "TASK INITIATED",
    completed: "COMPLETED"
  };

  const statusData = stats?.byStatus
    ? Object.entries(stats.byStatus).map(([status, count]) => ({
        name: statusLabels[status as keyof typeof statusLabels] || status.toUpperCase(),
        value: count,
        color: statusColors[status as keyof typeof statusColors]
      }))
    : [];

  const sectionData = stats?.bySection
    ? Object.entries(stats.bySection)
        .sort((a, b) => b[1] - a[1])
        .map(([section, count]) => ({
          section,
          tasks: count
        }))
    : [];

  const createdData = userActivity?.created
    ? Object.entries(userActivity.created)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({
          name: name.length > 20 ? name.substring(0, 20) + "..." : name,
          created: count
        }))
    : [];

  const assignedData = userActivity?.assigned
    ? Object.entries(userActivity.assigned)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({
          name: name.length > 20 ? name.substring(0, 20) + "..." : name,
          assigned: count
        }))
    : [];

  const completionRate = stats?.byStatus
    ? ((stats.byStatus.completed || 0) / stats.total) * 100
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1">Comprehensive task and user activity reports</p>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card className="border-l-4" style={{ borderLeftColor: '#5B9FFF' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
            <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(91, 159, 255, 0.1)' }}>
              <ClipboardList className="h-5 w-5" style={{ color: '#5B9FFF' }} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">All tasks in the system</p>
          </CardContent>
        </Card>

        <Card className="border-l-4" style={{ borderLeftColor: '#FFA500' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
            <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 165, 0, 0.1)' }}>
              <TrendingUp className="h-5 w-5" style={{ color: '#FFA500' }} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{completionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.byStatus?.completed || 0} of {stats?.total || 0} tasks completed
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4" style={{ borderLeftColor: '#28A745' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Sections</CardTitle>
            <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(40, 167, 69, 0.1)' }}>
              <FolderKanban className="h-5 w-5" style={{ color: '#28A745' }} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{Object.keys(stats?.bySection || {}).length}</div>
            <p className="text-xs text-muted-foreground mt-1">Sections with tasks</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Task Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Section Workload Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={sectionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="section" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="tasks" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Task Creators</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={createdData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="created" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Most Assigned Users</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={assignedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="assigned" fill="hsl(var(--success))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Task Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium">{item.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">{item.value} tasks</span>
                  <span className="font-semibold">
                    {((item.value / (stats?.total || 1)) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
