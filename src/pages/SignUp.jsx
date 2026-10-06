import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import CenteredModal from "../components/common/CenteredModal.jsx";
import useFinance from "../context/useFinance.js";
import { setAuthSession } from "../utils/authStorage.js";

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
  RefreshCw,
} from "lucide-react";

// ==========================================================
// BACKEND API URL
// ==========================================================

const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:5000" : "")
).replace(/\/+$/, "");

const getApiUrl = (path) => {
  if (!API_URL) {
    throw new Error(
      "VITE_API_URL is not configured. Please configure it in Render Environment Variables and redeploy."
    );
  }

  return `${API_URL}${path}`;
};

// ==========================================================
// INDIAN STATES AND RELATED CITIES
// ==========================================================

const stateCities = {
  "Andhra Pradesh": [
    "Visakhapatnam",
    "Vijayawada",
    "Guntur",
    "Nellore",
    "Tirupati",
    "Kurnool",
  ],

  "Arunachal Pradesh": [
    "Itanagar",
    "Tawang",
    "Naharlagun",
    "Pasighat",
  ],

  Assam: [
    "Guwahati",
    "Dibrugarh",
    "Silchar",
    "Jorhat",
    "Tezpur",
  ],

  Bihar: [
    "Patna",
    "Gaya",
    "Muzaffarpur",
    "Bhagalpur",
    "Darbhanga",
  ],

  Chhattisgarh: [
    "Raipur",
    "Bhilai",
    "Bilaspur",
    "Korba",
    "Durg",
  ],

  Goa: [
    "Panaji",
    "Margao",
    "Vasco da Gama",
    "Mapusa",
  ],

  Gujarat: [
    "Ahmedabad",
    "Bhavnagar",
    "Gandhinagar",
    "Rajkot",
    "Surat",
    "Vadodara",
    "Jamnagar",
    "Junagadh",
    "Gariyadhar",
  ],

  Haryana: [
    "Gurugram",
    "Faridabad",
    "Panipat",
    "Ambala",
    "Hisar",
    "Karnal",
  ],

  "Himachal Pradesh": [
    "Shimla",
    "Manali",
    "Dharamshala",
    "Solan",
    "Mandi",
  ],

  Jharkhand: [
    "Ranchi",
    "Jamshedpur",
    "Dhanbad",
    "Bokaro",
    "Deoghar",
  ],

  Karnataka: [
    "Bengaluru",
    "Mysuru",
    "Mangaluru",
    "Hubballi",
    "Belagavi",
    "Davangere",
  ],

  Kerala: [
    "Thiruvananthapuram",
    "Kochi",
    "Kozhikode",
    "Kollam",
    "Thrissur",
    "Kannur",
  ],

  "Madhya Pradesh": [
    "Bhopal",
    "Indore",
    "Jabalpur",
    "Gwalior",
    "Ujjain",
    "Sagar",
  ],

  Maharashtra: [
    "Mumbai",
    "Pune",
    "Nagpur",
    "Nashik",
    "Thane",
    "Aurangabad",
    "Kolhapur",
  ],

  Manipur: [
    "Imphal",
    "Thoubal",
    "Bishnupur",
  ],

  Meghalaya: [
    "Shillong",
    "Tura",
    "Jowai",
  ],

  Mizoram: [
    "Aizawl",
    "Lunglei",
    "Champhai",
  ],

  Nagaland: [
    "Kohima",
    "Dimapur",
    "Mokokchung",
  ],

  Odisha: [
    "Bhubaneswar",
    "Cuttack",
    "Rourkela",
    "Berhampur",
    "Puri",
    "Sambalpur",
  ],

  Punjab: [
    "Amritsar",
    "Ludhiana",
    "Jalandhar",
    "Patiala",
    "Bathinda",
  ],

  Rajasthan: [
    "Jaipur",
    "Jodhpur",
    "Udaipur",
    "Kota",
    "Ajmer",
    "Bikaner",
  ],

  Sikkim: [
    "Gangtok",
    "Namchi",
    "Gyalshing",
  ],

  "Tamil Nadu": [
    "Chennai",
    "Coimbatore",
    "Madurai",
    "Salem",
    "Tiruchirappalli",
    "Tirunelveli",
  ],

  Telangana: [
    "Hyderabad",
    "Warangal",
    "Nizamabad",
    "Karimnagar",
    "Khammam",
  ],

  Tripura: [
    "Agartala",
    "Udaipur",
    "Dharmanagar",
  ],

  "Uttar Pradesh": [
    "Lucknow",
    "Kanpur",
    "Agra",
    "Varanasi",
    "Prayagraj",
    "Noida",
    "Ghaziabad",
    "Meerut",
  ],

  Uttarakhand: [
    "Dehradun",
    "Haridwar",
    "Rishikesh",
    "Nainital",
    "Haldwani",
  ],

  "West Bengal": [
    "Kolkata",
    "Howrah",
    "Durgapur",
    "Siliguri",
    "Asansol",
  ],

  "Andaman and Nicobar Islands": [
    "Port Blair",
  ],

  Chandigarh: [
    "Chandigarh",
  ],

  "Dadra and Nagar Haveli and Daman and Diu": [
    "Daman",
    "Diu",
    "Silvassa",
  ],

  Delhi: [
    "New Delhi",
    "Delhi",
  ],

  "Jammu and Kashmir": [
    "Srinagar",
    "Jammu",
    "Anantnag",
    "Baramulla",
  ],

  Ladakh: [
    "Leh",
    "Kargil",
  ],

  Lakshadweep: [
    "Kavaratti",
    "Agatti",
  ],

  Puducherry: [
    "Puducherry",
    "Karaikal",
    "Yanam",
    "Mahe",
  ],
};

