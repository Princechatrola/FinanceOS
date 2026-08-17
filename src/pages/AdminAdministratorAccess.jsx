import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  Check,
  KeyRound,
  RotateCcw,
  Save,
  ShieldCheck,
  UserCog,
} from "lucide-react";

import AdminSidebar from "../components/AdminSidebar.jsx";
import AdminTopbar from "../components/AdminTopbar.jsx";

import {
  getAdministrators,
  saveAdministrators,
} from "../utils/adminStorage.js";


// ============================================================
// DEFAULT PERMISSIONS
// ============================================================

const defaultPermissions = {
  viewUsers: true,
  createUsers: false,
  editUsers: false,
  changeUserStatus: false,
  manageUserAccess: false,
  viewFinancialData: false,

  generateReports: false,
  exportReports: false,

  sendMessages: false,
  viewReminders: false,

  viewActivity: false,
};


// ============================================================
// NORMALIZE PERMISSIONS
// ============================================================

function getPermissionState(administrator) {

  // Administrator doesn't exist
  if (!administrator) {
    return {
      ...defaultPermissions,
    };
  }

  // New object-based permissions
  if (
    administrator.permissions &&
    !Array.isArray(administrator.permissions)
  ) {
    return {
      ...defaultPermissions,
      ...administrator.permissions,
    };
  }

  // Support old array-based permissions
  if (Array.isArray(administrator.permissions)) {

    const permissions = {
      ...defaultPermissions,
    };

    const labelToKey = {
      "View Users": "viewUsers",
      "Create Users": "createUsers",
      "Edit Users": "editUsers",
      "Change User Status": "changeUserStatus",
      "Manage User Access": "manageUserAccess",
      "View Financial Data": "viewFinancialData",

      "Generate Reports": "generateReports",
      "Export Reports": "exportReports",

      "Send Messages": "sendMessages",
      "View Reminders": "viewReminders",

      "View Activity": "viewActivity",
    };

    administrator.permissions.forEach((label) => {

      const key = labelToKey[label];

      if (key) {
        permissions[key] = true;
      }

    });

    return permissions;
  }

  return {
    ...defaultPermissions,
  };
}


// ============================================================
// PAGE
// ============================================================

