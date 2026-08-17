import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Archive,
  ChevronDown,
  Eye,
  Filter,
  KeyRound,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  UserCheck,
  Users,
  UserX,
  X,
} from "lucide-react";

import AdminSidebar from "../components/AdminSidebar.jsx";
import AdminTopbar from "../components/AdminTopbar.jsx";


// ============================================================
// SAMPLE USER DATA
// Later this will come from MongoDB.
// ============================================================

const initialUsers = [
  {
    id: 1,
    userId: "FOS-U-001248",
    name: "Rahul Patel",
    email: "rahul@example.com",
    mobile: "9876543210",
    city: "Ahmedabad",
    state: "Gujarat",
    joined: "28 Jul 2026",
    registrationGroup: "This Month",
    status: "Active",
  },
  {
    id: 2,
    userId: "FOS-U-001247",
    name: "Priya Shah",
    email: "priya@example.com",
    mobile: "9876501234",
    city: "Rajkot",
    state: "Gujarat",
    joined: "27 Jul 2026",
    registrationGroup: "This Month",
    status: "Active",
  },
  {
    id: 3,
    userId: "FOS-U-001246",
    name: "Amit Mehta",
    email: "amit@example.com",
    mobile: "9825012345",
    city: "Surat",
    state: "Gujarat",
    joined: "18 Jul 2026",
    registrationGroup: "This Month",
    status: "Inactive",
  },
  {
    id: 4,
    userId: "FOS-U-001245",
    name: "Neha Joshi",
    email: "neha@example.com",
    mobile: "9725012345",
    city: "Vadodara",
    state: "Gujarat",
    joined: "04 Jun 2026",
    registrationGroup: "Previous",
    status: "Active",
  },
  {
    id: 5,
    userId: "FOS-U-001244",
    name: "Karan Desai",
    email: "karan@example.com",
    mobile: "9625012345",
    city: "Bhavnagar",
    state: "Gujarat",
    joined: "19 May 2026",
    registrationGroup: "Previous",
    status: "Suspended",
  },
];


// ============================================================
// ADMIN USERS
// ============================================================