const states = Object.keys(stateCities);

// ==========================================================
// SIGN UP COMPONENT
// ==========================================================

function SignUp() {
  // ==========================================================
  // NAVIGATION & CONTEXT
  // ==========================================================

  const navigate = useNavigate();
  const location = useLocation();
  const { setUserData } = useFinance();

  // ==========================================================
  // STATE
  // ==========================================================

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const [authModal, setAuthModal] = useState({
    isOpen: false,
    title: "Authentication Notice",
    message: "",
    iconType: "info",
  });

  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    title: "",
    message: "",
  });

  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "",
    mobileNumber: "",
    state: "",
    city: "",
    email: location.state?.initialEmail || "",
  });

  // ==========================================================
  // GOOGLE IDENTITY SERVICES INITIALIZATION
  // ==========================================================

  useEffect(() => {
    if (location.state?.initialEmail) {
      setFormData((prev) => ({
        ...prev,
        email: location.state.initialEmail,
      }));
    }

    const googleClientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      (typeof window !== "undefined" &&
        window.__GOOGLE_CLIENT_ID__);

    const scriptId = "google-gsi-client-script";

    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");

      script.id = scriptId;
      script.src =
        "https://accounts.google.com/gsi/client";

      script.async = true;
      script.defer = true;

      script.onload = () => {
        if (
          googleClientId &&
          window.google?.accounts?.id
        ) {
          try {
            window.google.accounts.id.initialize({
              client_id: googleClientId,

              callback: (response) => {
                if (response?.credential) {
                  completeGoogleSignUp({
                    credential: response.credential,
                  });
                }
              },

              auto_select: false,
              cancel_on_tap_outside: true,
            });
          } catch (initErr) {
            console.warn(
              "[AUTH] GSI initialization warning:",
              initErr
            );
          }
        }
      };

      document.body.appendChild(script);
    }
  }, [location.state]);

  // ==========================================================
  // COMPLETE GOOGLE SIGN UP
  // ==========================================================

  const completeGoogleSignUp = async (payload) => {
    try {
      setIsGoogleSubmitting(true);
      setServerError("");

      const response = await fetch(
        getApiUrl("/api/auth/google"),
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            ...payload,
            intent: "signup",
          }),
        }
      );

      const text = await response.text();

      let data = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {
          message:
            "The server returned an invalid response.",
        };
      }

      if (!response.ok) {
        const errorMsg =
          data.message ||
          "Google authentication could not be completed. Please try again.";

        setAuthModal({
          isOpen: true,
          title: "Google Registration",
          message: errorMsg,
          iconType: "error",
        });

        return;
      }

      if (data.alreadyRegistered) {
        setSuccessModal({
          isOpen: true,
          title: "Account Already Registered",
          message:
            data.message ||
            "An account with this Google email already exists. Please sign in.",
        });

        return;
      }

      setSuccessModal({
        isOpen: true,
        title: "Registration Successful",
        message:
          data.message ||
          "Your FinanceOS account has been created successfully via Google. Please sign in to continue.",
      });
    } catch (error) {
      console.error(
        "[AUTH] Google registration error:",
        error
      );

      setAuthModal({
        isOpen: true,
        title: "Google Registration",
        message:
          error?.message ||
          "Google authentication could not be completed. Please try again.",
        iconType: "error",
      });
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  // ==========================================================
  // HANDLE GOOGLE SIGN UP CLICK
  // ==========================================================

  const handleGoogleSignUp = () => {
    setServerError("");

    const googleClientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      (typeof window !== "undefined" &&
        window.__GOOGLE_CLIENT_ID__);

    if (!googleClientId) {
      console.warn(
        "[AUTH] VITE_GOOGLE_CLIENT_ID is not configured in environment."
      );

      setAuthModal({
        isOpen: true,
        title: "Google Registration",
        message:
          "Google Sign-In could not be completed. Please try again.",
        iconType: "error",
      });

      return;
    }

    if (!window.google?.accounts) {
      setAuthModal({
        isOpen: true,
        title: "Google Registration",
        message:
          "Google authentication service is still loading. Please try again in a moment.",
        iconType: "info",
      });

      return;
    }

    setIsGoogleSubmitting(true);

    try {
      if (window.google.accounts.oauth2) {
        const tokenClient =
          window.google.accounts.oauth2.initTokenClient({
            client_id: googleClientId,

            scope: "openid email profile",

            callback: async (tokenResponse) => {
              if (
                tokenResponse &&
                tokenResponse.access_token
              ) {
                await completeGoogleSignUp({
                  accessToken:
                    tokenResponse.access_token,
                });
              } else {
                setIsGoogleSubmitting(false);
              }
            },

            error_callback: (err) => {
              console.error(
                "[AUTH] Google OAuth popup error:",
                err
              );

              setIsGoogleSubmitting(false);

              setAuthModal({
                isOpen: true,
                title: "Google Registration",
                message:
                  "Google Sign-In could not be completed. Please try again.",
                iconType: "error",
              });
            },
          });

        tokenClient.requestAccessToken();
      } else if (window.google.accounts.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,

          callback: (response) => {
            if (response?.credential) {
              completeGoogleSignUp({
                credential: response.credential,
              });
            } else {
              setIsGoogleSubmitting(false);
            }
          },
        });

        window.google.accounts.id.prompt(
          (notification) => {
            if (
              notification.isNotDisplayed() ||
              notification.isSkippedMoment()
            ) {
              setIsGoogleSubmitting(false);
            }
          }
        );
      }
    } catch (err) {
      console.error(
        "[AUTH] Google sign up trigger error:",
        err
      );

      setIsGoogleSubmitting(false);

      setAuthModal({
        isOpen: true,
        title: "Google Registration",
        message:
          "Google Sign-In could not be completed. Please try again.",
        iconType: "error",
      });
    }
  };

  // ==========================================================
  // HANDLE INPUT CHANGE
  // ==========================================================

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    let newValue = value;

    // ========================================================
    // MOBILE NUMBER
    // ========================================================

    if (name === "mobileNumber") {
      newValue = value
        .replace(/\D/g, "")
        .slice(0, 10);
    }

    // ========================================================
    // STATE CHANGE
    // ========================================================

    if (name === "state") {
      setFormData((prev) => ({
        ...prev,
        state: newValue,
        city: "",
      }));

      setErrors((prev) => {
        const updatedErrors = {
          ...prev,
        };

        delete updatedErrors.state;
        delete updatedErrors.city;

        return updatedErrors;
      });

      if (serverError) {
        setServerError("");
      }

      return;
    }

    // ========================================================
    // NORMAL FIELD CHANGE
    // ========================================================

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    if (serverError) {
      setServerError("");
    }

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

    const nameRegex =
      /^[A-Za-z\s]+$/;

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const mobileRegex =
      /^[0-9]{10}$/;

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
      const selectedDate =
        new Date(
          `${formData.dateOfBirth}T00:00:00`
        );

      const today = new Date();

      today.setHours(
        0,
        0,
        0,
        0
      );

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

    if (
      !formData.mobileNumber.trim()
    ) {
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
    // STATE
    // ========================================================

    if (!formData.state) {
      newErrors.state =
        "Please select a state.";
    } else if (
      !states.includes(
        formData.state
      )
    ) {
      newErrors.state =
        "Please select a valid state.";
    }

    // ========================================================
    // CITY
    // ========================================================

    if (!formData.city) {
      newErrors.city =
        "Please select a city.";
    } else if (
      !stateCities[
        formData.state
      ]?.includes(
        formData.city
      )
    ) {
      newErrors.city =
        "Please select a valid city for the selected state.";
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

    return (
      Object.keys(newErrors).length === 0
    );
  };

  // ==========================================================
  // HANDLE SUBMIT
  // ==========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setServerError("");

    const isValid =
      validateForm();

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

      state:
        formData.state,

      city:
        formData.city,

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

      console.log(
        "[AUTH] Signup API:",
        getApiUrl("/api/auth/signup")
      );

      const response = await fetch(
        getApiUrl("/api/auth/signup"),
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(
            registrationData
          ),
        }
      );

      // ======================================================
      // SAFE RESPONSE PARSING
      // ======================================================

      const text =
        await response.text();

      let data = {};

      try {
        data = text
          ? JSON.parse(text)
          : {};
      } catch (parseError) {
        console.error(
          "[AUTH] Invalid JSON response:",
          text
        );

        data = {
          message:
            "The server returned an invalid response.",
        };
      }

      console.log(
        "[AUTH] Signup response:",
        response.status,
        data
      );

      // ======================================================
      // BACKEND ERROR
      // ======================================================

      if (!response.ok) {
        const errorMsg =
          data.message ||
          "Unable to create your account.";

        setServerError(
          errorMsg
        );

        setAuthModal({
          isOpen: true,
          title: "Registration Failed",
          message: errorMsg,
          iconType: "error",
        });

        return;
      }

      // ======================================================
      // SUCCESS
      // ======================================================

      setSuccessModal({
        isOpen: true,
        title:
          "Account Created Successfully",

        message:
          data.message ||
          "Your FinanceOS account has been created successfully. Please sign in to continue.",
      });
    } catch (error) {
      console.error(
        "[AUTH] Signup request failed:",
        error
      );

      const errorMsg =
        error?.message ||
        "Unable to connect to the FinanceOS server. Make sure the backend is running.";

      setServerError(
        errorMsg
      );

      setAuthModal({
        isOpen: true,
        title: "Connection Error",
        message: errorMsg,
        iconType: "error",
      });
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

            <div className="absolute -left-28 -top-28 h-72 w-72 rounded-full bg-[#dcefc2]/60" />

            <div className="absolute -bottom-36 -right-24 h-80 w-80 rounded-full bg-[#dcefc2]/60" />

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

            <div className="relative z-10 mt-5">

              <div className="rounded-[22px] border border-[#d7e3d0] bg-white/85 p-5 shadow-sm backdrop-blur">

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

                <AccountStep
                  icon={<Users size={17} />}
                  title="Personal Information"
                  text="Your basic profile details"
                />

                <Connector />

                <AccountStep
                  icon={<Mail size={17} />}
                  title="Account Information"
                  text="Your FinanceOS sign-in email"
                />

                <Connector />

                <AccountStep
                  icon={<Mail size={17} />}
                  title="Email OTP Login"
                  text="Secure passwordless access"
                />

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
                className="mt-1.5 shrink-0"
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

                {/* STATE + CITY */}

                <div className="mt-2 grid grid-cols-2 gap-3">

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
                        className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[#87958c]"
                      />

                      <select
                        id="state"
                        name="state"
                        value={
                          formData.state
                        }
                        onChange={
                          handleChange
                        }
                        autoComplete="address-level1"
                        className={`${inputClass(
                          "state"
                        )} pl-9 pr-3`}
                      >

                        <option value="">
                          Select State
                        </option>

                        {states.map(
                          (state) => (
                            <option
                              key={state}
                              value={state}
                            >
                              {state}
                            </option>
                          )
                        )}

                      </select>

                    </div>

                  </div>

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

                      <select
                        id="city"
                        name="city"
                        value={
                          formData.city
                        }
                        onChange={
                          handleChange
                        }
                        disabled={
                          !formData.state
                        }
                        autoComplete="address-level2"
                        className={`${inputClass(
                          "city"
                        )} pl-9 pr-3 ${
                          !formData.state
                            ? "cursor-not-allowed bg-[#f1f3ef] text-[#9aa69e]"
                            : ""
                        }`}
                      >

                        <option value="">
                          {formData.state
                            ? "Select City"
                            : "Select State First"}
                        </option>

                        {formData.state &&
                          stateCities[
                            formData.state
                          ]?.map(
                            (city) => (
                              <option
                                key={city}
                                value={city}
                              >
                                {city}
                              </option>
                            )
                          )}

                      </select>

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

                {/* SAVE & CONTINUE */}

                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    isGoogleSubmitting
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
                    ? "Saving..."
                    : "Save & Continue"}

                  {!isSubmitting && (
                    <ArrowRight size={16} />
                  )}

                </button>

              </form>

              {/* GOOGLE SIGN UP */}

              <div className="mt-2.5 space-y-2 shrink-0">

                {/* DIVIDER */}

                <div className="flex items-center gap-3 py-0.5">

                  <div className="h-px flex-1 bg-[#e1e7dc]" />

                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#829589]">
                    or
                  </span>

                  <div className="h-px flex-1 bg-[#e1e7dc]" />

                </div>

                {/* GOOGLE BUTTON */}

                <button
                  type="button"
                  onClick={
                    handleGoogleSignUp
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
                    py-2.5
                    text-xs
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
                      size={15}
                      className="animate-spin text-[#57923d]"
                    />
                  ) : (
                    <svg
                      className="h-4 w-4 shrink-0"
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
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />

                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.61 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />

                    </svg>
                  )}

                  <span>
                    {isGoogleSubmitting
                      ? "Connecting..."
                      : "Continue with Google"}
                  </span>

                </button>

              </div>

              {/* SIGN IN */}

              <div className="mt-2.5 border-t border-[#e7ebe4] pt-2 text-center shrink-0">

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

      {/* ======================================================
          AUTH MODAL
      ====================================================== */}

      <CenteredModal
        isOpen={authModal.isOpen}
        title={authModal.title}
        message={authModal.message}
        iconType={authModal.iconType}
        confirmText="OK"
        onClose={() =>
          setAuthModal((prev) => ({
            ...prev,
            isOpen: false,
          }))
        }
      />

      {/* ======================================================
          SUCCESS MODAL
      ====================================================== */}

      <CenteredModal
        isOpen={successModal.isOpen}
        title={successModal.title}
        message={successModal.message}
        type="success"
        confirmText="Sign In"
        onConfirm={() => {
          setSuccessModal({
            isOpen: false,
            title: "",
            message: "",
          });

          navigate("/signin");
        }}
        onClose={() => {
          setSuccessModal({
            isOpen: false,
            title: "",
            message: "",
          });

          navigate("/signin");
        }}
      />

    </div>
  );
}

// ============================================================
// FORM SECTION TITLE
// ============================================================

function FormSectionTitle({ text }) {
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

// ============================================================
// EXPORT
// ============================================================

export default SignUp;