"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, Field, Button, Alert } from "@/components/ui";

type Holiday = { id: string; date: string; name: string };

const pretty = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString("en-NG", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { ok, data } = await api("/days/holidays");
    if (ok) setHolidays(data.holidays);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const { ok, data } = await api("/days/holidays", { method: "POST", body: JSON.stringify({ date, name }) });
    setSaving(false);
    if (!ok) return setError(data.error || "Could not add the holiday.");
    setDate("");
    setName("");
    load();
  }

  async function remove(h: Holiday) {
    if (!confirm(`Remove ${h.name} (${pretty(h.date)})?`)) return;
    const { ok, data } = await api(`/days/holidays/${h.id}`, { method: "DELETE" });
    if (!ok) return alert(data.error || "Could not remove it.");
    load();
  }

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Holidays</h1>
        <p className="text-sm text-slate-500 mt-1">No one is marked absent on these days</p>
      </div>

      <div className="grid lg:grid-cols-[380px_1fr] gap-6 items-start">
        <Card>
          <form onSubmit={add} className="space-y-4">
            <h2 className="font-semibold">Add holiday</h2>
            <Field label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            <Field label="Name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Independence Day" />
            {error && <Alert>{error}</Alert>}
            <Button type="submit" disabled={saving}>
              {saving ? "Adding..." : "Add holiday"}
            </Button>
          </form>
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 font-semibold">All holidays ({holidays.length})</div>
          <div className="divide-y divide-slate-100">
            {holidays.map((h) => (
              <div key={h.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{h.name}</p>
                  <p className="text-xs text-slate-500">{pretty(h.date)}</p>
                </div>
                <button onClick={() => remove(h)} className="text-xs font-medium text-red-600">
                  Remove
                </button>
              </div>
            ))}
            {holidays.length === 0 && <p className="px-5 py-8 text-center text-sm text-slate-400">No holidays yet.</p>}
          </div>
        </Card>
      </div>
    </>
  );
}