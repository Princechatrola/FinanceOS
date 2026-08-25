import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  UserRound,
  ShieldCheck,
  AlertTriangle,
  Loader2,
} from "lucide-react";

import AdminSidebar from "../components/AdminSidebar.jsx";
import AdminTopbar from "../components/AdminTopbar.jsx";

const API_URL = "http://localhost:5000/api/admin/users";

export default function AdminEditUser() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState({
    userId: "",
    fullName: "",
    dateOfBirth: "",
    gender: "Male",
    mobile: "",
    email: "",
    city: "",
    state: "",
    status: "Active",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetchUser() {
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
          throw new Error(data.message || "Failed to fetch user details.");
        }
        const u = data.user;
        setForm({
          userId: u.userId || "",
          fullName: u.name || "",
          dateOfBirth: u.dateOfBirth ? u.dateOfBirth.split("T")[0] : "",
          gender: u.gender || "Male",
          mobile: u.phone || "",
          email: u.email || "",
          city: u.city || "",
          state: u.state || "",
          status: u.status || "Active",
        });
      } catch (err) {
        console.error(err);
        setError(err.message || "Unable to load user.");
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      fetchUser();
    }
  }, [id]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setSaved(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
      setSaved(false);
      const token = localStorage.getItem("financeos_token") || sessionStorage.getItem("financeos_token");
      const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          fullName: form.fullName,
          dateOfBirth: form.dateOfBirth,
          gender: form.gender,
          mobile: form.mobile,
          email: form.email,
          city: form.city,
          state: form.state,
          status: form.status,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update user.");
      }
      setSaved(true);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to save user details.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f8f3]">
      <AdminSidebar />

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
              className="mb-5 flex items-center gap-2 text-sm font-semibold text-[#617268] transition hover:text-[#57923d]"
            >
              <ArrowLeft size={16} />

              Back to User
            </button>

            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf5e8] text-[#57923d]">
                <UserRound size={21} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#639a48]">
                  User Administration
                </p>

                <h1 className="mt-1 text-2xl font-bold text-[#173b2b]">
                  Edit User
                </h1>

                <p className="mt-1 text-sm text-[#718177]">
                  Update user profile and account information.
                </p>
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
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#d6e6cc] bg-[#edf6e7] p-4">
                <ShieldCheck
                  size={18}
                  className="mt-0.5 shrink-0 text-[#57923d]"
                />

                <div>
                  <p className="text-sm font-semibold text-[#173b2b]">
                    User updated
                  </p>

                  <p className="mt-1 text-xs text-[#617268]">
                    User profile and account information have been saved to the database.
                  </p>
                </div>
              </div>
            )}

            {loading ? (
              <div className="mt-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-[#57923d]" />
                <p className="text-sm text-[#718177]">Loading user details...</p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mt-6 space-y-5"
              >

              {/* ==================================================
                  INTERNAL ACCOUNT INFORMATION
              ================================================== */}

              <section className="rounded-2xl border border-[#dfe6da] bg-white p-5">
                <div className="flex items-center gap-2">
                  <ShieldCheck
                    size={18}
                    className="text-[#57923d]"
                  />

                  <div>
                    <h2 className="font-bold text-[#173b2b]">
                      Account Identification
                    </h2>

                    <p className="mt-1 text-xs text-[#718177]">
                      Internal FinanceOS account information.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-[#526459]">
                      Internal User ID
                    </label>

                    <input
                      value={form.userId}
                      disabled
                      className="w-full cursor-not-allowed rounded-xl border border-[#dfe6da] bg-[#f2f5f0] px-4 py-3 font-mono text-sm font-semibold text-[#6f8175]"
                    />

                    <p className="mt-2 text-[11px] text-[#8a978f]">
                      The internal User ID cannot be changed.
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

                    <option value="Suspended">
                      Suspended
                    </option>
                  </Select>
                </div>
              </section>

              {/* ==================================================
                  PERSONAL INFORMATION
              ================================================== */}

              <FormSection
                title="Personal Information"
                description="Update the user's personal profile."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="Full Name"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
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
                    required
                  />

                  <Input
                    label="City"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    required
                  />

                  <Input
                    label="State"
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    required
                  />
                </div>
              </FormSection>

              {/* ==================================================
                  ACCOUNT INFORMATION
              ================================================== */}

              <FormSection
                title="Account Information"
                description="Update the user's FinanceOS account information."
              >
                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />

                <div className="mt-4 flex gap-3 rounded-xl border border-[#e7e1c9] bg-[#fffaf0] p-4">
                  <AlertTriangle
                    size={18}
                    className="mt-0.5 shrink-0 text-[#a77a20]"
                  />

                  <div>
                    <p className="text-sm font-semibold text-[#5d512f]">
                      Changing account information
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#817555]">
                      When the backend is connected, changes to email, status,
                      or other sensitive account fields will be recorded in the
                      Admin audit log.
                    </p>
                  </div>
                </div>
              </FormSection>

              {/* ==================================================
                  ACTIONS
              ================================================== */}

              <div className="flex flex-col-reverse gap-3 rounded-2xl border border-[#dfe6da] bg-white p-4 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/admin/users/${id}`)
                  }
                  className="rounded-xl border border-[#dce4d8] px-5 py-2.5 text-sm font-semibold text-[#617268] transition hover:bg-[#f5f8f2]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#dff3ad] px-5 py-2.5 text-sm font-bold text-[#173b2b] transition hover:bg-[#d5eba2] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}

                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
            )}

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

      <p className="mt-1 text-xs text-[#718177]">
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
        className="w-full rounded-xl border border-[#dce4d8] bg-[#fbfcfa] px-4 py-3 text-sm text-[#173b2b] outline-none transition focus:border-[#9fbd82] focus:ring-2 focus:ring-[#edf5e8]"
      >
        {children}
      </select>
    </div>
  );
}