import { useEffect, useMemo, useRef, useState } from "react";

import {
  CalendarDays,
  Download,
  FileText,
  Filter,
  Mail,
  Phone,
  RefreshCcw,
  Search,
  Users,
} from "lucide-react";

import AdminSidebar from "../components/AdminSidebar.jsx";
import AdminTopbar from "../components/AdminTopbar.jsx";
import CenteredModal from "../components/common/CenteredModal.jsx";
import { generateFinancialReport } from "../utils/generateFinancialReport.js";


// ============================================================
// API
// ============================================================

const API_URL =
  "http://localhost:5000/api/admin/reports/users";

// ============================================================
// PAGE
// ============================================================

export default function AdminReports() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [month, setMonth] = useState("All");
  const [year, setYear] = useState("All");
  const [minIncome, setMinIncome] = useState("");
  const [maxIncome, setMaxIncome] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [downloadingRowId, setDownloadingRowId] = useState(null);
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: "Notice",
    message: "",
    iconType: "info",
  });

  const selectAllCheckboxRef = useRef(null);


  // ==========================================================
  // FETCH USERS
  // ==========================================================

  const fetchReportUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("financeos_token") ||
        sessionStorage.getItem("financeos_token");

      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {}),
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load report users"
        );
      }

      setUsers(data.users || []);
    } catch (fetchError) {
      console.error("Admin Reports Error:", fetchError);

      setError(
        fetchError.message || "Unable to load report users"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportUsers();
  }, []);


  // ==========================================================
  // REGISTRATION YEARS
  // ==========================================================

  const registrationYears = useMemo(() => {
    const years = new Set();

    users.forEach((user) => {
      if (!user.registered) {
        return;
      }

      const date = new Date(user.registered);

      if (!Number.isNaN(date.getTime())) {
        years.add(String(date.getFullYear()));
      }
    });

    return Array.from(years).sort(
      (left, right) => Number(right) - Number(left)
    );
  }, [users]);


  // ==========================================================
  // FILTER USERS
  // ==========================================================

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const query = search.toLowerCase().trim();

      const matchesSearch =
        !query ||
        user.id.toLowerCase().includes(query) ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phone.includes(query) ||
        user.city.toLowerCase().includes(query);

      const matchesStatus =
        status === "All" ||
        user.status === status;

      const date = new Date(user.registered);

      const userMonth = Number.isNaN(date.getTime())
        ? ""
        : String(date.getMonth() + 1).padStart(2, "0");

      const userYear = Number.isNaN(date.getTime())
        ? ""
        : String(date.getFullYear());

      const matchesMonth =
        month === "All" ||
        userMonth === month;

      const matchesYear =
        year === "All" ||
        userYear === year;

      const matchesMinIncome =
        !minIncome ||
        user.income >= Number(minIncome);

      const matchesMaxIncome =
        !maxIncome ||
        user.income <= Number(maxIncome);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesMonth &&
        matchesYear &&
        matchesMinIncome &&
        matchesMaxIncome
      );
    });
  }, [
    users,
    search,
    status,
    month,
    year,
    minIncome,
    maxIncome,
  ]);


  // ==========================================================
  // SUMMARY
  // ==========================================================

  const activeUsers = filteredUsers.filter(
    (user) => user.status === "Active"
  ).length;

  const inactiveUsers = filteredUsers.filter(
    (user) => user.status === "Inactive"
  ).length;

  const suspendedUsers = filteredUsers.filter(
    (user) => user.status === "Suspended"
  ).length;


  // ==========================================================
  // ALL FILTERED SELECTED & INDETERMINATE STATE
  // ==========================================================

  const allFilteredSelected = useMemo(() => {
    return (
      filteredUsers.length > 0 &&
      filteredUsers.every((user) => selectedUsers.includes(user.id))
    );
  }, [filteredUsers, selectedUsers]);

  const someFilteredSelected = useMemo(() => {
    return (
      filteredUsers.some((user) => selectedUsers.includes(user.id)) &&
      !allFilteredSelected
    );
  }, [filteredUsers, selectedUsers, allFilteredSelected]);

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = someFilteredSelected;
    }
  }, [someFilteredSelected]);


  // ==========================================================
  // SELECT USER
  // ==========================================================

  function toggleUser(id) {
    setSelectedUsers((current) =>
      current.includes(id)
        ? current.filter(
            (userId) => userId !== id
          )
        : [...current, id]
    );
  }


  // ==========================================================
  // SELECT ALL FILTERED USERS
  // ==========================================================

  function toggleAll() {
    const filteredIds = filteredUsers.map(
      (user) => user.id
    );

    if (filteredIds.length === 0) return;

    if (allFilteredSelected) {
      setSelectedUsers((current) =>
        current.filter(
          (id) => !filteredIds.includes(id)
        )
      );

      return;
    }

    setSelectedUsers((current) => [
      ...new Set([
        ...current,
        ...filteredIds,
      ]),
    ]);
  }


  // ==========================================================
  // RESET FILTERS
  // ==========================================================

  function resetFilters() {
    setSearch("");
    setStatus("All");
    setMonth("All");
    setYear("All");
    setMinIncome("");
    setMaxIncome("");
    setSelectedUsers([]);
  }


  // ==========================================================
  // GET USERS FOR REPORT
  //
  // Selected users -> only selected users
  // No selection   -> all filtered users
  // ==========================================================

  function getReportUsers() {
    if (selectedUsers.length === 0) {
      return filteredUsers;
    }

    return users.filter((user) =>
      selectedUsers.includes(user.id)
    );
  }


  // ==========================================================
  // ROW-SPECIFIC USER REPORT DOWNLOAD
  // ==========================================================

  const handleDownloadUserReport = async (user) => {
    if (!user) return;
    if (downloadingRowId || exportingCsv || generatingPdf) return;

    const targetDbId = user._id;
    if (!targetDbId) {
      setModalState({
        isOpen: true,
        title: "Invalid User",
        message: "User database identifier is missing.",
        iconType: "error",
      });
      return;
    }

    try {
      setDownloadingRowId(targetDbId);

      const token =
        localStorage.getItem("financeos_token") ||
        sessionStorage.getItem("financeos_token");

      const params = new URLSearchParams();
      if (year && year !== "All") params.append("year", year);
      if (month && month !== "All") {
        params.append("duration", "monthly");
        params.append("month", String(Number(month)));
      } else if (year && year !== "All") {
        params.append("duration", "yearly");
      }

      const queryString = params.toString() ? `?${params.toString()}` : "";
      const response = await fetch(
        `http://localhost:5000/api/admin/users/${targetDbId}/reports${queryString}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to generate report for user.");
      }

      generateFinancialReport(data.report);
    } catch (err) {
      console.error("Individual User Report Download Error:", err);
      setModalState({
        isOpen: true,
        title: "Download Failed",
        message: err.message || "Unable to download user report. Please try again.",
        iconType: "error",
      });
    } finally {
      setDownloadingRowId(null);
    }
  };


  // ==========================================================
  // EXPORT CSV
  // ==========================================================

  const exportCSV = async () => {
    if (exportingCsv || generatingPdf) return;

    const reportUsers = getReportUsers();

    if (reportUsers.length === 0) {
      setModalState({
        isOpen: true,
        title: "No Users Selected",
        message: "No users selected. Please select at least one user.",
        iconType: "warning",
      });
      return;
    }

    try {
      setExportingCsv(true);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const headers = [
        "User ID",
        "Name",
        "Email",
        "Mobile",
        "City",
        "Registered",
        "Income",
        "Status",
      ];

      const rows = reportUsers.map((user) => [
        user.id,
        user.name,
        user.email,
        `+91 ${user.phone || "—"}`,
        user.city,
        formatDate(user.registered),
        user.income,
        user.status,
      ]);

      const csvContent = [
        headers,
        ...rows,
      ]
        .map((row) =>
          row
            .map((value) =>
              `"${String(value ?? "").replace(
                /"/g,
                '""'
              )}"`
            )
            .join(",")
        )
        .join("\n");

      // UTF-8 BOM helps Excel read the CSV correctly.
      const blob = new Blob(
        ["\uFEFF" + csvContent],
        {
          type: "text/csv;charset=utf-8;",
        }
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const today = new Date()
        .toISOString()
        .slice(0, 10);

      link.href = url;
      link.download =
        `FinanceOS-Users-Report-${today}.csv`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export CSV Error:", err);
      setModalState({
        isOpen: true,
        title: "Export Failed",
        message: err.message || "Failed to export CSV report.",
        iconType: "error",
      });
    } finally {
      setExportingCsv(false);
    }
  };


  // ==========================================================
  // GENERATE PDF / PRINT REPORT
  // ==========================================================

  const generatePDF = async () => {
    if (generatingPdf || exportingCsv) return;

    const reportUsers = getReportUsers();

    if (reportUsers.length === 0) {
      setModalState({
        isOpen: true,
        title: "No Users Selected",
        message: "No users selected. Please select at least one user.",
        iconType: "warning",
      });
      return;
    }

    try {
      setGeneratingPdf(true);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const reportWindow = window.open(
        "",
        "_blank"
      );

      if (!reportWindow) {
        setModalState({
          isOpen: true,
          title: "Pop-up Blocked",
          message:
            "Your browser blocked the report window. Please allow pop-ups and try again.",
          iconType: "warning",
        });

        return;
      }

    const generatedDate =
      new Date().toLocaleString("en-IN");

    const reportActiveUsers =
      reportUsers.filter(
        (user) => user.status === "Active"
      ).length;

    const reportInactiveUsers =
      reportUsers.filter(
        (user) => user.status === "Inactive"
      ).length;

    const reportSuspendedUsers =
      reportUsers.filter(
        (user) => user.status === "Suspended"
      ).length;


    const rows = reportUsers
      .map(
        (user, index) => `
          <tr>

            <td>
              ${index + 1}
            </td>

            <td>
              ${escapeHTML(user.id)}
            </td>

            <td>
              ${escapeHTML(user.name)}
            </td>

            <td>
              ${escapeHTML(user.email)}
            </td>

            <td>
              +91 ${escapeHTML(user.phone || "—")}
            </td>

            <td>
              ${escapeHTML(user.city)}
            </td>

            <td>
              ${escapeHTML(
                formatDate(user.registered)
              )}
            </td>

            <td>
              ₹${user.income.toLocaleString(
                "en-IN"
              )}
            </td>

            <td>
              ${escapeHTML(user.status)}
            </td>

          </tr>
        `
      )
      .join("");


    reportWindow.document.write(`
      <!DOCTYPE html>

      <html lang="en">

        <head>

          <meta charset="UTF-8" />

          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />

          <title>
            FinanceOS User Report
          </title>


          <style>

            * {
              box-sizing: border-box;
            }


            body {
              margin: 0;
              padding: 30px;

              font-family:
                Arial,
                Helvetica,
                sans-serif;

              color: #173b2b;

              background: white;
            }


            .header {
              display: flex;

              align-items: flex-start;

              justify-content: space-between;

              gap: 30px;

              padding-bottom: 20px;

              margin-bottom: 25px;

              border-bottom:
                2px solid #57923d;
            }


            .brand {
              font-size: 28px;

              font-weight: 700;

              color: #28622e;
            }


            .portal {
              margin-top: 5px;

              font-size: 10px;

              font-weight: 700;

              letter-spacing: 2px;

              color: #57923d;
            }


            .report-info {
              text-align: right;
            }


            .report-info h1 {
              margin: 0;

              font-size: 22px;
            }


            .report-info p {
              margin: 7px 0 0;

              font-size: 11px;

              color: #718177;
            }


            .summary {
              display: grid;

              grid-template-columns:
                repeat(4, 1fr);

              gap: 12px;

              margin-bottom: 25px;
            }


            .summary-card {
              padding: 14px;

              border:
                1px solid #dfe6da;

              border-radius: 8px;
            }


            .summary-card p {
              margin: 0;

              font-size: 10px;

              color: #718177;
            }


            .summary-card strong {
              display: block;

              margin-top: 6px;

              font-size: 20px;

              color: #173b2b;
            }


            .section-title {
              margin-bottom: 12px;

              font-size: 15px;

              font-weight: 700;
            }


            table {
              width: 100%;

              border-collapse: collapse;

              font-size: 9px;
            }


            th {
              padding: 9px 7px;

              text-align: left;

              background: #edf5e8;

              border:
                1px solid #d9e2d4;

              color: #173b2b;
            }


            td {
              padding: 8px 7px;

              border:
                1px solid #dfe6da;

              vertical-align: top;
            }


            tbody tr:nth-child(even) {
              background: #fafcf9;
            }


            .footer {
              display: flex;

              justify-content: space-between;

              gap: 20px;

              margin-top: 25px;

              padding-top: 12px;

              border-top:
                1px solid #dfe6da;

              font-size: 9px;

              color: #718177;
            }


            @media print {

              body {
                padding: 0;
              }


              @page {
                size: landscape;

                margin: 12mm;
              }

            }

          </style>

        </head>


        <body>


          <!-- HEADER -->

          <div class="header">

            <div>

              <div class="brand">
                FinanceOS
              </div>

              <div class="portal">
                ADMIN PORTAL
              </div>

            </div>


            <div class="report-info">

              <h1>
                User Report
              </h1>

              <p>
                Generated:
                ${escapeHTML(generatedDate)}
              </p>

            </div>

          </div>


          <!-- SUMMARY -->

          <div class="summary">

            <div class="summary-card">

              <p>
                Total Users
              </p>

              <strong>
                ${reportUsers.length}
              </strong>

            </div>


            <div class="summary-card">

              <p>
                Active
              </p>

              <strong>
                ${reportActiveUsers}
              </strong>

            </div>


            <div class="summary-card">

              <p>
                Inactive
              </p>

              <strong>
                ${reportInactiveUsers}
              </strong>

            </div>


            <div class="summary-card">

              <p>
                Suspended
              </p>

              <strong>
                ${reportSuspendedUsers}
              </strong>

            </div>

          </div>


          <!-- USER TABLE -->

          <div class="section-title">
            User Details
          </div>


          <table>

            <thead>

              <tr>

                <th>
                  #
                </th>

                <th>
                  User ID
                </th>

                <th>
                  Name
                </th>

                <th>
                  Email
                </th>

                <th>
                  Mobile
                </th>

                <th>
                  City
                </th>

                <th>
                  Registered
                </th>

                <th>
                  Income
                </th>

                <th>
                  Status
                </th>

              </tr>

            </thead>


            <tbody>

              ${rows}

            </tbody>

          </table>


          <!-- FOOTER -->

          <div class="footer">

            <span>
              FinanceOS Administrative Report
            </span>

            <span>
              ${reportUsers.length}
              user(s) included
            </span>

          </div>


          <script>

            window.onload = function () {

              window.focus();

              window.print();

            };

          </script>

        </body>

      </html>
    `);


      reportWindow.document.close();
    } catch (err) {
      console.error("Generate PDF Error:", err);
      setModalState({
        isOpen: true,
        title: "Generation Failed",
        message: err.message || "Failed to generate report window.",
        iconType: "error",
      });
    } finally {
      setGeneratingPdf(false);
    }
  };


  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f8f3]">

      <AdminSidebar />


      <div className="flex min-w-0 flex-1 flex-col">

        <AdminTopbar />


        <main className="flex-1 overflow-y-auto p-6">

          <div className="mx-auto max-w-[1400px]">


            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

              <div>

                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#639a48]">
                  Administration
                </p>

                <h1 className="mt-1 text-2xl font-bold text-[#173b2b]">
                  Reports
                </h1>

                <p className="mt-1 text-sm text-[#718177]">
                  Search, filter and generate FinanceOS user reports.
                </p>

              </div>


              <div className="flex flex-wrap gap-2">

                <button
                  type="button"
                  onClick={fetchReportUsers}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-xl border border-[#dce4d8] bg-white px-4 py-2.5 text-sm font-semibold text-[#526459] transition hover:bg-[#f5f8f2] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCcw
                    size={16}
                    className={loading ? "animate-spin" : ""}
                  />

                  Refresh
                </button>

                {/* CSV */}

                <button
                  type="button"
                  onClick={exportCSV}
                  disabled={exportingCsv || generatingPdf}
                  className="flex items-center gap-2 rounded-xl border border-[#dce4d8] bg-white px-4 py-2.5 text-sm font-semibold text-[#526459] transition hover:bg-[#f5f8f2] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {exportingCsv ? (
                    <RefreshCcw size={16} className="animate-spin text-[#57923d]" />
                  ) : (
                    <Download size={16} />
                  )}

                  {exportingCsv ? "Exporting..." : "Export CSV"}
                </button>


                {/* PDF */}

                <button
                  type="button"
                  onClick={generatePDF}
                  disabled={generatingPdf || exportingCsv}
                  className="flex items-center gap-2 rounded-xl bg-[#dff3ad] px-4 py-2.5 text-sm font-bold text-[#173b2b] transition hover:bg-[#d5eba2] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {generatingPdf ? (
                    <RefreshCcw size={16} className="animate-spin text-[#173b2b]" />
                  ) : (
                    <FileText size={16} />
                  )}

                  {generatingPdf ? "Generating..." : "Generate PDF"}
                </button>

              </div>

            </div>


            {error && (
              <div className="mt-5 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-red-700">
                    Failed to load report users
                  </p>
                  <p className="mt-1 text-xs text-red-600">
                    {error}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fetchReportUsers}
                  className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                >
                  Try Again
                </button>
              </div>
            )}

            {loading && (
              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-[#dfe6da] bg-white p-5">
                <RefreshCcw
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

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <SummaryCard
                title="Report Results"
                value={filteredUsers.length}
                subtitle="Users matching filters"
              />

              <SummaryCard
                title="Active"
                value={activeUsers}
                subtitle="Active accounts"
              />

              <SummaryCard
                title="Inactive"
                value={inactiveUsers}
                subtitle="Inactive accounts"
              />

              <SummaryCard
                title="Suspended"
                value={suspendedUsers}
                subtitle="Suspended accounts"
              />

            </div>


            {/* ==================================================
                FILTER PANEL
            ================================================== */}

            <section className="mt-5 rounded-2xl border border-[#dfe6da] bg-white p-5">

              <div className="flex items-center justify-between gap-4">

                <div>

                  <div className="flex items-center gap-2">

                    <Filter
                      size={17}
                      className="text-[#57923d]"
                    />

                    <h2 className="font-bold text-[#173b2b]">
                      Report Filters
                    </h2>

                  </div>

                  <p className="mt-1 text-xs text-[#718177]">
                    Combine filters to create a specific user report.
                  </p>

                </div>


                <button
                  type="button"
                  onClick={resetFilters}
                  className="flex items-center gap-2 rounded-lg border border-[#dfe4dc] px-3 py-2 text-xs font-semibold text-[#617268] transition hover:bg-[#f5f7f4]"
                >
                  <RefreshCcw size={14} />

                  Reset
                </button>

              </div>


              {/* SEARCH */}

              <div className="relative mt-5">

                <Search
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#839188]"
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search User ID, name, email, mobile number or city..."
                  className="w-full rounded-xl border border-[#dce4d8] bg-[#fbfcfa] py-3 pl-11 pr-4 text-sm text-[#173b2b] outline-none placeholder:text-[#a0aaa3] focus:border-[#9fbd82] focus:ring-2 focus:ring-[#edf5e8]"
                />

              </div>


              {/* FILTERS */}

              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">


                {/* STATUS */}

                <FilterSelect
                  label="Account Status"
                  value={status}
                  onChange={(event) =>
                    setStatus(
                      event.target.value
                    )
                  }
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

                </FilterSelect>


                {/* MONTH */}

                <FilterSelect
                  label="Registration Month"
                  value={month}
                  onChange={(event) =>
                    setMonth(
                      event.target.value
                    )
                  }
                >

                  <option value="All">
                    All Months
                  </option>

                  <option value="01">
                    January
                  </option>

                  <option value="02">
                    February
                  </option>

                  <option value="03">
                    March
                  </option>

                  <option value="04">
                    April
                  </option>

                  <option value="05">
                    May
                  </option>

                  <option value="06">
                    June
                  </option>

                  <option value="07">
                    July
                  </option>

                  <option value="08">
                    August
                  </option>

                  <option value="09">
                    September
                  </option>

                  <option value="10">
                    October
                  </option>

                  <option value="11">
                    November
                  </option>

                  <option value="12">
                    December
                  </option>

                </FilterSelect>


                {/* YEAR */}

                <FilterSelect
                  label="Registration Year"
                  value={year}
                  onChange={(event) =>
                    setYear(
                      event.target.value
                    )
                  }
                >

                  <option value="All">
                    All Years
                  </option>

                  {registrationYears.map((registrationYear) => (
                    <option
                      key={registrationYear}
                      value={registrationYear}
                    >
                      {registrationYear}
                    </option>
                  ))}

                </FilterSelect>


                {/* MIN INCOME */}

                <FilterInput
                  label="Minimum Income"
                  type="number"
                  value={minIncome}
                  onChange={(event) =>
                    setMinIncome(
                      event.target.value
                    )
                  }
                  placeholder="Min"
                />


                {/* MAX INCOME */}

                <FilterInput
                  label="Maximum Income"
                  type="number"
                  value={maxIncome}
                  onChange={(event) =>
                    setMaxIncome(
                      event.target.value
                    )
                  }
                  placeholder="Max"
                />

              </div>

            </section>


            {/* ==================================================
                REPORT RESULTS
            ================================================== */}

            <section className="mt-5 rounded-2xl border border-[#dfe6da] bg-white">


              {/* STICKY ACTION HEADER */}

              <div className="sticky top-0 z-20 flex flex-col gap-3 rounded-t-2xl border-b border-[#edf0eb] bg-white/95 backdrop-blur-sm p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between shadow-xs">

                <div>

                  <h2 className="font-bold text-[#173b2b]">
                    Report Results
                  </h2>

                  <p className="mt-1 text-xs text-[#718177]">

                    {filteredUsers.length} {filteredUsers.length === 1 ? "user" : "users"} found

                    {" • "}

                    <span className={selectedUsers.length > 0 ? "font-semibold text-[#57923d]" : ""}>
                      {selectedUsers.length} {selectedUsers.length === 1 ? "user" : "users"} selected
                    </span>

                  </p>

                </div>


                <div className="flex flex-wrap items-center gap-2">

                  <div className="hidden items-center gap-1.5 text-xs text-[#718177] xl:flex mr-2">

                    <CalendarDays size={14} />

                    Report date:{" "}

                    {new Date().toLocaleDateString(
                      "en-IN",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }
                    )}

                  </div>

                  {/* REFRESH */}
                  <button
                    type="button"
                    onClick={fetchReportUsers}
                    disabled={loading}
                    title="Refresh users list"
                    className="flex items-center gap-2 rounded-xl border border-[#dce4d8] bg-white px-3.5 py-2 text-xs font-semibold text-[#526459] transition hover:bg-[#f5f8f2] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RefreshCcw
                      size={14}
                      className={loading ? "animate-spin" : ""}
                    />

                    Refresh
                  </button>

                  {/* EXPORT CSV */}
                  <button
                    type="button"
                    onClick={exportCSV}
                    disabled={exportingCsv || generatingPdf}
                    title="Export CSV report"
                    className="flex items-center gap-2 rounded-xl border border-[#dce4d8] bg-white px-3.5 py-2 text-xs font-semibold text-[#526459] transition hover:bg-[#f5f8f2] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {exportingCsv ? (
                      <RefreshCcw size={14} className="animate-spin text-[#57923d]" />
                    ) : (
                      <Download size={14} />
                    )}

                    {exportingCsv ? "Exporting..." : "Export CSV"}
                  </button>

                  {/* GENERATE PDF */}
                  <button
                    type="button"
                    onClick={generatePDF}
                    disabled={generatingPdf || exportingCsv}
                    title="Generate PDF report"
                    className="flex items-center gap-2 rounded-xl bg-[#dff3ad] px-3.5 py-2 text-xs font-bold text-[#173b2b] transition hover:bg-[#d5eba2] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {generatingPdf ? (
                      <RefreshCcw size={14} className="animate-spin text-[#173b2b]" />
                    ) : (
                      <FileText size={14} />
                    )}

                    {generatingPdf ? "Generating..." : "Generate PDF"}
                  </button>

                </div>

              </div>


              {/* TABLE */}

              <div className="overflow-x-auto rounded-b-2xl">

                <table className="w-full min-w-[1000px]">

                  <thead className="bg-[#fafcf9]">

                    <tr className="border-b border-[#edf0eb]">


                      {/* SELECT ALL */}

                      <th className="w-[60px] px-5 py-4 text-left">

                        <input
                          ref={selectAllCheckboxRef}
                          type="checkbox"
                          checked={
                            allFilteredSelected
                          }
                          onChange={toggleAll}
                          aria-label="Select all displayed users"
                          className="h-4 w-4 accent-[#57923d] cursor-pointer"
                        />

                      </th>


                      <TableHeading>
                        User
                      </TableHeading>

                      <TableHeading>
                        Contact
                      </TableHeading>

                      <TableHeading>
                        City
                      </TableHeading>

                      <TableHeading>
                        Registered
                      </TableHeading>

                      <TableHeading>
                        Income
                      </TableHeading>

                      <TableHeading>
                        Status
                      </TableHeading>

                      <th className="px-4 py-4 text-right text-[10px] font-bold uppercase tracking-[0.08em] text-[#718177]">
                        Action
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {filteredUsers.length > 0 ? (

                      filteredUsers.map(
                        (user) => (

                          <UserRow
                            key={user.id}
                            user={user}
                            selected={selectedUsers.includes(
                              user.id
                            )}
                            onSelect={() =>
                              toggleUser(
                                user.id
                              )
                            }
                            onDownloadReport={handleDownloadUserReport}
                            downloading={downloadingRowId === user._id}
                          />

                        )
                      )

                    ) : loading ? null : (

                      <tr>

                        <td
                          colSpan="8"
                          className="px-5 py-16 text-center"
                        >

                          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#edf5e8] text-[#57923d]">

                            <Users size={20} />

                          </div>


                          <p className="mt-3 text-sm font-semibold text-[#173b2b]">
                            No users found
                          </p>


                          <p className="mt-1 text-xs text-[#718177]">
                            Change or reset your report filters.
                          </p>

                        </td>

                      </tr>

                    )}

                  </tbody>

                </table>

              </div>

            </section>


            {/* ==================================================
                REPORT INFORMATION
            ================================================== */}

            <section className="mt-5 rounded-2xl border border-[#dce6d6] bg-[#f0f7eb] p-5">

              <div className="flex gap-3">

                <FileText
                  size={19}
                  className="mt-0.5 shrink-0 text-[#57923d]"
                />


                <div>

                  <p className="text-sm font-bold text-[#173b2b]">
                    Report generation
                  </p>


                  <p className="mt-1 text-xs leading-5 text-[#617268]">

                    If users are selected, the report contains
                    only those users. If no users are selected,
                    the report contains all users matching the
                    current filters.

                  </p>

                  <p className="mt-2 text-xs leading-5 text-[#617268]">

                    CSV downloads directly. Generate PDF opens
                    the FinanceOS printable report. Choose
                    "Save as PDF" in the browser print window
                    to save the PDF file.

                  </p>

                </div>

              </div>

            </section>

            {/* ==================================================
                MODAL
            ================================================== */}

            <CenteredModal
              isOpen={modalState.isOpen}
              onClose={() =>
                setModalState((prev) => ({
                  ...prev,
                  isOpen: false,
                }))
              }
              title={modalState.title}
              message={modalState.message}
              iconType={modalState.iconType}
            />

          </div>

        </main>

      </div>

    </div>
  );
}


