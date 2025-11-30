export type UserRole = 'L1' | 'L2' | 'L3' | 'L4' | 'admin';
export type TaskStatus = 'pending' | 'task_initiated' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ChatType = 'individual' | 'section' | 'level';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string;
  designation: string;
  official_designation: string | null;
  role: UserRole;
  sections: string[];
  mobile_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  section: string;
  status: TaskStatus;
  priority: TaskPriority;
  created_by: string;
  assigned_to: string;
  due_date: string | null;
  completed_at: string | null;
  completion_remarks: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskStatusHistory {
  id: string;
  task_id: string;
  status: TaskStatus;
  changed_by: string;
  remarks: string | null;
  created_at: string;
}

export interface TaskTransfer {
  id: string;
  task_id: string;
  from_user: string;
  to_user: string;
  transferred_by: string;
  remarks: string | null;
  created_at: string;
}

export interface TaskAssignee {
  id: string;
  task_id: string;
  user_id: string;
  assigned_at: string;
  assigned_by: string | null;
  status: TaskStatus;
  completed_at: string | null;
  completion_remarks: string | null;
}

export interface TaskAssigneeWithProfile extends TaskAssignee {
  user?: Profile;
}

export interface TaskDocument {
  id: string;
  task_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
}

export interface TaskWithDetails extends Task {
  creator?: Profile;
  assignee?: Profile;
  assignees?: TaskAssigneeWithProfile[];
  documents?: TaskDocument[];
  status_history?: TaskStatusHistory[];
  transfers?: TaskTransfer[];
}

export const SECTIONS = [
  'ADMN',
  'Audit',
  'BOOKS',
  'BR',
  'BUDGET',
  'EFFY',
  'ESTT',
  'EX I',
  'EX II',
  'FE',
  'Fuel',
  'FX',
  'INSP',
  'IT',
  'NPS',
  'PEN',
  'PF',
  'SUSP',
  'SWindow'
] as const;

export const DESIGNATIONS = {
  L1: 'Sr.DFM',
  L2: ['ADFM I', 'ADFM II', 'ADFM III', 'ADFM IV'],
  L3: 'Sr. Section Officers',
  L4: 'Group C Staff',
  admin: 'Administrator'
} as const;

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 5,
  L1: 4,
  L2: 3,
  L3: 2,
  L4: 1
};

export interface ChatMessage {
  id: string;
  sender_id: string;
  chat_type: ChatType;
  recipient_id: string | null;
  chat_group: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface ChatMessageWithSender extends ChatMessage {
  sender?: Profile;
  recipient?: Profile;
}

export interface ChatConversation {
  type: ChatType;
  id: string;
  name: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  recipientId?: string;
  chatGroup?: string;
}

