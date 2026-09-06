// ============================================================
// FINANCEOS - UNIFIED REMINDER CONFIGURATION MODAL
// Used across Calendar, Dashboard, Plans, and Details Modals
// ============================================================

import { useState, useEffect } from "react";
import {
  FiBell,
  FiCheck,
  FiX,
  FiTrash2,
  FiAlertTriangle,
  FiCalendar,
  FiMail,
  FiSmartphone,
  FiInfo,
} from "react-icons/fi";
import useFinance from "../../context/useFinance.js";

function ReminderConfigModal({
  isOpen,
  onClose,
  initialData = null, // Can be an existing reminder, a calendar event, or plan item
  sourceType = "General", // "Investment" | "Insurance" | "Liability" | "SavingGoal" | "General"
  sourceId = null,
  itemName = "",
  amount = 0,
  dueDate = "",
  onSuccess = null,
}) {
  const {
    updateItemReminder,
    disableItemReminder,
    enableItemReminder,
    deleteItemReminder,
    createCustomReminder,
    updateCustomReminder,
    deleteCustomReminder,
  } = useFinance();

  const isPlanLinked = Boolean(
    (sourceType && sourceType !== "General") ||
    (initialData?.sourceType && initialData.sourceType !== "General") ||
    sourceId ||
    initialData?.sourceId
  );

  const effectiveSourceType = initialData?.sourceType || sourceType || "General";
  const effectiveSourceId = initialData?.sourceId || (isPlanLinked ? (initialData?._id || initialData?.id) : null) || sourceId || null;
  const effectiveItemName = initialData?.cleanTitle || initialData?.title || initialData?.itemName || initialData?.name || initialData?.policyName || initialData?.goalName || itemName || "Financial Item";
  const effectiveAmount = initialData?.amount || initialData?.monthlyContribution || initialData?.premiumAmount || initialData?.monthlyPremium || initialData?.monthlyEMI || amount || 0;
  const effectiveDueDate = initialData?.dueDate || initialData?.date || initialData?.renewalDate || initialData?.nextPaymentDate || initialData?.startDate || dueDate || "";
  const rawReminderId =
    initialData?.reminderId ||
    initialData?._id ||
    (typeof initialData?.id === "string" ? initialData.id.replace(/^reminder-due-|^reminder-/, "") : initialData?.id) ||
    null;

  // Form State
  const [enabled, setEnabled] = useState(true);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [notifyOffsets, setNotifyOffsets] = useState([5, 1, 0]);
  const [customDays, setCustomDays] = useState("");
  const [channels, setChannels] = useState({
    inApp: true,
    email: true,
    sms: false,
  });
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Initialize or reset form state when modal opens
  useEffect(() => {
    if (!isOpen) {
      setShowDeleteConfirm(false);
      setFeedback(null);
      return;
    }

    if (initialData) {
      setTitle(initialData.cleanTitle || initialData.title || initialData.itemName || effectiveItemName);
      setDate(initialData.dueDate || initialData.date || effectiveDueDate || "");
      setEnabled(initialData.enabled !== false && initialData.status !== "Disabled");
      setDescription(initialData.description || initialData.message || "");

      // Channels
      if (initialData.channels) {
        setChannels({
          inApp: initialData.channels.inApp !== false,
          email: Boolean(initialData.channels.email),
          sms: Boolean(initialData.channels.sms),
        });
      }

      // NotifyBefore offsets
      if (Array.isArray(initialData.notifyBefore) && initialData.notifyBefore.length > 0) {
        setNotifyOffsets(initialData.notifyBefore);
      } else if (initialData.reminder?.notifyBefore) {
        setNotifyOffsets(initialData.reminder.notifyBefore);
      } else if (initialData.reminder?.daysBefore) {
        setNotifyOffsets([initialData.reminder.daysBefore]);
      } else {
        setNotifyOffsets([5, 1, 0]);
      }
    } else {
      setTitle(effectiveItemName || "");
      setDate(effectiveDueDate || "");
      setEnabled(true);
      setNotifyOffsets([5, 1, 0]);
      setChannels({ inApp: true, email: true, sms: false });
      setDescription("");
    }
  }, [isOpen, initialData, effectiveItemName, effectiveDueDate]);

  if (!isOpen) return null;

  const toggleOffset = (day) => {
    setNotifyOffsets((prev) => {
      if (prev.includes(day)) {
        const next = prev.filter((d) => d !== day);
        return next.length > 0 ? next : [0]; // keep at least 0
      } else {
        return [...prev, day].sort((a, b) => b - a);
      }
    });
  };

  const handleAddCustomDays = () => {
    const d = parseInt(customDays, 10);
    if (!isNaN(d) && d > 0 && !notifyOffsets.includes(d)) {
      setNotifyOffsets((prev) => [...prev, d].sort((a, b) => b - a));
      setCustomDays("");
    }
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      if (isPlanLinked && effectiveSourceId) {
        // Save to source plan & sync
        const res = await updateItemReminder(effectiveSourceType, effectiveSourceId, {
          enabled,
          notifyBefore: notifyOffsets,
          daysBefore: notifyOffsets[0] || 3,
          channels,
          message: description,
        });

        if (res.success) {
          setFeedback({ type: "success", message: "Reminder updated successfully!" });
          if (onSuccess) onSuccess();
          setTimeout(() => onClose(), 700);
        } else {
          setFeedback({ type: "error", message: res.message || "Failed to update reminder." });
        }
      } else if (rawReminderId && !isPlanLinked) {
        // Update existing general reminder
        const res = await updateCustomReminder(rawReminderId, {
          title,
          dueDate: date,
          notifyBefore: notifyOffsets,
          channels,
          enabled,
          message: description,
        });
        if (res.success) {
          setFeedback({ type: "success", message: "Reminder updated!" });
          if (onSuccess) onSuccess();
          setTimeout(() => onClose(), 700);
        } else {
          setFeedback({ type: "error", message: res.message || "Failed to update reminder." });
        }
      } else {
        // Create new reminder
        const res = await createCustomReminder({
          title: title || effectiveItemName,
          dueDate: date || effectiveDueDate,
          notifyBefore: notifyOffsets,
          channels,
          message: description,
          sourceType: "General",
        });
        if (res.success) {
          setFeedback({ type: "success", message: "Reminder created!" });
          if (onSuccess) onSuccess();
          setTimeout(() => onClose(), 700);
        } else {
          setFeedback({ type: "error", message: res.message || "Failed to create reminder." });
        }
      }
    } catch (err) {
      setFeedback({ type: "error", message: err.message || "An unexpected error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async () => {
    setIsSubmitting(true);
    try {
      const nextEnabled = !enabled;
      setEnabled(nextEnabled);

      if (isPlanLinked && effectiveSourceId) {
        if (nextEnabled) {
          await enableItemReminder(effectiveSourceType, effectiveSourceId);
        } else {
          await disableItemReminder(effectiveSourceType, effectiveSourceId);
        }
      } else if (rawReminderId) {
        await updateCustomReminder(rawReminderId, { enabled: nextEnabled });
      }

      setFeedback({
        type: "success",
        message: `Reminder ${nextEnabled ? "enabled" : "disabled"} successfully!`,
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      if (isPlanLinked && effectiveSourceId) {
        await deleteItemReminder(effectiveSourceType, effectiveSourceId);
      } else if (rawReminderId) {
        await deleteCustomReminder(rawReminderId);
      }
      setFeedback({
        type: "success",
        message: "Reminder deleted. Financial plan remains safe and intact.",
      });
      if (onSuccess) onSuccess();
      setTimeout(() => onClose(), 800);
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-[#e2e8dc] overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8dc] bg-gradient-to-r from-[#f7f9f5] to-[#edf4e8]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#315c46] text-white shadow-sm">
              <FiBell className="text-lg" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#18392c]">
                {isPlanLinked ? "Configure Plan Reminder" : rawReminderId ? "Edit Reminder" : "Add Reminder"}
              </h3>
              <p className="text-xs text-[#52665b]">
                {isPlanLinked ? `Linked to ${effectiveSourceType}` : "Custom financial reminder"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-slate-700 transition"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`px-6 py-3 text-xs font-medium flex items-center gap-2 ${
              feedback.type === "success"
                ? "bg-[#eaf5e6] text-[#2c5f3b]"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            {feedback.type === "success" ? <FiCheck /> : <FiAlertTriangle />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Delete Confirmation Modal Layer */}
        {showDeleteConfirm ? (
          <div className="p-6 bg-rose-50/50 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                <FiAlertTriangle className="text-xl" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-rose-900">Delete Reminder Alert?</h4>
                <p className="mt-1 text-xs text-rose-700 leading-relaxed">
                  This action will <strong>ONLY remove the scheduled reminder notification</strong>.
                  Your financial plan, monthly payments, transaction histories, and balance records
                  will remain <strong>completely safe and unaffected</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-rose-200">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 transition"
              >
                <FiTrash2 />
                {isSubmitting ? "Deleting..." : "Yes, Delete Reminder"}
              </button>
            </div>
          </div>
        ) : (
          /* Main Form */
          <form onSubmit={handleSave} className="p-6 space-y-5">
            
            {/* Item Info Banner */}
            <div className="rounded-xl border border-[#e2e8dc] bg-[#f9fbf8] p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#52665b]">
                  {effectiveSourceType}
                </span>
                <h4 className="text-sm font-bold text-[#18392c]">{effectiveItemName}</h4>
                {effectiveDueDate && (
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <FiCalendar className="text-[11px]" />
                    <span>Due: {effectiveDueDate}</span>
                  </p>
                )}
              </div>
              {effectiveAmount > 0 && (
                <div className="text-right">
                  <span className="text-[10px] text-slate-400">Planned Amount</span>
                  <p className="text-sm font-bold text-[#315c46]">
                    ₹{Number(effectiveAmount).toLocaleString("en-IN")}
                  </p>
                </div>
              )}
            </div>

            {/* Enable / Disable Switch */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white">
              <div>
                <label className="text-xs font-bold text-slate-800">Reminder Alerts</label>
                <p className="text-[11px] text-slate-500">
                  {enabled ? "Active — you will receive upcoming alerts" : "Disabled — alerts are paused"}
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleActive}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  enabled ? "bg-[#315c46]" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    enabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Custom Title (for general reminders) */}
            {!isPlanLinked && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reminder Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Credit Card payment, review budget"
                  required
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-[#315c46] focus:outline-none focus:ring-1 focus:ring-[#315c46]"
                />
              </div>
            )}

            {/* Due Date (for general reminders) */}
            {!isPlanLinked && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-[#315c46] focus:outline-none focus:ring-1 focus:ring-[#315c46]"
                />
              </div>
            )}

            {/* Notification Offsets */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Notify Me In Advance
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "7 days before", val: 7 },
                  { label: "5 days before", val: 5 },
                  { label: "3 days before", val: 3 },
                  { label: "1 day before", val: 1 },
                  { label: "On due date", val: 0 },
                ].map(({ label, val }) => {
                  const isSelected = notifyOffsets.includes(val);
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => toggleOffset(val)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        isSelected
                          ? "bg-[#315c46] text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Custom offset adder */}
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="60"
                  placeholder="Custom days..."
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  className="w-32 rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-700 focus:border-[#315c46] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCustomDays}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  + Add Days
                </button>
              </div>
            </div>

            {/* Delivery Channels */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Notification Channels
              </label>
              <div className="grid grid-cols-3 gap-2">
                <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-[#fafcf9] cursor-pointer hover:bg-white text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={channels.inApp}
                    onChange={(e) => setChannels({ ...channels, inApp: e.target.checked })}
                    className="accent-[#315c46] rounded"
                  />
                  <FiBell className="text-slate-400" />
                  <span>In-App</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-[#fafcf9] cursor-pointer hover:bg-white text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={channels.email}
                    onChange={(e) => setChannels({ ...channels, email: e.target.checked })}
                    className="accent-[#315c46] rounded"
                  />
                  <FiMail className="text-slate-400" />
                  <span>Email</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-[#fafcf9] cursor-pointer hover:bg-white text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={channels.sms}
                    onChange={(e) => setChannels({ ...channels, sms: e.target.checked })}
                    className="accent-[#315c46] rounded"
                  />
                  <FiSmartphone className="text-slate-400" />
                  <span>SMS</span>
                </label>
              </div>
            </div>

            {/* Notes / Message */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Custom Reminder Note (Optional)
              </label>
              <textarea
                rows="2"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Additional instructions or account reminder details..."
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-[#315c46] focus:outline-none focus:ring-1 focus:ring-[#315c46]"
              />
            </div>

            {/* Financial Safety Notice */}
            <div className="flex items-start gap-2 text-[11px] text-[#52665b] bg-[#f4f7f2] p-2.5 rounded-xl">
              <FiInfo className="text-sm shrink-0 text-[#315c46] mt-0.5" />
              <span>
                Disabling or deleting a reminder never impacts plan balances, contributions, or portfolio calculations.
              </span>
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              {(initialData || effectiveSourceId) ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl transition"
                >
                  <FiTrash2 />
                  <span>Delete Reminder</span>
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#315c46] to-[#1e3c2d] hover:opacity-95 shadow-md shadow-[#315c46]/20 transition"
                >
                  <FiCheck />
                  <span>{isSubmitting ? "Saving..." : "Save Reminder"}</span>
                </button>
              </div>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}

export default ReminderConfigModal;
