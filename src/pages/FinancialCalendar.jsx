// ============================================================
// FINANCEOS - FINANCIAL CALENDAR
// ============================================================
//
// Displays financial events generated from:
//
// - Saving Goals
// - Investments
// - Insurance
// - Liabilities
//
// FinanceProvider
//      ↓
// financialCalendar.js
//      ↓
// FinancialCalendar.jsx
//
// ============================================================


// ============================================================
// IMPORT REACT
// ============================================================

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useSearchParams,
  useNavigate,
} from "react-router-dom";


// ============================================================
// IMPORT ICONS
// ============================================================

import {
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiTarget,
  FiTrendingUp,
  FiShield,
  FiCreditCard,
  FiPlus,
  FiX,
  FiBell,
  FiSettings,
  FiArrowRight,
  FiClock,
  FiExternalLink,
} from "react-icons/fi";


// ============================================================
// IMPORT REMINDER CONFIG MODAL
// ============================================================

import ReminderConfigModal
  from "../components/reminders/ReminderConfigModal.jsx";


// ============================================================
// IMPORT LAYOUT
// ============================================================

import Sidebar
  from "../components/layout/Sidebar.jsx";

import Topbar
  from "../components/layout/Topbar.jsx";


// ============================================================
// IMPORT FINANCE DATA
// ============================================================

import useFinance
  from "../context/useFinance.js";


// ============================================================
// IMPORT CALENDAR UTILITIES
// ============================================================

import {
  generateFinancialCalendarEvents,
  getEventsForMonth,
  getEventsForDate,
} from "../utils/financialCalendar.js";


// ============================================================
// FORMAT MONEY
// ============================================================

function formatMoney(amount) {
  return Number(
    amount || 0
  ).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 0,
    }
  );
}


// ============================================================
// FORMAT DATE KEY
// ============================================================
//
// Example:
//
// year  = 2026
// month = 6
// day   = 26
//
// Result:
// 2026-07-26
//
// ============================================================

function formatDateKey(
  year,
  month,
  day
) {
  const formattedMonth =
    String(
      month + 1
    ).padStart(
      2,
      "0"
    );

  const formattedDay =
    String(
      day
    ).padStart(
      2,
      "0"
    );

  return `${year}-${formattedMonth}-${formattedDay}`;
}


// ============================================================
// FORMAT DISPLAY DATE
// ============================================================

