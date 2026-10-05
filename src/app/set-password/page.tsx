"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { AuthShell, Field, Button, Alert } from "@/components/ui";

function SetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") || "";

  const [name, setName] = useState("");
  const [linkError, setLinkError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api(`/auth/invite/${token}`).then(({ ok, data }) => {
      if (ok) setName(data.name);
      else setLinkError(data.error || "This link is not valid.");
    });
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("The two passwords do not match.");

    setSaving(true);
    const { ok, data } = await api("/auth/set-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });
    setSaving(false);
    if (!ok) return setError(data.error || "Could not save your password.");
    router.replace(data.user.role === "HR" ? "/hr" : "/home");
  }

  if (linkError) {
    return (
      <AuthShell title="Link not valid" subtitle="We could not open your invitation">
        <Alert>{linkError}</Alert>
      </AuthShell>
    );
  }

  if (!name) {
    return (
      <AuthShell title="One moment" subtitle="Checking your invitation...">
        <div className="h-24 rounded-2xl bg-slate-50 animate-pulse" />
      </AuthShell>
    );
  }

  return (
    <AuthShell title={`Welcome, ${name}`} subtitle="Choose a password to finish setting up your account">
      <form onSubmit={submit} className="space-y-4">
        <Field
          label="New password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="At least 8 characters"
        />
        <Field
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          placeholder="Type it again"
        />
        {error && <Alert>{error}</Alert>}
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Set password"}
        </Button>
      </form>
    </AuthShell>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <SetPasswordForm />
    </Suspense>
  );
}