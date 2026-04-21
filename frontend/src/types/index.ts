// ── Auth ──────────────────────────────────────────────────────────────────────

export type UserRole = "admin" | "manager" | "user";

export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  user: User;
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  user_id: string;
  assigned_to: string | null;
  due_date: string | null;
  ai_reasoning: string | null;
  ai_recommendation: string | null;
  confirmed: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskCreate {
  title: string;
  description?: string;
  priority?: TaskPriority;
  assigned_to?: string;
  due_date?: string;
  confirmed: boolean;
}

// ── Emails ────────────────────────────────────────────────────────────────────

export type EmailStatus = "draft" | "pending_confirmation" | "sent" | "failed";

export interface EmailMessage {
  id: string;
  subject: string;
  body: string;
  from_email: string;
  to_email: string;
  cc_emails: string[] | null;
  status: EmailStatus;
  user_id: string;
  ai_reasoning: string | null;
  confirmed: boolean;
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailCreate {
  subject: string;
  body: string;
  from_email: string;
  to_email: string;
  cc_emails?: string[];
  scheduled_at?: string;
  confirmed: boolean;
}

// ── Schedules ─────────────────────────────────────────────────────────────────

export type ScheduleStatus = "draft" | "pending_confirmation" | "scheduled" | "cancelled" | "completed";

export interface Schedule {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  attendees: string[] | null;
  user_id: string;
  status: ScheduleStatus;
  ai_reasoning: string | null;
  confirmed: boolean;
  recurrence: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduleCreate {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  attendees?: string[];
  confirmed: boolean;
}

// ── AI Analysis ───────────────────────────────────────────────────────────────

export interface AIAnalysis {
  reasoning: string;
  recommendation: string;
  risks: string[];
  conflicts: string[];
  confidence: number;
  confirmation_required: boolean;
  confirmation_message: string;
  task?: Task;
  email?: EmailMessage;
  schedule?: Schedule;
}

// ── Audit ─────────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// ── Knowledge ─────────────────────────────────────────────────────────────────

export interface KnowledgeResponse {
  answer: string;
  reasoning: string;
  sources: string[];
  confidence: number;
  follow_up_queries: string[];
}
