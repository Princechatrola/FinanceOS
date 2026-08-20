// ============================================================
// FINANCEOS - ADMIN USER ACTIVITY
// ============================================================

import { useEffect, useMemo, useState } from "react";

import {
  Activity,
  FileText,
  LogIn,
  Search,
  UserCheck,
  UserPlus,
  RefreshCw,
} from "lucide-react";

import AdminSidebar from "../components/AdminSidebar.jsx";
import AdminTopbar from "../components/AdminTopbar.jsx";

// ============================================================
// API
// ============================================================

const API_URL =
  "http://localhost:5000/api/admin/activity";

// ============================================================
// ADMIN ACTIVITY PAGE
// ============================================================

function AdminActivity() {
  // ==========================================================
  // STATES
  // ==========================================================

  const [activities, setActivities] =
    useState([]);

  const [stats, setStats] = useState({
    totalActivity: 0,
    registrationCount: 0,
    signInCount: 0,
    reportCount: 0,
  });

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState("All");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ==========================================================
  // FETCH ACTIVITY
  // ==========================================================

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError("");

      // ------------------------------------------------------
      // JWT TOKEN
      // ------------------------------------------------------

      const token =
        localStorage.getItem("token");

      // ------------------------------------------------------
      // API REQUEST
      // ------------------------------------------------------

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

      // ------------------------------------------------------
      // ERROR
      // ------------------------------------------------------

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to load activity"
        );
      }

      // ------------------------------------------------------
      // SET ACTIVITIES
      // ------------------------------------------------------

      setActivities(
        data.activities || []
      );

      // ------------------------------------------------------
      // SET STATS
      // ------------------------------------------------------

      setStats({
        totalActivity:
          data.stats?.totalActivity || 0,

        registrationCount:
          data.stats?.registrationCount || 0,

        signInCount:
          data.stats?.signInCount || 0,

        reportCount:
          data.stats?.reportCount || 0,
      });
    } catch (error) {
      console.error(
        "Admin Activity Error:",
        error
      );

      setError(
        error.message ||
          "Unable to load activity"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // LOAD DATA
  // ==========================================================

  useEffect(() => {
    fetchActivities();
  }, []);

  // ==========================================================
  // FILTER ACTIVITY
  // ==========================================================

  const filteredActivities =
    useMemo(() => {
      const searchValue =
        search
          .toLowerCase()
          .trim();

      return activities.filter(
        (item) => {
          const user =
            String(
              item.user || ""
            ).toLowerCase();

          const email =
            String(
              item.email || ""
            ).toLowerCase();

          const description =
            String(
              item.description || ""
            ).toLowerCase();

          const type =
            String(
              item.type || ""
            ).toLowerCase();

          const matchesSearch =
            user.includes(
              searchValue
            ) ||
            email.includes(
              searchValue
            ) ||
            description.includes(
              searchValue
            ) ||
            type.includes(
              searchValue
            );

          const matchesFilter =
            filter === "All" ||
            item.type === filter;

          return (
            matchesSearch &&
            matchesFilter
          );
        }
      );
    }, [
      activities,
      search,
      filter,
    ]);

  // ==========================================================
  // RETURN
  // ==========================================================

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f9f4]">

      {/* SIDEBAR */}

      <div className="shrink-0">
        <AdminSidebar />
      </div>

      {/* RIGHT SIDE */}

      <div className="flex min-w-0 flex-1 flex-col">

        <AdminTopbar />

        {/* ====================================================
            PAGE CONTENT
        ==================================================== */}

        <main className="flex-1 overflow-y-auto p-6">

          {/* ==================================================
              PAGE HEADING
          ================================================== */}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#57923d]">
                Administration
              </p>

              <h1 className="mt-1 text-2xl font-bold text-[#173b2b]">
                User Activity
              </h1>

              <p className="mt-1 text-sm text-[#718177]">
                Review recent user and account activity across FinanceOS.
              </p>

            </div>

            {/* REFRESH */}

            <button
              type="button"
              onClick={fetchActivities}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl border border-[#dfe6da] bg-white px-4 py-2.5 text-sm font-semibold text-[#31523e] transition hover:bg-[#f5f8f2] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>

          </div>

          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (
            <div className="mt-5 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3">

              <div>

                <p className="text-sm font-semibold text-red-700">
                  Failed to load activity
                </p>

                <p className="mt-1 text-xs text-red-600">
                  {error}
                </p>

              </div>

              <button
                type="button"
                onClick={fetchActivities}
                className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
              >
                Try Again
              </button>

            </div>
          )}

          {/* ==================================================
              LOADING
          ================================================== */}

          {loading && (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-[#dfe6da] bg-white p-5">

              <RefreshCw
                size={18}
                className="animate-spin text-[#57923d]"
              />

              <p className="text-sm text-[#526459]">
                Loading activity from MongoDB...
              </p>

            </div>
          )}

          {/* ==================================================
              SUMMARY CARDS
          ================================================== */}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <ActivitySummary
              icon="activity"
              title="Total Activity"
              value={
                stats.totalActivity
              }
              description="Recorded activity"
            />

            <ActivitySummary
              icon="registration"
              title="Registrations"
              value={
                stats.registrationCount
              }
              description="New user accounts"
            />

            <ActivitySummary
              icon="signin"
              title="Sign Ins"
              value={
                stats.signInCount
              }
              description="User sign-in activity"
            />

            <ActivitySummary
              icon="report"
              title="Reports"
              value={
                stats.reportCount
              }
              description="Reports generated"
            />

          </div>

          {/* ==================================================
              ACTIVITY SECTION
          ================================================== */}

          <section className="mt-6 overflow-hidden rounded-2xl border border-[#dfe6da] bg-white">

            {/* HEADER */}

            <div className="border-b border-[#e5eae2] px-6 py-5">

              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

                <div>

                  <h2 className="text-lg font-bold text-[#173b2b]">
                    Recent Activity
                  </h2>

                  <p className="mt-1 text-xs text-[#718177]">
                    Live activity records from MongoDB.
                  </p>

                </div>

                <div className="flex flex-col gap-3 sm:flex-row">

                  {/* SEARCH */}

                  <div className="relative">

                    <Search
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#829087]"
                    />

                    <input
                      type="text"
                      value={search}
                      onChange={(event) =>
                        setSearch(
                          event.target.value
                        )
                      }
                      placeholder="Search activity..."
                      className="w-full rounded-xl border border-[#dfe6da] bg-[#fbfcfa] py-2.5 pl-10 pr-4 text-sm text-[#173b2b] outline-none placeholder:text-[#9ba69f] focus:border-[#9fbd82] focus:ring-2 focus:ring-[#edf5e8] sm:w-[260px]"
                    />

                  </div>

                  {/* FILTER */}

                  <select
                    value={filter}
                    onChange={(event) =>
                      setFilter(
                        event.target.value
                      )
                    }
                    className="rounded-xl border border-[#dfe6da] bg-[#fbfcfa] px-4 py-2.5 text-sm text-[#526459] outline-none focus:border-[#9fbd82] focus:ring-2 focus:ring-[#edf5e8]"
                  >

                    <option value="All">
                      All Activity
                    </option>

                    <option value="Registration">
                      Registrations
                    </option>

                    <option value="Sign In">
                      Sign Ins
                    </option>

                    <option value="Report">
                      Reports
                    </option>

                    <option value="Account">
                      Account Changes
                    </option>

                    <option value="Settings">
                      Settings
                    </option>

                    <option value="Other">
                      Other
                    </option>

                  </select>

                </div>

              </div>

            </div>

            {/* =================================================
                COLUMN HEADINGS
            ================================================= */}

            <div className="hidden grid-cols-[60px_210px_1fr_140px] border-b border-[#edf0eb] bg-[#f7faf5] px-6 py-3 lg:grid">

              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#718177]">
                Type
              </p>

              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#718177]">
                User
              </p>

              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#718177]">
                Activity
              </p>

              <p className="text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-[#718177]">
                Date
              </p>

            </div>

            {/* =================================================
                ACTIVITY LIST
            ================================================= */}

            <div>

              {filteredActivities.map(
                (item) => (
                  <ActivityRow
                    key={item._id}
                    activity={item}
                  />
                )
              )}

            </div>

            {/* =================================================
                EMPTY STATE
            ================================================= */}

            {!loading &&
              filteredActivities.length ===
                0 && (

                <div className="flex flex-col items-center justify-center px-6 py-16">

                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#edf5e8]">

                    <Activity
                      size={22}
                      className="text-[#57923d]"
                    />

                  </div>

                  <p className="mt-3 text-sm font-semibold text-[#173b2b]">
                    No activity found
                  </p>

                  <p className="mt-1 text-xs text-[#718177]">
                    Try changing your search or activity filter.
                  </p>

                </div>
              )}

            {/* FOOTER */}

            {filteredActivities.length >
              0 && (

              <div className="flex items-center justify-between border-t border-[#edf0eb] bg-[#fbfcfa] px-6 py-4">

                <p className="text-xs text-[#718177]">

                  Showing{" "}

                  <span className="font-semibold text-[#173b2b]">
                    {
                      filteredActivities.length
                    }
                  </span>{" "}

                  activities

                </p>

                <p className="text-xs text-[#8a978f]">
                  FinanceOS Activity Log
                </p>

              </div>
            )}

          </section>

        </main>

      </div>

    </div>
  );
}

