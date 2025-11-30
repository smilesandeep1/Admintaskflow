import { useState, useEffect } from "react";
import { FileText, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { tasksApi, statusHistoryApi, transfersApi, documentsApi } from "@/db/api";
import type { TaskWithDetails, TaskStatusHistory, TaskTransfer, TaskDocument } from "@/types/types";
import { format } from "date-fns";
import { formatUserNameWithDesignation } from "@/lib/userUtils";

export default function TaskReports() {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [completedTasks, setCompletedTasks] = useState<TaskWithDetails[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null);
  const [statusHistory, setStatusHistory] = useState<TaskStatusHistory[]>([]);
  const [transferHistory, setTransferHistory] = useState<TaskTransfer[]>([]);
  const [documents, setDocuments] = useState<TaskDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadCompletedTasks();
  }, []);

  const loadCompletedTasks = async () => {
    try {
      setLoading(true);
      const tasks = await tasksApi.getAll();
      const completed = tasks.filter((task) => task.status === "completed");
      setCompletedTasks(completed);
    } catch (error) {
      console.error("Error loading completed tasks:", error);
      toast({
        title: "Error",
        description: "Failed to load completed tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTaskDetails = async (taskId: string) => {
    try {
      setLoading(true);
      const task = completedTasks.find((t) => t.id === taskId);
      if (!task) return;

      setSelectedTask(task);

      // Load status history
      const history = await statusHistoryApi.getByTaskId(taskId);
      setStatusHistory(history);

      // Load transfer history
      const transfers = await transfersApi.getByTaskId(taskId);
      setTransferHistory(transfers);

      // Load documents
      const docs = await documentsApi.getByTaskId(taskId);
      setDocuments(docs);

      toast({
        title: "Task Loaded",
        description: "Task details loaded successfully",
      });
    } catch (error) {
      console.error("Error loading task details:", error);
      toast({
        title: "Error",
        description: "Failed to load task details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
    if (taskId) {
      loadTaskDetails(taskId);
    } else {
      setSelectedTask(null);
      setStatusHistory([]);
      setTransferHistory([]);
      setDocuments([]);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "task_initiated":
        return "Task Initiated";
      case "completed":
        return "Completed";
      default:
        return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "low":
        return "Low";
      case "medium":
        return "Medium";
      case "high":
        return "High";
      case "urgent":
        return "Urgent";
      default:
        return priority;
    }
  };

  const generateReportHTML = () => {
    if (!selectedTask) return "";

    const currentDate = format(new Date(), "MMMM dd, yyyy");
    const taskCreatedDate = format(new Date(selectedTask.created_at), "MMMM dd, yyyy");
    const taskCompletedDate = selectedTask.completed_at
      ? format(new Date(selectedTask.completed_at), "MMMM dd, yyyy")
      : "N/A";

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Task Completion Report - ${selectedTask.title}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm;
    }
    body {
      font-family: 'Calibri', 'Arial', sans-serif;
      font-size: 10pt;
      line-height: 1.3;
      color: #000;
      margin: 0;
      padding: 0;
    }
    .report-container {
      max-width: 100%;
      padding: 10px;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #2C5F8D;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }
    .header h1 {
      margin: 0 0 3px 0;
      font-size: 16pt;
      color: #2C5F8D;
      font-weight: bold;
    }
    .header p {
      margin: 0;
      font-size: 9pt;
      color: #666;
    }
    .section {
      margin-bottom: 8px;
    }
    .section-title {
      font-size: 11pt;
      font-weight: bold;
      color: #2C5F8D;
      border-bottom: 1px solid #ddd;
      padding-bottom: 2px;
      margin-bottom: 4px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 10px;
      font-size: 9pt;
    }
    .info-item {
      display: flex;
    }
    .info-label {
      font-weight: bold;
      min-width: 100px;
      color: #333;
    }
    .info-value {
      color: #000;
    }
    .description-box {
      background: #f9f9f9;
      border: 1px solid #ddd;
      padding: 6px;
      font-size: 9pt;
      margin-top: 4px;
      border-radius: 3px;
    }
    .history-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8pt;
      margin-top: 4px;
    }
    .history-table th {
      background: #2C5F8D;
      color: white;
      padding: 3px 5px;
      text-align: left;
      font-weight: bold;
    }
    .history-table td {
      padding: 2px 5px;
      border-bottom: 1px solid #ddd;
    }
    .history-table tr:nth-child(even) {
      background: #f9f9f9;
    }
    .document-list {
      font-size: 9pt;
      margin-top: 4px;
    }
    .document-item {
      padding: 2px 0;
      border-bottom: 1px dotted #ddd;
    }
    .signature-section {
      margin-top: 12px;
      border-top: 2px solid #2C5F8D;
      padding-top: 8px;
    }
    .signature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-top: 6px;
    }
    .signature-box {
      border: 1px solid #333;
      padding: 6px;
      min-height: 50px;
      border-radius: 3px;
    }
    .signature-label {
      font-size: 9pt;
      font-weight: bold;
      margin-bottom: 3px;
    }
    .signature-line {
      border-top: 1px solid #333;
      margin-top: 25px;
      padding-top: 3px;
      font-size: 8pt;
      text-align: center;
    }
    .footer {
      margin-top: 8px;
      text-align: center;
      font-size: 8pt;
      color: #666;
      border-top: 1px solid #ddd;
      padding-top: 4px;
    }
    .status-badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 8pt;
      font-weight: bold;
    }
    .status-completed {
      background: #28A745;
      color: white;
    }
    .priority-badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 8pt;
      font-weight: bold;
    }
    .priority-urgent {
      background: #DC3545;
      color: white;
    }
    .priority-high {
      background: #FFA500;
      color: white;
    }
    .priority-medium {
      background: #FFC107;
      color: #000;
    }
    .priority-low {
      background: #6C757D;
      color: white;
    }
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="report-container">
    <!-- Header -->
    <div class="header">
      <h1>TASK COMPLETION REPORT</h1>
      <p>Sr.DFM/Hubli TaskFlow Hub</p>
      <p>Report Generated: ${currentDate}</p>
    </div>

    <!-- Task Information -->
    <div class="section">
      <div class="section-title">Task Information</div>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Task ID:</span>
          <span class="info-value">${selectedTask.id.substring(0, 8)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Section:</span>
          <span class="info-value">${selectedTask.section}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Title:</span>
          <span class="info-value">${selectedTask.title}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Priority:</span>
          <span class="info-value">
            <span class="priority-badge priority-${selectedTask.priority}">
              ${getPriorityLabel(selectedTask.priority).toUpperCase()}
            </span>
          </span>
        </div>
        <div class="info-item">
          <span class="info-label">Created By:</span>
          <span class="info-value">${formatUserNameWithDesignation(selectedTask.creator?.full_name, selectedTask.creator?.official_designation) || "N/A"}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Assigned To:</span>
          <span class="info-value">${formatUserNameWithDesignation(selectedTask.assignee?.full_name, selectedTask.assignee?.official_designation) || "N/A"}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Created Date:</span>
          <span class="info-value">${taskCreatedDate}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Completed Date:</span>
          <span class="info-value">${taskCompletedDate}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Status:</span>
          <span class="info-value">
            <span class="status-badge status-completed">COMPLETED</span>
          </span>
        </div>
        <div class="info-item">
          <span class="info-label">Due Date:</span>
          <span class="info-value">${selectedTask.due_date ? format(new Date(selectedTask.due_date), "MMMM dd, yyyy") : "N/A"}</span>
        </div>
      </div>
      ${selectedTask.description ? `
      <div style="margin-top: 6px;">
        <strong style="font-size: 9pt;">Description:</strong>
        <div class="description-box">${selectedTask.description}</div>
      </div>
      ` : ""}
      ${selectedTask.completion_remarks ? `
      <div style="margin-top: 6px;">
        <strong style="font-size: 9pt;">Completion Remarks:</strong>
        <div class="description-box">${selectedTask.completion_remarks}</div>
      </div>
      ` : ""}
    </div>

    <!-- Status Change History -->
    ${statusHistory.length > 0 ? `
    <div class="section">
      <div class="section-title">Status Change History</div>
      <table class="history-table">
        <thead>
          <tr>
            <th>Date & Time</th>
            <th>Status</th>
            <th>Changed By</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          ${statusHistory.map((history) => {
            const changedBy = (history as any).changed_by_user;
            return `
            <tr>
              <td>${format(new Date(history.created_at), "MMM dd, yyyy HH:mm")}</td>
              <td>${getStatusLabel(history.status)}</td>
              <td>${formatUserNameWithDesignation(changedBy?.full_name, changedBy?.official_designation) || "System"}</td>
              <td>${history.remarks || "-"}</td>
            </tr>
          `;
          }).join("")}
        </tbody>
      </table>
    </div>
    ` : ""}

    <!-- Transfer History -->
    ${transferHistory.length > 0 ? `
    <div class="section">
      <div class="section-title">Task Reassignment History</div>
      <table class="history-table">
        <thead>
          <tr>
            <th>Date & Time</th>
            <th>From User</th>
            <th>To User</th>
            <th>Transferred By</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          ${transferHistory.map((transfer) => {
            const fromUser = (transfer as any).from_user_profile;
            const toUser = (transfer as any).to_user_profile;
            const transferredBy = (transfer as any).transferred_by_profile;
            return `
            <tr>
              <td>${format(new Date(transfer.created_at), "MMM dd, yyyy HH:mm")}</td>
              <td>${formatUserNameWithDesignation(fromUser?.full_name, fromUser?.official_designation) || "N/A"}</td>
              <td>${formatUserNameWithDesignation(toUser?.full_name, toUser?.official_designation) || "N/A"}</td>
              <td>${formatUserNameWithDesignation(transferredBy?.full_name, transferredBy?.official_designation) || "System"}</td>
              <td>${transfer.remarks || "-"}</td>
            </tr>
          `;
          }).join("")}
        </tbody>
      </table>
    </div>
    ` : ""}

    <!-- Attached Documents -->
    ${documents.length > 0 ? `
    <div class="section">
      <div class="section-title">Attached Documents</div>
      <div class="document-list">
        ${documents.map((doc, index) => `
          <div class="document-item">
            <strong>${index + 1}.</strong> ${doc.file_name} 
            <span style="color: #666; font-size: 8pt;">
              (Uploaded: ${format(new Date(doc.created_at), "MMM dd, yyyy")})
            </span>
          </div>
        `).join("")}
      </div>
    </div>
    ` : `
    <div class="section">
      <div class="section-title">Attached Documents</div>
      <p style="font-size: 9pt; color: #666; margin: 4px 0;">No documents attached to this task.</p>
    </div>
    `}

    <!-- Signature Section -->
    <div class="signature-section">
      <div class="section-title">Official Authorization</div>
      <div class="signature-grid">
        <div class="signature-box">
          <div class="signature-label">Completed By:</div>
          <div style="margin-top: 3px; font-size: 9pt;">${formatUserNameWithDesignation(selectedTask.assignee?.full_name, selectedTask.assignee?.official_designation) || "N/A"}</div>
          <div class="signature-line">Signature & Date</div>
        </div>
        <div class="signature-box">
          <div class="signature-label">Verified By:</div>
          <div style="margin-top: 3px; font-size: 9pt;">${formatUserNameWithDesignation(selectedTask.creator?.full_name, selectedTask.creator?.official_designation) || "N/A"}</div>
          <div class="signature-line">Signature & Date</div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>This is an official document generated by Sr.DFM/Hubli TaskFlow Hub</p>
      <p>Report ID: ${selectedTask.id} | Generated on ${currentDate}</p>
    </div>
  </div>
</body>
</html>
    `;
  };

  const generateWordDocument = () => {
    if (!selectedTask) {
      toast({
        title: "Error",
        description: "Please select a task first",
        variant: "destructive",
      });
      return;
    }

    try {
      setGenerating(true);
      const htmlContent = generateReportHTML();
      
      // Create Word document using HTML
      const wordContent = `
MIME-Version: 1.0
Content-Type: multipart/related; boundary="----=_NextPart_000_0000_01D00000.00000000"

------=_NextPart_000_0000_01D00000.00000000
Content-Type: text/html; charset="utf-8"
Content-Location: file:///C:/document.html

${htmlContent}

------=_NextPart_000_0000_01D00000.00000000--
      `;

      const blob = new Blob([wordContent], { type: "application/msword" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Task_Report_${selectedTask.id.substring(0, 8)}_${format(new Date(), "yyyyMMdd")}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Word document generated successfully",
      });
    } catch (error) {
      console.error("Error generating Word document:", error);
      toast({
        title: "Error",
        description: "Failed to generate Word document",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const generatePDF = () => {
    if (!selectedTask) {
      toast({
        title: "Error",
        description: "Please select a task first",
        variant: "destructive",
      });
      return;
    }

    try {
      setGenerating(true);
      const htmlContent = generateReportHTML();
      
      // Open in new window for printing to PDF
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Wait for content to load, then trigger print
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
        }, 500);

        toast({
          title: "Print Dialog Opened",
          description: "Use 'Save as PDF' option in the print dialog",
        });
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to open print dialog",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const previewReport = () => {
    if (!selectedTask) {
      toast({
        title: "Error",
        description: "Please select a task first",
        variant: "destructive",
      });
      return;
    }

    const htmlContent = generateReportHTML();
    const previewWindow = window.open("", "_blank");
    if (previewWindow) {
      previewWindow.document.write(htmlContent);
      previewWindow.document.close();
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Official Task Reports</h1>
        <p className="text-muted-foreground">
          Generate official completion reports for finished tasks
        </p>
      </div>

      {/* Task Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Completed Task</CardTitle>
          <CardDescription>Choose a completed task to generate its official report</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Completed Task</label>
            <Select value={selectedTaskId} onValueChange={handleTaskSelect} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select a completed task..." />
              </SelectTrigger>
              <SelectContent>
                {completedTasks.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No completed tasks available
                  </SelectItem>
                ) : (
                  completedTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title} - {task.section} ({format(new Date(task.created_at), "MMM dd, yyyy")})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedTask && (
            <div className="pt-4 border-t space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Task:</span> {selectedTask.title}
                </div>
                <div>
                  <span className="font-medium">Section:</span> {selectedTask.section}
                </div>
                <div>
                  <span className="font-medium">Assigned To:</span> {formatUserNameWithDesignation(selectedTask.assignee?.full_name, selectedTask.assignee?.official_designation) || "N/A"}
                </div>
                <div>
                  <span className="font-medium">Completed:</span>{" "}
                  {selectedTask.completed_at
                    ? format(new Date(selectedTask.completed_at), "MMM dd, yyyy")
                    : "N/A"}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={previewReport} variant="outline" disabled={generating}>
                  <FileText className="w-4 h-4 mr-2" />
                  Preview Report
                </Button>
                <Button onClick={generateWordDocument} disabled={generating}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Word
                </Button>
                <Button onClick={generatePDF} variant="secondary" disabled={generating}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print / Save as PDF
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Information */}
      <Card>
        <CardHeader>
          <CardTitle>Report Contents</CardTitle>
          <CardDescription>Each official report includes the following information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h3 className="font-semibold text-base">Task Information</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Task ID, Title, and Description</li>
                <li>Section and Priority Level</li>
                <li>Created By and Assigned To</li>
                <li>Creation and Completion Dates</li>
                <li>Completion Remarks</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-base">History & Documentation</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Complete Status Change History</li>
                <li>Task Reassignment Records</li>
                <li>List of Attached Documents</li>
                <li>Signature Section for Authorization</li>
                <li>Official Report ID and Timestamp</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium">📄 One-Page Format</p>
            <p className="text-sm text-muted-foreground mt-1">
              All reports are professionally formatted to fit on a single page, ready for printing and
              official filing.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
