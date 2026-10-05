"use client";

import { useEffect, useState } from "react";

export default function HealthPage() {
  const [text, setText] = useState("Checking...");

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`)
      .then((r) => r.json())
      .then((d) => setText(d.message))
      .catch(() => setText("Cannot reach the backend"));
  }, []);

  return <main className="p-6 text-gray-900">{text}</main>;
}