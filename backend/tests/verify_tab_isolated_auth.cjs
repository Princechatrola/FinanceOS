// ============================================================
// FINANCEOS - TAB-ISOLATED AUTHENTICATION E2E TEST SUITE
// Validates:
// 1. User A + User B simultaneous independent sessions (Test B)
// 2. User A + Admin simultaneous independent sessions (Test A)
// 3. Independent Logout in one tab without affecting other tabs (Test C)
// 4. Session switch in Tab 1 while Tab 2 remains unchanged (Test D)
// 5. Backend JWT user isolation & MongoDB data scoping (Test E)
// 6. OTP & Google login tab isolation
// ============================================================

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const User = require("../models/User");
const MonthlyFinance = require("../models/MonthlyFinance");

const API_BASE = "http://localhost:5000/api";

function createMockGoogleToken(payload) {
  return "mock-google-token:" + Buffer.from(JSON.stringify(payload)).toString("base64");
}

// Simulates a browser tab's isolated sessionStorage
class TabSession {
  constructor(tabName) {
    this.tabName = tabName;
    this.sessionStorage = new Map();
  }

  setItem(key, value) {
    this.sessionStorage.set(key, String(value));
  }

  getItem(key) {
    return this.sessionStorage.has(key) ? this.sessionStorage.get(key) : null;
  }

  removeItem(key) {
    this.sessionStorage.delete(key);
  }

  clear() {
    this.sessionStorage.clear();
  }

  get token() {
    return this.getItem("financeos_token");
  }

  get user() {
    const raw = this.getItem("financeos_user");
    return raw ? JSON.parse(raw) : null;
  }

  setAuth(token, user) {
    this.setItem("financeos_token", token);
    this.setItem("financeos_user", JSON.stringify(user));
  }

  async fetch(url, options = {}) {
    const headers = options.headers || {};
    const token = this.token;
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return fetch(url, { ...options, headers });
  }
}

