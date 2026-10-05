"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export type Me = { id: string; name: string; email: string; role: "HR" | "EMPLOYEE" };

const Ctx = createContext<Me | null>(null);

export function useMe() {
  const me = useContext(Ctx);
  if (!me) throw new Error("useMe must be used inside RequireUser");
  return me;
}

export function useSignOut() {
  const router = useRouter();
  return async () => {
    await api("/auth/logout", { method: "POST" });
    router.replace("/");
  };
}

export function RequireUser({ role, children }: { role: "HR" | "EMPLOYEE"; children: React.ReactNode }) {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    api("/auth/me").then(({ ok, data }) => {
      if (!ok) return router.replace("/");
      if (data.user.role !== role) return router.replace(data.user.role === "HR" ? "/hr" : "/home");
      setMe(data.user);
    });
  }, [router, role]);

  if (!me) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading...</div>;
  }
  return <Ctx.Provider value={me}>{children}</Ctx.Provider>;
}