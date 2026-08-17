import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import useFinance from "../context/useFinance.js";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Mail,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

function SignIn() {
  const { setUserData } = useFinance();
  const navigate = useNavigate();

  // ==========================================================
  // STATE
  // ==========================================================

  const [otpMode, setOtpMode] = useState(false);

  const [otp, setOtp] = useState("");

  const [otpTimer, setOtpTimer] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [loginError, setLoginError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    rememberMe: false,
  });

  // ==========================================================
  // OTP TIMER
  // ==========================================================

  useEffect(() => {
    if (otpTimer <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setOtpTimer((previous) => {
        if (previous <= 1) {
          clearInterval(timer);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [otpTimer]);

  // ==========================================================
  // INPUT CHANGE
  // ==========================================================

  const handleChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setFormData((previous) => ({
      ...previous,

      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));

    setLoginError("");
  };

  // ==========================================================
  // START OTP TIMER
  // ==========================================================

  const startOtpTimer = () => {
    setOtpTimer(300);
  };

  // ==========================================================
  // SEND OTP
  // ==========================================================

  const handleSendOTP = async () => {
    setLoginError("");

    const email =
      formData.email
        .trim()
        .toLowerCase();

    // ========================================================
    // EMAIL REQUIRED
    // ========================================================

    if (!email) {
      setLoginError(
        "Please enter your email address."
      );

      return;
    }

    // ========================================================
    // EMAIL VALIDATION
    // ========================================================

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      setLoginError(
        "Please enter a valid email address."
      );

      return;
    }

    try {
      setIsSubmitting(true);

      // ======================================================
      // SEND OTP REQUEST
      // ======================================================

      const response = await fetch(
        "http://localhost:5000/api/auth/send-otp",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            email,
          }),
        }
      );

      const data =
        await response.json();

      console.log(
        "Send OTP Response:",
        data
      );

      // ======================================================
      // BACKEND ERROR
      // ======================================================

      if (!response.ok) {
        setLoginError(
          data.message ||
            "Unable to send OTP."
        );

        return;
      }

      // ======================================================
      // OTP SUCCESS
      // ======================================================

      setFormData((previous) => ({
        ...previous,
        email,
      }));

      setOtpMode(true);

      setOtp("");

      startOtpTimer();

    } catch (error) {
      console.error(
        "Send OTP Error:",
        error
      );

      setLoginError(
        "Unable to connect to the FinanceOS server."
      );

    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================================
  // VERIFY OTP
  // ==========================================================

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    setLoginError("");

    // ========================================================
    // OTP VALIDATION
    // ========================================================

    if (otp.length !== 6) {
      setLoginError(
        "Please enter the 6-digit OTP."
      );

      return;
    }

    const email =
      formData.email
        .trim()
        .toLowerCase();

    try {
      setIsSubmitting(true);

      // ======================================================
      // VERIFY OTP REQUEST
      // ======================================================

      const response = await fetch(
        "http://localhost:5000/api/auth/verify-otp",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            email,
            otp,
          }),
        }
      );

      const data =
        await response.json();

      console.log(
        "Verify OTP Response:",
        data
      );

      // ======================================================
      // BACKEND ERROR
      // ======================================================

      if (!response.ok) {
        setLoginError(
          data.message ||
            "Invalid OTP."
        );

        return;
      }

      // ======================================================
      // CHECK SERVER RESPONSE
      // ======================================================

      if (
        !data.token ||
        !data.user
      ) {
        setLoginError(
          "Invalid response received from server."
        );

        return;
      }

      // ======================================================
      // CLEAR OLD LOGIN
      // ======================================================

      localStorage.removeItem(
        "financeos_token"
      );

      localStorage.removeItem(
        "financeos_user"
      );

      sessionStorage.removeItem(
        "financeos_token"
      );

      sessionStorage.removeItem(
        "financeos_user"
      );

      // ======================================================
      // SELECT STORAGE
      // ======================================================

      const storage =
        formData.rememberMe
          ? localStorage
          : sessionStorage;

      // ======================================================
      // SAVE TOKEN
      // ======================================================

      storage.setItem(
        "financeos_token",
        data.token
      );

      // ======================================================
      // SAVE USER
      // ======================================================

      storage.setItem(
        "financeos_user",
        JSON.stringify(
          data.user
        )
      );

      // ======================================================
      // UPDATE CONTEXT
      // ======================================================

      setUserData(data.user);

      // ======================================================
      // ROLE BASED REDIRECTION
      // ======================================================

      console.log(
        "Logged in user:",
        data.user
      );

      console.log(
        "User role:",
        data.user.role
      );

      // ======================================================
      // ADMIN
      // ======================================================

      if (
        data.user.role === "admin"
      ) {
        console.log(
          "Admin detected → Admin Dashboard"
        );

        navigate(
          "/admin-dashboard",
          {
            replace: true,
          }
        );

        return;
      }

      // ======================================================
      // NORMAL USER
      // ======================================================

      console.log(
        "User detected → User Dashboard"
      );

      navigate(
        "/dashboard",
        {
          replace: true,
        }
      );

    } catch (error) {
      console.error(
        "Verify OTP Error:",
        error
      );

      setLoginError(
        "Unable to connect to the FinanceOS server."
      );

    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================================
  // RESEND OTP
  // ==========================================================

  const handleResendOTP = async () => {
    if (
      otpTimer > 0 ||
      isSubmitting
    ) {
      return;
    }

    await handleSendOTP();
  };

  // ==========================================================
  // CHANGE EMAIL
  // ==========================================================

  const handleChangeEmail = () => {
    setOtpMode(false);

    setOtp("");

    setOtpTimer(0);

    setLoginError("");
  };

  // ==========================================================
  // FORMAT TIMER
  // ==========================================================

  const formatTimer = () => {
    const minutes =
      Math.floor(
        otpTimer / 60
      );

    const seconds =
      otpTimer % 60;

    return `${minutes}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

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
            lg:grid-cols-[0.95fr_1.05fr]
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

            <div className="absolute -left-28 -top-28 h-72 w-72 rounded-full bg-[#dcefc2]/60" />

            <div className="absolute -bottom-36 -right-24 h-80 w-80 rounded-full bg-[#dcefc2]/60" />

            <div className="relative z-10">

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#67964f]">
                FinanceOS
              </p>

              <h1 className="mt-3 text-3xl font-bold leading-tight text-[#173b2b]">

                Your finances.

                <span className="block text-[#57923d]">
                  One connected system.
                </span>

              </h1>

              <p className="mt-3 max-w-md text-sm leading-6 text-[#65786d]">
                Bring the important parts of your
                financial life together and understand
                how they connect.
              </p>

            </div>

            {/* SECURITY CARD */}

            <div className="relative z-10 mt-5">

              <div className="rounded-[22px] border border-[#d7e3d0] bg-white/85 p-5 shadow-sm">

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e7f3d8]">

                    <ShieldCheck
                      size={22}
                      className="text-[#57923d]"
                    />

                  </div>

                  <div>

                    <p className="font-semibold text-[#173b2b]">
                      Secure Login
                    </p>

                    <p className="text-xs text-[#7a897f]">
                      OTP protected access
                    </p>

                  </div>

                </div>

                <div className="my-4 h-px bg-[#e1e7dd]" />

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#edf5e8]">

                    <Mail
                      size={17}
                      className="text-[#57923d]"
                    />

                  </div>

                  <div>

                    <p className="text-sm font-semibold">
                      Email Verification
                    </p>

                    <p className="text-xs text-[#7b8a80]">
                      Receive a secure OTP
                    </p>

                  </div>

                </div>

                <div className="mx-auto ml-[17px] h-5 w-px bg-[#ccd9c4]" />

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#edf5e8]">

                    <ShieldCheck
                      size={17}
                      className="text-[#57923d]"
                    />

                  </div>

                  <div>

                    <p className="text-sm font-semibold">
                      Automatic Role Access
                    </p>

                    <p className="text-xs text-[#7b8a80]">
                      Admin or User dashboard
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </section>

          {/* ==================================================
              RIGHT PANEL
          ================================================== */}

          <section className="h-full overflow-hidden px-7 py-5 lg:px-10">

            <div className="mx-auto flex h-full w-full max-w-[560px] flex-col justify-center">

              {/* HEADER */}

              <div>

                <p className="text-[11px] font-semibold uppercase tracking-[0.17em] text-[#669451]">
                  Secure Access
                </p>

                <h2 className="mt-2 text-3xl font-bold leading-tight text-[#173b2b]">
                  Welcome Back
                </h2>

                <p className="mt-1.5 text-sm text-[#718177]">

                  {otpMode
                    ? "Enter the OTP sent to your email."
                    : "Sign in securely using email verification."}

                </p>

              </div>

              {/* ==================================================
                  EMAIL
              ================================================== */}

              {!otpMode && (

                <div className="mt-6">

                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-sm font-semibold text-[#344f42]"
                  >
                    Email Address
                  </label>

                  <div className="relative">

                    <Mail
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#87958c]"
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
                      placeholder="Enter your email"
                      autoComplete="email"
                      className="
                        w-full
                        rounded-xl
                        border
                        border-[#dce3d8]
                        bg-[#fbfcfa]
                        py-3
                        pl-11
                        pr-4
                        text-sm
                        text-[#173b2b]
                        outline-none
                        focus:border-[#9fbd82]
                        focus:ring-2
                        focus:ring-[#eaf4df]
                      "
                    />

                  </div>

                </div>

              )}

              {/* ==================================================
                  OTP
              ================================================== */}

              {otpMode && (

                <form
                  onSubmit={
                    handleVerifyOTP
                  }
                  className="mt-6"
                >

                  <div className="rounded-2xl border border-[#dce7d5] bg-[#f8fbf5] p-5">

                    {/* OTP HEADER */}

                    <div className="flex items-center gap-3">

                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e7f3d8]">

                        <ShieldCheck
                          size={21}
                          className="text-[#57923d]"
                        />

                      </div>

                      <div>

                        <p className="text-sm font-semibold text-[#173b2b]">
                          Verify Your Email
                        </p>

                        <p className="text-xs text-[#718177]">

                          OTP sent to{" "}

                          <strong>
                            {formData.email}
                          </strong>

                        </p>

                      </div>

                    </div>

                    {/* OTP INPUT */}

                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => {

                        const value =
                          e.target.value
                            .replace(
                              /\D/g,
                              ""
                            )
                            .slice(
                              0,
                              6
                            );

                        setOtp(value);

                        setLoginError("");

                      }}
                      placeholder="Enter 6-digit OTP"
                      autoFocus
                      className="
                        mt-5
                        w-full
                        rounded-xl
                        border
                        border-[#dce3d8]
                        bg-white
                        px-4
                        py-4
                        text-center
                        text-2xl
                        font-bold
                        tracking-[0.5em]
                        text-[#173b2b]
                        outline-none
                        focus:border-[#9fbd82]
                        focus:ring-2
                        focus:ring-[#eaf4df]
                      "
                    />

                    {/* TIMER */}

                    <div className="mt-3 text-center">

                      {otpTimer > 0 ? (

                        <p className="text-xs text-[#718177]">

                          OTP expires in{" "}

                          <strong className="text-[#57923d]">
                            {formatTimer()}
                          </strong>

                        </p>

                      ) : (

                        <button
                          type="button"
                          onClick={
                            handleResendOTP
                          }
                          disabled={
                            isSubmitting
                          }
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#57923d]"
                        >

                          <RefreshCw
                            size={13}
                          />

                          Resend OTP

                        </button>

                      )}

                    </div>

                  </div>

                  {/* ERROR */}

                  {loginError && (

                    <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">

                      <AlertCircle
                        size={16}
                        className="mt-0.5 shrink-0 text-red-500"
                      />

                      <p className="text-xs font-medium leading-5 text-red-600">
                        {loginError}
                      </p>

                    </div>

                  )}

                  {/* REMEMBER ME */}

                  <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-[#617268]">

                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={
                        formData.rememberMe
                      }
                      onChange={
                        handleChange
                      }
                      className="h-4 w-4 accent-[#57923d]"
                    />

                    Remember Me

                  </label>

                  {/* VERIFY BUTTON */}

                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      otp.length !== 6
                    }
                    className="
                      mt-4
                      flex
                      w-full
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      bg-[#dff5b5]
                      px-6
                      py-3
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
                      ? "Verifying..."
                      : "Verify OTP"}

                    {!isSubmitting && (
                      <ArrowRight
                        size={17}
                      />
                    )}

                  </button>

                  {/* CHANGE EMAIL */}

                  <button
                    type="button"
                    onClick={
                      handleChangeEmail
                    }
                    className="mt-3 w-full text-center text-xs font-semibold text-[#57923d]"
                  >
                    ← Change Email
                  </button>

                </form>

              )}

              {/* ==================================================
                  SEND OTP
              ================================================== */}

              {!otpMode && (

                <>

                  {/* ERROR */}

                  {loginError && (

                    <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">

                      <AlertCircle
                        size={16}
                        className="mt-0.5 shrink-0 text-red-500"
                      />

                      <p className="text-xs font-medium leading-5 text-red-600">
                        {loginError}
                      </p>

                    </div>

                  )}

                  {/* REMEMBER ME */}

                  <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-[#617268]">

                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={
                        formData.rememberMe
                      }
                      onChange={
                        handleChange
                      }
                      className="h-4 w-4 accent-[#57923d]"
                    />

                    Remember Me

                  </label>

                  {/* SEND OTP */}

                  <button
                    type="button"
                    onClick={
                      handleSendOTP
                    }
                    disabled={
                      isSubmitting
                    }
                    className="
                      mt-5
                      flex
                      w-full
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      bg-[#dff5b5]
                      px-6
                      py-3
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
                      ? "Sending OTP..."
                      : "Send OTP"}

                    {!isSubmitting && (
                      <Mail size={17} />
                    )}

                  </button>

                </>

              )}

              {/* ==================================================
                  CREATE ACCOUNT
              ================================================== */}

              <div className="mt-5 border-t border-[#e7ebe4] pt-4 text-center">

                <p className="text-sm text-[#718177]">

                  Don't have a FinanceOS account?{" "}

                  <Link
                    to="/signup"
                    className="font-semibold text-[#57923d]"
                  >
                    Create Account
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

export default SignIn;