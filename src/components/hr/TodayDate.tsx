"use client";

import { useEffect, useState } from "react";

const format = () =>
  new Date().toLocaleDateString("en-NG", {
    timeZone: "Africa/Lagos",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export function TodayDate() {
  const [text, setText] = useState("");

  useEffect(() => {
    setText(format());
    // Update if the page is left open past midnight.
    const t = setInterval(() => setText(format()), 60000);
    return () => clearInterval(t);
  }, []);

  return <p className="text-sm text-slate-500 mt-1">{text || "\u00A0"}</p>;
}