import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { tasksApi } from "@/db/api";
import type { TaskWithDetails } from "@/types/types";
import { formatUserNameWithDesignation } from "@/lib/userUtils";

type ReportType = "section" | "status" | "user" | "level" | "task";
type ExportFormat = "csv" | "xls";

interface ReportData {
  category: string;
  totalTasks: number;
  pending: number;
  taskInitiated: number;
  completed: number;
  designation?: string; // For User-wise report
  section?: string; // For Task-wise report
  oldestTask?: string; // For Section-wise report
}

export default function DownloadReports() {
  const { toast } = useToast();
  const [selectedReportTypes, setSelectedReportTypes] = useState<ReportType[]>(["section"]);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [reportData, setReportData] = useState<Map<ReportType, ReportData[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await tasksApi.getAll();
      setTasks(data);
    } catch (error) {
      console.error("Error loading tasks:", error);
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTasksByDateRange = (tasks: TaskWithDetails[]): TaskWithDetails[] => {
    if (!dateFrom && !dateTo) return tasks;

    return tasks.filter((task) => {
      const taskDate = new Date(task.created_at);
      if (dateFrom && dateTo) {
        return taskDate >= dateFrom && taskDate <= dateTo;
      } else if (dateFrom) {
        return taskDate >= dateFrom;
      } else if (dateTo) {
        return taskDate <= dateTo;
      }
      return true;
    });
  };

  const generateReport = () => {
    const filteredTasks = filterTasksByDateRange(tasks);

    if (filteredTasks.length === 0) {
      toast({
        title: "No Data",
        description: "No tasks found for the selected date range",
        variant: "destructive",
      });
      return;
    }

    if (selectedReportTypes.length === 0) {
      toast({
        title: "No Report Type Selected",
        description: "Please select at least one report type",
        variant: "destructive",
      });
      return;
    }

    const allReportData = new Map<ReportType, ReportData[]>();

    selectedReportTypes.forEach((reportType) => {
      let data: ReportData[] = [];

      if (reportType === "section") {
        // Group by section
        const sections = Array.from(new Set(filteredTasks.map((t) => t.section)));
        data = sections.sort().map((section) => {
          const sectionTasks = filteredTasks.filter((t) => t.section === section);
          // Find oldest task (earliest created_at)
          const oldestTaskObj = sectionTasks.reduce((oldest, task) => {
            return new Date(task.created_at) < new Date(oldest.created_at) ? task : oldest;
          }, sectionTasks[0]);
          
          return {
            category: section,
            totalTasks: sectionTasks.length,
            pending: sectionTasks.filter((t) => t.status === "pending").length,
            taskInitiated: sectionTasks.filter((t) => t.status === "task_initiated").length,
            completed: sectionTasks.filter((t) => t.status === "completed").length,
            oldestTask: oldestTaskObj ? oldestTaskObj.title : "N/A",
          };
        });
      } else if (reportType === "status") {
        // Group by status
        const statuses = ["pending", "task_initiated", "completed"];
        data = statuses.map((status) => {
          const statusTasks = filteredTasks.filter((t) => t.status === status);
          return {
            category: status === "task_initiated" ? "Task Initiated" : status.charAt(0).toUpperCase() + status.slice(1),
            totalTasks: statusTasks.length,
            pending: status === "pending" ? statusTasks.length : 0,
            taskInitiated: status === "task_initiated" ? statusTasks.length : 0,
            completed: status === "completed" ? statusTasks.length : 0,
          };
        });
      } else if (reportType === "user") {
        // Group by assigned user
        const userMap = new Map<string, { name: string; designation: string }>();
        filteredTasks.forEach((task) => {
          if (task.assignee?.full_name) {
            userMap.set(task.assigned_to, {
              name: task.assignee.full_name,
              designation: task.assignee.official_designation || "N/A",
            });
          }
        });

        data = Array.from(userMap.entries())
          .sort((a, b) => a[1].name.localeCompare(b[1].name))
          .map(([userId, userInfo]) => {
            const userTasks = filteredTasks.filter((t) => t.assigned_to === userId);
            return {
              category: userInfo.name,
              designation: userInfo.designation,
              totalTasks: userTasks.length,
              pending: userTasks.filter((t) => t.status === "pending").length,
              taskInitiated: userTasks.filter((t) => t.status === "task_initiated").length,
              completed: userTasks.filter((t) => t.status === "completed").length,
            };
          });
      } else if (reportType === "level") {
        // Group by user level
        const levels = ["L1", "L2", "L3", "L4", "admin"];
        const levelLabels: Record<string, string> = {
          L1: "Level 1 (Sr.DFM)",
          L2: "Level 2 (ADFM)",
          L3: "Level 3 (Sr. Section Officers)",
          L4: "Level 4 (Group C Staff)",
          admin: "Admin"
        };

        data = levels
          .map((level) => {
            const levelTasks = filteredTasks.filter((t) => t.assignee?.role === level);
            if (levelTasks.length === 0) return null;
            return {
              category: levelLabels[level] || level,
              totalTasks: levelTasks.length,
              pending: levelTasks.filter((t) => t.status === "pending").length,
              taskInitiated: levelTasks.filter((t) => t.status === "task_initiated").length,
              completed: levelTasks.filter((t) => t.status === "completed").length,
            };
          })
          .filter((item): item is ReportData => item !== null);
      } else if (reportType === "task") {
        // Task-wise report - individual task details
        data = filteredTasks
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .map((task) => ({
            category: task.title,
            section: task.section,
            totalTasks: 1,
            pending: task.status === "pending" ? 1 : 0,
            taskInitiated: task.status === "task_initiated" ? 1 : 0,
            completed: task.status === "completed" ? 1 : 0,
          }));
      }

      allReportData.set(reportType, data);
    });

    setReportData(allReportData);
    
    const totalRecords = Array.from(allReportData.values()).reduce((sum, data) => sum + data.length, 0);
    toast({
      title: "Report Generated",
      description: `${totalRecords} records found across ${selectedReportTypes.length} report type(s)`,
    });
  };

  const exportToCSV = () => {
    if (reportData.size === 0) {
      toast({
        title: "No Data",
        description: "Please generate a report first",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);

    try {
      const csvRows: string[] = [];

      // Process each report type
      reportData.forEach((data, reportType) => {
        // Add report type header
        csvRows.push(`\n"${getReportTypeLabel(reportType).toUpperCase()} REPORT"`);
        csvRows.push("");

        // Create CSV header based on report type
        let headers = ["Category"];
        
        if (reportType === "user") {
          headers.push("Designation");
        } else if (reportType === "task") {
          headers.push("Section");
        }
        
        headers.push("Total Tasks", "Pending", "Task Initiated", "Completed");
        
        if (reportType === "section") {
          headers.push("Oldest Task");
        }
        
        csvRows.push(headers.join(","));

        // Add data rows
        data.forEach((row) => {
          const values = [`"${row.category}"`];
          
          if (reportType === "user" && row.designation) {
            values.push(`"${row.designation}"`);
          } else if (reportType === "task" && row.section) {
            values.push(`"${row.section}"`);
          }
          
          values.push(
            String(row.totalTasks),
            String(row.pending),
            String(row.taskInitiated),
            String(row.completed)
          );
          
          if (reportType === "section" && row.oldestTask) {
            values.push(`"${row.oldestTask}"`);
          }
          
          csvRows.push(values.join(","));
        });

        // Add summary row for this report type
        const totalTasks = data.reduce((sum, row) => sum + row.totalTasks, 0);
        const totalPending = data.reduce((sum, row) => sum + row.pending, 0);
        const totalInitiated = data.reduce((sum, row) => sum + row.taskInitiated, 0);
        const totalCompleted = data.reduce((sum, row) => sum + row.completed, 0);
        csvRows.push("");
        csvRows.push(`"TOTAL",${totalTasks},${totalPending},${totalInitiated},${totalCompleted}`);
        csvRows.push("");
      });

      // Add metadata
      csvRows.push("");
      csvRows.push(`"Report Types","${selectedReportTypes.map(t => getReportTypeLabel(t)).join(", ")}"`);
      if (dateFrom) csvRows.push(`"Date From","${format(dateFrom, "yyyy-MM-dd")}"`);
      if (dateTo) csvRows.push(`"Date To","${format(dateTo, "yyyy-MM-dd")}"`);
      csvRows.push(`"Generated On","${format(new Date(), "yyyy-MM-dd HH:mm:ss")}"`);

      // Create blob and download
      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `combined_report_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: "CSV file downloaded successfully",
      });
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export CSV file",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const exportToXLS = () => {
    if (reportData.size === 0) {
      toast({
        title: "No Data",
        description: "Please generate a report first",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);

    try {
      // Create HTML table for Excel
      let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head>
          <meta charset="utf-8">
          <style>
            table { border-collapse: collapse; width: 100%; margin-bottom: 30px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #2C5F8D; color: white; font-weight: bold; }
            .total-row { background-color: #f0f0f0; font-weight: bold; }
            .report-title { margin-top: 30px; margin-bottom: 10px; }
            .metadata { margin-top: 20px; }
            .metadata td { border: none; }
          </style>
        </head>
        <body>
          <h1>Combined Reports</h1>
      `;

      // Process each report type
      reportData.forEach((data, reportType) => {
        html += `
          <h2 class="report-title">${getReportTypeLabel(reportType).toUpperCase()} Report</h2>
          <table>
            <thead>
              <tr>
                <th>Category</th>`;
        
        if (reportType === "user") {
          html += `<th>Designation</th>`;
        } else if (reportType === "task") {
          html += `<th>Section</th>`;
        }
        
        html += `
                <th>Total Tasks</th>
                <th>Pending</th>
                <th>Task Initiated</th>
                <th>Completed</th>`;
        
        if (reportType === "section") {
          html += `<th>Oldest Task</th>`;
        }
        
        html += `
              </tr>
            </thead>
            <tbody>
        `;

        // Add data rows
        data.forEach((row) => {
          html += `
            <tr>
              <td>${row.category}</td>`;
          
          if (reportType === "user" && row.designation) {
            html += `<td>${row.designation}</td>`;
          } else if (reportType === "task" && row.section) {
            html += `<td>${row.section}</td>`;
          }
          
          html += `
              <td>${row.totalTasks}</td>
              <td>${row.pending}</td>
              <td>${row.taskInitiated}</td>
              <td>${row.completed}</td>`;
          
          if (reportType === "section" && row.oldestTask) {
            html += `<td>${row.oldestTask}</td>`;
          }
          
          html += `
            </tr>
          `;
        });

        // Add total row for this report type
        const totalTasks = data.reduce((sum, row) => sum + row.totalTasks, 0);
        const totalPending = data.reduce((sum, row) => sum + row.pending, 0);
        const totalInitiated = data.reduce((sum, row) => sum + row.taskInitiated, 0);
        const totalCompleted = data.reduce((sum, row) => sum + row.completed, 0);

        html += `
              <tr class="total-row">
                <td>TOTAL</td>
                <td>${totalTasks}</td>
                <td>${totalPending}</td>
                <td>${totalInitiated}</td>
                <td>${totalCompleted}</td>
              </tr>
            </tbody>
          </table>
        `;
      });

      // Add metadata
      html += `
          <div class="metadata">
            <table>
              <tr><td><strong>Report Types:</strong></td><td>${selectedReportTypes.map(t => getReportTypeLabel(t)).join(", ")}</td></tr>
      `;

      if (dateFrom) html += `<tr><td><strong>Date From:</strong></td><td>${format(dateFrom, "yyyy-MM-dd")}</td></tr>`;
      if (dateTo) html += `<tr><td><strong>Date To:</strong></td><td>${format(dateTo, "yyyy-MM-dd")}</td></tr>`;
      html += `
              <tr><td><strong>Generated On:</strong></td><td>${format(new Date(), "yyyy-MM-dd HH:mm:ss")}</td></tr>
            </table>
          </div>
        </body>
        </html>
      `;

      // Create blob and download
      const blob = new Blob([html], { type: "application/vnd.ms-excel" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `combined_report_${format(new Date(), "yyyyMMdd_HHmmss")}.xls`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: "Excel file downloaded successfully",
      });
    } catch (error) {
      console.error("Error exporting XLS:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export Excel file",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = () => {
    if (exportFormat === "csv") {
      exportToCSV();
    } else {
      exportToXLS();
    }
  };

  const getReportTypeLabel = (type: ReportType) => {
    switch (type) {
      case "section":
        return "Section";
      case "status":
        return "Status";
      case "user":
        return "User";
      case "level":
        return "Level";
      case "task":
        return "Task";
      default:
        return "";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Download Reports</h1>
        <p className="text-muted-foreground">Generate and download periodic reports in CSV or Excel format</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
          <CardDescription>Select report type, date range, and export format</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Types (Select Multiple)</label>
              <div className="border rounded-md p-4">
                <div className="flex flex-wrap gap-6">
                  {[
                    { value: "section", label: "Section-wise" },
                    { value: "status", label: "Status-wise" },
                    { value: "user", label: "User-wise" },
                    { value: "level", label: "Level-wise" },
                    { value: "task", label: "Task-wise" },
                  ].map((option) => (
                    <div key={option.value} className="flex items-center space-x-3">
                      <Checkbox
                        id={`report-${option.value}`}
                        checked={selectedReportTypes.includes(option.value as ReportType)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedReportTypes([...selectedReportTypes, option.value as ReportType]);
                          } else {
                            setSelectedReportTypes(selectedReportTypes.filter((t) => t !== option.value));
                          }
                        }}
                      />
                      <label
                        htmlFor={`report-${option.value}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date From</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date To</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex gap-4">
            <Button onClick={generateReport} disabled={loading} className="flex-1">
              Generate Report
            </Button>
            {(dateFrom || dateTo) && (
              <Button
                variant="outline"
                onClick={() => {
                  setDateFrom(undefined);
                  setDateTo(undefined);
                }}
              >
                Clear Dates
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {reportData.size > 0 && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Generated Reports</CardTitle>
                  <CardDescription>
                    {dateFrom && dateTo
                      ? `From ${format(dateFrom, "PPP")} to ${format(dateTo, "PPP")}`
                      : dateFrom
                        ? `From ${format(dateFrom, "PPP")}`
                        : dateTo
                          ? `Until ${format(dateTo, "PPP")}`
                          : "All time"}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as ExportFormat)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          CSV
                        </div>
                      </SelectItem>
                      <SelectItem value="xls">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4" />
                          Excel
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleExport} disabled={generating}>
                    <Download className="mr-2 h-4 w-4" />
                    {generating ? "Exporting..." : "Export All"}
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {Array.from(reportData.entries()).map(([reportType, data]) => (
            <Card key={reportType}>
              <CardHeader>
                <CardTitle>{getReportTypeLabel(reportType)}-wise Report</CardTitle>
                <CardDescription>{data.length} records</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{getReportTypeLabel(reportType)}</TableHead>
                      {reportType === "user" && <TableHead>Designation</TableHead>}
                      {reportType === "task" && <TableHead>Section</TableHead>}
                      <TableHead className="text-right">Total Tasks</TableHead>
                      <TableHead className="text-right">Pending</TableHead>
                      <TableHead className="text-right">Task Initiated</TableHead>
                      <TableHead className="text-right">Completed</TableHead>
                      {reportType === "section" && <TableHead>Oldest Task</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{row.category}</TableCell>
                        {reportType === "user" && <TableCell>{row.designation || "N/A"}</TableCell>}
                        {reportType === "task" && <TableCell>{row.section || "N/A"}</TableCell>}
                        <TableCell className="text-right">{row.totalTasks}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">{row.pending}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="default">{row.taskInitiated}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="default" className="bg-green-600">{row.completed}</Badge>
                        </TableCell>
                        {reportType === "section" && <TableCell>{row.oldestTask || "N/A"}</TableCell>}
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted font-bold">
                      <TableCell>TOTAL</TableCell>
                      {(reportType === "user" || reportType === "task") && <TableCell></TableCell>}
                      <TableCell className="text-right">
                        {data.reduce((sum, row) => sum + row.totalTasks, 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {data.reduce((sum, row) => sum + row.pending, 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {data.reduce((sum, row) => sum + row.taskInitiated, 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {data.reduce((sum, row) => sum + row.completed, 0)}
                      </TableCell>
                      {reportType === "section" && <TableCell></TableCell>}
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
