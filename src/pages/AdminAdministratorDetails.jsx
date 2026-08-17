import { useNavigate, useParams } from "react-router-dom";

import {
  Activity,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  KeyRound,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Shield,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import AdminSidebar from "../components/AdminSidebar.jsx";
import AdminTopbar from "../components/AdminTopbar.jsx";

import {
  getAdministrators,
} from "../utils/adminStorage.js";


// ============================================================
// PERMISSION LABELS
// ============================================================

const permissionLabels = {
  viewUsers: "View Users",
  createUsers: "Create Users",
  editUsers: "Edit Users",
  changeUserStatus: "Change User Status",
  manageUserAccess: "Manage User Access",
  viewFinancialData: "View Financial Data",

  generateReports: "Generate Reports",
  exportReports: "Export Reports",

  sendMessages: "Send Messages",
  viewReminders: "View Reminders",

  viewActivity: "View Activity",
};


// ============================================================
// TEMP ACTIVITY
// ============================================================

const activity = [
  {
    id: 1,
    action: "Signed in to FinanceOS Admin Portal",
    date: "29 Jul 2026",
    time: "09:20 AM",
  },
  {
    id: 2,
    action: "Viewed user account",
    date: "28 Jul 2026",
    time: "06:38 PM",
  },
  {
    id: 3,
    action: "Generated report",
    date: "28 Jul 2026",
    time: "05:12 PM",
  },
];


// ============================================================
// PAGE
// ============================================================

export default function AdminAdministratorDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const administrators = getAdministrators();

  const administrator = administrators.find(
    (admin) =>
      String(admin.id) === String(id)
  );


  // ==========================================================
  // ADMIN NOT FOUND
  // ==========================================================

  if (!administrator) {
    return (
      <div className="flex h-screen overflow-hidden bg-[#f6f8f3]">

        <AdminSidebar />

        <div className="flex min-w-0 flex-1 flex-col">

          <AdminTopbar />

          <main className="flex flex-1 items-center justify-center p-6">

            <div className="max-w-md rounded-2xl border border-[#dfe6da] bg-white p-8 text-center">

              <UserRound
                size={35}
                className="mx-auto text-[#8a978f]"
              />

              <h1 className="mt-4 text-xl font-bold text-[#173b2b]">
                Administrator not found
              </h1>

              <p className="mt-2 text-sm text-[#718177]">
                This administrator record does not exist.
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate("/admin/administrators")
                }
                className="mt-5 rounded-xl bg-[#dff3ad] px-5 py-2.5 text-sm font-bold text-[#173b2b]"
              >
                Back to Administrators
              </button>

            </div>

          </main>

        </div>

      </div>
    );
  }


  const isSuperAdmin =
    administrator.role === "Super Admin";


  // ==========================================================
  // ENABLED PERMISSIONS
  // Supports object permissions used by adminStorage.js
  // ==========================================================

  const enabledPermissions =
    administrator.permissions &&
    !Array.isArray(administrator.permissions)
      ? Object.entries(administrator.permissions)
          .filter(([, enabled]) => enabled)
          .map(
            ([key]) =>
              permissionLabels[key] || key
          )
      : Array.isArray(administrator.permissions)
      ? administrator.permissions
      : [];


  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f8f3]">

      <AdminSidebar />

      <div className="flex min-w-0 flex-1 flex-col">

        <AdminTopbar />

        <main className="flex-1 overflow-y-auto p-6">

          <div className="mx-auto max-w-[1200px]">


            {/* BACK */}

            <button
              type="button"
              onClick={() =>
                navigate("/admin/administrators")
              }
              className="mb-5 flex items-center gap-2 text-sm font-semibold text-[#617268] transition hover:text-[#57923d]"
            >
              <ArrowLeft size={16} />
              Back to Administrators
            </button>


            {/* HEADER */}

            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

              <div className="flex items-start gap-4">

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf4df] text-lg font-bold text-[#43822e]">
                  {administrator.name
                    ?.charAt(0)
                    .toUpperCase()}
                </div>


                <div>

                  <div className="flex flex-wrap items-center gap-2">

                    <h1 className="text-2xl font-bold text-[#173b2b]">
                      {administrator.name}
                    </h1>

                    {isSuperAdmin && (
                      <ShieldCheck
                        size={19}
                        className="text-[#57923d]"
                      />
                    )}

                  </div>


                  <div className="mt-2 flex flex-wrap gap-2">

                    <RoleBadge
                      role={administrator.role}
                    />

                    <StatusBadge
                      status={administrator.status}
                    />

                  </div>


                  <p className="mt-3 font-mono text-xs font-semibold text-[#639a48]">
                    {administrator.adminId}
                  </p>

                </div>

              </div>


              {!isSuperAdmin && (
                <div className="flex flex-wrap gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/admin/administrators/${id}/access`
                      )
                    }
                    className="flex items-center gap-2 rounded-xl border border-[#dce7d5] bg-white px-4 py-2.5 text-sm font-semibold text-[#43822e] transition hover:bg-[#edf5e8]"
                  >
                    <KeyRound size={16} />
                    Manage Permissions
                  </button>


                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/admin/administrators/${id}/edit`
                      )
                    }
                    className="flex items-center gap-2 rounded-xl bg-[#dff3ad] px-4 py-2.5 text-sm font-bold text-[#173b2b] transition hover:bg-[#d5eba2]"
                  >
                    <Pencil size={16} />
                    Edit Admin
                  </button>

                </div>
              )}

            </div>


            {/* SUMMARY */}

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <SummaryCard
                icon={<Shield size={18} />}
                label="Role"
                value={administrator.role}
              />

              <SummaryCard
                icon={<CheckCircle2 size={18} />}
                label="Status"
                value={administrator.status}
              />

              <SummaryCard
                icon={<CalendarDays size={18} />}
                label="Joined"
                value={administrator.joined || "—"}
              />

              <SummaryCard
                icon={<Clock3 size={18} />}
                label="Last Login"
                value={administrator.lastLogin || "Never"}
              />

            </div>


            {/* INFORMATION + PERMISSIONS */}

            <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1fr]">


              {/* INFORMATION */}

              <section className="rounded-2xl border border-[#dfe6da] bg-white p-5">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf5e8] text-[#57923d]">
                    <UserRound size={18} />
                  </div>

                  <div>

                    <h2 className="font-bold text-[#173b2b]">
                      Administrator Information
                    </h2>

                    <p className="mt-1 text-xs text-[#718177]">
                      Account and contact information.
                    </p>

                  </div>

                </div>


                <div className="mt-6 space-y-5">

                  <InformationRow
                    icon={<UserRound size={16} />}
                    label="Full Name"
                    value={administrator.name}
                  />

                  <InformationRow
                    icon={<Mail size={16} />}
                    label="Email Address"
                    value={administrator.email}
                  />

                  <InformationRow
                    icon={<Phone size={16} />}
                    label="Mobile Number"
                    value={
                      administrator.mobile
                        ? `+91 ${administrator.mobile}`
                        : "—"
                    }
                  />

                  <InformationRow
                    icon={<MapPin size={16} />}
                    label="Location"
                    value={
                      administrator.city &&
                      administrator.state
                        ? `${administrator.city}, ${administrator.state}`
                        : administrator.city ||
                          administrator.state ||
                          "—"
                    }
                  />

                  <InformationRow
                    icon={<Shield size={16} />}
                    label="Created By"
                    value={
                      administrator.createdBy ||
                      (isSuperAdmin
                        ? "System"
                        : "Super Admin")
                    }
                  />

                </div>

              </section>


              {/* PERMISSIONS */}

              <section className="rounded-2xl border border-[#dfe6da] bg-white p-5">

                <div className="flex items-start justify-between gap-4">

                  <div>

                    <h2 className="font-bold text-[#173b2b]">
                      Administrative Permissions
                    </h2>

                    <p className="mt-1 text-xs text-[#718177]">
                      Current access assigned to this administrator.
                    </p>

                  </div>

                  <ShieldCheck
                    size={20}
                    className="text-[#57923d]"
                  />

                </div>


                {isSuperAdmin ? (

                  <div className="mt-5 rounded-xl border border-[#d6e6cc] bg-[#edf6e7] p-4">

                    <div className="flex gap-3">

                      <ShieldCheck
                        size={20}
                        className="mt-0.5 shrink-0 text-[#57923d]"
                      />

                      <div>

                        <p className="text-sm font-bold text-[#173b2b]">
                          Full System Access
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#617268]">
                          The Super Admin has unrestricted
                          FinanceOS administrative access.
                        </p>

                      </div>

                    </div>

                  </div>

                ) : enabledPermissions.length > 0 ? (

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">

                    {enabledPermissions.map(
                      (permission) => (

                        <div
                          key={permission}
                          className="flex items-center gap-2 rounded-xl border border-[#e2e8de] bg-[#fafcf9] px-3 py-3"
                        >

                          <CheckCircle2
                            size={15}
                            className="shrink-0 text-[#57923d]"
                          />

                          <span className="text-xs font-semibold text-[#526459]">
                            {permission}
                          </span>

                        </div>

                      )
                    )}

                  </div>

                ) : (

                  <div className="mt-5 rounded-xl border border-[#e2e8de] bg-[#fafcf9] p-4">

                    <p className="text-sm font-semibold text-[#526459]">
                      No permissions enabled
                    </p>

                    <p className="mt-1 text-xs text-[#718177]">
                      Use Manage Permissions to assign access.
                    </p>

                  </div>

                )}


                {!isSuperAdmin && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/admin/administrators/${id}/access`
                      )
                    }
                    className="mt-5 w-full rounded-xl border border-[#d6e6cc] px-4 py-2.5 text-sm font-semibold text-[#43822e] transition hover:bg-[#edf6e7]"
                  >
                    Manage Permissions
                  </button>
                )}

              </section>

            </div>


            {/* ACTIVITY */}

            <section className="mt-5 overflow-hidden rounded-2xl border border-[#dfe6da] bg-white">

              <div className="flex items-center justify-between border-b border-[#edf0eb] p-5">

                <div>

                  <h2 className="font-bold text-[#173b2b]">
                    Recent Activity
                  </h2>

                  <p className="mt-1 text-xs text-[#718177]">
                    Recent actions performed by this administrator.
                  </p>

                </div>

                <Activity
                  size={20}
                  className="text-[#57923d]"
                />

              </div>


              <div className="divide-y divide-[#edf0eb]">

                {activity.map((item) => (

                  <div
                    key={item.id}
                    className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >

                    <div className="flex items-center gap-3">

                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#edf5e8] text-[#57923d]">
                        <Activity size={14} />
                      </div>

                      <p className="text-sm font-medium text-[#526459]">
                        {item.action}
                      </p>

                    </div>


                    <div className="pl-11 text-xs text-[#829087] sm:pl-0 sm:text-right">

                      <p>{item.date}</p>

                      <p className="mt-0.5">
                        {item.time}
                      </p>

                    </div>

                  </div>

                ))}

              </div>

            </section>


            {/* SECURITY */}

            <section className="mt-5 rounded-2xl border border-[#dce6d6] bg-[#f0f7eb] p-5">

              <div className="flex gap-3">

                <ShieldCheck
                  size={20}
                  className="mt-0.5 shrink-0 text-[#57923d]"
                />

                <div>

                  <h3 className="text-sm font-bold text-[#173b2b]">
                    Administrator security
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-[#617268]">
                    Backend authorization will eventually
                    validate these permissions for every
                    protected operation.
                  </p>

                </div>

              </div>

            </section>

          </div>

        </main>

      </div>

    </div>
  );
}


