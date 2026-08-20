import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Archive,
  ChevronDown,
  Eye,
  Filter,
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
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
// API
// ============================================================

const API_URL = "http://localhost:5000/api/admin/users";

// ============================================================
// ADMIN USERS
// ============================================================

export default function AdminUsers() {
  const navigate = useNavigate();

  // ----------------------------------------------------------
  // STATES
  // ----------------------------------------------------------

  const [users, setUsers] = useState([]);

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    suspendedUsers: 0,
    newThisMonth: 0,
  });

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [registrationFilter, setRegistrationFilter] =
    useState("All");

  const [selectedUser, setSelectedUser] =
    useState(null);

  const [actionMenu, setActionMenu] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [updatingUser, setUpdatingUser] =
    useState(null);

  // ==========================================================
  // FETCH USERS
  // ==========================================================

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("financeos_token") || sessionStorage.getItem("financeos_token");

      const response = await fetch(
        API_URL,
        {
          method: "GET",

          headers: {
            "Content-Type":
              "application/json",

            ...(token
              ? {
                Authorization:
                  `Bearer ${token}`,
              }
              : {}),
          },
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
          "Failed to load users"
        );
      }

      setUsers(data.users || []);

      setStats({
        totalUsers:
          data.stats?.totalUsers || 0,

        activeUsers:
          data.stats?.activeUsers || 0,

        inactiveUsers:
          data.stats?.inactiveUsers || 0,

        suspendedUsers:
          data.stats?.suspendedUsers || 0,

        newThisMonth:
          data.stats?.newThisMonth || 0,
      });
    } catch (error) {
      console.error(
        "Admin Users Error:",
        error
      );

      setError(
        error.message ||
        "Unable to load users"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    fetchUsers();
  }, []);

  // ==========================================================
  // FILTER USERS
  // ==========================================================

  const filteredUsers = useMemo(() => {
    const query =
      search
        .toLowerCase()
        .trim();

    return users.filter((user) => {
      const userId =
        String(user.userId || "")
          .toLowerCase();

      const name =
        String(user.name || "")
          .toLowerCase();

      const email =
        String(user.email || "")
          .toLowerCase();

      const mobile =
        String(
          user.mobile ||
          user.phone ||
          ""
        );

      const city =
        String(user.city || "")
          .toLowerCase();

      const matchesSearch =
        userId.includes(query) ||
        name.includes(query) ||
        email.includes(query) ||
        mobile.includes(query) ||
        city.includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        user.status === statusFilter;

      const registrationGroup =
        getRegistrationGroup(
          user.createdAt
        );

      const matchesRegistration =
        registrationFilter ===
        "All" ||
        registrationGroup ===
        registrationFilter;

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
  // CHANGE STATUS
  // ==========================================================

  const changeStatus = async (
    user,
    newStatus
  ) => {
    try {
      setUpdatingUser(user._id);

      setActionMenu(null);

      const token =
        localStorage.getItem("financeos_token") || sessionStorage.getItem("financeos_token");

      const response = await fetch(
        `${API_URL}/${user._id}/status`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",

            ...(token
              ? {
                Authorization:
                  `Bearer ${token}`,
              }
              : {}),
          },

          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
          "Failed to update status"
        );
      }

      // --------------------------------------------------------
      // Update frontend immediately
      // --------------------------------------------------------

      setUsers(
        (currentUsers) =>
          currentUsers.map(
            (currentUser) =>
              currentUser._id ===
                user._id
                ? {
                  ...currentUser,
                  status:
                    newStatus,
                }
                : currentUser
          )
      );

      // --------------------------------------------------------
      // Refresh statistics
      // --------------------------------------------------------

      await fetchUsers();

    } catch (error) {
      console.error(
        "Change Status Error:",
        error
      );

      alert(
        error.message ||
        "Failed to update user status"
      );
    } finally {
      setUpdatingUser(null);
    }
  };

  // ==========================================================
  // ARCHIVE USER
  // ==========================================================

  const archiveUser = async (user) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to archive ${user.name}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingUser(user._id);

      setActionMenu(null);

      const token =
        localStorage.getItem("financeos_token") || sessionStorage.getItem("financeos_token");

      const response = await fetch(
        `${API_URL}/${user._id}`,
        {
          method: "DELETE",

          headers: {
            "Content-Type":
              "application/json",

            ...(token
              ? {
                Authorization:
                  `Bearer ${token}`,
              }
              : {}),
          },
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
          "Failed to archive user"
        );
      }

      setUsers(
        (currentUsers) =>
          currentUsers.filter(
            (currentUser) =>
              currentUser._id !==
              user._id
          )
      );

      setSelectedUser(null);

      await fetchUsers();

    } catch (error) {
      console.error(
        "Archive User Error:",
        error
      );

      alert(
        error.message ||
        "Failed to archive user"
      );
    } finally {
      setUpdatingUser(null);
    }
  };

  // ==========================================================
  // RESET FILTERS
  // ==========================================================

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setRegistrationFilter("All");
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f8f3]">

      {/* SIDEBAR */}

      <AdminSidebar />

      {/* RIGHT AREA */}

      <div className="flex min-w-0 flex-1 flex-col">

        <AdminTopbar />

        <main className="flex-1 overflow-y-auto p-6">

          {/* ==================================================
              HEADER
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
                Create, review, update and control
                FinanceOS user accounts.
              </p>

            </div>

            <div className="flex gap-3">

              {/* REFRESH */}

              <button
                type="button"
                onClick={fetchUsers}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl border border-[#dfe6da] bg-white px-4 py-2.5 text-sm font-semibold text-[#31523e] transition hover:bg-[#f5f8f2] disabled:opacity-60"
              >
                <RefreshCw
                  size={16}
                  className={
                    loading
                      ? "animate-spin"
                      : ""
                  }
                />

                Refresh
              </button>

              {/* ADD USER */}

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/admin/users/create"
                  )
                }
                className="flex items-center justify-center gap-2 rounded-xl bg-[#dff3ad] px-5 py-2.5 text-sm font-semibold text-[#173b2b] transition hover:bg-[#d5eba2]"
              >
                <Plus size={17} />

                Add User
              </button>

            </div>

          </div>

          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (
            <div className="mt-5 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3">

              <div>

                <p className="text-sm font-semibold text-red-700">
                  Failed to load users
                </p>

                <p className="mt-1 text-xs text-red-600">
                  {error}
                </p>

              </div>

              <button
                type="button"
                onClick={fetchUsers}
                className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white"
              >
                Try Again
              </button>

            </div>
          )}

          {/* ==================================================
              LOADING
          ================================================== */}

          {loading && (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-[#dfe6da] bg-white p-5">

              <RefreshCw
                size={18}
                className="animate-spin text-[#57923d]"
              />

              <p className="text-sm text-[#526459]">
                Loading users from MongoDB...
              </p>

            </div>
          )}

          {/* ==================================================
              SUMMARY
          ================================================== */}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

            <SummaryCard
              title="Total Users"
              value={stats.totalUsers}
              icon={<Users size={19} />}
            />

            <SummaryCard
              title="Active"
              value={stats.activeUsers}
              icon={<UserCheck size={19} />}
            />

            <SummaryCard
              title="Inactive"
              value={stats.inactiveUsers}
              icon={<UserX size={19} />}
            />

            <SummaryCard
              title="Suspended"
              value={stats.suspendedUsers}
              icon={<ShieldAlert size={19} />}
            />

            <SummaryCard
              title="New This Month"
              value={stats.newThisMonth}
              icon={<Plus size={19} />}
            />

          </div>

          {/* ==================================================
              USER DIRECTORY
          ================================================== */}

          <section className="mt-6 overflow-hidden rounded-2xl border border-[#dfe6da] bg-white">

            {/* FILTER HEADER */}

            <div className="border-b border-[#e7ece4] p-5">

              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">

                <div>

                  <h2 className="text-lg font-bold text-[#173b2b]">
                    User Directory
                  </h2>

                  <p className="mt-1 text-xs text-[#718177]">
                    Showing real users from MongoDB.
                  </p>

                </div>

                <div className="flex flex-wrap gap-3">

                  {/* SEARCH */}

                  <div className="relative">

                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#829087]"
                    />

                    <input
                      value={search}
                      onChange={(event) =>
                        setSearch(
                          event.target.value
                        )
                      }
                      placeholder="Search users..."
                      className="w-[280px] rounded-xl border border-[#dfe6da] bg-[#fbfcfa] py-2.5 pl-10 pr-4 text-sm text-[#173b2b] outline-none placeholder:text-[#9aa59e] focus:border-[#9fbd82] focus:ring-2 focus:ring-[#edf5e8]"
                    />

                  </div>

                  {/* STATUS */}

                  <div className="relative">

                    <Filter
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#718177]"
                    />

                    <select
                      value={statusFilter}
                      onChange={(event) =>
                        setStatusFilter(
                          event.target.value
                        )
                      }
                      className="rounded-xl border border-[#dfe6da] bg-[#fbfcfa] py-2.5 pl-9 pr-8 text-sm text-[#526459] outline-none"
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
                    value={
                      registrationFilter
                    }
                    onChange={(event) =>
                      setRegistrationFilter(
                        event.target.value
                      )
                    }
                    className="rounded-xl border border-[#dfe6da] bg-[#fbfcfa] px-4 py-2.5 text-sm text-[#526459] outline-none"
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
                    className="rounded-xl border border-[#dfe6da] px-4 py-2.5 text-sm font-medium text-[#617268] transition hover:bg-[#f5f8f2]"
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

                  <tr className="text-[11px] uppercase tracking-[0.08em] text-[#718177]">

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

                  {filteredUsers.map(
                    (user) => (
                      <tr
                        key={user._id}
                        className="border-t border-[#edf0eb] transition hover:bg-[#fbfcfa]"
                      >

                        {/* USER */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf5e8] text-sm font-bold text-[#57923d]">

                              {getInitial(
                                user.name
                              )}

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
                            +91{" "}
                            {user.mobile ||
                              user.phone ||
                              "--"}
                          </p>

                        </td>

                        {/* LOCATION */}

                        <td className="px-5 py-4">

                          <p className="text-sm text-[#526459]">
                            {user.city ||
                              "--"}
                          </p>

                          <p className="mt-1 text-xs text-[#829087]">
                            {user.state ||
                              "--"}
                          </p>

                        </td>

                        {/* JOINED */}

                        <td className="px-5 py-4 text-sm text-[#617268]">

                          {formatDate(
                            user.createdAt
                          )}

                        </td>

                        {/* STATUS */}

                        <td className="px-5 py-4">

                          {updatingUser ===
                            user._id ? (
                            <div className="flex items-center gap-2 text-xs text-[#718177]">

                              <RefreshCw
                                size={13}
                                className="animate-spin"
                              />

                              Updating...

                            </div>
                          ) : (
                            <StatusBadge
                              status={
                                user.status
                              }
                            />
                          )}

                        </td>

                        {/* ACTIONS */}

                        <td className="relative px-5 py-4">

                          <div className="flex items-center justify-end gap-2">

                            {/* VIEW */}

                            <button
                              type="button"
                              onClick={() =>
                                setSelectedUser(
                                  user
                                )
                              }
                              className="flex items-center gap-1.5 rounded-lg border border-[#dce7d5] px-3 py-2 text-xs font-semibold text-[#43822e] transition hover:bg-[#edf5e8]"
                            >

                              <Eye size={14} />

                              View

                            </button>

                            {/* MANAGE */}

                            <div className="relative">

                              <button
                                type="button"
                                disabled={
                                  updatingUser ===
                                  user._id
                                }
                                onClick={() =>
                                  setActionMenu(
                                    actionMenu ===
                                      user._id
                                      ? null
                                      : user._id
                                  )
                                }
                                className="flex items-center gap-1 rounded-lg border border-[#dce7d5] px-3 py-2 text-xs font-semibold text-[#526459] transition hover:bg-[#f5f8f2]"
                              >

                                Manage

                                <ChevronDown
                                  size={13}
                                />

                              </button>

                              {actionMenu ===
                                user._id && (

                                  <div className="absolute right-0 top-10 z-30 w-[210px] overflow-hidden rounded-xl border border-[#dfe6da] bg-white py-2 shadow-xl">

                                    {/* EDIT */}

                                    <ActionButton
                                      icon={
                                        <Pencil
                                          size={14}
                                        />
                                      }
                                      text="Edit User"
                                      onClick={() => {
                                        setActionMenu(
                                          null
                                        );

                                        navigate(
                                          `/admin/users/${user._id}/edit`
                                        );
                                      }}
                                    />

                                    {/* ACCESS */}

                                    <ActionButton
                                      icon={
                                        <KeyRound
                                          size={14}
                                        />
                                      }
                                      text="Manage Access"
                                      onClick={() => {
                                        setActionMenu(
                                          null
                                        );

                                        navigate(
                                          `/admin/users/${user._id}/access`
                                        );
                                      }}
                                    />

                                    <div className="my-2 border-t border-[#edf0eb]" />

                                    {/* ACTIVATE */}

                                    {user.status !==
                                      "Active" && (

                                        <ActionButton
                                          icon={
                                            <UserCheck
                                              size={14}
                                            />
                                          }
                                          text="Activate User"
                                          onClick={() =>
                                            changeStatus(
                                              user,
                                              "Active"
                                            )
                                          }
                                        />

                                      )}

                                    {/* INACTIVE */}

                                    {user.status !==
                                      "Inactive" && (

                                        <ActionButton
                                          icon={
                                            <UserX
                                              size={14}
                                            />
                                          }
                                          text="Set Inactive"
                                          onClick={() =>
                                            changeStatus(
                                              user,
                                              "Inactive"
                                            )
                                          }
                                        />

                                      )}

                                    {/* SUSPEND */}

                                    {user.status !==
                                      "Suspended" && (

                                        <ActionButton
                                          icon={
                                            <ShieldAlert
                                              size={14}
                                            />
                                          }
                                          text="Suspend User"
                                          onClick={() =>
                                            changeStatus(
                                              user,
                                              "Suspended"
                                            )
                                          }
                                        />

                                      )}

                                    <div className="my-2 border-t border-[#edf0eb]" />

                                    {/* ARCHIVE */}

                                    <ActionButton
                                      icon={
                                        <Archive
                                          size={14}
                                        />
                                      }
                                      text="Archive User"
                                      danger
                                      onClick={() =>
                                        archiveUser(
                                          user
                                        )
                                      }
                                    />

                                  </div>

                                )}

                            </div>

                          </div>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>

            {/* ==================================================
                NO RESULTS
            ================================================== */}

            {!loading &&
              filteredUsers.length ===
              0 && (

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
                    Try changing your search
                    or filters.
                  </p>

                </div>

              )}

            {/* FOOTER */}

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
          USER VIEW MODAL
      ====================================================== */}

      {selectedUser && (

        <UserViewModal
          user={selectedUser}
          onClose={() =>
            setSelectedUser(null)
          }
          onFullView={() => {
            navigate(
              `/admin/users/${selectedUser._id}`
            );

            setSelectedUser(null);
          }}
        />

      )}

    </div>
  );
}

// ============================================================
// REGISTRATION GROUP
// ============================================================

function getRegistrationGroup(
  createdAt
) {
  if (!createdAt) {
    return "Previous";
  }

  const date =
    new Date(createdAt);

  const now = new Date();

  if (
    date.getMonth() ===
    now.getMonth() &&
    date.getFullYear() ===
    now.getFullYear()
  ) {
    return "This Month";
  }

  return "Previous";
}

// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(date) {
  if (!date) {
    return "--";
  }

  const parsedDate =
    new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return "--";
  }

  return parsedDate.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

// ============================================================
// INITIAL
// ============================================================

function getInitial(name) {
  if (!name) {
    return "?";
  }

  return name
    .trim()
    .charAt(0)
    .toUpperCase();
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
            {Number(value || 0).toLocaleString()}
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

function StatusBadge({
  status,
}) {
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
      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${style}`}
    >
      {status || "Active"}
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
      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-xs font-medium transition ${danger
          ? "text-[#b45745] hover:bg-[#fff5f3]"
          : "text-[#526459] hover:bg-[#f5f8f2] hover:text-[#315d36]"
        }`}
    >
      {icon}

      {text}
    </button>
  );
}

