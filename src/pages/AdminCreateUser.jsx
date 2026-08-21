import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Save,
  ShieldCheck,
  UserPlus,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

import AdminSidebar from "../components/AdminSidebar.jsx";
import AdminTopbar from "../components/AdminTopbar.jsx";


// ============================================================
// API
// ============================================================

const API_URL = "http://localhost:5000/api/admin/users";


// ============================================================
// INITIAL PERMISSIONS
// ============================================================

const initialPermissions = {
  dashboard: true,
  monthlyFinance: true,
  savingGoals: true,
  financialPlans: true,
  financialCalendar: true,
  reports: true,
  aiAdvisor: true,
};


// ============================================================
// ADMIN CREATE USER
// ============================================================

export default function AdminCreateUser() {
  const navigate = useNavigate();


  // ----------------------------------------------------------
  // STATES
  // ----------------------------------------------------------

  const [form, setForm] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "",
    mobile: "",
    city: "",
    state: "",
    email: "",
    status: "Active",
  });

  const [permissions, setPermissions] =
    useState(initialPermissions);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [focusedField, setFocusedField] = useState(null);


  // ----------------------------------------------------------
  // HANDLERS
  // ----------------------------------------------------------

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    // Clear messages when user types
    if (error) setError("");
    if (success) setSuccess("");
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


  // ----------------------------------------------------------
  // SUBMIT
  // ----------------------------------------------------------

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const token =
        localStorage.getItem("financeos_token") ||
        sessionStorage.getItem("financeos_token");

      if (!token) {
        setError("Session expired. Please sign in again.");
        setLoading(false);
        return;
      }

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: form.fullName,
          dateOfBirth: form.dateOfBirth,
          gender: form.gender,
          mobile: form.mobile,
          city: form.city,
          state: form.state,
          email: form.email,
          status: form.status,
          permissions,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to create user.");
        setLoading(false);
        return;
      }

      setSuccess(
        `User "${data.user?.name || form.fullName}" created successfully with ID: ${data.user?.userId || "N/A"}`
      );

      // Reset form after success
      setForm({
        fullName: "",
        dateOfBirth: "",
        gender: "",
        mobile: "",
        city: "",
        state: "",
        email: "",
        status: "Active",
      });

      setPermissions(initialPermissions);

      // Redirect after a brief delay so user sees the success message
      setTimeout(() => {
        navigate("/admin/users");
      }, 2500);

    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }


  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f8f3]">
      <AdminSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-[1100px]">

            {/* BACK BUTTON */}

            <button
              type="button"
              onClick={() => navigate("/admin/users")}
              className="group mb-5 flex items-center gap-2 text-sm font-semibold text-[#60756a] transition-all duration-200 hover:text-[#43822e] hover:gap-3"
            >
              <ArrowLeft
                size={16}
                className="transition-transform duration-200 group-hover:-translate-x-1"
              />
              Back to Users
            </button>


            {/* HEADER SECTION */}

            <div
              className="relative mb-6 overflow-hidden rounded-2xl border border-[#d5e3cd] p-6"
              style={{
                background:
                  "linear-gradient(135deg, #e8f5d6 0%, #f0f7eb 40%, #ffffff 100%)",
              }}
            >
              {/* Decorative circles */}
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-20"
                style={{
                  background:
                    "radial-gradient(circle, #8dbb70, transparent 70%)",
                }}
              />
              <div
                className="pointer-events-none absolute -bottom-6 -left-6 h-28 w-28 rounded-full opacity-15"
                style={{
                  background:
                    "radial-gradient(circle, #57923d, transparent 70%)",
                }}
              />

              <div className="relative flex items-start gap-4">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-md"
                  style={{
                    background:
                      "linear-gradient(135deg, #8dbb70, #57923d)",
                  }}
                >
                  <UserPlus size={24} className="text-white" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#639a48]">
                      User Administration
                    </p>
                    <Sparkles
                      size={14}
                      className="text-[#8dbb70]"
                    />
                  </div>

                  <h1 className="mt-1.5 text-2xl font-bold text-[#173b2b]">
                    Create New User
                  </h1>

                  <p className="mt-1.5 text-sm leading-relaxed text-[#718177]">
                    Register a new FinanceOS account. The user will sign in
                    using their email with OTP verification.
                  </p>
                </div>
              </div>
            </div>


            {/* STATUS MESSAGES */}

            {error && (
              <div
                className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-3.5 text-sm font-medium text-red-700"
                style={{
                  animation: "slideDown 0.3s ease-out",
                }}
              >
                <AlertCircle size={18} className="shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div
                className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 text-sm font-medium text-emerald-700"
                style={{
                  animation: "slideDown 0.3s ease-out",
                }}
              >
                <CheckCircle2
                  size={18}
                  className="shrink-0"
                />
                {success}
              </div>
            )}


            {/* FORM */}

            <form onSubmit={handleSubmit} className="mt-2">
              <div className="grid gap-5 xl:grid-cols-[1.45fr_0.85fr]">

                {/* LEFT COLUMN */}

                <div className="space-y-5">

                  {/* PERSONAL INFORMATION */}

                  <FormSection
                    title="Personal Information"
                    description="Basic identity details for the new user account."
                    icon={<User size={18} className="text-[#57923d]" />}
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <Input
                        label="Full Name"
                        name="fullName"
                        value={form.fullName}
                        onChange={handleChange}
                        onFocus={() => setFocusedField("fullName")}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Enter full name"
                        icon={<User size={15} />}
                        focused={focusedField === "fullName"}
                        required
                      />

                      <Input
                        label="Date of Birth"
                        name="dateOfBirth"
                        type="date"
                        value={form.dateOfBirth}
                        onChange={handleChange}
                        onFocus={() => setFocusedField("dateOfBirth")}
                        onBlur={() => setFocusedField(null)}
                        icon={<Calendar size={15} />}
                        focused={focusedField === "dateOfBirth"}
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
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </Select>

                      <Input
                        label="Mobile Number"
                        name="mobile"
                        value={form.mobile}
                        onChange={handleChange}
                        onFocus={() => setFocusedField("mobile")}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Enter 10-digit mobile number"
                        icon={<Phone size={15} />}
                        focused={focusedField === "mobile"}
                        required
                      />

                      <Input
                        label="City"
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        onFocus={() => setFocusedField("city")}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Enter city"
                        icon={<MapPin size={15} />}
                        focused={focusedField === "city"}
                        required
                      />

                      <Input
                        label="State"
                        name="state"
                        value={form.state}
                        onChange={handleChange}
                        onFocus={() => setFocusedField("state")}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Enter state"
                        icon={<MapPin size={15} />}
                        focused={focusedField === "state"}
                        required
                      />
                    </div>
                  </FormSection>


                  {/* ACCOUNT INFORMATION */}

                  <FormSection
                    title="Account Information"
                    description="Email and initial account status configuration."
                    icon={<Mail size={18} className="text-[#57923d]" />}
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <Input
                        label="Email Address"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        onFocus={() => setFocusedField("email")}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Enter email address"
                        icon={<Mail size={15} />}
                        focused={focusedField === "email"}
                        required
                      />

                      <Select
                        label="Account Status"
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </Select>
                    </div>

                    {/* OTP info banner */}
                    <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#d8e5cf] bg-[#f5faf0] px-4 py-3">
                      <ShieldCheck
                        size={18}
                        className="mt-0.5 shrink-0 text-[#639a48]"
                      />
                      <p className="text-xs leading-5 text-[#5a7050]">
                        FinanceOS uses <strong>passwordless OTP authentication</strong>.
                        The user will sign in using their email and a
                        one-time verification code sent to their inbox.
                      </p>
                    </div>
                  </FormSection>
                </div>


                {/* RIGHT COLUMN */}

                <div className="space-y-5">

                  {/* USER ACCOUNT CARD */}

                  <section
                    className="relative overflow-hidden rounded-2xl border border-[#dfe6da] bg-white p-5"
                  >
                    <div
                      className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10"
                      style={{
                        background:
                          "radial-gradient(circle, #57923d, transparent 70%)",
                      }}
                    />

                    <div className="relative flex items-center gap-2">
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

                    <div
                      className="mt-2 rounded-xl border border-[#dfe6da] px-4 py-3"
                      style={{
                        background:
                          "linear-gradient(135deg, #f7faf5, #eef5e8)",
                      }}
                    >
                      <p className="font-mono text-sm font-bold text-[#43822e]">
                        FOS-U-XXXXXX
                      </p>
                    </div>

                    <p className="mt-2 text-xs leading-5 text-[#7b8980]">
                      FinanceOS will generate a unique User ID (e.g.
                      FOS-U-000012) automatically when the account is
                      created.
                    </p>
                  </section>


                  {/* ACCESS PERMISSIONS */}

                  <section className="rounded-2xl border border-[#dfe6da] bg-white">
                    <div className="border-b border-[#edf0eb] p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h2 className="font-bold text-[#173b2b]">
                            Access Permissions
                          </h2>

                          <p className="mt-1 text-xs text-[#7b8980]">
                            Choose which FinanceOS modules the user can
                            access.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={enableAllPermissions}
                          className="rounded-lg border border-[#dce7d5] px-3 py-1.5 text-xs font-semibold text-[#57923d] transition-all duration-200 hover:bg-[#edf5e8] hover:shadow-sm"
                        >
                          Enable All
                        </button>

                        <button
                          type="button"
                          onClick={disableAllPermissions}
                          className="rounded-lg border border-[#e1e5df] px-3 py-1.5 text-xs font-semibold text-[#718177] transition-all duration-200 hover:bg-[#f5f7f4] hover:shadow-sm"
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


              {/* ACTIONS BAR */}

              <div
                className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-[#dfe6da] bg-white p-4"
                style={{
                  background:
                    "linear-gradient(135deg, #ffffff, #fafcf8)",
                }}
              >
                <p className="hidden text-xs text-[#8a978f] sm:block">
                  {loading
                    ? "Creating account..."
                    : "All fields marked with * are required."}
                </p>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/admin/users")
                    }
                    disabled={loading}
                    className="rounded-xl border border-[#dce4d8] px-5 py-2.5 text-sm font-semibold text-[#617268] transition-all duration-200 hover:bg-[#f5f8f2] hover:shadow-sm disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg disabled:opacity-60"
                    style={{
                      background: loading
                        ? "#9fbd82"
                        : "linear-gradient(135deg, #8dbb70, #57923d)",
                    }}
                  >
                    {loading ? (
                      <>
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Create User
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </main>
      </div>


      {/* ANIMATIONS */}

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}


// ============================================================
// FORM SECTION
// ============================================================

function FormSection({
  title,
  description,
  icon,
  children,
}) {
  return (
    <section className="rounded-2xl border border-[#dfe6da] bg-white p-5 transition-shadow duration-300 hover:shadow-sm">
      <div className="flex items-center gap-2.5">
        {icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eaf5df]">
            {icon}
          </div>
        )}

        <div>
          <h2 className="font-bold text-[#173b2b]">
            {title}
          </h2>

          <p className="mt-0.5 text-xs text-[#7b8980]">
            {description}
          </p>
        </div>
      </div>

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
  icon,
  focused,
  ...props
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-[#526459]">
        {label}
        {props.required && (
          <span className="ml-0.5 text-[#c4533a]">*</span>
        )}
      </label>

      <div className="relative">
        {icon && (
          <span
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
              focused
                ? "text-[#57923d]"
                : "text-[#a0aaa3]"
            }`}
          >
            {icon}
          </span>
        )}

        <input
          {...props}
          className={`w-full rounded-xl border bg-[#fbfcfa] py-3 text-sm text-[#173b2b] outline-none transition-all duration-200 placeholder:text-[#a0aaa3] focus:border-[#9fbd82] focus:ring-2 focus:ring-[#edf5e8] focus:shadow-sm ${
            icon ? "pl-10 pr-4" : "px-4"
          } ${
            focused
              ? "border-[#9fbd82]"
              : "border-[#dce4d8]"
          }`}
        />
      </div>
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
        {props.required && (
          <span className="ml-0.5 text-[#c4533a]">*</span>
        )}
      </label>

      <select
        {...props}
        className="w-full rounded-xl border border-[#dce4d8] bg-[#fbfcfa] px-4 py-3 text-sm text-[#173b2b] outline-none transition-all duration-200 focus:border-[#9fbd82] focus:ring-2 focus:ring-[#edf5e8] focus:shadow-sm"
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
    <div className="flex items-center justify-between gap-4 px-5 py-4 transition-colors duration-200 hover:bg-[#fafcf8]">
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
        className={`relative h-6 w-11 shrink-0 rounded-full transition-all duration-300 ${
          enabled
            ? "bg-[#8dbb70] shadow-sm"
            : "bg-[#dce2d9]"
        }`}
      >
        <span
          className={`absolute top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm transition-all duration-300 ${
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