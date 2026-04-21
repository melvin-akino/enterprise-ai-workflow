import axios from "axios";
import { useAuthStore } from "./auth";
import type {
  AuthToken, Task, TaskCreate, EmailMessage, EmailCreate,
  Schedule, ScheduleCreate, AIAnalysis, AuditLog, KnowledgeResponse,
} from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      if (typeof window !== "undefined") window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (username: string, password: string) =>
    api.post<AuthToken>("/auth/login", { username, password }).then((r) => r.data),
  register: (data: { email: string; username: string; password: string; full_name?: string }) =>
    api.post("/auth/register", data).then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
};

// ── Tasks ─────────────────────────────────────────────────────────────────────
export const tasksApi = {
  list: () => api.get<Task[]>("/tasks/").then((r) => r.data),
  get: (id: string) => api.get<Task>(`/tasks/${id}`).then((r) => r.data),
  create: (data: TaskCreate) => api.post<AIAnalysis>("/tasks/", data).then((r) => r.data),
  update: (id: string, data: Partial<TaskCreate>) =>
    api.put<AIAnalysis>(`/tasks/${id}`, data).then((r) => r.data),
  delete: (id: string, confirmed = false) =>
    api.delete<AIAnalysis>(`/tasks/${id}?confirmed=${confirmed}`).then((r) => r.data),
};

// ── Emails ────────────────────────────────────────────────────────────────────
export const emailsApi = {
  list: () => api.get<EmailMessage[]>("/email/").then((r) => r.data),
  get: (id: string) => api.get<EmailMessage>(`/email/${id}`).then((r) => r.data),
  create: (data: EmailCreate) => api.post<AIAnalysis>("/email/", data).then((r) => r.data),
  update: (id: string, data: Partial<EmailCreate>) =>
    api.put<AIAnalysis>(`/email/${id}`, data).then((r) => r.data),
  send: (id: string) => api.post<EmailMessage>(`/email/${id}/send`).then((r) => r.data),
};

// ── Schedules ─────────────────────────────────────────────────────────────────
export const schedulesApi = {
  list: () => api.get<Schedule[]>("/schedule/").then((r) => r.data),
  get: (id: string) => api.get<Schedule>(`/schedule/${id}`).then((r) => r.data),
  create: (data: ScheduleCreate) => api.post<AIAnalysis>("/schedule/", data).then((r) => r.data),
  update: (id: string, data: Partial<ScheduleCreate>) =>
    api.put<AIAnalysis>(`/schedule/${id}`, data).then((r) => r.data),
  delete: (id: string, confirmed = false) =>
    api.delete<AIAnalysis>(`/schedule/${id}?confirmed=${confirmed}`).then((r) => r.data),
};

// ── Knowledge ─────────────────────────────────────────────────────────────────
export const knowledgeApi = {
  query: (query: string, opts = {}) =>
    api.post<KnowledgeResponse>("/knowledge/query", { query, ...opts }).then((r) => r.data),
};

// ── Audit ─────────────────────────────────────────────────────────────────────
export const auditApi = {
  list: (params?: { resource_type?: string; action?: string; limit?: number; offset?: number }) =>
    api.get<AuditLog[]>("/audit/", { params }).then((r) => r.data),
  me: (limit = 20) => api.get<AuditLog[]>("/audit/me", { params: { limit } }).then((r) => r.data),
};
