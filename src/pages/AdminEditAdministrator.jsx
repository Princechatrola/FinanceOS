import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  Save,
  ShieldCheck,
  UserCog,
  Mail,
  Phone,
  MapPin,
  KeyRound,
} from "lucide-react";

import AdminSidebar from "../components/AdminSidebar.jsx";
import AdminTopbar from "../components/AdminTopbar.jsx";

import {
  getAdministrators,
  saveAdministrators,
} from "../utils/adminStorage.js";


// ============================================================
// ADMIN EDIT PAGE
// ============================================================

export default function AdminEditAdministrator() {

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
  // All hooks must execute before conditional return.
  // ==========================================================

  const [form, setForm] = useState(() => ({
    fullName: administrator?.name || "",
    email: administrator?.email || "",
    mobile: administrator?.mobile || "",
    city: administrator?.city || "",
    state: administrator?.state || "",
    status: administrator?.status || "Active",
  }));

  const [saved, setSaved] = useState(false);

  const [error, setError] = useState("");


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

            <div className="max-w-md rounded-2xl border border-[#dfe6da] bg-white p-8 text-center">

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
                Protected Account
              </h1>

              <p className="mt-2 text-sm leading-6 text-[#718177]">
                The Super Admin account cannot be edited from
                Sub Admin management.
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
  // CHANGE FORM VALUE
  // ==========================================================

  function handleChange(event) {

    const { name, value } = event.target;

    setForm((current) => ({
      ...current,

      [name]:
        name === "mobile"
          ? value.replace(/\D/g, "").slice(0, 10)
          : value,
    }));

    setSaved(false);

    setError("");
  }


  // ==========================================================
  // SAVE CHANGES
  // ==========================================================

  function handleSubmit(event) {

    event.preventDefault();


    // --------------------------------------------------------
    // CLEAN VALUES
    // --------------------------------------------------------

    const fullName =
      form.fullName.trim();

    const email =
      form.email
        .trim()
        .toLowerCase();

    const mobile =
      form.mobile.trim();

    const city =
      form.city.trim();

    const state =
      form.state.trim();


    // --------------------------------------------------------
    // REQUIRED VALIDATION
    // --------------------------------------------------------

    if (
      !fullName ||
      !email ||
      !mobile ||
      !city ||
      !state
    ) {

      setError(
        "Please complete all required fields."
      );

      return;
    }


    // --------------------------------------------------------
    // MOBILE VALIDATION
    // --------------------------------------------------------

    if (!/^\d{10}$/.test(mobile)) {

      setError(
        "Mobile number must contain exactly 10 digits."
      );

      return;
    }


    // --------------------------------------------------------
    // GET CURRENT ADMIN DATA
    // --------------------------------------------------------

    const currentAdmins =
      getAdministrators();


    // --------------------------------------------------------
    // DUPLICATE EMAIL
    // --------------------------------------------------------

    const duplicateEmail =
      currentAdmins.some((admin) => {

        return (
          String(admin.id) !== String(id) &&
          admin.email?.toLowerCase() === email
        );

      });


    if (duplicateEmail) {

      setError(
        "Another administrator already uses this email."
      );

      return;
    }


    // --------------------------------------------------------
    // DUPLICATE MOBILE
    // --------------------------------------------------------

    const duplicateMobile =
      currentAdmins.some((admin) => {

        return (
          String(admin.id) !== String(id) &&
          String(admin.mobile) === String(mobile)
        );

      });


    if (duplicateMobile) {

      setError(
        "Another administrator already uses this mobile number."
      );

      return;
    }


    // --------------------------------------------------------
    // UPDATE ADMINISTRATOR
    // --------------------------------------------------------

    const updatedAdmins =
      currentAdmins.map((admin) => {

        if (
          String(admin.id) !== String(id)
        ) {
          return admin;
        }


        // Never modify Super Admin through this page
        if (
          admin.role === "Super Admin"
        ) {
          return admin;
        }


        return {
          ...admin,

          name: fullName,

          email,

          mobile,

          city,

          state,

          status: form.status,
        };

      });


    // --------------------------------------------------------
    // SAVE
    // --------------------------------------------------------

    saveAdministrators(updatedAdmins);


    // --------------------------------------------------------
    // UPDATE CURRENT FORM
    // --------------------------------------------------------

    setForm({
      fullName,
      email,
      mobile,
      city,
      state,
      status: form.status,
    });


    setError("");

    setSaved(true);
  }


  // ==========================================================
  // UI
  // ==========================================================

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

            <div className="flex items-start gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf5e8] text-[#57923d]">

                <UserCog size={21} />

              </div>


              <div>

                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#639a48]">
                  Super Admin
                </p>

                <h1 className="mt-1 text-2xl font-bold text-[#173b2b]">
                  Edit Sub Admin
                </h1>

                <p className="mt-1 text-sm text-[#718177]">
                  Update administrator profile and account status.
                </p>

              </div>

            </div>


            {/* ==================================================
                ERROR MESSAGE
            ================================================== */}

            {error && (

              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">

                {error}

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
                    Administrator updated
                  </p>

                  <p className="mt-1 text-xs text-[#617268]">
                    Changes were saved successfully.
                  </p>

                </div>

              </div>

            )}


            {/* ==================================================
                FORM
            ================================================== */}

            <form
              onSubmit={handleSubmit}
              className="mt-6"
            >


              {/* ==================================================
                  ADMINISTRATOR ACCOUNT
              ================================================== */}

              <section className="rounded-2xl border border-[#dfe6da] bg-white p-5">

                <div className="flex items-center justify-between gap-4">


                  <div>

                    <h2 className="font-bold text-[#173b2b]">
                      Administrator Account
                    </h2>

                    <p className="mt-1 text-xs text-[#718177]">
                      System-controlled administrator information.
                    </p>

                  </div>


                  <ShieldCheck
                    size={20}
                    className="text-[#57923d]"
                  />

                </div>


                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                  <ReadOnlyField
                    label="Admin ID"
                    value={
                      administrator.adminId || "—"
                    }
                  />

                  <ReadOnlyField
                    label="Role"
                    value={
                      administrator.role || "Sub Admin"
                    }
                  />

                  <ReadOnlyField
                    label="Joined"
                    value={
                      administrator.joined || "—"
                    }
                  />

                  <ReadOnlyField
                    label="Record ID"
                    value={id}
                  />

                </div>

              </section>


              {/* ==================================================
                  PERSONAL INFORMATION
              ================================================== */}

              <section className="mt-5 rounded-2xl border border-[#dfe6da] bg-white p-5">

                <h2 className="font-bold text-[#173b2b]">
                  Personal Information
                </h2>

                <p className="mt-1 text-xs text-[#718177]">
                  Update the Sub Admin's profile information.
                </p>


                <div className="mt-5 grid gap-5 sm:grid-cols-2">


                  {/* NAME */}

                  <Input
                    icon={
                      <UserCog size={15} />
                    }
                    label="Full Name"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                  />


                  {/* MOBILE */}

                  <Input
                    icon={
                      <Phone size={15} />
                    }
                    label="Mobile Number"
                    name="mobile"
                    value={form.mobile}
                    onChange={handleChange}
                    maxLength={10}
                    inputMode="numeric"
                    required
                  />


                  {/* CITY */}

                  <Input
                    icon={
                      <MapPin size={15} />
                    }
                    label="City"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    required
                  />


                  {/* STATE */}

                  <Input
                    icon={
                      <MapPin size={15} />
                    }
                    label="State"
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    required
                  />

                </div>

              </section>


              {/* ==================================================
                  LOGIN & ACCOUNT
              ================================================== */}

              <section className="mt-5 rounded-2xl border border-[#dfe6da] bg-white p-5">

                <h2 className="font-bold text-[#173b2b]">
                  Login & Account
                </h2>

                <p className="mt-1 text-xs text-[#718177]">
                  Manage login identity and account availability.
                </p>


                <div className="mt-5 grid gap-5 sm:grid-cols-2">


                  {/* EMAIL */}

                  <Input
                    icon={
                      <Mail size={15} />
                    }
                    label="Email Address"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />


                  {/* STATUS */}

                  <div>

                    <label className="mb-2 block text-xs font-semibold text-[#526459]">
                      Account Status
                    </label>

                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-[#dce4d8] bg-[#fbfcfa] px-4 py-3 text-sm text-[#173b2b] outline-none focus:border-[#9fbd82] focus:ring-2 focus:ring-[#edf5e8]"
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

                    </select>

                  </div>

                </div>


                {/* ==================================================
                    PASSWORD
                ================================================== */}

                <div className="mt-5 rounded-xl border border-[#e1e7dd] bg-[#fafcf9] p-4">

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">


                    <div className="flex gap-3">

                      <KeyRound
                        size={18}
                        className="mt-0.5 shrink-0 text-[#57923d]"
                      />


                      <div>

                        <p className="text-sm font-semibold text-[#173b2b]">
                          Administrator Password
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#718177]">
                          Password reset will use a secure backend
                          authentication flow later.
                        </p>

                      </div>

                    </div>


                    <button
                      type="button"
                      onClick={() =>
                        alert(
                          "Password reset will be connected with backend authentication later."
                        )
                      }
                      className="rounded-lg border border-[#d6e6cc] bg-white px-4 py-2 text-xs font-semibold text-[#43822e] transition hover:bg-[#edf6e7]"
                    >
                      Reset Password
                    </button>

                  </div>

                </div>

              </section>


              {/* ==================================================
                  PERMISSIONS
              ================================================== */}

              <section className="mt-5 rounded-2xl border border-[#dce6d6] bg-[#f0f7eb] p-5">

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">


                  <div className="flex gap-3">

                    <ShieldCheck
                      size={20}
                      className="mt-0.5 shrink-0 text-[#57923d]"
                    />


                    <div>

                      <h3 className="text-sm font-bold text-[#173b2b]">
                        Administrative Permissions
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-[#617268]">
                        Permissions are managed separately from
                        administrator profile information.
                      </p>

                    </div>

                  </div>


                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/admin/administrators/${id}/access`
                      )
                    }
                    className="shrink-0 rounded-xl border border-[#cfe0c5] bg-white px-4 py-2.5 text-xs font-bold text-[#43822e] transition hover:bg-[#edf6e7]"
                  >
                    Manage Permissions
                  </button>

                </div>

              </section>


              {/* ==================================================
                  ACTIONS
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
// INPUT COMPONENT
// ============================================================

function Input({
  label,
  icon,
  ...props
}) {

  return (
    <div>

      <label className="mb-2 block text-xs font-semibold text-[#526459]">
        {label}
      </label>


      <div className="relative">

        {icon && (

          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#78906f]">
            {icon}
          </div>

        )}


        <input
          {...props}
          className={`w-full rounded-xl border border-[#dce4d8] bg-[#fbfcfa] py-3 pr-4 text-sm text-[#173b2b] outline-none placeholder:text-[#a0aaa3] focus:border-[#9fbd82] focus:ring-2 focus:ring-[#edf5e8] ${
            icon
              ? "pl-11"
              : "pl-4"
          }`}
        />

      </div>

    </div>
  );
}


// ============================================================
// READ ONLY FIELD
// ============================================================

function ReadOnlyField({
  label,
  value,
}) {

  return (
    <div>

      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8a978f]">
        {label}
      </p>

      <div className="rounded-xl border border-[#e1e7dd] bg-[#f6f8f4] px-4 py-3 text-sm font-semibold text-[#526459]">
        {value}
      </div>

    </div>
  );
}