import { useState, useMemo } from "react";
import { FiX, FiDollarSign, FiCalendar, FiCheckCircle, FiLock } from "react-icons/fi";
import useFinance from "../../context/useFinance.js";
import { parseSelectedMonth } from "../../utils/monthLifecycle.js";

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatMoney(value) {
  return safeNumber(value).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
}

/**
 * Calculate the due date for the selected month using the investment's
 * stored dueDay. Clamps to the last valid day of the month.
 *
 * @param {number} dueDay  - Day of month (1-31) from investment
 * @param {number} year    - Selected year
 * @param {number} month   - Selected month (1-12)
 * @returns {string}       - ISO date string YYYY-MM-DD
 */
function deriveDueDateISO(dueDay, year, month) {
  const day = Math.max(1, Math.min(dueDay || 10, new Date(year, month, 0).getDate()));
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function formatDateDisplay(isoStr) {
  if (!isoStr) return "";
  const d = new Date(`${isoStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return isoStr;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function SIPContributionModal({ investment, onClose }) {
  const { addSIPContribution, selectedMonth } = useFinance();
  const monthBounds = parseSelectedMonth(selectedMonth);

  // ============================================================
  // DERIVE DUE DATE AUTOMATICALLY (READ-ONLY)
  // Uses the investment's stored dueDay + selected month.
  // The user does NOT manually enter the due date.
  // ============================================================
  const storedDueDay = investment?.dueDay
    || investment?.reminder?.contributionDay
    || (investment?.nextContributionDate
      ? new Date(investment.nextContributionDate).getDate()
      : null)
    || 10; // fallback

  const derivedDueDate = useMemo(() => {
    return deriveDueDateISO(storedDueDay, monthBounds.year, monthBounds.month);
  }, [storedDueDay, monthBounds.year, monthBounds.month]);

  const [amount, setAmount] = useState(
    investment?.monthlyContribution ? String(investment.monthlyContribution) : ""
  );
  const [paidDate, setPaidDate] = useState(monthBounds.defaultDate);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  if (!investment) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const contributionAmount = safeNumber(amount);
    if (contributionAmount <= 0) {
      setError("Enter a valid contribution amount.");
      return;
    }

    setIsSubmitting(true);

    try {
      // The backend derives the dueDate from the stored schedule.
      // We only send: amount, paidDate, status, note, selectedMonth.
      const result = await addSIPContribution(investment.id, {
        amount: contributionAmount,
        paidDate,
        status: "Paid",
        note: note.trim(),
        selectedMonth: monthBounds.iso,
      });

      if (!result?.success) {
        setError(result?.message || "Unable to record SIP contribution.");
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(result.message || "SIP contribution recorded successfully.");
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#e2e8dc] bg-white shadow-xl">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-[#e7ece3] px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-[#18392c]">Record SIP Contribution</h3>
            <p className="mt-1 text-[11px] text-[#6c8b72]">
              {investment.name || "SIP Investment"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-[#f4faef] hover:text-[#315c46] transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-[#f4faef] p-4 text-sm font-medium text-[#315c46] border border-[#dcebd4]">
              <FiCheckCircle size={18} />
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* AMOUNT */}
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#52665b]">
                Contribution Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <FiDollarSign />
                </span>
                <input
                  type="number"
                  step="0.01"
                  className="w-full rounded-xl border border-[#dce5d7] py-3 pl-10 pr-4 text-sm font-semibold text-[#18392c] shadow-sm outline-none transition-all placeholder:text-slate-300 focus:border-[#4d906e] focus:ring-4 focus:ring-[#4d906e]/10"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isSubmitting || !!successMessage}
                />
              </div>
            </div>

            {/* DATES GRID */}
            <div className="grid grid-cols-2 gap-4">
              {/* ========================================== */}
              {/* DUE DATE — READ-ONLY, DERIVED FROM STORED  */}
              {/* RECURRING SCHEDULE (dueDay + month)        */}
              {/* ========================================== */}
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#52665b]">
                  <FiLock size={10} className="text-amber-500" />
                  Due Date (Auto)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <FiCalendar />
                  </span>
                  <input
                    type="text"
                    readOnly
                    className="w-full rounded-xl border border-[#e7ece3] bg-[#f9fbf6] py-3 pl-10 pr-4 text-sm font-semibold text-[#18392c] shadow-sm cursor-not-allowed"
                    value={formatDateDisplay(derivedDueDate)}
                    title={`Automatically derived from contribution day ${storedDueDay} + ${monthBounds.formatted}`}
                  />
                </div>
                <p className="mt-1 text-[10px] text-[#8fa895]">
                  Day {storedDueDay} of {monthBounds.formatted}
                </p>
              </div>

              {/* PAID DATE — USER EDITABLE */}
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#52665b]">
                  Paid Date
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <FiCalendar />
                  </span>
                  <input
                    type="date"
                    min={monthBounds.minDate}
                    max={monthBounds.maxDate}
                    className="w-full rounded-xl border border-[#dce5d7] py-3 pl-10 pr-4 text-sm font-semibold text-[#18392c] shadow-sm outline-none transition-all focus:border-[#4d906e] focus:ring-4 focus:ring-[#4d906e]/10"
                    value={paidDate}
                    onChange={(e) => setPaidDate(e.target.value)}
                    disabled={isSubmitting || !!successMessage}
                  />
                </div>
              </div>
            </div>

            {/* NOTE */}
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#52665b]">
                Note (Optional)
              </label>
              <textarea
                className="w-full rounded-xl border border-[#dce5d7] p-4 text-sm text-[#18392c] shadow-sm outline-none transition-all placeholder:text-slate-300 focus:border-[#4d906e] focus:ring-4 focus:ring-[#4d906e]/10 min-h-[80px]"
                placeholder="Where should I note? I am paying on this date..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={isSubmitting || !!successMessage}
              />
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !!successMessage}
                className="w-full rounded-xl bg-[#315c46] py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[#254635] hover:shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? "Recording..." : successMessage ? "Recorded" : "Record SIP Contribution"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
