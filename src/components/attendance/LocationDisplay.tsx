import React, { useState } from "react";
import { createPortal } from "react-dom";
import { MapPin, RefreshCw, AlertTriangle, X } from "lucide-react";

export type Location = { lat: number; lng: number; accuracy: number };

interface Props {
  location: Location | null;
  isLocating: boolean;
  error?: string | null;
  onRetry: () => void;
}

const LocationHelpGuide: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div
    className="fixed inset-0 z-[10000] bg-black/60 flex items-end sm:items-center justify-center"
    onClick={onClose}
  >
    <div
      className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="sticky top-0 bg-white px-6 pt-5 pb-3 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">How to Enable Location</h3>
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
          <X size={14} className="text-slate-500" />
        </button>
      </div>
      <div className="px-6 py-4 space-y-5 text-xs text-slate-600 leading-relaxed">
        <div>
          <p className="text-[10px] font-bold text-slate-800 uppercase tracking-wider mb-2">Android (Chrome)</p>
          <ol className="list-decimal list-inside space-y-1.5">
            <li>Open <strong>Settings &gt; Location</strong> and turn it <strong>ON</strong></li>
            <li>Go to <strong>Settings &gt; Apps &gt; Chrome &gt; Permissions &gt; Location</strong></li>
            <li>Choose <strong>Allow</strong></li>
            <li>Return to the app and tap <strong>Retry</strong></li>
          </ol>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-800 uppercase tracking-wider mb-2">iPhone / iPad (Safari)</p>
          <ol className="list-decimal list-inside space-y-1.5">
            <li>Open <strong>Settings &gt; Privacy &amp; Security &gt; Location Services</strong> and turn it <strong>ON</strong></li>
            <li>Tap <strong>Safari Websites</strong></li>
            <li>Select <strong>While Using the App</strong></li>
            <li>Return to the app and tap <strong>Retry</strong></li>
          </ol>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-800 uppercase tracking-wider mb-2">Desktop Chrome</p>
          <ol className="list-decimal list-inside space-y-1.5">
            <li>Click the <strong>lock icon</strong> in the address bar</li>
            <li>Set <strong>Location</strong> to <strong>Allow</strong></li>
            <li>Reload the page or tap <strong>Retry</strong></li>
          </ol>
        </div>
        <p className="text-[10px] text-slate-400 pt-2 border-t border-slate-100">
          Tip: if location still fails, turn Wi-Fi ON. It improves indoor positioning.
        </p>
      </div>
    </div>
  </div>
);

export const LocationDisplay: React.FC<Props> = ({ location, isLocating, error, onRetry }) => {
  const [showHelp, setShowHelp] = useState(false);

  if (isLocating) {
    return (
      <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
        <RefreshCw size={12} className="animate-spin text-blue-500" /> Detecting location...
      </div>
    );
  }

  if (location && !error) {
    return (
      <button onClick={onRetry} className="mx-auto flex items-center gap-2 text-xs text-slate-600">
        <MapPin size={12} className="text-rose-500" />
        Location found (about {Math.round(location.accuracy)} m accuracy). Tap to refresh.
      </button>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center gap-2">
        {error && (
          <div className="flex items-start gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-xl text-xs">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={onRetry}
            className="px-3 py-1.5 bg-blue-500 text-white rounded-xl flex items-center gap-1.5 text-xs font-semibold active:scale-95"
          >
            <RefreshCw size={12} /> Retry Location
          </button>
          <button
            onClick={() => setShowHelp(true)}
            className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold"
          >
            Help
          </button>
        </div>
      </div>
      {showHelp && createPortal(<LocationHelpGuide onClose={() => setShowHelp(false)} />, document.body)}
    </>
  );
};