"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { api } from "@/lib/api";

type Missed = { id: string; day: string; name: string };

const dayLabel = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString("en-NG", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
  });

export function MissedBanner() {
  const [missed, setMissed] = useState<Missed[]>([]);

  useEffect(() => {
    api("/attendance/hr/missed").then(({ ok, data }) => ok && setMissed(data.missed));
  }, []);

  if (missed.length === 0) return null;

  const shown = missed.slice(0, 3).map((m) => `${m.name} (${dayLabel(m.day)})`);
  const extra = missed.length - shown.length;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-amber-50 border border-amber-200 rounded-3xl p-4">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
          <TriangleAlert size={20} />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-amber-900">
            {missed.length} missed clock-out{missed.length === 1 ? "" : "s"} from earlier days
          </p>
          <p className="text-sm text-amber-800 mt-0.5">
            {shown.join(", ")}
            {extra > 0 ? ` and ${extra} more` : ""}. Hours for these days are not counted until fixed.
          </p>
        </div>
      </div>
      <Link
        href="/hr/history"
        className="px-4 py-2.5 rounded-xl bg-amber-700 text-white text-sm font-semibold text-center whitespace-nowrap hover:bg-amber-800"
      >
        Review in History
      </Link>
    </div>
  );
}