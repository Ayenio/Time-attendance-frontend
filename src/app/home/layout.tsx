"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, CalendarDays, User, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui";
import { RequireUser, useMe, useSignOut } from "@/lib/user";

const tabs = [
  { href: "/home", label: "Home", icon: Clock },
  { href: "/home/history", label: "History", icon: CalendarDays },
  { href: "/home/profile", label: "Profile", icon: User },
];

function Shell({ children }: { children: React.ReactNode }) {
  const me = useMe();
  const signOut = useSignOut();
  const path = usePathname();

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto">
      <div className="flex-1 p-5 space-y-4">
        <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-3xl p-3 shadow-sm">
          <Avatar name={me.name} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{me.name}</p>
            <p className="text-xs text-slate-500">Employee</p>
          </div>
          <button
            onClick={signOut}
            aria-label="Sign out"
            className="w-11 h-11 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center"
          >
            <LogOut size={18} />
          </button>
        </div>
        {children}
      </div>

      <nav className="sticky bottom-0 bg-white border-t border-slate-200 flex px-3 pt-2 pb-5">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-1.5 text-xs ${
                active ? "text-primary font-semibold" : "text-slate-500 font-medium"
              }`}
            >
              <Icon size={22} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireUser role="EMPLOYEE">
      <Shell>{children}</Shell>
    </RequireUser>
  );
}