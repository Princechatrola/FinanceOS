import { useState, useEffect, useRef } from "react";
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

// ==========================================================
// FINANCEOS BACKEND URL
// ==========================================================

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://financeos-giup.onrender.com";

// Remove trailing slash
const API_BASE_URL = API_URL.replace(/\/+$/, "");

// ==========================================================
// DEBUG
// ==========================================================

console.log("=================================");
console.log("FinanceOS API BASE URL:", API_BASE_URL);
console.log("=================================");

// ==========================================================
// SAFE API RESPONSE PARSER
// ==========================================================

const parseApiResponse = async (response) => {
  const contentType =
    response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch (error) {
      console.error("JSON parsing error:", error);

      return {
        success: false,
        message: `Server returned invalid JSON. HTTP ${response.status}`,
      };
    }
  }

  try {
    const text = await response.text();

    return {
      success: false,
      message:
        text ||
        `Server returned HTTP ${response.status}`,
    };
  } catch (error) {
    console.error("Response reading error:", error);

    return {
      success: false,
      message: `Server returned HTTP ${response.status}`,
    };
  }
};

// ==========================================================
// POST JSON HELPER
// ==========================================================

const postJson = async (endpoint, body) => {
  const url = `${API_BASE_URL}${endpoint}`;

  console.log("=================================");
  console.log("API REQUEST");
  console.log("Method: POST");
  console.log("URL:", url);
  console.log("Body:", body);
  console.log("=================================");

  // Abort request after 30 seconds
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 30000);

  try {
    const response = await fetch(url, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },

      body: JSON.stringify(body),

      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log("API STATUS:", response.status);
    console.log("API OK:", response.ok);

    const data = await parseApiResponse(response);

    console.log("API RESPONSE:", data);

    return {
      response,
      data,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      throw new Error(
        "Request timed out. The FinanceOS server may be waking up. Please try again."
      );
    }

    throw error;
  }
};

