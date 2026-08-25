import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  FileText,
  Landmark,
  PiggyBank,
  Target,
  TrendingUp,
  WalletCards,
} from "lucide-react";


// ============================================================
// HOME PAGE
// ============================================================

function Home() {

  // ==========================================================
  // ACTIVE NAVBAR SECTION
  // ==========================================================

  const [activeSection, setActiveSection] = useState("home");


  // ==========================================================
  // DETECT CURRENT SECTION
  // ==========================================================

  useEffect(() => {

    const handleScroll = () => {

      const sections = [
        "home",
        "features",
        "how-it-works",
        "about",
      ];

      const position = window.scrollY + 180;

      let current = "home";

      sections.forEach((id) => {

        const section = document.getElementById(id);

        if (section && section.offsetTop <= position) {
          current = id;
        }

      });

      setActiveSection(current);
    };


    window.addEventListener("scroll", handleScroll);

    handleScroll();


    return () => {
      window.removeEventListener("scroll", handleScroll);
    };

  }, []);


  // ==========================================================
  // NAVBAR ACTIVE STYLE
  // ==========================================================

  const navLinkClass = (section) => {

    const isActive = activeSection === section;

    return `
      relative
      py-2
      text-sm
      font-semibold
      transition-colors
      duration-300

      ${
        isActive
          ? "text-[#57923d]"
          : "text-[#617268] hover:text-[#57923d]"
      }

      after:absolute
      after:left-0
      after:-bottom-1
      after:h-[2px]
      after:rounded-full
      after:bg-[#57923d]
      after:transition-all
      after:duration-300

      ${isActive ? "after:w-full" : "after:w-0"}
    `;

  };


  return (

    <div className="min-h-screen bg-[#f8faf6] text-[#173b2b]">


      {/* ======================================================
          NAVBAR
      ====================================================== */}

      <header className="sticky top-0 z-50 border-b border-[#e1e7dc] bg-white/95 backdrop-blur">

        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-6 lg:px-8">


          {/* LOGO */}

          <a
            href="#home"
            className="flex items-center gap-3"
          >

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf7df]">

              <TrendingUp
                size={21}
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

          </a>



          {/* ==================================================
              NAVIGATION
          ================================================== */}

          <nav className="hidden items-center gap-9 md:flex">

            <a
              href="#home"
              className={navLinkClass("home")}
            >
              Home
            </a>


            <a
              href="#features"
              className={navLinkClass("features")}
            >
              Features
            </a>


            <a
              href="#how-it-works"
              className={navLinkClass("how-it-works")}
            >
              How It Works
            </a>


            <a
              href="#about"
              className={navLinkClass("about")}
            >
              About Us
            </a>

          </nav>



          {/* ==================================================
              AUTHENTICATION BUTTONS
          ================================================== */}

          <div className="flex items-center gap-3">

            <Link
              to="/signin"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-[#4f713f] transition hover:bg-[#f1f6ed]"
            >
              Sign In
            </Link>


            <Link
              to="/signup"
              className="rounded-xl bg-[#dff5b5] px-5 py-2.5 text-sm font-semibold text-[#173b2b] transition hover:bg-[#d2efa0]"
            >
              Get Started
            </Link>

          </div>

        </div>

      </header>



      <main>


        {/* ======================================================
            HOME / HERO SECTION
        ====================================================== */}

        <section
          id="home"
          className="scroll-mt-[68px] overflow-hidden"
        >

          <div className="mx-auto grid min-h-[calc(100vh-68px)] max-w-7xl items-center gap-14 px-6 py-16 lg:grid-cols-2 lg:px-8">


            {/* ==================================================
                HERO LEFT
            ================================================== */}

            <div>

              <div className="inline-flex items-center gap-2 rounded-full border border-[#dce8d4] bg-[#f0f7e9] px-4 py-2">

                <TrendingUp
                  size={15}
                  className="text-[#57923d]"
                />

                <span className="text-xs font-semibold text-[#57923d]">
                  Your Personal Finance Operating System
                </span>

              </div>


              <h1 className="mt-6 max-w-xl text-5xl font-bold leading-[1.1] tracking-tight text-[#173b2b] lg:text-6xl">

                Your finances.

                <span className="block text-[#57923d]">
                  One connected system.
                </span>

              </h1>


              <p className="mt-6 max-w-xl text-base leading-7 text-[#687a70]">

                Bring your monthly finances, savings, goals,
                investments and financial commitments together
                to understand your complete financial position.

              </p>



              {/* GET STARTED */}

              <div className="mt-8">

                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#dff5b5] px-6 py-3 text-sm font-semibold text-[#173b2b] transition hover:bg-[#d2efa0]"
                >

                  Get Started

                  <ArrowRight size={17} />

                </Link>

              </div>



              {/* HERO POINTS */}

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">

                <HeroPoint
                  text="Organized Financial View"
                />

                <HeroPoint
                  text="Smart Planning"
                />

                <HeroPoint
                  text="Financial Insights"
                />

              </div>

            </div>



            {/* ==================================================
                HERO RIGHT
            ================================================== */}

            <div className="relative">


              {/* BACKGROUND SHAPES */}

              <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#e6f4cf]" />

              <div className="absolute -bottom-20 -left-16 h-72 w-72 rounded-full bg-[#edf5e8]" />



              {/* OVERVIEW PANEL */}

              <div className="relative rounded-[28px] border border-[#dbe5d5] bg-white p-6 shadow-[0_25px_70px_rgba(55,85,60,0.12)]">


                {/* HEADER */}

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#78906f]">
                      Financial Overview
                    </p>

                    <h3 className="mt-1 text-xl font-bold text-[#173b2b]">
                      Everything in one place
                    </h3>

                  </div>


                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf5e8]">

                    <BarChart3
                      size={21}
                      className="text-[#57923d]"
                    />

                  </div>

                </div>



                {/* OVERVIEW CARDS */}

                <div className="mt-6 grid grid-cols-2 gap-4">

                  <OverviewCard
                    icon={<Landmark size={18} />}
                    title="Monthly Finance"
                    text="Income, expenses and monthly savings."
                  />


                  <OverviewCard
                    icon={<PiggyBank size={18} />}
                    title="Savings"
                    text="Understand your saving capacity."
                  />


                  <OverviewCard
                    icon={<WalletCards size={18} />}
                    title="Commitments"
                    text="Keep financial obligations organized."
                  />


                  <OverviewCard
                    icon={<Target size={18} />}
                    title="Saving Goals"
                    text="Plan goals based on your finances."
                  />

                </div>



                {/* CONNECTED VIEW */}

                <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#e7f3d8] px-5 py-4">

                  <div>

                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#71866a]">
                      Connected View
                    </p>

                    <p className="mt-1 font-semibold text-[#173b2b]">
                      Your Financial Position
                    </p>

                  </div>


                  <TrendingUp
                    size={22}
                    className="text-[#57923d]"
                  />

                </div>

              </div>

            </div>

          </div>

        </section>



        {/* ======================================================
            FEATURES
        ====================================================== */}

        <section
          id="features"
          className="scroll-mt-[68px] border-y border-[#e5ebe1] bg-white py-24"
        >

          <div className="mx-auto max-w-7xl px-6 lg:px-8">


            <SectionHeader
              small="Features"
              title="Your financial life, connected."
              description="FinanceOS brings important financial information together so you can track, understand and plan your finances from one system."
            />



            {/* FEATURE GRID */}

            <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">


              <FeatureCard
                icon={<Landmark size={21} />}
                title="Monthly Finance"
                description="Record monthly income and expenses and understand how much you save each month."
              />


              <FeatureCard
                icon={<Target size={21} />}
                title="Saving Goals"
                description="Create financial goals and understand whether your available savings can support them."
              />


              <FeatureCard
                icon={<WalletCards size={21} />}
                title="Plans & Commitments"
                description="Organize investments, insurance, loans and other ongoing financial commitments."
              />


              <FeatureCard
                icon={<CalendarDays size={21} />}
                title="Financial Calendar"
                description="Bring payment dates, contributions, maturities and goal deadlines into one calendar."
              />


              <FeatureCard
                icon={<FileText size={21} />}
                title="Financial Reports"
                description="Review financial summaries and understand how your financial position changes over time."
              />


              <FeatureCard
                icon={<BarChart3 size={21} />}
                title="Financial Insights"
                description="Understand savings, obligations and your overall financial position."
              />

            </div>

          </div>

        </section>



        {/* ======================================================
            HOW IT WORKS
        ====================================================== */}

        <section
          id="how-it-works"
          className="scroll-mt-[68px] bg-[#f8faf6] py-24"
        >

          <div className="mx-auto max-w-7xl px-6 lg:px-8">


            <SectionHeader
              small="How It Works"
              title="From financial data to a clearer picture."
              description="FinanceOS organizes different parts of your finances into one connected financial workflow."
            />



            {/* STEPS */}

            <div className="mt-16 grid gap-5 lg:grid-cols-4">


              <StepCard
                number="01"
                title="Create Account"
                description="Create your personal FinanceOS account and access your financial workspace."
              />


              <StepCard
                number="02"
                title="Add Your Finances"
                description="Enter your monthly finances, goals, investments and financial commitments."
              />


              <StepCard
                number="03"
                title="FinanceOS Connects It"
                description="The system organizes your information and calculates your financial position."
              />


              <StepCard
                number="04"
                title="Track & Plan"
                description="Review insights, upcoming obligations, goals and reports to plan your finances."
              />

            </div>

          </div>

        </section>



        {/* ======================================================
            ABOUT FINANCEOS
        ====================================================== */}

        <section
          id="about"
          className="scroll-mt-[68px] border-y border-[#e5ebe1] bg-white py-24"
        >

          <div className="mx-auto max-w-7xl px-6 lg:px-8">


            {/* ==================================================
                ABOUT HEADER
            ================================================== */}

            <div className="mx-auto max-w-3xl text-center">

              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#65934f]">
                About FinanceOS
              </p>


              <h2 className="mt-3 text-4xl font-bold leading-tight text-[#173b2b] lg:text-5xl">

                A clearer way to understand

                <span className="block text-[#57923d]">
                  your financial life.
                </span>

              </h2>


              <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#6d7d73]">

                FinanceOS is a Personal Finance Operating System
                designed to bring monthly finances, savings, goals,
                investments and financial commitments together
                into one connected system.

              </p>

            </div>



            {/* ==================================================
                ABOUT INFORMATION CARDS
            ================================================== */}

            <div className="mt-14 grid gap-5 md:grid-cols-3">


              {/* WHY FINANCEOS */}

              <AboutCard
                icon={
                  <WalletCards
                    size={22}
                    className="text-[#57923d]"
                  />
                }
                label="Why FinanceOS?"
                title="Financial information is scattered."
                description="Income, expenses, savings, investments, insurance, liabilities and financial goals are often tracked separately, making it difficult to understand the complete financial picture."
              />



              {/* OUR PURPOSE */}

              <AboutCard
                icon={
                  <Target
                    size={22}
                    className="text-[#57923d]"
                  />
                }
                label="Our Purpose"
                title="Turn financial data into clarity."
                description="FinanceOS connects important financial information so users can understand where they stand today, monitor their commitments and plan their financial future more effectively."
                highlighted
              />



              {/* DIFFERENCE */}

              <AboutCard
                icon={
                  <TrendingUp
                    size={22}
                    className="text-[#57923d]"
                  />
                }
                label="What Makes It Different?"
                title="More than expense tracking."
                description="FinanceOS focuses on your overall financial position, monthly savings, goals, investments, obligations, important financial dates and long-term financial planning."
              />

            </div>



            {/* ==================================================
                CONNECTED SYSTEM
            ================================================== */}

            <div className="mt-16 overflow-hidden rounded-[30px] border border-[#dce5d7] bg-[#f5f9f1]">


              {/* CONNECTED SYSTEM HEADER */}

              <div className="border-b border-[#dce5d7] px-7 py-7 text-center">

                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#65934f]">
                  One Connected System
                </p>


                <h3 className="mt-2 text-2xl font-bold text-[#173b2b]">
                  How FinanceOS connects your finances
                </h3>


                <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[#718177]">

                  Different parts of your financial life work
                  together to build one overall financial position.

                </p>

              </div>



              {/* ==================================================
                  FINANCE CONNECTION AREA
              ================================================== */}

              <div className="px-6 py-9 lg:px-10">


                {/* FINANCIAL COMPONENTS */}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">


                  <FinanceConnectionCard
                    icon={<Landmark size={20} />}
                    title="Monthly Finance"
                    text="Income & Expenses"
                  />


                  <FinanceConnectionCard
                    icon={<PiggyBank size={20} />}
                    title="Savings"
                    text="Saving Capacity"
                  />


                  <FinanceConnectionCard
                    icon={<Target size={20} />}
                    title="Goals"
                    text="Future Planning"
                  />


                  <FinanceConnectionCard
                    icon={<TrendingUp size={20} />}
                    title="Investments"
                    text="Financial Growth"
                  />


                  <FinanceConnectionCard
                    icon={<WalletCards size={20} />}
                    title="Commitments"
                    text="Financial Obligations"
                  />

                </div>



                {/* DOWN CONNECTION */}

                <ConnectionArrow />



                {/* ==================================================
                    FINANCEOS CENTER
                ================================================== */}

                <div className="mx-auto max-w-2xl rounded-[24px] border border-[#c8dab9] bg-white p-6 shadow-sm">

                  <div className="flex flex-col items-center text-center">


                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e7f3d8]">

                      <TrendingUp
                        size={23}
                        className="text-[#57923d]"
                      />

                    </div>


                    <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.16em] text-[#78906f]">
                      FinanceOS
                    </p>


                    <h4 className="mt-1 text-xl font-bold text-[#173b2b]">
                      Your Personal Finance Operating System
                    </h4>


                    <p className="mt-2 max-w-lg text-sm leading-6 text-[#718177]">

                      FinanceOS organizes your financial information,
                      connects related components and helps you
                      understand your complete financial position.

                    </p>

                  </div>

                </div>



                {/* DOWN CONNECTION */}

                <ConnectionArrow />



                {/* ==================================================
                    FINAL RESULT
                ================================================== */}

                <div className="mx-auto max-w-3xl rounded-[24px] bg-[#e4f1d3] px-7 py-6">

                  <div className="flex flex-col items-center justify-between gap-5 sm:flex-row">


                    <div>

                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#71866a]">
                        Result
                      </p>


                      <h4 className="mt-1 text-xl font-bold text-[#173b2b]">
                        Your Overall Financial Position
                      </h4>


                      <p className="mt-1 text-sm text-[#627466]">
                        One connected view of where your finances stand.
                      </p>

                    </div>



                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/70">

                      <BarChart3
                        size={23}
                        className="text-[#57923d]"
                      />

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>



        {/* ======================================================
            FINAL CALL TO ACTION
        ====================================================== */}

        <section className="bg-[#f8faf6] py-20">

          <div className="mx-auto max-w-5xl px-6">

            <div className="relative overflow-hidden rounded-[30px] bg-[#e7f3d8] px-8 py-14 text-center">


              {/* DECORATION */}

              <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-white/30" />

              <div className="absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-white/30" />



              <div className="relative">

                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#65934f]">
                  Start With FinanceOS
                </p>


                <h2 className="mx-auto mt-3 max-w-2xl text-4xl font-bold text-[#173b2b]">
                  Build a clearer view of your financial life.
                </h2>


                <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#65786d]">

                  Create your account and start bringing your
                  finances together.

                </p>



                <div className="mt-7 flex flex-wrap justify-center gap-3">


                  <Link
                    to="/signup"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#173b2b] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#244f3b]"
                  >

                    Create Account

                    <ArrowRight size={17} />

                  </Link>


                  <Link
                    to="/signin"
                    className="rounded-xl border border-[#c8d9bb] bg-white/70 px-6 py-3 text-sm font-semibold text-[#173b2b] transition hover:bg-white"
                  >
                    Sign In
                  </Link>

                </div>

              </div>

            </div>

          </div>

        </section>

      </main>



      {/* ======================================================
          NEW PROFESSIONAL FOOTER
      ====================================================== */}

      <footer className="border-t border-[#dfe7da] bg-[#173b2b] text-white">

        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">


          {/* ==================================================
              FOOTER MAIN CONTENT
          ================================================== */}

          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">


            {/* ==================================================
                BRAND
            ================================================== */}

            <div className="lg:col-span-2">

              <a
                href="#home"
                className="inline-flex items-center gap-3"
              >

                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e7f3d8]">

                  <TrendingUp
                    size={21}
                    className="text-[#57923d]"
                  />

                </div>


                <div>

                  <p className="text-xl font-bold tracking-tight text-[#e7f3d8]">
                    FinanceOS
                  </p>

                  <p className="text-[9px] font-medium tracking-wide text-[#b7c8b8]">
                    Manage Today, Secure Tomorrow
                  </p>

                </div>

              </a>


              <p className="mt-5 max-w-md text-sm leading-6 text-[#c4d2c5]">

                A Personal Finance Operating System that brings
                your monthly finances, savings, goals, investments
                and financial commitments together in one connected system.

              </p>


              {/* TAG */}

              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#456451] bg-[#244f3b] px-3 py-1.5">

                <CheckCircle2
                  size={14}
                  className="text-[#b7d89d]"
                />

                <span className="text-xs font-medium text-[#d7e5d3]">
                  One connected financial view
                </span>

              </div>

            </div>



            {/* ==================================================
                PRODUCT
            ================================================== */}

            <div>

              <h3 className="text-sm font-bold text-white">
                Product
              </h3>


              <div className="mt-5 flex flex-col gap-3">

                <a
                  href="#features"
                  className="text-sm text-[#b9c9ba] transition hover:text-[#dff5b5]"
                >
                  Features
                </a>


                <a
                  href="#how-it-works"
                  className="text-sm text-[#b9c9ba] transition hover:text-[#dff5b5]"
                >
                  How It Works
                </a>


                <a
                  href="#about"
                  className="text-sm text-[#b9c9ba] transition hover:text-[#dff5b5]"
                >
                  About FinanceOS
                </a>


                <Link
                  to="/signup"
                  className="text-sm text-[#b9c9ba] transition hover:text-[#dff5b5]"
                >
                  Get Started
                </Link>

              </div>

            </div>



            {/* ==================================================
                ACCOUNT
            ================================================== */}

            <div>

              <h3 className="text-sm font-bold text-white">
                Account
              </h3>


              <div className="mt-5 flex flex-col gap-3">

                <Link
                  to="/signin"
                  className="text-sm text-[#b9c9ba] transition hover:text-[#dff5b5]"
                >
                  Sign In
                </Link>


                <Link
                  to="/signup"
                  className="text-sm text-[#b9c9ba] transition hover:text-[#dff5b5]"
                >
                  Create Account
                </Link>

              </div>


              {/* QUICK ACTION */}

              <Link
                to="/signup"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#dff5b5] px-4 py-2.5 text-xs font-bold text-[#173b2b] transition hover:bg-[#cfeaa4]"
              >

                Start With FinanceOS

                <ArrowRight size={14} />

              </Link>

            </div>

          </div>



          {/* ==================================================
              DIVIDER
          ================================================== */}

          <div className="my-10 h-px bg-[#355642]" />



          {/* ==================================================
            FOOTER BOTTOM
        ================================================== */}

        <div className="flex justify-center text-xs">

          <p className="text-center text-[#9fb3a2]">
            © 2026 FinanceOS. All rights reserved.
          </p>

        </div>

        </div>

      </footer>

    </div>

  );

}