// ============================================================
// USER ROW
// ============================================================

function UserRow({
  user,
  selected,
  onSelect,
  onDownloadReport,
  downloading,
}) {
  return (
    <tr className="border-b border-[#edf0eb] last:border-b-0 hover:bg-[#fbfcfa]">

      <td className="px-5 py-4">

        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          aria-label={`Select ${user.name}`}
          className="h-4 w-4 accent-[#57923d] cursor-pointer"
        />

      </td>


      {/* USER */}

      <td className="px-4 py-4">

        <div className="flex items-start gap-3">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf5e8] text-sm font-bold text-[#57923d] mt-0.5">

            {user.name.charAt(0)}

          </div>


          <div>

            <p className="text-sm font-semibold text-[#173b2b]">
              {user.name}
            </p>

            <p className="mt-0.5 font-mono text-[10px] font-semibold text-[#639a48]">
              {user.id}
            </p>

            <button
              type="button"
              onClick={() => onDownloadReport(user)}
              disabled={downloading}
              title="Download Report"
              aria-label={`Download Report for ${user.name}`}
              className="mt-1.5 inline-flex items-center gap-1 rounded-md border border-[#dce4d8] bg-white px-2 py-0.5 text-[10px] font-semibold text-[#2f6634] transition hover:bg-[#edf5e8] hover:border-[#b8d4ab] disabled:cursor-not-allowed disabled:opacity-60 shadow-2xs"
            >
              {downloading ? (
                <>
                  <RefreshCcw
                    size={10}
                    className="animate-spin text-[#57923d]"
                  />
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <Download
                    size={10}
                    className="text-[#57923d]"
                  />
                  <span>Download Report</span>
                </>
              )}
            </button>

          </div>

        </div>

      </td>


      {/* CONTACT */}

      <td className="px-4 py-4">

        <div className="space-y-1">

          <div className="flex items-center gap-2 text-xs text-[#526459]">

            <Mail size={13} />

            {user.email}

          </div>


          <div className="flex items-center gap-2 text-xs text-[#829087]">

            <Phone size={13} />

            +91 {user.phone || "—"}

          </div>

        </div>

      </td>


      {/* CITY */}

      <td className="px-4 py-4 text-sm text-[#526459]">
        {user.city || "—"}
      </td>


      {/* REGISTERED */}

      <td className="px-4 py-4 text-sm text-[#526459]">
        {formatDate(
          user.registered
        )}
      </td>


      {/* INCOME */}

      <td className="px-4 py-4 text-sm font-semibold text-[#173b2b]">

        ₹
        {user.income.toLocaleString(
          "en-IN"
        )}

      </td>


      {/* STATUS */}

      <td className="px-4 py-4">

        <StatusBadge
          status={user.status}
        />

      </td>


      {/* ACTION */}

      <td className="px-4 py-4 text-right">

        <button
          type="button"
          onClick={() => onDownloadReport(user)}
          disabled={downloading}
          title="Download Report"
          aria-label={`Download Report for ${user.name}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#dce4d8] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#173b2b] transition hover:bg-[#edf5e8] hover:border-[#b8d4ab] disabled:cursor-not-allowed disabled:opacity-60 shadow-xs"
        >
          {downloading ? (
            <>
              <RefreshCcw
                size={13}
                className="animate-spin text-[#57923d]"
              />

              <span>Downloading...</span>
            </>
          ) : (
            <>
              <Download
                size={13}
                className="text-[#57923d]"
              />

              <span>Download Report</span>
            </>
          )}
        </button>

      </td>

    </tr>
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
      className={`rounded-full px-3 py-1 text-[10px] font-semibold ${style}`}
    >
      {status}
    </span>
  );
}


// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({
  title,
  value,
  subtitle,
}) {
  return (
    <div className="rounded-2xl border border-[#dfe6da] bg-white p-5">

      <p className="text-xs font-medium text-[#718177]">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold text-[#173b2b]">
        {value}
      </p>

      <p className="mt-2 text-xs text-[#8a978f]">
        {subtitle}
      </p>

    </div>
  );
}


// ============================================================
// FILTER INPUT
// ============================================================

function FilterInput({
  label,
  ...props
}) {
  return (
    <div>

      <label className="mb-2 block text-[11px] font-semibold text-[#617268]">
        {label}
      </label>

      <input
        {...props}
        className="w-full rounded-xl border border-[#dce4d8] bg-[#fbfcfa] px-3 py-2.5 text-sm text-[#173b2b] outline-none focus:border-[#9fbd82] focus:ring-2 focus:ring-[#edf5e8]"
      />

    </div>
  );
}


// ============================================================
// FILTER SELECT
// ============================================================

function FilterSelect({
  label,
  children,
  ...props
}) {
  return (
    <div>

      <label className="mb-2 block text-[11px] font-semibold text-[#617268]">
        {label}
      </label>

      <select
        {...props}
        className="w-full rounded-xl border border-[#dce4d8] bg-[#fbfcfa] px-3 py-2.5 text-sm text-[#173b2b] outline-none focus:border-[#9fbd82] focus:ring-2 focus:ring-[#edf5e8]"
      >

        {children}

      </select>

    </div>
  );
}


// ============================================================
// TABLE HEADING
// ============================================================

function TableHeading({
  children,
}) {
  return (
    <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-[#718177]">

      {children}

    </th>
  );
}


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}


// ============================================================
// ESCAPE HTML
//
// Prevent user values from becoming HTML inside PDF report.
// ============================================================

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}