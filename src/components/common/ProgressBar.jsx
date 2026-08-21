// ============================================================
// FINANCEOS - PROGRESS BAR COMPONENT
// ============================================================

import React from "react";

// Simple linear progress bar that appears as an animated overlay
export default function ProgressBar() {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/30">
      <div className="w-1/2 max-w-md rounded-xl bg-white p-4 shadow-lg">
        <div className="flex items-center space-x-4">
          <svg
            className="animate-spin h-6 w-6 text-[#315c46]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            ></path>
          </svg>
          <span className="text-sm font-medium text-[#18392c]">
            Saving your contribution...
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// EXPORT
// ============================================================