// ============================================================
// HERO POINT
// ============================================================

function HeroPoint({ text }) {

  return (

    <div className="flex items-center gap-2">

      <CheckCircle2
        size={16}
        className="text-[#6c9d52]"
      />

      <span className="text-xs text-[#65786d]">
        {text}
      </span>

    </div>

  );

}


// ============================================================
// SECTION HEADER
// ============================================================

function SectionHeader({
  small,
  title,
  description,
}) {

  return (

    <div className="mx-auto max-w-2xl text-center">

      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#65934f]">
        {small}
      </p>


      <h2 className="mt-3 text-4xl font-bold text-[#173b2b]">
        {title}
      </h2>


      <p className="mt-4 text-sm leading-6 text-[#6d7d73]">
        {description}
      </p>

    </div>

  );

}


// ============================================================
// OVERVIEW CARD
// ============================================================

function OverviewCard({
  icon,
  title,
  text,
}) {

  return (

    <div className="rounded-2xl border border-[#e1e8dd] bg-[#fafcf8] p-4">

      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#edf5e8] text-[#57923d]">
        {icon}
      </div>


      <p className="mt-3 text-sm font-semibold">
        {title}
      </p>


      <p className="mt-1 text-xs text-[#748379]">
        {text}
      </p>

    </div>

  );

}


