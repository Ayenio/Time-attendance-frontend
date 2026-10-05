"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, Field, Button, Alert, Avatar } from "@/components/ui";

type User = { id: string; name: string };
type Rec = { id: string; userId: string; clockInAt: string; clockOutAt: string | null; leaveAt: string; leftEarly: boolean };
type Mark = { userId: string; type: "ABSENT" | "LEAVE"; note: string | null };
type DayData = {
  day: string;
  isWeekend: boolean;
  holiday: { name: string } | null;
  isPast: boolean;
  isFuture: boolean;
  users: User[];
  records: Rec[];
  marks: Mark[];
};
type Editor = {
  mode: "edit" | "create";
  userId: string;
  name: string;
  recId?: string;
  clockIn: string;
  clockOut: string;
  reason: string;
};
type LogEntry = { id: string; actorName: string; action: string; createdAt: string; details: any };

const lagosToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
const fmt = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-NG", { timeZone: "Africa/Lagos", hour: "numeric", minute: "2-digit" });
const hhmm = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString("en-GB", { timeZone: "Africa/Lagos", hour: "2-digit", minute: "2-digit" }) : "";
const isLate = (r: Rec) => {
  const l = new Date(new Date(r.clockInAt).getTime() + 60 * 60 * 1000);
  return l.getUTCHours() * 60 + l.getUTCMinutes() > 8 * 60 + 15;
};

const ACTIONS: Record<string, string> = {
  ATTENDANCE_CORRECTED: "corrected a record",
  ATTENDANCE_CREATED: "added a record",
  MARKED_ABSENT: "marked absent",
  MARKED_LEAVE: "marked on leave",
  MARK_CLEARED: "cleared a mark",
  HOLIDAY_ADDED: "added a holiday",
  HOLIDAY_REMOVED: "removed a holiday",
  EMPLOYEE_ADDED: "added an employee",
  INVITE_RESENT: "sent a new invite link to",
  PASSWORD_RESET_LINK_CREATED: "created a password reset link for",
  ROLE_CHANGED: "changed the role of",
  ACCOUNT_DEACTIVATED: "deactivated",
  ACCOUNT_REACTIVATED: "reactivated",
  ACCOUNT_ACTIVATED: "finished setting up their account",
  PASSWORD_RESET_COMPLETED: "set a new password from a reset link",
  PASSWORD_CHANGED: "changed their password",
};