// ============================================================
// USER VIEW MODAL
// ============================================================

function UserViewModal({
  user,
  onClose,
  onFullView,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-5 backdrop-blur-[2px]">

      <div className="w-full max-w-[560px] rounded-2xl border border-[#dfe6da] bg-white shadow-2xl">

        {/* HEADER */}

        <div className="flex items-start justify-between border-b border-[#edf0eb] p-5">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf5e8] text-lg font-bold text-[#57923d]">
              {getInitial(
                user.name
              )}
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

          <div className="grid gap-5 sm:grid-cols-2">

            <Detail
              label="Email"
              value={user.email}
            />

            <Detail
              label="Mobile"
              value={
                user.mobile ||
                user.phone ||
                "--"
              }
            />

            <Detail
              label="City"
              value={
                user.city || "--"
              }
            />

            <Detail
              label="State"
              value={
                user.state || "--"
              }
            />

            <Detail
              label="Gender"
              value={
                user.gender || "--"
              }
            />

            <Detail
              label="Date of Birth"
              value={
                formatDate(
                  user.dateOfBirth
                )
              }
            />

            <Detail
              label="Joined"
              value={
                formatDate(
                  user.createdAt
                )
              }
            />

            <div>

              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a978f]">
                Account Status
              </p>

              <div className="mt-1.5">

                <StatusBadge
                  status={
                    user.status
                  }
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