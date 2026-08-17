// ============================================================
// FINANCEOS - SIDEBAR
// ============================================================

import {
  FiGrid,
  FiDollarSign,
  FiTarget,
  FiLayers,
  FiCalendar,
  FiFileText,
  FiUser,
  FiLogOut,
} from "react-icons/fi";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import financeOSLogo
  from "../../assets/images/financeos-logo.png";


// ============================================================
// SIDEBAR
// ============================================================

function Sidebar() {

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const navigate = useNavigate();


  // ==========================================================
  // NAVIGATION ITEMS
  // ==========================================================

  const menuItems = [

    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <FiGrid />,
    },

    {
      name: "Monthly Finance",
      path: "/monthly-finance",
      icon: <FiDollarSign />,
    },

    {
      name: "Saving Goals",
      path: "/saving-goals",
      icon: <FiTarget />,
    },

    {
      name: "Plans & Commitments",
      path: "/plans-commitments",
      icon: <FiLayers />,
    },

    {
      name: "Financial Calendar",
      path: "/financial-calendar",
      icon: <FiCalendar />,
    },

    {
      name: "Reports",
      path: "/reports",
      icon: <FiFileText />,
    },

  ];


  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout = () => {

    // --------------------------------------------------------
    // REMOVE USER DATA FROM LOCAL STORAGE
    // Used when "Remember Me" was selected.
    // --------------------------------------------------------

    localStorage.removeItem("financeos_token");
    localStorage.removeItem("financeos_user");


    // --------------------------------------------------------
    // REMOVE USER DATA FROM SESSION STORAGE
    // Used when "Remember Me" was not selected.
    // --------------------------------------------------------

    sessionStorage.removeItem("financeos_token");
    sessionStorage.removeItem("financeos_user");


    // --------------------------------------------------------
    // REDIRECT TO SIGN IN
    // --------------------------------------------------------

    navigate("/signin", {
      replace: true,
    });

  };


  // ==========================================================
  // LINK STYLE
  // ==========================================================

  const getMenuClass = ({
    isActive,
  }) => {

    const base =
      "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition";


    if (isActive) {

      return `${base} bg-[#d8f5b4] font-semibold text-[#18392c]`;

    }


    return `${base} text-[#52665b] hover:bg-[#edf3e8]`;

  };


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-[#e2e8dc] bg-[#f7f9f3]">


      {/* ======================================================
          LOGO
      ====================================================== */}

      <div className="flex h-24 items-center px-5">

        <img
          src={financeOSLogo}
          alt="FinanceOS"
          className="w-full max-w-[215px] object-contain"
        />

      </div>


      {/* ======================================================
          MAIN MENU
      ====================================================== */}

      <div className="flex-1 px-4">


        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Menu
        </p>


        <nav className="space-y-1">


          {menuItems.map(
            (item) => (

              <NavLink
                key={item.path}
                to={item.path}
                className={
                  getMenuClass
                }
              >

                <span className="text-lg">
                  {item.icon}
                </span>

                {item.name}

              </NavLink>

            )
          )}


        </nav>


      </div>


      {/* ======================================================
          BOTTOM MENU
      ====================================================== */}

      <div className="border-t border-[#e2e8dc] p-4">


        {/* ====================================================
            PROFILE
        ==================================================== */}

        <NavLink
          to="/profile"
          className={
            getMenuClass
          }
        >

          <FiUser className="text-lg" />

          Profile

        </NavLink>


        {/* ====================================================
            LOGOUT
        ==================================================== */}

        <button
          type="button"
          onClick={handleLogout}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-red-500 transition hover:bg-red-50"
        >

          <FiLogOut className="text-lg" />

          Logout

        </button>


      </div>


    </aside>

  );

}


// ============================================================
// EXPORT
// ============================================================

export default Sidebar;