export default function AdminAdministratorAccess() {

  const navigate = useNavigate();

  const { id } = useParams();


  // ==========================================================
  // FIND ADMINISTRATOR
  // ==========================================================

  const administrators = getAdministrators();

  const administrator = administrators.find(
    (admin) =>
      String(admin.id) === String(id)
  );


  // ==========================================================
  // HOOKS
  //
  // IMPORTANT:
  // Hooks must run BEFORE any conditional return.
  // ==========================================================

  const [permissions, setPermissions] = useState(() =>
    getPermissionState(administrator)
  );

  const [saved, setSaved] = useState(false);


  // ==========================================================
  // ADMINISTRATOR NOT FOUND
  // ==========================================================

  if (!administrator) {

    return (
      <div className="flex h-screen overflow-hidden bg-[#f6f8f3]">

        <AdminSidebar />

        <div className="flex min-w-0 flex-1 flex-col">

          <AdminTopbar />

          <main className="flex flex-1 items-center justify-center p-6">

            <div className="rounded-2xl border border-[#dfe6da] bg-white p-8 text-center">

              <UserCog
                size={36}
                className="mx-auto text-[#8a978f]"
              />

              <h1 className="mt-4 text-xl font-bold text-[#173b2b]">
                Administrator not found
              </h1>

              <p className="mt-2 text-sm text-[#718177]">
                The administrator account could not be found.
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


  // ==========================================================
  // SUPER ADMIN PROTECTION
  // ==========================================================

  if (administrator.role === "Super Admin") {

    return (
      <div className="flex h-screen overflow-hidden bg-[#f6f8f3]">

        <AdminSidebar />

        <div className="flex min-w-0 flex-1 flex-col">

          <AdminTopbar />

          <main className="flex flex-1 items-center justify-center p-6">

            <div className="max-w-md rounded-2xl border border-[#dfe6da] bg-white p-8 text-center">

              <ShieldCheck
                size={35}
                className="mx-auto text-[#57923d]"
              />

              <h1 className="mt-4 text-xl font-bold text-[#173b2b]">
                Super Admin Access
              </h1>

              <p className="mt-2 text-sm leading-6 text-[#718177]">
                Super Admin has full system access.
                Its permissions cannot be changed from this page.
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate(`/admin/administrators/${id}`)
                }
                className="mt-5 rounded-xl bg-[#dff3ad] px-5 py-2.5 text-sm font-bold text-[#173b2b]"
              >
                Back
              </button>

            </div>

          </main>

        </div>

      </div>
    );
  }


  // ==========================================================
  // TOGGLE PERMISSION
  // ==========================================================

  function togglePermission(name) {

    setPermissions((current) => ({
      ...current,
      [name]: !current[name],
    }));

    setSaved(false);
  }


  // ==========================================================
  // ENABLE ALL
  // ==========================================================

  function enableAll() {

    const allEnabled = Object.fromEntries(
      Object.keys(defaultPermissions).map((key) => [
        key,
        true,
      ])
    );

    setPermissions(allEnabled);

    setSaved(false);
  }


  // ==========================================================
  // MINIMUM ACCESS
  // ==========================================================

  function minimumAccess() {

    setPermissions({
      ...defaultPermissions,
      viewUsers: true,
    });

    setSaved(false);
  }


  // ==========================================================
  // RESET TO LAST SAVED PERMISSIONS
  // ==========================================================

  function resetPermissions() {

    const currentAdmin = getAdministrators().find(
      (admin) =>
        String(admin.id) === String(id)
    );

    if (!currentAdmin) {
      return;
    }

    setPermissions(
      getPermissionState(currentAdmin)
    );

    setSaved(false);
  }


  // ==========================================================
  // SAVE PERMISSIONS
  // ==========================================================

  function savePermissions() {

    const currentAdmins = getAdministrators();

    const updatedAdmins = currentAdmins.map((admin) => {

      if (String(admin.id) !== String(id)) {
        return admin;
      }

      // Super Admin can never be changed here
      if (admin.role === "Super Admin") {
        return admin;
      }

      return {
        ...admin,

        permissions: {
          ...permissions,
        },
      };

    });


    saveAdministrators(updatedAdmins);

    setSaved(true);
  }


  // ==========================================================
  // PERMISSION COUNTS
  // ==========================================================

  const enabledCount =
    Object.values(permissions).filter(Boolean).length;

  const totalCount =
    Object.keys(permissions).length;

  const disabledCount =
    totalCount - enabledCount;


  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f8f3]">

      <AdminSidebar />

      <div className="flex min-w-0 flex-1 flex-col">

        <AdminTopbar />

        <main className="flex-1 overflow-y-auto p-6">

          <div className="mx-auto max-w-[1100px]">


            {/* ==================================================
                BACK
            ================================================== */}

            <button
              type="button"
              onClick={() =>
                navigate(`/admin/administrators/${id}`)
              }
              className="mb-5 flex items-center gap-2 text-sm font-semibold text-[#617268] transition hover:text-[#57923d]"
            >
              <ArrowLeft size={16} />

              Back to Administrator
            </button>


            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

              <div className="flex items-start gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf5e8] text-[#57923d]">
                  <KeyRound size={21} />
                </div>

                <div>

                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#639a48]">
                    Super Admin
                  </p>

                  <h1 className="mt-1 text-2xl font-bold text-[#173b2b]">
                    Manage Administrator Permissions
                  </h1>

                  <p className="mt-1 text-sm text-[#718177]">
                    Control which administrative operations this
                    Sub Admin can perform.
                  </p>

                </div>

              </div>


              <div className="flex gap-2">

                <button
                  type="button"
                  onClick={resetPermissions}
                  className="flex items-center gap-2 rounded-xl border border-[#dce4d8] bg-white px-4 py-2.5 text-sm font-semibold text-[#617268] transition hover:bg-[#f5f8f2]"
                >
                  <RotateCcw size={15} />

                  Reset
                </button>


                <button
                  type="button"
                  onClick={savePermissions}
                  className="flex items-center gap-2 rounded-xl bg-[#dff3ad] px-4 py-2.5 text-sm font-bold text-[#173b2b] transition hover:bg-[#d5eba2]"
                >
                  <Save size={16} />

                  Save Permissions
                </button>

              </div>

            </div>


            {/* ==================================================
                SUCCESS MESSAGE
            ================================================== */}

            {saved && (

              <div className="mt-5 flex gap-3 rounded-xl border border-[#d6e6cc] bg-[#edf6e7] p-4">

                <ShieldCheck
                  size={19}
                  className="mt-0.5 shrink-0 text-[#57923d]"
                />

                <div>

                  <p className="text-sm font-semibold text-[#173b2b]">
                    Permissions updated
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#617268]">
                    The permission configuration has been saved
                    successfully.
                  </p>

                </div>

              </div>

            )}


            {/* ==================================================
                ADMIN INFORMATION
            ================================================== */}

            <section className="mt-6 rounded-2xl border border-[#dfe6da] bg-white p-5">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-center gap-3">

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#edf5e8] text-[#57923d]">

                    <UserCog size={21} />

                  </div>


                  <div>

                    <div className="flex flex-wrap items-center gap-2">

                      <h2 className="font-bold text-[#173b2b]">
                        {administrator.name}
                      </h2>

                      <span className="rounded-full bg-[#f1f3ef] px-2.5 py-1 text-[10px] font-semibold text-[#617268]">
                        {administrator.role}
                      </span>

                      <span className="rounded-full bg-[#edf6e7] px-2.5 py-1 text-[10px] font-semibold text-[#57923d]">
                        {administrator.status}
                      </span>

                    </div>

                    <p className="mt-1 text-xs text-[#718177]">
                      {administrator.email}
                    </p>

                  </div>

                </div>


                <div className="sm:text-right">

                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a978f]">
                    Admin ID
                  </p>

                  <p className="mt-1 font-mono text-sm font-bold text-[#57923d]">
                    {administrator.adminId}
                  </p>

                </div>

              </div>

            </section>


            {/* ==================================================
                SUMMARY
            ================================================== */}

            <div className="mt-5 grid gap-4 sm:grid-cols-3">

              <SummaryCard
                title="Enabled"
                value={enabledCount}
              />

              <SummaryCard
                title="Disabled"
                value={disabledCount}
              />

              <SummaryCard
                title="Total Permissions"
                value={totalCount}
              />

            </div>


            {/* ==================================================
                QUICK SETUP
            ================================================== */}

            <section className="mt-5 rounded-2xl border border-[#dfe6da] bg-white p-5">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <h2 className="font-bold text-[#173b2b]">
                    Quick Permission Setup
                  </h2>

                  <p className="mt-1 text-xs text-[#718177]">
                    Apply a starting configuration and customize
                    it below.
                  </p>

                </div>


                <div className="flex flex-wrap gap-2">

                  <button
                    type="button"
                    onClick={minimumAccess}
                    className="rounded-lg border border-[#dfe4dc] px-3 py-2 text-xs font-semibold text-[#617268] transition hover:bg-[#f5f7f4]"
                  >
                    Minimum Access
                  </button>

                  <button
                    type="button"
                    onClick={enableAll}
                    className="rounded-lg border border-[#d6e6cc] px-3 py-2 text-xs font-semibold text-[#57923d] transition hover:bg-[#edf6e7]"
                  >
                    Enable All
                  </button>

                </div>

              </div>

            </section>


            {/* ==================================================
                USER MANAGEMENT
            ================================================== */}

            <PermissionSection
              title="User Management"
              description="Control what this administrator can do with FinanceOS user accounts."
            >

              <PermissionRow
                title="View Users"
                description="Search users and view basic user account information."
                enabled={permissions.viewUsers}
                onClick={() =>
                  togglePermission("viewUsers")
                }
              />

              <PermissionRow
                title="Create Users"
                description="Create new FinanceOS user accounts."
                enabled={permissions.createUsers}
                onClick={() =>
                  togglePermission("createUsers")
                }
              />

              <PermissionRow
                title="Edit Users"
                description="Update user account and profile information."
                enabled={permissions.editUsers}
                onClick={() =>
                  togglePermission("editUsers")
                }
              />

              <PermissionRow
                title="Change User Status"
                description="Activate, deactivate or suspend user accounts."
                enabled={permissions.changeUserStatus}
                onClick={() =>
                  togglePermission("changeUserStatus")
                }
              />

              <PermissionRow
                title="Manage User Access"
                description="Grant or revoke FinanceOS module access for users."
                enabled={permissions.manageUserAccess}
                onClick={() =>
                  togglePermission("manageUserAccess")
                }
              />

              <PermissionRow
                title="View Financial Data"
                description="View authorized financial information belonging to users."
                enabled={permissions.viewFinancialData}
                onClick={() =>
                  togglePermission("viewFinancialData")
                }
                sensitive
              />

            </PermissionSection>


            {/* ==================================================
                REPORTS
            ================================================== */}

            <PermissionSection
              title="Reports"
              description="Control report generation and export privileges."
            >

              <PermissionRow
                title="Generate Reports"
                description="Generate authorized administrative and user reports."
                enabled={permissions.generateReports}
                onClick={() =>
                  togglePermission("generateReports")
                }
              />

              <PermissionRow
                title="Export Reports"
                description="Download authorized reports."
                enabled={permissions.exportReports}
                onClick={() =>
                  togglePermission("exportReports")
                }
              />

            </PermissionSection>


            {/* ==================================================
                COMMUNICATION
            ================================================== */}

            <PermissionSection
              title="Communication & Reminders"
              description="Control communication and reminder access."
            >

              <PermissionRow
                title="Send Messages"
                description="Create and send permitted messages to FinanceOS users."
                enabled={permissions.sendMessages}
                onClick={() =>
                  togglePermission("sendMessages")
                }
              />

              <PermissionRow
                title="View Reminders"
                description="View authorized reminder schedules and delivery status."
                enabled={permissions.viewReminders}
                onClick={() =>
                  togglePermission("viewReminders")
                }
              />

            </PermissionSection>


            {/* ==================================================
                ACTIVITY
            ================================================== */}

            <PermissionSection
              title="Audit & Activity"
              description="Control access to system activity information."
            >

              <PermissionRow
                title="View Activity"
                description="View permitted user and administrator activity records."
                enabled={permissions.viewActivity}
                onClick={() =>
                  togglePermission("viewActivity")
                }
              />

            </PermissionSection>


            {/* ==================================================
                RESTRICTED
            ================================================== */}

            <section className="mt-5 rounded-2xl border border-[#e7ddd3] bg-[#fffaf5] p-5">

              <div className="flex gap-3">

                <ShieldCheck
                  size={20}
                  className="mt-0.5 shrink-0 text-[#9a6a19]"
                />

                <div>

                  <h3 className="text-sm font-bold text-[#594526]">
                    Super Admin only
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-[#77684f]">
                    Administrator Management, Sub Admin creation,
                    permission assignment, Super Admin account
                    control and system-level security settings
                    cannot be assigned to a Sub Admin.
                  </p>

                </div>

              </div>

            </section>


            {/* ==================================================
                BOTTOM ACTIONS
            ================================================== */}

            <div className="mt-5 flex flex-col-reverse gap-3 rounded-2xl border border-[#dfe6da] bg-white p-4 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={() =>
                  navigate(`/admin/administrators/${id}`)
                }
                className="rounded-xl border border-[#dce4d8] px-5 py-2.5 text-sm font-semibold text-[#617268] transition hover:bg-[#f5f8f2]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={savePermissions}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#dff3ad] px-5 py-2.5 text-sm font-bold text-[#173b2b] transition hover:bg-[#d5eba2]"
              >
                <Save size={16} />

                Save Permissions
              </button>

            </div>

          </div>

        </main>

      </div>

    </div>
  );
}


