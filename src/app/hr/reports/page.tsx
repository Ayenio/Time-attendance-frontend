"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { api } from "@/lib/api";
import { Card, Button, Avatar } from "@/components/ui";

type Row = {
  id: string;
  name: string;
  email: string;
  workingDays: number;
  present: number;
  late: number;
  leftEarly: number;
  missedClockOut: number;
  absent: number;
  leave: number;
  notMarked: number;
  hours: number;
};

const thisMonth = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" }).slice(0, 7);

function shiftMonth(m: string, delta: number) {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(Date.UTC(y, mo - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

const monthLabel = (m: string) =>
  new Date(`${m}-01T12:00:00Z`).toLocaleDateString("en-NG", { timeZone: "UTC", month: "long", year: "numeric" });

const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

function downloadCsv(month: string, rows: Row[]) {
  const head = ["Name", "Email", "Working days", "Present", "Late", "Left early", "Missed clock-out", "Absent", "On leave", "Not marked", "Hours worked"];
  const lines = [head, ...rows.map((r) => [r.name, r.email, r.workingDays, r.present, r.late, r.leftEarly, r.missedClockOut, r.absent, r.leave, r.notMarked, r.hours])];
  const csv = "\uFEFF" + lines.map((l) => l.map(esc).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `attendance-${month}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [month, setMonth] = useState(thisMonth());
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { ok, data } = await api(`/reports/month?month=${month}`);
    if (ok) setRows(data.employees);
    setLoading(false);
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  const head = ["Employee", "Working days", "Present", "Late", "Left early", "Missed out", "Absent", "On leave", "Not marked", "Hours"];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-slate-500 mt-1">Monthly attendance summary</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month" className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
            <ChevronLeft size={18} />
          </button>
          <span className="font-semibold min-w-[130px] text-center">{monthLabel(month)}</span>
          <button
            onClick={() => setMonth(shiftMonth(month, 1))}
            disabled={month >= thisMonth()}
            aria-label="Next month"
            className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold">{loading ? "Loading..." : `${rows.length} employees`}</h2>
          <div className="w-44">
            <Button variant="secondary" onClick={() => downloadCsv(month, rows)} disabled={rows.length === 0} className="flex items-center justify-center gap-2 !py-2.5 text-sm">
              <Download size={16} /> Download CSV
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[860px]">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                {head.map((h) => (
                  <th key={h} className="px-3 py-3 font-semibold first:px-5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3 font-semibold whitespace-nowrap">
                      <Avatar name={r.name} size={32} />
                      {r.name}
                    </div>
                  </td>
                  <td className="px-3">{r.workingDays}</td>
                  <td className="px-3 text-green-700 font-medium">{r.present}</td>
                  <td className="px-3 text-red-700 font-medium">{r.late}</td>
                  <td className="px-3 text-orange-700">{r.leftEarly}</td>
                  <td className="px-3 text-amber-700">{r.missedClockOut}</td>
                  <td className="px-3 text-red-700 font-medium">{r.absent}</td>
                  <td className="px-3 text-purple-700">{r.leave}</td>
                  <td className="px-3 text-slate-600">{r.notMarked}</td>
                  <td className="px-3">{r.hours}</td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">No data for this month.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}