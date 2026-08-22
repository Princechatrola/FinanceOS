import { Link, NavLink, useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  Activity,
  FileText,
  Settings,
  LogOut,
  ShieldCheck,
  TrendingUp,
  UserCog,
  MessageSquare,
  BellRing,
} from "lucide-react";

function AdminSidebar() {
  const navigate = useNavigate();

  // Temporary until authentication is connected.
  const isSuperAdmin = true;

  const menuItems = [
    {
      name: "Dashboard",
      path: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Users",
      path: "/admin/users",
      icon: Users,
    },
    {
      name: "My Profile",
      path: "/admin/profile",
      icon: UserCog,
    },

/*     ...(isSuperAdmin
      ? [
          {
            name: "Administrators",
            path: "/admin/administrators",
            icon: UserCog,
          },
        ]
      : []),
 */
    {
      name: "User Activity",
      path: "/admin/activity",
      icon: Activity,
    },
    {
      name: "Reports",
      path: "/admin/reports",
      icon: FileText,
    },
    {
      name: "Messages",
      path: "/admin/messages",
      icon: MessageSquare,
    },
    {
      name: "Reminders",
      path: "/admin/reminders",
      icon: BellRing,
    }
/*     {
      name: "Settings",
      path: "/admin/settings",
      icon: Settings,
    }, */
  ];

  function handleSignOut() {
    // Later:
    // localStorage.removeItem("adminToken");
    // localStorage.removeItem("adminUser");

    navigate("/signin");
  }

  return (
    <aside
      className="
        flex
        h-screen
        w-[250px]
        shrink-0
        flex-col
        overflow-hidden
        border-r
        border-[#e2e8de]
        bg-white
      "
    >

      {/* ======================================================
          LOGO
      ====================================================== */}

      <div className="shrink-0 px-5 pb-4 pt-5">

        <div className="flex items-center gap-3">

          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-[#e8f4dc]
            "
          >
            <TrendingUp
              size={21}
              className="text-[#43822e]"
            />
          </div>

          <div className="min-w-0">

            <h1 className="text-xl font-bold text-[#28622e]">
              FinanceOS
            </h1>

            <p
              className="
                mt-0.5
                text-[10px]
                font-bold
                uppercase
                tracking-[0.12em]
                text-[#57923d]
              "
            >
              Admin Portal
            </p>

          </div>

        </div>

      </div>


      {/* ======================================================
          NAVIGATION
      ====================================================== */}

      <nav className="min-h-0 flex-1 px-4 py-2">

        <div className="space-y-1">

          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.name}
                to={item.path}

                className={({ isActive }) =>
                  `
                  flex
                  h-[46px]
                  items-center
                  gap-3
                  rounded-xl
                  px-4
                  text-sm
                  font-medium
                  transition

                  ${
                    isActive
                      ? "bg-[#eaf4df] text-[#27672c]"
                      : "text-[#4f6256] hover:bg-[#f4f8f1] hover:text-[#27672c]"
                  }
                  `
                }
              >

                <Icon
                  size={18}
                  className="shrink-0"
                />

                <span className="truncate">
                  {item.name}
                </span>

              </NavLink>
            );
          })}

        </div>

      </nav>


      {/* ======================================================
          BOTTOM SECTION
      ====================================================== */}

      <div className="shrink-0">


        {/* ====================================================
            SECURE ACCESS
        ==================================================== */}

        <div className="mx-4 mb-3">

          <div
            className="
              rounded-xl
              border
              border-[#dce7d5]
              bg-[#f1f7ec]
              px-3
              py-3
            "
          >

            <div className="flex items-start gap-2.5">

              <ShieldCheck
                size={18}
                className="mt-0.5 shrink-0 text-[#43822e]"
              />

              <div className="min-w-0">

                <p
                  className="
                    text-[11px]
                    font-semibold
                    text-[#244c2d]
                  "
                >
                  Secure Admin Access
                </p>

                <p
                  className="
                    mt-0.5
                    text-[10px]
                    leading-4
                    text-[#64806a]
                  "
                >
                  Secure administrative area
                </p>

              </div>

            </div>

          </div>

        </div>


        {/* ====================================================
            ADMIN PROFILE
        ==================================================== */}

        <div
          className="
            border-t
            border-[#e5eae2]
            px-4
            pb-4
            pt-3
          "
        >

          <Link to="/admin/profile" className="flex items-center gap-3 transition hover:opacity-80">

            <div
              className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-[#e8f4dc]
                text-sm
                font-bold
                text-[#43822e]
              "
            >
              S
            </div>

            <div className="min-w-0 flex-1">

              <p
                className="
                  truncate
                  text-sm
                  font-semibold
                  text-[#173b2b]
                "
              >
                Super Admin
              </p>

              <p
                className="
                  truncate
                  text-[10px]
                  text-[#6e8175]
                "
              >
                System Administrator
              </p>

            </div>

          </Link>


          {/* SIGN OUT */}

          <button
            type="button"
            onClick={handleSignOut}

            className="
              mt-2
              flex
              h-9
              w-full
              items-center
              gap-3
              rounded-lg
              px-3
              text-sm
              font-medium
              text-red-500
              transition
              hover:bg-red-50
            "
          >

            <LogOut
              size={17}
              className="shrink-0"
            />

            Sign Out

          </button>

        </div>

      </div>

    </aside>
  );
}

export default AdminSidebar;