import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Save,
  ShieldCheck,
  UserPlus,
} from "lucide-react";

import AdminSidebar from "../components/AdminSidebar.jsx";
import AdminTopbar from "../components/AdminTopbar.jsx";

const initialPermissions = {
  dashboard: true,
  monthlyFinance: true,
  savingGoals: true,
  financialPlans: true,
  financialCalendar: true,
  reports: true,
  aiAdvisor: true,
};

export default function AdminCreateUser() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "",
    mobile: "",
    city: "",
    state: "",
    email: "",
    temporaryPassword: "",
    status: "Active",
  });

  const [permissions, setPermissions] =
    useState(initialPermissions);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function togglePermission(permission) {
    setPermissions((current) => ({
      ...current,
      [permission]: !current[permission],
    }));
  }

  function enableAllPermissions() {
    setPermissions({
      dashboard: true,
      monthlyFinance: true,
      savingGoals: true,
      financialPlans: true,
      financialCalendar: true,
      reports: true,
      aiAdvisor: true,
    });
  }

  function disableAllPermissions() {
    setPermissions({
      dashboard: false,
      monthlyFinance: false,
      savingGoals: false,
      financialPlans: false,
      financialCalendar: false,
      reports: false,
      aiAdvisor: false,
    });
  }

  function handleSubmit(event) {
    event.preventDefault();

    const userData = {
      ...form,
      permissions,
    };

    // TEMPORARY
    // Later:
    // POST /api/admin/users

    console.log("Create User:", userData);

    alert(
      "User creation UI is working. Backend connection will be added later."
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f8f3]">
      <AdminSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar />

        <main className="flex-1 overflow-y-auto p-6">
          {/* HEADER */}

          <div className="mx-auto max-w-[1100px]">
            <button
              type="button"
              onClick={() => navigate("/admin/users")}
              className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#60756a] hover:text-[#43822e]"
            >
              <ArrowLeft size={16} />
              Back to Users
            </button>

            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eaf5df] text-[#57923d]">
                <UserPlus size={21} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#639a48]">
                  User Administration
                </p>

                <h1 className="mt-1 text-2xl font-bold text-[#173b2b]">
                  Create New User
                </h1>

                <p className="mt-1 text-sm text-[#718177]">
                  Create a FinanceOS account and configure its initial access.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6">
              <div className="grid gap-5 xl:grid-cols-[1.45fr_0.85fr]">
                {/* LEFT */}

                <div className="space-y-5">
                  {/* PERSONAL */}

                  <FormSection
                    title="Personal Information"
                    description="Basic information associated with the user."
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <Input
                        label="Full Name"
                        name="fullName"
                        value={form.fullName}
                        onChange={handleChange}
                        placeholder="Enter full name"
                        required
                      />

                      <Input
                        label="Date of Birth"
                        name="dateOfBirth"
                        type="date"
                        value={form.dateOfBirth}
                        onChange={handleChange}
                        required
                      />

                      <Select
                        label="Gender"
                        name="gender"
                        value={form.gender}
                        onChange={handleChange}
                        required
                      >
                        <option value="">
                          Select gender
                        </option>

                        <option value="Male">
                          Male
                        </option>

                        <option value="Female">
                          Female
                        </option>

                        <option value="Other">
                          Other
                        </option>
                      </Select>

                      <Input
                        label="Mobile Number"
                        name="mobile"
                        value={form.mobile}
                        onChange={handleChange}
                        placeholder="Enter mobile number"
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

                  {/* ACCOUNT */}

                  <FormSection
                    title="Account Information"
                    description="Credentials and initial account status."
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <Input
                        label="Email Address"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="Enter email address"
                        required
                      />

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

                        <option value="Pending">
                          Pending
                        </option>
                      </Select>

                      <div className="md:col-span-2">
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
                            placeholder="Create temporary password"
                            required
                            className="w-full rounded-xl border border-[#dce4d8] bg-[#fbfcfa] px-4 py-3 pr-12 text-sm text-[#173b2b] outline-none transition placeholder:text-[#a0aaa3] focus:border-[#9fbd82] focus:ring-2 focus:ring-[#edf5e8]"
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
                          The user will be required to change this password after first sign in.
                        </p>
                      </div>
                    </div>
                  </FormSection>
                </div>

                {/* RIGHT */}

                <div className="space-y-5">
                  {/* ID */}

                  <section className="rounded-2xl border border-[#dfe6da] bg-white p-5">
                    <div className="flex items-center gap-2">
                      <ShieldCheck
                        size={18}
                        className="text-[#57923d]"
                      />

                      <h2 className="font-bold text-[#173b2b]">
                        User Account
                      </h2>
                    </div>

                    <p className="mt-4 text-xs font-semibold uppercase tracking-[0.1em] text-[#8a978f]">
                      User ID
                    </p>

                    <div className="mt-2 rounded-xl border border-[#dfe6da] bg-[#f7faf5] px-4 py-3">
                      <p className="font-mono text-sm font-bold text-[#43822e]">
                        Generated automatically
                      </p>
                    </div>

                    <p className="mt-2 text-xs leading-5 text-[#7b8980]">
                      FinanceOS will create the internal User ID when the account is created.
                    </p>
                  </section>

                  {/* ACCESS */}

                  <section className="rounded-2xl border border-[#dfe6da] bg-white">
                    <div className="border-b border-[#edf0eb] p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h2 className="font-bold text-[#173b2b]">
                            Access Permissions
                          </h2>

                          <p className="mt-1 text-xs text-[#7b8980]">
                            Choose which FinanceOS modules the user can access.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={enableAllPermissions}
                          className="rounded-lg border border-[#dce7d5] px-3 py-1.5 text-xs font-semibold text-[#57923d] hover:bg-[#edf5e8]"
                        >
                          Enable All
                        </button>

                        <button
                          type="button"
                          onClick={disableAllPermissions}
                          className="rounded-lg border border-[#e1e5df] px-3 py-1.5 text-xs font-semibold text-[#718177] hover:bg-[#f5f7f4]"
                        >
                          Disable All
                        </button>
                      </div>
                    </div>

                    <div className="divide-y divide-[#edf0eb]">
                      <Permission
                        title="Dashboard"
                        description="Main financial overview"
                        enabled={permissions.dashboard}
                        onClick={() =>
                          togglePermission("dashboard")
                        }
                      />

                      <Permission
                        title="Monthly Finance"
                        description="Income, expenses and monthly savings"
                        enabled={permissions.monthlyFinance}
                        onClick={() =>
                          togglePermission(
                            "monthlyFinance"
                          )
                        }
                      />

                      <Permission
                        title="Saving Goals"
                        description="Create and monitor financial goals"
                        enabled={permissions.savingGoals}
                        onClick={() =>
                          togglePermission("savingGoals")
                        }
                      />

                      <Permission
                        title="Plans & Commitments"
                        description="Investments, insurance and liabilities"
                        enabled={
                          permissions.financialPlans
                        }
                        onClick={() =>
                          togglePermission(
                            "financialPlans"
                          )
                        }
                      />

                      <Permission
                        title="Financial Calendar"
                        description="Financial dates and reminders"
                        enabled={
                          permissions.financialCalendar
                        }
                        onClick={() =>
                          togglePermission(
                            "financialCalendar"
                          )
                        }
                      />

                      <Permission
                        title="Reports"
                        description="View and generate personal reports"
                        enabled={permissions.reports}
                        onClick={() =>
                          togglePermission("reports")
                        }
                      />

                      <Permission
                        title="AI Advisor"
                        description="FinanceOS AI-based guidance"
                        enabled={permissions.aiAdvisor}
                        onClick={() =>
                          togglePermission("aiAdvisor")
                        }
                      />
                    </div>
                  </section>
                </div>
              </div>

              {/* ACTIONS */}

              <div className="mt-5 flex items-center justify-end gap-3 rounded-2xl border border-[#dfe6da] bg-white p-4">
                <button
                  type="button"
                  onClick={() =>
                    navigate("/admin/users")
                  }
                  className="rounded-xl border border-[#dce4d8] px-5 py-2.5 text-sm font-semibold text-[#617268] transition hover:bg-[#f5f8f2]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-[#dff3ad] px-5 py-2.5 text-sm font-bold text-[#173b2b] transition hover:bg-[#d5eba2]"
                >
                  <Save size={16} />
                  Create User
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
// FORM SECTION
// ============================================================

function FormSection({
  title,
  description,
  children,
}) {
  return (
    <section className="rounded-2xl border border-[#dfe6da] bg-white p-5">
      <h2 className="font-bold text-[#173b2b]">
        {title}
      </h2>

      <p className="mt-1 text-xs text-[#7b8980]">
        {description}
      </p>

      <div className="mt-5">
        {children}
      </div>
    </section>
  );
}


// ============================================================
// INPUT
// ============================================================

function Input({
  label,
  ...props
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-[#526459]">
        {label}
      </label>

      <input
        {...props}
        className="w-full rounded-xl border border-[#dce4d8] bg-[#fbfcfa] px-4 py-3 text-sm text-[#173b2b] outline-none transition placeholder:text-[#a0aaa3] focus:border-[#9fbd82] focus:ring-2 focus:ring-[#edf5e8]"
      />
    </div>
  );
}


// ============================================================
// SELECT
// ============================================================

function Select({
  label,
  children,
  ...props
}) {
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


// ============================================================
// PERMISSION
// ============================================================

function Permission({
  title,
  description,
  enabled,
  onClick,
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div>
        <p className="text-sm font-semibold text-[#173b2b]">
          {title}
        </p>

        <p className="mt-0.5 text-xs text-[#7b8980]">
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
          className={`absolute top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white transition ${
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