// ============================================================
// FINANCEOS - UPCOMING FINANCIAL ACTIVITY
// Month-Scoped, Unified Reminders, and Interactive Actions
// ============================================================

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCalendar,
  FiTarget,
  FiTrendingUp,
  FiShield,
  FiCreditCard,
  FiClock,
  FiBell,
  FiArrowRight,
  FiSettings,
  FiCheckCircle,
  FiAlertTriangle,
} from "react-icons/fi";

import { generateFinancialCalendarEvents } from "../../utils/financialCalendar.js";
import ReminderConfigModal from "../reminders/ReminderConfigModal.jsx";
import useFinance from "../../context/useFinance.js";

const UPCOMING_DAYS = 30;

function formatMoney(amount) {
  return Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  });
}

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function parseEventDate(dateString) {
  if (!dateString) return null;
  const parts = dateString.split("-").map(Number);
  if (parts.length !== 3) return null;
  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getEventTypeLabel(type) {
  switch (type) {
    case "goal":
      return "Goal Contribution";
    case "goal-deadline":
      return "Goal Deadline";
    case "investment":
      return "Investment Contribution";
    case "investment-maturity":
      return "Investment Maturity";
    case "insurance":
      return "Insurance Premium";
    case "insurance-maturity":
      return "Insurance Maturity";
    case "liability":
      return "Payment / EMI";
    case "liability-end":
      return "Liability Completion";
    case "user-reminder":
      return "Custom Reminder";
    case "reminder-alert":
      return "Reminder Alert";
    default:
      return "Financial Event";
  }
}

function EventIcon({ type }) {
  if (type === "goal" || type === "goal-deadline") return <FiTarget />;
  if (type === "investment" || type === "investment-maturity") return <FiTrendingUp />;
  if (type === "insurance" || type === "insurance-maturity") return <FiShield />;
  if (type === "liability" || type === "liability-end") return <FiCreditCard />;
  if (type === "reminder-alert" || type === "user-reminder") return <FiBell />;
  return <FiCalendar />;
}

export default function UpcomingFinancialActivity({
  savingGoals = [],
  investments = [],
  insurancePolicies = [],
  liabilities = [],
  userReminders = [],
  selectedMonth = "",
}) {
  const navigate = useNavigate();
  const { loadUserReminders, userData } = useFinance();

  // State for active reminder modal
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    data: null,
    sourceType: "General",
    sourceId: null,
    itemName: "",
    amount: 0,
    dueDate: "",
  });

  // Generate complete calendar events
  const allEvents = useMemo(
    () =>
      generateFinancialCalendarEvents({
        savingGoals: Array.isArray(savingGoals) ? savingGoals : [],
        investments: Array.isArray(investments) ? investments : [],
        insurancePolicies: Array.isArray(insurancePolicies) ? insurancePolicies : [],
        liabilities: Array.isArray(liabilities) ? liabilities : [],
        userReminders: Array.isArray(userReminders) ? userReminders : [],
        currentUserId: userData?._id || userData?.id,
      }),
    [savingGoals, investments, insurancePolicies, liabilities, userReminders, userData]
  );

  // Month Context & Time Horizon
  const { periodEvents, periodLabel, isScopedToMonth, isPastMonth, isFutureMonth, isCurrentMonth } =
    useMemo(() => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      // Check if selectedMonth is specified (e.g. "2026-03")
      if (selectedMonth && /^\d{4}-\d{1,2}$/.test(selectedMonth)) {
        const [y, m] = selectedMonth.split("-").map(Number);
        const targetYear = y;
        const targetMonthIndex = m - 1;

        const currentYear = now.getFullYear();
        const currentMonthIndex = now.getMonth();

        const past =
          targetYear < currentYear ||
          (targetYear === currentYear && targetMonthIndex < currentMonthIndex);
        const future =
          targetYear > currentYear ||
          (targetYear === currentYear && targetMonthIndex > currentMonthIndex);
        const current = targetYear === currentYear && targetMonthIndex === currentMonthIndex;

        const monthDate = new Date(targetYear, targetMonthIndex, 1);
        const monthTitle = monthDate.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });

        // Events occurring within the selected month
        const filtered = allEvents.filter((ev) => {
          const d = parseEventDate(ev.date);
          if (!d) return false;
          return d.getFullYear() === targetYear && d.getMonth() === targetMonthIndex;
        });

        return {
          periodEvents: filtered,
          periodLabel: `${monthTitle} Activity`,
          isScopedToMonth: true,
          isPastMonth: past,
          isFutureMonth: future,
          isCurrentMonth: current,
        };
      }

      // Default: Next 30 Days (Upcoming)
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + UPCOMING_DAYS);
      endDate.setHours(23, 59, 59, 999);

      const filtered = allEvents.filter((ev) => {
        const d = parseEventDate(ev.date);
        if (!d) return false;
        d.setHours(0, 0, 0, 0);
        return d >= now && d <= endDate;
      });

      return {
        periodEvents: filtered,
        periodLabel: "Next 30 Days Activity",
        isScopedToMonth: false,
        isPastMonth: false,
        isFutureMonth: false,
        isCurrentMonth: true,
      };
    }, [allEvents, selectedMonth]);

  // Sort events by date
  const sortedEvents = useMemo(() => {
    return [...periodEvents].sort((a, b) => {
      const da = parseEventDate(a.date);
      const db = parseEventDate(b.date);
      if (!da || !db) return 0;
      return da.getTime() - db.getTime();
    });
  }, [periodEvents]);

  // Total Planned Amount
  const totalAmount = useMemo(() => {
    // Sum only due events to avoid double-counting reminder alerts
    return sortedEvents
      .filter((e) => !e.isReminderEvent)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [sortedEvents]);

  // Helper to compute status label and styling
  const getItemStatusInfo = (event) => {
    if (isPastMonth) {
      return {
        label: event.status === "Paid" || event.status === "Completed" ? "Completed" : "Historical Period",
        badgeStyle: "bg-slate-100 text-slate-600 border border-slate-200/60",
      };
    }

    if (isFutureMonth) {
      return {
        label: "Scheduled",
        badgeStyle: "bg-indigo-50 text-indigo-700 border border-indigo-100",
      };
    }

    // Current Month / Upcoming Horizon
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = parseEventDate(event.date);

    if (!eventDate) {
      return { label: event.status || "Scheduled", badgeStyle: "bg-slate-100 text-slate-600" };
    }

    eventDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round((eventDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

    if (diffDays === 0) {
      return {
        label: "Due Today",
        badgeStyle: "bg-amber-100 text-amber-900 border border-amber-300 font-bold animate-pulse",
      };
    }
    if (diffDays === 1) {
      return {
        label: "Due Tomorrow",
        badgeStyle: "bg-amber-50 text-amber-800 border border-amber-200 font-semibold",
      };
    }
    if (diffDays < 0) {
      return {
        label: "Overdue",
        badgeStyle: "bg-rose-50 text-rose-700 border border-rose-200 font-bold",
      };
    }
    if (diffDays <= 5) {
      return {
        label: `Due in ${diffDays}d`,
        badgeStyle: "bg-amber-50 text-amber-700 border border-amber-200 font-medium",
      };
    }

    return {
      label: `In ${diffDays}d`,
      badgeStyle: "bg-[#edf6e8] text-[#2c5f3b] border border-[#dce8d5] font-medium",
    };
  };

  const handleOpenPlan = (event) => {
    if (event.sourceType === "SavingGoal") navigate("/saving-goals");
    else if (event.sourceType === "Investment") navigate("/plans?tab=investments");
    else if (event.sourceType === "Insurance") navigate("/plans?tab=insurance");
    else if (event.sourceType === "Liability") navigate("/plans?tab=liabilities");
  };

  return (
    <section className="mt-6 rounded-2xl border border-[#e2e8dc] bg-white p-5 shadow-sm">
      
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#edf0e9]">
        <div>
          <div className="flex items-center gap-2">
            <FiClock className="text-[#315c46] text-lg" />
            <h2 className="text-base font-bold text-[#18392c]">{periodLabel}</h2>
            {isScopedToMonth && (
              <span className="rounded-full bg-[#f4f7f2] border border-[#dfe6da] px-2.5 py-0.5 text-[10px] font-semibold text-[#52665b]">
                {isPastMonth ? "Past Record" : isFutureMonth ? "Future Plan" : "Active Month"}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {isScopedToMonth
              ? `Scheduled payments, contributions, and reminder alerts for ${selectedMonth}.`
              : "Payments, contributions, deadlines and maturity events scheduled within the next 30 days."}
          </p>
        </div>

        {/* METRICS ROW */}
        <div className="flex items-center gap-3">
          {totalAmount > 0 && (
            <div className="text-right pr-3 border-r border-slate-100 hidden sm:block">
              <span className="text-[10px] uppercase font-semibold text-slate-400">Total Planned</span>
              <p className="text-sm font-bold text-[#315c46]">₹{formatMoney(totalAmount)}</p>
            </div>
          )}

          <div className="rounded-full bg-[#edf6e8] px-3.5 py-1">
            <span className="text-xs font-semibold text-[#315c46]">
              {sortedEvents.length} {sortedEvents.length === 1 ? "Activity" : "Activities"}
            </span>
          </div>
        </div>
      </div>

      {/* EMPTY STATE */}
      {sortedEvents.length === 0 && (
        <div className="mt-5 rounded-xl border border-dashed border-[#dce5d7] bg-[#fafcf8] px-6 py-8 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#edf6e8] text-[#315c46]">
            <FiCalendar className="text-lg" />
          </div>
          <p className="mt-3 text-sm font-semibold text-[#18392c]">
            {isScopedToMonth ? `No financial activities in ${selectedMonth}` : "No activity in the next 30 days"}
          </p>
          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400">
            {isScopedToMonth
              ? "There are no scheduled payments, contributions or reminders recorded for this month."
              : "You currently have no payments or deadlines scheduled during the next 30 days."}
          </p>
        </div>
      )}

      {/* ACTIVITIES LIST */}
      {sortedEvents.length > 0 && (
        <div className="mt-4 divide-y divide-[#edf0e9]">
          {sortedEvents.map((event) => {
            const statusInfo = getItemStatusInfo(event);
            const isReminder = event.isReminderEvent;
            const canNavigate = event.sourceType && event.sourceType !== "General" && event.sourceId;

            return (
              <div
                key={event.id}
                className={`flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 py-3.5 px-3 rounded-xl transition-all duration-150 hover:bg-[#fafcf9] ${
                  isReminder ? "bg-amber-50/30" : ""
                }`}
              >
                {/* ICON & MAIN INFO */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      isReminder ? "bg-amber-100 text-amber-800" : "bg-[#edf6e8] text-[#315c46]"
                    }`}
                  >
                    {isReminder ? <FiBell className="text-base" /> : <EventIcon type={event.type} />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-bold text-[#18392c]">
                        {event.cleanTitle || event.title}
                      </h3>

                      {/* STATUS PILL */}
                      <span
                        className={`rounded-md px-2 py-0.5 text-[9px] ${statusInfo.badgeStyle}`}
                      >
                        {statusInfo.label}
                      </span>

                      {/* REMINDER ACTIVE PILL */}
                      {isReminder ? (
                        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-900 flex items-center gap-1">
                          <FiBell className="text-[9px]" />
                          <span>Reminder Notice</span>
                        </span>
                      ) : (
                        <span
                          className={`rounded-md px-2 py-0.5 text-[9px] font-medium flex items-center gap-1 ${
                            event.reminderEnabled
                              ? "bg-[#edf6e8] text-[#2c5f3b]"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          <FiBell className="text-[9px]" />
                          <span>{event.reminderEnabled ? "Reminder Active" : "Reminder Off"}</span>
                        </span>
                      )}
                    </div>

                    {/* DATES & TYPE */}
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="text-[10px] uppercase font-semibold text-slate-400">
                        {getEventTypeLabel(event.type)}
                      </span>
                      <span>•</span>
                      {isReminder ? (
                        <>
                          <span className="font-semibold text-amber-900">
                            Alert: {formatDate(event.date)}
                          </span>
                          {event.dueDate && (
                            <span className="text-slate-400">
                              (Due: {formatDate(event.dueDate)})
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="font-medium text-[#5f7568]">
                          Due: {formatDate(event.date)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* AMOUNT & ACTIONS */}
                <div className="flex items-center gap-4 shrink-0 justify-end w-full sm:w-auto">
                  {Number(event.amount || 0) > 0 && (
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#18392c]">₹{formatMoney(event.amount)}</p>
                    </div>
                  )}

                  {/* QUICK REMINDER BUTTON */}
                  <button
                    type="button"
                    title={isReminder ? "Manage Reminder" : "Configure Reminder"}
                    onClick={() =>
                      setModalConfig({
                        isOpen: true,
                        data: event,
                        sourceType: event.sourceType,
                        sourceId: event.sourceId,
                        itemName: event.cleanTitle || event.title,
                        amount: event.amount,
                        dueDate: event.dueDate || event.date,
                      })
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2e8dc] text-[#52665b] hover:bg-[#edf6e8] hover:text-[#315c46] transition"
                  >
                    <FiSettings className="text-xs" />
                  </button>

                  {/* NAVIGATE TO PLAN */}
                  {canNavigate && (
                    <button
                      type="button"
                      title="View Plan Details"
                      onClick={() => handleOpenPlan(event)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 hover:bg-[#315c46] hover:text-white text-slate-600 transition"
                    >
                      <FiArrowRight className="text-xs" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FOOTER NOTE */}
      <div className="mt-4 border-t border-[#edf0e9] pt-3 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <FiCalendar className="text-xs text-[#6c8b72]" />
          <span>
            {isScopedToMonth
              ? `Scoped to ${selectedMonth}. View Financial Calendar for full year schedule.`
              : "Showing activity for the next 30 days. View Financial Calendar for full schedule."}
          </span>
        </div>
        <button
          type="button"
          onClick={() => navigate(selectedMonth ? `/calendar?month=${selectedMonth}` : "/calendar")}
          className="font-semibold text-[#315c46] hover:underline flex items-center gap-1"
        >
          <span>Open Calendar</span>
          <FiArrowRight className="text-[10px]" />
        </button>
      </div>

      {/* UNIFIED REMINDER MODAL */}
      <ReminderConfigModal
        isOpen={modalConfig.isOpen}
        onClose={() =>
          setModalConfig({
            isOpen: false,
            data: null,
            sourceType: "General",
            sourceId: null,
            itemName: "",
            amount: 0,
            dueDate: "",
          })
        }
        initialData={modalConfig.data}
        sourceType={modalConfig.sourceType}
        sourceId={modalConfig.sourceId}
        itemName={modalConfig.itemName}
        amount={modalConfig.amount}
        dueDate={modalConfig.dueDate}
        onSuccess={() => {
          loadUserReminders();
        }}
      />
    </section>
  );
}