// ============================================================
// FEATURE CARD
// ============================================================

function FeatureCard({
  icon,
  title,
  description,
}) {

  return (

    <div className="rounded-2xl border border-[#e0e7dc] bg-[#fbfcfa] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#c8d9bb] hover:shadow-md">

      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf5e8] text-[#57923d]">
        {icon}
      </div>


      <h3 className="mt-5 text-lg font-bold text-[#173b2b]">
        {title}
      </h3>


      <p className="mt-2 text-sm leading-6 text-[#718177]">
        {description}
      </p>

    </div>

  );

}


// ============================================================
// STEP CARD
// ============================================================

function StepCard({
  number,
  title,
  description,
}) {

  return (

    <div className="rounded-2xl border border-[#dfe7da] bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-[#c8d9bb] hover:shadow-md">

      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e7f3d8] text-xs font-bold text-[#57923d]">
        {number}
      </div>


      <h3 className="mt-5 text-lg font-bold text-[#173b2b]">
        {title}
      </h3>


      <p className="mt-2 text-sm leading-6 text-[#718177]">
        {description}
      </p>

    </div>

  );

}


// ============================================================
// ABOUT CARD
// ============================================================

function AboutCard({
  icon,
  label,
  title,
  description,
  highlighted = false,
}) {

  return (

    <div
      className={`
        rounded-[24px]
        border
        border-[#dfe7da]
        p-7
        transition
        duration-300
        hover:-translate-y-1
        hover:border-[#c6d8ba]
        hover:shadow-md

        ${
          highlighted
            ? "bg-[#f2f7ed]"
            : "bg-[#fafcf8]"
        }
      `}
    >

      <div
        className={`
          flex
          h-12
          w-12
          items-center
          justify-center
          rounded-xl

          ${
            highlighted
              ? "bg-white"
              : "bg-[#edf5e8]"
          }
        `}
      >
        {icon}
      </div>


      <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.16em] text-[#78906f]">
        {label}
      </p>


      <h3 className="mt-2 text-xl font-bold text-[#173b2b]">
        {title}
      </h3>


      <p className="mt-3 text-sm leading-6 text-[#718177]">
        {description}
      </p>

    </div>

  );

}


// ============================================================
// FINANCE CONNECTION CARD
// ============================================================

function FinanceConnectionCard({
  icon,
  title,
  text,
}) {

  return (

    <div className="rounded-2xl border border-[#dfe7da] bg-white p-5 text-center transition duration-300 hover:-translate-y-1 hover:border-[#c6d8ba] hover:shadow-sm">

      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf5e8] text-[#57923d]">
        {icon}
      </div>


      <h4 className="mt-3 text-sm font-bold text-[#173b2b]">
        {title}
      </h4>


      <p className="mt-1 text-xs text-[#78877e]">
        {text}
      </p>

    </div>

  );

}


// ============================================================
// CONNECTION ARROW
// ============================================================

function ConnectionArrow() {

  return (

    <div className="my-7 flex items-center justify-center">

      <div className="flex flex-col items-center">

        <div className="h-8 w-px bg-[#b8cca9]" />


        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#c7d9ba] bg-white">

          <ArrowRight
            size={17}
            className="rotate-90 text-[#57923d]"
          />

        </div>

      </div>

    </div>

  );

}


// ============================================================
// EXPORT
// ============================================================

export default Home;