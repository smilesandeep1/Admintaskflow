import { supabase } from "./supabase";
import type { Profile, Task, TaskDocument, TaskStatusHistory, TaskTransfer, TaskWithDetails, ChatMessage, ChatMessageWithSender, ChatType } from "@/types/types";

export const profilesApi = {
  async getAll(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("full_name", { ascending: true });
    
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async getById(id: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  async getCurrent(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    return this.getById(user.id);
  },

  async update(id: string, updates: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error("Profile not found");
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
  }
};

export const tasksApi = {
  async getAll(section?: string): Promise<TaskWithDetails[]> {
    let query = supabase
      .from("tasks")
      .select(`
        *,
        creator:created_by(id, full_name, designation, official_designation, role),
        assignee:assigned_to(id, full_name, designation, official_designation, role)
      `)
      .order("created_at", { ascending: false });
    
    if (section) {
      query = query.eq("section", section);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Fetch assignees for each task
    const tasksWithAssignees = await Promise.all(
      (data || []).map(async (task) => {
        const assignees = await taskAssigneesApi.getByTaskId(task.id);
        return { ...task, assignees };
      })
    );
    
    return tasksWithAssignees;
  },

  async getById(id: string): Promise<TaskWithDetails | null> {
    const { data, error } = await supabase
      .from("tasks")
      .select(`
        *,
        creator:created_by(id, full_name, designation, official_designation, role),
        assignee:assigned_to(id, full_name, designation, official_designation, role),
        documents:task_documents(*),
        status_history:task_status_history(*, changed_by(full_name)),
        transfers:task_transfers(*, from_user(full_name), to_user(full_name), transferred_by(full_name))
      `)
      .eq("id", id)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  async create(task: Omit<Task, "id" | "created_at" | "updated_at">): Promise<Task> {
    const { data, error } = await supabase
      .from("tasks")
      .insert(task)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error("Failed to create task");
    return data;
  },

  async update(id: string, updates: Partial<Task>): Promise<Task> {
    const { data, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error("Task not found");
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
  },

  async complete(id: string, remarks: string): Promise<Task> {
    return this.update(id, {
      status: "completed",
      completed_at: new Date().toISOString(),
      completion_remarks: remarks
    });
  },

  async updateTaskStatus(id: string, status: Task["status"], remarks?: string): Promise<Task> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const updates: Partial<Task> = { status };
    
    if (status === "completed") {
      updates.completed_at = new Date().toISOString();
      if (remarks) {
        updates.completion_remarks = remarks;
      }
    }

    const { data, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error("Task not found");

    // Record status change in history
    const { error: historyError } = await supabase
      .from("task_status_history")
      .insert({
        task_id: id,
        old_status: data.status,
        new_status: status,
        changed_by: user.id,
        remarks
      });
    
    if (historyError) console.error("Failed to record status history:", historyError);

    return data;
  },

  async transfer(taskId: string, fromUserId: string, toUserId: string, remarks?: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error: transferError } = await supabase
      .from("task_transfers")
      .insert({
        task_id: taskId,
        from_user: fromUserId,
        to_user: toUserId,
        transferred_by: user.id,
        remarks
      });
    
    if (transferError) throw transferError;

    const { error: updateError } = await supabase
      .from("tasks")
      .update({ assigned_to: toUserId })
      .eq("id", taskId);
    
    if (updateError) throw updateError;
  }
};

export const taskAssigneesApi = {
  async addAssignees(taskId: string, userIds: string[], assignedBy: string): Promise<void> {
    const assignees = userIds.map(userId => ({
      task_id: taskId,
      user_id: userId,
      assigned_by: assignedBy
    }));

    const { error } = await supabase
      .from("task_assignees")
      .insert(assignees);
    
    if (error) throw error;
  },

  async removeAssignees(taskId: string, userIds?: string[]): Promise<void> {
    let query = supabase
      .from("task_assignees")
      .delete()
      .eq("task_id", taskId);
    
    if (userIds && userIds.length > 0) {
      query = query.in("user_id", userIds);
    }
    
    const { error } = await query;
    if (error) throw error;
  },

  async getByTaskId(taskId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from("task_assignees")
      .select(`
        *,
        user:user_id(id, full_name, designation, official_designation, role, sections)
      `)
      .eq("task_id", taskId);
    
    if (error) throw error;
    
    return Array.isArray(data) ? data : [];
  },

  async updateStatus(taskId: string, userId: string, status: string, remarks?: string): Promise<void> {
    const { error } = await supabase.rpc("update_assignee_status", {
      p_task_id: taskId,
      p_user_id: userId,
      p_status: status,
      p_remarks: remarks || null
    });
    
    if (error) throw error;
  }
};

export const documentsApi = {
  async getByTaskId(taskId: string): Promise<TaskDocument[]> {
    const { data, error } = await supabase
      .from("task_documents")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });
    
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async upload(taskId: string, file: File): Promise<TaskDocument> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const fileExt = file.name.split('.').pop();
    const fileName = `${taskId}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from("app-7oowe77h6v41_task_documents")
      .upload(fileName, file);
    
    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from("task_documents")
      .insert({
        task_id: taskId,
        file_name: file.name,
        file_path: fileName,
        file_size: file.size,
        uploaded_by: user.id
      })
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error("Failed to save document metadata");
    return data;
  },

  async getDownloadUrl(filePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from("app-7oowe77h6v41_task_documents")
      .createSignedUrl(filePath, 3600);
    
    if (error) throw error;
    if (!data?.signedUrl) throw new Error("Failed to generate download URL");
    return data.signedUrl;
  },

  async delete(id: string, filePath: string): Promise<void> {
    const { error: storageError } = await supabase.storage
      .from("app-7oowe77h6v41_task_documents")
      .remove([filePath]);
    
    if (storageError) throw storageError;

    const { error: dbError } = await supabase
      .from("task_documents")
      .delete()
      .eq("id", id);
    
    if (dbError) throw dbError;
  }
};

export const statusHistoryApi = {
  async getByTaskId(taskId: string): Promise<TaskStatusHistory[]> {
    const { data, error } = await supabase
      .from("task_status_history")
      .select(`
        *,
        changed_by_user:changed_by(full_name)
      `)
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });
    
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async create(history: Omit<TaskStatusHistory, "id" | "created_at">): Promise<TaskStatusHistory> {
    const { data, error } = await supabase
      .from("task_status_history")
      .insert(history)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error("Failed to create status history");
    return data;
  }
};

export const transfersApi = {
  async getByTaskId(taskId: string): Promise<TaskTransfer[]> {
    const { data, error } = await supabase
      .from("task_transfers")
      .select(`
        *,
        from_user_profile:from_user(full_name),
        to_user_profile:to_user(full_name),
        transferred_by_profile:transferred_by(full_name)
      `)
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });
    
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async create(transfer: Omit<TaskTransfer, "id" | "created_at">): Promise<TaskTransfer> {
    const { data, error } = await supabase
      .from("task_transfers")
      .insert(transfer)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error("Failed to create transfer record");
    return data;
  }
};

export const reportsApi = {
  async getTaskStats() {
    const { data, error } = await supabase
      .from("tasks")
      .select("status, section");
    
    if (error) throw error;
    
    const tasks = Array.isArray(data) ? data : [];
    
    const statusCounts = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const sectionCounts = tasks.reduce((acc, task) => {
      acc[task.section] = (acc[task.section] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total: tasks.length,
      byStatus: statusCounts,
      bySection: sectionCounts
    };
  },

  async getUserActivity() {
    const { data, error } = await supabase
      .from("tasks")
      .select(`
        created_by,
        assigned_to,
        creator:created_by(full_name),
        assignee:assigned_to(full_name)
      `);
    
    if (error) throw error;
    
    const tasks = Array.isArray(data) ? data : [];
    
    const createdCounts = tasks.reduce((acc, task) => {
      const creator = task.creator as unknown as { full_name: string } | null;
      const name = creator?.full_name || 'Unknown';
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const assignedCounts = tasks.reduce((acc, task) => {
      const assignee = task.assignee as unknown as { full_name: string } | null;
      const name = assignee?.full_name || 'Unknown';
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      created: createdCounts,
      assigned: assignedCounts
    };
  }
};

export const chatApi = {
  async sendMessage(
    chatType: ChatType,
    message: string,
    recipientId?: string,
    chatGroup?: string
  ): Promise<ChatMessage> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const messageData: Partial<ChatMessage> = {
      sender_id: user.id,
      chat_type: chatType,
      message,
      recipient_id: recipientId || null,
      chat_group: chatGroup || null,
    };

    const { data, error } = await supabase
      .from("chat_messages")
      .insert(messageData)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Failed to send message");
    return data;
  },

  async getMessages(
    chatType: ChatType,
    recipientId?: string,
    chatGroup?: string,
    limit = 50
  ): Promise<ChatMessageWithSender[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    let query = supabase
      .from("chat_messages")
      .select(`
        *,
        sender:profiles!chat_messages_sender_id_fkey(*)
      `)
      .eq("chat_type", chatType)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (chatType === "individual" && recipientId) {
      query = query.or(
        `and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`
      );
    } else if (chatType === "section" && chatGroup) {
      query = query.eq("chat_group", chatGroup);
    } else if (chatType === "level" && chatGroup) {
      query = query.eq("chat_group", chatGroup);
    }

    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;

    const { data: messages, error: messagesError } = await query;
    if (messagesError) throw messagesError;

    return Array.isArray(messages) ? messages : [];
  },

  async markAsRead(messageIds: string[]): Promise<void> {
    const { error } = await supabase
      .from("chat_messages")
      .update({ is_read: true })
      .in("id", messageIds);

    if (error) throw error;
  },

  async getUnreadCount(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data, error } = await supabase.rpc("get_unread_chat_count", {
      user_id: user.id,
    });

    if (error) throw error;
    return data || 0;
  },

  async getUsersInSections(sections: string[]): Promise<Profile[]> {
    if (!sections || sections.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .overlaps("sections", sections)
      .order("full_name", { ascending: true });

    if (error) {
      console.error("Error fetching users in sections:", error);
      throw error;
    }
    return Array.isArray(data) ? data : [];
  },

  async getUsersByLevel(level: string): Promise<Profile[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", level)
      .order("full_name", { ascending: true });

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async deleteAllMessages(): Promise<void> {
    const { error } = await supabase
      .from("chat_messages")
      .delete()
      .not("id", "is", null);

    if (error) throw error;
  },
};

