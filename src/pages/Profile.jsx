// ============================================================
// FINANCEOS - USER PROFILE
// ============================================================

import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiShield,
  FiCalendar,
  FiEdit3,
  FiAlertCircle,
  FiSave,
  FiX,
  FiCheckCircle,
} from "react-icons/fi";

import Sidebar from "../components/layout/Sidebar.jsx";
import useFinance from "../context/useFinance.js";


// ============================================================
// API URL
// ============================================================

const API_URL = "http://localhost:5000/api/auth";


// ============================================================
// GET TOKEN
// ============================================================

const getToken = () => {
  return (
    localStorage.getItem("financeos_token") ||
    sessionStorage.getItem("financeos_token")
  );
};


// ============================================================
// CLEAR AUTHENTICATION
// ============================================================

const clearAuthentication = () => {
  localStorage.removeItem("financeos_token");
  localStorage.removeItem("financeos_user");

  sessionStorage.removeItem("financeos_token");
  sessionStorage.removeItem("financeos_user");
};


// ============================================================
// UPDATE STORED USER COPY
// ============================================================

const updateStoredUser = (user) => {
  const serializedUser = JSON.stringify(user);

  if (localStorage.getItem("financeos_token")) {
    localStorage.setItem(
      "financeos_user",
      serializedUser
    );

    return;
  }

  if (sessionStorage.getItem("financeos_token")) {
    sessionStorage.setItem(
      "financeos_user",
      serializedUser
    );
  }
};


// ============================================================
// FORMAT DATE
// ============================================================

