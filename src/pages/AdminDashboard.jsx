import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
  ShieldCheck,
  FileText,
  MessageSquare,
  BellRing,
  Activity,
  ArrowUpRight,
  Plus,
  Shield,
  Clock,
  AlertTriangle,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import AdminSidebar from "../components/AdminSidebar.jsx";
import AdminTopbar from "../components/AdminTopbar.jsx";


// ============================================================
// SUPER ADMIN DASHBOARD
// ============================================================

export default function AdminDashboard() {
  const navigate = useNavigate();

  // ----------------------------------------------------------
  // Temporary frontend data
  // Later this will come from Node.js + Express + MongoDB
  // ----------------------------------------------------------

  const stats = {
    totalUsers: 1248,
    activeUsers: 1102,
    inactiveUsers: 126,
    suspendedUsers: 20,
    newThisMonth: 84,
    totalAdmins: 6,
  };

  const registrations = [
    {
      id: 1,
      userId: "FOS-U-001248",
      name: "Rahul Patel",
      email: "rahul@example.com",
      date: "28 Jul 2026",
      status: "Active",
    },
    {
      id: 2,
      userId: "FOS-U-001247",
      name: "Priya Shah",
      email: "priya@example.com",
      date: "28 Jul 2026",
      status: "Active",
    },
    {
      id: 3,
      userId: "FOS-U-001246",
      name: "Amit Mehta",
      email: "amit@example.com",
      date: "27 Jul 2026",
      status: "Pending",
    },
    {
      id: 4,
      userId: "FOS-U-001245",
      name: "Neha Joshi",
      email: "neha@example.com",
      date: "27 Jul 2026",
      status: "Active",
    },
  ];

  const adminActivity = [
    {
      id: 1,
      admin: "FOS-A-00002",
      action: "Created a new user",
      target: "FOS-U-001248",
      time: "10 minutes ago",
    },
    {
      id: 2,
      admin: "FOS-SA-00001",
      action: "Updated Admin permissions",
      target: "FOS-A-00003",
      time: "34 minutes ago",
    },
    {
      id: 3,
      admin: "FOS-A-00004",
      action: "Generated user report",
      target: "42 users",
      time: "1 hour ago",
    },
    {
      id: 4,
      admin: "FOS-A-00002",
      action: "Suspended user account",
      target: "FOS-U-001190",
      time: "2 hours ago",
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f8f3]">

      {/* SIDEBAR */}
      <AdminSidebar />

      {/* RIGHT AREA */}
      <div className="flex min-w-0 flex-1 flex-col">

        <AdminTopbar />

        <main className="flex-1 overflow-y-auto px-6 py-5">

          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck
                  size={16}
                  className="text-[#639a48]"
                />

                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#639a48]">
                  Super Administration
                </p>
              </div>

              <h1 className="mt-1 text-2xl font-bold text-[#173b2b]">
                System Overview
              </h1>

              <p className="mt-1 text-sm text-[#718177]">
                Manage users, administrators, reports, communication and system activity.
              </p>
            </div>

            <div className="flex gap-3">

              <button
                onClick={() => navigate("/admin/users")}
                className="flex items-center gap-2 rounded-xl border border-[#dce5d7] bg-white px-4 py-2.5 text-sm font-semibold text-[#31523e] transition hover:bg-[#f5f8f2]"
              >
                <Users size={16} />
                Manage Users
              </button>

              <button
                onClick={() => navigate("/admin/users")}
                className="flex items-center gap-2 rounded-xl bg-[#dff3ad] px-4 py-2.5 text-sm font-semibold text-[#173b2b] transition hover:bg-[#d5eba2]"
              >
                <Plus size={16} />
                Add User
              </button>

            </div>

          </div>


          {/* ==================================================
              STAT CARDS
          ================================================== */}

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">

            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              text="Registered accounts"
              icon={<Users size={20} />}
            />

            <StatCard
              title="Active Users"
              value={stats.activeUsers}
              text="Currently active"
              icon={<UserCheck size={20} />}
            />

            <StatCard
              title="Inactive Users"
              value={stats.inactiveUsers}
              text="Inactive accounts"
              icon={<UserX size={20} />}
            />

            <StatCard
              title="Suspended"
              value={stats.suspendedUsers}
              text="Restricted accounts"
              icon={<AlertTriangle size={20} />}
            />

            <StatCard
              title="New This Month"
              value={stats.newThisMonth}
              text="July registrations"
              icon={<UserPlus size={20} />}
            />

            <StatCard
              title="Administrators"
              value={stats.totalAdmins}
              text="System administrators"
              icon={<Shield size={20} />}
            />

          </div>


          {/* ==================================================
              MAIN GRID
          ================================================== */}

          <div className="mt-6 grid gap-5 xl:grid-cols-[1.6fr_1fr]">


            {/* =================================================
                USER GROWTH
            ================================================= */}

            <section className="rounded-2xl border border-[#dfe6da] bg-white p-6">

              <div className="flex items-start justify-between">

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6d9b58]">
                    Users
                  </p>

                  <h2 className="mt-1 text-lg font-bold text-[#173b2b]">
                    User Growth
                  </h2>

                  <p className="mt-1 text-xs text-[#7b8980]">
                    Registration growth over the last six months.
                  </p>
                </div>

                <button
                  onClick={() => navigate("/admin/reports")}
                  className="flex items-center gap-1 text-xs font-semibold text-[#57923d]"
                >
                  View Report
                  <ArrowUpRight size={14} />
                </button>

              </div>


              {/* SIMPLE FRONTEND CHART */}

              <div className="mt-8 flex h-[210px] items-end gap-5 border-b border-[#e8ece5] px-4">

                <GrowthBar month="Feb" value={48} height="34%" />
                <GrowthBar month="Mar" value={57} height="43%" />
                <GrowthBar month="Apr" value={61} height="50%" />
                <GrowthBar month="May" value={73} height="63%" />
                <GrowthBar month="Jun" value={79} height="72%" />
                <GrowthBar month="Jul" value={84} height="82%" />

              </div>

            </section>


            {/* =================================================
                ACCOUNT DISTRIBUTION
            ================================================= */}

            <section className="rounded-2xl border border-[#dfe6da] bg-white p-6">

              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6d9b58]">
                Accounts
              </p>

              <h2 className="mt-1 text-lg font-bold text-[#173b2b]">
                Account Status
              </h2>

              <p className="mt-1 text-xs text-[#7b8980]">
                Current user account distribution.
              </p>

              <div className="mt-6 space-y-5">

                <StatusProgress
                  label="Active"
                  value={1102}
                  total={1248}
                />

                <StatusProgress
                  label="Inactive"
                  value={126}
                  total={1248}
                />

                <StatusProgress
                  label="Suspended"
                  value={20}
                  total={1248}
                />

              </div>

              <button
                onClick={() => navigate("/admin/users")}
                className="mt-6 w-full rounded-xl border border-[#dfe6da] py-2.5 text-sm font-semibold text-[#426636] transition hover:bg-[#f5f8f2]"
              >
                Manage Accounts
              </button>

            </section>

          </div>


          {/* ==================================================
              QUICK ACTIONS
          ================================================== */}

          <section className="mt-6 rounded-2xl border border-[#dfe6da] bg-white p-5">

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6d9b58]">
                Administration
              </p>

              <h2 className="mt-1 text-lg font-bold text-[#173b2b]">
                Quick Actions
              </h2>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

              <QuickAction
                icon={<UserPlus size={18} />}
                title="Create User"
                description="Add a new FinanceOS user."
                onClick={() => navigate("/admin/users")}
              />

              <QuickAction
                icon={<ShieldCheck size={18} />}
                title="Manage Admins"
                description="Administrators and permissions."
                onClick={() => navigate("/admin/administrators")}
              />

              <QuickAction
                icon={<FileText size={18} />}
                title="Generate Report"
                description="Create filtered system reports."
                onClick={() => navigate("/admin/reports")}
              />

              <QuickAction
                icon={<MessageSquare size={18} />}
                title="Create Message"
                description="Send messages to users."
                onClick={() => navigate("/admin/messages")}
              />

            </div>

          </section>


          {/* ==================================================
              LOWER GRID
          ================================================== */}

          <div className="mt-6 grid gap-5 xl:grid-cols-2">


            {/* =================================================
                RECENT REGISTRATIONS
            ================================================= */}

            <section className="overflow-hidden rounded-2xl border border-[#dfe6da] bg-white">

              <div className="flex items-center justify-between border-b border-[#e7ece4] px-5 py-4">

                <div>
                  <h2 className="font-bold text-[#173b2b]">
                    Recent Registrations
                  </h2>

                  <p className="mt-1 text-xs text-[#7b8980]">
                    Latest FinanceOS user accounts.
                  </p>
                </div>

                <button
                  onClick={() => navigate("/admin/users")}
                  className="text-xs font-semibold text-[#57923d]"
                >
                  View All
                </button>

              </div>

              <div>

                {registrations.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 border-b border-[#edf0eb] px-5 py-4 last:border-0"
                  >

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf5e8] text-[#57923d]">
                      <Users size={17} />
                    </div>

                    <div className="min-w-0 flex-1">

                      <div className="flex items-center gap-2">

                        <p className="truncate text-sm font-semibold text-[#173b2b]">
                          {user.name}
                        </p>

                        <StatusBadge status={user.status} />

                      </div>

                      <p className="mt-0.5 truncate text-xs text-[#718177]">
                        {user.userId} · {user.email}
                      </p>

                    </div>

                    <p className="shrink-0 text-xs text-[#8a978f]">
                      {user.date}
                    </p>

                  </div>
                ))}

              </div>

            </section>


            {/* =================================================
                RECENT ADMIN ACTIVITY
            ================================================= */}

            <section className="overflow-hidden rounded-2xl border border-[#dfe6da] bg-white">

              <div className="flex items-center justify-between border-b border-[#e7ece4] px-5 py-4">

                <div>
                  <h2 className="font-bold text-[#173b2b]">
                    Recent Admin Activity
                  </h2>

                  <p className="mt-1 text-xs text-[#7b8980]">
                    Important administrative actions.
                  </p>
                </div>

                <button
                  onClick={() => navigate("/admin/activity")}
                  className="text-xs font-semibold text-[#57923d]"
                >
                  Audit Log
                </button>

              </div>

              <div>

                {adminActivity.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 border-b border-[#edf0eb] px-5 py-4 last:border-0"
                  >

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf5e8] text-[#57923d]">
                      <Activity size={16} />
                    </div>

                    <div className="min-w-0 flex-1">

                      <p className="text-sm text-[#526459]">
                        <span className="font-semibold text-[#173b2b]">
                          {item.admin}
                        </span>{" "}
                        {item.action}
                      </p>

                      <p className="mt-1 text-xs font-medium text-[#66944f]">
                        {item.target}
                      </p>

                    </div>

                    <div className="flex shrink-0 items-start gap-1 text-[#8a978f]">
                      <Clock size={12} />

                      <span className="text-[11px]">
                        {item.time}
                      </span>
                    </div>

                  </div>
                ))}

              </div>

            </section>

          </div>


          {/* ==================================================
              ADMIN INSIGHTS
          ================================================== */}

          <section className="mt-6 rounded-2xl border border-[#dbe5d5] bg-[#edf6e7] p-5">

            <div className="flex items-center gap-2">

              <Activity
                size={17}
                className="text-[#57923d]"
              />

              <h2 className="font-bold text-[#173b2b]">
                Admin Insights
              </h2>

            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">

              <Insight text="Registrations increased 18% this month." />

              <Insight text="34 users have incomplete onboarding." />

              <Insight text="21 accounts have been inactive for 90+ days." />

              <Insight text="3 reminder email deliveries require attention." />

            </div>

          </section>


          {/* ==================================================
              REMINDER + MESSAGE OVERVIEW
          ================================================== */}

          <div className="mt-6 grid gap-5 lg:grid-cols-2">

            <OverviewCard
              icon={<BellRing size={19} />}
              title="Reminder Operations"
              value="42"
              description="User reminders scheduled for today"
              button="Monitor Reminders"
              onClick={() => navigate("/admin/messages")}
            />

            <OverviewCard
              icon={<MessageSquare size={19} />}
              title="Messages"
              value="12"
              description="Unread or scheduled administrative messages"
              button="Open Messages"
              onClick={() => navigate("/admin/messages")}
            />

          </div>

        </main>

      </div>

    </div>
  );
}