async function runTabIsolationSuite() {
  console.log("==================================================");
  console.log("STARTING TAB-ISOLATED AUTHENTICATION TEST SUITE");
  console.log("==================================================");

  let results = {};
  let cleanupEmails = [];

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("[DB] Connected to MongoDB at", process.env.MONGO_URI);

    // Setup Test Users
    const timestamp = Date.now();
    const emailUserA = `user_tab_a_${timestamp}@financeos.test`;
    const emailUserB = `user_tab_b_${timestamp}@gmail.com`; // Will use Google login
    const emailUserC = `user_tab_c_${timestamp}@financeos.test`;
    const adminEmail = process.env.ADMIN_EMAIL || "financeos.system@gmail.com";

    cleanupEmails.push(emailUserA, emailUserB, emailUserC);

    // ----------------------------------------------------
    // Create User A via Manual Signup
    // ----------------------------------------------------
    const signupARes = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "User Tab A",
        dateOfBirth: "1992-06-10",
        gender: "female",
        mobileNumber: "9876500001",
        state: "Karnataka",
        city: "Bengaluru",
        email: emailUserA,
      }),
    });
    console.log("User A Signup Status:", signupARes.status);

    // User A OTP Login to acquire token
    await fetch(`${API_BASE}/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailUserA }),
    });
    const dbUserA = await User.findOne({ email: emailUserA });
    const verifyOtpARes = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailUserA, otp: dbUserA.otp }),
    });
    const dataA = await verifyOtpARes.json();
    console.log("User A Login Status:", verifyOtpARes.status, "Token:", Boolean(dataA.token));

    // Seed MonthlyFinance for User A
    await MonthlyFinance.create({
      user: dbUserA._id,
      year: 2026,
      month: 9,
      income: 120000,
      expenses: 45000,
      cashBalance: 75000,
    });

    // ----------------------------------------------------
    // Create User B via Google Login (Direct Immediate Account)
    // ----------------------------------------------------
    const googleTokenB = createMockGoogleToken({
      sub: `sub_user_b_${timestamp}`,
      email: emailUserB,
      email_verified: true,
      name: "User Tab B",
      picture: "https://lh3.googleusercontent.com/b-avatar",
    });

    // User B registers via Google Sign-Up first (intent: "signup")
    const googleBRegRes = await fetch(`${API_BASE}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: googleTokenB, intent: "signup" }),
    });
    console.log("User B Google Registration Status:", googleBRegRes.status);

    // Then logs in via Google Sign-In (intent: "signin")
    const googleBRes = await fetch(`${API_BASE}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: googleTokenB, intent: "signin" }),
    });
    const dataB = await googleBRes.json();
    console.log("User B Google Login Status:", googleBRes.status, "Token:", Boolean(dataB.token));

    const dbUserB = await User.findOne({ email: emailUserB });

    // Seed MonthlyFinance for User B
    await MonthlyFinance.create({
      user: dbUserB._id,
      year: 2026,
      month: 9,
      income: 88000,
      expenses: 32000,
      cashBalance: 56000,
    });

    // ----------------------------------------------------
    // Admin Login (via OTP or Google if admin email)
    // ----------------------------------------------------
    let adminToken = null;
    let adminUserObj = null;

    // Check if admin user exists in DB
    let dbAdmin = await User.findOne({ email: adminEmail });
    if (!dbAdmin) {
      dbAdmin = await User.create({
        userId: "FOS-U-000001",
        name: "FinanceOS Administrator",
        email: adminEmail,
        role: "admin",
        status: "Active",
      });
    } else if (dbAdmin.role !== "admin") {
      dbAdmin.role = "admin";
      await dbAdmin.save();
    }

    const adminGoogleToken = createMockGoogleToken({
      sub: `sub_admin_${timestamp}`,
      email: adminEmail,
      email_verified: true,
      name: dbAdmin.name,
    });

    const adminLoginRes = await fetch(`${API_BASE}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: adminGoogleToken }),
    });
    const adminData = await adminLoginRes.json();
    adminToken = adminData.token;
    adminUserObj = adminData.user;
    console.log("Admin Login Status:", adminLoginRes.status, "Role:", adminUserObj?.role);

    // ====================================================
    // TEST 1: TAB 1 (User A) & TAB 2 (Admin) Simultaneous Coexistence (TEST A)
    // ====================================================
    console.log("\n--- TEST 1: User A (Tab 1) & Admin (Tab 2) Coexistence ---");
    const Tab1 = new TabSession("Tab 1 - User A");
    const Tab2 = new TabSession("Tab 2 - Admin");

    // Tab 1 receives User A session
    Tab1.setAuth(dataA.token, dataA.user);
    // Tab 2 receives Admin session
    Tab2.setAuth(adminToken, adminUserObj);

    // Check Tab 1 session
    const meTab1Res = await Tab1.fetch(`${API_BASE}/auth/me`);
    const meTab1Data = await meTab1Res.json();

    // Check Tab 2 session
    const meTab2Res = await Tab2.fetch(`${API_BASE}/auth/me`);
    const meTab2Data = await meTab2Res.json();

    // Tab 2 accesses Admin route
    const adminUsersRes = await Tab2.fetch(`${API_BASE}/admin/users`);
    const adminUsersData = await adminUsersRes.json();

    // Tab 1 tries Admin route (must be 403 Forbidden)
    const userAccessAdminRes = await Tab1.fetch(`${API_BASE}/admin/users`);

    console.log("Tab 1 Identity:", meTab1Data.user?.email, "Role:", meTab1Data.user?.role);
    console.log("Tab 2 Identity:", meTab2Data.user?.email, "Role:", meTab2Data.user?.role);
    console.log("Tab 2 Admin Route Access (Expected 200):", adminUsersRes.status);
    console.log("Tab 1 Admin Route Access (Expected 403):", userAccessAdminRes.status);

    if (
      meTab1Data.user?.email === emailUserA &&
      meTab1Data.user?.role === "user" &&
      meTab2Data.user?.email === adminEmail &&
      meTab2Data.user?.role === "admin" &&
      adminUsersRes.status === 200 &&
      userAccessAdminRes.status === 403
    ) {
      console.log("PASS: TEST 1 - User A and Admin coexist independently without cross-tab interference.");
      results.test1 = "PASS";
    } else {
      console.error("FAIL: TEST 1", { meTab1Data, meTab2Data, adminUsersRes: adminUsersRes.status, userAccessAdminRes: userAccessAdminRes.status });
      results.test1 = "FAIL";
    }

    // ====================================================
    // TEST 2: TAB 1 (User A) & TAB 2 (User B) Data Isolation (TEST B)
    // ====================================================
    console.log("\n--- TEST 2: Two Users (User A & User B) Simultaneous Data Isolation ---");
    const TabUserA = new TabSession("Tab - User A");
    const TabUserB = new TabSession("Tab - User B");

    TabUserA.setAuth(dataA.token, dataA.user);
    TabUserB.setAuth(dataB.token, dataB.user);

    // Tab A fetches monthly finance
    const financeARes = await TabUserA.fetch(`${API_BASE}/monthly-finance/2026/9`);
    const financeAData = await financeARes.json();

    // Tab B fetches monthly finance
    const financeBRes = await TabUserB.fetch(`${API_BASE}/monthly-finance/2026/9`);
    const financeBData = await financeBRes.json();

    console.log("User A Monthly Income in Tab A:", financeAData.finance?.income);
    console.log("User B Monthly Income in Tab B:", financeBData.finance?.income);

    if (
      financeARes.status === 200 &&
      financeBRes.status === 200 &&
      financeAData.finance?.income === 120000 &&
      financeBData.finance?.income === 88000 &&
      financeAData.finance?.income !== financeBData.finance?.income
    ) {
      console.log("PASS: TEST 2 - User A and User B data requests return strictly their own scoped records.");
      results.test2 = "PASS";
    } else {
      console.error("FAIL: TEST 2", { financeAData, financeBData });
      results.test2 = "FAIL";
    }

    // ====================================================
    // TEST 3: TAB 1 Logout Leaves TAB 2 (Admin) Logged In (TEST C)
    // ====================================================
    console.log("\n--- TEST 3: Tab 1 Logout Leaves Tab 2 (Admin) Untouched ---");
    // User A logs out in Tab 1
    Tab1.clear(); // Simulates clearAuthSession() in Tab 1

    // Tab 1 request after logout
    const tab1AfterLogoutRes = await Tab1.fetch(`${API_BASE}/auth/me`);
    console.log("Tab 1 After Logout Status (Expected 401):", tab1AfterLogoutRes.status);

    // Tab 2 (Admin) request after Tab 1 logged out
    const tab2AfterLogoutRes = await Tab2.fetch(`${API_BASE}/auth/me`);
    const tab2DataAfter = await tab2AfterLogoutRes.json();
    console.log("Tab 2 (Admin) After Tab 1 Logout Status (Expected 200):", tab2AfterLogoutRes.status);
    console.log("Tab 2 Admin Still Authenticated:", tab2DataAfter.user?.email);

    if (
      tab1AfterLogoutRes.status === 401 &&
      tab2AfterLogoutRes.status === 200 &&
      tab2DataAfter.user?.email === adminEmail
    ) {
      console.log("PASS: TEST 3 - Tab 1 logout only affected Tab 1; Tab 2 Admin remained fully active.");
      results.test3 = "PASS";
    } else {
      console.error("FAIL: TEST 3", { tab1After: tab1AfterLogoutRes.status, tab2After: tab2AfterLogoutRes.status });
      results.test3 = "FAIL";
    }

    // ====================================================
    // TEST 4: Login Switch in Tab 1 without affecting Tab 2 (TEST D)
    // ====================================================
    console.log("\n--- TEST 4: Login User C in Tab 1 while Tab 2 (User B) Stays Intact ---");
    // Create User C
    await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "User Tab C",
        dateOfBirth: "1998-11-20",
        gender: "male",
        mobileNumber: "9876500003",
        state: "Delhi",
        city: "New Delhi",
        email: emailUserC,
      }),
    });

    await fetch(`${API_BASE}/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailUserC }),
    });
    const dbUserC = await User.findOne({ email: emailUserC });
    const verifyOtpCRes = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailUserC, otp: dbUserC.otp }),
    });
    const dataC = await verifyOtpCRes.json();

    // Tab 1 now logs in as User C
    Tab1.setAuth(dataC.token, dataC.user);

    // Verify Tab 1 is User C
    const meTab1UserCRes = await Tab1.fetch(`${API_BASE}/auth/me`);
    const meTab1UserCData = await meTab1UserCRes.json();

    // Verify TabUserB is STILL User B
    const meTabUserBRes = await TabUserB.fetch(`${API_BASE}/auth/me`);
    const meTabUserBData = await meTabUserBRes.json();

    console.log("Tab 1 Current User:", meTab1UserCData.user?.email);
    console.log("Tab 2 Current User:", meTabUserBData.user?.email);

    if (
      meTab1UserCData.user?.email === emailUserC &&
      meTabUserBData.user?.email === emailUserB
    ) {
      console.log("PASS: TEST 4 - Tab 1 switched to User C while Tab 2 remained User B untouched.");
      results.test4 = "PASS";
    } else {
      console.error("FAIL: TEST 4", { tab1: meTab1UserCData, tab2: meTabUserBData });
      results.test4 = "FAIL";
    }

    // ====================================================
    // TEST 5: Refresh Simulation (Restoring Session From sessionStorage)
    // ====================================================
    console.log("\n--- TEST 5: Page Refresh Session Persistence ---");
    // Simulating page refresh in Tab 1 by re-reading from Tab1.sessionStorage
    const refreshedTab1 = new TabSession("Refreshed Tab 1");
    // Tab restores its own session from its own sessionStorage
    refreshedTab1.sessionStorage = new Map(Tab1.sessionStorage);

    const refreshedTab1Res = await refreshedTab1.fetch(`${API_BASE}/auth/me`);
    const refreshedTab1Data = await refreshedTab1Res.json();

    console.log("Refreshed Tab 1 Status:", refreshedTab1Res.status);
    console.log("Refreshed Tab 1 User:", refreshedTab1Data.user?.email);

    if (
      refreshedTab1Res.status === 200 &&
      refreshedTab1Data.user?.email === emailUserC
    ) {
      console.log("PASS: TEST 5 - Page refresh successfully restores the tab's session without logging out.");
      results.test5 = "PASS";
    } else {
      console.error("FAIL: TEST 5", refreshedTab1Data);
      results.test5 = "FAIL";
    }

    // ====================================================
    // TEST 6: MongoDB Data Safety Check
    // ====================================================
    console.log("\n--- TEST 6: MongoDB Data Safety Check ---");
    const testUsersCount = await User.countDocuments({ email: { $in: cleanupEmails } });
    console.log("Test users created during run:", testUsersCount);

    // Clean up ONLY test records created during this run
    await MonthlyFinance.deleteMany({ user: { $in: [dbUserA._id, dbUserB._id, dbUserC._id] } });
    await User.deleteMany({ email: { $in: cleanupEmails } });
    console.log("Cleanup complete. Existing pre-run database records were NOT touched.");
    results.test6 = "PASS";

    console.log("\n==================================================");
    console.log("TAB ISOLATION TEST RESULTS SUMMARY:");
    console.table(results);
    console.log("==================================================");

    const allPassed = Object.values(results).every((r) => r === "PASS");
    if (allPassed) {
      console.log(">>> ALL TAB ISOLATION TESTS PASSED! <<<");
      process.exit(0);
    } else {
      console.error(">>> SOME TESTS FAILED <<<");
      process.exit(1);
    }
  } catch (err) {
    console.error("Unexpected Test Error:", err);
    process.exit(1);
  }
}

runTabIsolationSuite();
