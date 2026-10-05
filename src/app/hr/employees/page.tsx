"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useMe } from "@/lib/user";
import { Card, Field, Button, Alert, Avatar } from "@/components/ui";

type Employee = {
  id: string;
  name: string;
  email: string;
  role: "HR" | "EMPLOYEE";
  status: "INVITED" | "ACTIVE" | "DEACTIVATED";
};

const statusStyle: Record<Employee["status"], string> = {
  ACTIVE: "bg-green-100 text-green-700",
  INVITED: "bg-amber-100 text-amber-700",
  DEACTIVATED: "bg-slate-100 text-slate-600",
};

export default function EmployeesPage() {
  const me = useMe();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"EMPLOYEE" | "HR">("EMPLOYEE");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [link, setLink] = useState("");
  const [linkFor, setLinkFor] = useState("");
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const { ok, data } = await api("/employees");
    if (ok) setEmployees(data.employees);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addEmployee(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLink("");
    setSaving(true);
    const { ok, data } = await api("/employees", { method: "POST", body: JSON.stringify({ name, email, role }) });
    setSaving(false);
    if (!ok) return setError(data.error || "Could not add employee.");
    setLink(data.inviteLink);
    setLinkFor(data.employee.name);
    setName("");
    setEmail("");
    setRole("EMPLOYEE");
    load();
  }

  async function resend(emp: Employee) {
    setError("");
    const { ok, data } = await api(`/employees/${emp.id}/resend-invite`, { method: "POST" });
    if (!ok) return setError(data.error || "Could not create a new link.");
    setLink(data.inviteLink);
    setLinkFor(emp.name);
  }

  async function changeRole(emp: Employee) {
    const next = emp.role === "HR" ? "EMPLOYEE" : "HR";
    if (!confirm(`Make ${emp.name} ${next === "HR" ? "an HR admin" : "a regular employee"}?`)) return;
    const { ok, data } = await api(`/employees/${emp.id}/role`, { method: "PATCH", body: JSON.stringify({ role: next }) });
    if (!ok) return alert(data.error || "Could not change the role.");
    load();
  }

  async function changeStatus(emp: Employee, status: "ACTIVE" | "DEACTIVATED") {
    const msg =
      status === "DEACTIVATED"
        ? `Deactivate ${emp.name}? They will be signed out and cannot sign in. Their history is kept.`
        : `Reactivate ${emp.name}?`;
    if (!confirm(msg)) return;
    const { ok, data } = await api(`/employees/${emp.id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
    if (!ok) return alert(data.error || "Could not change the status.");
    load();
  }

  async function resetPassword(emp: Employee) {
    if (!confirm(`Create a password reset link for ${emp.name}?`)) return;
    const { ok, data } = await api(`/employees/${emp.id}/reset-password`, { method: "POST" });
    if (!ok) return alert(data.error || "Could not create a reset link.");
    setLink(data.inviteLink);
    setLinkFor(emp.name);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
        <p className="text-sm text-slate-500 mt-1">Add people and send them an invite link</p>
      </div>

      <div className="grid lg:grid-cols-[380px_1fr] gap-6 items-start">
        <Card>
          <form onSubmit={addEmployee} className="space-y-4">
            <h2 className="font-semibold">Add employee</h2>
            <Field label="Full name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ade Johnson" />
            <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="ade@company.com" />
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-600">Role</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "EMPLOYEE" | "HR")}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-base"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="HR">HR</option>
              </select>
            </label>
            {error && <Alert>{error}</Alert>}
            <Button type="submit" disabled={saving}>
              {saving ? "Adding..." : "Add and create invite link"}
            </Button>
          </form>
        </Card>

        <div className="space-y-6 min-w-0">
          {link && (
            <Card className="space-y-3">
              <Alert kind="success">
                <p className="font-semibold">Link for {linkFor}</p>
                <p className="text-xs mt-0.5">Valid for 48 hours and works once. It will not be shown again.</p>
              </Alert>
              <input readOnly value={link} className="w-full border border-slate-200 rounded-2xl p-3 text-xs bg-slate-50" />
              <Button onClick={copyLink} variant="secondary">
                {copied ? "Copied" : "Copy link"}
              </Button>
            </Card>
          )}

          <Card className="p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 font-semibold">All employees ({employees.length})</div>
            <div className="divide-y divide-slate-100">
              {employees.map((emp) => {
                const isMe = emp.id === me.id;
                const act = "text-xs font-medium whitespace-nowrap";
                return (
                  <div key={emp.id} className="px-5 py-3.5 space-y-2">
                    <div className="flex items-center gap-3">
                      <Avatar name={emp.name} size={38} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {emp.name} {isMe && <span className="text-slate-400 font-normal">(you)</span>}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {emp.email} · {emp.role === "HR" ? "HR" : "Employee"}
                        </p>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle[emp.status]}`}>
                        {emp.status.charAt(0) + emp.status.slice(1).toLowerCase()}
                      </span>
                    </div>

                    {!isMe && (
                      <div className="flex flex-wrap gap-x-4 gap-y-1 pl-[50px]">
                        {emp.status === "INVITED" && (
                          <button onClick={() => resend(emp)} className={`${act} text-primary`}>
                            New link
                          </button>
                        )}
                        {emp.status === "ACTIVE" && (
                          <button onClick={() => resetPassword(emp)} className={`${act} text-primary`}>
                            Reset password
                          </button>
                        )}
                        {emp.status !== "DEACTIVATED" && (
                          <button onClick={() => changeRole(emp)} className={`${act} text-slate-600`}>
                            {emp.role === "HR" ? "Make employee" : "Make HR"}
                          </button>
                        )}
                        {emp.status === "DEACTIVATED" ? (
                          <button onClick={() => changeStatus(emp, "ACTIVE")} className={`${act} text-green-700`}>
                            Reactivate
                          </button>
                        ) : (
                          <button onClick={() => changeStatus(emp, "DEACTIVATED")} className={`${act} text-red-600`}>
                            Deactivate
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}