"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", email: "", full_name: "" });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authApi.login(form.username, form.password);
      setAuth(data.access_token, data.user);
      toast.success(`Welcome back, ${data.user.username}!`);
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(msg || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.register({ ...form });
      toast.success("Account created! Please log in.");
      setTab("login");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(msg || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    background: "var(--bg3)",
    border: "1px solid var(--border2)",
    color: "var(--text)",
  };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text2)" }}>
        {label}
      </label>
      {children}
    </div>
  );

  const inputCls = "w-full rounded-lg px-3 py-2.5 text-sm outline-none";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "var(--bg)" }}>
      {/* Ambient glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "rgba(79,156,249,0.08)", filter: "blur(80px)" }}
      />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
            style={{ background: "var(--accent)", boxShadow: "0 0 40px rgba(79,156,249,0.35)" }}
          >
            ⚡
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
            AI Workflow Agent
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text2)" }}>
            Enterprise productivity powered by Claude
          </p>
        </div>

        <div className="rounded-2xl p-6" style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}>
          {/* Tabs */}
          <div className="flex rounded-lg p-1 mb-6" style={{ background: "var(--bg3)" }}>
            {(["login", "register"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className="flex-1 py-2 text-sm font-medium rounded-md transition-colors capitalize"
                style={tab === t
                  ? { background: "var(--bg2)", color: "var(--text)", boxShadow: "0 1px 4px rgba(0,0,0,0.4)" }
                  : { color: "var(--text3)" }
                }>
                {t}
              </button>
            ))}
          </div>

          {tab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <Field label="Username">
                <input required value={form.username} onChange={set("username")}
                  className={inputCls} style={inputStyle} placeholder="your_username" />
              </Field>
              <Field label="Password">
                <input required type="password" value={form.password} onChange={set("password")}
                  className={inputCls} style={inputStyle} placeholder="••••••••" />
              </Field>
              <button type="submit" disabled={loading}
                className="w-full rounded-lg py-2.5 text-sm font-semibold mt-2 disabled:opacity-50 transition-opacity"
                style={{ background: "var(--accent)", color: "#fff" }}>
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <Field label="Full Name">
                <input value={form.full_name} onChange={set("full_name")}
                  className={inputCls} style={inputStyle} placeholder="Jane Doe" />
              </Field>
              <Field label="Email">
                <input required type="email" value={form.email} onChange={set("email")}
                  className={inputCls} style={inputStyle} placeholder="jane@company.com" />
              </Field>
              <Field label="Username">
                <input required value={form.username} onChange={set("username")}
                  className={inputCls} style={inputStyle} placeholder="jane_doe" />
              </Field>
              <Field label="Password">
                <input required type="password" value={form.password} onChange={set("password")}
                  className={inputCls} style={inputStyle} placeholder="••••••••" />
              </Field>
              <button type="submit" disabled={loading}
                className="w-full rounded-lg py-2.5 text-sm font-semibold mt-2 disabled:opacity-50 transition-opacity"
                style={{ background: "var(--accent)", color: "#fff" }}>
                {loading ? "Creating account…" : "Create Account"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