// ============================================================
// ACTIVITY SUMMARY CARD
// ============================================================

function ActivitySummary({
  icon,
  title,
  value,
  description,
}) {
  return (
    <div className="rounded-2xl border border-[#dfe6da] bg-white p-5 shadow-[0_4px_18px_rgba(45,75,50,0.03)]">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-xs font-medium text-[#718177]">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-[#173b2b]">
            {Number(
              value || 0
            ).toLocaleString()}
          </p>

        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf5e8] text-[#43822e]">

          {icon === "activity" && (
            <Activity size={20} />
          )}

          {icon === "registration" && (
            <UserPlus size={20} />
          )}

          {icon === "signin" && (
            <LogIn size={20} />
          )}

          {icon === "report" && (
            <FileText size={20} />
          )}

        </div>

      </div>

      <p className="mt-3 text-xs text-[#8a978f]">
        {description}
      </p>

    </div>
  );
}

// ============================================================
// ACTIVITY ROW
// ============================================================

function ActivityRow({
  activity,
}) {
  return (
    <div className="border-b border-[#edf0eb] px-6 py-4 transition last:border-b-0 hover:bg-[#fbfcfa]">

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[60px_210px_1fr_140px] lg:items-center">

        {/* ICON */}

        <div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf5e8] text-[#43822e]">

            {activity.type ===
              "Registration" && (
              <UserPlus size={18} />
            )}

            {activity.type ===
              "Sign In" && (
              <LogIn size={18} />
            )}

            {activity.type ===
              "Report" && (
              <FileText size={18} />
            )}

            {activity.type ===
              "Account" && (
              <UserCheck size={18} />
            )}

            {activity.type ===
              "Settings" && (
              <Activity size={18} />
            )}

            {activity.type ===
              "Other" && (
              <Activity size={18} />
            )}

          </div>

        </div>

        {/* USER */}

        <div className="min-w-0">

          <p className="truncate text-sm font-semibold text-[#173b2b]">
            {activity.user}
          </p>

          <p className="mt-0.5 truncate text-xs text-[#7b8a80]">
            {activity.email}
          </p>

        </div>

        {/* DESCRIPTION */}

        <div className="min-w-0">

          <span className="inline-flex rounded-full bg-[#f0f6eb] px-2.5 py-1 text-[10px] font-semibold text-[#57923d]">
            {activity.type}
          </span>

          <p className="mt-2 text-sm text-[#617268]">
            {activity.description}
          </p>

        </div>

        {/* DATE */}

        <div className="lg:text-right">

          <p className="text-xs font-medium text-[#526459]">
            {formatDate(
              activity.createdAt
            )}
          </p>

          <p className="mt-1 text-[11px] text-[#8a978f]">
            {formatTime(
              activity.createdAt
            )}
          </p>

        </div>

      </div>

    </div>
  );
}

// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(date) {
  if (!date) {
    return "--";
  }

  const parsedDate =
    new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return "--";
  }

  return parsedDate.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

// ============================================================
// FORMAT TIME
// ============================================================

function formatTime(date) {
  if (!date) {
    return "--";
  }

  const parsedDate =
    new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return "--";
  }

  return parsedDate.toLocaleTimeString(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

// ============================================================
// EXPORT
// ============================================================

export default AdminActivity;