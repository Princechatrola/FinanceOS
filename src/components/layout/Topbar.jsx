// ============================================================
// FINANCEOS - USER TOPBAR
// ============================================================
//
// Notification Center:
//
// 1. Automatic Financial Reminders
// 2. Shared FinanceProvider Notifications
// 3. Admin In-App Messages can be added to FinanceProvider
// 4. Unread Count
// 5. Mark One as Read
// 6. Mark All as Read
//
// IMPORTANT:
//
// Notification state is now controlled by FinanceProvider.
//
// No separate localStorage read-notification system is used here.
// ============================================================


import {
  useEffect,
  useMemo,
  useState,
} from "react";


import {
  FiBell,
  FiChevronDown,
  FiMenu,
  FiX,
  FiCalendar,
  FiTarget,
  FiTrendingUp,
  FiShield,
  FiCreditCard,
  FiCheck,
  FiMessageSquare,
  FiUser,
} from "react-icons/fi";


// ============================================================
// FINANCE CONTEXT
// ============================================================

import useFinance
  from "../../context/useFinance.js";


// ============================================================
// FINANCIAL CALENDAR
// ============================================================

import {
  generateFinancialCalendarEvents,
} from "../../utils/financialCalendar.js";


// ============================================================
// REMINDER ENGINE
// ============================================================

import {
  generateFinancialReminders,
  getActiveReminders,
  getThisMonthReminders,
} from "../../utils/financialReminders.js";


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
// FORMAT DATE
// ============================================================

function formatDate(
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
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );

}


// ============================================================
// FORMAT DATE + TIME
// ============================================================

function formatDateTime(
  value
) {

  if (!value) {
    return "";
  }


  const date =
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }


  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

}


// ============================================================
// CHECK IF DATE IS IN CURRENT CALENDAR MONTH
// ============================================================

function isThisMonth(dateVal) {
  if (!dateVal) return false;
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth();

  if (dateVal instanceof Date) {
    return (
      !isNaN(dateVal.getTime()) &&
      dateVal.getFullYear() === curYear &&
      dateVal.getMonth() === curMonth
    );
  }

  if (typeof dateVal === "string") {
    const clean = dateVal.split("T")[0];
    const parts = clean.split("-").map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return parts[0] === curYear && (parts[1] - 1) === curMonth;
    }
  }

  const d = new Date(dateVal);
  return (
    !isNaN(d.getTime()) &&
    d.getFullYear() === curYear &&
    d.getMonth() === curMonth
  );
}


// ============================================================
// REMINDER ICON
// ============================================================

function ReminderIcon({
  type,
}) {

  if (
    type === "goal" ||
    type === "goal-deadline"
  ) {

    return (
      <FiTarget />
    );

  }


  if (
    type === "investment" ||
    type === "investment-maturity"
  ) {

    return (
      <FiTrendingUp />
    );

  }


  if (
    type === "insurance" ||
    type === "insurance-maturity"
  ) {

    return (
      <FiShield />
    );

  }


  if (
    type === "liability" ||
    type === "liability-end"
  ) {

    return (
      <FiCreditCard />
    );

  }


  return (
    <FiCalendar />
  );

}


// ============================================================
// TOPBAR
// ============================================================

