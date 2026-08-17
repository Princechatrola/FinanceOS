import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Mail,
  MapPin,
  Phone,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";

function SignUp() {
  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const navigate = useNavigate();

  // ==========================================================
  // STATE
  // ==========================================================

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "",
    mobileNumber: "",
    city: "",
    state: "",
    email: "",
  });

  // ==========================================================
  // HANDLE INPUT CHANGE
  // ==========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    let newValue = value;

    // Mobile: numbers only, maximum 10 digits
    if (name === "mobileNumber") {
      newValue = value.replace(/\D/g, "").slice(0, 10);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Clear backend error
    if (serverError) {
      setServerError("");
    }

    // Remove field error
    if (errors[name]) {
      setErrors((prev) => {
        const updatedErrors = {
          ...prev,
        };

        delete updatedErrors[name];

        return updatedErrors;
      });
    }
  };

  // ==========================================================
  // VALIDATE FORM
  // ==========================================================

  const validateForm = () => {
    const newErrors = {};

    const nameRegex = /^[A-Za-z\s]+$/;

    const locationRegex = /^[A-Za-z\s.'-]+$/;

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const mobileRegex = /^[0-9]{10}$/;

    // ========================================================
    // FULL NAME
    // ========================================================

    if (!formData.fullName.trim()) {
      newErrors.fullName =
        "Full name is required.";
    } else if (
      formData.fullName.trim().length < 3
    ) {
      newErrors.fullName =
        "Enter a valid full name.";
    } else if (
      !nameRegex.test(
        formData.fullName.trim()
      )
    ) {
      newErrors.fullName =
        "Full name should contain letters only.";
    }

    // ========================================================
    // DATE OF BIRTH
    // ========================================================

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth =
        "Date of birth is required.";
    } else {
      const selectedDate = new Date(
        `${formData.dateOfBirth}T00:00:00`
      );

      const today = new Date();

      today.setHours(0, 0, 0, 0);

      if (
        Number.isNaN(
          selectedDate.getTime()
        )
      ) {
        newErrors.dateOfBirth =
          "Enter a valid date of birth.";
      } else if (
        selectedDate > today
      ) {
        newErrors.dateOfBirth =
          "Date of birth cannot be in the future.";
      }
    }

    // ========================================================
    // GENDER
    // ========================================================

    if (!formData.gender) {
      newErrors.gender =
        "Please select gender.";
    }

    // ========================================================
    // MOBILE NUMBER
    // ========================================================

    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber =
        "Mobile number is required.";
    } else if (
      !mobileRegex.test(
        formData.mobileNumber.trim()
      )
    ) {
      newErrors.mobileNumber =
        "Enter a valid 10-digit mobile number.";
    }

    // ========================================================
    // CITY
    // ========================================================

    if (!formData.city.trim()) {
      newErrors.city =
        "City is required.";
    } else if (
      !locationRegex.test(
        formData.city.trim()
      )
    ) {
      newErrors.city =
        "Enter a valid city.";
    }

    // ========================================================
    // STATE
    // ========================================================

    if (!formData.state.trim()) {
      newErrors.state =
        "State is required.";
    } else if (
      !locationRegex.test(
        formData.state.trim()
      )
    ) {
      newErrors.state =
        "Enter a valid state.";
    }

    // ========================================================
    // EMAIL
    // ========================================================

    if (!formData.email.trim()) {
      newErrors.email =
        "Email address is required.";
    } else if (
      !emailRegex.test(
        formData.email.trim()
      )
    ) {
      newErrors.email =
        "Enter a valid email address.";
    }

    // ========================================================
    // SET ERRORS
    // ========================================================

    setErrors(newErrors);

    // ========================================================
    // RETURN VALIDATION RESULT
    // ========================================================

    return Object.keys(newErrors).length === 0;
  };

  // ==========================================================
  // HANDLE SUBMIT
  // ==========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setServerError("");

    const isValid = validateForm();

    if (!isValid) {
      return;
    }

    // ========================================================
    // REGISTRATION DATA
    // ========================================================

    const registrationData = {
      fullName:
        formData.fullName.trim(),

      dateOfBirth:
        formData.dateOfBirth,

      gender:
        formData.gender,

      mobileNumber:
        formData.mobileNumber.trim(),

      city:
        formData.city.trim(),

      state:
        formData.state.trim(),

      email:
        formData.email
          .trim()
          .toLowerCase(),
    };

    // ========================================================
    // SEND TO BACKEND
    // ========================================================

    try {
      setIsSubmitting(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/signup",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            registrationData
          ),
        }
      );

      const data =
        await response.json();

      // ======================================================
      // BACKEND ERROR
      // ======================================================

      if (!response.ok) {
        setServerError(
          data.message ||
            "Unable to create your account."
        );

        return;
      }

      // ======================================================
      // SUCCESS
      // ======================================================

      alert(
        data.message ||
          "FinanceOS account created successfully."
      );

      navigate("/signin");

    } catch (error) {
      console.error(
        "Signup request failed:",
        error
      );

      setServerError(
        "Unable to connect to the FinanceOS server. Make sure the backend is running."
      );

    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================================
  // FIELD BORDER
  // ==========================================================

  const inputClass = (field) => `
    w-full
    rounded-lg
    border
    bg-[#fbfcfa]
    py-2
    text-sm
    text-[#173b2b]
    outline-none
    transition
    placeholder:text-[#9aa69e]

    ${
      errors[field]
        ? "border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-100"
        : "border-[#dce3d8] focus:border-[#9fbd82] focus:ring-2 focus:ring-[#eaf4df]"
    }
  `;

  // ==========================================================
  // FIRST ERROR
  // ==========================================================

  const firstError =
    Object.values(errors)[0];

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="h-screen overflow-hidden bg-[#f7f9f4] text-[#173b2b]">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="h-[64px] border-b border-[#e1e7dc] bg-white">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6 lg:px-8">

          {/* LOGO */}

          <Link
            to="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#edf7df]">
              <TrendingUp
                size={20}
                className="text-[#4f8d32]"
              />
            </div>

            <div>
              <p className="text-xl font-bold tracking-tight text-[#43822e]">
                FinanceOS
              </p>

              <p className="text-[8px] font-medium tracking-wide text-[#6f846e]">
                Manage Today, Secure Tomorrow
              </p>
            </div>
          </Link>

          {/* BACK HOME */}

          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-medium text-[#617268] transition hover:text-[#43822e]"
          >
            <ArrowLeft size={16} />

            Back to Home
          </Link>

        </div>
      </header>

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="h-[calc(100vh-64px)] p-3 lg:p-4">

        <div
          className="
            mx-auto
            grid
            h-full
            w-full
            max-w-6xl
            overflow-hidden
            rounded-[26px]
            border
            border-[#dfe6da]
            bg-white
            shadow-[0_15px_45px_rgba(50,80,55,0.07)]
            lg:grid-cols-[0.85fr_1.15fr]
          "
        >

          {/* ==================================================
              LEFT PANEL
          ================================================== */}

          <section
            className="
              relative
              hidden
              h-full
              overflow-hidden
              bg-[#edf5e8]
              p-7
              lg:flex
              lg:flex-col
            "
          >

            {/* DECORATION */}

            <div className="absolute -left-28 -top-28 h-72 w-72 rounded-full bg-[#dcefc2]/60" />

            <div className="absolute -bottom-36 -right-24 h-80 w-80 rounded-full bg-[#dcefc2]/60" />

            {/* HEADING */}

            <div className="relative z-10 shrink-0">

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#67964f]">
                FinanceOS
              </p>

              <h1 className="mt-3 text-3xl font-bold leading-tight text-[#173b2b]">
                Your financial journey

                <span className="block text-[#57923d]">
                  starts here.
                </span>
              </h1>

              <p className="mt-3 max-w-sm text-sm leading-6 text-[#65786d]">
                Create your FinanceOS account and build a
                connected view of your financial life.
              </p>

            </div>

            {/* ACCOUNT CARD */}

            <div className="relative z-10 mt-5">

              <div className="rounded-[22px] border border-[#d7e3d0] bg-white/85 p-5 shadow-sm backdrop-blur">

                {/* CARD HEADER */}

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e7f3d8]">

                    <UserRound
                      size={21}
                      className="text-[#57923d]"
                    />

                  </div>

                  <div>

                    <p className="font-semibold text-[#173b2b]">
                      Your FinanceOS Account
                    </p>

                    <p className="mt-0.5 text-xs text-[#7a897f]">
                      Personal and secure
                    </p>

                  </div>

                </div>

                <div className="my-4 h-px bg-[#e1e7dd]" />

                {/* PERSONAL INFORMATION */}

                <AccountStep
                  icon={<Users size={17} />}
                  title="Personal Information"
                  text="Your basic profile details"
                />

                <Connector />

                {/* ACCOUNT INFORMATION */}

                <AccountStep
                  icon={<Mail size={17} />}
                  title="Account Information"
                  text="Your FinanceOS sign-in email"
                />

                <Connector />

                {/* SECURITY */}

                <AccountStep
                  icon={<Mail size={17} />}
                  title="Email OTP Login"
                  text="Secure passwordless access"
                />

                {/* READY */}

                <div className="mt-4 rounded-xl bg-[#e7f3d8] px-4 py-3">

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6e8665]">
                        Ready For
                      </p>

                      <p className="mt-0.5 text-sm font-semibold text-[#173b2b]">
                        Your Financial Dashboard
                      </p>

                    </div>

                    <TrendingUp
                      size={20}
                      className="text-[#57923d]"
                    />

                  </div>

                </div>

              </div>

            </div>

          </section>

          {/* ==================================================
              RIGHT PANEL
          ================================================== */}

          <section className="h-full overflow-hidden px-7 py-3 lg:px-10 lg:py-4">

            <div className="mx-auto flex h-full w-full max-w-[580px] flex-col justify-center">

              {/* HEADER */}

              <div className="shrink-0">

                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#669451]">
                  Create Account
                </p>

                <h2 className="mt-0.5 text-[26px] font-bold leading-tight text-[#173b2b]">
                  Join FinanceOS
                </h2>

                <p className="mt-0.5 text-xs text-[#718177]">
                  Enter your details to create your account.
                </p>

              </div>

              {/* ==================================================
                  FORM
              ================================================== */}

              <form
                onSubmit={handleSubmit}
                noValidate
                className="mt-2.5 shrink-0"
              >

                {/* PERSONAL INFORMATION */}

                <FormSectionTitle
                  text="Personal Information"
                />

                {/* FULL NAME + DOB */}

                <div className="grid grid-cols-2 gap-3">

                  {/* FULL NAME */}

                  <div>

                    <label
                      htmlFor="fullName"
                      className="mb-1 block text-xs font-semibold text-[#344f42]"
                    >
                      Full Name
                    </label>

                    <div className="relative">

                      <UserRound
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#87958c]"
                      />

                      <input
                        id="fullName"
                        type="text"
                        name="fullName"
                        value={
                          formData.fullName
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Enter full name"
                        autoComplete="name"
                        className={`${inputClass(
                          "fullName"
                        )} pl-9 pr-3`}
                      />

                    </div>

                  </div>

                  {/* DOB */}

                  <div>

                    <label
                      htmlFor="dateOfBirth"
                      className="mb-1 block text-xs font-semibold text-[#344f42]"
                    >
                      Date of Birth
                    </label>

                    <div className="relative">

                      <Calendar
                        size={15}
                        className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[#87958c]"
                      />

                      <input
                        id="dateOfBirth"
                        type="date"
                        name="dateOfBirth"
                        value={
                          formData.dateOfBirth
                        }
                        onChange={
                          handleChange
                        }
                        max={
                          new Date()
                            .toISOString()
                            .split("T")[0]
                        }
                        autoComplete="bday"
                        className={`${inputClass(
                          "dateOfBirth"
                        )} pl-9 pr-3`}
                      />

                    </div>

                  </div>

                </div>

                {/* GENDER + MOBILE */}

                <div className="mt-2 grid grid-cols-2 gap-3">

                  {/* GENDER */}

                  <div>

                    <label
                      htmlFor="gender"
                      className="mb-1 block text-xs font-semibold text-[#344f42]"
                    >
                      Gender
                    </label>

                    <select
                      id="gender"
                      name="gender"
                      value={
                        formData.gender
                      }
                      onChange={
                        handleChange
                      }
                      className={`${inputClass(
                        "gender"
                      )} px-3`}
                    >

                      <option value="">
                        Select Gender
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

                  {/* MOBILE */}

                  <div>

                    <label
                      htmlFor="mobileNumber"
                      className="mb-1 block text-xs font-semibold text-[#344f42]"
                    >
                      Mobile Number
                    </label>

                    <div className="relative">

                      <Phone
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#87958c]"
                      />

                      <input
                        id="mobileNumber"
                        type="tel"
                        inputMode="numeric"
                        name="mobileNumber"
                        value={
                          formData.mobileNumber
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Enter 10-digit number"
                        maxLength={10}
                        autoComplete="tel"
                        className={`${inputClass(
                          "mobileNumber"
                        )} pl-9 pr-3`}
                      />

                    </div>

                  </div>

                </div>

                {/* CITY + STATE */}

                <div className="mt-2 grid grid-cols-2 gap-3">

                  {/* CITY */}

                  <div>

                    <label
                      htmlFor="city"
                      className="mb-1 block text-xs font-semibold text-[#344f42]"
                    >
                      City
                    </label>

                    <div className="relative">

                      <MapPin
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#87958c]"
                      />

                      <input
                        id="city"
                        type="text"
                        name="city"
                        value={
                          formData.city
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Enter city"
                        autoComplete="address-level2"
                        className={`${inputClass(
                          "city"
                        )} pl-9 pr-3`}
                      />

                    </div>

                  </div>

                  {/* STATE */}

                  <div>

                    <label
                      htmlFor="state"
                      className="mb-1 block text-xs font-semibold text-[#344f42]"
                    >
                      State
                    </label>

                    <div className="relative">

                      <MapPin
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#87958c]"
                      />

                      <input
                        id="state"
                        type="text"
                        name="state"
                        value={
                          formData.state
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Enter state"
                        autoComplete="address-level1"
                        className={`${inputClass(
                          "state"
                        )} pl-9 pr-3`}
                      />

                    </div>

                  </div>

                </div>

                {/* ACCOUNT INFORMATION */}

                <div className="mt-2.5">

                  <FormSectionTitle
                    text="Account Information"
                  />

                </div>

                {/* EMAIL */}

                <div>

                  <label
                    htmlFor="email"
                    className="mb-1 block text-xs font-semibold text-[#344f42]"
                  >
                    Email Address
                  </label>

                  <div className="relative">

                    <Mail
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#87958c]"
                    />

                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={
                        formData.email
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Enter email address"
                      autoComplete="email"
                      className={`${inputClass(
                        "email"
                      )} pl-9 pr-3`}
                    />

                  </div>

                </div>

                {/* VALIDATION ERROR */}

                {firstError && (

                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5">

                    <AlertCircle
                      size={14}
                      className="shrink-0 text-red-500"
                    />

                    <p className="text-[11px] font-medium text-red-600">
                      {firstError}
                    </p>

                  </div>

                )}

                {/* BACKEND ERROR */}

                {!firstError &&
                  serverError && (

                    <div className="mt-2 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5">

                      <AlertCircle
                        size={14}
                        className="shrink-0 text-red-500"
                      />

                      <p className="text-[11px] font-medium text-red-600">
                        {serverError}
                      </p>

                    </div>

                  )}

                {/* CREATE ACCOUNT */}

                <button
                  type="submit"
                  disabled={
                    isSubmitting
                  }
                  className="
                    mt-3
                    flex
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-[#dff5b5]
                    px-6
                    py-2.5
                    text-sm
                    font-semibold
                    text-[#173b2b]
                    transition
                    hover:bg-[#d2efa0]
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >

                  {isSubmitting
                    ? "Creating Account..."
                    : "Create Account"}

                  {!isSubmitting && (
                    <ArrowRight
                      size={16}
                    />
                  )}

                </button>

              </form>

              {/* SIGN IN */}

              <div className="mt-2.5 border-t border-[#e7ebe4] pt-2.5 text-center">

                <p className="text-xs text-[#718177]">

                  Already have a FinanceOS account?{" "}

                  <Link
                    to="/signin"
                    className="font-semibold text-[#57923d] transition hover:text-[#3f762e]"
                  >
                    Sign In
                  </Link>

                </p>

              </div>

            </div>

          </section>

        </div>

      </main>

    </div>
  );
}


// ============================================================
// FORM SECTION TITLE
// ============================================================

function FormSectionTitle({
  text,
}) {
  return (
    <div className="mb-1.5 flex items-center gap-2">

      <div className="h-1.5 w-1.5 rounded-full bg-[#74a957]" />

      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#60765d]">
        {text}
      </p>

    </div>
  );
}


// ============================================================
// LEFT PANEL ACCOUNT STEP
// ============================================================

function AccountStep({
  icon,
  title,
  text,
}) {
  return (
    <div className="flex items-center gap-3">

      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#edf5e8] text-[#57923d]">
        {icon}
      </div>

      <div>

        <p className="text-sm font-semibold text-[#173b2b]">
          {title}
        </p>

        <p className="text-xs text-[#7b8a80]">
          {text}
        </p>

      </div>

    </div>
  );
}


// ============================================================
// LEFT PANEL CONNECTOR
// ============================================================

function Connector() {
  return (
    <div className="ml-[17px] h-4 w-px bg-[#ccd9c4]" />
  );
}


export default SignUp;