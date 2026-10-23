// ============================================================
// FINANCEOS - REUSABLE CENTERED MODAL COMPONENT
// Used for Alerts, Confirmations, No-Data Validations, and Logout
// ============================================================

import React, { useState } from "react";
import { FiAlertCircle, FiAlertTriangle, FiInfo, FiCheckCircle, FiX } from "react-icons/fi";

function CenteredModal({
  isOpen,
  onClose,
  title = "Notice",
  message = "",
  type = "alert", // "alert" | "confirm"
  iconType = "info", // "info" | "warning" | "error" | "success"
  confirmText = "OK",
  cancelText = "Cancel",
  confirmVariant = "primary", // "primary" | "danger"
  onConfirm = null,
  isProcessing = false,
}) {
  const [internalLoading, setInternalLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (internalLoading || isProcessing) return;
    if (onConfirm) {
      try {
        setInternalLoading(true);
        await onConfirm();
      } finally {
        setInternalLoading(false);
      }
    } else {
      onClose();
    }
  };

  const resolvedIcon =
    iconType && iconType !== "info"
      ? iconType
      : (type === "success" || type === "error" || type === "warning")
      ? type
      : iconType || "info";

  const getIcon = () => {
    switch (resolvedIcon) {
      case "warning":
        return <FiAlertTriangle className="text-amber-500 text-2xl" />;
      case "error":
        return <FiAlertCircle className="text-rose-500 text-2xl" />;
      case "success":
        return <FiCheckCircle className="text-emerald-500 text-2xl" />;
      case "info":
      default:
        return <FiInfo className="text-[#315c46] text-2xl" />;
    }
  };

  const getIconBg = () => {
    switch (resolvedIcon) {
      case "warning":
        return "bg-amber-50 border-amber-200";
      case "error":
        return "bg-rose-50 border-rose-200";
      case "success":
        return "bg-emerald-50 border-emerald-200";
      case "info":
      default:
        return "bg-[#eef6ec] border-[#dcebd8]";
    }
  };

  const busy = isProcessing || internalLoading;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 text-slate-800 transform transition-all animate-scaleUp relative"
        role="dialog"
        aria-modal="true"
      >
        {/* Close icon (if not strictly modal alert) */}
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition p-1 rounded-lg"
          aria-label="Close"
        >
          <FiX className="text-lg" />
        </button>

        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl border shrink-0 ${getIconBg()}`}>
            {getIcon()}
          </div>
          <div className="flex-1 pr-4">
            <h3 className="text-base font-bold text-slate-800 mb-1">{title}</h3>
            <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {message}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          {type === "confirm" && (
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className={`px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed ${
              confirmVariant === "danger"
                ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                : "bg-gradient-to-r from-[#315c46] to-[#1e3c2d] hover:opacity-95 shadow-[#315c46]/20"
            }`}
          >
            {busy ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CenteredModal;
