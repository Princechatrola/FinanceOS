import { useState } from "react";
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
} from "lucide-react";

import AdminSidebar from "../components/AdminSidebar.jsx";
import AdminTopbar from "../components/AdminTopbar.jsx";

export default function AdminUserDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [activeTab, setActiveTab] = useState("overview");

  // TEMPORARY DATA
  // Later:
  // GET /api/admin/users/:id
  const user = {
    id,
    userId: "FOS-U-001248",
    name: "Rahul Patel",
    email: "rahul@example.com",
    mobile: "+91 9876543210",
    dateOfBirth: "14 March 2001",
    gender: "Male",
    city: "Ahmedabad",
    state: "Gujarat",
    joined: "28 July 2026",
    lastLogin: "29 July 2026, 10:42 AM",
    status: "Active",
    onboarding: "Completed",

    permissions: {
      dashboard: true,
      monthlyFinance: true,
      savingGoals: true,
      plans: true,
      calendar: true,
      reports: true,
      aiAdvisor: false,
    },

    financial: {
      income: 50000,
      expenses: 32000,
      savings: 18000,
      assets: 525000,
      liabilities: 25000,
      netWorth: 500000,
      activeGoals: 2,
      commitments: 3,
    },
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f8f3]">
      <AdminSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-[1250px]">

            {/* BACK */}

            <button
              onClick={() => navigate("/admin/users")}
              className="mb-5 flex items-center gap-2 text-sm font-semibold text-[#617268] hover:text-[#57923d]"
            >
              <ArrowLeft size={16} />
              Back to Users
            </button>

            {/* USER HEADER */}

            <section className="rounded-2xl border border-[#dfe6da] bg-white p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#edf5e8] text-2xl font-bold text-[#57923d]">
                    {user.name.charAt(0)}
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
                    onClick={() =>
                      navigate(`/admin/users/${id}/access`)
                    }
                    className="flex items-center gap-2 rounded-xl border border-[#dce4d8] px-4 py-2.5 text-sm font-semibold text-[#526459] hover:bg-[#f5f8f2]"
                  >
                    <KeyRound size={16} />
                    Manage Access
                  </button>

                  <button
                    onClick={() =>
                      navigate(`/admin/users/${id}/edit`)
                    }
                    className="flex items-center gap-2 rounded-xl bg-[#dff3ad] px-4 py-2.5 text-sm font-semibold text-[#173b2b] hover:bg-[#d5eba2]"
                  >
                    <Pencil size={16} />
                    Edit User
                  </button>
                </div>
              </div>
            </section>

            {/* TABS */}

            <div className="mt-5 flex overflow-x-auto rounded-2xl border border-[#dfe6da] bg-white px-3">
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
                OVERVIEW
            ================================================== */}

            {activeTab === "overview" && (
              <div className="mt-5 grid gap-5 xl:grid-cols-2">
                <Section
                  title="Personal Information"
                  description="User profile information."
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Detail
                      icon={<Mail size={16} />}
                      label="Email"
                      value={user.email}
                    />

                    <Detail
                      icon={<Phone size={16} />}
                      label="Mobile"
                      value={user.mobile}
                    />

                    <Detail
                      icon={<CalendarDays size={16} />}
                      label="Date of Birth"
                      value={user.dateOfBirth}
                    />

                    <Detail
                      icon={<UserCheck size={16} />}
                      label="Gender"
                      value={user.gender}
                    />

                    <Detail
                      icon={<MapPin size={16} />}
                      label="City"
                      value={user.city}
                    />

                    <Detail
                      icon={<MapPin size={16} />}
                      label="State"
                      value={user.state}
                    />
                  </div>
                </Section>

                <Section
                  title="Account Information"
                  description="Administrative account information."
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <TextDetail
                      label="Internal User ID"
                      value={user.userId}
                    />

                    <TextDetail
                      label="Account Status"
                      value={user.status}
                    />

                    <TextDetail
                      label="Registered"
                      value={user.joined}
                    />

                    <TextDetail
                      label="Last Sign In"
                      value={user.lastLogin}
                    />

                    <TextDetail
                      label="Onboarding"
                      value={user.onboarding}
                    />
                  </div>
                </Section>
              </div>
            )}

            {/* ==================================================
                ACCESS
            ================================================== */}

            {activeTab === "access" && (
              <section className="mt-5 rounded-2xl border border-[#dfe6da] bg-white">
                <div className="flex items-center justify-between border-b border-[#edf0eb] p-5">
                  <div>
                    <h2 className="font-bold text-[#173b2b]">
                      User Access
                    </h2>

                    <p className="mt-1 text-xs text-[#718177]">
                      Current FinanceOS module permissions.
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      navigate(`/admin/users/${id}/access`)
                    }
                    className="rounded-xl bg-[#dff3ad] px-4 py-2 text-sm font-semibold text-[#173b2b]"
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
                FINANCIAL
            ================================================== */}

            {activeTab === "financial" && (
              <div className="mt-5">
                <div className="mb-5 rounded-2xl border border-[#dbe5d5] bg-[#edf6e7] p-4">
                  <div className="flex gap-3">
                    <ShieldCheck
                      size={19}
                      className="mt-0.5 shrink-0 text-[#57923d]"
                    />

                    <div>
                      <p className="text-sm font-semibold text-[#173b2b]">
                        Financial Detail Access
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#617268]">
                        This section should only be available to administrators
                        with permission to view user financial information.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <FinancialCard
                    title="Monthly Income"
                    value={user.financial.income}
                    icon={<CircleDollarSign size={18} />}
                  />

                  <FinancialCard
                    title="Monthly Expenses"
                    value={user.financial.expenses}
                    icon={<WalletCards size={18} />}
                  />

                  <FinancialCard
                    title="Monthly Savings"
                    value={user.financial.savings}
                    icon={<CircleDollarSign size={18} />}
                  />

                  <FinancialCard
                    title="Net Worth"
                    value={user.financial.netWorth}
                    icon={<WalletCards size={18} />}
                  />
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  <Section title="Financial Position">
                    <div className="space-y-4">
                      <FinancialRow
                        label="Total Assets"
                        value={user.financial.assets}
                      />

                      <FinancialRow
                        label="Total Liabilities"
                        value={user.financial.liabilities}
                      />

                      <FinancialRow
                        label="Net Worth"
                        value={user.financial.netWorth}
                        strong
                      />
                    </div>
                  </Section>

                  <Section title="Planning Overview">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <NumberBox
                        label="Active Goals"
                        value={user.financial.activeGoals}
                      />

                      <NumberBox
                        label="Commitments"
                        value={user.financial.commitments}
                      />
                    </div>
                  </Section>
                </div>
              </div>
            )}

            {/* ==================================================
                ACTIVITY
            ================================================== */}

            {activeTab === "activity" && (
              <section className="mt-5 overflow-hidden rounded-2xl border border-[#dfe6da] bg-white">
                <div className="border-b border-[#edf0eb] p-5">
                  <h2 className="font-bold text-[#173b2b]">
                    User Activity
                  </h2>

                  <p className="mt-1 text-xs text-[#718177]">
                    Account and administrative activity related to this user.
                  </p>
                </div>

                <ActivityItem
                  title="Signed in to FinanceOS"
                  detail="Successful user authentication"
                  time="29 Jul 2026 • 10:42 AM"
                />

                <ActivityItem
                  title="Monthly finance updated"
                  detail="User updated monthly financial information"
                  time="28 Jul 2026 • 8:16 PM"
                />

                <ActivityItem
                  title="Account created"
                  detail="Account created by FOS-A-00002"
                  time="28 Jul 2026 • 11:24 AM"
                />
              </section>
            )}

            {/* ==================================================
                REPORTS
            ================================================== */}

            {activeTab === "reports" && (
              <div className="mt-5 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
                <Section
                  title="Individual User Report"
                  description="Generate an administrative report for this user."
                >
                  <div className="rounded-xl border border-[#e2e8de] bg-[#fafcf9] p-4">
                    <div className="flex gap-3">
                      <FileText
                        size={20}
                        className="shrink-0 text-[#57923d]"
                      />

                      <div>
                        <p className="text-sm font-semibold text-[#173b2b]">
                          Complete User Report
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#718177]">
                          Account information, authorized financial summary,
                          goals, commitments and relevant activity.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      alert(
                        "PDF generation will be connected when we build Admin Reports."
                      )
                    }
                    className="mt-4 flex items-center gap-2 rounded-xl bg-[#dff3ad] px-4 py-2.5 text-sm font-semibold text-[#173b2b]"
                  >
                    <Download size={16} />
                    Generate PDF
                  </button>
                </Section>

                <Section title="Report History">
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <FileText
                      size={28}
                      className="text-[#a3aea7]"
                    />

                    <p className="mt-3 text-sm font-semibold text-[#526459]">
                      No reports generated
                    </p>

                    <p className="mt-1 text-xs text-[#8a978f]">
                      Generated reports will appear here.
                    </p>
                  </div>
                </Section>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}