function SignIn() {
  const { setUserData } = useFinance();
  const navigate = useNavigate();

  // ==========================================================
  // STATE
  // ==========================================================

  const [otpMode, setOtpMode] = useState(false);

  const [otpDigits, setOtpDigits] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  const otpRefs = useRef([]);

  const isSendingRef = useRef(false);

  const otp = otpDigits.join("");

  const [otpTimer, setOtpTimer] = useState(0);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [isGoogleSubmitting, setIsGoogleSubmitting] =
    useState(false);

  const [loginError, setLoginError] = useState("");

  const [otpNotice, setOtpNotice] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    rememberMe: true,
  });

  // ==========================================================
  // GOOGLE IDENTITY SERVICES INITIALIZATION
  // ==========================================================

  useEffect(() => {
    const googleClientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      (typeof window !== "undefined" &&
        window.__GOOGLE_CLIENT_ID__);

    const scriptId =
      "google-gsi-client-script";

    const initializeGoogle = () => {
      if (
        googleClientId &&
        window.google?.accounts?.id
      ) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,

            callback: (response) => {
              if (response?.credential) {
                completeGoogleSignIn({
                  credential:
                    response.credential,
                });
              }
            },

            auto_select: false,
            cancel_on_tap_outside: true,
          });

          console.log(
            "Google Identity Services initialized."
          );
        } catch (error) {
          console.warn(
            "GSI initialization warning:",
            error
          );
        }
      }
    };

    const existingScript =
      document.getElementById(scriptId);

    if (existingScript) {
      if (window.google?.accounts?.id) {
        initializeGoogle();
      } else {
        existingScript.addEventListener(
          "load",
          initializeGoogle,
          { once: true }
        );
      }

      return;
    }

    const script =
      document.createElement("script");

    script.id = scriptId;

    script.src =
      "https://accounts.google.com/gsi/client";

    script.async = true;
    script.defer = true;

    script.onload = initializeGoogle;

    script.onerror = () => {
      console.error(
        "Failed to load Google Identity Services."
      );
    };

    document.body.appendChild(script);
  }, []);

  // ==========================================================
  // COMPLETE GOOGLE SIGN IN
  // ==========================================================

  const completeGoogleSignIn = async (
    payload
  ) => {
    try {
      setIsGoogleSubmitting(true);
      setLoginError("");

      const { response, data } =
        await postJson(
          "/api/auth/google",
          payload
        );

      if (!response.ok) {
        setLoginError(
          data?.message ||
            `Google sign-in failed. HTTP ${response.status}`
        );

        return;
      }

      if (
        !data?.token ||
        !data?.user
      ) {
        setLoginError(
          "Invalid response received from authentication server."
        );

        return;
      }

      // ======================================================
      // CLEAR PREVIOUS TOKENS
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

      storage.setItem(
        "financeos_token",
        data.token
      );

      storage.setItem(
        "financeos_user",
        JSON.stringify(data.user)
      );

      // ======================================================
      // UPDATE CONTEXT
      // ======================================================

      setUserData(data.user);

      // ======================================================
      // ROLE BASED REDIRECTION
      // ======================================================

      if (
        data.user.role === "admin"
      ) {
        navigate(
          "/admin/dashboard",
          {
            replace: true,
          }
        );
      } else {
        navigate(
          "/dashboard",
          {
            replace: true,
          }
        );
      }
    } catch (error) {
      console.error(
        "Google sign in error:",
        error
      );

      setLoginError(
        error?.message ||
          "Unable to connect to FinanceOS server for Google sign-in."
      );
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  // ==========================================================
  // HANDLE GOOGLE SIGN IN CLICK
  // ==========================================================

  const handleGoogleSignIn = () => {
    setLoginError("");

    const googleClientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      (typeof window !== "undefined" &&
        window.__GOOGLE_CLIENT_ID__);

    if (!googleClientId) {
      setLoginError(
        "Google Sign-In is not configured yet. Please configure VITE_GOOGLE_CLIENT_ID."
      );

      return;
    }

    if (
      !window.google?.accounts
    ) {
      setLoginError(
        "Google authentication service is still loading. Please try again."
      );

      return;
    }

    setIsGoogleSubmitting(true);

    try {
      // ======================================================
      // GOOGLE OAUTH2 TOKEN CLIENT
      // ======================================================

      if (
        window.google.accounts.oauth2
      ) {
        const tokenClient =
          window.google.accounts.oauth2.initTokenClient(
            {
              client_id:
                googleClientId,

              scope:
                "openid email profile",

              callback:
                async (
                  tokenResponse
                ) => {
                  if (
                    tokenResponse &&
                    tokenResponse.access_token
                  ) {
                    try {
                      const userInfoRes =
                        await fetch(
                          "https://www.googleapis.com/oauth2/v3/userinfo",
                          {
                            headers: {
                              Authorization:
                                `Bearer ${tokenResponse.access_token}`,
                            },
                          }
                        );

                      if (
                        !userInfoRes.ok
                      ) {
                        throw new Error(
                          `Google profile request failed: ${userInfoRes.status}`
                        );
                      }

                      const userInfo =
                        await userInfoRes.json();

                      await completeGoogleSignIn(
                        {
                          email:
                            userInfo.email,

                          name:
                            userInfo.name,

                          googleId:
                            userInfo.sub,

                          picture:
                            userInfo.picture,
                        }
                      );
                    } catch (
                      fetchError
                    ) {
                      console.error(
                        "Failed to fetch Google profile:",
                        fetchError
                      );

                      setLoginError(
                        fetchError?.message ||
                          "Failed to retrieve Google profile information."
                      );

                      setIsGoogleSubmitting(
                        false
                      );
                    }
                  } else {
                    setIsGoogleSubmitting(
                      false
                    );
                  }
                },
            }
          );

        tokenClient.requestAccessToken();
      } else if (
        window.google.accounts.id
      ) {
        window.google.accounts.id.initialize(
          {
            client_id:
              googleClientId,

            callback: (
              response
            ) => {
              if (
                response?.credential
              ) {
                completeGoogleSignIn({
                  credential:
                    response.credential,
                });
              } else {
                setIsGoogleSubmitting(
                  false
                );
              }
            },
          }
        );

        window.google.accounts.id.prompt(
          (notification) => {
            if (
              notification.isNotDisplayed() ||
              notification.isSkippedMoment()
            ) {
              setIsGoogleSubmitting(
                false
              );
            }
          }
        );
      }
    } catch (error) {
      console.error(
        "Google sign in trigger error:",
        error
      );

      setLoginError(
        "Unable to initiate Google sign-in."
      );

      setIsGoogleSubmitting(false);
    }
  };

  // ==========================================================
  // AUTO FOCUS FIRST OTP BOX
  // ==========================================================

  useEffect(() => {
    if (otpMode) {
      const timer =
        setTimeout(() => {
          const firstEmpty =
            otpDigits.findIndex(
              (digit) => !digit
            );

          const targetIndex =
            firstEmpty !== -1
              ? firstEmpty
              : 0;

          otpRefs.current[
            targetIndex
          ]?.focus();
        }, 100);

      return () =>
        clearTimeout(timer);
    }
  }, [otpMode]);

  // ==========================================================
  // OTP INPUT HANDLER
  // ==========================================================

  const handleOtpChange = (
    index,
    e
  ) => {
    const rawValue =
      e.target.value;

    const digitsOnly =
      rawValue.replace(
        /\D/g,
        ""
      );

    if (!digitsOnly) {
      const updated = [
        ...otpDigits,
      ];

      updated[index] = "";

      setOtpDigits(updated);
      setLoginError("");

      return;
    }

    // Multiple digits
    if (
      digitsOnly.length > 1
    ) {
      const updated = [
        ...otpDigits,
      ];

      let pasteIndex = index;

      for (
        let i = 0;
        i < digitsOnly.length &&
        pasteIndex < 6;
        i++
      ) {
        updated[pasteIndex] =
          digitsOnly[i];

        pasteIndex++;
      }

      setOtpDigits(updated);
      setLoginError("");

      const nextFocus =
        Math.min(
          pasteIndex,
          5
        );

      otpRefs.current[
        nextFocus
      ]?.focus();

      return;
    }

    // Single digit
    const updated = [
      ...otpDigits,
    ];

    updated[index] =
      digitsOnly.slice(-1);

    setOtpDigits(updated);
    setLoginError("");

    if (index < 5) {
      setTimeout(() => {
        otpRefs.current[
          index + 1
        ]?.focus();
      }, 10);
    }
  };

  // ==========================================================
  // OTP KEYBOARD HANDLER
  // ==========================================================

  const handleOtpKeyDown = (
    index,
    e
  ) => {
    if (
      e.key === "Backspace"
    ) {
      if (
        otpDigits[index]
      ) {
        const updated = [
          ...otpDigits,
        ];

        updated[index] = "";

        setOtpDigits(updated);
        setLoginError("");
      } else if (
        index > 0
      ) {
        const updated = [
          ...otpDigits,
        ];

        updated[index - 1] = "";

        setOtpDigits(updated);
        setLoginError("");

        setTimeout(() => {
          otpRefs.current[
            index - 1
          ]?.focus();
        }, 10);
      }
    } else if (
      e.key === "ArrowLeft" &&
      index > 0
    ) {
      e.preventDefault();

      otpRefs.current[
        index - 1
      ]?.focus();
    } else if (
      e.key === "ArrowRight" &&
      index < 5
    ) {
      e.preventDefault();

      otpRefs.current[
        index + 1
      ]?.focus();
    }
  };

  // ==========================================================
  // OTP PASTE
  // ==========================================================

  const handleOtpPaste = (
    e
  ) => {
    e.preventDefault();

    const pasteData =
      e.clipboardData
        ? e.clipboardData.getData(
            "text"
          )
        : "";

    const cleanDigits =
      pasteData
        .replace(
          /\D/g,
          ""
        )
        .slice(0, 6);

    if (!cleanDigits) {
      return;
    }

    const updated = [
      "",
      "",
      "",
      "",
      "",
      "",
    ];

    for (
      let i = 0;
      i < cleanDigits.length;
      i++
    ) {
      updated[i] =
        cleanDigits[i];
    }

    setOtpDigits(updated);
    setLoginError("");

    const nextFocus =
      Math.min(
        cleanDigits.length,
        5
      );

    setTimeout(() => {
      otpRefs.current[
        nextFocus
      ]?.focus();
    }, 10);
  };

  // ==========================================================
  // OTP TIMER
  // ==========================================================

  useEffect(() => {
    if (otpTimer <= 0) {
      return;
    }

    const timer =
      setInterval(() => {
        setOtpTimer(
          (previous) => {
            if (
              previous <= 1
            ) {
              clearInterval(
                timer
              );

              return 0;
            }

            return previous - 1;
          }
        );
      }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [otpTimer]);

  // ==========================================================
  // FORM INPUT CHANGE
  // ==========================================================

  const handleChange = (
    e
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setFormData(
      (previous) => ({
        ...previous,

        [name]:
          type === "checkbox"
            ? checked
            : value,
      })
    );

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

  const handleSendOTP =
    async () => {
      if (
        isSendingRef.current ||
        isSubmitting
      ) {
        return;
      }

      setLoginError("");
      setOtpNotice("");

      const email =
        formData.email
          .trim()
          .toLowerCase();

      // ====================================================
      // EMAIL REQUIRED
      // ====================================================

      if (!email) {
        setLoginError(
          "Please enter your email address."
        );

        return;
      }

      // ====================================================
      // EMAIL VALIDATION
      // ====================================================

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
        isSendingRef.current =
          true;

        setIsSubmitting(true);

        console.log(
          "Sending login OTP..."
        );

        console.log(
          "POST:",
          `${API_BASE_URL}/api/auth/send-otp`
        );

        // ==================================================
        // IMPORTANT:
        // THIS IS POST, NOT GET
        // ==================================================

        const { response, data } =
          await postJson(
            "/api/auth/send-otp",
            {
              email,
            }
          );

        // ==================================================
        // BACKEND ERROR
        // ==================================================

        if (!response.ok) {
          console.error(
            "Send OTP failed:",
            response.status,
            data
          );

          if (
            response.status === 404
          ) {
            setLoginError(
              `OTP endpoint not found (404). Make sure Render has POST /api/auth/send-otp.`
            );
          } else if (
            response.status === 429
          ) {
            setLoginError(
              data?.message ||
                "Please wait before requesting another OTP."
            );
          } else if (
            response.status === 400
          ) {
            setLoginError(
              data?.message ||
                "Please enter a valid email address."
            );
          } else if (
            response.status >= 500
          ) {
            setLoginError(
              data?.message ||
                `FinanceOS backend error (${response.status}).`
            );
          } else {
            setLoginError(
              data?.message ||
                `Unable to send OTP. HTTP ${response.status}`
            );
          }

          return;
        }

        // ==================================================
        // API SUCCESS CHECK
        // ==================================================

        if (
          data?.success === false
        ) {
          setLoginError(
            data?.message ||
              "Unable to send OTP."
          );

          return;
        }

        // ==================================================
        // OTP SUCCESS
        // ==================================================

        setFormData(
          (previous) => ({
            ...previous,
            email,
          })
        );

        setOtpMode(true);

        setOtpDigits([
          "",
          "",
          "",
          "",
          "",
          "",
        ]);

        startOtpTimer();

        // ==================================================
        // EMAIL DELIVERY STATUS
        // ==================================================

        if (
          data?.emailSent === false
        ) {
          setOtpNotice(
            data?.message ||
              "OTP generated, but email delivery failed. Please check backend email configuration."
          );
        } else {
          setOtpNotice("");
        }

        console.log(
          "OTP sent successfully."
        );
      } catch (error) {
        console.error(
          "Send OTP Error:",
          error
        );

        // More useful error messages
        if (
          error?.message?.includes(
            "timed out"
          )
        ) {
          setLoginError(
            error.message
          );
        } else if (
          error?.message
        ) {
          setLoginError(
            `Connection error: ${error.message}`
          );
        } else {
          setLoginError(
            "Unable to connect to FinanceOS backend. Please check your Render server and internet connection."
          );
        }
      } finally {
        isSendingRef.current =
          false;

        setIsSubmitting(false);
      }
    };

  // ==========================================================
  // VERIFY OTP
  // ==========================================================

  const handleVerifyOTP =
    async (e) => {
      e.preventDefault();

      setLoginError("");

      if (
        otp.length !== 6
      ) {
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

        console.log(
          "Verifying OTP..."
        );

        console.log(
          "POST:",
          `${API_BASE_URL}/api/auth/verify-otp`
        );

        const { response, data } =
          await postJson(
            "/api/auth/verify-otp",
            {
              email,
              otp,
            }
          );

        // ==================================================
        // BACKEND ERROR
        // ==================================================

        if (!response.ok) {
          console.error(
            "Verify OTP failed:",
            response.status,
            data
          );

          if (
            response.status === 404
          ) {
            setLoginError(
              "OTP verification endpoint was not found."
            );
          } else if (
            response.status === 401
          ) {
            setLoginError(
              data?.message ||
                "Invalid or expired OTP. Please try again."
            );
          } else if (
            response.status === 400
          ) {
            setLoginError(
              data?.message ||
                "Invalid OTP request."
            );
          } else {
            setLoginError(
              data?.message ||
                `Unable to verify OTP. HTTP ${response.status}`
            );
          }

          return;
        }

        // ==================================================
        // CHECK SERVER RESPONSE
        // ==================================================

        if (
          !data?.token ||
          !data?.user
        ) {
          console.error(
            "Invalid login response:",
            data
          );

          setLoginError(
            "Invalid response received from authentication server."
          );

          return;
        }

        // ==================================================
        // CLEAR OLD LOGIN
        // ==================================================

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

        // ==================================================
        // SELECT STORAGE
        // ==================================================

        const storage =
          formData.rememberMe
            ? localStorage
            : sessionStorage;

        // ==================================================
        // SAVE TOKEN
        // ==================================================

        storage.setItem(
          "financeos_token",
          data.token
        );

        // ==================================================
        // SAVE USER
        // ==================================================

        storage.setItem(
          "financeos_user",
          JSON.stringify(
            data.user
          )
        );

        // ==================================================
        // UPDATE CONTEXT
        // ==================================================

        setUserData(
          data.user
        );

        console.log(
          "Login successful:",
          data.user
        );

        // ==================================================
        // ROLE BASED REDIRECT
        // ==================================================

        if (
          data.user.role ===
          "admin"
        ) {
          console.log(
            "Admin detected → Admin Dashboard"
          );

          navigate(
            "/admin/dashboard",
            {
              replace: true,
            }
          );

          return;
        }

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
          error?.message ||
            "Unable to connect to the FinanceOS backend."
        );
      } finally {
        setIsSubmitting(false);
      }
    };

  // ==========================================================
  // RESEND OTP
  // ==========================================================

  const handleResendOTP =
    async () => {
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

  const handleChangeEmail =
    () => {
      setOtpMode(false);

      setOtpDigits([
        "",
        "",
        "",
        "",
        "",
        "",
      ]);

      setOtpTimer(0);

      setLoginError("");
      setOtpNotice("");
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
                  EMAIL LOGIN
              ================================================== */}

              {!otpMode && (
                <div className="mt-6 space-y-4">

                  {/* GOOGLE */}

                  <button
                    type="button"
                    onClick={
                      handleGoogleSignIn
                    }
                    disabled={
                      isSubmitting ||
                      isGoogleSubmitting
                    }
                    className="
                      flex
                      w-full
                      items-center
                      justify-center
                      gap-3
                      rounded-xl
                      border
                      border-[#d8e0d4]
                      bg-white
                      px-5
                      py-3
                      text-sm
                      font-semibold
                      text-[#1f3f30]
                      shadow-sm
                      transition-all
                      duration-150
                      hover:bg-[#f4f8f0]
                      hover:border-[#adc7a4]
                      hover:shadow
                      active:scale-[0.99]
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                  >

                    {isGoogleSubmitting ? (
                      <RefreshCw
                        size={18}
                        className="animate-spin text-[#57923d]"
                      />
                    ) : (
                      <svg
                        className="h-5 w-5 shrink-0"
                        viewBox="0 0 24 24"
                      >

                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                        />

                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.39 7.33 24 12 24z"
                        />

                        <path
                          fill="#FBBC05"
                          d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 1.25 17.42l4.03-3.15z"
                        />

                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.61 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                        />

                      </svg>
                    )}

                    <span>
                      {isGoogleSubmitting
                        ? "Signing in with Google..."
                        : "Continue with Google"}
                    </span>

                  </button>

                  {/* DIVIDER */}

                  <div className="flex items-center gap-3 py-1">

                    <div className="h-px flex-1 bg-[#e1e7dc]" />

                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#829589]">
                      or continue with email
                    </span>

                    <div className="h-px flex-1 bg-[#e1e7dc]" />

                  </div>

                  {/* EMAIL */}

                  <div>

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

                  {/* REMEMBER ME */}

                  <div className="flex items-center justify-between pt-1">

                    <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-[#65796c]">

                      <input
                        type="checkbox"
                        name="rememberMe"
                        checked={
                          formData.rememberMe
                        }
                        onChange={
                          handleChange
                        }
                        className="h-4 w-4 rounded border-[#ccd8c6] text-[#57923d] accent-[#57923d]"
                      />

                      <span>
                        Keep me signed in
                      </span>

                    </label>

                  </div>

                  {/* ERROR */}

                  {loginError && (
                    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">

                      <AlertCircle
                        size={16}
                        className="mt-0.5 shrink-0 text-red-500"
                      />

                      <p className="text-xs font-medium leading-5 text-red-600">
                        {loginError}
                      </p>

                    </div>
                  )}

                  {/* SEND OTP */}

                  <button
                    type="button"
                    onClick={
                      handleSendOTP
                    }
                    disabled={
                      isSubmitting ||
                      isGoogleSubmitting
                    }
                    className="
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

                </div>
              )}

              {/* ==================================================
                  OTP FORM
              ================================================== */}

              {otpMode && (
                <form
                  onSubmit={
                    handleVerifyOTP
                  }
                  className="mt-6"
                >

                  <div className="rounded-2xl border border-[#dce7d5] bg-[#f8fbf5] p-5">

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

                    {/* OTP BOXES */}

                    <div className="mt-5 flex items-center justify-center gap-2 sm:gap-3">

                      {otpDigits.map(
                        (
                          digit,
                          index
                        ) => (
                          <input
                            key={index}
                            ref={(element) => {
                              otpRefs.current[
                                index
                              ] = element;
                            }}
                            id={`otp-box-${index}`}
                            name={`otp-box-${index}`}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={1}
                            autoComplete={
                              index ===
                              0
                                ? "one-time-code"
                                : "off"
                            }
                            value={
                              digit
                            }
                            onChange={(
                              e
                            ) =>
                              handleOtpChange(
                                index,
                                e
                              )
                            }
                            onKeyDown={(
                              e
                            ) =>
                              handleOtpKeyDown(
                                index,
                                e
                              )
                            }
                            onPaste={
                              handleOtpPaste
                            }
                            onFocus={(
                              e
                            ) =>
                              e.target.select()
                            }
                            disabled={
                              isSubmitting
                            }
                            aria-label={`Digit ${
                              index + 1
                            } of 6-digit OTP`}
                            className="
                              h-12
                              w-11
                              rounded-xl
                              border
                              border-[#dce3d8]
                              bg-white
                              text-center
                              text-xl
                              font-bold
                              text-[#173b2b]
                              outline-none
                              transition-all
                              duration-150
                              focus:border-[#57923d]
                              focus:ring-2
                              focus:ring-[#eaf4df]
                              disabled:cursor-not-allowed
                              disabled:bg-[#f5f7f3]
                              shadow-sm
                              sm:h-14
                              sm:w-13
                              sm:text-2xl
                              md:w-14
                            "
                          />
                        )
                      )}

                    </div>

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
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#57923d] hover:underline"
                        >

                          <RefreshCw
                            size={13}
                          />

                          Resend OTP

                        </button>
                      )}

                    </div>

                  </div>

                  {/* OTP NOTICE */}

                  {otpNotice && (
                    <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">

                      <span className="text-sm text-amber-600">
                        ℹ️
                      </span>

                      <p className="text-xs font-medium leading-5 text-amber-800">
                        {otpNotice}
                      </p>

                    </div>
                  )}

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
                    className="mt-3 w-full text-center text-xs font-semibold text-[#57923d] hover:underline"
                  >
                    ← Change Email
                  </button>

                </form>
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