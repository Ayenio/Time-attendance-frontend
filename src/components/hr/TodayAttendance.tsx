"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Avatar } from "@/components/ui";

type User = { id: string; name: string; email: string; role: string };
type AttendanceRecord = {
  id: string;
  userId: string;
  clockInAt: string;
  clockOutAt: string | null;
  leaveAt: string;
  leftEarly: boolean;
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-NG", { timeZone: "Africa/Lagos", hour: "numeric", minute: "2-digit" });

// Late = clocked in after 8:15 Lagos time (based on clock-in, so waivers don't hide it).
const isLate = (r: AttendanceRecord) => {
  const l = new Date(new Date(r.clockInAt).getTime() + 60 * 60 * 1000);
  return l.getUTCHours() * 60 + l.getUTCMinutes() > 8 * 60 + 15;
};

export function TodayAttendance() {
  const [users, setUsers] = useState<User[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { ok, data } = await api("/attendance/hr/today");
    if (ok) {
      setUsers(data.users);
      setRecords(data.records);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function changeLeave(id: string, hour: number) {
    const { ok, data } = await api(`/attendance/hr/${id}/leave-at`, {
      method: "PATCH",
      body: JSON.stringify({ hour }),
    });
    if (!ok) return alert(data.error || "Could not change the leave time.");
    load();
  }

  const byUser = new Map(records.map((r) => [r.userId, r]));
  const rows = users.map((u) => ({ user: u, rec: byUser.get(u.id) }));

  const clockedIn = rows.filter((r) => r.rec).length;
  const late = rows.filter((r) => r.rec && isLate(r.rec)).length;
  const notIn = rows.length - clockedIn;
  const leftEarly = rows.filter((r) => r.rec?.leftEarly).length;

  function status(rec?: AttendanceRecord) {
    if (!rec) return { text: "Not in", cls: "bg-slate-100 text-slate-600" };
    if (rec.leftEarly) return { text: "Left early", cls: "bg-orange-100 text-orange-700" };
    if (rec.clockOutAt) return { text: "Clocked out", cls: "bg-blue-100 text-blue-700" };
    if (isLate(rec)) return { text: "Late", cls: "bg-red-100 text-red-700" };
    return { text: "On time", cls: "bg-green-100 text-green-700" };
  }

  const stats = [
    { label: "Clocked in", value: clockedIn, color: "text-green-700" },
    { label: "Late", value: late, color: "text-red-700" },
    { label: "Not in yet", value: notIn, color: "text-slate-700" },
    { label: "Left early", value: leftEarly, color: "text-orange-700" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold">Attendance</h2>
          <button onClick={load} className="text-sm text-primary font-medium">
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-3 py-3 font-semibold">Clock in</th>
                <th className="px-3 py-3 font-semibold">Leave at</th>
                <th className="px-3 py-3 font-semibold">Clock out</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Set leave time</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ user, rec }) => {
                const s = status(rec);
                return (
                  <tr key={user.id} className="border-t border-slate-100">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3 font-semibold whitespace-nowrap">
                        <Avatar name={user.name} size={34} />
                        {user.name}
                      </div>
                    </td>
                    <td className="px-3 whitespace-nowrap">{rec ? fmt(rec.clockInAt) : "-"}</td>
                    <td className="px-3 whitespace-nowrap">{rec ? fmt(rec.leaveAt) : "-"}</td>
                    <td className="px-3 whitespace-nowrap">{rec?.clockOutAt ? fmt(rec.clockOutAt) : "-"}</td>
                    <td className="px-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${s.cls}`}>{s.text}</span>
                    </td>
                    <td className="px-5">
                      {rec && (
                        <select
                          value={new Date(rec.leaveAt).getUTCHours() + 1}
                          onChange={(e) => changeLeave(rec.id, Number(e.target.value))}
                          className="border border-slate-200 rounded-xl px-2 py-1.5 text-xs bg-white"
                        >
                          <option value={17}>5:00 PM</option>
                          <option value={18}>6:00 PM</option>
                          <option value={19}>7:00 PM</option>
                          <option value={20}>8:00 PM</option>
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No active employees yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}