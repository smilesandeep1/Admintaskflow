import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/AuthProvider";
import { tasksApi, profilesApi } from "@/db/api";
import {
  calculateTaskAnalytics,
  calculateSectionWorkload,
  calculateUserWorkload,
  generateAIInsights,
  generateWorkloadRecommendations,
  type AIInsights as AIInsightsType,
  type SectionWorkload,
  type UserWorkload,
  type TaskAnalytics,
} from "@/services/aiService";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Users,
  BarChart3,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))"];

export default function AIInsights() {
  const { toast } = useToast();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [analytics, setAnalytics] = useState<TaskAnalytics | null>(null);
  const [sectionWorkload, setSectionWorkload] = useState<SectionWorkload[]>([]);
  const [userWorkload, setUserWorkload] = useState<UserWorkload[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsightsType | null>(null);
  const [workloadRecommendations, setWorkloadRecommendations] = useState<string>("");

  // Redirect L4 users to dashboard
  useEffect(() => {
    if (profile?.role === 'L4') {
      toast({
        title: "Access Denied",
        description: "AI Insights is not available for your user level",
        variant: "destructive",
      });
      navigate('/');
    }
  }, [profile, navigate, toast]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasks, users] = await Promise.all([tasksApi.getAll(), profilesApi.getAll()]);

      const analyticsData = calculateTaskAnalytics(tasks);
      const sectionData = calculateSectionWorkload(tasks);
      const userData = calculateUserWorkload(tasks, users);

      setAnalytics(analyticsData);
      setSectionWorkload(sectionData);
      setUserWorkload(userData);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = async () => {
    if (!analytics) return;

    try {
      setGenerating(true);
      const insights = await generateAIInsights(analytics, sectionWorkload, userWorkload);
      setAiInsights(insights);

      const recommendations = await generateWorkloadRecommendations(userWorkload);
      setWorkloadRecommendations(recommendations);

      toast({
        title: "AI Insights Generated",
        description: "Advanced analytics and recommendations are ready",
      });
    } catch (error) {
      console.error("Failed to generate insights:", error);
      toast({
        title: "Error",
        description: "Failed to generate AI insights. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">AI-Powered Insights</h1>
            <p className="text-muted-foreground">Advanced analytics and recommendations</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24 bg-muted" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>No Data Available</AlertTitle>
        <AlertDescription>Unable to load analytics data. Please try again.</AlertDescription>
      </Alert>
    );
  }

  const statusData = [
    { name: "Completed", value: analytics.completedTasks, color: "hsl(var(--chart-1))" },
    { name: "Task Initiated", value: analytics.taskInitiatedTasks, color: "hsl(var(--chart-2))" },
    { name: "Pending", value: analytics.pendingTasks, color: "hsl(var(--chart-3))" },
  ];

  const sectionChartData = sectionWorkload.slice(0, 8).map((s) => ({
    section: s.section,
    total: s.totalTasks,
    completed: s.completedTasks,
    pending: s.pendingTasks,
    taskInitiated: s.taskInitiatedTasks,
  }));

  const userChartData = userWorkload.slice(0, 10).map((u) => ({
    name: u.userName.split(" ")[0],
    assigned: u.totalAssigned,
    completed: u.completed,
    pending: u.pending,
    rate: u.completionRate,
  }));

  const workloadRadarData = userWorkload.slice(0, 6).map((u) => ({
    user: u.userName.split(" ")[0],
    workload: u.totalAssigned,
    completion: u.completionRate,
    efficiency: u.averageCompletionTime > 0 ? Math.min(100, 100 / u.averageCompletionTime) : 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            AI-Powered Insights
          </h1>
          <p className="text-muted-foreground">
            Advanced analytics powered by artificial intelligence
          </p>
        </div>
        <Button onClick={generateInsights} disabled={generating} size="lg">
          {generating ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate AI Insights
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.completionRate.toFixed(1)}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageCompletionTime.toFixed(1)} days</div>
            <p className="text-xs text-muted-foreground">Average time to complete</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{analytics.overdueTasksCount}</div>
            <p className="text-xs text-muted-foreground">Require immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userWorkload.length}</div>
            <p className="text-xs text-muted-foreground">Users with assigned tasks</p>
          </CardContent>
        </Card>
      </div>

      {aiInsights && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Completion Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{aiInsights.completionTrends}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Workflow Bottlenecks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{aiInsights.bottlenecks}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-accent" />
                Delay Predictions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{aiInsights.delayPredictions}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-secondary" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-line">{aiInsights.recommendations}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {workloadRecommendations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Workload Balance Recommendations
            </CardTitle>
            <CardDescription>AI-powered suggestions for optimal task distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="text-sm leading-relaxed whitespace-pre-line">{workloadRecommendations}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="sections" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sections">Section Analysis</TabsTrigger>
          <TabsTrigger value="users">User Workload</TabsTrigger>
          <TabsTrigger value="distribution">Task Distribution</TabsTrigger>
          <TabsTrigger value="performance">Performance Radar</TabsTrigger>
        </TabsList>

        <TabsContent value="sections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Section Workload Analysis</CardTitle>
              <CardDescription>Task distribution and completion rates across sections</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={sectionChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="section" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" fill="hsl(var(--chart-1))" name="Completed" />
                  <Bar dataKey="taskInitiated" fill="hsl(var(--chart-2))" name="Task Initiated" />
                  <Bar dataKey="pending" fill="hsl(var(--chart-3))" name="Pending" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sectionWorkload.map((section) => (
              <Card key={section.section}>
                <CardHeader>
                  <CardTitle className="text-lg">{section.section}</CardTitle>
                  <CardDescription>
                    {section.totalTasks} total tasks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Completion Rate:</span>
                    <Badge variant={section.completionRate > 70 ? "default" : "secondary"}>
                      {section.completionRate.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Pending:</span>
                    <span className="font-medium">{section.pendingTasks}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg Time:</span>
                    <span className="font-medium">{section.averageCompletionTime.toFixed(1)} days</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Workload Comparison</CardTitle>
              <CardDescription>Task assignments and completion rates by user</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={userChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" fill="hsl(var(--chart-1))" name="Completed" />
                  <Bar dataKey="pending" fill="hsl(var(--chart-3))" name="Pending" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {userWorkload.map((user) => (
              <Card key={user.userId}>
                <CardHeader>
                  <CardTitle className="text-lg">{user.userName}</CardTitle>
                  <CardDescription>{user.designation}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Assigned:</span>
                    <span className="font-medium">{user.totalAssigned}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Completion Rate:</span>
                    <Badge variant={user.completionRate > 70 ? "default" : "secondary"}>
                      {user.completionRate.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Pending:</span>
                    <span className="font-medium text-destructive">{user.pending}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg Time:</span>
                    <span className="font-medium">{user.averageCompletionTime.toFixed(1)} days</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Task Status Distribution</CardTitle>
                <CardDescription>Overall task status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
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
                <CardTitle>Completion Rate Trend</CardTitle>
                <CardDescription>User completion rates comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={userChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      stroke="hsl(var(--primary))"
                      name="Completion Rate %"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Radar Analysis</CardTitle>
              <CardDescription>Multi-dimensional performance comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={workloadRadarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="user" />
                  <PolarRadiusAxis />
                  <Radar
                    name="Workload"
                    dataKey="workload"
                    stroke="hsl(var(--chart-1))"
                    fill="hsl(var(--chart-1))"
                    fillOpacity={0.6}
                  />
                  <Radar
                    name="Completion %"
                    dataKey="completion"
                    stroke="hsl(var(--chart-2))"
                    fill="hsl(var(--chart-2))"
                    fillOpacity={0.6}
                  />
                  <Radar
                    name="Efficiency"
                    dataKey="efficiency"
                    stroke="hsl(var(--chart-3))"
                    fill="hsl(var(--chart-3))"
                    fillOpacity={0.6}
                  />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
