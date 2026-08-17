import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Save,
  Shield,
  ShieldCheck,
  UserPlus,
} from "lucide-react";

import AdminSidebar from "../components/AdminSidebar.jsx";
import AdminTopbar from "../components/AdminTopbar.jsx";

import {
  currentJoinedDate,
  generateFinanceAdminId,
  generateInternalAdminId,
  getAdministrators,
  saveAdministrators,
} from "../utils/adminStorage.js";


const initialPermissions = {
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


export default function AdminCreateAdministrator() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [createdAdmin, setCreatedAdmin] = useState(null);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    mobile: "",
    city: "",
    state: "",
    temporaryPassword: "",
    status: "Active",
  });

  const [permissions, setPermissions] =
    useState(initialPermissions);


  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        name === "mobile"
          ? value.replace(/\D/g, "").slice(0, 10)
          : value,
    }));

    setError("");
    setCreatedAdmin(null);
  }


  function togglePermission(name) {
    setPermissions((current) => ({
      ...current,
      [name]: !current[name],
    }));

    setCreatedAdmin(null);
  }


  function enableAll() {
    setPermissions(
      Object.fromEntries(
        Object.keys(initialPermissions).map((key) => [
          key,
          true,
        ])
      )
    );

    setCreatedAdmin(null);
  }


  function resetPermissions() {
    setPermissions({
      ...initialPermissions,
    });

    setCreatedAdmin(null);
  }


  function handleSubmit(event) {
    event.preventDefault();

    setError("");

    const fullName = form.fullName.trim();
    const email = form.email.trim().toLowerCase();
    const mobile = form.mobile.trim();
    const city = form.city.trim();
    const state = form.state.trim();


    // ========================================================
    // VALIDATION
    // ========================================================

    if (
      !fullName ||
      !email ||
      !mobile ||
      !city ||
      !state ||
      !form.temporaryPassword
    ) {
      setError("Please complete all required fields.");
      return;
    }


    if (!/^\d{10}$/.test(mobile)) {
      setError("Mobile number must contain exactly 10 digits.");
      return;
    }


    if (form.temporaryPassword.length < 8) {
      setError(
        "Temporary password must contain at least 8 characters."
      );
      return;
    }


    // ========================================================
    // LOAD EXISTING ADMINS
    // ========================================================

    const administrators = getAdministrators();


    // ========================================================
    // DUPLICATE EMAIL
    // ========================================================

    const emailExists = administrators.some(
      (admin) =>
        String(admin.email).toLowerCase() === email
    );

    if (emailExists) {
      setError(
        "An administrator with this email already exists."
      );
      return;
    }


    // ========================================================
    // DUPLICATE MOBILE
    // ========================================================

    const mobileExists = administrators.some(
      (admin) => admin.mobile === mobile
    );

    if (mobileExists) {
      setError(
        "An administrator with this mobile number already exists."
      );
      return;
    }


    // ========================================================
    // AUTO GENERATE IDS
    // ========================================================

    const id =
      generateInternalAdminId(administrators);

    const adminId =
      generateFinanceAdminId(administrators);


    // ========================================================
    // CREATE SUB ADMIN
    // ========================================================

    const administrator = {
      id,
      adminId,

      name: fullName,
      email,
      mobile,
      city,
      state,

      role: "Sub Admin",

      status: form.status,

      joined: currentJoinedDate(),

      lastLogin: "Never",

      permissions: {
        ...permissions,
      },

      // TEMP FRONTEND ONLY.
      // Do not store plaintext passwords when backend is built.
      temporaryPassword: form.temporaryPassword,

      mustChangePassword: true,
    };


    // ========================================================
    // SAVE
    // ========================================================

    saveAdministrators([
      ...administrators,
      administrator,
    ]);

    setCreatedAdmin(administrator);


    // ========================================================
    // REDIRECT AFTER SUCCESS
    // ========================================================

    setTimeout(() => {
      navigate("/admin/administrators", {
        state: {
          created: true,
          adminId,
          name: fullName,
        },
      });
    }, 1000);
  }


  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f8f3]">

      <AdminSidebar />

      <div className="flex min-w-0 flex-1 flex-col">

        <AdminTopbar />

        <main className="flex-1 overflow-y-auto p-6">

          <div className="mx-auto max-w-[1150px]">


            <button
              type="button"
              onClick={() =>
                navigate("/admin/administrators")
              }
              className="mb-5 flex items-center gap-2 text-sm font-semibold text-[#617268] hover:text-[#57923d]"
            >
              <ArrowLeft size={16} />
              Back to Administrators
            </button>


            <div className="flex items-start gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf5e8] text-[#57923d]">
                <UserPlus size={21} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#639a48]">
                  Super Admin
                </p>

                <h1 className="mt-1 text-2xl font-bold text-[#173b2b]">
                  Create Sub Admin
                </h1>

                <p className="mt-1 text-sm text-[#718177]">
                  Create an administrator account and define
                  exactly what it can manage.
                </p>
              </div>

            </div>


            {/* ERROR */}

            {error && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
                {error}
              </div>
            )}


            {/* SUCCESS */}

            {createdAdmin && (
              <div className="mt-5 flex gap-3 rounded-xl border border-[#d6e6cc] bg-[#edf6e7] p-4">

                <ShieldCheck
                  size={19}
                  className="mt-0.5 shrink-0 text-[#57923d]"
                />

                <div>
                  <p className="text-sm font-semibold text-[#173b2b]">
                    Sub Admin created successfully
                  </p>

                  <p className="mt-1 text-xs text-[#617268]">
                    Admin ID:{" "}
                    <span className="font-mono font-bold text-[#43822e]">
                      {createdAdmin.adminId}
                    </span>
                  </p>

                  <p className="mt-1 text-xs text-[#617268]">
                    {createdAdmin.name} will now appear in
                    Administrator Management.
                  </p>
                </div>

              </div>
            )}


            <form
              onSubmit={handleSubmit}
              className="mt-6"
            >

              <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">


                {/* LEFT */}

                <div className="space-y-5">

                  <section className="rounded-2xl border border-[#dfe6da] bg-white p-5">

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf5e8] text-[#57923d]">
                        <Shield size={18} />
                      </div>

                      <div>
                        <h2 className="font-bold text-[#173b2b]">
                          Administrator Account
                        </h2>

                        <p className="mt-1 text-xs text-[#718177]">
                          FinanceOS administrative account information.
                        </p>
                      </div>

                    </div>


                    <div className="mt-5 grid gap-4 sm:grid-cols-2">

                      <ReadOnlyField
                        label="Role"
                        value="Sub Admin"
                      />

                      <ReadOnlyField
                        label="Admin ID"
                        value={
                          createdAdmin
                            ? createdAdmin.adminId
                            : "Generated after creation"
                        }
                      />

                    </div>


                    <p className="mt-4 text-xs leading-5 text-[#7b8980]">
                      A Sub Admin cannot promote itself to Super
                      Admin or create additional administrator
                      accounts.
                    </p>

                  </section>


                  <FormSection
                    title="Personal Information"
                    description="Basic information about the administrator."
                  >

                    <div className="grid gap-4 sm:grid-cols-2">

                      <Input
                        label="Full Name"
                        name="fullName"
                        value={form.fullName}
                        onChange={handleChange}
                        placeholder="Enter full name"
                        required
                      />

                      <Input
                        label="Mobile Number"
                        name="mobile"
                        value={form.mobile}
                        onChange={handleChange}
                        placeholder="10 digit mobile number"
                        inputMode="numeric"
                        maxLength={10}
                        required
                      />

                      <Input
                        label="City"
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        placeholder="Enter city"
                        required
                      />

                      <Input
                        label="State"
                        name="state"
                        value={form.state}
                        onChange={handleChange}
                        placeholder="Enter state"
                        required
                      />

                    </div>

                  </FormSection>


                  <FormSection
                    title="Login Information"
                    description="Credentials used to access the Admin portal."
                  >

                    <div className="space-y-4">

                      <Input
                        label="Email Address"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="Enter admin email"
                        required
                      />


                      <div>

                        <label className="mb-2 block text-xs font-semibold text-[#526459]">
                          Temporary Password
                        </label>

                        <div className="relative">

                          <input
                            name="temporaryPassword"
                            type={
                              showPassword
                                ? "text"
                                : "password"
                            }
                            value={form.temporaryPassword}
                            onChange={handleChange}
                            placeholder="Minimum 8 characters"
                            required
                            className="w-full rounded-xl border border-[#dce4d8] bg-[#fbfcfa] px-4 py-3 pr-12 text-sm text-[#173b2b] outline-none placeholder:text-[#a0aaa3] focus:border-[#9fbd82] focus:ring-2 focus:ring-[#edf5e8]"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setShowPassword(
                                (current) => !current
                              )
                            }
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7c8981]"
                          >

                            {showPassword ? (
                              <EyeOff size={17} />
                            ) : (
                              <Eye size={17} />
                            )}

                          </button>

                        </div>

                        <p className="mt-2 text-xs text-[#8a978f]">
                          The administrator must change this
                          temporary password after first sign in.
                        </p>

                      </div>


                      <Select
                        label="Account Status"
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                      >
                        <option value="Active">
                          Active
                        </option>

                        <option value="Inactive">
                          Inactive
                        </option>
                      </Select>

                    </div>

                  </FormSection>

                </div>


                {/* RIGHT */}

                <div>

                  <section className="overflow-hidden rounded-2xl border border-[#dfe6da] bg-white">

                    <div className="border-b border-[#edf0eb] p-5">

                      <div className="flex items-start justify-between gap-4">

                        <div>
                          <h2 className="font-bold text-[#173b2b]">
                            Administrative Permissions
                          </h2>

                          <p className="mt-1 text-xs leading-5 text-[#718177]">
                            Define which administrative operations
                            this Sub Admin can perform.
                          </p>
                        </div>

                        <ShieldCheck
                          size={20}
                          className="shrink-0 text-[#57923d]"
                        />

                      </div>


                      <div className="mt-4 flex flex-wrap gap-2">

                        <button
                          type="button"
                          onClick={enableAll}
                          className="rounded-lg border border-[#d6e6cc] px-3 py-1.5 text-xs font-semibold text-[#57923d] hover:bg-[#edf6e7]"
                        >
                          Enable All
                        </button>

                        <button
                          type="button"
                          onClick={resetPermissions}
                          className="rounded-lg border border-[#dfe4dc] px-3 py-1.5 text-xs font-semibold text-[#718177] hover:bg-[#f5f7f4]"
                        >
                          Reset
                        </button>

                      </div>

                    </div>


                    <PermissionGroup title="User Management">

                      <Permission
                        title="View Users"
                        description="Search and view user accounts."
                        enabled={permissions.viewUsers}
                        onClick={() =>
                          togglePermission("viewUsers")
                        }
                      />

                      <Permission
                        title="Create Users"
                        description="Create new FinanceOS user accounts."
                        enabled={permissions.createUsers}
                        onClick={() =>
                          togglePermission("createUsers")
                        }
                      />

                      <Permission
                        title="Edit Users"
                        description="Modify user profile and account information."
                        enabled={permissions.editUsers}
                        onClick={() =>
                          togglePermission("editUsers")
                        }
                      />

                      <Permission
                        title="Change User Status"
                        description="Activate, deactivate or suspend user accounts."
                        enabled={permissions.changeUserStatus}
                        onClick={() =>
                          togglePermission("changeUserStatus")
                        }
                      />

                      <Permission
                        title="Manage User Access"
                        description="Change FinanceOS module access for users."
                        enabled={permissions.manageUserAccess}
                        onClick={() =>
                          togglePermission("manageUserAccess")
                        }
                      />

                      <Permission
                        title="View Financial Data"
                        description="Access authorized user financial information."
                        enabled={permissions.viewFinancialData}
                        onClick={() =>
                          togglePermission("viewFinancialData")
                        }
                        sensitive
                      />

                    </PermissionGroup>


                    <PermissionGroup title="Reports">

                      <Permission
                        title="Generate Reports"
                        description="Generate administrative and user reports."
                        enabled={permissions.generateReports}
                        onClick={() =>
                          togglePermission("generateReports")
                        }
                      />

                      <Permission
                        title="Export Reports"
                        description="Download authorized reports."
                        enabled={permissions.exportReports}
                        onClick={() =>
                          togglePermission("exportReports")
                        }
                      />

                    </PermissionGroup>


                    <PermissionGroup title="Communication & Reminders">

                      <Permission
                        title="Send Messages"
                        description="Create and send messages to users."
                        enabled={permissions.sendMessages}
                        onClick={() =>
                          togglePermission("sendMessages")
                        }
                      />

                      <Permission
                        title="View Reminders"
                        description="View authorized reminder schedules and delivery status."
                        enabled={permissions.viewReminders}
                        onClick={() =>
                          togglePermission("viewReminders")
                        }
                      />

                    </PermissionGroup>


                    <PermissionGroup title="Audit & Activity">

                      <Permission
                        title="View Activity"
                        description="View permitted account and administrative activity."
                        enabled={permissions.viewActivity}
                        onClick={() =>
                          togglePermission("viewActivity")
                        }
                      />

                    </PermissionGroup>

                  </section>

                </div>

              </div>


              <div className="mt-5 flex gap-3 rounded-2xl border border-[#dce6d6] bg-[#f0f7eb] p-5">

                <ShieldCheck
                  size={19}
                  className="mt-0.5 shrink-0 text-[#57923d]"
                />

                <div>
                  <p className="text-sm font-bold text-[#173b2b]">
                    Super Admin restrictions
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#617268]">
                    Sub Admins cannot create administrators,
                    edit the Super Admin, change their own role,
                    or grant themselves additional permissions.
                  </p>
                </div>

              </div>


              <div className="mt-5 flex flex-col-reverse gap-3 rounded-2xl border border-[#dfe6da] bg-white p-4 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={() =>
                    navigate("/admin/administrators")
                  }
                  className="rounded-xl border border-[#dce4d8] px-5 py-2.5 text-sm font-semibold text-[#617268] hover:bg-[#f5f8f2]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#dff3ad] px-5 py-2.5 text-sm font-bold text-[#173b2b] hover:bg-[#d5eba2]"
                >
                  <Save size={16} />
                  Create Sub Admin
                </button>

              </div>

            </form>

          </div>

        </main>

      </div>

    </div>
  );
}


