import { useState, useEffect, useRef } from "react";
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
  X,
} from "lucide-react";

import useFinance from "../context/useFinance.js";
import { setAuthSession } from "../utils/authStorage.js";
import API_URL from "../config/api.js";

// ======================================================
// SAFE API RESPONSE PARSER
// ======================================================

async function parseApiResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch (error) {
      console.error("JSON Parse Error:", error);

      return {
        success: false,
        message: "Server returned invalid JSON.",
      };
    }
  }

  const text = await response.text();

  console.error("Non-JSON Server Response:", text);

  return {
    success: false,
    message:
      text ||
      `Server returned HTTP ${response.status} ${response.statusText}`,
  };
}

// ======================================================
// SIGN IN COMPONENT
// ======================================================

export default function SignIn() {
  const navigate = useNavigate();

  const { setUser } = useFinance();

  // ====================================================
  // STATES
  // ====================================================

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [otpSent, setOtpSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [timer, setTimer] = useState(0);

  const [otpAttempts, setOtpAttempts] = useState(0);

  const otpInputRef = useRef(null);

  // ====================================================
  // OTP TIMER
  // ====================================================

  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((previousTimer) => previousTimer - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  // ====================================================
  // FORMAT TIMER
  // ====================================================

  const formatTimer = () => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // ====================================================
  // EMAIL VALIDATION
  // ====================================================

  const isValidEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  // ====================================================
  // SEND OTP
  // ====================================================

  const handleSendOTP = async (event) => {
    event?.preventDefault();

    setError("");
    setSuccess("");

    // -------------------------------
    // Validate email
    // -------------------------------

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    // -------------------------------
    // Prevent duplicate request
    // -------------------------------

    if (loading) return;

    try {
      setLoading(true);

      console.log("Sending OTP...");
      console.log("API URL:", API_URL);
      console.log(
        "Endpoint:",
        `${API_URL}/api/auth/send-otp`
      );

      // ==================================================
      // IMPORTANT:
      // Production uses:
      //
      // https://your-backend.com/api/auth/send-otp
      //
      // Local development can use:
      //
      // http://localhost:5000/api/auth/send-otp
      // ==================================================

      const response = await fetch(
        `${API_URL}/api/auth/send-otp`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: cleanEmail,
          }),
        }
      );

      console.log("Send OTP HTTP Status:", response.status);

      const data = await parseApiResponse(response);

      console.log("Send OTP Response:", data);

      // -------------------------------
      // HTTP ERROR
      // -------------------------------

      if (!response.ok) {
        setError(
          data?.message ||
            `Unable to send OTP. Server returned ${response.status}.`
        );

        return;
      }

      // -------------------------------
      // API ERROR
      // -------------------------------

      if (data?.success === false) {
        setError(
          data.message || "Unable to send OTP."
        );

        return;
      }

      // -------------------------------
      // OTP SUCCESS
      // -------------------------------

      setEmail(cleanEmail);
      setOtpSent(true);

      setOtp("");
      setTimer(300);
      setOtpAttempts(0);

      setSuccess(
        data?.message ||
          "OTP has been sent to your email."
      );

      // Focus OTP field
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 100);

    } catch (error) {
      console.error("Send OTP Error:", error);

      setError(
        "Unable to connect to the FinanceOS server. Please check your backend URL or internet connection."
      );
    } finally {
      setLoading(false);
    }
  };

  // ====================================================
  // VERIFY OTP
  // ====================================================

  const handleVerifyOTP = async (event) => {
    event?.preventDefault();

    setError("");
    setSuccess("");

    // -------------------------------
    // Validate OTP
    // -------------------------------

    if (!otp) {
      setError("Please enter the OTP.");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError("OTP must contain exactly 6 digits.");
      return;
    }

    if (verifyLoading) return;

    try {
      setVerifyLoading(true);

      console.log("Verifying OTP...");
      console.log("API URL:", API_URL);

      const response = await fetch(
        `${API_URL}/api/auth/verify-otp`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            otp: otp.trim(),
          }),
        }
      );

      console.log(
        "Verify OTP HTTP Status:",
        response.status
      );

      const data = await parseApiResponse(response);

      console.log("Verify OTP Response:", data);

      // -------------------------------
      // HTTP ERROR
      // -------------------------------

      if (!response.ok) {
        setOtpAttempts((previous) => previous + 1);

        setError(
          data?.message ||
            `OTP verification failed. Server returned ${response.status}.`
        );

        return;
      }

      // -------------------------------
      // API ERROR
      // -------------------------------

      if (data?.success === false) {
        setOtpAttempts((previous) => previous + 1);

        setError(
          data.message || "Invalid OTP."
        );

        return;
      }

      // -------------------------------
      // TOKEN
      // -------------------------------

      const token =
        data?.token ||
        data?.data?.token ||
        data?.accessToken;

      // -------------------------------
      // USER
      // -------------------------------

      const user =
        data?.user ||
        data?.data?.user ||
        data?.data;

      if (!token) {
        console.error(
          "Token missing from login response:",
          data
        );

        setError(
          "Login successful, but authentication token was not received from the server."
        );

        return;
      }

      // -------------------------------
      // Save authentication session
      // -------------------------------

      try {
        setAuthSession(token, user);
      } catch (storageError) {
        console.error(
          "Auth storage error:",
          storageError
        );

        localStorage.setItem(
          "financeos_token",
          token
        );

        if (user) {
          localStorage.setItem(
            "financeos_user",
            JSON.stringify(user)
          );
        }
      }

      // -------------------------------
      // Update Finance Context
      // -------------------------------

      if (typeof setUser === "function" && user) {
        setUser(user);
      }

      setSuccess(
        data?.message ||
          "Login successful! Redirecting..."
      );

      // -------------------------------
      // Determine Role
      // -------------------------------

      const role =
        user?.role ||
        data?.role ||
        data?.data?.role;

      console.log("Logged in user:", user);
      console.log("User role:", role);

      // -------------------------------
      // Redirect
      // -------------------------------

      setTimeout(() => {
        if (
          role === "admin" ||
          role === "Admin"
        ) {
          navigate("/admin/dashboard", {
            replace: true,
          });
        } else {
          navigate("/dashboard", {
            replace: true,
          });
        }
      }, 700);

    } catch (error) {
      console.error(
        "Verify OTP Error:",
        error
      );

      setError(
        "Unable to connect to the FinanceOS server. Please check your connection."
      );
    } finally {
      setVerifyLoading(false);
    }
  };

  // ====================================================
  // RESEND OTP
  // ====================================================

  const handleResendOTP = async () => {
    if (timer > 0 || loading) {
      return;
    }

    await handleSendOTP();
  };

  // ====================================================
  // CHANGE EMAIL
  // ====================================================

  const handleChangeEmail = () => {
    setOtpSent(false);
    setOtp("");
    setTimer(0);

    setError("");
    setSuccess("");

    setTimeout(() => {
      document
        .getElementById("email")
        ?.focus();
    }, 100);
  };

  // ====================================================
  // OTP INPUT
  // ====================================================

  const handleOtpChange = (event) => {
    const value = event.target.value;

    // Only numbers
    const numericValue = value.replace(
      /\D/g,
      ""
    );

    // Maximum 6 digits
    setOtp(numericValue.slice(0, 6));

    setError("");
  };

  // ====================================================
  // GOOGLE LOGIN
  // ====================================================

  const handleGoogleLogin = async () => {
    setError("");
    setSuccess("");

    try {
      setLoading(true);

      console.log("Google Login");

      const response = await fetch(
        `${API_URL}/api/auth/google`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            // Google integration can be added here
          }),
        }
      );

      const data = await parseApiResponse(response);

      console.log(
        "Google Login Response:",
        data
      );

      if (!response.ok) {
        setError(
          data?.message ||
            "Google login is currently unavailable."
        );

        return;
      }

      if (data?.success === false) {
        setError(
          data.message ||
            "Google login failed."
        );

        return;
      }

      const token =
        data?.token ||
        data?.data?.token;

      const user =
        data?.user ||
        data?.data?.user ||
        data?.data;

      if (token) {
        setAuthSession(token, user);

        if (
          typeof setUser === "function" &&
          user
        ) {
          setUser(user);
        }

        const role = user?.role;

        if (
          role === "admin" ||
          role === "Admin"
        ) {
          navigate("/admin/dashboard", {
            replace: true,
          });
        } else {
          navigate("/dashboard", {
            replace: true,
          });
        }
      }

    } catch (error) {
      console.error(
        "Google Login Error:",
        error
      );

      setError(
        "Unable to connect to the FinanceOS server."
      );
    } finally {
      setLoading(false);
    }
  };

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* ==================================================
          LEFT SIDE
      ================================================== */}

      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-950 via-green-900 to-emerald-900 text-white p-12 relative overflow-hidden">

        {/* Background decoration */}

        <div className="absolute -top-24 -right-24 w-80 h-80 bg-green-400/10 rounded-full blur-3xl" />

        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between w-full">

          {/* Logo */}

          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-3"
            >
              <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                <TrendingUp size={24} />
              </div>

              <div>
                <div className="font-bold text-xl">
                  FinanceOS
                </div>

                <div className="text-xs text-green-200">
                  Manage Today, Secure Tomorrow
                </div>
              </div>
            </Link>
          </div>

          {/* Main content */}

          <div className="max-w-lg">

            <div className="mb-6 inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 border border-white/10 text-sm">
              <span className="w-2 h-2 bg-green-400 rounded-full" />

              Secure Financial Management
            </div>

            <h1 className="text-5xl font-bold leading-tight mb-6">
              Your money.
              <br />
              Your future.
              <br />

              <span className="text-green-400">
                Your control.
              </span>
            </h1>

            <p className="text-green-100 text-lg leading-relaxed">
              Manage your income, expenses,
              investments, savings, and financial
              goals from one powerful platform.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-5">

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <TrendingUp
                  size={22}
                  className="mb-3"
                />

                <div className="font-semibold">
                  Track Wealth
                </div>

                <div className="text-sm text-green-200 mt-1">
                  Monitor your complete financial
                  position.
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <Calendar
                  size={22}
                  className="mb-3"
                />

                <div className="font-semibold">
                  Plan Ahead
                </div>

                <div className="text-sm text-green-200 mt-1">
                  Set goals and build better
                  financial habits.
                </div>
              </div>

            </div>
          </div>

          {/* Footer */}

          <div className="text-sm text-green-200">
            © {new Date().getFullYear()} FinanceOS.
            All rights reserved.
          </div>

        </div>
      </div>

      {/* ==================================================
          RIGHT SIDE
      ================================================== */}

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">

        <div className="w-full max-w-md">

          {/* Mobile logo */}

          <div className="lg:hidden mb-8">

            <Link
              to="/"
              className="inline-flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-green-600 text-white flex items-center justify-center">
                <TrendingUp size={21} />
              </div>

              <div>
                <div className="font-bold text-xl text-slate-900">
                  FinanceOS
                </div>

                <div className="text-xs text-slate-500">
                  Manage Today, Secure Tomorrow
                </div>
              </div>
            </Link>

          </div>

          {/* Header */}

          <div className="mb-8">

            <h2 className="text-3xl font-bold text-slate-900">
              {otpSent
                ? "Verify your OTP"
                : "Welcome back"}
            </h2>

            <p className="text-slate-500 mt-2">

              {otpSent
                ? `Enter the 6-digit code sent to ${email}`
                : "Sign in to continue to your FinanceOS account."}

            </p>

          </div>

          {/* ==================================================
              ERROR MESSAGE
          ================================================== */}

          {error && (
            <div className="mb-5 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">

              <AlertCircle
                size={20}
                className="mt-0.5 flex-shrink-0"
              />

              <div className="text-sm">
                {error}
              </div>

              <button
                type="button"
                onClick={() => setError("")}
                className="ml-auto"
              >
                <X size={17} />
              </button>

            </div>
          )}

          {/* ==================================================
              SUCCESS MESSAGE
          ================================================== */}

          {success && (
            <div className="mb-5 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
              {success}
            </div>
          )}

          {/* ==================================================
              EMAIL FORM
          ================================================== */}

          {!otpSent ? (
            <form
              onSubmit={handleSendOTP}
              className="space-y-5"
            >

              {/* Email */}

              <div>

                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Email address
                </label>

                <div className="relative">

                  <Mail
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(
                        event.target.value
                      );
                      setError("");
                    }}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition"
                  />

                </div>

              </div>

              {/* Send OTP */}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold flex items-center justify-center gap-2 transition"
              >

                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />

                    Sending OTP...
                  </>
                ) : (
                  <>
                    Send OTP

                    <ArrowRight size={19} />
                  </>
                )}

              </button>

            </form>
          ) : (
            /* ==================================================
               OTP FORM
            ================================================== */

            <form
              onSubmit={handleVerifyOTP}
              className="space-y-5"
            >

              {/* OTP */}

              <div>

                <label
                  htmlFor="otp"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Enter OTP
                </label>

                <input
                  ref={otpInputRef}
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={handleOtpChange}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-4 rounded-xl border border-slate-200 bg-white text-center text-2xl tracking-[0.5em] font-semibold outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
                />

                <div className="flex items-center justify-between mt-3 text-sm">

                  <button
                    type="button"
                    onClick={handleChangeEmail}
                    className="text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                  >
                    <ArrowLeft size={16} />

                    Change email
                  </button>

                  <span className="text-slate-500">
                    {timer > 0
                      ? `Expires in ${formatTimer()}`
                      : "OTP expired"}
                  </span>

                </div>

              </div>

              {/* Verify */}

              <button
                type="submit"
                disabled={
                  verifyLoading ||
                  otp.length !== 6
                }
                className="w-full py-3.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold flex items-center justify-center gap-2 transition"
              >

                {verifyLoading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />

                    Verifying...
                  </>
                ) : (
                  <>
                    Verify & Sign In

                    <ArrowRight size={19} />
                  </>
                )}

              </button>

              {/* Resend */}

              <div className="text-center">

                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={
                    timer > 0 || loading
                  }
                  className="text-sm font-medium text-green-600 hover:text-green-700 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  {timer > 0
                    ? `Resend OTP in ${formatTimer()}`
                    : "Resend OTP"}
                </button>

              </div>

            </form>
          )}

          {/* ==================================================
              GOOGLE LOGIN
          ================================================== */}

          {!otpSent && (
            <>
              <div className="my-7 flex items-center gap-4">

                <div className="h-px bg-slate-200 flex-1" />

                <span className="text-sm text-slate-400">
                  OR
                </span>

                <div className="h-px bg-slate-200 flex-1" />

              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold flex items-center justify-center gap-3 transition"
              >

                <span className="font-bold text-lg">
                  G
                </span>

                Continue with Google

              </button>
            </>
          )}

          {/* ==================================================
              SIGN UP
          ================================================== */}

          <p className="text-center text-sm text-slate-500 mt-7">

            Don't have an account?{" "}

            <Link
              to="/signup"
              className="text-green-600 hover:text-green-700 font-semibold"
            >
              Create account
            </Link>

          </p>

          {/* ==================================================
              SECURITY INFO
          ================================================== */}

          <div className="mt-8 grid grid-cols-3 gap-3">

            <div className="text-center">

              <div className="flex justify-center mb-2">
                <Mail
                  size={18}
                  className="text-green-600"
                />
              </div>

              <span className="text-xs text-slate-500">
                Email OTP
              </span>

            </div>

            <div className="text-center">

              <div className="flex justify-center mb-2">
                <MapPin
                  size={18}
                  className="text-green-600"
                />
              </div>

              <span className="text-xs text-slate-500">
                Secure Access
              </span>

            </div>

            <div className="text-center">

              <div className="flex justify-center mb-2">
                <UserRound
                  size={18}
                  className="text-green-600"
                />
              </div>

              <span className="text-xs text-slate-500">
                Private Account
              </span>

            </div>

          </div>

          {/* Back Home */}

          <div className="text-center mt-6">

            <Link
              to="/"
              className="text-sm text-slate-500 hover:text-slate-700 inline-flex items-center gap-1"
            >
              <ArrowLeft size={15} />

              Back to home
            </Link>

          </div>

        </div>
      </div>

    </div>
  );
}
