import { useMemo, useState } from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  MoreVertical,
  Plus,
  Search,
  ShieldCheck,
  UserCog,
  Users,
  Eye,
  Pencil,
  KeyRound,
  UserCheck,
  UserX,
} from "lucide-react";

import AdminSidebar from "../components/AdminSidebar.jsx";
import AdminTopbar from "../components/AdminTopbar.jsx";

import {
  getAdministrators,
  saveAdministrators,
} from "../utils/adminStorage.js";


// ============================================================
// ADMINISTRATOR MANAGEMENT
// ============================================================

export default function AdminAdministrators() {
  const navigate = useNavigate();
  const location = useLocation();

  const [admins, setAdmins] = useState(() =>
    getAdministrators()
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("All");

  const [menuOpen, setMenuOpen] =
    useState(null);


  // ==========================================================
  // FILTER ADMINS
  // ==========================================================

  const filteredAdmins = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return admins.filter((admin) => {
      const matchesSearch =
        !query ||
        admin.name
          ?.toLowerCase()
          .includes(query) ||
        admin.email
          ?.toLowerCase()
          .includes(query) ||
        admin.adminId
          ?.toLowerCase()
          .includes(query) ||
        admin.mobile
          ?.toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        admin.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [admins, search, statusFilter]);


  // ==========================================================
  // COUNTS
  // ==========================================================

  const totalAdmins =
    admins.length;

  const activeAdmins =
    admins.filter(
      (admin) =>
        admin.status === "Active"
    ).length;

  const inactiveAdmins =
    admins.filter(
      (admin) =>
        admin.status === "Inactive"
    ).length;

  const subAdmins =
    admins.filter(
      (admin) =>
        admin.role === "Sub Admin"
    ).length;


  // ==========================================================
  // CHANGE STATUS
  // ==========================================================

  function changeStatus(id, status) {
    setAdmins((current) => {
      const updated =
        current.map((admin) => {
          if (admin.id !== id) {
            return admin;
          }

          // Super Admin cannot be deactivated
          // from this screen.
          if (
            admin.role ===
            "Super Admin"
          ) {
            return admin;
          }

          return {
            ...admin,
            status,
          };
        });

      saveAdministrators(updated);

      return updated;
    });

    setMenuOpen(null);
  }


  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f8f3]">

      <AdminSidebar />


      <div className="flex min-w-0 flex-1 flex-col">

        <AdminTopbar />


        <main className="flex-1 overflow-y-auto p-6">

          <div className="mx-auto max-w-[1450px]">


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

              <div>

                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#639a48]">
                  Super Admin
                </p>

                <h1 className="mt-1 text-2xl font-bold text-[#173b2b]">
                  Administrator Management
                </h1>

                <p className="mt-1 text-sm text-[#718177]">
                  Create Sub Admin accounts,
                  control access and manage
                  administrative status.
                </p>

              </div>


              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/admin/administrators/create"
                  )
                }
                className="flex items-center justify-center gap-2 rounded-xl bg-[#dff3ad] px-5 py-2.5 text-sm font-bold text-[#173b2b] transition hover:bg-[#d5eba2]"
              >
                <Plus size={17} />

                Create Sub Admin
              </button>

            </div>


            {/* =================================================
                CREATED SUCCESS MESSAGE
            ================================================= */}

            {location.state?.created && (

              <div className="mt-5 flex gap-3 rounded-xl border border-[#d6e6cc] bg-[#edf6e7] p-4">

                <ShieldCheck
                  size={19}
                  className="mt-0.5 shrink-0 text-[#57923d]"
                />

                <div>

                  <p className="text-sm font-semibold text-[#173b2b]">
                    Sub Admin created successfully
                  </p>

                  <p className="mt-1 text-xs text-[#617268]">
                    {location.state.name} was
                    created with Admin ID{" "}

                    <span className="font-mono font-bold text-[#43822e]">
                      {
                        location.state
                          .adminId
                      }
                    </span>
                  </p>

                </div>

              </div>

            )}


            {/* =================================================
                SUMMARY CARDS
            ================================================= */}

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <SummaryCard
                title="Total Administrators"
                value={totalAdmins}
                icon={Users}
              />

              <SummaryCard
                title="Sub Admins"
                value={subAdmins}
                icon={UserCog}
              />

              <SummaryCard
                title="Active"
                value={activeAdmins}
                icon={UserCheck}
              />

              <SummaryCard
                title="Inactive"
                value={inactiveAdmins}
                icon={UserX}
              />

            </div>


            {/* =================================================
                TABLE SECTION
            ================================================= */}

            <section className="mt-5 overflow-visible rounded-2xl border border-[#dfe6da] bg-white">


              {/* FILTER BAR */}

              <div className="flex flex-col gap-4 border-b border-[#edf0eb] p-5 lg:flex-row lg:items-center lg:justify-between">

                <div>

                  <h2 className="font-bold text-[#173b2b]">
                    Administrators
                  </h2>

                  <p className="mt-1 text-xs text-[#718177]">
                    Super Admin and authorized
                    Sub Admin accounts.
                  </p>

                </div>


                <div className="flex flex-col gap-3 sm:flex-row">


                  {/* SEARCH */}

                  <div className="relative w-full sm:w-[330px]">

                    <Search
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#839188]"
                    />

                    <input
                      type="text"
                      value={search}
                      onChange={(event) =>
                        setSearch(
                          event.target.value
                        )
                      }
                      placeholder="Search name, ID, email, mobile..."
                      className="w-full rounded-xl border border-[#dce4d8] bg-[#fbfcfa] py-2.5 pl-10 pr-4 text-sm text-[#173b2b] outline-none placeholder:text-[#9ba69f] focus:border-[#9fbd82]"
                    />

                  </div>


                  {/* STATUS FILTER */}

                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(
                        event.target.value
                      )
                    }
                    className="rounded-xl border border-[#dce4d8] bg-[#fbfcfa] px-4 py-2.5 text-sm text-[#526459] outline-none"
                  >

                    <option value="All">
                      All Status
                    </option>

                    <option value="Active">
                      Active
                    </option>

                    <option value="Inactive">
                      Inactive
                    </option>

                  </select>

                </div>

              </div>


              {/* =================================================
                  TABLE
              ================================================= */}

              <div className="overflow-x-auto">

                <table className="w-full min-w-[1150px]">

                  <thead className="bg-[#fafcf9]">

                    <tr className="border-b border-[#edf0eb]">

                      <TH>
                        Administrator
                      </TH>

                      <TH>
                        Admin ID
                      </TH>

                      <TH>
                        Contact
                      </TH>

                      <TH>
                        Role
                      </TH>

                      <TH>
                        Status
                      </TH>

                      <TH>
                        Joined
                      </TH>

                      <TH>
                        Last Login
                      </TH>

                      <TH>
                        Actions
                      </TH>

                    </tr>

                  </thead>


                  <tbody>

                    {filteredAdmins.map(
                      (admin) => (

                        <tr
                          key={admin.id}
                          className="border-b border-[#edf0eb] last:border-b-0 hover:bg-[#fbfcfa]"
                        >


                          {/* ADMIN */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold ${
                                  admin.role ===
                                  "Super Admin"
                                    ? "bg-[#dff3ad] text-[#2f6b32]"
                                    : "bg-[#edf5e8] text-[#57923d]"
                                }`}
                              >
                                {admin.name
                                  ?.charAt(0)
                                  .toUpperCase()}
                              </div>


                              <div>

                                <p className="text-sm font-semibold text-[#173b2b]">
                                  {admin.name}
                                </p>

                                <p className="mt-1 text-[10px] text-[#8a978f]">
                                  {admin.city &&
                                  admin.state
                                    ? `${admin.city}, ${admin.state}`
                                    : "FinanceOS Administrator"}
                                </p>

                              </div>

                            </div>

                          </td>


                          {/* ADMIN ID */}

                          <td className="px-4 py-4">

                            <span className="font-mono text-[11px] font-semibold text-[#57923d]">
                              {admin.adminId}
                            </span>

                          </td>


                          {/* CONTACT */}

                          <td className="px-4 py-4">

                            <p className="text-xs font-medium text-[#526459]">
                              {admin.email}
                            </p>

                            <p className="mt-1 text-[10px] text-[#8a978f]">
                              {admin.mobile ||
                                "—"}
                            </p>

                          </td>


                          {/* ROLE */}

                          <td className="px-4 py-4">

                            <RoleBadge
                              role={admin.role}
                            />

                          </td>


                          {/* STATUS */}

                          <td className="px-4 py-4">

                            <StatusBadge
                              status={
                                admin.status
                              }
                            />

                          </td>


                          {/* JOINED */}

                          <td className="px-4 py-4 text-xs text-[#617268]">
                            {admin.joined}
                          </td>


                          {/* LAST LOGIN */}

                          <td className="px-4 py-4 text-xs text-[#617268]">
                            {admin.lastLogin ||
                              "Never"}
                          </td>


                          {/* ACTIONS */}

                          <td className="relative px-4 py-4">

                            <button
                              type="button"
                              onClick={() =>
                                setMenuOpen(
                                  menuOpen ===
                                    admin.id
                                    ? null
                                    : admin.id
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#718177] transition hover:bg-[#edf3e9]"
                            >
                              <MoreVertical
                                size={17}
                              />
                            </button>


                            {menuOpen ===
                              admin.id && (

                              <div className="absolute right-8 top-12 z-50 w-[220px] overflow-hidden rounded-xl border border-[#dfe6da] bg-white py-2 shadow-lg">


                                {/* VIEW */}

                                <MenuButton
                                  icon={Eye}
                                  text="View Details"
                                  onClick={() => {
                                    setMenuOpen(
                                      null
                                    );

                                    navigate(
                                      `/admin/administrators/${admin.id}`
                                    );
                                  }}
                                />


                                {/* EDIT */}

                                <MenuButton
                                  icon={Pencil}
                                  text="Edit Administrator"
                                  onClick={() => {
                                    setMenuOpen(
                                      null
                                    );

                                    navigate(
                                      `/admin/administrators/${admin.id}/edit`
                                    );
                                  }}
                                />


                                {/* PERMISSIONS */}

                                {admin.role !==
                                  "Super Admin" && (

                                  <MenuButton
                                    icon={
                                      KeyRound
                                    }
                                    text="Manage Permissions"
                                    onClick={() => {
                                      setMenuOpen(
                                        null
                                      );

                                      navigate(
                                        `/admin/administrators/${admin.id}/access`
                                      );
                                    }}
                                  />

                                )}


                                {/* STATUS */}

                                {admin.role !==
                                  "Super Admin" && (

                                  <>

                                    <div className="my-2 border-t border-[#edf0eb]" />

                                    {admin.status ===
                                    "Active" ? (

                                      <MenuButton
                                        icon={
                                          UserX
                                        }
                                        text="Set Inactive"
                                        danger
                                        onClick={() =>
                                          changeStatus(
                                            admin.id,
                                            "Inactive"
                                          )
                                        }
                                      />

                                    ) : (

                                      <MenuButton
                                        icon={
                                          UserCheck
                                        }
                                        text="Set Active"
                                        onClick={() =>
                                          changeStatus(
                                            admin.id,
                                            "Active"
                                          )
                                        }
                                      />

                                    )}

                                  </>

                                )}

                              </div>

                            )}

                          </td>

                        </tr>

                      )
                    )}


                    {/* EMPTY */}

                    {filteredAdmins.length ===
                      0 && (

                      <tr>

                        <td
                          colSpan="8"
                          className="px-6 py-14 text-center"
                        >

                          <UserCog
                            size={30}
                            className="mx-auto text-[#a3aea7]"
                          />

                          <p className="mt-3 text-sm font-semibold text-[#526459]">
                            No administrators
                            found
                          </p>

                          <p className="mt-1 text-xs text-[#8a978f]">
                            Try changing your
                            search or filter.
                          </p>

                        </td>

                      </tr>

                    )}

                  </tbody>

                </table>

              </div>

            </section>


            {/* SECURITY NOTE */}

            <div className="mt-5 flex gap-3 rounded-2xl border border-[#dce6d6] bg-[#f0f7eb] p-5">

              <ShieldCheck
                size={19}
                className="mt-0.5 shrink-0 text-[#57923d]"
              />

              <div>

                <p className="text-sm font-bold text-[#173b2b]">
                  Super Admin Control
                </p>

                <p className="mt-1 text-xs leading-5 text-[#617268]">
                  Only the Super Admin can
                  create Sub Admins and control
                  their administrative
                  permissions.
                </p>

              </div>

            </div>

          </div>

        </main>

      </div>

    </div>
  );
}


// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({
  title,
  value,
  icon: Icon,
}) {
  return (
    <div className="rounded-2xl border border-[#dfe6da] bg-white p-5">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-xs text-[#718177]">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-[#173b2b]">
            {value}
          </p>

        </div>


        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf5e8] text-[#57923d]">
          <Icon size={18} />
        </div>

      </div>

    </div>
  );
}


// ============================================================
// TABLE HEADER
// ============================================================

function TH({ children }) {
  return (
    <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-[#718177]">
      {children}
    </th>
  );
}


// ============================================================
// ROLE BADGE
// ============================================================

function RoleBadge({ role }) {
  const superAdmin =
    role === "Super Admin";

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-bold ${
        superAdmin
          ? "bg-[#e5f3bf] text-[#356b31]"
          : "bg-[#eef3eb] text-[#617268]"
      }`}
    >
      {role}
    </span>
  );
}


// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({ status }) {
  const active =
    status === "Active";

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-semibold ${
        active
          ? "bg-[#edf6e7] text-[#57923d]"
          : "bg-[#f1f1f1] text-[#777]"
      }`}
    >

      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active
            ? "bg-[#6ca84f]"
            : "bg-[#999]"
        }`}
      />

      {status}

    </span>
  );
}


// ============================================================
// MENU BUTTON
// ============================================================

function MenuButton({
  icon: Icon,
  text,
  onClick,
  danger = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-xs font-medium transition ${
        danger
          ? "text-red-500 hover:bg-red-50"
          : "text-[#526459] hover:bg-[#f4f7f2]"
      }`}
    >

      <Icon size={15} />

      {text}

    </button>
  );
}