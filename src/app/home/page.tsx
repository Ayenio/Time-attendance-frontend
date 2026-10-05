"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, Alert } from "@/components/ui";
import { AttendanceActions } from "@/components/attendance/AttendanceActions";
import { LocationDisplay, Location } from "@/components/attendance/LocationDisplay";

type Attendance = { clockInAt: string; clockOutAt: string | null; leaveAt: string; leftEarly: boolean };

const fmt = (iso: string | Date) =>
  new Date(iso).toLocaleTimeString("en-NG", { timeZone: "Africa/Lagos", hour: "numeric", minute: "2-digit" });

function getPosition(): Promise<Location> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("This browser does not support location."));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      (err) =>
        reject(
          new Error(
            err.code === 1
              ? "Location permission was denied. Allow location for this site, then tap Retry."
              : err.code === 3
              ? "Finding your location took too long. Tap Retry."
              : "Could not get your location."
          )
        ),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

export default function EmployeeHome() {
  const [att, setAtt] = useState<Attendance | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [error, setError] = useState("");
  const [now, setNow] = useState(new Date());

  const locate = useCallback(async (): Promise<Location | null> => {
    setIsLocating(true);
    setLocError(null);
    try {
      const loc = await getPosition();
      setLocation(loc);
      return loc;
    } catch (e: any) {
      setLocation(null);
      setLocError(e.message);
      return null;
    } finally {
      setIsLocating(false);
    }
  }, []);

  useEffect(() => {
    api("/attendance/today").then(({ ok, data }) => ok && setAtt(data.attendance));
    locate();
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, [locate]);

  async function submit() {
    setError("");
    if (att && !att.clockOutAt && new Date() < new Date(att.leaveAt)) {
      const sure = confirm(
        `It is before your clock-out time (${fmt(att.leaveAt)}). Leaving now will be flagged for HR. Continue?`
      );
      if (!sure) return;
    }
    const loc = await locate();
    if (!loc) return;

    setStatus("loading");
    const { ok, data } = await api(att ? "/attendance/clock-out" : "/attendance/clock-in", {
      method: "POST",
      body: JSON.stringify(loc),
    });
    setStatus("idle");
    if (!ok) return setError(data.error || "Something went wrong.");
    setAtt(data.attendance);
  }

  const lagosIn = att ? new Date(new Date(att.clockInAt).getTime() + 60 * 60 * 1000) : null;
  const late = lagosIn ? lagosIn.getUTCHours() * 60 + lagosIn.getUTCMinutes() > 8 * 60 + 15 : false;
  const today = now.toLocaleDateString("en-NG", { timeZone: "Africa/Lagos", weekday: "long", day: "numeric", month: "long" });

  return (
    <>
      <Card className="space-y-4">
        <div className="text-center">
          <p className="text-5xl font-bold tracking-tight">{fmt(now)}</p>
          <p className="text-sm text-slate-500 mt-1">{today}</p>
        </div>

        {!att && <p className="text-center text-sm text-slate-500">You have not clocked in today.</p>}

        {att && (
          <div
            className={`rounded-2xl p-3.5 text-sm font-medium leading-snug ${
              late ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
            }`}
          >
            Clocked in {fmt(att.clockInAt)}. {late ? "You are late, so your" : "You are on time. Your"} clock-out time is{" "}
            {fmt(att.leaveAt)}.
          </div>
        )}

        {att?.clockOutAt && (
          <Alert kind="success">
            Clocked out at {fmt(att.clockOutAt)}
            {att.leftEarly ? " (before your clock-out time, flagged for HR)." : ". See you tomorrow."}
          </Alert>
        )}

        {error && <Alert>{error}</Alert>}

        <AttendanceActions
          hasCheckedIn={!!att}
          status={status}
          isDisabled={status === "loading" || isLocating || !!att?.clockOutAt}
          onSubmit={submit}
        />

        <LocationDisplay location={location} isLocating={isLocating} error={locError} onRetry={locate} />
      </Card>

      {att && (
        <Card className="flex justify-between text-sm py-4">
          <span className="text-slate-500">Required leave time</span>
          <span className="font-semibold">{fmt(att.leaveAt)}</span>
        </Card>
      )}
    </>
  );
}