// ============================================================
// PERMISSION SECTION
// ============================================================

function PermissionSection({
  title,
  description,
  children,
}) {
  return (
    <section className="mt-5 overflow-hidden rounded-2xl border border-[#dfe6da] bg-white">

      <div className="border-b border-[#edf0eb] p-5">

        <h2 className="font-bold text-[#173b2b]">
          {title}
        </h2>

        <p className="mt-1 text-xs text-[#718177]">
          {description}
        </p>

      </div>

      <div className="divide-y divide-[#edf0eb]">
        {children}
      </div>

    </section>
  );
}


// ============================================================
// PERMISSION ROW
// ============================================================

function PermissionRow({
  title,
  description,
  enabled,
  onClick,
  sensitive = false,
}) {
  return (
    <div className="flex items-center justify-between gap-5 px-5 py-4">

      <div>

        <div className="flex flex-wrap items-center gap-2">

          <p className="text-sm font-semibold text-[#173b2b]">
            {title}
          </p>

          {sensitive && (

            <span className="rounded-full bg-[#fff3df] px-2 py-0.5 text-[9px] font-bold uppercase text-[#9a6a19]">
              Sensitive
            </span>

          )}

        </div>

        <p className="mt-1 max-w-[750px] text-xs leading-5 text-[#718177]">
          {description}
        </p>

      </div>


      <div className="flex shrink-0 items-center gap-3">

        <span
          className={`hidden text-xs font-semibold sm:block ${
            enabled
              ? "text-[#57923d]"
              : "text-[#8a978f]"
          }`}
        >
          {enabled ? "Allowed" : "Denied"}
        </span>


        <button
          type="button"
          onClick={onClick}
          aria-pressed={enabled}
          className={`relative h-6 w-11 rounded-full transition ${
            enabled
              ? "bg-[#8dbb70]"
              : "bg-[#dce2d9]"
          }`}
        >

          <span
            className={`absolute top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white transition-all ${
              enabled
                ? "left-6"
                : "left-1"
            }`}
          >

            {enabled && (

              <Check
                size={10}
                className="text-[#57923d]"
              />

            )}

          </span>

        </button>

      </div>

    </div>
  );
}


// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({
  title,
  value,
}) {
  return (
    <div className="rounded-2xl border border-[#dfe6da] bg-white p-4">

      <p className="text-xs text-[#718177]">
        {title}
      </p>

      <p className="mt-1 text-xl font-bold text-[#173b2b]">
        {value}
      </p>

    </div>
  );
}