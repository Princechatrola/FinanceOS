// ============================================================
// FINANCEOS - TEMPORARY ADMINISTRATOR STORAGE
// Later replace this file with backend API calls.
// ============================================================

const STORAGE_KEY = "financeos_administrators";

export const defaultAdministrators = [
  {
    id: 1,
    adminId: "FOS-A-00001",
    name: "Super Admin",
    email: "superadmin@financeos.com",
    mobile: "9876543210",
    city: "",
    state: "",
    role: "Super Admin",
    status: "Active",
    joined: "01 Jul 2026",
    lastLogin: "29 Jul 2026, 09:20 AM",
    permissions: {},
  },
  {
    id: 2,
    adminId: "FOS-A-00002",
    name: "Rahul Shah",
    email: "rahul@financeos.com",
    mobile: "9876501234",
    city: "",
    state: "",
    role: "Sub Admin",
    status: "Active",
    joined: "18 Jul 2026",
    lastLogin: "28 Jul 2026, 06:42 PM",
    permissions: {},
  },
  {
    id: 3,
    adminId: "FOS-A-00003",
    name: "Priya Patel",
    email: "priya@financeos.com",
    mobile: "9825012345",
    city: "",
    state: "",
    role: "Sub Admin",
    status: "Inactive",
    joined: "22 Jul 2026",
    lastLogin: "25 Jul 2026, 11:16 AM",
    permissions: {},
  },
];


// ============================================================
// GET ALL ADMINISTRATORS
// ============================================================

export function getAdministrators() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(defaultAdministrators)
      );

      return defaultAdministrators;
    }

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      throw new Error("Invalid administrator data");
    }

    return parsed;
  } catch (error) {
    console.error("Administrator storage error:", error);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(defaultAdministrators)
    );

    return defaultAdministrators;
  }
}


// ============================================================
// SAVE ALL ADMINISTRATORS
// ============================================================

export function saveAdministrators(admins) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(admins)
  );
}


// ============================================================
// GENERATE INTERNAL NUMERIC ID
// ============================================================

export function generateInternalAdminId(admins) {
  if (!admins.length) {
    return 1;
  }

  return (
    Math.max(
      ...admins.map((admin) =>
        Number(admin.id) || 0
      )
    ) + 1
  );
}


// ============================================================
// GENERATE FINANCEOS ADMIN ID
//
// FOS-A-00001
// FOS-A-00002
// FOS-A-00003
//
// Deleted IDs are not reused while the stored sequence exists.
// Backend/database will own this later.
// ============================================================

export function generateFinanceAdminId(admins) {
  const numbers = admins
    .map((admin) => {
      const match = String(admin.adminId || "").match(
        /^FOS-A-(\d+)$/
      );

      return match ? Number(match[1]) : 0;
    })
    .filter((number) => number > 0);

  const next =
    numbers.length > 0
      ? Math.max(...numbers) + 1
      : 1;

  return `FOS-A-${String(next).padStart(5, "0")}`;
}


// ============================================================
// DATE
// ============================================================

export function currentJoinedDate() {
  return new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}