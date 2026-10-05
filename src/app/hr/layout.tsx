"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutGrid, Users, CalendarDays, BarChart3, Flag, LogOut, Menu, X } from "lucide-react";
import { Logo, Avatar } from "@/components/ui";
import { RequireUser, useMe, useSignOut } from "@/lib/user";

const items = [
  { href: "/hr", label: "Today", icon: LayoutGrid },
  { href: "/hr/employees", label: "Employees", icon: Users },
  { href: "/hr/history", label: "History", icon: CalendarDays },
  { href: "/hr/reports", label: "Reports", icon: BarChart3 },
  { href: "/hr/holidays", label: "Holidays", icon: Flag },
 
];

function Shell({ children }: { children: React.ReactNode }) {
  const me = useMe();
  const signOut = useSignOut();
  const path = usePathname();
  const [open, setOpen] = useState(false);

  const sidebar = (
    <div className="h-full flex flex-col gap-6 p-4">
      <div className="flex items-center gap-3 px-2">
        <Logo />
        <span className="font-bold text-lg">Staff Attendance</span>
      </div>

      <nav className="flex-1 space-y-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/hr" ? path === "/hr" : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-[15px] transition ${
                active ? "bg-primary-light text-primary font-semibold" : "text-slate-600 hover:bg-slate-50 font-medium"
              }`}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 pt-4 flex items-center gap-3">
        <Avatar name={me.name} size={42} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{me.name}</p>
          <p className="text-xs text-slate-500">HR Admin</p>
        </div>
        <button
          onClick={signOut}
          aria-label="Sign out"
          className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
        >
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen md:flex">
      {/* Laptop sidebar */}
      <aside className="hidden md:block w-64 shrink-0 bg-white border-r border-slate-200 sticky top-0 h-screen">
        {sidebar}
      </aside>

      {/* Phone top bar */}
      <header className="md:hidden flex items-center justify-between bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Logo />
          <span className="font-bold">Staff Attendance</span>
        </div>
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center">
          <Menu size={20} />
        </button>
      </header>

      {/* Phone drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-72 bg-white h-full relative">
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
              <X size={16} />
            </button>
            {sidebar}
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setOpen(false)} />
        </div>
      )}

      <main className="flex-1 min-w-0 p-4 md:p-10 space-y-6">{children}</main>
    </div>
  );
}

export default function HrLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireUser role="HR">
      <Shell>{children}</Shell>
    </RequireUser>
  );
}