// ============================================================
// HELPERS
// ============================================================

function SummaryCard({
  icon,
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-[#dfe6da] bg-white p-4">

      <div className="flex items-start gap-3">

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf5e8] text-[#57923d]">
          {icon}
        </div>

        <div className="min-w-0">

          <p className="text-xs text-[#718177]">
            {label}
          </p>

          <p className="mt-1 truncate text-sm font-bold text-[#173b2b]">
            {value}
          </p>

        </div>

      </div>

    </div>
  );
}


function InformationRow({
  icon,
  label,
  value,
}) {
  return (
    <div className="flex items-start gap-3">

      <div className="mt-0.5 text-[#639a48]">
        {icon}
      </div>

      <div>

        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8a978f]">
          {label}
        </p>

        <p className="mt-1 text-sm font-semibold text-[#526459]">
          {value}
        </p>

      </div>

    </div>
  );
}


function RoleBadge({ role }) {
  return (
    <span className="rounded-full bg-[#eaf4df] px-3 py-1 text-[11px] font-semibold text-[#43822e]">
      {role}
    </span>
  );
}


function StatusBadge({ status }) {
  let style =
    "bg-[#edf6e7] text-[#57923d]";

  if (status === "Inactive") {
    style =
      "bg-[#f1f2f0] text-[#718177]";
  }

  if (status === "Suspended") {
    style =
      "bg-[#fff0ed] text-[#b45745]";
  }

  return (
    <span
      className={`rounded-full px-3 py-1 text-[11px] font-semibold ${style}`}
    >
      {status}
    </span>
  );
}