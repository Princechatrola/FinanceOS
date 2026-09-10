// ============================================================
// FINANCEOS - ADMIN USER DETAILS
// ============================================================

import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  Download,
  FileText,
  KeyRound,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  UserCheck,
  WalletCards,
  Loader2,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Layers,
  Activity,
  RefreshCw,
  CreditCard,
  Target,
  ShieldAlert,
  Info,
  DollarSign,
  Calendar,
  Sparkles,
  Award,
} from "lucide-react";

import AdminSidebar from "../components/AdminSidebar.jsx";
import AdminTopbar from "../components/AdminTopbar.jsx";
import { generateFinancialReport } from "../utils/generateFinancialReport.js";

const API_URL = "http://localhost:5000/api/admin/users";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function fmtINR(val, fallback = "—") {
  if (val === null || val === undefined || val === "") return fallback;
  const n = Number(val);
  if (!Number.isFinite(n)) return fallback;
  const sign = n < 0 ? "-" : "";
  return `${sign}₹${Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function fmtDate(d) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function fmtDateTime(d) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return `${date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} • ${date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })}`;
}

const getAuthHeaders = () => {
  const token =
    localStorage.getItem("financeos_token") ||
    sessionStorage.getItem("financeos_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export default function AdminUserDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [activeTab, setActiveTab] = useState("overview");

  // ==========================================================
  // USER OVERVIEW STATE
  // ==========================================================
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================================
  // FINANCIAL TAB STATE
  // ==========================================================
  const now = new Date();
  const [financialData, setFinancialData] = useState(null);
  const [financialLoading, setFinancialLoading] = useState(false);
  const [financialError, setFinancialError] = useState("");
  const [financialYear, setFinancialYear] = useState(now.getFullYear());
  const [financialMonth, setFinancialMonth] = useState(now.getMonth() + 1);

  // ==========================================================
  // ACTIVITY TAB STATE
  // ==========================================================
  const [activityData, setActivityData] = useState({ activities: [], stats: {} });
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState("");
  const [activitySearch, setActivitySearch] = useState("");
  const [activityFilter, setActivityFilter] = useState("All");

  // ==========================================================
  // REPORTS TAB STATE
  // ==========================================================
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");
  const [reportDuration, setReportDuration] = useState("monthly"); // monthly | quarterly | halfYear | yearly
  const [reportYear, setReportYear] = useState(now.getFullYear());
  const [reportMonth, setReportMonth] = useState(now.getMonth() + 1);
  const [reportQuarter, setReportQuarter] = useState(Math.ceil((now.getMonth() + 1) / 3));
  const [reportHalf, setReportHalf] = useState(now.getMonth() + 1 <= 6 ? 1 : 2);

  // ==========================================================
  // 1. FETCH USER PROFILE (OVERVIEW & ACCESS)
  // ==========================================================
  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_URL}/${id}`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load user details.");
      }
      const u = data.user;
      setUser({
        id: u._id,
        userId: u.userId || "",
        name: u.name || "",
        email: u.email || "",
        mobile: u.phone || u.mobile || "",
        dateOfBirth: u.dateOfBirth
          ? new Date(u.dateOfBirth).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : "",
        gender: u.gender || "",
        city: u.city || "",
        state: u.state || "",
        joined: u.createdAt
          ? new Date(u.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : "",
        lastLogin: "Active now",
        status: u.status || "Active",
        onboarding: "Completed",
        permissions: {
          dashboard: u.permissions?.dashboard !== undefined ? u.permissions.dashboard : true,
          monthlyFinance: u.permissions?.monthlyFinance !== undefined ? u.permissions.monthlyFinance : true,
          savingGoals: u.permissions?.savingGoals !== undefined ? u.permissions.savingGoals : true,
          plans: u.permissions?.plansCommitments !== undefined ? u.permissions.plansCommitments : true,
          calendar: u.permissions?.financialCalendar !== undefined ? u.permissions.financialCalendar : true,
          reports: u.permissions?.reports !== undefined ? u.permissions.reports : true,
          aiAdvisor: u.permissions?.aiAdvisor !== undefined ? u.permissions.aiAdvisor : false,
        },
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to load user details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchUser();
    }
  }, [id, fetchUser]);

  // ==========================================================
  // 2. FETCH SELECTED USER FINANCIAL DATA
  // ==========================================================
  const fetchFinancial = useCallback(async (year, month) => {
    if (!id) return;
    try {
      setFinancialLoading(true);
      setFinancialError("");
      const params = new URLSearchParams();
      if (year) params.append("year", year);
      if (month) params.append("month", month);

      const response = await fetch(`${API_URL}/${id}/financial?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load financial data.");
      }
      setFinancialData(data);
      if (data.period) {
        setFinancialYear(data.period.year);
        setFinancialMonth(data.period.month);
      }
    } catch (err) {
      console.error("Fetch Financial Error:", err);
      setFinancialError(err.message || "Failed to load user financial data.");
    } finally {
      setFinancialLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (activeTab === "financial" && (!financialData || financialData.user?._id !== id)) {
      fetchFinancial(financialYear, financialMonth);
    }
  }, [activeTab, id, fetchFinancial, financialYear, financialMonth, financialData]);

  const handlePeriodChange = (newYear, newMonth) => {
    setFinancialYear(newYear);
    setFinancialMonth(newMonth);
    fetchFinancial(newYear, newMonth);
  };

  // ==========================================================
  // 3. FETCH SELECTED USER ACTIVITY DATA
  // ==========================================================
  const fetchActivity = useCallback(async () => {
    if (!id) return;
    try {
      setActivityLoading(true);
      setActivityError("");
      const response = await fetch(`${API_URL}/${id}/activity`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load activity data.");
      }
      setActivityData({
        activities: data.activities || [],
        stats: data.stats || {},
      });
    } catch (err) {
      console.error("Fetch Activity Error:", err);
      setActivityError(err.message || "Failed to load user activity data.");
    } finally {
      setActivityLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (activeTab === "activity") {
      fetchActivity();
    }
  }, [activeTab, fetchActivity]);

  const filteredActivities = useMemo(() => {
    if (!activityData.activities) return [];
    return activityData.activities.filter((act) => {
      const matchesSearch =
        !activitySearch ||
        act.description?.toLowerCase().includes(activitySearch.toLowerCase()) ||
        act.type?.toLowerCase().includes(activitySearch.toLowerCase());
      const matchesFilter =
        activityFilter === "All" ||
        act.type?.toLowerCase() === activityFilter.toLowerCase();
      return matchesSearch && matchesFilter;
    });
  }, [activityData.activities, activitySearch, activityFilter]);

  // ==========================================================
  // 4. FETCH SELECTED USER REPORT DATA
  // ==========================================================
  const fetchReport = useCallback(async () => {
    if (!id) return;
    try {
      setReportLoading(true);
      setReportError("");
      const params = new URLSearchParams({
        duration: reportDuration,
        year: String(reportYear),
      });

      if (reportDuration === "monthly") params.append("month", String(reportMonth));
      if (reportDuration === "quarterly") params.append("quarter", String(reportQuarter));
      if (reportDuration === "halfYear") params.append("half", String(reportHalf));

      const response = await fetch(`${API_URL}/${id}/reports?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load user report.");
      }
      setReportData(data.report);
    } catch (err) {
      console.error("Fetch Report Error:", err);
      setReportError(err.message || "Failed to load user financial report.");
    } finally {
      setReportLoading(false);
    }
  }, [id, reportDuration, reportYear, reportMonth, reportQuarter, reportHalf]);

  useEffect(() => {
    if (activeTab === "reports") {
      fetchReport();
    }
  }, [activeTab, fetchReport]);

  const handleDownloadPdf = () => {
    if (!reportData) return;
    generateFinancialReport(reportData);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f8f3]">
      <AdminSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-[1250px]">

            {/* BACK BUTTON */}
            <button
              onClick={() => navigate("/admin/users")}
              className="mb-5 flex items-center gap-2 text-sm font-semibold text-[#617268] hover:text-[#57923d] transition"
            >
              <ArrowLeft size={16} />
              Back to Users
            </button>

            {error && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-600" />
                <div>
                  <p className="text-sm font-semibold">Error Loading User</p>
                  <p className="mt-1 text-xs">{error}</p>
                </div>
              </div>
            )}

            {loading ? (
              <div className="mt-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-[#57923d]" />
                <p className="text-sm text-[#718177]">Loading user details from MongoDB...</p>
              </div>
            ) : user && (
              <>
                {/* USER HEADER */}
                <section className="rounded-2xl border border-[#dfe6da] bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#edf5e8] text-2xl font-bold text-[#57923d]">
                        {user.name.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h1 className="text-2xl font-bold text-[#173b2b]">
                            {user.name}
                          </h1>
                          <StatusBadge status={user.status} />
                        </div>

                        <p className="mt-1 font-mono text-xs font-semibold text-[#639a48]">
                          {user.userId}
                        </p>

                        <p className="mt-1 text-sm text-[#718177]">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => navigate(`/admin/users/${id}/access`)}
                        className="flex items-center gap-2 rounded-xl border border-[#dce4d8] px-4 py-2.5 text-sm font-semibold text-[#526459] hover:bg-[#f5f8f2] transition"
                      >
                        <KeyRound size={16} />
                        Manage Access
                      </button>

                      <button
                        onClick={() => navigate(`/admin/users/${id}/edit`)}
                        className="flex items-center gap-2 rounded-xl bg-[#dff3ad] px-4 py-2.5 text-sm font-semibold text-[#173b2b] hover:bg-[#d5eba2] transition shadow-sm"
                      >
                        <Pencil size={16} />
                        Edit User
                      </button>
                    </div>
                  </div>
                </section>

                {/* TABS HEADER */}
                <div className="mt-5 flex overflow-x-auto rounded-2xl border border-[#dfe6da] bg-white px-3 shadow-sm">
                  <Tab
                    text="Overview"
                    active={activeTab === "overview"}
                    onClick={() => setActiveTab("overview")}
                  />
                  <Tab
                    text="Access"
                    active={activeTab === "access"}
                    onClick={() => setActiveTab("access")}
                  />
                  <Tab
                    text="Financial"
                    active={activeTab === "financial"}
                    onClick={() => setActiveTab("financial")}
                  />
                  <Tab
                    text="Activity"
                    active={activeTab === "activity"}
                    onClick={() => setActiveTab("activity")}
                  />
                  <Tab
                    text="Reports"
                    active={activeTab === "reports"}
                    onClick={() => setActiveTab("reports")}
                  />
                </div>

                {/* ==================================================
                    1. OVERVIEW TAB (PRESERVED)
                ================================================== */}
                {activeTab === "overview" && (
                  <div className="mt-5 grid gap-5 xl:grid-cols-2">
                    <Section
                      title="Personal Information"
                      description="Selected user's profile details."
                    >
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Detail
                          icon={<Mail size={16} />}
                          label="Email"
                          value={user.email || "—"}
                        />
                        <Detail
                          icon={<Phone size={16} />}
                          label="Mobile"
                          value={user.mobile || "—"}
                        />
                        <Detail
                          icon={<CalendarDays size={16} />}
                          label="Date of Birth"
                          value={user.dateOfBirth || "—"}
                        />
                        <Detail
                          icon={<UserCheck size={16} />}
                          label="Gender"
                          value={user.gender || "—"}
                        />
                        <Detail
                          icon={<MapPin size={16} />}
                          label="City"
                          value={user.city || "—"}
                        />
                        <Detail
                          icon={<MapPin size={16} />}
                          label="State"
                          value={user.state || "—"}
                        />
                      </div>
                    </Section>

                    <Section
                      title="Account Information"
                      description="Administrative account credentials and registration."
                    >
                      <div className="grid gap-5 sm:grid-cols-2">
                        <TextDetail
                          label="Internal User ID"
                          value={user.userId || "—"}
                        />
                        <TextDetail
                          label="Account Status"
                          value={user.status || "Active"}
                        />
                        <TextDetail
                          label="Registered"
                          value={user.joined || "—"}
                        />
                        <TextDetail
                          label="Last Sign In"
                          value={user.lastLogin || "—"}
                        />
                        <TextDetail
                          label="Onboarding"
                          value={user.onboarding || "Completed"}
                        />
                      </div>
                    </Section>
                  </div>
                )}

                {/* ==================================================
                    2. ACCESS TAB (PRESERVED)
                ================================================== */}
                {activeTab === "access" && (
                  <section className="mt-5 rounded-2xl border border-[#dfe6da] bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-[#edf0eb] p-5">
                      <div>
                        <h2 className="font-bold text-[#173b2b]">
                          User Access & Permissions
                        </h2>
                        <p className="mt-1 text-xs text-[#718177]">
                          Active FinanceOS permissions assigned to this user.
                        </p>
                      </div>

                      <button
                        onClick={() => navigate(`/admin/users/${id}/access`)}
                        className="rounded-xl bg-[#dff3ad] px-4 py-2 text-sm font-semibold text-[#173b2b] hover:bg-[#d5eba2] transition"
                      >
                        Manage Access
                      </button>
                    </div>

                    <div className="grid gap-3 p-5 md:grid-cols-2">
                      <Permission
                        name="Dashboard"
                        enabled={user.permissions.dashboard}
                      />
                      <Permission
                        name="Monthly Finance"
                        enabled={user.permissions.monthlyFinance}
                      />
                      <Permission
                        name="Saving Goals"
                        enabled={user.permissions.savingGoals}
                      />
                      <Permission
                        name="Plans & Commitments"
                        enabled={user.permissions.plans}
                      />
                      <Permission
                        name="Financial Calendar"
                        enabled={user.permissions.calendar}
                      />
                      <Permission
                        name="Reports"
                        enabled={user.permissions.reports}
                      />
                      <Permission
                        name="AI Advisor"
                        enabled={user.permissions.aiAdvisor}
                      />
                    </div>
                  </section>
                )}

                {/* ==================================================
                    3. FINANCIAL TAB (FULLY CONNECTED TO REAL MONGODB)
                ================================================== */}
                {activeTab === "financial" && (
                  <div className="mt-5 space-y-5">
                    {/* TOP CONTROLS & SECURITY BADGE */}
                    <div className="flex flex-col gap-4 rounded-2xl border border-[#dfe6da] bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf6e7] text-[#57923d]">
                          <ShieldCheck size={20} />
                        </div>
                        <div>
                          <h2 className="font-bold text-[#173b2b]">
                            Selected User Financials — {user.name}
                          </h2>
                          <p className="text-xs text-[#718177]">
                            Real-time records from MongoDB for User ID:{" "}
                            <span className="font-mono font-semibold text-[#57923d]">{user.userId}</span>
                          </p>
                        </div>
                      </div>

                      {/* PERIOD SELECTOR */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* If user has recorded historical periods, provide quick dropdown */}
                        {financialData?.availablePeriods?.length > 0 && (
                          <select
                            value={`${financialYear}-${financialMonth}`}
                            onChange={(e) => {
                              const [y, m] = e.target.value.split("-").map(Number);
                              handlePeriodChange(y, m);
                            }}
                            className="rounded-xl border border-[#dfe6da] bg-[#fafcf9] px-3 py-2 text-xs font-semibold text-[#173b2b] outline-none"
                          >
                            <option value="">Select Recorded Period...</option>
                            {financialData.availablePeriods.map((p) => (
                              <option key={`${p.year}-${p.month}`} value={`${p.year}-${p.month}`}>
                                {p.label}
                              </option>
                            ))}
                          </select>
                        )}

                        <select
                          value={financialMonth}
                          onChange={(e) => handlePeriodChange(financialYear, Number(e.target.value))}
                          className="rounded-xl border border-[#dfe6da] bg-[#fafcf9] px-3 py-2 text-xs font-semibold text-[#173b2b] outline-none"
                        >
                          {MONTH_NAMES.map((name, idx) => (
                            <option key={idx + 1} value={idx + 1}>
                              {name}
                            </option>
                          ))}
                        </select>

                        <select
                          value={financialYear}
                          onChange={(e) => handlePeriodChange(Number(e.target.value), financialMonth)}
                          className="rounded-xl border border-[#dfe6da] bg-[#fafcf9] px-3 py-2 text-xs font-semibold text-[#173b2b] outline-none"
                        >
                          {[2024, 2025, 2026, 2027, 2028].map((yr) => (
                            <option key={yr} value={yr}>
                              {yr}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => fetchFinancial(financialYear, financialMonth)}
                          disabled={financialLoading}
                          className="flex items-center gap-1.5 rounded-xl border border-[#dfe6da] px-3 py-2 text-xs font-semibold text-[#526459] hover:bg-[#f5f8f2] transition"
                        >
                          <RefreshCw size={13} className={financialLoading ? "animate-spin text-[#57923d]" : ""} />
                          Refresh
                        </button>
                      </div>
                    </div>

                    {financialError && (
                      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
                        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-600" />
                        <div>
                          <p className="text-sm font-semibold">Error Loading Financials</p>
                          <p className="mt-1 text-xs">{financialError}</p>
                        </div>
                      </div>
                    )}

                    {financialLoading ? (
                      <div className="flex flex-col items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-[#57923d]" />
                        <p className="mt-3 text-sm text-[#718177]">
                          Loading financial position for {MONTH_NAMES[financialMonth - 1]} {financialYear}...
                        </p>
                      </div>
                    ) : financialData && (
                      <>
                        {/* EMPTY FINANCIAL DATA NOTICE */}
                        {!financialData.hasAnyFinancialData && (
                          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
                            <div className="flex items-center gap-3">
                              <Info size={20} className="text-amber-600" />
                              <div>
                                <p className="text-sm font-semibold">No Financial Records in MongoDB</p>
                                <p className="text-xs text-amber-800">
                                  This user has not yet entered monthly finance records, goals, investments, or commitments.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* KEY FINANCIAL METRICS CARDS */}
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                          <FinancialMetricCard
                            title="Total Income"
                            value={financialData.hasAnyFinancialData ? fmtINR(financialData.summary.income) : "—"}
                            subValue={
                              financialData.hasAnyFinancialData
                                ? `Base: ${fmtINR(financialData.summary.baseIncome)} | Addl: ${fmtINR(financialData.summary.additionalIncome)}`
                                : "No income recorded"
                            }
                            icon={<CircleDollarSign size={20} />}
                            accent="text-[#173b2b]"
                          />

                          <FinancialMetricCard
                            title="Monthly Expenses"
                            value={financialData.hasAnyFinancialData ? fmtINR(financialData.summary.expenses) : "—"}
                            subValue="Living & operational expenses"
                            icon={<WalletCards size={20} />}
                            accent="text-[#963737]"
                          />

                          <FinancialMetricCard
                            title="Opening Balance"
                            value={financialData.hasAnyFinancialData ? fmtINR(financialData.summary.openingBalance) : "—"}
                            subValue={
                              financialData.breakdown?.openingBalance?.sourceDescription ||
                              "Starting cash & savings"
                            }
                            icon={<CreditCard size={20} />}
                            accent="text-[#2b5e39]"
                          />

                          <div className="rounded-2xl border-2 border-[#57923d] bg-[#f2f8ee] p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                              <span className="rounded-full bg-[#57923d] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                                Authoritative
                              </span>
                              <Sparkles size={18} className="text-[#57923d]" />
                            </div>
                            <p className="mt-2 text-xs font-semibold text-[#526459]">Available to Allocate</p>
                            <p className="mt-1 text-2xl font-extrabold text-[#173b2b]">
                              {financialData.hasAnyFinancialData
                                ? fmtINR(financialData.summary.availableToAllocate)
                                : "—"}
                            </p>
                            <p className="mt-1 text-[11px] text-[#617268]">
                              Closing: {financialData.hasAnyFinancialData ? fmtINR(financialData.summary.closingBalance) : "—"}
                            </p>
                          </div>
                        </div>

                        {/* EXPLANATION BANNER */}
                        {financialData.breakdown?.explanation && (
                          <div className="rounded-2xl border border-[#dce7d5] bg-white p-5 shadow-sm">
                            <div className="flex items-start gap-3">
                              <Info size={19} className="mt-0.5 shrink-0 text-[#57923d]" />
                              <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-[#57923d]">
                                  Cash Flow Analysis ({financialData.period.monthLabel})
                                </p>
                                <p className="mt-1 text-sm leading-relaxed text-[#2c3e32]">
                                  {financialData.breakdown.explanation}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* POSITION & BREAKDOWN GRID */}
                        <div className="grid gap-5 lg:grid-cols-2">
                          {/* NET WORTH & ASSETS/LIABILITIES */}
                          <Section title="Balance Sheet & Net Worth" description="Accumulated assets and liabilities recorded in MongoDB.">
                            <div className="space-y-3.5">
                              <FinancialRow
                                label="Total Assets (Savings + Investments + Liquidity)"
                                value={financialData.hasAnyFinancialData ? fmtINR(financialData.summary.totalAssets) : "—"}
                              />
                              <FinancialRow
                                label="Total Outstanding Liabilities"
                                value={financialData.hasAnyFinancialData ? fmtINR(financialData.summary.totalLiabilities) : "—"}
                              />
                              <FinancialRow
                                label="Estimated Net Worth"
                                value={financialData.hasAnyFinancialData ? fmtINR(financialData.summary.netWorth) : "—"}
                                strong
                              />
                            </div>
                          </Section>

                          {/* OUTFLOWS IN SELECTED MONTH */}
                          <Section title="Actual Monthly Outflows" description="Actual paid contributions and obligations for this period.">
                            <div className="space-y-3.5">
                              <FinancialRow
                                label="Living Expenses"
                                value={financialData.hasAnyFinancialData ? fmtINR(financialData.breakdown.outflows?.expenses) : "—"}
                              />
                              <FinancialRow
                                label="Investment Contributions Paid"
                                value={financialData.hasAnyFinancialData ? fmtINR(financialData.breakdown.outflows?.investments) : "—"}
                              />
                              <FinancialRow
                                label="Saving Goal Contributions Paid"
                                value={financialData.hasAnyFinancialData ? fmtINR(financialData.breakdown.outflows?.goalContributions) : "—"}
                              />
                              <FinancialRow
                                label="Insurance Premiums Paid"
                                value={financialData.hasAnyFinancialData ? fmtINR(financialData.breakdown.outflows?.insurancePayments) : "—"}
                              />
                              <FinancialRow
                                label="Liability / EMI Paid"
                                value={financialData.hasAnyFinancialData ? fmtINR(financialData.breakdown.outflows?.liabilityPayments) : "—"}
                              />
                              <FinancialRow
                                label="Total Actual Outflows"
                                value={financialData.hasAnyFinancialData ? fmtINR(financialData.breakdown.outflows?.totalActualOutflows) : "—"}
                                strong
                              />
                            </div>
                          </Section>
                        </div>

                        {/* ADDITIONAL INCOMES (IF ANY) */}
                        {financialData.additionalIncomes?.length > 0 && (
                          <Section title="Additional Income Entries" description="Inflows recorded for this month outside base salary.">
                            <div className="divide-y divide-[#edf0eb] overflow-hidden rounded-xl border border-[#e2e8de]">
                              {financialData.additionalIncomes.map((ai) => (
                                <div key={ai._id} className="flex items-center justify-between p-3.5 text-sm">
                                  <div>
                                    <p className="font-semibold text-[#173b2b]">{ai.title}</p>
                                    <p className="text-xs text-[#718177]">{ai.category} • {fmtDate(ai.date)}</p>
                                  </div>
                                  <span className="font-bold text-[#57923d]">+{fmtINR(ai.amount)}</span>
                                </div>
                              ))}
                            </div>
                          </Section>
                        )}

                        {/* SAVING GOALS TABLE */}
                        <Section
                          title={`Saving Goals (${financialData.savingGoals?.length || 0})`}
                          description="Target goals configured by the user."
                        >
                          {financialData.savingGoals?.length > 0 ? (
                            <div className="overflow-x-auto rounded-xl border border-[#e2e8de]">
                              <table className="w-full text-left text-sm">
                                <thead className="border-b border-[#edf0eb] bg-[#fafcf9] text-xs font-semibold text-[#718177]">
                                  <tr>
                                    <th className="px-4 py-3">Goal Name</th>
                                    <th className="px-4 py-3">Category</th>
                                    <th className="px-4 py-3">Target</th>
                                    <th className="px-4 py-3">Saved</th>
                                    <th className="px-4 py-3">Monthly</th>
                                    <th className="px-4 py-3">Target Date</th>
                                    <th className="px-4 py-3">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#edf0eb]">
                                  {financialData.savingGoals.map((g) => (
                                    <tr key={g._id} className="hover:bg-[#fafcf9]">
                                      <td className="px-4 py-3 font-semibold text-[#173b2b]">{g.goalName || g.name}</td>
                                      <td className="px-4 py-3 text-[#526459]">{g.category || "—"}</td>
                                      <td className="px-4 py-3 font-medium text-[#173b2b]">{fmtINR(g.targetAmount)}</td>
                                      <td className="px-4 py-3 font-semibold text-[#57923d]">{fmtINR(g.currentAmount || g.alreadySaved)}</td>
                                      <td className="px-4 py-3 text-[#526459]">{fmtINR(g.monthlyContribution)}</td>
                                      <td className="px-4 py-3 text-xs text-[#718177]">{fmtDate(g.targetDate)}</td>
                                      <td className="px-4 py-3">
                                        <span className="rounded-full bg-[#edf6e7] px-2.5 py-0.5 text-xs font-semibold text-[#57923d]">
                                          {g.status || "Active"}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <EmptyCategory label="No saving goals recorded for this user." />
                          )}
                        </Section>

                        {/* INVESTMENTS TABLE */}
                        <Section
                          title={`Investments (${financialData.investments?.length || 0})`}
                          description="Active portfolio items and SIP commitments."
                        >
                          {financialData.investments?.length > 0 ? (
                            <div className="overflow-x-auto rounded-xl border border-[#e2e8de]">
                              <table className="w-full text-left text-sm">
                                <thead className="border-b border-[#edf0eb] bg-[#fafcf9] text-xs font-semibold text-[#718177]">
                                  <tr>
                                    <th className="px-4 py-3">Investment Name</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Amount</th>
                                    <th className="px-4 py-3">Frequency</th>
                                    <th className="px-4 py-3">Maturity Date</th>
                                    <th className="px-4 py-3">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#edf0eb]">
                                  {financialData.investments.map((inv) => (
                                    <tr key={inv._id} className="hover:bg-[#fafcf9]">
                                      <td className="px-4 py-3 font-semibold text-[#173b2b]">{inv.name}</td>
                                      <td className="px-4 py-3 text-[#526459]">{inv.type}</td>
                                      <td className="px-4 py-3 font-semibold text-[#173b2b]">{fmtINR(inv.amount)}</td>
                                      <td className="px-4 py-3 text-[#526459]">{inv.frequency || "Monthly"}</td>
                                      <td className="px-4 py-3 text-xs text-[#718177]">{fmtDate(inv.maturityDate)}</td>
                                      <td className="px-4 py-3">
                                        <span className="rounded-full bg-[#edf6e7] px-2.5 py-0.5 text-xs font-semibold text-[#57923d]">
                                          {inv.status || "Active"}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <EmptyCategory label="No investments recorded for this user." />
                          )}
                        </Section>

                        {/* LIABILITIES TABLE */}
                        <Section
                          title={`Liabilities (${financialData.liabilities?.length || 0})`}
                          description="Loans and credit commitments."
                        >
                          {financialData.liabilities?.length > 0 ? (
                            <div className="overflow-x-auto rounded-xl border border-[#e2e8de]">
                              <table className="w-full text-left text-sm">
                                <thead className="border-b border-[#edf0eb] bg-[#fafcf9] text-xs font-semibold text-[#718177]">
                                  <tr>
                                    <th className="px-4 py-3">Liability</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Lender</th>
                                    <th className="px-4 py-3">Total Loan</th>
                                    <th className="px-4 py-3">Remaining</th>
                                    <th className="px-4 py-3">Monthly EMI</th>
                                    <th className="px-4 py-3">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#edf0eb]">
                                  {financialData.liabilities.map((l) => (
                                    <tr key={l._id} className="hover:bg-[#fafcf9]">
                                      <td className="px-4 py-3 font-semibold text-[#173b2b]">{l.name}</td>
                                      <td className="px-4 py-3 text-[#526459]">{l.type}</td>
                                      <td className="px-4 py-3 text-[#526459]">{l.lender || "—"}</td>
                                      <td className="px-4 py-3 font-medium text-[#173b2b]">{fmtINR(l.totalAmount || l.amount)}</td>
                                      <td className="px-4 py-3 font-semibold text-[#963737]">{fmtINR(l.remainingAmount)}</td>
                                      <td className="px-4 py-3 text-[#526459]">{fmtINR(l.monthlyEMI)}</td>
                                      <td className="px-4 py-3">
                                        <span className="rounded-full bg-[#fde8e8] px-2.5 py-0.5 text-xs font-semibold text-[#963737]">
                                          {l.status || "Active"}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <EmptyCategory label="No liabilities recorded for this user." />
                          )}
                        </Section>

                        {/* INSURANCE TABLE */}
                        <Section
                          title={`Insurance Policies (${financialData.insurances?.length || 0})`}
                          description="Life, health, and asset insurance policies."
                        >
                          {financialData.insurances?.length > 0 ? (
                            <div className="overflow-x-auto rounded-xl border border-[#e2e8de]">
                              <table className="w-full text-left text-sm">
                                <thead className="border-b border-[#edf0eb] bg-[#fafcf9] text-xs font-semibold text-[#718177]">
                                  <tr>
                                    <th className="px-4 py-3">Policy</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Provider</th>
                                    <th className="px-4 py-3">Coverage</th>
                                    <th className="px-4 py-3">Premium</th>
                                    <th className="px-4 py-3">Frequency</th>
                                    <th className="px-4 py-3">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#edf0eb]">
                                  {financialData.insurances.map((ins) => (
                                    <tr key={ins._id} className="hover:bg-[#fafcf9]">
                                      <td className="px-4 py-3 font-semibold text-[#173b2b]">{ins.name}</td>
                                      <td className="px-4 py-3 text-[#526459]">{ins.type}</td>
                                      <td className="px-4 py-3 text-[#526459]">{ins.provider || "—"}</td>
                                      <td className="px-4 py-3 font-medium text-[#173b2b]">{fmtINR(ins.coverageAmount)}</td>
                                      <td className="px-4 py-3 font-semibold text-[#173b2b]">{fmtINR(ins.premiumAmount)}</td>
                                      <td className="px-4 py-3 text-[#526459]">{ins.paymentFrequency || "Monthly"}</td>
                                      <td className="px-4 py-3">
                                        <span className="rounded-full bg-[#edf6e7] px-2.5 py-0.5 text-xs font-semibold text-[#57923d]">
                                          {ins.status || "Active"}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <EmptyCategory label="No insurance policies recorded for this user." />
                          )}
                        </Section>
                      </>
                    )}
                  </div>
                )}

                {/* ==================================================
                    4. ACTIVITY TAB (REAL AUDIT EVENTS FROM MONGODB)
                ================================================== */}
                {activeTab === "activity" && (
                  <section className="mt-5 overflow-hidden rounded-2xl border border-[#dfe6da] bg-white shadow-sm">
                    {/* ACTIVITY HEADER & STATS BAR */}
                    <div className="border-b border-[#edf0eb] p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h2 className="font-bold text-[#173b2b]">
                            User Activity & Audit Trail
                          </h2>
                          <p className="mt-1 text-xs text-[#718177]">
                            Real MongoDB activity records strictly belonging to {user.name} ({user.userId}).
                          </p>
                        </div>

                        <button
                          onClick={fetchActivity}
                          disabled={activityLoading}
                          className="flex items-center gap-1.5 self-start rounded-xl border border-[#dfe6da] px-3 py-2 text-xs font-semibold text-[#526459] hover:bg-[#f5f8f2] transition"
                        >
                          <RefreshCw size={13} className={activityLoading ? "animate-spin text-[#57923d]" : ""} />
                          Refresh Activity
                        </button>
                      </div>

                      {/* STATS PILLS */}
                      <div className="mt-4 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-xl border border-[#dfe6da] bg-[#fafcf9] px-3 py-1.5 font-semibold text-[#173b2b]">
                          Total Events: {activityData.stats?.total || 0}
                        </span>
                        <span className="rounded-xl border border-[#dfe6da] bg-[#fafcf9] px-3 py-1.5 font-semibold text-[#526459]">
                          Sign In: {activityData.stats?.signIn || 0}
                        </span>
                        <span className="rounded-xl border border-[#dfe6da] bg-[#fafcf9] px-3 py-1.5 font-semibold text-[#526459]">
                          Registration: {activityData.stats?.registration || 0}
                        </span>
                        <span className="rounded-xl border border-[#dfe6da] bg-[#fafcf9] px-3 py-1.5 font-semibold text-[#526459]">
                          Reports: {activityData.stats?.report || 0}
                        </span>
                        <span className="rounded-xl border border-[#dfe6da] bg-[#fafcf9] px-3 py-1.5 font-semibold text-[#526459]">
                          Settings: {activityData.stats?.settings || 0}
                        </span>
                      </div>

                      {/* SEARCH & FILTER */}
                      <div className="mt-4 flex flex-wrap gap-3">
                        <div className="relative flex-1 min-w-[220px]">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#829087]" />
                          <input
                            value={activitySearch}
                            onChange={(e) => setActivitySearch(e.target.value)}
                            placeholder="Search activity description..."
                            className="w-full rounded-xl border border-[#dfe6da] bg-[#fafcf9] py-2 pl-9 pr-3 text-xs text-[#173b2b] outline-none placeholder:text-[#9aa59e]"
                          />
                        </div>

                        <select
                          value={activityFilter}
                          onChange={(e) => setActivityFilter(e.target.value)}
                          className="rounded-xl border border-[#dfe6da] bg-[#fafcf9] px-3 py-2 text-xs font-semibold text-[#526459] outline-none"
                        >
                          <option value="All">All Types</option>
                          <option value="Registration">Registration</option>
                          <option value="Sign In">Sign In</option>
                          <option value="Account">Account</option>
                          <option value="Report">Report</option>
                          <option value="Settings">Settings</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    {/* ACTIVITY LIST */}
                    {activityLoading ? (
                      <div className="flex flex-col items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-[#57923d]" />
                        <p className="mt-3 text-sm text-[#718177]">Loading activities...</p>
                      </div>
                    ) : filteredActivities.length > 0 ? (
                      <div className="divide-y divide-[#edf0eb]">
                        {filteredActivities.map((act) => (
                          <div key={act._id} className="flex items-start gap-3.5 p-5 transition hover:bg-[#fafcf9]">
                            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf5e8] text-[#57923d]">
                              <Clock3 size={16} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                  act.type === "Registration"
                                    ? "bg-blue-100 text-blue-800"
                                    : act.type === "Sign In"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : act.type === "Report"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-[#edf6e7] text-[#57923d]"
                                }`}>
                                  {act.type}
                                </span>
                              </div>
                              <p className="mt-1 text-sm font-medium text-[#173b2b]">
                                {act.description}
                              </p>
                            </div>

                            <p className="shrink-0 text-xs text-[#8a978f]">
                              {fmtDateTime(act.createdAt)}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Activity size={32} className="text-[#a3aea7]" />
                        <p className="mt-3 text-sm font-semibold text-[#526459]">
                          No activity found for this user.
                        </p>
                        <p className="mt-1 text-xs text-[#8a978f]">
                          Logged user interactions, sign-ins, and financial changes will appear here.
                        </p>
                      </div>
                    )}
                  </section>
                )}

                {/* ==================================================
                    5. REPORTS TAB (REAL USER FINANCIAL REPORT + PDF)
                ================================================== */}
                {activeTab === "reports" && (
                  <div className="mt-5 space-y-5">
                    {/* DURATION & CONTROLS HEADER */}
                    <div className="flex flex-col gap-4 rounded-2xl border border-[#dfe6da] bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
                      <div>
                        <h2 className="font-bold text-[#173b2b]">
                          Financial Report — {user.name}
                        </h2>
                        <p className="text-xs text-[#718177]">
                          Deterministic analytics engine scoped strictly to this user.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* DURATION TABS */}
                        <div className="flex rounded-xl border border-[#dfe6da] bg-[#fafcf9] p-1 text-xs font-semibold">
                          <button
                            onClick={() => setReportDuration("monthly")}
                            className={`rounded-lg px-3 py-1.5 transition ${
                              reportDuration === "monthly" ? "bg-[#57923d] text-white" : "text-[#526459]"
                            }`}
                          >
                            Monthly
                          </button>
                          <button
                            onClick={() => setReportDuration("quarterly")}
                            className={`rounded-lg px-3 py-1.5 transition ${
                              reportDuration === "quarterly" ? "bg-[#57923d] text-white" : "text-[#526459]"
                            }`}
                          >
                            Quarterly
                          </button>
                          <button
                            onClick={() => setReportDuration("halfYear")}
                            className={`rounded-lg px-3 py-1.5 transition ${
                              reportDuration === "halfYear" ? "bg-[#57923d] text-white" : "text-[#526459]"
                            }`}
                          >
                            Half-Yearly
                          </button>
                          <button
                            onClick={() => setReportDuration("yearly")}
                            className={`rounded-lg px-3 py-1.5 transition ${
                              reportDuration === "yearly" ? "bg-[#57923d] text-white" : "text-[#526459]"
                            }`}
                          >
                            Yearly
                          </button>
                        </div>

                        {/* PERIOD CONTROLS */}
                        {reportDuration === "monthly" && (
                          <select
                            value={reportMonth}
                            onChange={(e) => setReportMonth(Number(e.target.value))}
                            className="rounded-xl border border-[#dfe6da] bg-[#fafcf9] px-3 py-2 text-xs font-semibold text-[#173b2b]"
                          >
                            {MONTH_NAMES.map((m, idx) => (
                              <option key={idx + 1} value={idx + 1}>{m}</option>
                            ))}
                          </select>
                        )}

                        {reportDuration === "quarterly" && (
                          <select
                            value={reportQuarter}
                            onChange={(e) => setReportQuarter(Number(e.target.value))}
                            className="rounded-xl border border-[#dfe6da] bg-[#fafcf9] px-3 py-2 text-xs font-semibold text-[#173b2b]"
                          >
                            <option value={1}>Q1 (Jan - Mar)</option>
                            <option value={2}>Q2 (Apr - Jun)</option>
                            <option value={3}>Q3 (Jul - Sep)</option>
                            <option value={4}>Q4 (Oct - Dec)</option>
                          </select>
                        )}

                        {reportDuration === "halfYear" && (
                          <select
                            value={reportHalf}
                            onChange={(e) => setReportHalf(Number(e.target.value))}
                            className="rounded-xl border border-[#dfe6da] bg-[#fafcf9] px-3 py-2 text-xs font-semibold text-[#173b2b]"
                          >
                            <option value={1}>H1 (Jan - Jun)</option>
                            <option value={2}>H2 (Jul - Dec)</option>
                          </select>
                        )}

                        <select
                          value={reportYear}
                          onChange={(e) => setReportYear(Number(e.target.value))}
                          className="rounded-xl border border-[#dfe6da] bg-[#fafcf9] px-3 py-2 text-xs font-semibold text-[#173b2b]"
                        >
                          {[2024, 2025, 2026, 2027, 2028].map((yr) => (
                            <option key={yr} value={yr}>{yr}</option>
                          ))}
                        </select>

                        {/* PDF GENERATE BUTTON */}
                        <button
                          onClick={handleDownloadPdf}
                          disabled={!reportData || reportLoading}
                          className="flex items-center gap-1.5 rounded-xl bg-[#dff3ad] px-3.5 py-2 text-xs font-semibold text-[#173b2b] hover:bg-[#d5eba2] transition shadow-sm disabled:opacity-50"
                        >
                          <Download size={14} />
                          Generate PDF
                        </button>
                      </div>
                    </div>

                    {reportError && (
                      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
                        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-600" />
                        <div>
                          <p className="text-sm font-semibold">Error Loading Report</p>
                          <p className="mt-1 text-xs">{reportError}</p>
                        </div>
                      </div>
                    )}

                    {reportLoading ? (
                      <div className="flex flex-col items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-[#57923d]" />
                        <p className="mt-3 text-sm text-[#718177]">Generating financial report...</p>
                      </div>
                    ) : reportData ? (
                      <>
                        {/* HEALTH SCORE & SUMMARY OVERVIEW */}
                        <div className="grid gap-5 lg:grid-cols-3">
                          {/* HEALTH SCORE CARD */}
                          <div className="rounded-2xl border border-[#dfe6da] bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold uppercase tracking-wider text-[#718177]">
                                Financial Health
                              </span>
                              <Award size={18} className="text-[#57923d]" />
                            </div>

                            <div className="mt-3 flex items-baseline gap-2">
                              <span className="text-4xl font-extrabold text-[#173b2b]">
                                {reportData.financialHealth?.score !== null
                                  ? `${reportData.financialHealth.score}/100`
                                  : "N/A"}
                              </span>
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                reportData.financialHealth?.level === "excellent"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : reportData.financialHealth?.level === "good"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}>
                                {reportData.financialHealth?.status || "No Data"}
                              </span>
                            </div>

                            {/* RATIOS */}
                            <div className="mt-4 space-y-2 border-t border-[#edf0eb] pt-4 text-xs">
                              <div className="flex justify-between text-[#526459]">
                                <span>Savings Rate</span>
                                <span className="font-semibold text-[#173b2b]">
                                  {reportData.financialHealth?.ratios?.savingsRate !== undefined
                                    ? `${reportData.financialHealth.ratios.savingsRate}%`
                                    : "N/A"}
                                </span>
                              </div>
                              <div className="flex justify-between text-[#526459]">
                                <span>Expense Ratio</span>
                                <span className="font-semibold text-[#173b2b]">
                                  {reportData.financialHealth?.ratios?.expenseRatio !== undefined
                                    ? `${reportData.financialHealth.ratios.expenseRatio}%`
                                    : "N/A"}
                                </span>
                              </div>
                              <div className="flex justify-between text-[#526459]">
                                <span>Commitment Burden</span>
                                <span className="font-semibold text-[#173b2b]">
                                  {reportData.financialHealth?.ratios?.commitmentRatio !== undefined
                                    ? `${reportData.financialHealth.ratios.commitmentRatio}%`
                                    : "N/A"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* FINANCIAL HIGHLIGHTS */}
                          <div className="rounded-2xl border border-[#dfe6da] bg-white p-6 shadow-sm lg:col-span-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#718177]">
                              Period Summary ({reportData.header?.periodLabel})
                            </span>

                            <div className="mt-4 grid gap-4 sm:grid-cols-3">
                              <div className="rounded-xl border border-[#e2e8de] bg-[#fafcf9] p-3.5">
                                <p className="text-xs text-[#718177]">Total Income</p>
                                <p className="mt-1 text-lg font-bold text-[#173b2b]">
                                  {fmtINR(reportData.financialSummary?.totalIncome)}
                                </p>
                              </div>

                              <div className="rounded-xl border border-[#e2e8de] bg-[#fafcf9] p-3.5">
                                <p className="text-xs text-[#718177]">Total Expenses</p>
                                <p className="mt-1 text-lg font-bold text-[#963737]">
                                  {fmtINR(reportData.financialSummary?.totalExpenses)}
                                </p>
                              </div>

                              <div className="rounded-xl border border-[#e2e8de] bg-[#fafcf9] p-3.5">
                                <p className="text-xs text-[#718177]">Total Savings</p>
                                <p className="mt-1 text-lg font-bold text-[#57923d]">
                                  {fmtINR(reportData.financialSummary?.totalSavings)}
                                </p>
                              </div>

                              <div className="rounded-xl border border-[#e2e8de] bg-[#fafcf9] p-3.5">
                                <p className="text-xs text-[#718177]">Opening Balance</p>
                                <p className="mt-1 text-lg font-bold text-[#173b2b]">
                                  {fmtINR(reportData.financialSummary?.openingBalance)}
                                </p>
                              </div>

                              <div className="rounded-xl border border-[#e2e8de] bg-[#fafcf9] p-3.5">
                                <p className="text-xs text-[#718177]">Available to Allocate</p>
                                <p className="mt-1 text-lg font-bold text-[#57923d]">
                                  {fmtINR(reportData.financialSummary?.availableToAllocate)}
                                </p>
                              </div>

                              <div className="rounded-xl border border-[#e2e8de] bg-[#fafcf9] p-3.5">
                                <p className="text-xs text-[#718177]">Closing Balance</p>
                                <p className="mt-1 text-lg font-bold text-[#173b2b]">
                                  {fmtINR(reportData.financialSummary?.closingBalance)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* MONTH DETAILS BREAKDOWN */}
                        {reportData.monthDetails?.length > 0 && (
                          <Section title="Monthly Progression" description="Cash flow records aggregated for each month in this period.">
                            <div className="overflow-x-auto rounded-xl border border-[#e2e8de]">
                              <table className="w-full text-left text-sm">
                                <thead className="border-b border-[#edf0eb] bg-[#fafcf9] text-xs font-semibold text-[#718177]">
                                  <tr>
                                    <th className="px-4 py-3">Month</th>
                                    <th className="px-4 py-3">Base Income</th>
                                    <th className="px-4 py-3">Addl Income</th>
                                    <th className="px-4 py-3">Total Income</th>
                                    <th className="px-4 py-3">Expenses</th>
                                    <th className="px-4 py-3">Savings</th>
                                    <th className="px-4 py-3">Closing</th>
                                    <th className="px-4 py-3">Health</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#edf0eb]">
                                  {reportData.monthDetails.map((m) => (
                                    <tr key={m.month} className="hover:bg-[#fafcf9]">
                                      <td className="px-4 py-3 font-semibold text-[#173b2b]">{m.monthName}</td>
                                      <td className="px-4 py-3 text-[#526459]">{fmtINR(m.baseIncome)}</td>
                                      <td className="px-4 py-3 text-[#526459]">{fmtINR(m.additionalIncome)}</td>
                                      <td className="px-4 py-3 font-semibold text-[#173b2b]">{fmtINR(m.totalIncome)}</td>
                                      <td className="px-4 py-3 text-[#963737]">{fmtINR(m.expenses)}</td>
                                      <td className="px-4 py-3 font-semibold text-[#57923d]">{fmtINR(m.savings)}</td>
                                      <td className="px-4 py-3 font-medium text-[#173b2b]">{fmtINR(m.closingBalance)}</td>
                                      <td className="px-4 py-3 text-xs font-semibold text-[#57923d]">
                                        {m.healthScore !== null ? `${m.healthScore}/100` : "—"}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </Section>
                        )}

                        {/* TRANSACTIONS LEDGER */}
                        {reportData.transactionsLedger?.length > 0 && (
                          <Section title="Financial Activity Ledger" description="Contributions, premiums, and debt installments executed during this period.">
                            <div className="overflow-x-auto rounded-xl border border-[#e2e8de]">
                              <table className="w-full text-left text-sm">
                                <thead className="border-b border-[#edf0eb] bg-[#fafcf9] text-xs font-semibold text-[#718177]">
                                  <tr>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Category</th>
                                    <th className="px-4 py-3">Description</th>
                                    <th className="px-4 py-3">Amount</th>
                                    <th className="px-4 py-3">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#edf0eb]">
                                  {reportData.transactionsLedger.map((tx, idx) => (
                                    <tr key={idx} className="hover:bg-[#fafcf9]">
                                      <td className="px-4 py-3 text-xs text-[#718177]">{fmtDate(tx.date || tx.paidDate)}</td>
                                      <td className="px-4 py-3 text-[#526459]">{tx.category}</td>
                                      <td className="px-4 py-3 font-medium text-[#173b2b]">{tx.description || tx.name}</td>
                                      <td className="px-4 py-3 font-bold text-[#173b2b]">{fmtINR(tx.amount)}</td>
                                      <td className="px-4 py-3">
                                        <span className="rounded-full bg-[#edf6e7] px-2.5 py-0.5 text-xs font-semibold text-[#57923d]">
                                          {tx.status || "Paid"}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </Section>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <FileText size={32} className="text-[#a3aea7]" />
                        <p className="mt-3 text-sm font-semibold text-[#526459]">No report data available</p>
                        <p className="mt-1 text-xs text-[#8a978f]">
                          Select a different period or duration to view reports for this user.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

// ============================================================
// REUSABLE HELPER COMPONENTS
// ============================================================

function Tab({ text, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap border-b-2 px-5 py-4 text-sm font-semibold transition ${
        active
          ? "border-[#75a75d] text-[#315d36]"
          : "border-transparent text-[#7a8980] hover:text-[#315d36]"
      }`}
    >
      {text}
    </button>
  );
}

function Section({ title, description, children }) {
  return (
    <section className="rounded-2xl border border-[#dfe6da] bg-white p-5 shadow-sm">
      <h2 className="font-bold text-[#173b2b]">{title}</h2>
      {description && (
        <p className="mt-1 text-xs text-[#718177]">{description}</p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Detail({ icon, label, value }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 text-[#74a15f]">{icon}</div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a978f]">
          {label}
        </p>
        <p className="mt-1 text-sm font-medium text-[#354c3d]">{value}</p>
      </div>
    </div>
  );
}

function TextDetail({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a978f]">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-[#354c3d]">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className="rounded-full bg-[#edf6e7] px-3 py-1 text-xs font-semibold text-[#57923d]">
      {status}
    </span>
  );
}

function Permission({ name, enabled }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#e2e8de] bg-[#fafcf9] px-4 py-3">
      <span className="text-sm font-medium text-[#354c3d]">{name}</span>
      <span
        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
          enabled
            ? "bg-[#edf6e7] text-[#57923d]"
            : "bg-[#f1f2f0] text-[#7a8980]"
        }`}
      >
        {enabled ? "Enabled" : "Disabled"}
      </span>
    </div>
  );
}

function FinancialMetricCard({ title, value, subValue, icon, accent }) {
  return (
    <div className="rounded-2xl border border-[#dfe6da] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-[#718177]">{title}</p>
          <p className={`mt-2 text-2xl font-extrabold ${accent || "text-[#173b2b]"}`}>
            {value}
          </p>
          {subValue && (
            <p className="mt-1 text-[11px] text-[#8a978f] truncate max-w-[190px]">
              {subValue}
            </p>
          )}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf5e8] text-[#57923d]">
          {icon}
        </div>
      </div>
    </div>
  );
}

function FinancialRow({ label, value, strong }) {
  return (
    <div className="flex items-center justify-between border-b border-[#edf0eb] pb-3 last:border-0">
      <span className="text-sm text-[#617268]">{label}</span>
      <span
        className={`text-sm ${
          strong
            ? "font-bold text-[#173b2b]"
            : "font-semibold text-[#354c3d]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function EmptyCategory({ label }) {
  return (
    <div className="rounded-xl border border-dashed border-[#dfe6da] bg-[#fafcf9] p-6 text-center text-xs text-[#8a978f]">
      {label}
    </div>
  );
}