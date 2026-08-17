// ============================================================
// FINANCEOS - ADMIN USER ACTIVITY
// ============================================================

import { useState } from "react";

import {
  Activity,
  FileText,
  LogIn,
  Search,
  UserCheck,
  UserPlus,
} from "lucide-react";

import AdminSidebar from "../components/AdminSidebar.jsx";
import AdminTopbar from "../components/AdminTopbar.jsx";


// ============================================================
// ADMIN ACTIVITY PAGE
// ============================================================

function AdminActivity() {

  // ==========================================================
  // SAMPLE DATA
  // Later this data will come from the backend + MongoDB.
  // ==========================================================

  const activities = [
    {
      id: 1,
      type: "Registration",
      user: "Rahul Patel",
      email: "rahul@example.com",
      description: "Created a new FinanceOS account",
      date: "28 Jul 2026",
      time: "10:42 AM",
    },
    {
      id: 2,
      type: "Sign In",
      user: "Priya Shah",
      email: "priya@example.com",
      description: "Signed in to FinanceOS",
      date: "28 Jul 2026",
      time: "09:18 AM",
    },
    {
      id: 3,
      type: "Report",
      user: "Amit Mehta",
      email: "amit@example.com",
      description: "Generated a financial report",
      date: "27 Jul 2026",
      time: "04:36 PM",
    },
    {
      id: 4,
      type: "Account",
      user: "Neha Joshi",
      email: "neha@example.com",
      description: "Account status changed to Active",
      date: "27 Jul 2026",
      time: "12:14 PM",
    },
    {
      id: 5,
      type: "Sign In",
      user: "Karan Desai",
      email: "karan@example.com",
      description: "Signed in to FinanceOS",
      date: "26 Jul 2026",
      time: "08:52 PM",
    },
    {
      id: 6,
      type: "Registration",
      user: "Riya Desai",
      email: "riya@example.com",
      description: "Created a new FinanceOS account",
      date: "26 Jul 2026",
      time: "03:25 PM",
    },
    {
      id: 7,
      type: "Report",
      user: "Jay Shah",
      email: "jay@example.com",
      description: "Generated a monthly financial report",
      date: "25 Jul 2026",
      time: "06:15 PM",
    },
  ];


  // ==========================================================
  // STATE
  // ==========================================================

  const [search, setSearch] = useState("");

  const [filter, setFilter] = useState("All");


  // ==========================================================
  // FILTER ACTIVITY
  // ==========================================================

  const filteredActivities = activities.filter((item) => {

    const searchValue = search.toLowerCase().trim();

    const matchesSearch =
      item.user.toLowerCase().includes(searchValue) ||
      item.email.toLowerCase().includes(searchValue) ||
      item.description.toLowerCase().includes(searchValue) ||
      item.type.toLowerCase().includes(searchValue);

    const matchesFilter =
      filter === "All" ||
      item.type === filter;

    return matchesSearch && matchesFilter;
  });


  // ==========================================================
  // COUNTS
  // ==========================================================

  const registrationCount = activities.filter(
    (item) => item.type === "Registration"
  ).length;

  const signInCount = activities.filter(
    (item) => item.type === "Sign In"
  ).length;

  const reportCount = activities.filter(
    (item) => item.type === "Report"
  ).length;


  // ==========================================================
  // RETURN
  // ==========================================================

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f9f4]">


      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <div className="shrink-0">
        <AdminSidebar />
      </div>


      {/* ======================================================
          RIGHT SIDE
      ====================================================== */}

      <div className="flex min-w-0 flex-1 flex-col">


        {/* TOPBAR */}

        <AdminTopbar />


        {/* ====================================================
            PAGE CONTENT
        ==================================================== */}

        <main className="flex-1 overflow-y-auto p-6">


          {/* ==================================================
              PAGE HEADING
          ================================================== */}

          <div>

            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#57923d]">
              Administration
            </p>

            <h1 className="mt-1 text-2xl font-bold text-[#173b2b]">
              User Activity
            </h1>

            <p className="mt-1 text-sm text-[#718177]">
              Review recent user and account activity across FinanceOS.
            </p>

          </div>


          {/* ==================================================
              SUMMARY CARDS
          ================================================== */}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">


            {/* TOTAL ACTIVITY */}

            <ActivitySummary
              icon="activity"
              title="Total Activity"
              value={activities.length}
              description="Recorded activity"
            />


            {/* REGISTRATIONS */}

            <ActivitySummary
              icon="registration"
              title="Registrations"
              value={registrationCount}
              description="New user accounts"
            />


            {/* SIGN INS */}

            <ActivitySummary
              icon="signin"
              title="Sign Ins"
              value={signInCount}
              description="User sign-in activity"
            />


            {/* REPORTS */}

            <ActivitySummary
              icon="report"
              title="Reports"
              value={reportCount}
              description="Reports generated"
            />

          </div>


          {/* ==================================================
              ACTIVITY SECTION
          ================================================== */}

          <section className="mt-6 overflow-hidden rounded-2xl border border-[#dfe6da] bg-white">


            {/* =================================================
                SECTION HEADER
            ================================================= */}

            <div className="border-b border-[#e5eae2] px-6 py-5">

              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">


                {/* LEFT */}

                <div>

                  <h2 className="text-lg font-bold text-[#173b2b]">
                    Recent Activity
                  </h2>

                  <p className="mt-1 text-xs text-[#718177]">
                    Track registrations, sign-ins, reports and account changes.
                  </p>

                </div>


                {/* RIGHT */}

                <div className="flex flex-col gap-3 sm:flex-row">


                  {/* ===========================================
                      SEARCH
                  =========================================== */}

                  <div className="relative">

                    <Search
                      size={17}
                      className="
                        absolute
                        left-3
                        top-1/2
                        -translate-y-1/2
                        text-[#829087]
                      "
                    />

                    <input
                      type="text"
                      value={search}
                      onChange={(event) =>
                        setSearch(event.target.value)
                      }
                      placeholder="Search activity..."
                      className="
                        w-full
                        rounded-xl
                        border border-[#dfe6da]
                        bg-[#fbfcfa]
                        py-2.5
                        pl-10
                        pr-4
                        text-sm
                        text-[#173b2b]
                        outline-none
                        transition
                        placeholder:text-[#9ba69f]
                        focus:border-[#9fbd82]
                        focus:ring-2
                        focus:ring-[#edf5e8]
                        sm:w-[260px]
                      "
                    />

                  </div>


                  {/* ===========================================
                      FILTER
                  =========================================== */}

                  <select
                    value={filter}
                    onChange={(event) =>
                      setFilter(event.target.value)
                    }
                    className="
                      rounded-xl
                      border border-[#dfe6da]
                      bg-[#fbfcfa]
                      px-4
                      py-2.5
                      text-sm
                      text-[#526459]
                      outline-none
                      transition
                      focus:border-[#9fbd82]
                      focus:ring-2
                      focus:ring-[#edf5e8]
                    "
                  >

                    <option value="All">
                      All Activity
                    </option>

                    <option value="Registration">
                      Registrations
                    </option>

                    <option value="Sign In">
                      Sign Ins
                    </option>

                    <option value="Report">
                      Reports
                    </option>

                    <option value="Account">
                      Account Changes
                    </option>

                  </select>

                </div>

              </div>

            </div>


            {/* =================================================
                ACTIVITY COLUMN HEADINGS
            ================================================= */}

            <div
              className="
                hidden
                grid-cols-[60px_210px_1fr_140px]
                border-b border-[#edf0eb]
                bg-[#f7faf5]
                px-6
                py-3
                lg:grid
              "
            >

              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#718177]">
                Type
              </p>

              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#718177]">
                User
              </p>

              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#718177]">
                Activity
              </p>

              <p className="text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-[#718177]">
                Date
              </p>

            </div>


            {/* =================================================
                ACTIVITY LIST
            ================================================= */}

            <div>

              {filteredActivities.map((item) => (
                <ActivityRow
                  key={item.id}
                  activity={item}
                />
              ))}

            </div>


            {/* =================================================
                EMPTY STATE
            ================================================= */}

            {filteredActivities.length === 0 && (

              <div className="flex flex-col items-center justify-center px-6 py-16">

                <div
                  className="
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-full
                    bg-[#edf5e8]
                  "
                >
                  <Activity
                    size={22}
                    className="text-[#57923d]"
                  />
                </div>

                <p className="mt-3 text-sm font-semibold text-[#173b2b]">
                  No activity found
                </p>

                <p className="mt-1 text-xs text-[#718177]">
                  Try changing your search or activity filter.
                </p>

              </div>

            )}


            {/* =================================================
                FOOTER
            ================================================= */}

            {filteredActivities.length > 0 && (

              <div
                className="
                  flex
                  items-center
                  justify-between
                  border-t border-[#edf0eb]
                  bg-[#fbfcfa]
                  px-6
                  py-4
                "
              >

                <p className="text-xs text-[#718177]">
                  Showing{" "}
                  <span className="font-semibold text-[#173b2b]">
                    {filteredActivities.length}
                  </span>{" "}
                  activities
                </p>

                <p className="text-xs text-[#8a978f]">
                  FinanceOS Activity Log
                </p>

              </div>

            )}

          </section>

        </main>

      </div>

    </div>
  );
}


// ============================================================
// ACTIVITY SUMMARY CARD
// ============================================================

function ActivitySummary({
  icon,
  title,
  value,
  description,
}) {

  return (
    <div
      className="
        rounded-2xl
        border border-[#dfe6da]
        bg-white
        p-5
        shadow-[0_4px_18px_rgba(45,75,50,0.03)]
      "
    >

      <div className="flex items-start justify-between">


        {/* CONTENT */}

        <div>

          <p className="text-xs font-medium text-[#718177]">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-[#173b2b]">
            {value}
          </p>

        </div>


        {/* ICON */}

        <div
          className="
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-xl
            bg-[#edf5e8]
            text-[#43822e]
          "
        >

          {icon === "activity" && (
            <Activity size={20} />
          )}

          {icon === "registration" && (
            <UserPlus size={20} />
          )}

          {icon === "signin" && (
            <LogIn size={20} />
          )}

          {icon === "report" && (
            <FileText size={20} />
          )}

        </div>

      </div>


      <p className="mt-3 text-xs text-[#8a978f]">
        {description}
      </p>

    </div>
  );
}


// ============================================================
// ACTIVITY ROW
// ============================================================

function ActivityRow({ activity }) {

  return (
    <div
      className="
        border-b
        border-[#edf0eb]
        px-6
        py-4
        transition
        last:border-b-0
        hover:bg-[#fbfcfa]
      "
    >

      <div
        className="
          flex
          flex-col
          gap-4
          lg:grid
          lg:grid-cols-[60px_210px_1fr_140px]
          lg:items-center
        "
      >


        {/* ====================================================
            ICON
        ==================================================== */}

        <div>

          <div
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              bg-[#edf5e8]
              text-[#43822e]
            "
          >

            {activity.type === "Registration" && (
              <UserPlus size={18} />
            )}

            {activity.type === "Sign In" && (
              <LogIn size={18} />
            )}

            {activity.type === "Report" && (
              <FileText size={18} />
            )}

            {activity.type === "Account" && (
              <UserCheck size={18} />
            )}

            {![
              "Registration",
              "Sign In",
              "Report",
              "Account",
            ].includes(activity.type) && (
              <Activity size={18} />
            )}

          </div>

        </div>


        {/* ====================================================
            USER
        ==================================================== */}

        <div className="min-w-0">

          <p className="truncate text-sm font-semibold text-[#173b2b]">
            {activity.user}
          </p>

          <p className="mt-0.5 truncate text-xs text-[#7b8a80]">
            {activity.email}
          </p>

        </div>


        {/* ====================================================
            DESCRIPTION
        ==================================================== */}

        <div className="min-w-0">

          <span
            className="
              inline-flex
              rounded-full
              bg-[#f0f6eb]
              px-2.5
              py-1
              text-[10px]
              font-semibold
              text-[#57923d]
            "
          >
            {activity.type}
          </span>

          <p className="mt-2 text-sm text-[#617268]">
            {activity.description}
          </p>

        </div>


        {/* ====================================================
            DATE + TIME
        ==================================================== */}

        <div className="lg:text-right">

          <p className="text-xs font-medium text-[#526459]">
            {activity.date}
          </p>

          <p className="mt-1 text-[11px] text-[#8a978f]">
            {activity.time}
          </p>

        </div>

      </div>

    </div>
  );
}


// ============================================================
// EXPORT
// ============================================================

export default AdminActivity;