// ============================================================
// KEEP THESE HELPERS IN THE SAME FILE
// ============================================================

function FormSection({ title, description, children }) {
  return (
    <section className="rounded-2xl border border-[#dfe6da] bg-white p-5">

      <h2 className="font-bold text-[#173b2b]">
        {title}
      </h2>

      <p className="mt-1 text-xs text-[#718177]">
        {description}
      </p>

      <div className="mt-5">
        {children}
      </div>

    </section>
  );
}


function Input({ label, ...props }) {
  return (
    <div>

      <label className="mb-2 block text-xs font-semibold text-[#526459]">
        {label}
      </label>

      <input
        {...props}
        className="w-full rounded-xl border border-[#dce4d8] bg-[#fbfcfa] px-4 py-3 text-sm text-[#173b2b] outline-none placeholder:text-[#a0aaa3] focus:border-[#9fbd82] focus:ring-2 focus:ring-[#edf5e8]"
      />

    </div>
  );
}


function Select({ label, children, ...props }) {
  return (
    <div>

      <label className="mb-2 block text-xs font-semibold text-[#526459]">
        {label}
      </label>

      <select
        {...props}
        className="w-full rounded-xl border border-[#dce4d8] bg-[#fbfcfa] px-4 py-3 text-sm text-[#173b2b] outline-none focus:border-[#9fbd82] focus:ring-2 focus:ring-[#edf5e8]"
      >
        {children}
      </select>

    </div>
  );
}


function ReadOnlyField({ label, value }) {
  return (
    <div>

      <p className="mb-2 text-xs font-semibold text-[#526459]">
        {label}
      </p>

      <div className="rounded-xl border border-[#dfe6da] bg-[#f4f7f2] px-4 py-3 text-sm font-semibold text-[#617268]">
        {value}
      </div>

    </div>
  );
}


function PermissionGroup({ title, children }) {
  return (
    <div className="border-b border-[#edf0eb] last:border-b-0">

      <div className="bg-[#fafcf9] px-5 py-3">

        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#718177]">
          {title}
        </p>

      </div>

      <div className="divide-y divide-[#edf0eb]">
        {children}
      </div>

    </div>
  );
}


function Permission({
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

        <p className="mt-1 text-xs leading-5 text-[#718177]">
          {description}
        </p>

      </div>


      <button
        type="button"
        onClick={onClick}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
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
  );
}