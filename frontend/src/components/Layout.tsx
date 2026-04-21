"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth";
import { Sidebar } from "./Sidebar";

export function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) router.push("/login");
  }, [isAuthenticated, router]);

  if (!isAuthenticated()) return null;

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <Sidebar />
      <main className="ml-64 flex-1 overflow-y-auto min-h-screen">
        <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