export default function HistoryPage() {
  const [day, setDay] = useState(lagosToday());
  const [data, setData] = useState<DayData | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [d, a] = await Promise.all([api(`/days?day=${day}`), api("/attendance/hr/audit")]);
    if (d.ok) setData(d.data);
    if (a.ok) setLogs(a.data.logs);
  }, [day]);

  useEffect(() => {
    load();
  }, [load]);

  async function mark(userId: string, type: "ABSENT" | "LEAVE") {
    const note = prompt(type === "ABSENT" ? "Note (optional):" : "Leave type or note (optional):") ?? "";
    const { ok, data: r } = await api("/days/mark", { method: "PUT", body: JSON.stringify({ userId, day, type, note }) });
    if (!ok) return alert(r.error || "Could not save.");
    load();
  }

  async function clearMark(userId: string) {
    const { ok, data: r } = await api("/days/mark/clear", { method: "POST", body: JSON.stringify({ userId, day }) });
    if (!ok) return alert(r.error || "Could not clear.");
    load();
  }

  async function saveEditor(e: React.FormEvent) {
    e.preventDefault();
    if (!editor) return;
    setError("");
    setSaving(true);
    const body =
      editor.mode === "edit"
        ? { clockIn: editor.clockIn, clockOut: editor.clockOut, reason: editor.reason }
        : { userId: editor.userId, day, clockIn: editor.clockIn, clockOut: editor.clockOut, reason: editor.reason };
    const { ok, data: r } = await api(
      editor.mode === "edit" ? `/attendance/hr/${editor.recId}/correct` : "/attendance/hr/create",
      { method: editor.mode === "edit" ? "PATCH" : "POST", body: JSON.stringify(body) }
    );
    setSaving(false);
    if (!ok) return setError(r.error || "Could not save.");
    setEditor(null);
    load();
  }

  const workingDay = data ? !data.isWeekend && !data.holiday : true;
  const recByUser = new Map((data?.records ?? []).map((r) => [r.userId, r]));
  const markByUser = new Map((data?.marks ?? []).map((m) => [m.userId, m]));
  const users = data?.users ?? [];

  const counts = {
    present: data?.records.length ?? 0,
    late: data?.records.filter(isLate).length ?? 0,
    missed: data?.isPast ? data.records.filter((r) => !r.clockOutAt).length : 0,
    absent: data?.marks.filter((m) => m.type === "ABSENT").length ?? 0,
    leave: data?.marks.filter((m) => m.type === "LEAVE").length ?? 0,
    unmarked:
      data && workingDay && data.isPast ? users.filter((u) => !recByUser.has(u.id) && !markByUser.has(u.id)).length : 0,
  };

  function badge(u: User) {
    const rec = recByUser.get(u.id);
    const mk = markByUser.get(u.id);
    if (rec) {
      if (!rec.clockOutAt && data?.isPast) return { t: "Missed clock-out", c: "bg-amber-100 text-amber-700" };
      if (rec.leftEarly) return { t: "Left early", c: "bg-orange-100 text-orange-700" };
      if (rec.clockOutAt) return { t: "Clocked out", c: "bg-blue-100 text-blue-700" };
      return { t: "Working", c: "bg-green-100 text-green-700" };
    }
    if (mk) return mk.type === "ABSENT" ? { t: "Absent", c: "bg-red-100 text-red-700" } : { t: "On leave", c: "bg-purple-100 text-purple-700" };
    if (!workingDay) return { t: "Day off", c: "bg-slate-100 text-slate-600" };
    if (data?.isFuture) return { t: "-", c: "bg-slate-100 text-slate-600" };
    return data?.isPast ? { t: "Not marked", c: "bg-amber-100 text-amber-700" } : { t: "Not in yet", c: "bg-slate-100 text-slate-600" };
  }

  const stat = [
    { l: "Present", v: counts.present, c: "text-green-700" },
    { l: "Late", v: counts.late, c: "text-red-700" },
    { l: "Missed clock-out", v: counts.missed, c: "text-amber-700" },
    { l: "Absent", v: counts.absent, c: "text-red-700" },
    { l: "On leave", v: counts.leave, c: "text-purple-700" },
    { l: "Not marked", v: counts.unmarked, c: "text-slate-700" },
  ];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">History</h1>
          <p className="text-sm text-slate-500 mt-1">Check any day, mark absences, and fix records</p>
        </div>
        <input
          type="date"
          value={day}
          max={lagosToday()}
          onChange={(e) => e.target.value && setDay(e.target.value)}
          className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-base"
        />
      </div>

      {data && !workingDay && (
        <Alert kind="success">
          {data.holiday ? `Holiday: ${data.holiday.name}.` : "This day is a weekend."} No one is marked absent.
        </Alert>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {stat.map((s) => (
          <div key={s.l} className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm">
            <p className="text-xs text-slate-500">{s.l}</p>
            <p className={`text-2xl font-bold mt-1 ${s.c}`}>{s.v}</p>
          </div>
        ))}
      </div>

      {editor && (
        <Card>
          <form onSubmit={saveEditor} className="space-y-4">
            <h2 className="font-semibold">
              {editor.mode === "edit" ? "Correct record" : "Add record"} for {editor.name}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Clock in" type="time" value={editor.clockIn} onChange={(e) => setEditor({ ...editor, clockIn: e.target.value })} required />
              <Field label="Clock out (leave empty if none)" type="time" value={editor.clockOut} onChange={(e) => setEditor({ ...editor, clockOut: e.target.value })} />
            </div>
            <Field label="Reason (required)" value={editor.reason} onChange={(e) => setEditor({ ...editor, reason: e.target.value })} required placeholder="Forgot to clock out" />
            {error && <Alert>{error}</Alert>}
            <div className="flex gap-3">
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
              <Button type="button" variant="secondary" onClick={() => setEditor(null)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 font-semibold">{day}</div>
        <div className="divide-y divide-slate-100">
          {users.map((u) => {
            const rec = recByUser.get(u.id);
            const mk = markByUser.get(u.id);
            const b = badge(u);
            const act = "text-xs font-medium whitespace-nowrap";
            return (
              <div key={u.id} className="px-5 py-3.5 space-y-2">
                <div className="flex items-center gap-3">
                  <Avatar name={u.name} size={38} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{u.name}</p>
                    <p className="text-xs text-slate-500">
                      {rec
                        ? `In ${fmt(rec.clockInAt)} · Out ${rec.clockOutAt ? fmt(rec.clockOutAt) : "-"}${isLate(rec) ? " · Late" : ""}`
                        : mk?.note || ""}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${b.c}`}>{b.t}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 pl-[50px]">
                  {rec && (
                    <button
                      className={`${act} text-primary`}
                      onClick={() => {
                        setError("");
                        setEditor({ mode: "edit", userId: u.id, name: u.name, recId: rec.id, clockIn: hhmm(rec.clockInAt), clockOut: hhmm(rec.clockOutAt), reason: "" });
                      }}
                    >
                      Edit times
                    </button>
                  )}
                  {!rec && !data?.isFuture && (
                    <button
                      className={`${act} text-primary`}
                      onClick={() => {
                        setError("");
                        setEditor({ mode: "create", userId: u.id, name: u.name, clockIn: "", clockOut: "", reason: "" });
                      }}
                    >
                      Add times
                    </button>
                  )}
                  {!rec && workingDay && !data?.isFuture && (
                    <>
                      <button className={`${act} text-red-600`} onClick={() => mark(u.id, "ABSENT")}>Mark absent</button>
                      <button className={`${act} text-purple-700`} onClick={() => mark(u.id, "LEAVE")}>Mark on leave</button>
                    </>
                  )}
                  {mk && (
                    <button className={`${act} text-slate-600`} onClick={() => clearMark(u.id)}>Clear mark</button>
                  )}
                </div>
              </div>
            );
          })}
          {users.length === 0 && <p className="px-5 py-8 text-center text-sm text-slate-400">No staff on this day.</p>}
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 font-semibold">Activity log</div>
        <div className="divide-y divide-slate-100">
          {logs.map((l) => (
            <div key={l.id} className="px-5 py-3 text-sm">
<p>
  <span className="font-semibold">{l.actorName}</span> {ACTIONS[l.action] ?? l.action}
  {l.details?.targetName && l.details.targetName !== l.actorName ? ` ${l.details.targetName}` : ""}
  {l.details?.from ? ` (${l.details.from} to ${l.details.to})` : ""}
  {l.details?.day ? ` (${l.details.day})` : ""}
</p>
              <p className="text-xs text-slate-500">
                {new Date(l.createdAt).toLocaleString("en-NG", { timeZone: "Africa/Lagos" })}
                {l.details?.reason ? ` · ${l.details.reason}` : ""}
              </p>
            </div>
          ))}
          {logs.length === 0 && <p className="px-5 py-8 text-center text-sm text-slate-400">Nothing yet.</p>}
        </div>
      </Card>
    </>
  );
}