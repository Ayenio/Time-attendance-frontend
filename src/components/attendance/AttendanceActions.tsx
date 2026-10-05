import React from "react";
import { RefreshCw, Fingerprint } from "lucide-react";

interface Props {
  hasCheckedIn: boolean;
  status: "idle" | "loading" | "success";
  isDisabled: boolean;
  onSubmit: () => void;
}

export const AttendanceActions: React.FC<Props> = ({ hasCheckedIn, status, isDisabled, onSubmit }) => (
  <div className="w-full">
    <button
      onClick={onSubmit}
      disabled={isDisabled}
      className="w-full py-4 rounded-2xl font-semibold uppercase tracking-[0.1em] text-xl shadow-xl shadow-primary-light transition-all active:scale-95 flex items-center justify-center gap-3 text-white disabled:opacity-30 bg-primary hover:bg-primary-hover"
    >
      {status === "loading" ? (
        <RefreshCw className="animate-spin" size={18} />
      ) : (
        <>
          <Fingerprint size={18} />
          {hasCheckedIn ? "Check Out" : "Check In"}
        </>
      )}
    </button>
  </div>
);