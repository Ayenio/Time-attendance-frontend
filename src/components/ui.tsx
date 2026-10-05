import React from "react";
import { Clock, AlertCircle, CheckCircle2 } from "lucide-react";

export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  const box = size === "lg" ? "w-14 h-14 rounded-2xl" : "w-10 h-10 rounded-xl";
  return (
    <div className={`${box} bg-primary text-white flex items-center justify-center shadow-lg shadow-blue-200`}>
      <Clock size={size === "lg" ? 28 : 20} />
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-3xl border border-slate-100 shadow-sm p-6 ${className}`}>{children}</div>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const styles = {
    primary: "bg-primary text-white hover:bg-primary-hover shadow-lg shadow-blue-200",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    ghost: "text-slate-500 hover:bg-slate-100",
  }[variant];
  return (
    <button
      {...props}
      className={`w-full py-3.5 rounded-2xl font-semibold text-base transition active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 ${styles} ${className}`}
    />
  );
}

export function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <input
        {...props}
        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-base text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-blue-100 transition"
      />
    </label>
  );
}

export function Alert({ kind = "error", children }: { kind?: "error" | "success"; children: React.ReactNode }) {
  const isError = kind === "error";
  const Icon = isError ? AlertCircle : CheckCircle2;
  return (
    <div
      className={`flex items-start gap-2.5 rounded-2xl p-3.5 text-sm ${
        isError ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
      }`}
    >
      <Icon size={18} className="shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  );
}

// Centered page for sign-in style screens.
export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center text-center gap-4">
          <Logo size="lg" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="text-slate-500 mt-1.5 text-sm">{subtitle}</p>}
          </div>
        </div>
        <Card>{children}</Card>
        <p className="text-center text-xs text-slate-400">Staff Attendance</p>
      </div>
    </main>
  );
}

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const text = name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-primary text-white flex items-center justify-center font-semibold text-sm shrink-0"
    >
      {text}
    </div>
  );
}

export function ComingSoon({ title }: { title: string }) {
  return (
    <Card className="text-center space-y-1">
      <h2 className="font-semibold">{title}</h2>
      <p className="text-sm text-slate-500">This page is coming soon.</p>
    </Card>
  );
}