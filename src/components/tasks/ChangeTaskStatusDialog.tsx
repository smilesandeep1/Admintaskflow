import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { taskAssigneesApi } from "@/db/api";
import type { TaskWithDetails, TaskStatus } from "@/types/types";
import { useAuth } from "@/components/auth/AuthProvider";

interface ChangeTaskStatusDialogProps {
  task: TaskWithDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function ChangeTaskStatusDialog({
  task,
  open,
  onOpenChange,
  onSuccess,
}: ChangeTaskStatusDialogProps) {
  const { profile } = useAuth();
  const [newStatus, setNewStatus] = useState<TaskStatus>("pending");
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Get current user's status from assignees
  const currentUserAssignee = task.assignees?.find(a => a.user_id === profile?.id);
  const currentStatus = currentUserAssignee?.status || "pending";

  useEffect(() => {
    setNewStatus(currentStatus);
  }, [currentStatus, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile) {
      toast({
        title: "Error",
        description: "User profile not found.",
        variant: "destructive",
      });
      return;
    }

    // Validate remarks for completed status
    if (newStatus === "completed" && !remarks.trim()) {
      toast({
        title: "Remarks Required",
        description: "Please enter remarks when marking a task as completed.",
        variant: "destructive",
      });
      return;
    }

    // Check if status actually changed
    if (newStatus === currentStatus) {
      toast({
        title: "No Change",
        description: "Please select a different status.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await taskAssigneesApi.updateStatus(
        task.id,
        profile.id,
        newStatus,
        remarks.trim() || undefined
      );

      toast({
        title: "Status Updated",
        description: `Your task status changed to ${getStatusLabel(newStatus)}.`,
      });

      onSuccess();
      onOpenChange(false);
      setRemarks("");
    } catch (error) {
      console.error("Error updating task status:", error);
      toast({
        title: "Error",
        description: "Failed to update task status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusLabel = (status: TaskStatus): string => {
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

  const getAvailableStatuses = (): TaskStatus[] => {
    // Users can change from pending to task_initiated or completed
    // Users can change from task_initiated to completed
    if (currentStatus === "pending") {
      return ["task_initiated", "completed"];
    } else if (currentStatus === "task_initiated") {
      return ["completed"];
    }
    return [];
  };

  const availableStatuses = getAvailableStatuses();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Change Task Status</DialogTitle>
            <DialogDescription>
              Update your individual status for this task. Current status: {getStatusLabel(currentStatus)}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="status">New Status</Label>
              <Select
                value={newStatus}
                onValueChange={(value) => setNewStatus(value as TaskStatus)}
                required
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {availableStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {getStatusLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="remarks">
                Remarks {newStatus === "completed" && <span className="text-destructive">*</span>}
              </Label>
              <Textarea
                id="remarks"
                placeholder={
                  newStatus === "completed"
                    ? "Enter completion remarks (required)"
                    : "Enter remarks (optional)"
                }
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={4}
                required={newStatus === "completed"}
              />
              {newStatus === "completed" && (
                <p className="text-sm text-muted-foreground">
                  Remarks are required when marking a task as completed.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
