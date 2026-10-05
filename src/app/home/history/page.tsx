"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui";

type Day = {
  day: string;
  status: "PRESENT" | "LATE" | "ABSENT" | "LEAVE" | "HOLIDAY" | "NOT_MARKED" | "PENDING";
  note: string | null;
  clockInAt: string | null;
  clockOutAt: string | null;
  leftEarly: boolean;
  missedClockOut: boolean;
  hours: number;
};
type Summary = { workingDays: number; present: number; late: number; absent: number; leave: number; hours: number };

const thisMonth = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" }).slice(0, 7);

function shiftMonth(m: string, delta: number) {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(Date.UTC(y, mo - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

const monthLabel = (m: string) =>
  new Date(`${m}-01T12:00:00Z`).toLocaleDateString("en-NG", { timeZone: "UTC", month: "long", year: "numeric" });
const dayLabel = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString("en-NG", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" });
const fmt = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-NG", { timeZone: "Africa/Lagos", hour: "numeric", minute: "2-digit" });

const BADGE: Record<Day["status"], { t: string; c: string }> = {
  PRESENT: { t: "On time", c: "bg-green-100 text-green-700" },
  LATE: { t: "Late", c: "bg-red-100 text-red-700" },
  ABSENT: { t: "Absent", c: "bg-red-100 text-red-700" },
  LEAVE: { t: "On leave", c: "bg-purple-100 text-purple-700" },
  HOLIDAY: { t: "Holiday", c: "bg-slate-100 text-slate-600" },
  NOT_MARKED: { t: "Not marked", c: "bg-amber-100 text-amber-700" },
  PENDING: { t: "Today", c: "bg-slate-100 text-slate-600" },
};

export default function MyHistoryPage() {
  const [month, setMonth] = useState(thisMonth());
  const [days, setDays] = useState<Day[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { ok, data } = await api(`/me/history?month=${month}`);
    if (ok) {
      setDays(data.days);
      setSummary(data.summary);
    }
    setLoading(false);
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  const isCurrent = month >= thisMonth();

  return (
    <>
      <div className="flex items-center justify-between">
        <button onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month" className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
          <ChevronLeft size={18} />
        </button>
        <h1 className="font-bold text-lg">{monthLabel(month)}</h1>
        <button
          onClick={() => setMonth(shiftMonth(month, 1))}
          disabled={isCurrent}
          aria-label="Next month"
          className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { l: "Days present", v: `${summary.present} / ${summary.workingDays}`, c: "text-green-700" },
            { l: "Late", v: summary.late, c: "text-red-700" },
            { l: "Absent", v: summary.absent, c: "text-red-700" },
            { l: "On leave", v: summary.leave, c: "text-purple-700" },
          ].map((s) => (
            <div key={s.l} className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm">
              <p className="text-xs text-slate-500">{s.l}</p>
              <p className={`text-2xl font-bold mt-1 ${s.c}`}>{s.v}</p>
            </div>
          ))}
        </div>
      )}

      <Card className="p-0 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {days.map((d) => {
            const b = BADGE[d.status];
            const details = d.clockInAt
              ? `In ${fmt(d.clockInAt)} · Out ${d.clockOutAt ? fmt(d.clockOutAt) : "-"}${d.hours ? ` · ${d.hours.toFixed(1)} h` : ""}`
              : d.note || "";
            return (
              <div key={d.day} className="flex items-center gap-3 px-4 py-3.5">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{dayLabel(d.day)}</p>
                  <p className="text-xs text-slate-500 truncate">{details}</p>
                  {(d.leftEarly || d.missedClockOut) && (
                    <p className="text-xs text-amber-700 mt-0.5">{d.missedClockOut ? "Missed clock-out" : "Left early"}</p>
                  )}
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${b.c}`}>{b.t}</span>
              </div>
            );
          })}
          {!loading && days.length === 0 && <p className="px-5 py-8 text-center text-sm text-slate-400">No days to show yet.</p>}
        </div>
      </Card>
    </>
  );
}