export default function AdminUsers() {
  const navigate = useNavigate();

  const [users, setUsers] = useState(initialUsers);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [registrationFilter, setRegistrationFilter] =
    useState("All");

  const [selectedUser, setSelectedUser] = useState(null);
  const [actionMenu, setActionMenu] = useState(null);


  // ==========================================================
  // COUNTS
  // ==========================================================

  const totalUsers = users.length;

  const activeUsers = users.filter(
    (user) => user.status === "Active"
  ).length;

  const inactiveUsers = users.filter(
    (user) => user.status === "Inactive"
  ).length;

  const suspendedUsers = users.filter(
    (user) => user.status === "Suspended"
  ).length;

  const newThisMonth = users.filter(
    (user) => user.registrationGroup === "This Month"
  ).length;


  // ==========================================================
  // FILTER USERS
  // ==========================================================

  const filteredUsers = useMemo(() => {
    const query = search.toLowerCase().trim();

    return users.filter((user) => {
      const matchesSearch =
        user.userId.toLowerCase().includes(query) ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.mobile.includes(query) ||
        user.city.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        user.status === statusFilter;

      const matchesRegistration =
        registrationFilter === "All" ||
        user.registrationGroup === registrationFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesRegistration
      );
    });
  }, [
    users,
    search,
    statusFilter,
    registrationFilter,
  ]);


  // ==========================================================
  // CHANGE USER STATUS
  // Temporary frontend behavior.
  // ==========================================================

  function changeStatus(userId, newStatus) {
    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.id === userId
          ? {
              ...user,
              status: newStatus,
            }
          : user
      )
    );

    setActionMenu(null);
  }


  // ==========================================================
  // RESET FILTERS
  // ==========================================================

  function resetFilters() {
    setSearch("");
    setStatusFilter("All");
    setRegistrationFilter("All");
  }


  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f8f3]">

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <AdminSidebar />


      {/* ======================================================
          MAIN
      ====================================================== */}

      <div className="flex min-w-0 flex-1 flex-col">

        <AdminTopbar />


        <main className="flex-1 overflow-y-auto p-6">

          {/* ==================================================
              HEADING
          ================================================== */}

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#639a48]">
                User Administration
              </p>

              <h1 className="mt-1 text-2xl font-bold text-[#173b2b]">
                Manage Users
              </h1>

              <p className="mt-1 text-sm text-[#718177]">
                Create, review, update and control FinanceOS user accounts.
              </p>
            </div>


            <button
              type="button"
              onClick={() =>
                navigate("/admin/users/create")
              }
              className="
                flex items-center justify-center gap-2
                rounded-xl
                bg-[#dff3ad]
                px-5 py-2.5
                text-sm font-semibold
                text-[#173b2b]
                transition
                hover:bg-[#d5eba2]
              "
            >
              <Plus size={17} />

              Add User
            </button>

          </div>


          {/* ==================================================
              SUMMARY CARDS
          ================================================== */}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

            <SummaryCard
              title="Total Users"
              value={totalUsers}
              icon={<Users size={19} />}
            />

            <SummaryCard
              title="Active"
              value={activeUsers}
              icon={<UserCheck size={19} />}
            />

            <SummaryCard
              title="Inactive"
              value={inactiveUsers}
              icon={<UserX size={19} />}
            />

            <SummaryCard
              title="Suspended"
              value={suspendedUsers}
              icon={<ShieldAlert size={19} />}
            />

            <SummaryCard
              title="New This Month"
              value={newThisMonth}
              icon={<Plus size={19} />}
            />

          </div>


          {/* ==================================================
              USERS SECTION
          ================================================== */}

          <section className="mt-6 overflow-hidden rounded-2xl border border-[#dfe6da] bg-white">

            {/* ================================================
                FILTER HEADER
            ================================================ */}

            <div className="border-b border-[#e7ece4] p-5">

              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">

                <div>
                  <h2 className="text-lg font-bold text-[#173b2b]">
                    User Directory
                  </h2>

                  <p className="mt-1 text-xs text-[#718177]">
                    Search by User ID, name, email, mobile number or city.
                  </p>
                </div>


                <div className="flex flex-wrap gap-3">

                  {/* SEARCH */}

                  <div className="relative">

                    <Search
                      size={16}
                      className="
                        absolute left-3 top-1/2
                        -translate-y-1/2
                        text-[#829087]
                      "
                    />

                    <input
                      value={search}
                      onChange={(event) =>
                        setSearch(event.target.value)
                      }
                      placeholder="Search users..."
                      className="
                        w-[280px]
                        rounded-xl
                        border border-[#dfe6da]
                        bg-[#fbfcfa]
                        py-2.5 pl-10 pr-4
                        text-sm
                        text-[#173b2b]
                        outline-none
                        placeholder:text-[#9aa59e]
                        focus:border-[#9fbd82]
                        focus:ring-2
                        focus:ring-[#edf5e8]
                      "
                    />

                  </div>


                  {/* STATUS */}

                  <div className="relative">

                    <Filter
                      size={15}
                      className="
                        absolute left-3 top-1/2
                        -translate-y-1/2
                        text-[#718177]
                      "
                    />

                    <select
                      value={statusFilter}
                      onChange={(event) =>
                        setStatusFilter(event.target.value)
                      }
                      className="
                        rounded-xl
                        border border-[#dfe6da]
                        bg-[#fbfcfa]
                        py-2.5
                        pl-9 pr-8
                        text-sm
                        text-[#526459]
                        outline-none
                      "
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

                      <option value="Suspended">
                        Suspended
                      </option>
                    </select>

                  </div>


                  {/* REGISTRATION */}

                  <select
                    value={registrationFilter}
                    onChange={(event) =>
                      setRegistrationFilter(
                        event.target.value
                      )
                    }
                    className="
                      rounded-xl
                      border border-[#dfe6da]
                      bg-[#fbfcfa]
                      px-4 py-2.5
                      text-sm
                      text-[#526459]
                      outline-none
                    "
                  >
                    <option value="All">
                      All Registrations
                    </option>

                    <option value="This Month">
                      This Month
                    </option>

                    <option value="Previous">
                      Previous
                    </option>
                  </select>


                  {/* RESET */}

                  <button
                    type="button"
                    onClick={resetFilters}
                    className="
                      rounded-xl
                      border border-[#dfe6da]
                      px-4 py-2.5
                      text-sm font-medium
                      text-[#617268]
                      transition
                      hover:bg-[#f5f8f2]
                    "
                  >
                    Reset
                  </button>

                </div>

              </div>

            </div>


            {/* ==================================================
                TABLE
            ================================================== */}

            <div className="overflow-x-auto">

              <table className="w-full text-left">

                <thead className="bg-[#f7faf5]">

                  <tr
                    className="
                      text-[11px]
                      uppercase
                      tracking-[0.08em]
                      text-[#718177]
                    "
                  >

                    <th className="px-5 py-3 font-semibold">
                      User
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Contact
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Location
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Joined
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right font-semibold">
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {filteredUsers.map((user) => (

                    <tr
                      key={user.id}
                      className="
                        border-t
                        border-[#edf0eb]
                        transition
                        hover:bg-[#fbfcfa]
                      "
                    >

                      {/* USER */}

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-3">

                          <div
                            className="
                              flex h-10 w-10
                              items-center justify-center
                              rounded-xl
                              bg-[#edf5e8]
                              text-sm font-bold
                              text-[#57923d]
                            "
                          >
                            {user.name.charAt(0)}
                          </div>


                          <div>

                            <p className="text-sm font-semibold text-[#173b2b]">
                              {user.name}
                            </p>

                            <p className="mt-0.5 text-[11px] font-medium text-[#729061]">
                              {user.userId}
                            </p>

                          </div>

                        </div>

                      </td>


                      {/* CONTACT */}

                      <td className="px-5 py-4">

                        <p className="text-sm text-[#526459]">
                          {user.email}
                        </p>

                        <p className="mt-1 text-xs text-[#829087]">
                          +91 {user.mobile}
                        </p>

                      </td>


                      {/* LOCATION */}

                      <td className="px-5 py-4">

                        <p className="text-sm text-[#526459]">
                          {user.city}
                        </p>

                        <p className="mt-1 text-xs text-[#829087]">
                          {user.state}
                        </p>

                      </td>


                      {/* JOINED */}

                      <td className="px-5 py-4 text-sm text-[#617268]">
                        {user.joined}
                      </td>


                      {/* STATUS */}

                      <td className="px-5 py-4">
                        <StatusBadge
                          status={user.status}
                        />
                      </td>


                      {/* ACTIONS */}

                      <td className="relative px-5 py-4">

                        <div className="flex items-center justify-end gap-2">

                          {/* VIEW */}

                          <button
                            type="button"
                            onClick={() =>
                              setSelectedUser(user)
                            }
                            className="
                              flex items-center gap-1.5
                              rounded-lg
                              border border-[#dce7d5]
                              px-3 py-2
                              text-xs font-semibold
                              text-[#43822e]
                              transition
                              hover:bg-[#edf5e8]
                            "
                          >
                            <Eye size={14} />

                            View
                          </button>


                          {/* ACTION MENU */}

                          <div className="relative">

                            <button
                              type="button"
                              onClick={() =>
                                setActionMenu(
                                  actionMenu === user.id
                                    ? null
                                    : user.id
                                )
                              }
                              className="
                                flex items-center gap-1
                                rounded-lg
                                border border-[#dce7d5]
                                px-3 py-2
                                text-xs font-semibold
                                text-[#526459]
                                transition
                                hover:bg-[#f5f8f2]
                              "
                            >
                              Manage

                              <ChevronDown size={13} />
                            </button>


                            {actionMenu === user.id && (

                              <div
                                className="
                                  absolute
                                  right-0 top-10
                                  z-30
                                  w-[210px]
                                  overflow-hidden
                                  rounded-xl
                                  border border-[#dfe6da]
                                  bg-white
                                  py-2
                                  shadow-xl
                                "
                              >

                                <ActionButton
                                  icon={<Pencil size={14} />}
                                  text="Edit User"
                                  onClick={() => {
                                    setActionMenu(null);

                                    navigate(
                                      `/admin/users/${user.id}/edit`
                                    );
                                  }}
                                />


                                <ActionButton
                                  icon={<KeyRound size={14} />}
                                  text="Manage Access"
                                  onClick={() => {
                                    setActionMenu(null);

                                    navigate(
                                      `/admin/users/${user.id}/access`
                                    );
                                  }}
                                />


                                <div className="my-2 border-t border-[#edf0eb]" />


                                {user.status !== "Active" && (
                                  <ActionButton
                                    icon={
                                      <UserCheck size={14} />
                                    }
                                    text="Activate User"
                                    onClick={() =>
                                      changeStatus(
                                        user.id,
                                        "Active"
                                      )
                                    }
                                  />
                                )}


                                {user.status !== "Inactive" && (
                                  <ActionButton
                                    icon={
                                      <UserX size={14} />
                                    }
                                    text="Set Inactive"
                                    onClick={() =>
                                      changeStatus(
                                        user.id,
                                        "Inactive"
                                      )
                                    }
                                  />
                                )}


                                {user.status !== "Suspended" && (
                                  <ActionButton
                                    icon={
                                      <ShieldAlert size={14} />
                                    }
                                    text="Suspend User"
                                    onClick={() =>
                                      changeStatus(
                                        user.id,
                                        "Suspended"
                                      )
                                    }
                                  />
                                )}


                                <div className="my-2 border-t border-[#edf0eb]" />


                                <ActionButton
                                  icon={<Archive size={14} />}
                                  text="Archive User"
                                  danger
                                  onClick={() => {
                                    setActionMenu(null);

                                    alert(
                                      `Archive confirmation for ${user.name} will be added next.`
                                    );
                                  }}
                                />

                              </div>

                            )}

                          </div>

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>


            {/* ==================================================
                NO RESULTS
            ================================================== */}

            {filteredUsers.length === 0 && (

              <div className="flex flex-col items-center justify-center px-6 py-16">

                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#edf5e8]">
                  <Users
                    size={21}
                    className="text-[#57923d]"
                  />
                </div>

                <p className="mt-3 text-sm font-semibold text-[#173b2b]">
                  No users found
                </p>

                <p className="mt-1 text-xs text-[#718177]">
                  Try changing your search or filters.
                </p>

              </div>

            )}


            {/* ==================================================
                FOOTER
            ================================================== */}

            <div className="flex items-center justify-between border-t border-[#edf0eb] bg-[#fbfcfa] px-5 py-4">

              <p className="text-xs text-[#718177]">
                Showing{" "}
                <span className="font-semibold text-[#173b2b]">
                  {filteredUsers.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-[#173b2b]">
                  {users.length}
                </span>{" "}
                users
              </p>

            </div>

          </section>

        </main>

      </div>


      {/* ======================================================
          QUICK USER VIEW
      ====================================================== */}

      {selectedUser && (

        <UserViewModal
          user={selectedUser}
          onClose={() =>
            setSelectedUser(null)
          }
          onFullView={() =>
            navigate(
              `/admin/users/${selectedUser.id}`
            )
          }
        />

      )}

    </div>
  );
}


// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({
  title,
  value,
  icon,
}) {
  return (
    <div className="rounded-2xl border border-[#dfe6da] bg-white p-4">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-xs text-[#718177]">
            {title}
          </p>

          <p className="mt-1 text-xl font-bold text-[#173b2b]">
            {value}
          </p>

        </div>


        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf5e8] text-[#57923d]">
          {icon}
        </div>

      </div>

    </div>
  );
}


// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({ status }) {
  let style =
    "bg-[#edf6e7] text-[#57923d]";

  if (status === "Inactive") {
    style =
      "bg-[#f1f2f0] text-[#718177]";
  }

  if (status === "Suspended") {
    style =
      "bg-[#fff0ed] text-[#b45745]";
  }

  return (
    <span
      className={`
        inline-flex
        rounded-full
        px-3 py-1
        text-[11px]
        font-semibold
        ${style}
      `}
    >
      {status}
    </span>
  );
}


// ============================================================
// ACTION BUTTON
// ============================================================

function ActionButton({
  icon,
  text,
  onClick,
  danger = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex w-full
        items-center gap-3
        px-4 py-2.5
        text-left
        text-xs font-medium
        transition

        ${
          danger
            ? "text-[#b45745] hover:bg-[#fff5f3]"
            : "text-[#526459] hover:bg-[#f5f8f2] hover:text-[#315d36]"
        }
      `}
    >
      {icon}

      {text}
    </button>
  );
}


// ============================================================
// USER QUICK VIEW MODAL
// ============================================================

function UserViewModal({
  user,
  onClose,
  onFullView,
}) {
  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-black/30
        p-5
        backdrop-blur-[2px]
      "
    >

      <div className="w-full max-w-[520px] rounded-2xl border border-[#dfe6da] bg-white shadow-2xl">

        {/* HEADER */}

        <div className="flex items-start justify-between border-b border-[#edf0eb] p-5">

          <div>

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf5e8] text-lg font-bold text-[#57923d]">
                {user.name.charAt(0)}
              </div>

              <div>

                <h2 className="text-lg font-bold text-[#173b2b]">
                  {user.name}
                </h2>

                <p className="mt-0.5 text-xs font-semibold text-[#729061]">
                  {user.userId}
                </p>

              </div>

            </div>

          </div>


          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#718177] hover:bg-[#f3f6f1]"
          >
            <X size={17} />
          </button>

        </div>


        {/* BODY */}

        <div className="p-5">

          <div className="grid gap-4 sm:grid-cols-2">

            <Detail
              label="Email"
              value={user.email}
            />

            <Detail
              label="Mobile"
              value={`+91 ${user.mobile}`}
            />

            <Detail
              label="City"
              value={user.city}
            />

            <Detail
              label="State"
              value={user.state}
            />

            <Detail
              label="Joined"
              value={user.joined}
            />

            <div>

              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a978f]">
                Account Status
              </p>

              <div className="mt-1.5">
                <StatusBadge
                  status={user.status}
                />
              </div>

            </div>

          </div>

        </div>


        {/* FOOTER */}

        <div className="flex justify-end gap-3 border-t border-[#edf0eb] p-5">

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#dfe6da] px-4 py-2.5 text-sm font-medium text-[#617268] hover:bg-[#f5f8f2]"
          >
            Close
          </button>

          <button
            type="button"
            onClick={onFullView}
            className="flex items-center gap-2 rounded-xl bg-[#dff3ad] px-4 py-2.5 text-sm font-semibold text-[#173b2b] hover:bg-[#d5eba2]"
          >
            <Eye size={15} />

            Full User View
          </button>

        </div>

      </div>

    </div>
  );
}


// ============================================================
// DETAIL
// ============================================================

function Detail({
  label,
  value,
}) {
  return (
    <div>

      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a978f]">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-[#354c3d]">
        {value}
      </p>

    </div>
  );
}