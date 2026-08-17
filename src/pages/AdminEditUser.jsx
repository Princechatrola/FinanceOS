import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  UserRound,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

import AdminSidebar from "../components/AdminSidebar.jsx";
import AdminTopbar from "../components/AdminTopbar.jsx";

export default function AdminEditUser() {
  const navigate = useNavigate();
  const { id } = useParams();

  // ==========================================================
  // TEMPORARY USER DATA
  // Later:
  // GET /api/admin/users/:id
  // ==========================================================

  const [form, setForm] = useState({
    userId: "FOS-U-001248",
    fullName: "Rahul Patel",
    dateOfBirth: "2001-03-14",
    gender: "Male",
    mobile: "9876543210",
    email: "rahul@example.com",
    city: "Ahmedabad",
    state: "Gujarat",
    status: "Active",
  });

  const [saved, setSaved] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setSaved(false);
  }

  function handleSubmit(event) {
    event.preventDefault();

    // ========================================================
    // TEMPORARY
    //
    // Later:
    // PUT /api/admin/users/:id
    // ========================================================

    console.log("Updating user:", id);
    console.log(form);

    setSaved(true);
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
                    The frontend update is working. MongoDB persistence will
                    be connected when we build the backend.
                  </p>
                </div>
              </div>
            )}

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
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#dff3ad] px-5 py-2.5 text-sm font-bold text-[#173b2b] transition hover:bg-[#d5eba2]"
                >
                  <Save size={16} />

                  Save Changes
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