function Topbar() {


  // ==========================================================
  // FINANCE CONTEXT
  // ==========================================================

  const {

    // --------------------------------------------------------
    // USER
    // --------------------------------------------------------

    userData,


    // --------------------------------------------------------
    // FINANCE DATA
    // --------------------------------------------------------

    savingGoals,
    investments,
    insurancePolicies,
    liabilities,
    userReminders,


    // --------------------------------------------------------
    // SHARED NOTIFICATIONS
    // --------------------------------------------------------

    notifications:
      sharedNotifications,

    addNotification,

    markNotificationAsRead,

    markAllNotificationsAsRead,

    unreadNotificationCount,

  } = useFinance();


  // ==========================================================
  // NOTIFICATION DROPDOWN
  // ==========================================================

  const [
    notificationsOpen,
    setNotificationsOpen,
  ] = useState(false);


  // ==========================================================
  // SAFE ARRAYS
  // ==========================================================

  const goals = useMemo(() => 
    Array.isArray(
      savingGoals
    )
      ? savingGoals
      : [], [savingGoals]);


  const investmentRecords = useMemo(() => 
    Array.isArray(
      investments
    )
      ? investments
      : [], [investments]);


  const insuranceRecords = useMemo(() => 
    Array.isArray(
      insurancePolicies
    )
      ? insurancePolicies
      : [], [insurancePolicies]);


  const liabilityRecords = useMemo(() => 
    Array.isArray(
      liabilities
    )
      ? liabilities
      : [], [liabilities]);


  const storedNotifications = useMemo(() => 
    Array.isArray(
      sharedNotifications
    )
      ? sharedNotifications
      : [], [sharedNotifications]);


  // ==========================================================
  // LOGGED IN USER IDENTIFIERS
  // ==========================================================

  const currentUserId = userData?._id || userData?.id;
  const currentUserCode = userData?.userId;
  const currentUserEmail = (userData?.email || "").toLowerCase();


  // ==========================================================
  // USER-SPECIFIC FINANCIAL PLAN RECORDS (STRICT USER ISOLATION)
  // ==========================================================

  const userGoals = useMemo(
    () =>
      goals.filter(
        (g) =>
          !currentUserId ||
          !g.userId ||
          String(g.userId) === String(currentUserId) ||
          g.userId === currentUserCode
      ),
    [goals, currentUserId, currentUserCode]
  );

  const userInvestments = useMemo(
    () =>
      investmentRecords.filter(
        (inv) =>
          !currentUserId ||
          !inv.userId ||
          String(inv.userId) === String(currentUserId) ||
          inv.userId === currentUserCode
      ),
    [investmentRecords, currentUserId, currentUserCode]
  );

  const userInsurances = useMemo(
    () =>
      insuranceRecords.filter(
        (ins) =>
          !currentUserId ||
          !ins.userId ||
          String(ins.userId) === String(currentUserId) ||
          ins.userId === currentUserCode
      ),
    [insuranceRecords, currentUserId, currentUserCode]
  );

  const userLiabilities = useMemo(
    () =>
      liabilityRecords.filter(
        (l) =>
          !currentUserId ||
          !l.userId ||
          String(l.userId) === String(currentUserId) ||
          l.userId === currentUserCode
      ),
    [liabilityRecords, currentUserId, currentUserCode]
  );

  const userCustomReminders = useMemo(
    () =>
      (userReminders || []).filter(
        (r) =>
          !currentUserId ||
          String(r.userId) === String(currentUserId) ||
          r.userId === currentUserCode
      ),
    [userReminders, currentUserId, currentUserCode]
  );


  // ==========================================================
  // FINANCIAL CALENDAR EVENTS
  // ==========================================================

  const calendarEvents =
    useMemo(
      () =>
        generateFinancialCalendarEvents({

          savingGoals:
            userGoals,

          investments:
            userInvestments,

          insurancePolicies:
            userInsurances,

          liabilities:
            userLiabilities,

          userReminders:
            userCustomReminders,

          currentUserId,

        }),
      [
        userGoals,
        userInvestments,
        userInsurances,
        userLiabilities,
        userCustomReminders,
        currentUserId,
      ]
    );


  // ==========================================================
  // GENERATE FINANCIAL REMINDERS
  // ==========================================================

  const allReminders =
    useMemo(
      () =>
        generateFinancialReminders(
          calendarEvents
        ),
      [
        calendarEvents,
      ]
    );


  // ==========================================================
  // THIS MONTH'S FINANCIAL REMINDERS ONLY
  // ==========================================================

  const thisMonthReminders =
    useMemo(
      () =>
        getThisMonthReminders(
          allReminders
        ),
      [
        allReminders,
      ]
    );


  // ==========================================================
  // ADD THIS MONTH'S REMINDERS TO SHARED NOTIFICATION CENTER
  // ==========================================================

  useEffect(
    () => {

      if (
        typeof addNotification !==
        "function" ||
        !currentUserId
      ) {
        return;
      }


      thisMonthReminders.forEach(
        (reminder) => {

          const channels =
            reminder.channels ||
            reminder.reminder?.channels ||
            null;


          if (
            channels &&
            channels.inApp === false
          ) {
            return;
          }


          const notificationId =
            `reminder-${reminder.id}`;


          addNotification({

            id:
              notificationId,

            userId:
              currentUserId,

            type:
              reminder.eventType ||
              reminder.type ||
              "reminder",

            category:
              "Financial Reminder",

            title:
              reminder.title ||
              "Financial Reminder",

            message:
              reminder.message ||
              "",

            source:
              "automatic-reminder",

            sourceId:
              reminder.id,

            notificationType:
              "reminder",

            eventType:
              reminder.eventType,

            eventDate:
              reminder.eventDate,

            reminderDate:
              reminder.reminderDate,

            amount:
              Number(
                reminder.amount ||
                0
              ),

            createdAt:
              reminder.reminderDate ||
              reminder.eventDate ||
              new Date().toISOString(),

          });

        }
      );

    },
    [
      thisMonthReminders,
      addNotification,
      currentUserId,
    ]
  );


  // ==========================================================
  // FILTER NOTIFICATIONS: THIS MONTH & SPECIFIC USER ONLY
  // ==========================================================

  const notifications =
    useMemo(
      () => {

        if (!currentUserId) return [];

        return storedNotifications
          .filter((notification) => {

            // 1. Specific logged-in user check
            const notifUserId =
              notification.userId ||
              notification.recipientUser;

            if (notifUserId) {
              const match =
                String(notifUserId) === String(currentUserId) ||
                String(notifUserId) === String(currentUserCode);

              if (!match) return false;
            }

            if (notification.recipientEmail && currentUserEmail) {
              if (
                notification.recipientEmail.toLowerCase() !==
                currentUserEmail
              ) {
                return false;
              }
            }

            // 2. This month check
            const dateVal =
              notification.reminderDate ||
              notification.eventDate ||
              notification.scheduledAt ||
              notification.date ||
              notification.createdAt;

            return isThisMonth(dateVal);

          })
          .sort(
            (
              first,
              second
            ) => {

              const firstDate =
                new Date(
                  first.createdAt ||
                  first.date ||
                  first.eventDate ||
                  first.reminderDate ||
                  0
                ).getTime();


              const secondDate =
                new Date(
                  second.createdAt ||
                  second.date ||
                  second.eventDate ||
                  second.reminderDate ||
                  0
                ).getTime();


              return (
                (secondDate || 0) -
                (firstDate || 0)
              );

            }
          );

      },
      [
        storedNotifications,
        currentUserId,
        currentUserCode,
        currentUserEmail,
      ]
    );


  // ==========================================================
  // UNREAD COUNT FOR THIS MONTH
  // ==========================================================

  const unreadCount =
    useMemo(
      () =>
        notifications.filter(
          (notification) =>
            !notification.read
        ).length,
      [
        notifications,
      ]
    );


  // ==========================================================
  // MARK ONE AS READ
  // ==========================================================

  function markAsRead(
    id
  ) {

    if (
      typeof markNotificationAsRead ===
      "function"
    ) {

      markNotificationAsRead(
        id
      );

    }

  }


  // ==========================================================
  // MARK ALL AS READ (THIS MONTH)
  // ==========================================================

  function markAllAsRead() {

    if (
      typeof markAllNotificationsAsRead ===
      "function"
    ) {

      const thisMonthIds =
        notifications.map(
          (n) => n.id
        );

      markAllNotificationsAsRead(
        thisMonthIds
      );

    }

  }


  // ==========================================================
  // USER INFORMATION
  // ==========================================================

  const userName =
    userData?.name ||
    "User";


  const userRole =
    userData?.role ||
    "Investor";


  const userInitial =
    userName
      .charAt(0)
      .toUpperCase();


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <header className="relative z-30 flex h-16 items-center justify-between border-b border-[#e2e8dc] bg-white px-8">


      {/* ======================================================
          MOBILE MENU
      ====================================================== */}

      <button
        type="button"
        className="text-xl text-[#52665b] lg:hidden"
        aria-label="Open navigation menu"
      >

        <FiMenu />

      </button>


      {/* ======================================================
          LOCATION
      ====================================================== */}

      <div className="hidden lg:block">

        <p className="text-xs font-medium text-slate-400">
          FinanceOS
        </p>


        <h2 className="text-sm font-semibold text-[#18392c]">
          Financial Overview
        </h2>

      </div>


      {/* ======================================================
          RIGHT SIDE
      ====================================================== */}

      <div className="ml-auto flex items-center gap-4">


        {/* ====================================================
            NOTIFICATION CENTER
        ==================================================== */}

        <div className="relative">


          {/* ==================================================
              BELL
          ================================================== */}

          <button
            type="button"

            onClick={
              () =>
                setNotificationsOpen(
                  (current) =>
                    !current
                )
            }

            className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition ${
              notificationsOpen

                ? "border-[#aac59a] bg-[#edf6e8] text-[#315c46]"

                : "border-[#e2e8dc] bg-[#f8faf6] text-[#315c46] hover:bg-[#edf3e8]"
            }`}

            aria-label="View notifications"

            aria-expanded={
              notificationsOpen
            }
          >

            <FiBell className="text-lg" />


            {/* ================================================
                UNREAD BADGE
            ================================================ */}

            {unreadCount > 0 && (

              <span className="absolute -right-1 -top-1 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">

                {
                  unreadCount > 9
                    ? "9+"
                    : unreadCount
                }

              </span>

            )}

          </button>


          {/* ==================================================
              NOTIFICATION DROPDOWN
          ================================================== */}

          {notificationsOpen && (

            <div className="absolute right-0 top-12 z-50 w-[400px] overflow-hidden rounded-2xl border border-[#e2e8dc] bg-white shadow-xl">


              {/* ==============================================
                  HEADER
              ============================================== */}

              <div className="flex items-start justify-between border-b border-[#edf0e9] px-5 py-4">

                <div>

                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#18392c]">
                      Notifications
                    </h3>

                    <span className="rounded-full bg-[#edf6e8] px-2 py-0.5 text-[9px] font-bold text-[#2d523e]">
                      {new Date().toLocaleString("en-IN", { month: "short", year: "numeric" })}
                    </span>
                  </div>


                  <p className="mt-1 text-[10px] text-slate-400">

                    {
                      unreadCount > 0

                        ? `${unreadCount} unread notification${
                            unreadCount === 1
                              ? ""
                              : "s"
                          } this month`

                        : "You're up to date this month"
                    }

                  </p>

                </div>


                <button
                  type="button"

                  onClick={
                    () =>
                      setNotificationsOpen(
                        false
                      )
                  }

                  aria-label="Close notifications"

                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-[#f4f7f1] hover:text-[#18392c]"
                >

                  <FiX />

                </button>

              </div>


              {/* ==============================================
                  MARK ALL READ
              ============================================== */}

              {unreadCount > 0 && (

                <div className="flex justify-end border-b border-[#edf0e9] px-5 py-2">

                  <button
                    type="button"

                    onClick={
                      markAllAsRead
                    }

                    className="flex items-center gap-1.5 text-[10px] font-semibold text-[#315c46] transition hover:text-[#18392c]"
                  >

                    <FiCheck />

                    Mark all as read

                  </button>

                </div>

              )}


              {/* ==============================================
                  EMPTY STATE
              ============================================== */}

              {notifications.length ===
                0 && (

                <div className="px-6 py-10 text-center">

                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#edf6e8] text-[#315c46]">

                    <FiBell />

                  </div>


                  <p className="mt-3 text-sm font-semibold text-[#18392c]">
                    No notifications for {new Date().toLocaleString("en-IN", { month: "long" })}
                  </p>


                  <p className="mx-auto mt-1 max-w-[280px] text-[10px] leading-5 text-slate-400">

                    Financial reminders and messages for this month will appear here.

                  </p>

                </div>

              )}


              {/* ==============================================
                  NOTIFICATION LIST
              ============================================== */}

              {notifications.length >
                0 && (

                <div className="max-h-[430px] overflow-y-auto">

                  {notifications.map(
                    (
                      notification
                    ) => {


                      // ========================================
                      // DETERMINE SOURCE
                      // ========================================

                      const isAdmin =
                        notification.notificationType === "admin" ||
                        notification.source === "admin" ||
                        notification.source === "admin-message" ||
                        notification.source === "FinanceOS Admin" ||
                        notification.type === "message" ||
                        notification.type === "in-app-message";


                      return (

                        <button
                          key={
                            notification.id
                          }

                          type="button"

                          onClick={
                            () =>
                              markAsRead(
                                notification.id
                              )
                          }

                          className={`flex w-full items-start gap-3 border-b border-[#edf0e9] px-5 py-4 text-left transition last:border-b-0 ${
                            notification.read

                              ? "bg-white hover:bg-[#fafcf8]"

                              : "bg-[#f7fbf4] hover:bg-[#f2f8ed]"
                          }`}
                        >


                          {/* ==================================
                              ICON
                          ================================== */}

                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                              isAdmin

                                ? "bg-[#eef2ff] text-[#4f5fa8]"

                                : "bg-[#e9f4e2] text-[#315c46]"
                            }`}
                          >

                            {
                              isAdmin

                                ? (
                                  <FiMessageSquare />
                                )

                                : (
                                  <ReminderIcon
                                    type={
                                      notification.eventType ||
                                      notification.type
                                    }
                                  />
                                )
                            }

                          </div>


                          {/* ==================================
                              CONTENT
                          ================================== */}

                          <div className="min-w-0 flex-1">


                            {/* ================================
                                SOURCE & BADGES
                            ================================ */}

                            <div className="mb-1.5 flex flex-wrap items-center gap-1.5">

                              {
                                isAdmin

                                  ? (
                                    <>
                                      <span className="inline-flex items-center gap-1 rounded-md bg-[#eef2ff] px-1.5 py-0.5 text-[9px] font-bold text-[#4353a4]">
                                        <FiUser className="text-[9px]" />
                                        FinanceOS Admin
                                      </span>

                                      {notification.category && (
                                        <span className="rounded-md bg-[#f0fdf4] px-1.5 py-0.5 text-[9px] font-semibold text-[#166534] border border-[#dcfce7]">
                                          {notification.category}
                                        </span>
                                      )}

                                      {notification.priority === "Urgent" && (
                                        <span className="rounded-md bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-700">
                                          🚨 Urgent
                                        </span>
                                      )}

                                      {notification.priority === "Important" && (
                                        <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
                                          ⭐ Important
                                        </span>
                                      )}
                                    </>
                                  )

                                  : (
                                    <>
                                      <FiCalendar className="text-[9px] text-[#639a48]" />
                                      <span className="text-[9px] font-semibold text-[#639a48]">
                                        Automatic Reminder
                                      </span>
                                    </>
                                  )
                              }

                            </div>


                            {/* ================================
                                TITLE
                            ================================ */}

                            <div className="flex items-start gap-2">

                              <p className="min-w-0 flex-1 text-xs font-semibold leading-5 text-[#18392c]">

                                {
                                  notification.title
                                }

                              </p>


                              {!notification.read && (

                                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500 ring-2 ring-red-200" />

                              )}

                            </div>


                            {/* ================================
                                MESSAGE
                            ================================ */}

                            {notification.message && (

                              <p className="mt-1 whitespace-pre-line text-[11px] leading-relaxed text-[#455a4f]">

                                {
                                  notification.message
                                }

                              </p>

                            )}


                            {/* ================================
                                ADMIN DETAILS
                            ================================ */}

                            {isAdmin && (

                              <div className="mt-2 flex items-center justify-between text-[9px] text-slate-400">

                                <span>
                                  {
                                    formatDateTime(
                                      notification.createdAt ||
                                      notification.date
                                    )
                                  }
                                </span>

                                {!notification.read && (
                                  <span className="text-[9px] font-medium text-[#4f5fa8]">
                                    Click to mark read
                                  </span>
                                )}

                              </div>

                            )}


                            {/* ================================
                                REMINDER DETAILS
                            ================================ */}

                            {!isAdmin && (

                              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">


                                {/* DUE DATE */}

                                {notification.eventDate && (

                                  <span className="flex items-center gap-1 text-[9px] text-slate-400">

                                    <FiCalendar />

                                    Due{" "}

                                    {
                                      formatDate(
                                        notification.eventDate
                                      )
                                    }

                                  </span>

                                )}


                                {/* AMOUNT */}

                                {Number(
                                  notification.amount ||
                                  0
                                ) > 0 && (

                                  <span className="text-[9px] font-semibold text-[#315c46]">

                                    ₹
                                    {
                                      formatMoney(
                                        notification.amount
                                      )
                                    }

                                  </span>

                                )}

                              </div>

                            )}


                          </div>


                        </button>

                      );

                    }
                  )}

                </div>

              )}


              {/* ==============================================
                  FOOTER
              ============================================== */}

              <div className="border-t border-[#edf0e9] bg-[#fafcf8] px-5 py-3">

                <p className="text-center text-[9px] leading-4 text-slate-400">

                  Financial reminders and FinanceOS Admin
                  In-App messages appear here.

                </p>

              </div>


            </div>

          )}

        </div>


        {/* ====================================================
            USER PROFILE
        ==================================================== */}

        <button
          type="button"
          className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-[#f5f8f2]"
        >


          {/* AVATAR */}

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d8f5b4] text-sm font-bold text-[#18392c]">

            {
              userInitial
            }

          </div>


          {/* INFORMATION */}

          <div className="hidden text-left sm:block">

            <p className="text-sm font-semibold text-[#18392c]">

              {
                userName
              }

            </p>


            <p className="text-[10px] text-slate-400">

              {
                userRole
              }

            </p>

          </div>


          <FiChevronDown className="hidden text-sm text-slate-400 sm:block" />

        </button>


      </div>


    </header>

  );

}


// ============================================================
// EXPORT
// ============================================================

export default Topbar;