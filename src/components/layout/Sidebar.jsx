// ============================================================
// FINANCEOS - USER SIDEBAR (COLLAPSIBLE WITH HAMBURGER MENU)
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
  FiMenu,
} from "react-icons/fi";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import financeOSLogo from "../../assets/images/financeos-logo-Copy.png";
import useFinance from "../../context/useFinance.js";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedMonth, sidebarCollapsed, toggleSidebar } = useFinance();

  const menuItems = [
    {
      name: "Dashboard",
      path: selectedMonth ? `/dashboard?month=${selectedMonth}` : "/dashboard",
      base: "/dashboard",
      icon: <FiGrid size={19} />,
    },
    {
      name: "Monthly Finance",
      path: selectedMonth ? `/monthly-finance?month=${selectedMonth}` : "/monthly-finance",
      base: "/monthly-finance",
      icon: <FiDollarSign size={19} />,
    },
    {
      name: "Saving Goals",
      path: selectedMonth ? `/saving-goals?month=${selectedMonth}` : "/saving-goals",
      base: "/saving-goals",
      icon: <FiTarget size={19} />,
    },
    {
      name: "Plans & Commitments",
      path: selectedMonth ? `/plans-commitments?month=${selectedMonth}` : "/plans-commitments",
      base: "/plans-commitments",
      icon: <FiLayers size={19} />,
    },
    {
      name: "Financial Calendar",
      path: selectedMonth ? `/financial-calendar?month=${selectedMonth}` : "/financial-calendar",
      base: "/financial-calendar",
      icon: <FiCalendar size={19} />,
    },
    {
      name: "Reports",
      path: selectedMonth ? `/reports?month=${selectedMonth}` : "/reports",
      base: "/reports",
      icon: <FiFileText size={19} />,
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("financeos_token");
    localStorage.removeItem("financeos_user");
    sessionStorage.removeItem("financeos_token");
    sessionStorage.removeItem("financeos_user");
    navigate("/signin", { replace: true });
  };

  const getMenuClass = (itemBase) => {
    const isCurrentActive =
      location.pathname === itemBase ||
      (itemBase === "/dashboard" &&
        (location.pathname === "/" || location.pathname === "/user/dashboard"));

    const base = sidebarCollapsed
      ? "flex items-center justify-center rounded-xl p-3 text-center transition"
      : "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition";

    if (isCurrentActive) {
      return `${base} bg-[#d8f5b4] font-semibold text-[#18392c] shadow-xs`;
    }

    return `${base} text-[#52665b] hover:bg-[#edf3e8] hover:text-[#18392c]`;
  };

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-[#e2e8dc] bg-[#f7f9f3] transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* HEADER / LOGO & HAMBURGER */}
      <div
        className={`flex h-20 items-center border-b border-[#e5ece0] ${
          sidebarCollapsed ? "justify-center px-2" : "justify-between px-5"
        }`}
      >
        {!sidebarCollapsed && (
          <Link to={selectedMonth ? `/dashboard?month=${selectedMonth}` : "/dashboard"} className="flex items-center">
            <img
              src={financeOSLogo}
              alt="FinanceOS"
              className="w-full max-w-[155px] object-contain"
            />
          </Link>
        )}

        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={sidebarCollapsed ? "Expand Sidebar (☰)" : "Collapse Sidebar (☰)"}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d6e0ce] bg-white text-[#18392c] shadow-xs transition hover:bg-[#e4edd9] active:scale-95"
        >
          <FiMenu size={18} />
        </button>
      </div>

      {/* MAIN NAVIGATION */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {!sidebarCollapsed && (
          <p className="mb-2.5 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Menu
          </p>
        )}

        <nav className="space-y-1.5">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              title={item.name}
              aria-label={item.name}
              className={getMenuClass(item.base)}
            >
              <span className="shrink-0">{item.icon}</span>
              {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
            </Link>
          ))}
        </nav>
      </div>

      {/* BOTTOM MENU: PROFILE & LOGOUT */}
      <div className="border-t border-[#e2e8dc] p-3 space-y-1">
        <Link
          to={selectedMonth ? `/profile?month=${selectedMonth}` : "/profile"}
          title="Profile"
          aria-label="Profile"
          className={getMenuClass("/profile")}
        >
          <span className="shrink-0"><FiUser size={19} /></span>
          {!sidebarCollapsed && <span className="truncate">Profile</span>}
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          title="Logout"
          aria-label="Logout"
          className={
            sidebarCollapsed
              ? "flex w-full items-center justify-center rounded-xl p-3 text-red-500 transition hover:bg-red-50"
              : "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-red-500 transition hover:bg-red-50"
          }
        >
          <span className="shrink-0"><FiLogOut size={19} /></span>
          {!sidebarCollapsed && <span className="font-medium truncate">Logout</span>}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;