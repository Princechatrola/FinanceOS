import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  Mail,
  RefreshCw,
  Search,
  Send,
  Smartphone,
  User,
  X,
  XCircle,
} from "lucide-react";

import AdminSidebar from "../components/AdminSidebar.jsx";
import AdminTopbar from "../components/AdminTopbar.jsx";


// ============================================================
// API
// ============================================================

const API_URL =
  "http://localhost:5000/api/admin/reminders";


// ============================================================
// ADMIN REMINDERS PAGE
// ============================================================

export default function AdminReminders() {
  const navigate = useNavigate();
  const [reminders, setReminders] =
    useState([]);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [channelFilter, setChannelFilter] =
    useState("All");

  const [typeFilter, setTypeFilter] =
    useState("All");

  const [categoryFilter, setCategoryFilter] =
    useState("All");

  const [selectedReminder, setSelectedReminder] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ==========================================================
  // FETCH REMINDERS
  // ==========================================================

  const fetchReminders = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem(
          "financeos_token"
        ) ||
        sessionStorage.getItem(
          "financeos_token"
        );

      const response = await fetch(
        API_URL,
        {
          method: "GET",

          headers: {
            "Content-Type":
              "application/json",

            ...(token
              ? {
                  Authorization:
                    `Bearer ${token}`,
                }
              : {}),
          },
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to load reminders"
        );
      }

      setReminders(data.data || []);

    } catch (err) {
      console.error(
        "Admin Reminders Error:",
        err
      );

      setError(
        err.message ||
          "Unable to load reminders"
      );
    } finally {
      setLoading(false);
    }
  };


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    fetchReminders();
  }, []);


  // ==========================================================
  // COUNTS
  // ==========================================================

  const scheduledCount =
    reminders.filter(
      (item) => item.status === "Scheduled"
    ).length;

  const sentCount =
    reminders.filter(
      (item) => item.status === "Sent"
    ).length;

  const failedCount =
    reminders.filter(
      (item) => item.status === "Failed"
    ).length;


  // ==========================================================
  // FILTERING
  // ==========================================================

  const filteredReminders = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return reminders.filter((item) => {
      const matchesSearch =
        !query ||
        [
          item.id,
          item.userId,
          item.userName,
          item.email,
          item.phone,
          item.itemName,
          item.reminderType,
          item.category,
          item.rule,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query)
        );

      const matchesStatus =
        statusFilter === "All" ||
        item.status?.toLowerCase() === statusFilter.toLowerCase();

      const matchesChannel =
        channelFilter === "All" ||
        item.channels?.some(
          (c) => c.toLowerCase() === channelFilter.toLowerCase()
        ) ||
        item.channel?.toLowerCase().includes(channelFilter.toLowerCase());

      const matchesType =
        typeFilter === "All" ||
        item.reminderType?.toLowerCase() === typeFilter.toLowerCase();

      const matchesCategory =
        categoryFilter === "All" ||
        item.category?.toLowerCase() === categoryFilter.toLowerCase();

      return (
        matchesSearch &&
        matchesStatus &&
        matchesChannel &&
        matchesType &&
        matchesCategory
      );
    });
  }, [
    reminders,
    search,
    statusFilter,
    channelFilter,
    typeFilter,
    categoryFilter,
  ]);


  // ==========================================================
  // RESET FILTERS
  // ==========================================================

  function resetFilters() {
    setSearch("");
    setStatusFilter("All");
    setChannelFilter("All");
    setTypeFilter("All");
    setCategoryFilter("All");
  }

  // ==========================================================
  // SEND MESSAGE TO USER
  // ==========================================================

  function handleSendMessage(reminder) {
    navigate("/admin/messages", {
      state: {
        prefillUser: {
          id: reminder.userId,
          _id: reminder.rawUserId || reminder.userId,
          userId: reminder.userId,
          name: reminder.userName,
          email: reminder.email,
          phone: reminder.phone,
        },
        prefillReminder: reminder,
      },
    });
  }


  // ==========================================================
  // RETRY FAILED REMINDER
  // POST /api/admin/reminders/:id/retry
  // ==========================================================

  async function retryReminder(id) {
    const confirmed = window.confirm(
      "Retry this failed reminder?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const token =
        localStorage.getItem(
          "financeos_token"
        ) ||
        sessionStorage.getItem(
          "financeos_token"
        );

      const response = await fetch(
        `${API_URL}/${id}/retry`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            ...(token
              ? {
                  Authorization:
                    `Bearer ${token}`,
                }
              : {}),
          },
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to retry reminder"
        );
      }

      // Update local state to reflect the retry
      setReminders((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                status: "Scheduled",
                failureReason: null,
              }
            : item
        )
      );

      setSelectedReminder((current) =>
        current?.id === id
          ? {
              ...current,
              status: "Scheduled",
              failureReason: null,
            }
          : current
      );

    } catch (err) {
      console.error(
        "Retry Reminder Error:",
        err
      );

      alert(
        err.message ||
          "Failed to retry reminder"
      );
    }
  }


  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f8f3]">

      <AdminSidebar />


      <div className="flex min-w-0 flex-1 flex-col">

        <AdminTopbar />


        <main className="flex-1 overflow-y-auto p-6">

          <div className="mx-auto max-w-[1450px]">


            {/* ==================================================
                HEADER
            ================================================== */}

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#639a48]">
                Automated Communication
              </p>

              <h1 className="mt-1 text-2xl font-bold text-[#173b2b]">
                User Reminders
              </h1>

              <p className="mt-1 max-w-[760px] text-sm text-[#718177]">
                Monitor reminders automatically generated from
                reminder settings enabled by FinanceOS users.
              </p>

            </div>


            {/* ==================================================
                SUMMARY
            ================================================== */}

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <SummaryCard
                title="Total Reminders"
                value={reminders.length}
                icon={Bell}
              />

              <SummaryCard
                title="Scheduled"
                value={scheduledCount}
                icon={Clock3}
              />

              <SummaryCard
                title="Sent"
                value={sentCount}
                icon={CheckCircle2}
              />

              <SummaryCard
                title="Failed"
                value={failedCount}
                icon={XCircle}
              />

            </div>


            {/* ==================================================
                FILTERS
            ================================================== */}

            <section className="mt-5 rounded-2xl border border-[#dfe6da] bg-white p-5">

              <div className="flex items-center justify-between gap-4">

                <div>

                  <h2 className="font-bold text-[#173b2b]">
                    Reminder Filters
                  </h2>

                  <p className="mt-1 text-xs text-[#718177]">
                    Search and filter automated reminder deliveries.
                  </p>

                </div>


                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs font-semibold text-[#57923d] hover:underline"
                >
                  Reset Filters
                </button>

              </div>


              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">


                {/* SEARCH */}

                <div>

                  <FilterLabel>
                    Search
                  </FilterLabel>

                  <div className="relative">

                    <Search
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a978f]"
                    />

                    <input
                      type="text"
                      value={search}
                      onChange={(event) =>
                        setSearch(
                          event.target.value
                        )
                      }
                      placeholder="User, ID, reminder..."
                      className="w-full rounded-xl border border-[#dce4d8] bg-[#fbfcfa] py-2.5 pl-9 pr-3 text-xs outline-none focus:border-[#9fbd82]"
                    />

                  </div>

                </div>


                {/* STATUS */}

                <FilterSelect
                  label="Status"
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value
                    )
                  }
                >
                  <option value="All">
                    All Status
                  </option>

                  <option value="Scheduled">
                    Scheduled
                  </option>

                  <option value="Sent">
                    Sent
                  </option>

                  <option value="Failed">
                    Failed
                  </option>

                </FilterSelect>


                {/* CHANNEL */}

                <FilterSelect
                  label="Channel"
                  value={channelFilter}
                  onChange={(event) =>
                    setChannelFilter(
                      event.target.value
                    )
                  }
                >
                  <option value="All">
                    All Channels
                  </option>

                  <option value="In-App">
                    In-App
                  </option>

                  <option value="Email">
                    Email
                  </option>

                  <option value="SMS">
                    SMS
                  </option>

                </FilterSelect>


                {/* TYPE */}

                <FilterSelect
                  label="Reminder Type"
                  value={typeFilter}
                  onChange={(event) =>
                    setTypeFilter(
                      event.target.value
                    )
                  }
                >
                  <option value="All">
                    All Types
                  </option>

                  <option value="Goal">
                    Goal
                  </option>

                  <option value="Payment">
                    Payment
                  </option>

                  <option value="Investment">
                    Investment
                  </option>

                  <option value="Maturity">
                    Maturity
                  </option>

                  <option value="Insurance">
                    Insurance
                  </option>

                  <option value="General">
                    General
                  </option>

                </FilterSelect>


                {/* CATEGORY */}

                <FilterSelect
                  label="Category"
                  value={categoryFilter}
                  onChange={(event) =>
                    setCategoryFilter(
                      event.target.value
                    )
                  }
                >
                  <option value="All">
                    All Categories
                  </option>

                  <option value="Saving Goal">
                    Saving Goal
                  </option>

                  <option value="Investment">
                    Investment
                  </option>

                  <option value="Insurance">
                    Insurance
                  </option>

                  <option value="Liability">
                    Liability
                  </option>

                  <option value="Monthly Finance">
                    Monthly Finance
                  </option>

                  <option value="General">
                    General
                  </option>

                </FilterSelect>

              </div>

            </section>


            {/* ==================================================
                LOADING STATE
            ================================================== */}

            {loading && (
              <div className="mt-5 flex items-center justify-center rounded-2xl border border-[#dfe6da] bg-white py-20">

                <div className="text-center">

                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-[3px] border-[#dfe6da] border-t-[#57923d]" />

                  <p className="mt-4 text-sm font-semibold text-[#173b2b]">
                    Loading reminders...
                  </p>

                </div>

              </div>
            )}


            {/* ==================================================
                ERROR STATE
            ================================================== */}

            {!loading && error && (
              <div className="mt-5 rounded-2xl border border-[#f0d6d0] bg-[#fff5f2] p-6">

                <div className="flex items-center gap-3">

                  <XCircle
                    size={20}
                    className="shrink-0 text-[#b45745]"
                  />

                  <div>

                    <p className="text-sm font-bold text-[#934534]">
                      Failed to load reminders
                    </p>

                    <p className="mt-1 text-xs text-[#865b51]">
                      {error}
                    </p>

                  </div>

                </div>

                <button
                  type="button"
                  onClick={fetchReminders}
                  className="mt-4 flex items-center gap-2 rounded-xl bg-[#dff3ad] px-4 py-2.5 text-xs font-bold text-[#173b2b] hover:bg-[#d5eba2]"
                >
                  <RefreshCw size={14} />
                  Try Again
                </button>

              </div>
            )}


            {/* ==================================================
                TABLE
            ================================================== */}

            {!loading && !error && (
            <section className="mt-5 overflow-hidden rounded-2xl border border-[#dfe6da] bg-white">

              <div className="border-b border-[#edf0eb] p-5">

                <h2 className="font-bold text-[#173b2b]">
                  Reminder Queue
                </h2>

                <p className="mt-1 text-xs text-[#718177]">
                  {filteredReminders.length} reminder(s) found
                </p>

              </div>


              <div className="overflow-x-auto">

                <table className="w-full min-w-[1300px]">

                  <thead className="bg-[#fafcf9]">

                    <tr className="border-b border-[#edf0eb]">

                      <TH>User</TH>

                      <TH>Financial Item</TH>

                      <TH>Reminder Rule</TH>

                      <TH>Due / Maturity</TH>

                      <TH>Scheduled For</TH>

                      <TH>Channel</TH>

                      <TH>Status</TH>

                      <TH>Action</TH>

                    </tr>

                  </thead>


                  <tbody>

                    {filteredReminders.length >
                    0 ? (

                      filteredReminders.map(
                        (item) => (

                          <tr
                            key={item.id}
                            className="border-b border-[#edf0eb] last:border-b-0 hover:bg-[#fbfcfa]"
                          >


                            {/* USER */}

                            <td className="px-5 py-4">

                              <div className="flex items-center gap-3">

                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8f4dc] font-bold text-[#43822e]">
                                  {item.userName.charAt(
                                    0
                                  )}
                                </div>


                                <div>

                                  <p className="text-sm font-semibold text-[#173b2b]">
                                    {item.userName}
                                  </p>

                                  <p className="mt-1 font-mono text-[9px] text-[#639a48]">
                                    {item.userId}
                                  </p>

                                </div>

                              </div>

                            </td>


                            {/* ITEM */}

                            <td className="px-4 py-4">

                              <p className="text-sm font-semibold text-[#526459]">
                                {item.itemName}
                              </p>

                              <div className="mt-1 flex gap-2">

                                <SmallBadge>
                                  {item.category}
                                </SmallBadge>

                                <SmallBadge>
                                  {item.reminderType}
                                </SmallBadge>

                              </div>

                            </td>


                            {/* RULE */}

                            <td className="px-4 py-4 text-xs text-[#526459]">
                              {item.rule}
                            </td>


                            {/* DUE DATE */}

                            <td className="px-4 py-4">

                              <div className="flex items-center gap-2">

                                <CalendarDays
                                  size={14}
                                  className="text-[#718177]"
                                />

                                <span className="text-xs text-[#526459]">
                                  {formatDate(
                                    item.dueDate
                                  )}
                                </span>

                              </div>

                            </td>


                            {/* SCHEDULE */}

                            <td className="px-4 py-4">

                              <p className="text-xs font-medium text-[#526459]">
                                {formatDate(
                                  item.scheduledDate
                                )}
                              </p>

                              <p className="mt-1 text-[10px] text-[#8a978f]">
                                {formatTime(
                                  item.scheduledTime
                                )}
                              </p>

                            </td>


                            {/* CHANNEL */}

                            <td className="px-4 py-4">

                              <ChannelBadge
                                channel={
                                  item.channel
                                }
                                channels={
                                  item.channels
                                }
                              />

                            </td>


                            {/* STATUS */}

                            <td className="px-4 py-4">

                              <StatusBadge
                                status={
                                  item.status
                                }
                              />

                            </td>


                            {/* ACTION */}

                            <td className="px-4 py-4">

                              <div className="flex items-center gap-2">

                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedReminder(
                                      item
                                    )
                                  }
                                  className="flex items-center gap-1.5 rounded-lg border border-[#dce4d8] px-2.5 py-1.5 text-xs font-semibold text-[#526459] transition hover:bg-[#f2f6ef]"
                                >
                                  <Eye size={13} />
                                  View
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSendMessage(
                                      item
                                    )
                                  }
                                  className="flex items-center gap-1.5 rounded-lg bg-[#e8f4dc] px-2.5 py-1.5 text-xs font-semibold text-[#315c46] transition hover:bg-[#d6ecc2]"
                                  title="Send Message to User"
                                >
                                  <Send size={12} />
                                  Message
                                </button>

                              </div>

                            </td>

                          </tr>

                        )
                      )

                    ) : (

                      <tr>

                        <td
                          colSpan={8}
                          className="px-5 py-16 text-center"
                        >

                          <Bell
                            size={28}
                            className="mx-auto text-[#9cab9f]"
                          />

                          <p className="mt-3 text-sm font-semibold text-[#173b2b]">
                            No reminders found
                          </p>

                          <p className="mt-1 text-xs text-[#718177]">
                            Try changing your filters.
                          </p>

                        </td>

                      </tr>

                    )}

                  </tbody>

                </table>

              </div>

            </section>
            )}


            {/* ==================================================
                EXPLANATION
            ================================================== */}

            <section className="mt-5 rounded-2xl border border-[#dce6d6] bg-[#f0f7eb] p-5">

              <div className="flex gap-3">

                <Bell
                  size={19}
                  className="mt-0.5 shrink-0 text-[#57923d]"
                />

                <div>

                  <p className="text-sm font-bold text-[#173b2b]">
                    User-controlled reminders
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#617268]">
                    These reminders originate from reminder
                    preferences configured by users. Admins can
                    monitor delivery and inspect failures, but the
                    user's reminder preferences remain controlled
                    by the user.
                  </p>

                </div>

              </div>

            </section>

          </div>

        </main>

      </div>


      {/* ========================================================
          REMINDER DETAILS MODAL
      ======================================================== */}

      {selectedReminder && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">

          <div className="max-h-[92vh] w-full max-w-[760px] overflow-y-auto rounded-2xl bg-white shadow-xl">


            {/* HEADER */}

            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[#edf0eb] bg-white px-6 py-5">

              <div>

                <h2 className="text-lg font-bold text-[#173b2b]">
                  Reminder Details
                </h2>

                <p className="mt-1 font-mono text-[10px] text-[#639a48]">
                  {selectedReminder.id}
                </p>

              </div>


              <button
                type="button"
                onClick={() =>
                  setSelectedReminder(null)
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#718177] hover:bg-[#f2f5f0]"
              >
                <X size={18} />
              </button>

            </div>


            <div className="p-6">


              {/* ==================================================
                  USER
              ================================================== */}

              <SectionTitle>
                User Information
              </SectionTitle>


              <div className="mt-3 rounded-xl border border-[#dfe6da] bg-[#f8faf7] p-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e8f4dc] text-[#43822e]">

                    <User size={20} />

                  </div>


                  <div>

                    <p className="text-sm font-bold text-[#173b2b]">
                      {selectedReminder.userName}
                    </p>

                    <p className="mt-1 font-mono text-[10px] text-[#639a48]">
                      {selectedReminder.userId}
                    </p>

                  </div>

                </div>


                <div className="mt-4 grid gap-3 sm:grid-cols-2">

                  <LockedField
                    label="Registered Email"
                    value={
                      selectedReminder.email
                    }
                  />

                  <LockedField
                    label="Phone Number"
                    value={
                      selectedReminder.phone
                    }
                  />

                </div>

              </div>


              {/* ==================================================
                  REMINDER INFO & NOTIFICATION SCHEDULE
              ================================================== */}

              <div className="mt-6">

                <SectionTitle>
                  Reminder Configuration & Message Timings
                </SectionTitle>


                <div className="mt-3 grid gap-3 sm:grid-cols-2">

                  <LockedField
                    label="Financial Item"
                    value={
                      selectedReminder.itemName
                    }
                  />

                  <LockedField
                    label="Category"
                    value={
                      selectedReminder.category
                    }
                  />

                  <LockedField
                    label="Reminder Type"
                    value={
                      selectedReminder.reminderType
                    }
                  />

                  <LockedField
                    label="Reminder Rule"
                    value={
                      selectedReminder.rule
                    }
                  />

                  <LockedField
                    label="Due / Maturity Date"
                    value={formatDate(
                      selectedReminder.dueDate
                    )}
                  />

                  <LockedField
                    label="Enabled Channels"
                    value={
                      Array.isArray(selectedReminder.channels) &&
                      selectedReminder.channels.length > 0
                        ? selectedReminder.channels.join(", ")
                        : selectedReminder.channel || "In-App"
                    }
                  />

                </div>

                {/* WHEN USER WANTS TO RECEIVE MESSAGES */}
                <div className="mt-4 rounded-xl border border-[#dcebd4] bg-[#f4faef] p-4">

                  <div className="flex items-center gap-2 text-xs font-bold text-[#2e5d42]">

                    <Clock3 size={15} className="text-[#57923d]" />

                    <span>When User Wants To Get Messages</span>

                  </div>

                  <div className="mt-3 space-y-2">

                    {Array.isArray(selectedReminder.dispatchSchedule) &&
                    selectedReminder.dispatchSchedule.length > 0 ? (
                      selectedReminder.dispatchSchedule.map((sched, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-lg border border-[#e2ebd9] bg-white px-3 py-2 text-xs"
                        >

                          <div className="flex items-center gap-2">

                            <CalendarDays size={13} className="text-[#57923d]" />

                            <span className="font-semibold text-[#1c402e]">
                              {sched.label}
                            </span>

                          </div>

                          <div className="font-mono text-xs font-medium text-[#467332]">
                            {formatDate(sched.date)} at {sched.time || "09:00 AM"}
                          </div>

                        </div>
                      ))
                    ) : (
                      <div className="rounded-lg border border-[#e2ebd9] bg-white px-3 py-2 text-xs text-[#526459]">
                        Scheduled dispatch: {formatDate(selectedReminder.scheduledDate)} at {formatTime(selectedReminder.scheduledTime)}
                      </div>
                    )}

                  </div>

                  {/* CHANNELS BADGES */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#e2ebd9] pt-3">

                    <span className="text-[11px] font-semibold text-[#5a7c66]">
                      Delivery Channels:
                    </span>

                    {(Array.isArray(selectedReminder.channels) &&
                    selectedReminder.channels.length > 0
                      ? selectedReminder.channels
                      : [selectedReminder.channel || "In-App"]
                    ).map((ch) => (
                      <span
                        key={ch}
                        className="rounded-full bg-[#dff2d2] px-2.5 py-0.5 text-[10px] font-bold text-[#315c46]"
                      >
                        ✓ {ch}
                      </span>
                    ))}

                  </div>

                </div>

              </div>


              {/* ==================================================
                  GENERATED MESSAGE PREVIEW
              ================================================== */}

              <div className="mt-6">

                <SectionTitle>
                  Generated Message
                </SectionTitle>


                <div className="mt-3 rounded-xl border border-[#dfe6da] bg-[#fafcf9] p-5">

                  <div className="flex items-center gap-2 border-b border-[#e7ece4] pb-3">

                    <Bell
                      size={16}
                      className="text-[#57923d]"
                    />

                    <p className="text-sm font-bold text-[#28622e]">
                      FinanceOS Reminder
                    </p>

                  </div>


                  <p className="mt-4 whitespace-pre-line text-sm leading-6 text-[#526459]">
                    {generateReminderMessage(
                      selectedReminder
                    )}
                  </p>

                </div>

              </div>


              {/* ==================================================
                  DELIVERY STATUS
              ================================================== */}

              <div className="mt-6">

                <SectionTitle>
                  Delivery
                </SectionTitle>


                <div className="mt-3 rounded-xl border border-[#dfe6da] p-4">

                  <div className="flex items-center justify-between gap-4">

                    <div>

                      <p className="text-xs text-[#718177]">
                        Current Status
                      </p>

                      <div className="mt-2">

                        <StatusBadge
                          status={
                            selectedReminder.status
                          }
                        />

                      </div>

                    </div>


                    {selectedReminder.status ===
                      "Failed" && (

                      <button
                        type="button"
                        onClick={() =>
                          retryReminder(
                            selectedReminder.id
                          )
                        }
                        className="flex items-center gap-2 rounded-xl bg-[#dff3ad] px-4 py-2.5 text-xs font-bold text-[#173b2b] hover:bg-[#d5eba2]"
                      >
                        <RefreshCw
                          size={14}
                        />

                        Retry Delivery
                      </button>

                    )}

                  </div>


                  {selectedReminder.sentAt && (

                    <div className="mt-4">

                      <LockedField
                        label="Sent At"
                        value={
                          selectedReminder.sentAt
                        }
                      />

                    </div>

                  )}


                  {selectedReminder.failureReason && (

                    <div className="mt-4 rounded-xl border border-[#f0d6d0] bg-[#fff5f2] p-4">

                      <div className="flex gap-2">

                        <XCircle
                          size={16}
                          className="mt-0.5 shrink-0 text-[#b45745]"
                        />

                        <div>

                          <p className="text-xs font-bold text-[#934534]">
                            Delivery Failed
                          </p>

                          <p className="mt-1 text-xs leading-5 text-[#865b51]">
                            {
                              selectedReminder.failureReason
                            }
                          </p>

                        </div>

                      </div>

                    </div>

                  )}

                </div>

              </div>

              {/* ACTION FOOTER */}

              <div className="mt-6 flex justify-end gap-3 border-t border-[#edf0eb] pt-4">

                <button
                  type="button"
                  onClick={() =>
                    setSelectedReminder(null)
                  }
                  className="rounded-xl border border-[#dce4d8] px-4 py-2.5 text-xs font-semibold text-[#526459] hover:bg-[#f4f7f1]"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const rem = selectedReminder;
                    setSelectedReminder(null);
                    handleSendMessage(rem);
                  }}
                  className="flex items-center gap-2 rounded-xl bg-[#173b2b] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#25523d]"
                >
                  <Send size={13} />
                  Send Message to User
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}


// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({
  title,
  value,
  icon: Icon,
}) {
  return (
    <div className="rounded-2xl border border-[#dfe6da] bg-white p-5">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-xs text-[#718177]">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-[#173b2b]">
            {value}
          </p>

        </div>


        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf5e8] text-[#57923d]">

          <Icon size={18} />

        </div>

      </div>

    </div>
  );
}


// ============================================================
// FILTER SELECT
// ============================================================

function FilterSelect({
  label,
  value,
  onChange,
  children,
}) {
  return (
    <div>

      <FilterLabel>
        {label}
      </FilterLabel>

      <select
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-[#dce4d8] bg-[#fbfcfa] px-3 py-2.5 text-xs text-[#526459] outline-none focus:border-[#9fbd82]"
      >
        {children}
      </select>

    </div>
  );
}


// ============================================================
// FILTER LABEL
// ============================================================

function FilterLabel({ children }) {
  return (
    <label className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-[#718177]">
      {children}
    </label>
  );
}


// ============================================================
// TABLE HEADING
// ============================================================

function TH({ children }) {
  return (
    <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-[#718177]">
      {children}
    </th>
  );
}


// ============================================================
// SMALL BADGE
// ============================================================

function SmallBadge({ children }) {
  return (
    <span className="rounded-full bg-[#f0f5ed] px-2 py-0.5 text-[9px] font-semibold text-[#617268]">
      {children}
    </span>
  );
}


// ============================================================
// CHANNEL BADGE
// ============================================================

function ChannelBadge({ channel, channels }) {
  const channelList =
    Array.isArray(channels) && channels.length > 0
      ? channels
      : typeof channel === "string"
      ? channel.split(",").map((c) => c.trim()).filter(Boolean)
      : ["In-App"];

  return (
    <div className="flex flex-wrap gap-1.5">
      {channelList.map((ch) => {
        let Icon = Bell;

        if (ch === "Email") {
          Icon = Mail;
        }

        if (ch === "SMS") {
          Icon = Smartphone;
        }

        return (
          <span
            key={ch}
            className="inline-flex items-center gap-1 rounded-full bg-[#f0f5ed] px-2.5 py-0.5 text-[10px] font-semibold text-[#526459]"
          >
            <Icon size={11} />
            {ch}
          </span>
        );
      })}
    </div>
  );
}


// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({ status }) {
  let style =
    "bg-[#fff6df] text-[#99701e]";

  if (status === "Sent") {
    style =
      "bg-[#edf6e7] text-[#57923d]";
  }

  if (status === "Failed") {
    style =
      "bg-[#fff0ed] text-[#b45745]";
  }

  return (
    <span
      className={`rounded-full px-3 py-1 text-[10px] font-semibold ${style}`}
    >
      {status}
    </span>
  );
}


// ============================================================
// SECTION TITLE
// ============================================================

function SectionTitle({ children }) {
  return (
    <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-[#526459]">
      {children}
    </h3>
  );
}


// ============================================================
// LOCKED FIELD
// ============================================================

function LockedField({
  label,
  value,
}) {
  return (
    <div>

      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#718177]">
        {label}
      </p>

      <div className="rounded-lg border border-[#e1e7de] bg-[#fafcf9] px-3 py-2.5 text-xs font-medium text-[#344b3e]">
        {value || "—"}
      </div>

    </div>
  );
}


// ============================================================
// GENERATE AUTOMATIC REMINDER MESSAGE
// ============================================================

function generateReminderMessage(reminder) {
  if (reminder.reminderType === "Maturity") {
    return `Hello ${reminder.userName},

Your ${reminder.itemName} is scheduled to mature on ${formatDate(
      reminder.dueDate
    )}.

User ID: ${reminder.userId}

Please review your Financial Calendar for more information.

This reminder was generated automatically by FinanceOS.`;
  }

  return `Hello ${reminder.userName},

Your ${reminder.itemName} is due on ${formatDate(
    reminder.dueDate
  )}.

User ID: ${reminder.userId}

Please review your Financial Calendar for more information.

This reminder was generated automatically by FinanceOS.`;
}


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(value) {
  if (!value) return "—";

  return new Date(
    `${value}T00:00:00`
  ).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}


// ============================================================
// FORMAT TIME
// ============================================================

function formatTime(value) {
  if (!value) return "—";

  const [hours, minutes] =
    value.split(":");

  const date = new Date();

  date.setHours(
    Number(hours),
    Number(minutes),
    0,
    0
  );

  return date.toLocaleTimeString(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}