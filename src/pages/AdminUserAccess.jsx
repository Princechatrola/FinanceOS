import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  Check,
  KeyRound,
  RotateCcw,
  Save,
  ShieldCheck,
  UserRound,
  Loader2,
  AlertTriangle,
} from "lucide-react";

import AdminSidebar from "../components/AdminSidebar.jsx";
import AdminTopbar from "../components/AdminTopbar.jsx";

const API_URL = "http://localhost:5000/api/admin/users";

export default function AdminUserAccess() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [user, setUser] = useState({
    userId: "",
    name: "",
    email: "",
    status: "",
  });

  const defaultPermissions = {
    dashboard: true,
    monthlyFinance: true,
    savingGoals: true,
    plansCommitments: true,
    financialCalendar: true,
    reports: true,
    aiAdvisor: false,
  };

  const [permissions, setPermissions] = useState(defaultPermissions);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetchUserAccess() {
      try {
        setLoading(true);
        setError("");
        const token = localStorage.getItem("financeos_token") || sessionStorage.getItem("financeos_token");
        const response = await fetch(`${API_URL}/${id}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to fetch user access details.");
        }
        const u = data.user;
        setUser({
          userId: u.userId || "",
          name: u.name || "",
          email: u.email || "",
          status: u.status || "",
        });
        if (u.permissions) {
          setPermissions({
            dashboard: u.permissions.dashboard !== undefined ? u.permissions.dashboard : defaultPermissions.dashboard,
            monthlyFinance: u.permissions.monthlyFinance !== undefined ? u.permissions.monthlyFinance : defaultPermissions.monthlyFinance,
            savingGoals: u.permissions.savingGoals !== undefined ? u.permissions.savingGoals : defaultPermissions.savingGoals,
            plansCommitments: u.permissions.plansCommitments !== undefined ? u.permissions.plansCommitments : defaultPermissions.plansCommitments,
            financialCalendar: u.permissions.financialCalendar !== undefined ? u.permissions.financialCalendar : defaultPermissions.financialCalendar,
            reports: u.permissions.reports !== undefined ? u.permissions.reports : defaultPermissions.reports,
            aiAdvisor: u.permissions.aiAdvisor !== undefined ? u.permissions.aiAdvisor : defaultPermissions.aiAdvisor,
          });
        }
      } catch (err) {
        console.error(err);
        setError(err.message || "Unable to load user permissions.");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchUserAccess();
    }
  }, [id]);

  function togglePermission(name) {
    setPermissions((current) => ({
      ...current,
      [name]: !current[name],
    }));

    setSaved(false);
  }

  function enableAll() {
    setPermissions({
      dashboard: true,
      monthlyFinance: true,
      savingGoals: true,
      plansCommitments: true,
      financialCalendar: true,
      reports: true,
      aiAdvisor: true,
    });

    setSaved(false);
  }

  function disableOptional() {
    setPermissions({
      dashboard: true,
      monthlyFinance: false,
      savingGoals: false,
      plansCommitments: false,
      financialCalendar: false,
      reports: false,
      aiAdvisor: false,
    });

    setSaved(false);
  }

  function resetPermissions() {
    setPermissions(defaultPermissions);
    setSaved(false);
  }

  async function savePermissions() {
    try {
      setSaving(true);
      setError("");
      setSaved(false);
      const token = localStorage.getItem("financeos_token") || sessionStorage.getItem("financeos_token");
      const response = await fetch(`${API_URL}/${id}/access`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          permissions,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update permissions.");
      }
      setSaved(true);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to save permissions.");
    } finally {
      setSaving(false);
    }
  }


  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f8f3]">

      {/* SIDEBAR */}

      <AdminSidebar />


      {/* MAIN AREA */}

      <div className="flex min-w-0 flex-1 flex-col">

        <AdminTopbar />


        <main className="flex-1 overflow-y-auto p-6">

          <div className="mx-auto max-w-[1050px]">


            {/* ==================================================
                BACK
            ================================================== */}

            <button
              type="button"
              onClick={() =>
                navigate(`/admin/users/${id}`)
              }
              className="
                mb-5
                flex items-center gap-2
                text-sm font-semibold
                text-[#617268]
                transition
                hover:text-[#57923d]
              "
            >
              <ArrowLeft size={16} />

              Back to User
            </button>


            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

              <div className="flex items-start gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf5e8] text-[#57923d]">
                  <KeyRound size={21} />
                </div>


                <div>

                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#639a48]">
                    User Administration
                  </p>

                  <h1 className="mt-1 text-2xl font-bold text-[#173b2b]">
                    Manage User Access
                  </h1>

                  <p className="mt-1 text-sm text-[#718177]">
                    Control which FinanceOS modules this user can access.
                  </p>

                </div>

              </div>


              <div className="flex gap-2">

                <button
                  type="button"
                  disabled={loading || saving}
                  onClick={resetPermissions}
                  className="
                    flex items-center gap-2
                    rounded-xl
                    border border-[#dce4d8]
                    bg-white
                    px-4 py-2.5
                    text-sm font-semibold
                    text-[#617268]
                    transition
                    hover:bg-[#f5f8f2]
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  <RotateCcw size={15} />

                  Reset
                </button>


                <button
                  type="button"
                  disabled={loading || saving}
                  onClick={savePermissions}
                  className="
                    flex items-center gap-2
                    rounded-xl
                    bg-[#dff3ad]
                    px-4 py-2.5
                    text-sm font-bold
                    text-[#173b2b]
                    transition
                    hover:bg-[#d5eba2]
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}

                  {saving ? "Saving..." : "Save Access"}
                </button>

              </div>

            </div>


            {/* ==================================================
                ERROR MESSAGE
            ================================================== */}

            {error && (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-600" />
                <div>
                  <p className="text-sm font-semibold">Error</p>
                  <p className="mt-1 text-xs">{error}</p>
                </div>
              </div>
            )}

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
                    Access permissions updated
                  </p>

                  <p className="mt-1 text-xs text-[#617268]">
                    User module access permissions have been successfully saved to MongoDB.
                  </p>

                </div>

              </div>

            )}

            {loading ? (
              <div className="mt-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-[#57923d]" />
                <p className="text-sm text-[#718177]">Loading permissions...</p>
              </div>
            ) : (
              <>
                {/* ==================================================
                    USER CARD
                ================================================== */}

                <section className="mt-6 rounded-2xl border border-[#dfe6da] bg-white p-5">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-center gap-3">

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#edf5e8] text-[#57923d]">
                    <UserRound size={21} />
                  </div>


                  <div>

                    <div className="flex items-center gap-2">

                      <h2 className="font-bold text-[#173b2b]">
                        {user.name}
                      </h2>

                      <span className="rounded-full bg-[#edf6e7] px-2.5 py-1 text-[10px] font-semibold text-[#57923d]">
                        {user.status}
                      </span>

                    </div>

                    <p className="mt-1 text-xs text-[#718177]">
                      {user.email}
                    </p>

                  </div>

                </div>


                <div className="sm:text-right">

                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a978f]">
                    Internal User ID
                  </p>

                  <p className="mt-1 font-mono text-sm font-bold text-[#57923d]">
                    {user.userId}
                  </p>

                </div>

              </div>

            </section>


            {/* ==================================================
                PERMISSION SUMMARY
            ================================================== */}

            <div className="mt-5 grid gap-4 sm:grid-cols-3">

              <Summary
                title="Enabled"
                value={
                  Object.values(permissions).filter(Boolean)
                    .length
                }
              />

              <Summary
                title="Disabled"
                value={
                  Object.values(permissions).filter(
                    (value) => !value
                  ).length
                }
              />

              <Summary
                title="Total Modules"
                value={Object.keys(permissions).length}
              />

            </div>


            {/* ==================================================
                ACCESS SETTINGS
            ================================================== */}

            <section className="mt-5 overflow-hidden rounded-2xl border border-[#dfe6da] bg-white">

              <div className="border-b border-[#edf0eb] p-5">

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                  <div>

                    <h2 className="font-bold text-[#173b2b]">
                      FinanceOS Module Access
                    </h2>

                    <p className="mt-1 text-xs text-[#718177]">
                      Enabled modules are available to this user's account.
                    </p>

                  </div>


                  <div className="flex gap-2">

                    <button
                      type="button"
                      onClick={enableAll}
                      className="
                        rounded-lg
                        border border-[#d6e6cc]
                        px-3 py-2
                        text-xs font-semibold
                        text-[#57923d]
                        transition
                        hover:bg-[#edf6e7]
                      "
                    >
                      Enable All
                    </button>


                    <button
                      type="button"
                      onClick={disableOptional}
                      className="
                        rounded-lg
                        border border-[#dfe4dc]
                        px-3 py-2
                        text-xs font-semibold
                        text-[#718177]
                        transition
                        hover:bg-[#f5f7f4]
                      "
                    >
                      Disable Optional
                    </button>

                  </div>

                </div>

              </div>


              <div className="divide-y divide-[#edf0eb]">

                <PermissionRow
                  title="Dashboard"
                  description="Main FinanceOS overview and financial summary."
                  enabled={permissions.dashboard}
                  required
                  onClick={() => {}}
                />


                <PermissionRow
                  title="Monthly Finance"
                  description="Monthly income, expenses, savings and financial records."
                  enabled={permissions.monthlyFinance}
                  onClick={() =>
                    togglePermission("monthlyFinance")
                  }
                />


                <PermissionRow
                  title="Saving Goals"
                  description="Create, update and monitor personal saving goals."
                  enabled={permissions.savingGoals}
                  onClick={() =>
                    togglePermission("savingGoals")
                  }
                />


                <PermissionRow
                  title="Plans & Commitments"
                  description="Investments, insurance, liabilities and financial commitments."
                  enabled={permissions.plansCommitments}
                  onClick={() =>
                    togglePermission("plansCommitments")
                  }
                />


                <PermissionRow
                  title="Financial Calendar"
                  description="Financial due dates, maturity dates and scheduled reminders."
                  enabled={permissions.financialCalendar}
                  onClick={() =>
                    togglePermission("financialCalendar")
                  }
                />


                <PermissionRow
                  title="Reports"
                  description="View and generate personal FinanceOS reports."
                  enabled={permissions.reports}
                  onClick={() =>
                    togglePermission("reports")
                  }
                />


                <PermissionRow
                  title="AI Advisor"
                  description="Access AI-assisted financial insights and guidance."
                  enabled={permissions.aiAdvisor}
                  onClick={() =>
                    togglePermission("aiAdvisor")
                  }
                />

              </div>

            </section>


            {/* ==================================================
                IMPORTANT INFORMATION
            ================================================== */}

            <section className="mt-5 rounded-2xl border border-[#dce6d6] bg-[#f0f7eb] p-5">

              <div className="flex gap-3">

                <ShieldCheck
                  size={19}
                  className="mt-0.5 shrink-0 text-[#57923d]"
                />


                <div>

                  <h3 className="text-sm font-bold text-[#173b2b]">
                    Access enforcement
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-[#617268]">
                    When the backend is connected, these permissions
                    will control both the User Dashboard interface and
                    the corresponding protected API endpoints.
                    Hiding a module in React alone will not be treated
                    as authorization.
                  </p>

                </div>

              </div>

            </section>


            {/* ==================================================
                BOTTOM ACTIONS
            ================================================== */}

            <div className="mt-5 flex justify-end gap-3 rounded-2xl border border-[#dfe6da] bg-white p-4">

              <button
                type="button"
                onClick={() =>
                  navigate(`/admin/users/${id}`)
                }
                className="
                  rounded-xl
                  border border-[#dce4d8]
                  px-5 py-2.5
                  text-sm font-semibold
                  text-[#617268]
                  transition
                  hover:bg-[#f5f8f2]
                "
              >
                Cancel
              </button>


              <button
                type="button"
                disabled={saving}
                onClick={savePermissions}
                className="
                  flex items-center gap-2
                  rounded-xl
                  bg-[#dff3ad]
                  px-5 py-2.5
                  text-sm font-bold
                  text-[#173b2b]
                  transition
                  hover:bg-[#d5eba2]
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}

                {saving ? "Saving..." : "Save Access"}
              </button>

            </div>
              </>
            )}

          </div>

        </main>

      </div>

    </div>
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
  required = false,
}) {
  return (
    <div className="flex items-center justify-between gap-5 px-5 py-4">

      <div>

        <div className="flex items-center gap-2">

          <p className="text-sm font-semibold text-[#173b2b]">
            {title}
          </p>

          {required && (
            <span className="rounded-full bg-[#f1f3ef] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#718177]">
              Required
            </span>
          )}

        </div>


        <p className="mt-1 max-w-[650px] text-xs leading-5 text-[#718177]">
          {description}
        </p>

      </div>


      <div className="flex items-center gap-3">

        <span
          className={`text-xs font-semibold ${
            enabled
              ? "text-[#57923d]"
              : "text-[#8a978f]"
          }`}
        >
          {enabled ? "Enabled" : "Disabled"}
        </span>


        <button
          type="button"
          disabled={required}
          onClick={onClick}
          className={`
            relative h-6 w-11 shrink-0 rounded-full transition

            ${
              enabled
                ? "bg-[#8dbb70]"
                : "bg-[#dce2d9]"
            }

            ${
              required
                ? "cursor-not-allowed opacity-70"
                : ""
            }
          `}
        >
          <span
            className={`
              absolute top-1
              flex h-4 w-4
              items-center justify-center
              rounded-full
              bg-white
              transition-all

              ${
                enabled
                  ? "left-6"
                  : "left-1"
              }
            `}
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
// SUMMARY
// ============================================================

function Summary({ title, value }) {
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