function formatDisplayDate(
  dateString
) {
  if (!dateString) {
    return "";
  }

  const date =
    new Date(
      `${dateString}T00:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return dateString;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}


// ============================================================
// EVENT LABEL
// ============================================================

function getEventLabel(type) {
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
      return "Insurance Maturity / Expiry";

    case "liability":
      return "EMI / Payment";

    case "liability-end":
      return "Liability Completion";

    case "user-reminder":
      return "Custom Reminder";

    default:
      return "Financial Event";
  }
}


// ============================================================
// EVENT ICON
// ============================================================

function EventIcon({
  type,
}) {
  if (
    type === "goal" ||
    type === "goal-deadline"
  ) {
    return <FiTarget />;
  }

  if (
    type === "investment" ||
    type === "investment-maturity"
  ) {
    return <FiTrendingUp />;
  }

  if (
    type === "insurance" ||
    type === "insurance-maturity"
  ) {
    return <FiShield />;
  }

  if (
    type === "liability" ||
    type === "liability-end"
  ) {
    return <FiCreditCard />;
  }

  if (type === "user-reminder") {
    return <FiBell />;
  }

  return <FiCalendar />;
}


// ============================================================
// FINANCIAL CALENDAR
// ============================================================

function FinancialCalendar() {


  // ==========================================================
  // GET FINANCE DATA
  // ==========================================================

  const {
    savingGoals,
    investments,
    insurancePolicies,
    liabilities,
    userReminders,
    loadUserReminders,
    userData,
    selectedMonth,
    setSelectedMonth,
    sidebarCollapsed,
  } = useFinance();

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof loadUserReminders === "function") {
      loadUserReminders();
    }
  }, []);

  const [reminderModalConfig, setReminderModalConfig] = useState({
    isOpen: false,
    data: null,
    sourceType: "General",
    sourceId: null,
    itemName: "",
    amount: 0,
    dueDate: "",
  });

  const [filterType, setFilterType] = useState("all"); // "all" | "due" | "reminders"


  // ==========================================================
  // SAFE ARRAYS
  // ==========================================================
  //
  // IMPORTANT:
  //
  // These arrays are memoized.
  //
  // Previously:
  //
  // const goals = Array.isArray(savingGoals)
  //   ? savingGoals
  //   : [];
  //
  // could create a new [] reference on every render.
  //
  // Because these values are dependencies of another useMemo,
  // ESLint reported dependency warnings.
  //
  // ==========================================================

  const goals =
    useMemo(
      () =>
        Array.isArray(
          savingGoals
        )
          ? savingGoals
          : [],
      [
        savingGoals,
      ]
    );


  const investmentRecords =
    useMemo(
      () =>
        Array.isArray(
          investments
        )
          ? investments
          : [],
      [
        investments,
      ]
    );


  const insuranceRecords =
    useMemo(
      () =>
        Array.isArray(
          insurancePolicies
        )
          ? insurancePolicies
          : [],
      [
        insurancePolicies,
      ]
    );


  const liabilityRecords =
    useMemo(
      () =>
        Array.isArray(
          liabilities
        )
          ? liabilities
          : [],
      [
        liabilities,
      ]
    );


  // ==========================================================
  // TODAY
  // ==========================================================

  const today =
    new Date();

  const todayKey =
    formatDateKey(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

  // ==========================================================
  // RESOLVE SELECTED MONTH CONTEXT
  // ==========================================================

  const monthParam = searchParams.get("month") || selectedMonth;

  const initialCalendarDate = useMemo(() => {
    if (monthParam && /^\d{4}-\d{1,2}$/.test(monthParam)) {
      const [y, m] = monthParam.split("-").map(Number);
      if (y >= 2000 && y <= 2100 && m >= 1 && m <= 12) {
        return new Date(y, m - 1, 1);
      }
    }
    return new Date(today.getFullYear(), today.getMonth(), 1);
  }, [monthParam]);

  // ==========================================================
  // DISPLAYED MONTH
  // ==========================================================

  const [
    currentDate,
    setCurrentDate,
  ] = useState(
    initialCalendarDate
  );

  useEffect(() => {
    if (monthParam && /^\d{4}-\d{1,2}$/.test(monthParam)) {
      const [y, m] = monthParam.split("-").map(Number);
      if (y >= 2000 && y <= 2100 && m >= 1 && m <= 12) {
        setCurrentDate(new Date(y, m - 1, 1));
      }
    }
  }, [monthParam]);

  // ==========================================================
  // SELECTED DATE
  // ==========================================================

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(
    todayKey
  );


  // ==========================================================
  // CURRENT YEAR AND MONTH
  // ==========================================================

  const year =
    currentDate.getFullYear();


  const month =
    currentDate.getMonth();


  // ==========================================================
  // GENERATE ALL EVENTS
  // ==========================================================

  const allEvents =
    useMemo(
      () =>
        generateFinancialCalendarEvents({
          savingGoals:
            goals,

          investments:
            investmentRecords,

          insurancePolicies:
            insuranceRecords,

          liabilities:
            liabilityRecords,

          userReminders:
            userReminders || [],

          currentUserId:
            userData?._id || userData?.id,
        }),

      [
        goals,
        investmentRecords,
        insuranceRecords,
        liabilityRecords,
        userReminders,
        userData,
      ]
    );


  // ==========================================================
  // CURRENT MONTH EVENTS
  // ==========================================================

  const monthEvents =
    useMemo(
      () =>
        getEventsForMonth(
          allEvents,
          year,
          month
        ),
      [
        allEvents,
        year,
        month,
      ]
    );

  const filteredMonthEvents = useMemo(() => {
    if (filterType === "due") return monthEvents.filter((e) => !e.isReminderEvent);
    if (filterType === "reminders") return monthEvents.filter((e) => e.isReminderEvent);
    return monthEvents;
  }, [monthEvents, filterType]);


  // ==========================================================
  // SELECTED DATE EVENTS
  // ==========================================================

  const selectedDateEvents =
    useMemo(
      () =>
        getEventsForDate(
          allEvents,
          selectedDate
        ),
      [
        allEvents,
        selectedDate,
      ]
    );

  const filteredSelectedDateEvents = useMemo(() => {
    if (filterType === "due") return selectedDateEvents.filter((e) => !e.isReminderEvent);
    if (filterType === "reminders") return selectedDateEvents.filter((e) => e.isReminderEvent);
    return selectedDateEvents;
  }, [selectedDateEvents, filterType]);


  // ==========================================================
  // CALENDAR INFORMATION
  // ==========================================================

  const firstDay =
    new Date(
      year,
      month,
      1
    ).getDay();


  const daysInMonth =
    new Date(
      year,
      month + 1,
      0
    ).getDate();


  const monthName =
    currentDate.toLocaleDateString(
      "en-US",
      {
        month: "long",
        year: "numeric",
      }
    );


  // ==========================================================
  // PREVIOUS MONTH
  // ==========================================================

  function goPreviousMonth() {
    const previousMonth =
      new Date(
        year,
        month - 1,
        1
      );

    setCurrentDate(
      previousMonth
    );

    setSelectedDate(
      formatDateKey(
        previousMonth.getFullYear(),
        previousMonth.getMonth(),
        1
      )
    );

    const formatted = `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(formatted);
    setSearchParams({ month: formatted });
  }


  // ==========================================================
  // NEXT MONTH
  // ==========================================================

  function goNextMonth() {
    const nextMonth =
      new Date(
        year,
        month + 1,
        1
      );

    setCurrentDate(
      nextMonth
    );

    setSelectedDate(
      formatDateKey(
        nextMonth.getFullYear(),
        nextMonth.getMonth(),
        1
      )
    );

    const formatted = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(formatted);
    setSearchParams({ month: formatted });
  }


  // ==========================================================
  // GO TO TODAY
  // ==========================================================

  function goToday() {
    const now =
      new Date();

    setCurrentDate(
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      )
    );

    setSelectedDate(
      formatDateKey(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      )
    );

    setSelectedMonth("");
    try {
      sessionStorage.removeItem("financeos_selected_month");
    } catch (e) {}
    setSearchParams({});
  }


  // ==========================================================
  // BUILD CALENDAR CELLS
  // ==========================================================

  const calendarCells =
    [];


  // ==========================================================
  // EMPTY CELLS BEFORE FIRST DAY
  // ==========================================================

  for (
    let index = 0;
    index < firstDay;
    index += 1
  ) {
    calendarCells.push(
      <div
        key={`empty-${index}`}
        className="min-h-[110px] border-b border-r border-[#edf0e9]/50 bg-white/40"
      />
    );
  }


  // ==========================================================
  // DAYS
  // ==========================================================

  for (
    let day = 1;
    day <= daysInMonth;
    day += 1
  ) {
    const dateKey =
      formatDateKey(
        year,
        month,
        day
      );


    const dayEvents =
      filteredMonthEvents.filter(
        (event) =>
          event.date ===
          dateKey
      );

    const isToday =
      dateKey ===
      todayKey;

    const isSelected =
      dateKey ===
      selectedDate;

    calendarCells.push(
      <button
        key={dateKey}
        type="button"
        onClick={() => setSelectedDate(dateKey)}
        className={`min-h-[110px] border-b border-r border-[#edf0e9]/50 p-2 text-left transition-all duration-300 ${
          isSelected
            ? "bg-gradient-to-br from-[#f2f8ed] to-[#e6f4cf]/30 shadow-inner"
            : "bg-transparent hover:bg-white/80 hover:shadow-sm"
        }`}
      >
        {/* DAY HEADER */}
        <div className="flex items-center justify-between">
          <span
            className={
              isToday
                ? "flex h-7 w-7 items-center justify-center rounded-full bg-[#315c46] text-xs font-bold text-white"
                : "flex h-7 w-7 items-center justify-center text-xs font-semibold text-[#52665b]"
            }
          >
            {day}
          </span>

          {/* EVENT COUNT */}
          {dayEvents.length > 0 && (
            <span className="rounded-full bg-[#e9f4e2] px-1.5 py-0.5 text-[9px] font-semibold text-[#315c46]">
              {dayEvents.length}
            </span>
          )}
        </div>

        {/* EVENTS */}
        <div className="mt-2 space-y-1">
          {dayEvents.slice(0, 3).map((event) => (
            <div
              key={event.id}
              title={`${event.title}${event.dueDate ? ` (Due: ${event.dueDate})` : ""}`}
              className={`truncate rounded-md px-1.5 py-0.5 text-[9px] font-medium flex items-center gap-1 ${
                event.isReminderEvent
                  ? "bg-amber-100/90 text-amber-900 border border-amber-200/60"
                  : "bg-[#e9f4e2] text-[#315c46]"
              }`}
            >
              {event.isReminderEvent && (
                <FiBell className="shrink-0 text-[8px] text-amber-700" />
              )}
              <span className="truncate">{event.cleanTitle || event.title}</span>
            </div>
          ))}

          {/* MORE EVENTS */}
          {dayEvents.length > 3 && (
            <p className="px-1 text-[9px] font-medium text-slate-400">
              +{dayEvents.length - 3} more
            </p>
          )}
        </div>
      </button>
    );
  }


  // ==========================================================
  // COMPLETE FINAL WEEK
  // ==========================================================

  const remainder =
    calendarCells.length %
    7;


  if (
    remainder !== 0
  ) {
    const emptyCells =
      7 -
      remainder;


    for (
      let index = 0;
      index < emptyCells;
      index += 1
    ) {
      calendarCells.push(
        <div
          key={`ending-${index}`}
          className="min-h-[110px] border-b border-r border-[#edf0e9]/50 bg-white/40"
        />
      );
    }
  }


  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="min-h-screen bg-[#f6f8f4]">


      {/* ======================================================
          SIDEBAR
         ====================================================== */}

      <Sidebar />


      {/* ======================================================
          MAIN
         ====================================================== */}

      <main className={`min-h-screen transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-64"}`}>


        {/* TOPBAR */}

        <Topbar />


        {/* ====================================================
            PAGE CONTENT
           ==================================================== */}

        <div className="px-8 py-6">


          {/* ==================================================
              HEADER
             ================================================== */}

          <div className="flex flex-wrap items-end justify-between gap-4">

            <div>

              <p className="text-sm font-medium text-[#5f7568]">
                FinanceOS Schedule
              </p>


              <h1 className="mt-1 text-2xl font-bold text-[#18392c]">
                Financial Calendar
              </h1>


              <p className="mt-1 text-sm text-slate-500">
                View your upcoming payments,
                contributions, deadlines and
                maturity dates.
              </p>

            </div>


            {/* BUTTONS */}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setReminderModalConfig({
                    isOpen: true,
                    data: null,
                    sourceType: "General",
                    sourceId: null,
                    itemName: "",
                    amount: 0,
                    dueDate: selectedDate,
                  })
                }
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4f8d32] to-[#3a6825] px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-[#4f8d32]/20 transition-all hover:shadow-[#4f8d32]/40 hover:-translate-y-0.5"
              >
                <FiPlus />
                Add Reminder
              </button>

              <button
                type="button"
                onClick={goToday}
                className="flex items-center gap-2 rounded-xl border border-[#dfe6da] bg-white/60 backdrop-blur px-4 py-2.5 text-xs font-semibold text-[#315c46] shadow-sm transition hover:bg-white"
              >
                <FiCalendar />
                Today
              </button>
            </div>

          </div>


          {/* ==================================================
              CALENDAR
             ================================================== */}

          <section className="mt-6 overflow-hidden rounded-[24px] border border-[#e2e8dc]/60 bg-white/60 backdrop-blur-xl shadow-xl shadow-slate-200/40">


            {/* =================================================
                MONTH NAVIGATION
               ================================================= */}

            <div className="flex items-center justify-between border-b border-[#e2e8dc] px-5 py-4">


              {/* PREVIOUS */}

              <button
                type="button"
                onClick={goPreviousMonth}
                aria-label="Previous month"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e2e8dc] text-[#52665b] transition hover:bg-[#f4f7f1]"
              >
                <FiChevronLeft />
              </button>


              {/* CURRENT MONTH */}

              <div className="text-center">
                <h2 className="text-base font-bold text-[#18392c]">
                  {monthName}
                </h2>

                <p className="mt-1 text-[10px] text-slate-400">
                  {filteredMonthEvents.length}{" "}
                  {filteredMonthEvents.length === 1
                    ? "financial event"
                    : "financial events"}
                </p>
              </div>


              {/* NEXT */}

              <button
                type="button"
                onClick={goNextMonth}
                aria-label="Next month"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e2e8dc] text-[#52665b] transition hover:bg-[#f4f7f1]"
              >
                <FiChevronRight />
              </button>

            </div>

            {/* =================================================
                EVENT FILTER TABS
               ================================================= */}
            <div className="flex items-center gap-2 border-b border-[#e2e8dc] px-5 py-2.5 bg-[#fbfdfa]">
              <button
                type="button"
                onClick={() => setFilterType("all")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  filterType === "all"
                    ? "bg-[#315c46] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All Events ({monthEvents.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("due")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  filterType === "due"
                    ? "bg-[#315c46] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>Payments Due ({monthEvents.filter((e) => !e.isReminderEvent).length})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterType("reminders")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  filterType === "reminders"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                }`}
              >
                <FiBell className="text-[11px]" />
                <span>Reminder Alerts ({monthEvents.filter((e) => e.isReminderEvent).length})</span>
              </button>
            </div>


            {/* =================================================
                WEEKDAY HEADER
               ================================================= */}

            <div className="grid grid-cols-7 border-b border-[#edf0e9]/50 bg-white/50 backdrop-blur">

              {[
                "Sun",
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat",
              ].map(
                (weekday) => (

                  <div
                    key={
                      weekday
                    }

                    className="border-r border-[#edf0e9] px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400"
                  >
                    {
                      weekday
                    }
                  </div>

                )
              )}

            </div>


            {/* =================================================
                DAYS
               ================================================= */}

            <div className="grid grid-cols-7">
              {
                calendarCells
              }
            </div>

          </section>


          {/* ==================================================
              SELECTED DATE DETAILS
             ================================================== */}

          <section className="mt-6 rounded-2xl border border-[#e2e8dc] bg-white p-5">


            {/* HEADER */}

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf6e8] text-[#315c46]">
                <FiCalendar />
              </div>


              <div>

                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6c8b72]">
                  Selected Date
                </p>


                <h2 className="mt-1 text-base font-bold text-[#18392c]">
                  {
                    formatDisplayDate(
                      selectedDate
                    )
                  }
                </h2>

              </div>

            </div>


            {/* =================================================
                EMPTY DATE
               ================================================= */}

            {selectedDateEvents.length ===
              0 && (

              <div className="mt-5 rounded-xl border border-dashed border-[#dce5d7] bg-[#fafcf8] px-6 py-8 text-center">

                <FiCalendar className="mx-auto text-xl text-[#6c8b72]" />


                <p className="mt-3 text-sm font-semibold text-[#18392c]">
                  No financial events
                </p>


                <p className="mx-auto mt-1 max-w-lg text-xs leading-5 text-slate-400">
                  There are no scheduled payments,
                  contributions, deadlines or
                  maturity events on this date.
                </p>

              </div>

            )}


            {/* =================================================
                SELECTED DATE EVENTS
               ================================================= */}

            {/* =================================================
                SELECTED DATE EVENTS
               ================================================= */}

            {filteredSelectedDateEvents.length > 0 && (
              <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                {filteredSelectedDateEvents.map((event) => {
                  const isReminder = event.isReminderEvent;
                  const canNavigateToPlan =
                    event.sourceType &&
                    event.sourceType !== "General" &&
                    event.sourceId;

                  const handleNavigate = () => {
                    if (event.sourceType === "SavingGoal") navigate("/saving-goals");
                    else if (event.sourceType === "Investment") navigate("/plans?tab=investments");
                    else if (event.sourceType === "Insurance") navigate("/plans?tab=insurance");
                    else if (event.sourceType === "Liability") navigate("/plans?tab=liabilities");
                  };

                  return (
                    <div
                      key={event.id}
                      className={`rounded-2xl border p-4 transition-all duration-200 ${
                        isReminder
                          ? "border-amber-200/80 bg-gradient-to-br from-amber-50/40 to-amber-100/20 shadow-sm"
                          : "border-[#e2e8dc] bg-[#fafcf8]"
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        {/* ICON */}
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                            isReminder
                              ? "bg-amber-100 text-amber-800 shadow-sm"
                              : "bg-[#edf6e8] text-[#315c46]"
                          }`}
                        >
                          {isReminder ? <FiBell className="text-lg" /> : <EventIcon type={event.type} />}
                        </div>

                        {/* EVENT DETAILS */}
                        <div className="min-w-0 flex-1">
                          {/* BADGES ROW */}
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase ${
                                isReminder
                                  ? "bg-amber-200/80 text-amber-900"
                                  : "bg-[#e2f0dc] text-[#2c5f3b]"
                              }`}
                            >
                              {isReminder ? "Reminder Alert" : "Payment Due"}
                            </span>

                            <span className="text-[9px] font-semibold uppercase text-slate-400">
                              • {getEventLabel(event.type)}
                            </span>
                          </div>

                          {/* TITLE */}
                          <h3 className="text-sm font-bold text-[#18392c]">
                            {event.cleanTitle || event.title}
                          </h3>

                          {/* DESCRIPTION */}
                          {event.description && (
                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              {event.description}
                            </p>
                          )}

                          {/* DATES & AMOUNT */}
                          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                            {isReminder ? (
                              <>
                                <span className="font-semibold text-amber-900 flex items-center gap-1">
                                  <FiClock className="text-[11px]" />
                                  Alert Date: {formatDisplayDate(event.date)}
                                </span>
                                {event.dueDate && (
                                  <span className="text-slate-500 flex items-center gap-1">
                                    <FiCalendar className="text-[11px]" />
                                    Payment Due: {formatDisplayDate(event.dueDate)}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="font-semibold text-[#315c46] flex items-center gap-1">
                                <FiCalendar className="text-[11px]" />
                                Due Date: {formatDisplayDate(event.date)}
                              </span>
                            )}

                            {Number(event.amount || 0) > 0 && (
                              <span className="font-bold text-[#315c46]">
                                ₹{formatMoney(event.amount)}
                              </span>
                            )}
                          </div>

                          {/* STATUS & CHANNELS */}
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {event.status && (
                              <span className="rounded-full bg-white border border-slate-200/80 px-2 py-0.5 text-[9px] font-medium text-slate-600">
                                {event.status}
                              </span>
                            )}

                            {isReminder && event.channels && (
                              <div className="flex items-center gap-1">
                                {event.channels.inApp && (
                                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-medium text-amber-800">
                                    In-App
                                  </span>
                                )}
                                {event.channels.email && (
                                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-medium text-blue-800">
                                    Email
                                  </span>
                                )}
                              </div>
                            )}

                            {!isReminder && (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                                  event.reminderEnabled
                                    ? "bg-[#edf6e8] text-[#315c46]"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {event.reminderEnabled ? "🔔 Reminder Active" : "Reminder Off"}
                              </span>
                            )}
                          </div>

                          {/* ACTIONS */}
                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setReminderModalConfig({
                                  isOpen: true,
                                  data: event,
                                  sourceType: event.sourceType,
                                  sourceId: event.sourceId,
                                  itemName: event.cleanTitle || event.title,
                                  amount: event.amount,
                                  dueDate: event.dueDate || event.date,
                                })
                              }
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#315c46] bg-white border border-[#d8e2d4] hover:bg-[#f4f7f2] transition"
                            >
                              <FiSettings className="text-xs" />
                              <span>{isReminder ? "Manage Reminder" : "Configure Reminder"}</span>
                            </button>

                            {canNavigateToPlan && (
                              <button
                                type="button"
                                onClick={handleNavigate}
                                className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-[#315c46] transition"
                              >
                                <span>Go to Plan</span>
                                <FiArrowRight className="text-xs" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </section>


          {/* ==================================================
              NO FINANCIAL RECORDS
             ================================================== */}

          {allEvents.length === 0 && (
            <section className="mt-6 rounded-2xl border border-dashed border-[#dce5d7] bg-white px-6 py-8 text-center">
              <FiCalendar className="mx-auto text-2xl text-[#6c8b72]" />
              <h2 className="mt-3 text-sm font-semibold text-[#18392c]">
                No financial events yet
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-xs leading-5 text-slate-400">
                Create a saving goal, investment, insurance policy or liability with schedule information. FinanceOS will automatically display its financial dates here.
              </p>
            </section>
          )}

        </div>

        {/* ==================================================
            UNIFIED REMINDER CONFIGURATION MODAL
           ================================================== */}
        <ReminderConfigModal
          isOpen={reminderModalConfig.isOpen}
          onClose={() =>
            setReminderModalConfig({
              isOpen: false,
              data: null,
              sourceType: "General",
              sourceId: null,
              itemName: "",
              amount: 0,
              dueDate: "",
            })
          }
          initialData={reminderModalConfig.data}
          sourceType={reminderModalConfig.sourceType}
          sourceId={reminderModalConfig.sourceId}
          itemName={reminderModalConfig.itemName}
          amount={reminderModalConfig.amount}
          dueDate={reminderModalConfig.dueDate}
          onSuccess={() => {
            loadUserReminders();
          }}
        />

      </main>

    </div>
  );
}


// ============================================================
// DEFAULT EXPORT
// ============================================================

export default FinancialCalendar;