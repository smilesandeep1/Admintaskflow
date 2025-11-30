import { useEffect, useState } from "react";
import { tasksApi, profilesApi, documentsApi, taskAssigneesApi } from "@/db/api";
import { useAuth } from "@/components/auth/AuthProvider";
import type { TaskWithDetails, Profile, TaskStatus, TaskPriority } from "@/types/types";
import { SECTIONS, ROLE_HIERARCHY } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Plus, FileText, Download, CheckCircle, ArrowRightLeft, Trash2, Eye, Edit, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import ChangeTaskStatusDialog from "@/components/tasks/ChangeTaskStatusDialog";
import { formatUserNameWithDesignation } from "@/lib/userUtils";

export default function Tasks() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [changeStatusDialogOpen, setChangeStatusDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const createForm = useForm({
    defaultValues: {
      title: "",
      description: "",
      section: "",
      priority: "medium" as TaskPriority,
      assigned_to: [] as string[],
      due_date: ""
    }
  });

  const editForm = useForm({
    defaultValues: {
      title: "",
      description: "",
      section: "",
      priority: "medium" as TaskPriority,
      status: "pending" as TaskStatus,
      assigned_to: [] as string[],
      due_date: ""
    }
  });

  // Watch the section field to filter users dynamically
  const selectedSectionInForm = createForm.watch("section");
  const selectedSectionInEditForm = editForm.watch("section");

  const completeForm = useForm({
    defaultValues: {
      remarks: ""
    }
  });

  const transferForm = useForm({
    defaultValues: {
      to_user: "",
      remarks: ""
    }
  });

  useEffect(() => {
    loadData();
  }, [selectedSection]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksData, usersData] = await Promise.all([
        tasksApi.getAll(selectedSection === "all" ? undefined : selectedSection),
        profilesApi.getAll()
      ]);
      setTasks(tasksData);
      setUsers(usersData);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load tasks"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (values: {
    title: string;
    description: string;
    section: string;
    priority: TaskPriority;
    assigned_to: string[];
    due_date: string;
  }) => {
    if (!profile) return;

    // Validate at least one assignee is selected
    if (!values.assigned_to || values.assigned_to.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select at least one assignee"
      });
      return;
    }

    try {
      setUploadingFile(true);
      
      // Create the task first with the first assignee as primary
      const newTask = await tasksApi.create({
        title: values.title,
        description: values.description || null,
        section: values.section,
        status: "pending",
        priority: values.priority,
        created_by: profile.id,
        assigned_to: values.assigned_to[0], // Use first assignee as primary
        due_date: values.due_date || null,
        completed_at: null,
        completion_remarks: null
      });

      // Add all assignees to the task_assignees table
      await taskAssigneesApi.addAssignees(newTask.id, values.assigned_to, profile.id);

      // Upload file if selected
      if (selectedFile && newTask) {
        try {
          await documentsApi.upload(newTask.id, selectedFile);
        } catch (uploadError) {
          console.error("File upload failed:", uploadError);
          toast({
            variant: "destructive",
            title: "Warning",
            description: "Task created but file upload failed"
          });
        }
      }

      toast({
        title: "Success",
        description: `Task created and assigned to ${values.assigned_to.length} user(s)`
      });

      setCreateDialogOpen(false);
      createForm.reset();
      setSelectedFile(null);
      loadData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create task"
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleCompleteTask = async (values: { remarks: string }) => {
    if (!selectedTask) return;

    try {
      await tasksApi.complete(selectedTask.id, values.remarks);
      toast({
        title: "Success",
        description: "Task marked as completed"
      });
      setCompleteDialogOpen(false);
      completeForm.reset();
      loadData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to complete task"
      });
    }
  };

  const handleTransferTask = async (values: { to_user: string; remarks: string }) => {
    if (!selectedTask) return;

    try {
      await tasksApi.transfer(
        selectedTask.id,
        selectedTask.assigned_to,
        values.to_user,
        values.remarks || undefined
      );
      toast({
        title: "Success",
        description: "Task transferred successfully"
      });
      setTransferDialogOpen(false);
      transferForm.reset();
      loadData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to transfer task"
      });
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;

    try {
      await tasksApi.delete(selectedTask.id);
      toast({
        title: "Success",
        description: "Task deleted successfully"
      });
      setDeleteDialogOpen(false);
      setSelectedTask(null);
      loadData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete task"
      });
    }
  };

  const handleEditTask = (task: TaskWithDetails) => {
    setSelectedTask(task);
    const assigneeIds = task.assignees?.map(a => a.user_id) || [];
    editForm.reset({
      title: task.title,
      description: task.description || "",
      section: task.section,
      priority: task.priority,
      status: task.status,
      assigned_to: assigneeIds,
      due_date: task.due_date ? format(new Date(task.due_date), "yyyy-MM-dd") : ""
    });
    setEditDialogOpen(true);
  };

  const handleUpdateTask = async (values: {
    title: string;
    description: string;
    section: string;
    priority: TaskPriority;
    status: TaskStatus;
    assigned_to: string[];
    due_date: string;
  }) => {
    if (!selectedTask) return;

    // Validate at least one assignee is selected
    if (!values.assigned_to || values.assigned_to.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select at least one assignee"
      });
      return;
    }

    try {
      // Update task basic info
      await tasksApi.update(selectedTask.id, {
        title: values.title,
        description: values.description || null,
        section: values.section,
        priority: values.priority,
        status: values.status,
        assigned_to: values.assigned_to[0], // Keep first assignee for backward compatibility
        due_date: values.due_date || null
      });

      // Get current assignees
      const currentAssigneeIds = selectedTask.assignees?.map(a => a.user_id) || [];
      
      // Find assignees to add and remove
      const assigneesToAdd = values.assigned_to.filter(id => !currentAssigneeIds.includes(id));
      const assigneesToRemove = currentAssigneeIds.filter(id => !values.assigned_to.includes(id));

      // Add new assignees
      if (assigneesToAdd.length > 0 && profile) {
        await taskAssigneesApi.addAssignees(selectedTask.id, assigneesToAdd, profile.id);
      }

      // Remove unselected assignees
      if (assigneesToRemove.length > 0) {
        await taskAssigneesApi.removeAssignees(selectedTask.id, assigneesToRemove);
      }

      toast({
        title: "Success",
        description: "Task updated successfully"
      });

      setEditDialogOpen(false);
      loadData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update task"
      });
    }
  };

  const handleFileUpload = async (taskId: string, file: File) => {
    try {
      setUploadingFile(true);
      await documentsApi.upload(taskId, file);
      toast({
        title: "Success",
        description: "Document uploaded successfully"
      });
      if (selectedTask?.id === taskId) {
        const updated = await tasksApi.getById(taskId);
        setSelectedTask(updated);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload document"
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDownloadDocument = async (filePath: string, fileName: string) => {
    try {
      const url = await documentsApi.getDownloadUrl(filePath);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download document"
      });
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    const variants: Record<TaskStatus, string> = {
      pending: "bg-warning text-warning-foreground",
      task_initiated: "bg-primary text-primary-foreground",
      completed: "bg-success text-success-foreground"
    };
    const labels: Record<TaskStatus, string> = {
      pending: "PENDING",
      task_initiated: "TASK INITIATED",
      completed: "COMPLETED"
    };
    return <Badge className={variants[status]}>{labels[status]}</Badge>;
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    const variants: Record<TaskPriority, string> = {
      low: "bg-muted text-muted-foreground",
      medium: "bg-primary/20 text-primary",
      high: "bg-warning/20 text-warning",
      urgent: "bg-destructive/20 text-destructive"
    };
    return <Badge className={variants[priority]}>{priority.toUpperCase()}</Badge>;
  };

  const getAssigneeStatusColor = (status: TaskStatus) => {
    const colors = {
      completed: "bg-green-700 text-white font-semibold px-1 rounded",
      task_initiated: "bg-yellow-300 text-black font-semibold px-1 rounded",
      pending: "bg-red-700 text-white font-semibold px-1 rounded"
    };
    return colors[status];
  };

  const getAggregateStatus = (task: TaskWithDetails): TaskStatus => {
    // For Admin, L1, and L2 users, show aggregate status
    if (profile && ['admin', 'L1', 'L2'].includes(profile.role)) {
      if (!task.assignees || task.assignees.length === 0) {
        return task.status;
      }
      
      const allCompleted = task.assignees.every(a => a.status === 'completed');
      if (allCompleted) return 'completed';
      
      const anyInitiated = task.assignees.some(a => a.status === 'task_initiated');
      if (anyInitiated) return 'task_initiated';
      
      return 'pending';
    }
    
    // For L3 and L4 users, show their individual status
    if (profile && task.assignees) {
      const userAssignee = task.assignees.find(a => a.user_id === profile.id);
      if (userAssignee) {
        return userAssignee.status;
      }
    }
    
    return task.status;
  };

  const canAssignToUser = (targetUser: Profile) => {
    if (!profile) return false;
    const userLevel = ROLE_HIERARCHY[profile.role];
    const targetLevel = ROLE_HIERARCHY[targetUser.role];
    return userLevel > targetLevel;
  };

  const assignableUsers = users.filter(canAssignToUser);

  // Filter users by selected section in create form
  const assignableUsersBySection = selectedSectionInForm
    ? assignableUsers.filter(user => user.sections.includes(selectedSectionInForm))
    : [];

  // Filter users by selected section in edit form
  const assignableUsersBySectionInEdit = selectedSectionInEditForm
    ? assignableUsers.filter(user => user.sections.includes(selectedSectionInEditForm))
    : assignableUsers;

  // Filter users by task section in transfer dialog
  const assignableUsersBySectionInTransfer = selectedTask
    ? assignableUsers.filter(user => user.sections.includes(selectedTask.section))
    : assignableUsers;

  const userSections = profile?.sections || [];
  const availableSections = profile?.role === "admin" || profile?.role === "L1" 
    ? SECTIONS 
    : SECTIONS.filter(s => userSections.includes(s));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground mt-1">Manage and track all tasks</p>
        </div>
        {profile?.role !== 'L4' && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>Fill in the details to create a new task</DialogDescription>
              </DialogHeader>
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(handleCreateTask)} className="space-y-4">
                  <FormField
                    control={createForm.control}
                    name="title"
                    rules={{ required: "Title is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter task title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Enter task description" rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="section"
                    rules={{ required: "Section is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Section</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Reset assigned_to when section changes
                            createForm.setValue("assigned_to", []);
                          }} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select section" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableSections.map((section) => (
                              <SelectItem key={section} value={section}>
                                {section}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={createForm.control}
                  name="assigned_to"
                  rules={{ 
                    validate: (value) => {
                      if (!value || value.length === 0) {
                        return "Please select at least one assignee";
                      }
                      return true;
                    }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign To (Select Multiple Users)</FormLabel>
                      {!selectedSectionInForm ? (
                        <p className="text-sm text-muted-foreground">Please select a section first</p>
                      ) : assignableUsersBySection.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No users available in this section</p>
                      ) : (
                        <div className="border rounded-md p-4 max-h-60 overflow-y-auto space-y-3">
                          {assignableUsersBySection.map((user) => (
                            <div key={user.id} className="flex items-start space-x-3">
                              <Checkbox
                                id={`user-${user.id}`}
                                checked={field.value?.includes(user.id)}
                                onCheckedChange={(checked) => {
                                  const currentValue = field.value || [];
                                  if (checked) {
                                    field.onChange([...currentValue, user.id]);
                                  } else {
                                    field.onChange(currentValue.filter((id: string) => id !== user.id));
                                  }
                                }}
                              />
                              <label
                                htmlFor={`user-${user.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {formatUserNameWithDesignation(user.full_name, user.official_designation)} - {user.designation}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="due_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* File Upload Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Attach File (Optional)</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Check file size (1MB limit)
                          if (file.size > 1024 * 1024) {
                            toast({
                              variant: "destructive",
                              title: "File too large",
                              description: "File size must be less than 1MB"
                            });
                            e.target.value = "";
                            return;
                          }
                          setSelectedFile(file);
                        }
                      }}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
                      className="flex-1"
                    />
                    {selectedFile && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFile(null);
                          const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                          if (fileInput) fileInput.value = "";
                        }}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  {selectedFile && (
                    <p className="text-xs text-muted-foreground">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Supported formats: PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG (Max 1MB)
                  </p>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => {
                    setCreateDialogOpen(false);
                    setSelectedFile(null);
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={uploadingFile}>
                    {uploadingFile ? "Creating..." : "Create Task"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Edit Task Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update task details, status, priority, or reassign</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdateTask)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="title"
                rules={{ required: "Title is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter task title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Enter task description" rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="section"
                  rules={{ required: "Section is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select section" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SECTIONS.map((section) => (
                            <SelectItem key={section} value={section}>
                              {section}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="task_initiated">Task Initiated</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="assigned_to"
                  rules={{ 
                    required: "At least one assignee is required",
                    validate: (value) => value.length > 0 || "Please select at least one assignee"
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign To (Multiple Selection)</FormLabel>
                      <div className="border rounded-md p-4 max-h-48 overflow-y-auto space-y-3">
                        {assignableUsersBySectionInEdit.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No users available in this section</p>
                        ) : (
                          assignableUsersBySectionInEdit
                            .sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""))
                            .map((user) => (
                              <div key={user.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`edit-assignee-${user.id}`}
                                  checked={field.value.includes(user.id)}
                                  onCheckedChange={(checked) => {
                                    const newValue = checked
                                      ? [...field.value, user.id]
                                      : field.value.filter((id: string) => id !== user.id);
                                    field.onChange(newValue);
                                  }}
                                />
                                <label
                                  htmlFor={`edit-assignee-${user.id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                  {formatUserNameWithDesignation(user.full_name || user.email, user.official_designation)} - {user.designation || user.role}
                                </label>
                              </div>
                            ))
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Task</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedSection === "all" ? "default" : "outline"}
          onClick={() => setSelectedSection("all")}
          size="sm"
        >
          All Sections
        </Button>
        {availableSections.map((section) => (
          <Button
            key={section}
            variant={selectedSection === section ? "default" : "outline"}
            onClick={() => setSelectedSection(section)}
            size="sm"
          >
            {section}
          </Button>
        ))}
      </div>

      {profile && ['admin', 'L1', 'L2'].includes(profile.role) && (
        <Card className="bg-muted/50">
          <CardContent className="py-3">
            <div className="flex items-center gap-6 flex-wrap">
              <span className="text-sm font-medium text-muted-foreground">Assignee Status Legend:</span>
              <div className="flex items-center gap-2">
                <span className="bg-green-700 text-white font-semibold px-2 py-1 rounded text-xs">
                  Completed
                </span>
                <span className="text-xs text-muted-foreground">Task completed by assignee</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-yellow-300 text-black font-semibold px-2 py-1 rounded text-xs">
                  Task Initiated
                </span>
                <span className="text-xs text-muted-foreground">Work in progress</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-red-700 text-white font-semibold px-2 py-1 rounded text-xs">
                  Pending
                </span>
                <span className="text-xs text-muted-foreground">Not yet started</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No tasks found</p>
            </CardContent>
          </Card>
        ) : (
          tasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {getStatusBadge(getAggregateStatus(task))}
                      {getPriorityBadge(task.priority)}
                      <Badge variant="outline">{task.section}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTask(task);
                        setViewDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {(() => {
                      const userAssignee = task.assignees?.find(a => a.user_id === profile?.id);
                      const isAssignee = userAssignee !== undefined;
                      const userStatus = userAssignee?.status || "pending";
                      return isAssignee && userStatus !== "completed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTask(task);
                            setChangeStatusDialogOpen(true);
                          }}
                          title="Change Status"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      );
                    })()}
                    {(profile?.role === "admin" || profile?.role === "L1") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTask(task)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {task.status !== "completed" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTask(task);
                            setCompleteDialogOpen(true);
                          }}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTask(task);
                            setTransferDialogOpen(true);
                          }}
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {(profile?.role === "admin" || profile?.role === "L1") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTask(task);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {task.description && (
                    <p className="text-muted-foreground">{task.description}</p>
                  )}
                  <div className="flex gap-4 flex-wrap">
                    <div>
                      <span className="font-medium">Created by:</span> {formatUserNameWithDesignation(task.creator?.full_name, task.creator?.official_designation)}
                    </div>
                    <div>
                      <span className="font-medium">Assigned to:</span>{" "}
                      {task.assignees && task.assignees.length > 0 ? (
                        <span>
                          {task.assignees.map((assignee, index) => (
                            <span key={assignee.id}>
                              <span className={profile && ['admin', 'L1', 'L2'].includes(profile.role) ? getAssigneeStatusColor(assignee.status) : ""}>
                                {formatUserNameWithDesignation(assignee.user?.full_name, assignee.user?.official_designation)}
                              </span>
                              {index < task.assignees.length - 1 ? ", " : ""}
                            </span>
                          ))}
                        </span>
                      ) : (
                        formatUserNameWithDesignation(task.assignee?.full_name, task.assignee?.official_designation)
                      )}
                    </div>
                    {task.due_date && (
                      <div>
                        <span className="font-medium">Due:</span>{" "}
                        {format(new Date(task.due_date), "MMM dd, yyyy")}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
            <DialogDescription>Task Details</DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{selectedTask.description || "No description"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-1">Status</h3>
                  {getStatusBadge(selectedTask.status)}
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Priority</h3>
                  {getPriorityBadge(selectedTask.priority)}
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Section</h3>
                  <Badge variant="outline">{selectedTask.section}</Badge>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Created</h3>
                  <p className="text-sm">{format(new Date(selectedTask.created_at), "MMM dd, yyyy HH:mm")}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Documents</h3>
                <div className="space-y-2">
                  {selectedTask.documents && selectedTask.documents.length > 0 ? (
                    selectedTask.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">{doc.file_name}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadDocument(doc.file_path, doc.file_name)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No documents attached</p>
                  )}
                  {profile?.role !== "L4" && (
                    <div>
                      <Input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(selectedTask.id, file);
                        }}
                        disabled={uploadingFile}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Task</DialogTitle>
            <DialogDescription>Add remarks for task completion</DialogDescription>
          </DialogHeader>
          <Form {...completeForm}>
            <form onSubmit={completeForm.handleSubmit(handleCompleteTask)} className="space-y-4">
              <FormField
                control={completeForm.control}
                name="remarks"
                rules={{ required: "Remarks are required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Completion Remarks</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Enter completion remarks" rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCompleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Complete Task</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Task</DialogTitle>
            <DialogDescription>Transfer this task to another user</DialogDescription>
          </DialogHeader>
          <Form {...transferForm}>
            <form onSubmit={transferForm.handleSubmit(handleTransferTask)} className="space-y-4">
              <FormField
                control={transferForm.control}
                name="to_user"
                rules={{ required: "Please select a user" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transfer To</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select user" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {assignableUsersBySectionInTransfer
                          .sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""))
                          .map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {formatUserNameWithDesignation(user.full_name, user.official_designation)} - {user.designation}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={transferForm.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks (Optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Enter transfer remarks" rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setTransferDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Transfer Task</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedTask && (
        <ChangeTaskStatusDialog
          task={selectedTask}
          open={changeStatusDialogOpen}
          onOpenChange={setChangeStatusDialogOpen}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}
