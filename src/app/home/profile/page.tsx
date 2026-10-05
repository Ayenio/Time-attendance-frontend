"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useMe } from "@/lib/user";
import { Card, Field, Button, Alert, Avatar } from "@/components/ui";

const DAY_MS = 24 * 60 * 60 * 1000;

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-NG", { timeZone: "Africa/Lagos", dateStyle: "medium", timeStyle: "short" });

export default function ProfilePage() {
  const me = useMe();
  const [changedAt, setChangedAt] = useState<string | null | undefined>(undefined);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadSecurity = useCallback(async () => {
    const { ok, data } = await api("/me/security");
    if (ok) setChangedAt(data.passwordChangedAt);
  }, []);

  useEffect(() => {
    loadSecurity();
  }, [loadSecurity]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setDone(false);
    if (next.length < 8) return setError("New password must be at least 8 characters.");
    if (next !== confirmPw) return setError("The two new passwords do not match.");

    setSaving(true);
    const { ok, data } = await api("/me/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    setSaving(false);
    if (!ok) return setError(data.error || "Could not change the password.");
    setCurrent("");
    setNext("");
    setConfirmPw("");
    setDone(true);
    loadSecurity();
  }

  const recent = changedAt ? Date.now() - new Date(changedAt).getTime() < 3 * DAY_MS : false;

  return (
    <>
      <Card className="flex items-center gap-4">
        <Avatar name={me.name} size={56} />
        <div className="min-w-0">
          <p className="font-bold text-lg truncate">{me.name}</p>
          <p className="text-sm text-slate-500 truncate">{me.email}</p>
          <p className="text-xs text-slate-400 mt-0.5">{me.role === "HR" ? "HR Admin" : "Employee"}</p>
        </div>
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-slate-500">Password last changed</span>
          <span className="text-sm font-semibold text-right">
            {changedAt === undefined ? "..." : changedAt ? when(changedAt) : "Not recorded"}
          </span>
        </div>
        {recent && (
          <Alert>
            Your password was changed recently. If this was not you, tell HR straight away.
          </Alert>
        )}
      </Card>

      <Card>
        <form onSubmit={submit} className="space-y-4">
          <h2 className="font-semibold">Change password</h2>
          <Field label="Current password" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
          <Field label="New password" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} required placeholder="At least 8 characters" />
          <Field label="Confirm new password" type="password" autoComplete="new-password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required />
          {error && <Alert>{error}</Alert>}
          {done && <Alert kind="success">Password changed. Other devices have been signed out.</Alert>}
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Change password"}
          </Button>
        </form>
      </Card>
    </>
  );
}