import type { Task, Profile, TaskWithDetails } from "@/types/types";

const APP_ID = import.meta.env.VITE_APP_ID;
const AI_API_URL = "https://api-integrations.appmedo.com/app-7oowe77h6v41/api-rLob8RdzAOl9/v1beta/models/gemini-2.5-flash:generateContent";

interface AIMessage {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

interface AIResponse {
  candidates: Array<{
    content: {
      role: string;
      parts: Array<{ text: string }>;
    };
    finishReason: string;
  }>;
}

export interface TaskAnalytics {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  taskInitiatedTasks: number;
  completionRate: number;
  averageCompletionTime: number;
  overdueTasksCount: number;
}

export interface SectionWorkload {
  section: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  taskInitiatedTasks: number;
  completionRate: number;
  averageCompletionTime: number;
}

export interface UserWorkload {
  userId: string;
  userName: string;
  designation: string;
  totalAssigned: number;
  completed: number;
  pending: number;
  taskInitiated: number;
  completionRate: number;
  averageCompletionTime: number;
}

export interface AIInsights {
  completionTrends: string;
  bottlenecks: string;
  delayPredictions: string;
  recommendations: string;
  workloadAnalysis: string;
}

async function callAI(messages: AIMessage[]): Promise<string> {
  try {
    const response = await fetch(AI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-App-Id": APP_ID,
      },
      body: JSON.stringify({
        contents: messages,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error response:", errorText);
      throw new Error(`AI API error: ${response.status} ${response.statusText}`);
    }

    const data: AIResponse = await response.json();
    
    if (data.candidates && data.candidates.length > 0) {
      const content = data.candidates[0].content;
      if (content.parts && content.parts.length > 0) {
        return content.parts[0].text;
      }
    }
    
    console.error("Invalid AI response structure:", data);
    throw new Error("No valid response from AI");
  } catch (error) {
    console.error("AI API call failed:", error);
    throw error;
  }
}

export function calculateTaskAnalytics(tasks: Task[]): TaskAnalytics {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const pendingTasks = tasks.filter((t) => t.status === "pending").length;
  const taskInitiatedTasks = tasks.filter((t) => t.status === "task_initiated").length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const completedTasksWithTime = tasks.filter(
    (t) => t.status === "completed" && t.completed_at && t.created_at
  );
  
  const totalCompletionTime = completedTasksWithTime.reduce((sum, task) => {
    const created = new Date(task.created_at).getTime();
    const completed = new Date(task.completed_at!).getTime();
    return sum + (completed - created);
  }, 0);

  const averageCompletionTime =
    completedTasksWithTime.length > 0
      ? totalCompletionTime / completedTasksWithTime.length / (1000 * 60 * 60 * 24)
      : 0;

  const now = new Date();
  const overdueTasksCount = tasks.filter((t) => {
    if (t.status === "completed" || !t.due_date) return false;
    return new Date(t.due_date) < now;
  }).length;

  return {
    totalTasks,
    completedTasks,
    pendingTasks,
    taskInitiatedTasks,
    completionRate,
    averageCompletionTime,
    overdueTasksCount,
  };
}

export function calculateSectionWorkload(tasks: Task[]): SectionWorkload[] {
  const sectionMap = new Map<string, Task[]>();

  tasks.forEach((task) => {
    if (!sectionMap.has(task.section)) {
      sectionMap.set(task.section, []);
    }
    sectionMap.get(task.section)!.push(task);
  });

  return Array.from(sectionMap.entries()).map(([section, sectionTasks]) => {
    const totalTasks = sectionTasks.length;
    const completedTasks = sectionTasks.filter((t) => t.status === "completed").length;
    const pendingTasks = sectionTasks.filter((t) => t.status === "pending").length;
    const taskInitiatedTasks = sectionTasks.filter((t) => t.status === "task_initiated").length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const completedWithTime = sectionTasks.filter(
      (t) => t.status === "completed" && t.completed_at && t.created_at
    );

    const totalTime = completedWithTime.reduce((sum, task) => {
      const created = new Date(task.created_at).getTime();
      const completed = new Date(task.completed_at!).getTime();
      return sum + (completed - created);
    }, 0);

    const averageCompletionTime =
      completedWithTime.length > 0 ? totalTime / completedWithTime.length / (1000 * 60 * 60 * 24) : 0;

    return {
      section,
      totalTasks,
      completedTasks,
      pendingTasks,
      taskInitiatedTasks,
      completionRate,
      averageCompletionTime,
    };
  }).sort((a, b) => b.totalTasks - a.totalTasks);
}

export function calculateUserWorkload(tasks: TaskWithDetails[], users: Profile[]): UserWorkload[] {
  const userMap = new Map<string, Task[]>();

  tasks.forEach((task) => {
    if (!userMap.has(task.assigned_to)) {
      userMap.set(task.assigned_to, []);
    }
    userMap.get(task.assigned_to)!.push(task);
  });

  return Array.from(userMap.entries())
    .map(([userId, userTasks]) => {
      const user = users.find((u) => u.id === userId);
      const totalAssigned = userTasks.length;
      const completed = userTasks.filter((t) => t.status === "completed").length;
      const pending = userTasks.filter((t) => t.status === "pending").length;
      const taskInitiated = userTasks.filter((t) => t.status === "task_initiated").length;
      const completionRate = totalAssigned > 0 ? (completed / totalAssigned) * 100 : 0;

      const completedWithTime = userTasks.filter(
        (t) => t.status === "completed" && t.completed_at && t.created_at
      );

      const totalTime = completedWithTime.reduce((sum, task) => {
        const created = new Date(task.created_at).getTime();
        const completed = new Date(task.completed_at!).getTime();
        return sum + (completed - created);
      }, 0);

      const averageCompletionTime =
        completedWithTime.length > 0 ? totalTime / completedWithTime.length / (1000 * 60 * 60 * 24) : 0;

      return {
        userId,
        userName: user?.full_name || user?.email || "Unknown",
        designation: user?.designation || user?.role || "Unknown",
        totalAssigned,
        completed,
        pending,
        taskInitiated,
        completionRate,
        averageCompletionTime,
      };
    })
    .sort((a, b) => b.totalAssigned - a.totalAssigned);
}

export async function generateAIInsights(
  analytics: TaskAnalytics,
  sectionWorkload: SectionWorkload[],
  userWorkload: UserWorkload[]
): Promise<AIInsights> {
  const dataContext = `
Task Management System Analytics Data:

Overall Statistics:
- Total Tasks: ${analytics.totalTasks}
- Completed: ${analytics.completedTasks} (${analytics.completionRate.toFixed(1)}%)
- Pending: ${analytics.pendingTasks}
- Task Initiated: ${analytics.taskInitiatedTasks}
- Overdue Tasks: ${analytics.overdueTasksCount}
- Average Completion Time: ${analytics.averageCompletionTime.toFixed(1)} days

Section Workload (Top 5):
${sectionWorkload.slice(0, 5).map((s) => `- ${s.section}: ${s.totalTasks} tasks, ${s.completionRate.toFixed(1)}% completion rate, ${s.pendingTasks} pending`).join("\n")}

User Workload (Top 5):
${userWorkload.slice(0, 5).map((u) => `- ${u.userName} (${u.designation}): ${u.totalAssigned} tasks, ${u.completionRate.toFixed(1)}% completion rate, ${u.pending} pending`).join("\n")}

Please analyze this data and provide:
1. Completion Trends: Identify patterns in task completion rates and what they indicate
2. Bottlenecks: Identify sections or users that may be experiencing workflow bottlenecks
3. Delay Predictions: Predict which areas are at risk of delays based on pending tasks and completion rates
4. Recommendations: Provide 3-5 actionable recommendations for improving workflow efficiency
5. Workload Analysis: Analyze the distribution of work across sections and users

Format your response as JSON with these exact keys: completionTrends, bottlenecks, delayPredictions, recommendations, workloadAnalysis
Each value should be a clear, concise paragraph (2-4 sentences).
`;

  try {
    const messages: AIMessage[] = [
      {
        role: "user",
        parts: [{ text: dataContext }],
      },
    ];

    const response = await callAI(messages);
    
    // Try to extract JSON from the response
    // Handle both plain JSON and markdown code blocks
    let jsonText = response;
    
    // Remove markdown code blocks if present
    const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1];
    }
    
    // Try to find JSON object in the text
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const insights = JSON.parse(jsonMatch[0]);
        
        // Validate that all required fields are present
        if (insights.completionTrends && insights.bottlenecks && 
            insights.delayPredictions && insights.recommendations && 
            insights.workloadAnalysis) {
          return insights;
        }
      } catch (parseError) {
        console.error("Failed to parse JSON from AI response:", parseError);
      }
    }

    // Fallback: return the raw response in a structured format
    console.warn("Could not parse structured JSON, using fallback format");
    return {
      completionTrends: response.substring(0, 300) || "Analysis in progress...",
      bottlenecks: "Please review the task distribution manually.",
      delayPredictions: "Monitor pending tasks closely.",
      recommendations: response.substring(300, 600) || "Continue monitoring system performance.",
      workloadAnalysis: response.substring(600, 900) || "Workload appears balanced.",
    };
  } catch (error) {
    console.error("Failed to generate AI insights:", error);
    throw error;
  }
}

export async function generateWorkloadRecommendations(
  userWorkload: UserWorkload[]
): Promise<string> {
  const overloadedUsers = userWorkload.filter((u) => u.pending > 5 && u.completionRate < 50);
  const underutilizedUsers = userWorkload.filter((u) => u.totalAssigned < 3);

  const context = `
Workload Distribution Analysis:

Overloaded Users (>5 pending tasks, <50% completion rate):
${overloadedUsers.map((u) => `- ${u.userName}: ${u.pending} pending, ${u.completionRate.toFixed(1)}% completion`).join("\n") || "None"}

Underutilized Users (<3 total tasks):
${underutilizedUsers.map((u) => `- ${u.userName}: ${u.totalAssigned} total tasks`).join("\n") || "None"}

Provide specific recommendations for balancing workload across the team. Focus on:
1. Which tasks should be redistributed
2. Which users can take on more work
3. How to prevent burnout in overloaded users
4. Strategies for improving overall team efficiency

Keep the response concise (3-5 bullet points).
`;

  try {
    const messages: AIMessage[] = [
      {
        role: "user",
        parts: [{ text: context }],
      },
    ];

    return await callAI(messages);
  } catch (error) {
    console.error("Failed to generate workload recommendations:", error);
    throw error;
  }
}