const formatDate = (date) => {
  if (!date) {
    return "Not provided";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not provided";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};


// ============================================================
// FORMAT DATE FOR INPUT
// ============================================================

const formatDateForInput = (date) => {
  if (!date) {
    return "";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  const year = parsedDate.getFullYear();

  const month = String(
    parsedDate.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    parsedDate.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};


// ============================================================
// FORMAT TEXT
// ============================================================

const formatText = (value) => {
  if (!value) {
    return "Not provided";
  }

  return String(value)
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
};


// ============================================================
// PROFILE ITEM
// ============================================================

function ProfileItem({
  icon,
  label,
  value,
}) {
  return (
    <div className="flex items-start gap-3">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf5e8] text-[#57923d]">
        {icon}
      </div>

      <div className="min-w-0">

        <p className="text-xs font-medium text-[#849188]">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-semibold text-[#344f42]">
          {value || "Not provided"}
        </p>

      </div>

    </div>
  );
}


// ============================================================
// FORM FIELD
// ============================================================

function FormField({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
}) {
  return (
    <div>

      <label
        htmlFor={name}
        className="mb-2 block text-xs font-semibold text-[#617268]"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-[#dce5d7] bg-white px-4 py-3 text-sm text-[#344f42] outline-none transition focus:border-[#8ab86e] focus:ring-2 focus:ring-[#dff0d3]"
      />

    </div>
  );
}


// ============================================================
// PROFILE PAGE
// ============================================================

function Profile() {

  const navigate = useNavigate();
  const { sidebarCollapsed } = useFinance();


  // ==========================================================
  // STATE
  // ==========================================================

  const [user, setUser] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [isEditing, setIsEditing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [editError, setEditError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [formData, setFormData] =
    useState({
      fullName: "",
      mobileNumber: "",
      dateOfBirth: "",
      gender: "",
      city: "",
      state: "",
    });


  // ==========================================================
  // LOAD PROFILE
  // ==========================================================

  useEffect(() => {

    let ignore = false;


    const loadProfile = async () => {

      const token = getToken();


      // ======================================================
      // NO TOKEN
      // ======================================================

      if (!token) {
        navigate(
          "/signin",
          {
            replace: true,
          }
        );

        return;
      }


      try {

        setLoading(true);

        setError("");


        const response = await fetch(
          `${API_URL}/me`,
          {
            method: "GET",

            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );


        const data = await response.json();


        if (ignore) {
          return;
        }


        // ====================================================
        // INVALID AUTHENTICATION
        // ====================================================

        if (
          response.status === 401 ||
          response.status === 403
        ) {

          clearAuthentication();

          navigate(
            "/signin",
            {
              replace: true,
            }
          );

          return;
        }


        // ====================================================
        // REQUEST FAILED
        // ====================================================

        if (!response.ok) {

          setError(
            data.message ||
              "Unable to load your profile."
          );

          return;
        }


        // ====================================================
        // INVALID RESPONSE
        // ====================================================

        if (!data.user) {

          setError(
            "User information was not returned by the server."
          );

          return;
        }


        // ====================================================
        // SAVE USER
        // ====================================================

        setUser(data.user);

        updateStoredUser(data.user);

      } catch (requestError) {

        if (ignore) {
          return;
        }

        console.error(
          "Profile request failed:",
          requestError
        );

        setError(
          "Unable to connect to the FinanceOS server."
        );

      } finally {

        if (!ignore) {
          setLoading(false);
        }

      }

    };


    loadProfile();


    return () => {
      ignore = true;
    };

  }, [navigate]);


  // ==========================================================
  // START EDITING
  // ==========================================================

  const handleEdit = () => {

    if (!user) {
      return;
    }


    setFormData({
      fullName:
        user.name || "",

      mobileNumber:
        user.phone || "",

      dateOfBirth:
        formatDateForInput(
          user.dateOfBirth
        ),

      gender:
        user.gender || "",

      city:
        user.city || "",

      state:
        user.state || "",
    });


    setEditError("");

    setSuccessMessage("");

    setIsEditing(true);
  };


  // ==========================================================
  // CANCEL EDITING
  // ==========================================================

  const handleCancel = () => {

    setIsEditing(false);

    setEditError("");

    setSuccessMessage("");
  };


  // ==========================================================
  // FORM CHANGE
  // ==========================================================

  const handleChange = (event) => {

    const {
      name,
      value,
    } = event.target;


    setFormData((previous) => ({
      ...previous,

      [name]: value,
    }));

  };


  // ==========================================================
  // SAVE PROFILE
  // ==========================================================

  const handleSave = async (event) => {

    event.preventDefault();


    // ========================================================
    // BASIC FRONTEND VALIDATION
    // ========================================================

    if (!formData.fullName.trim()) {

      setEditError(
        "Full name is required."
      );

      return;
    }


    if (
      !/^[0-9]{10}$/.test(
        formData.mobileNumber.trim()
      )
    ) {

      setEditError(
        "Enter a valid 10-digit mobile number."
      );

      return;
    }


    if (!formData.dateOfBirth) {

      setEditError(
        "Date of birth is required."
      );

      return;
    }


    if (!formData.gender.trim()) {

      setEditError(
        "Gender is required."
      );

      return;
    }


    if (!formData.city.trim()) {

      setEditError(
        "City is required."
      );

      return;
    }


    if (!formData.state.trim()) {

      setEditError(
        "State is required."
      );

      return;
    }


    // ========================================================
    // GET JWT
    // ========================================================

    const token = getToken();


    if (!token) {

      clearAuthentication();

      navigate(
        "/signin",
        {
          replace: true,
        }
      );

      return;
    }


    try {

      setSaving(true);

      setEditError("");

      setSuccessMessage("");


      // ======================================================
      // UPDATE PROFILE API
      // ======================================================

      const response = await fetch(
        `${API_URL}/profile`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            fullName:
              formData.fullName.trim(),

            mobileNumber:
              formData.mobileNumber.trim(),

            dateOfBirth:
              formData.dateOfBirth,

            gender:
              formData.gender.trim(),

            city:
              formData.city.trim(),

            state:
              formData.state.trim(),
          }),
        }
      );


      const data = await response.json();


      // ======================================================
      // AUTHENTICATION FAILED
      // ======================================================

      if (
        response.status === 401 ||
        response.status === 403
      ) {

        clearAuthentication();

        navigate(
          "/signin",
          {
            replace: true,
          }
        );

        return;
      }


      // ======================================================
      // UPDATE FAILED
      // ======================================================

      if (!response.ok) {

        setEditError(
          data.message ||
            "Unable to update profile."
        );

        return;
      }


      // ======================================================
      // INVALID RESPONSE
      // ======================================================

      if (!data.user) {

        setEditError(
          "Updated user information was not returned."
        );

        return;
      }


      // ======================================================
      // UPDATE PAGE
      // ======================================================

      setUser(data.user);

      updateStoredUser(data.user);

      setIsEditing(false);

      setSuccessMessage(
        data.message ||
          "Profile updated successfully."
      );

    } catch (requestError) {

      console.error(
        "Update profile request failed:",
        requestError
      );

      setEditError(
        "Unable to connect to the FinanceOS server."
      );

    } finally {

      setSaving(false);

    }

  };


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (
      <div className="min-h-screen bg-[#f7f9f4]">

        <Sidebar />

        <main className={`min-h-screen transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-64"}`}>

          <div className="p-8">

            <div className="mx-auto max-w-6xl">

              <p className="text-sm font-semibold text-[#57923d]">
                FinanceOS Account
              </p>

              <h1 className="mt-1 text-3xl font-bold text-[#173b2b]">
                My Profile
              </h1>


              <div className="mt-8 rounded-2xl border border-[#e0e7dc] bg-white p-8 shadow-sm">

                <div className="flex items-center gap-3">

                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#d8e6cf] border-t-[#57923d]" />

                  <p className="text-sm font-medium text-[#617268]">
                    Loading your profile...
                  </p>

                </div>

              </div>

            </div>

          </div>

        </main>

      </div>
    );
  }


  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {

    return (
      <div className="min-h-screen bg-[#f7f9f4]">

        <Sidebar />

        <main className={`min-h-screen transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-64"}`}>

          <div className="p-8">

            <div className="mx-auto max-w-6xl">

              <p className="text-sm font-semibold text-[#57923d]">
                FinanceOS Account
              </p>

              <h1 className="mt-1 text-3xl font-bold text-[#173b2b]">
                My Profile
              </h1>


              <div className="mt-8 rounded-2xl border border-red-200 bg-white p-6 shadow-sm">

                <div className="flex items-start gap-3">

                  <FiAlertCircle className="mt-0.5 shrink-0 text-xl text-red-500" />

                  <div>

                    <p className="font-semibold text-red-600">
                      Unable to load profile
                    </p>

                    <p className="mt-1 text-sm text-red-500">
                      {error}
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </main>

      </div>
    );
  }


  // ==========================================================
  // USER NOT AVAILABLE
  // ==========================================================

  if (!user) {

    return (
      <div className="min-h-screen bg-[#f7f9f4]">

        <Sidebar />

        <main className={`min-h-screen p-8 transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-64"}`}>

          <div className="mx-auto max-w-6xl">

            <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-sm">

              <p className="font-semibold text-red-600">
                User information not found.
              </p>

            </div>

          </div>

        </main>

      </div>
    );
  }


  // ==========================================================
  // USER INITIAL
  // ==========================================================

  const userInitial =
    user.name
      ?.trim()
      ?.charAt(0)
      ?.toUpperCase() || "U";


  // ==========================================================
  // PROFILE
  // ==========================================================

  return (
    <div className="min-h-screen bg-[#f7f9f4]">

      <Sidebar />


      <main className={`min-h-screen transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-64"}`}>

        <div className="p-8">

          <div className="mx-auto max-w-6xl">


            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="flex items-center justify-between gap-4">

              <div>

                <p className="text-sm font-semibold text-[#57923d]">
                  FinanceOS Account
                </p>

                <h1 className="mt-1 text-3xl font-bold text-[#173b2b]">
                  My Profile
                </h1>

                <p className="mt-2 text-sm text-[#718177]">
                  View and update your personal information.
                </p>

              </div>


              {!isEditing && (

                <button
                  type="button"
                  onClick={handleEdit}
                  className="flex items-center gap-2 rounded-xl border border-[#d8e3d2] bg-white px-4 py-2.5 text-sm font-semibold text-[#344f42] shadow-sm transition hover:bg-[#f3f7ef]"
                >

                  <FiEdit3 />

                  Edit Profile

                </button>

              )}

            </div>


            {/* ==================================================
                SUCCESS MESSAGE
            ================================================== */}

            {successMessage && (

              <div className="mt-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">

                <FiCheckCircle className="shrink-0 text-green-600" />

                <p className="text-sm font-semibold text-green-700">
                  {successMessage}
                </p>

              </div>

            )}


            {/* ==================================================
                PROFILE HEADER
            ================================================== */}

            <div className="mt-8 rounded-2xl border border-[#e0e7dc] bg-white p-6 shadow-sm">

              <div className="flex flex-wrap items-center justify-between gap-5">

                <div className="flex items-center gap-5">

                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#dff5b5] text-3xl font-bold text-[#315c26]">
                    {userInitial}
                  </div>


                  <div>

                    <h2 className="text-2xl font-bold text-[#173b2b]">
                      {user.name || "FinanceOS User"}
                    </h2>

                    <p className="mt-1 text-sm text-[#718177]">
                      {user.email || "Email not provided"}
                    </p>


                    <div className="mt-3 flex flex-wrap items-center gap-2">

                      <span className="rounded-full bg-[#edf5e8] px-3 py-1 text-xs font-semibold capitalize text-[#57923d]">
                        {user.role || "user"}
                      </span>

                      <span className="rounded-full bg-[#f3f6f1] px-3 py-1 text-xs font-semibold text-[#617268]">
                        {user.status || "Active"}
                      </span>

                    </div>

                  </div>

                </div>


                <div className="text-right">

                  <p className="text-xs font-medium uppercase tracking-wider text-[#849188]">
                    FinanceOS User ID
                  </p>

                  <p className="mt-1 text-sm font-bold text-[#344f42]">
                    {user.userId || "Not available"}
                  </p>

                </div>

              </div>

            </div>


            {/* ==================================================
                EDIT FORM
            ================================================== */}

            {isEditing ? (

              <form
                onSubmit={handleSave}
                className="mt-6 rounded-2xl border border-[#e0e7dc] bg-white p-6 shadow-sm"
              >

                <div className="flex flex-wrap items-center justify-between gap-3">

                  <div>

                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#78906f]">
                      Edit
                    </p>

                    <h3 className="mt-1 text-xl font-bold text-[#173b2b]">
                      Edit Profile
                    </h3>

                    <p className="mt-1 text-sm text-[#718177]">
                      Update your personal information below.
                    </p>

                  </div>

                </div>


                {/* ERROR */}

                {editError && (

                  <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">

                    <FiAlertCircle className="mt-0.5 shrink-0 text-red-500" />

                    <p className="text-sm font-medium text-red-600">
                      {editError}
                    </p>

                  </div>

                )}


                {/* FIELDS */}

                <div className="mt-6 grid gap-5 md:grid-cols-2">

                  <FormField
                    label="Full Name"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    required
                  />


                  <FormField
                    label="Mobile Number"
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    required
                  />


                  <FormField
                    label="Date of Birth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    type="date"
                    required
                  />


                  {/* GENDER */}

                  <div>

                    <label
                      htmlFor="gender"
                      className="mb-2 block text-xs font-semibold text-[#617268]"
                    >
                      Gender
                    </label>

                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-[#dce5d7] bg-white px-4 py-3 text-sm text-[#344f42] outline-none transition focus:border-[#8ab86e] focus:ring-2 focus:ring-[#dff0d3]"
                    >

                      <option value="">
                        Select gender
                      </option>

                      <option value="male">
                        Male
                      </option>

                      <option value="female">
                        Female
                      </option>

                      <option value="other">
                        Other
                      </option>

                      <option value="prefer-not-to-say">
                        Prefer not to say
                      </option>

                    </select>

                  </div>


                  <FormField
                    label="City"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Enter city"
                    required
                  />


                  <FormField
                    label="State"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="Enter state"
                    required
                  />

                </div>


                {/* READ-ONLY INFORMATION */}

                <div className="mt-6 rounded-xl border border-[#e5ebe1] bg-[#f8faf6] p-4">

                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#78906f]">
                    Account Information
                  </p>

                  <p className="mt-2 text-sm text-[#718177]">
                    Email address, FinanceOS User ID, account type and account status cannot be changed from this form.
                  </p>

                </div>


                {/* BUTTONS */}

                <div className="mt-6 flex justify-end gap-3">

                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl border border-[#d8e3d2] bg-white px-5 py-2.5 text-sm font-semibold text-[#52665b] transition hover:bg-[#f3f7ef] disabled:cursor-not-allowed disabled:opacity-60"
                  >

                    <FiX />

                    Cancel

                  </button>


                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl bg-[#315c26] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#274b1f] disabled:cursor-not-allowed disabled:opacity-60"
                  >

                    {saving ? (

                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Saving...
                      </>

                    ) : (

                      <>
                        <FiSave />
                        Save Changes
                      </>

                    )}

                  </button>

                </div>

              </form>

            ) : (

              /* ==================================================
                  NORMAL PROFILE INFORMATION
              ================================================== */

              <div className="mt-6 grid gap-6 lg:grid-cols-2">


                {/* PERSONAL */}

                <section className="rounded-2xl border border-[#e0e7dc] bg-white p-6 shadow-sm">

                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#78906f]">
                    Personal
                  </p>

                  <h3 className="mt-1 text-lg font-bold text-[#173b2b]">
                    Personal Information
                  </h3>


                  <div className="mt-6 space-y-6">

                    <ProfileItem
                      icon={<FiUser />}
                      label="Full Name"
                      value={user.name}
                    />

                    <ProfileItem
                      icon={<FiPhone />}
                      label="Mobile Number"
                      value={user.phone}
                    />

                    <ProfileItem
                      icon={<FiCalendar />}
                      label="Date of Birth"
                      value={formatDate(user.dateOfBirth)}
                    />

                    <ProfileItem
                      icon={<FiUser />}
                      label="Gender"
                      value={formatText(user.gender)}
                    />

                  </div>

                </section>


                {/* ACCOUNT */}

                <section className="rounded-2xl border border-[#e0e7dc] bg-white p-6 shadow-sm">

                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#78906f]">
                    Account
                  </p>

                  <h3 className="mt-1 text-lg font-bold text-[#173b2b]">
                    Account Information
                  </h3>


                  <div className="mt-6 space-y-6">

                    <ProfileItem
                      icon={<FiMail />}
                      label="Email Address"
                      value={user.email}
                    />

                    <ProfileItem
                      icon={<FiShield />}
                      label="FinanceOS User ID"
                      value={user.userId}
                    />

                    <ProfileItem
                      icon={<FiShield />}
                      label="Account Type"
                      value={formatText(
                        user.role || "user"
                      )}
                    />

                    <ProfileItem
                      icon={<FiShield />}
                      label="Account Status"
                      value={
                        user.status || "Active"
                      }
                    />

                  </div>

                </section>


                {/* LOCATION */}

                <section className="rounded-2xl border border-[#e0e7dc] bg-white p-6 shadow-sm lg:col-span-2">

                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#78906f]">
                    Location
                  </p>

                  <h3 className="mt-1 text-lg font-bold text-[#173b2b]">
                    Location Information
                  </h3>


                  <div className="mt-6 grid gap-6 md:grid-cols-2">

                    <ProfileItem
                      icon={<FiMapPin />}
                      label="City"
                      value={user.city}
                    />

                    <ProfileItem
                      icon={<FiMapPin />}
                      label="State"
                      value={user.state}
                    />

                  </div>

                </section>

              </div>

            )}

          </div>

        </div>

      </main>

    </div>
  );
}


// ============================================================
// EXPORT
// ============================================================

export default Profile;