// ============================================================
// COMPONENTS
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
    <section className="rounded-2xl border border-[#dfe6da] bg-white p-5">
      <h2 className="font-bold text-[#173b2b]">
        {title}
      </h2>

      {description && (
        <p className="mt-1 text-xs text-[#718177]">
          {description}
        </p>
      )}

      <div className="mt-5">
        {children}
      </div>
    </section>
  );
}

function Detail({ icon, label, value }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 text-[#74a15f]">
        {icon}
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a978f]">
          {label}
        </p>

        <p className="mt-1 text-sm font-medium text-[#354c3d]">
          {value}
        </p>
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

      <p className="mt-1 text-sm font-medium text-[#354c3d]">
        {value}
      </p>
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
      <span className="text-sm font-medium text-[#354c3d]">
        {name}
      </span>

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

function FinancialCard({ title, value, icon }) {
  return (
    <div className="rounded-2xl border border-[#dfe6da] bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#718177]">
            {title}
          </p>

          <p className="mt-2 text-xl font-bold text-[#173b2b]">
            ₹{value.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf5e8] text-[#57923d]">
          {icon}
        </div>
      </div>
    </div>
  );
}

function FinancialRow({ label, value, strong }) {
  return (
    <div className="flex items-center justify-between border-b border-[#edf0eb] pb-3 last:border-0">
      <span className="text-sm text-[#617268]">
        {label}
      </span>

      <span
        className={`text-sm ${
          strong
            ? "font-bold text-[#173b2b]"
            : "font-semibold text-[#354c3d]"
        }`}
      >
        ₹{value.toLocaleString("en-IN")}
      </span>
    </div>
  );
}

function NumberBox({ label, value }) {
  return (
    <div className="rounded-xl border border-[#e2e8de] bg-[#fafcf9] p-4">
      <p className="text-xs text-[#718177]">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-[#173b2b]">
        {value}
      </p>
    </div>
  );
}

function ActivityItem({ title, detail, time }) {
  return (
    <div className="flex gap-3 border-b border-[#edf0eb] p-5 last:border-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf5e8] text-[#57923d]">
        <Clock3 size={16} />
      </div>

      <div className="flex-1">
        <p className="text-sm font-semibold text-[#173b2b]">
          {title}
        </p>

        <p className="mt-1 text-xs text-[#718177]">
          {detail}
        </p>
      </div>

      <p className="text-xs text-[#8a978f]">
        {time}
      </p>
    </div>
  );
}