// ============================================================
// STAT CARD
// ============================================================

function StatCard({ title, value, text, icon }) {
  return (
    <div className="rounded-2xl border border-[#dfe6da] bg-white p-5">

      <div className="flex items-start justify-between">

        <div>
          <p className="text-xs font-medium text-[#718177]">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-[#173b2b]">
            {value.toLocaleString()}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf5e8] text-[#57923d]">
          {icon}
        </div>

      </div>

      <p className="mt-3 text-xs text-[#8a978f]">
        {text}
      </p>

    </div>
  );
}


// ============================================================
// GROWTH BAR
// ============================================================

function GrowthBar({ month, value, height }) {
  return (
    <div className="flex h-full flex-1 flex-col items-center justify-end">

      <span className="mb-2 text-xs font-semibold text-[#526459]">
        {value}
      </span>

      <div
        style={{ height }}
        className="w-full max-w-[45px] rounded-t-lg bg-[#b9d99b]"
      />

      <span className="my-3 text-xs text-[#7b8980]">
        {month}
      </span>

    </div>
  );
}


// ============================================================
// STATUS PROGRESS
// ============================================================

function StatusProgress({ label, value, total }) {
  const percentage = Math.round((value / total) * 100);

  return (
    <div>

      <div className="flex items-center justify-between">

        <p className="text-sm font-medium text-[#526459]">
          {label}
        </p>

        <div className="text-right">

          <span className="text-sm font-bold text-[#173b2b]">
            {value}
          </span>

          <span className="ml-2 text-xs text-[#8a978f]">
            {percentage}%
          </span>

        </div>

      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#edf1ea]">

        <div
          style={{
            width: `${percentage}%`,
          }}
          className="h-full rounded-full bg-[#8dbb70]"
        />

      </div>

    </div>
  );
}


// ============================================================
// QUICK ACTION
// ============================================================

function QuickAction({
  icon,
  title,
  description,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-3 rounded-xl border border-[#e0e7dc] bg-[#fbfcfa] p-4 text-left transition hover:border-[#b9d4a7] hover:bg-[#f4f8f1]"
    >

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf5e8] text-[#57923d]">
        {icon}
      </div>

      <div className="min-w-0 flex-1">

        <p className="text-sm font-semibold text-[#173b2b]">
          {title}
        </p>

        <p className="mt-0.5 text-xs text-[#7b8980]">
          {description}
        </p>

      </div>

      <ArrowUpRight
        size={15}
        className="text-[#8a978f] transition group-hover:text-[#57923d]"
      />

    </button>
  );
}


// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({ status }) {
  const active = status === "Active";

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        active
          ? "bg-[#edf6e7] text-[#57923d]"
          : "bg-[#fff6df] text-[#a67517]"
      }`}
    >
      {status}
    </span>
  );
}


// ============================================================
// INSIGHT
// ============================================================

function Insight({ text }) {
  return (
    <div className="rounded-xl border border-[#dce8d5] bg-white/70 px-4 py-3">

      <div className="flex gap-2">

        <ArrowUpRight
          size={15}
          className="mt-0.5 shrink-0 text-[#57923d]"
        />

        <p className="text-xs leading-5 text-[#526459]">
          {text}
        </p>

      </div>

    </div>
  );
}


// ============================================================
// OVERVIEW CARD
// ============================================================

function OverviewCard({
  icon,
  title,
  value,
  description,
  button,
  onClick,
}) {
  return (
    <section className="rounded-2xl border border-[#dfe6da] bg-white p-5">

      <div className="flex items-start justify-between">

        <div className="flex gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf5e8] text-[#57923d]">
            {icon}
          </div>

          <div>
            <h3 className="font-bold text-[#173b2b]">
              {title}
            </h3>

            <p className="mt-1 text-xs text-[#7b8980]">
              {description}
            </p>
          </div>

        </div>

        <p className="text-2xl font-bold text-[#57923d]">
          {value}
        </p>

      </div>

      <button
        onClick={onClick}
        className="mt-5 w-full rounded-xl border border-[#dfe6da] py-2.5 text-sm font-semibold text-[#426636] transition hover:bg-[#f5f8f2]"
      >
        {button}
      </button>

    </section>
  );
}