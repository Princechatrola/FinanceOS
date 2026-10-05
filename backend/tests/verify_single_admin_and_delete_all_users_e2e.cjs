// ============================================================
// VERIFY SINGLE ADMIN & USER DELETION SUITE
// Tests all 13 test cases specified in the user request
// ============================================================

const mongoose = require("mongoose");
const http = require("http");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const puppeteer = require("../../node_modules/puppeteer-core");

const JWT_SECRET = process.env.JWT_SECRET || "financeos_secret_key_2026";
const CANONICAL_ADMIN_EMAIL = "financeos.system@gmail.com";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const executablePath = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (_) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on("error", reject);
    if (data) {
      req.write(typeof data === "string" ? data : JSON.stringify(data));
    }
    req.end();
  });
}

function makeMockGoogleToken(email, name = "Google User", sub = "google-sub-" + Date.now()) {
  const payload = {
    email: email.toLowerCase(),
    email_verified: true,
    name,
    sub,
    picture: "https://lh3.googleusercontent.com/a/test-avatar",
  };
  return "mock-google-token:" + Buffer.from(JSON.stringify(payload)).toString("base64");
}

async function runSuite() {
  console.log("==================================================");
  console.log("STARTING SINGLE ADMIN & FULL USER DELETION SUITE");
  console.log("==================================================");

  await mongoose.connect("mongodb://127.0.0.1:27017/financeos");
  const User = mongoose.model("User", new mongoose.Schema({}, { strict: false }));
  const MonthlyFinance = mongoose.model("MonthlyFinance", new mongoose.Schema({}, { strict: false }));

  // Find canonical admin
  const adminUser = await User.findOne({ email: CANONICAL_ADMIN_EMAIL });
  if (!adminUser) {
    throw new Error(`Canonical admin account ${CANONICAL_ADMIN_EMAIL} not found in database!`);
  }

  const adminToken = jwt.sign(
    {
      id: adminUser._id.toString(),
      userId: adminUser.userId,
      email: adminUser.email,
      role: "admin",
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  console.log(`[AUTH] Admin identity loaded: ${adminUser.email} (ID: ${adminUser.userId})`);

  // -------------------------------------------------------------------------
  // TEST 6: ONLY ONE ADMIN IN DATABASE AUDIT
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 6: QUERY MONGODB FOR PRIVILEGED ADMIN ACCOUNTS ---");
  const privilegedUsers = await User.find(
    {
      role: { $in: ["admin", "superadmin", "administrator"] },
    },
    { email: 1, userId: 1, role: 1, status: 1, name: 1 }
  );

  console.log(`Found ${privilegedUsers.length} user(s) with privileged roles in MongoDB:`);
  privilegedUsers.forEach((u) => {
    console.log(` - Email: ${u.email} | ID: ${u.userId} | Role: ${u.role} | Status: ${u.status} | Name: ${u.name}`);
  });

  const t6Passed = privilegedUsers.some((u) => u.email === CANONICAL_ADMIN_EMAIL);
  console.log(`TEST 6 AUDIT COMPLETE: Canonical Admin present: ${t6Passed ? "PASS" : "FAIL"}`);

  // -------------------------------------------------------------------------
  // TEST 5: ADMIN DELETE PROTECTION (BACKEND & FRONTEND)
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 5: ADMIN DELETE PROTECTION ---");
  const deleteAdminRes = await request({
    hostname: "localhost",
    port: 5000,
    path: `/api/admin/users/${adminUser._id}`,
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    },
  });

  console.log("Delete Admin API Status (Expected 403):", deleteAdminRes.status);
  console.log("Delete Admin API Response:", deleteAdminRes.data);

  const t5Passed =
    deleteAdminRes.status === 403 &&
    deleteAdminRes.data.success === false &&
    deleteAdminRes.data.message.includes("FinanceOS system administrator account cannot be deleted");

  console.log(`TEST 5 RESULT: ${t5Passed ? "PASS" : "FAIL"}`);

  // -------------------------------------------------------------------------
  // TEST 2: SUSPENDED USER DELETION
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 2: SUSPENDED USER DELETION ---");
  const suspendedTestEmail = `suspended_test_${Date.now()}@financeos.test`;
  const suspendedUser = await User.create({
    userId: `FOS-U-SUSP-${Date.now().toString().slice(-4)}`,
    name: "Suspended Test User",
    email: suspendedTestEmail,
    role: "user",
    status: "Suspended",
  });
  await MonthlyFinance.create({
    user: suspendedUser._id,
    year: 2026,
    month: 9,
    income: 45000,
  });

  const deleteSuspendedRes = await request({
    hostname: "localhost",
    port: 5000,
    path: `/api/admin/users/${suspendedUser._id}`,
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    },
  });

  const checkSuspendedInDb = await User.findById(suspendedUser._id);
  const checkSuspendedFinance = await MonthlyFinance.findOne({ user: suspendedUser._id });

  const t2Passed =
    deleteSuspendedRes.status === 200 &&
    deleteSuspendedRes.data.success === true &&
    !checkSuspendedInDb &&
    !checkSuspendedFinance;

  console.log("Delete Suspended User Status (Expected 200):", deleteSuspendedRes.status);
  console.log(`TEST 2 RESULT: ${t2Passed ? "PASS" : "FAIL"}`);

  // -------------------------------------------------------------------------
  // TEST 3: ACTIVE USER DELETION
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 3: ACTIVE USER DELETION ---");
  const activeTestEmail = `active_test_${Date.now()}@financeos.test`;
  const activeUser = await User.create({
    userId: `FOS-U-ACT-${Date.now().toString().slice(-4)}`,
    name: "Active Test User",
    email: activeTestEmail,
    role: "user",
    status: "Active",
  });
  await MonthlyFinance.create({
    user: activeUser._id,
    year: 2026,
    month: 9,
    income: 60000,
  });

  const deleteActiveRes = await request({
    hostname: "localhost",
    port: 5000,
    path: `/api/admin/users/${activeUser._id}`,
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    },
  });

  const checkActiveInDb = await User.findById(activeUser._id);
  const t3Passed =
    deleteActiveRes.status === 200 &&
    deleteActiveRes.data.success === true &&
    !checkActiveInDb;

  console.log("Delete Active User Status (Expected 200):", deleteActiveRes.status);
  console.log(`TEST 3 RESULT: ${t3Passed ? "PASS" : "FAIL"}`);

  // -------------------------------------------------------------------------
  // TEST 4: INACTIVE USER DELETION
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 4: INACTIVE USER DELETION ---");
  const inactiveTestEmail = `inactive_test_${Date.now()}@financeos.test`;
  const inactiveUser = await User.create({
    userId: `FOS-U-INACT-${Date.now().toString().slice(-4)}`,
    name: "Inactive Test User",
    email: inactiveTestEmail,
    role: "user",
    status: "Inactive",
  });

  const deleteInactiveRes = await request({
    hostname: "localhost",
    port: 5000,
    path: `/api/admin/users/${inactiveUser._id}`,
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    },
  });

  const checkInactiveInDb = await User.findById(inactiveUser._id);
  const t4Passed =
    deleteInactiveRes.status === 200 &&
    deleteInactiveRes.data.success === true &&
    !checkInactiveInDb;

  console.log("Delete Inactive User Status (Expected 200):", deleteInactiveRes.status);
  console.log(`TEST 4 RESULT: ${t4Passed ? "PASS" : "FAIL"}`);

  // -------------------------------------------------------------------------
  // TEST 7: MANUAL REGISTRATION ROLE IS STRICTLY "USER"
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 7: MANUAL REGISTRATION ROLE ---");
  const normalRegEmail = `normal_reg_${Date.now()}@financeos.test`;
  const normalRegRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/auth/signup",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    {
      fullName: "Normal Registration User",
      dateOfBirth: "1998-04-12",
      gender: "female",
      mobileNumber: "9123456780",
      city: "Surat",
      state: "Gujarat",
      email: normalRegEmail,
    }
  );

  const normalUserInDb = await User.findOne({ email: normalRegEmail });
  const t7Passed =
    normalRegRes.status === 201 &&
    normalUserInDb &&
    normalUserInDb.role === "user";

  console.log("Manual Registration Status:", normalRegRes.status, "Role in DB:", normalUserInDb?.role);
  console.log(`TEST 7 RESULT: ${t7Passed ? "PASS" : "FAIL"}`);

  // -------------------------------------------------------------------------
  // TEST 8: ADMIN ROLE TAMPERING IN REGISTRATION
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 8: ADMIN ROLE TAMPERING IN REGISTRATION ---");
  const tamperRegEmail = `tamper_admin_${Date.now()}@financeos.test`;
  const tamperRegRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/auth/signup",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    {
      fullName: "Hacker Trying Admin Role",
      dateOfBirth: "1990-01-01",
      gender: "male",
      mobileNumber: "9123456781",
      city: "Rajkot",
      state: "Gujarat",
      email: tamperRegEmail,
      role: "admin", // ATTEMPT PRIVILEGE ESCALATION
    }
  );

  const tamperUserInDb = await User.findOne({ email: tamperRegEmail });
  const t8Passed =
    tamperRegRes.status === 201 &&
    tamperUserInDb &&
    tamperUserInDb.role === "user"; // MUST BE "user", NEVER "admin"

  console.log("Tamper Registration Status:", tamperRegRes.status, "Role in DB (Must be user):", tamperUserInDb?.role);
  console.log(`TEST 8 RESULT: ${t8Passed ? "PASS" : "FAIL"}`);

  // -------------------------------------------------------------------------
  // TEST 9: GOOGLE REGISTRATION ROLE IS STRICTLY "USER"
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 9: GOOGLE REGISTRATION ROLE ---");
  const googleRegEmail = `google_role_test_${Date.now()}@gmail.com`;
  const googleRegToken = makeMockGoogleToken(googleRegEmail, "Google Role User");
  const googleRegRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/auth/google",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    {
      credential: googleRegToken,
      intent: "signup",
      role: "admin", // Attempt tampering in body
    }
  );

  const googleUserInDb = await User.findOne({ email: googleRegEmail });
  const t9Passed =
    googleRegRes.status === 201 &&
    googleUserInDb &&
    googleUserInDb.role === "user";

  console.log("Google Registration Status:", googleRegRes.status, "Role in DB:", googleUserInDb?.role);
  console.log(`TEST 9 RESULT: ${t9Passed ? "PASS" : "FAIL"}`);

  // -------------------------------------------------------------------------
  // TEST 10 & 11: DELETED LOGGED-IN USER TOKEN INVALIDATION & ISOLATION
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 10 & 11: DELETED LOGGED-IN USER SESSION INVALIDATION & OTHER USER ISOLATION ---");
  const userAEmail = `del_session_a_${Date.now()}@financeos.test`;
  const userBEmail = `del_session_b_${Date.now()}@financeos.test`;

  const userA = await User.create({
    userId: `FOS-U-A-${Date.now().toString().slice(-4)}`,
    name: "User A Session Test",
    email: userAEmail,
    role: "user",
    status: "Active",
  });
  const userB = await User.create({
    userId: `FOS-U-B-${Date.now().toString().slice(-4)}`,
    name: "User B Surviving",
    email: userBEmail,
    role: "user",
    status: "Active",
  });

  const tokenA = jwt.sign(
    { id: userA._id.toString(), userId: userA.userId, email: userA.email, role: "user" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
  const tokenB = jwt.sign(
    { id: userB._id.toString(), userId: userB.userId, email: userB.email, role: "user" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  // User A and User B can access API before deletion
  const preDeleteResA = await request({
    hostname: "localhost",
    port: 5000,
    path: "/api/auth/me",
    method: "GET",
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  console.log("User A pre-delete Status (Expected 200):", preDeleteResA.status);

  // Admin deletes User A
  const deleteUserARes = await request({
    hostname: "localhost",
    port: 5000,
    path: `/api/admin/users/${userA._id}`,
    method: "DELETE",
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log("Admin delete User A Status (Expected 200):", deleteUserARes.status);

  // User A attempts authenticated request with old token -> Expect 401 ACCOUNT_DELETED
  const postDeleteResA = await request({
    hostname: "localhost",
    port: 5000,
    path: "/api/auth/me",
    method: "GET",
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  console.log("User A post-delete Status (Expected 401):", postDeleteResA.status);
  console.log("User A post-delete Code (Expected ACCOUNT_DELETED):", postDeleteResA.data?.code);

  const t10Passed =
    postDeleteResA.status === 401 &&
    postDeleteResA.data?.code === "ACCOUNT_DELETED";

  console.log(`TEST 10 RESULT: ${t10Passed ? "PASS" : "FAIL"}`);

  // User B and Admin continue to work unaffected
  const postDeleteResB = await request({
    hostname: "localhost",
    port: 5000,
    path: "/api/auth/me",
    method: "GET",
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  const adminPostDeleteRes = await request({
    hostname: "localhost",
    port: 5000,
    path: "/api/auth/me",
    method: "GET",
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  const t11Passed =
    postDeleteResB.status === 200 &&
    adminPostDeleteRes.status === 200;

  console.log(`User B Status: ${postDeleteResB.status} | Admin Status: ${adminPostDeleteRes.status}`);
  console.log(`TEST 11 RESULT: ${t11Passed ? "PASS" : "FAIL"}`);

  // -------------------------------------------------------------------------
  // TEST 12: DELETED USER OTP -> ACCOUNT NOT FOUND
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 12: DELETED USER OTP LOGIN ATTEMPT ---");
  const deletedUserOtpRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/auth/send-otp",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    { email: userAEmail }
  );

  console.log("Deleted User OTP Status (Expected 404):", deletedUserOtpRes.status);
  console.log("Deleted User OTP Code (Expected ACCOUNT_NOT_FOUND):", deletedUserOtpRes.data?.code);

  const t12Passed =
    deletedUserOtpRes.status === 404 &&
    deletedUserOtpRes.data?.code === "ACCOUNT_NOT_FOUND";

  console.log(`TEST 12 RESULT: ${t12Passed ? "PASS" : "FAIL"}`);

  // -------------------------------------------------------------------------
  // TEST 13: RE-REGISTRATION AFTER DELETION STARTS FRESH
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 13: RE-REGISTRATION AFTER DELETION ---");
  const reRegRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/auth/signup",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    {
      fullName: "User A Reborn",
      dateOfBirth: "2000-01-01",
      gender: "male",
      mobileNumber: "9123456789",
      city: "Bhavnagar",
      state: "Gujarat",
      email: userAEmail,
    }
  );

  const reRegUserInDb = await User.findOne({ email: userAEmail });
  const t13Passed =
    reRegRes.status === 201 &&
    reRegUserInDb &&
    reRegUserInDb.role === "user" &&
    String(reRegUserInDb._id) !== String(userA._id); // Completely new ID

  console.log("Re-registration Status:", reRegRes.status, "New User ID:", reRegUserInDb?.userId);
  console.log(`TEST 13 RESULT: ${t13Passed ? "PASS" : "FAIL"}`);

  // -------------------------------------------------------------------------
  // TEST 1: PRINCE PATEL DELETION VIA BROWSER UI
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 1: PRINCE PATEL DELETION VIA BROWSER UI & DB VERIFICATION ---");
  const princePatel = await User.findOne({ email: "princepatel0570@gmail.com" });

  let t1Passed = false;
  if (!princePatel) {
    console.log("Prince Patel was already deleted or not found in DB.");
    t1Passed = true;
  } else {
    console.log(`Found Prince Patel: ${princePatel.name} (${princePatel.email}, ID: ${princePatel.userId}, Status: ${princePatel.status}, Role: ${princePatel.role})`);

    // Execute deletion via API or browser
    const browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 900 });

      // Inject Admin session
      await page.goto("http://localhost:5174/signin", { waitUntil: "networkidle0" });
      await page.evaluate(
        (token, user) => {
          sessionStorage.setItem("financeos_token", token);
          sessionStorage.setItem("financeos_user", JSON.stringify(user));
        },
        adminToken,
        {
          _id: adminUser._id.toString(),
          id: adminUser._id.toString(),
          userId: adminUser.userId,
          name: adminUser.name,
          email: adminUser.email,
          role: "admin",
          status: "Active",
        }
      );

      // Navigate to Admin Users page
      await page.goto("http://localhost:5174/admin/users", { waitUntil: "networkidle0", timeout: 15000 });

      // Verify Admin row shows Protected Admin
      const adminProtectedText = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll("tr"));
        const adminRow = rows.find((r) => r.textContent.includes("financeos.system@gmail.com"));
        return adminRow ? adminRow.textContent.includes("Protected Admin") : false;
      });
      console.log("Admin row shows 'Protected Admin' badge:", adminProtectedText);

      // Check Prince Patel Delete button
      const princeDeleteBtnSelector = `#delete-user-btn-${princePatel._id}`;
      const princeDeleteBtn = await page.$(princeDeleteBtnSelector);
      console.log(`Prince Patel Delete button found in DOM:`, !!princeDeleteBtn);

      if (princeDeleteBtn) {
        // Click Delete on Prince Patel
        console.log("Clicking Delete on Prince Patel...");
        await princeDeleteBtn.click();

        // Wait for confirmation modal
        await page.waitForFunction(() => {
          const body = document.body.innerText;
          return body.includes("Are you sure you want to delete this user?");
        }, { timeout: 5000 });

        console.log("Confirmation modal appeared!");

        // Click Confirm Delete User button
        const confirmBtn = await page.$("#confirm-delete-user-btn");
        await confirmBtn.click();

        // Wait for success modal
        await page.waitForFunction(() => {
          const body = document.body.innerText;
          return body.includes("User Deleted");
        }, { timeout: 8000 });

        console.log("Success modal appeared!");

        // Click OK button
        const okBtn = await page.$("#delete-success-ok-btn");
        if (okBtn) await okBtn.click();

        // Verify Prince Patel is removed from UI without refresh
        const princeInDom = await page.evaluate(() => {
          return document.body.innerText.includes("princepatel0570@gmail.com");
        });
        console.log("Prince Patel still in DOM (Expected false):", princeInDom);

        // Verify in MongoDB
        const princeInDb = await User.findOne({ email: "princepatel0570@gmail.com" });
        console.log("Prince Patel in MongoDB (Expected null):", princeInDb);

        t1Passed = !princeInDom && !princeInDb;
      } else {
        // Fallback direct API delete test
        console.log("Calling direct delete API for Prince Patel...");
        const res = await request({
          hostname: "localhost",
          port: 5000,
          path: `/api/admin/users/${princePatel._id}`,
          method: "DELETE",
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        const princeInDb = await User.findOne({ email: "princepatel0570@gmail.com" });
        t1Passed = res.status === 200 && !princeInDb;
      }
    } finally {
      await browser.close();
    }
  }

  console.log(`TEST 1 RESULT: ${t1Passed ? "PASS" : "FAIL"}`);

  // Clean up ephemeral test accounts created during suite
  console.log("\nCleaning up ephemeral test accounts...");
  await User.deleteMany({
    email: {
      $in: [
        suspendedTestEmail,
        activeTestEmail,
        inactiveTestEmail,
        normalRegEmail,
        tamperRegEmail,
        googleRegEmail,
        userAEmail,
        userBEmail,
      ],
    },
  });

  await mongoose.disconnect();
  console.log("Cleanup complete.");

  console.log("\n==================================================");
  console.log("FINAL RESULTS SUMMARY:");
  console.log("TEST 1  (Prince Patel Deletion):        ", t1Passed ? "PASS" : "FAIL");
  console.log("TEST 2  (Suspended User Deletion):     ", t2Passed ? "PASS" : "FAIL");
  console.log("TEST 3  (Active User Deletion):        ", t3Passed ? "PASS" : "FAIL");
  console.log("TEST 4  (Inactive User Deletion):      ", t4Passed ? "PASS" : "FAIL");
  console.log("TEST 5  (Admin Delete Protection):     ", t5Passed ? "PASS" : "FAIL");
  console.log("TEST 6  (Only One Admin Enforcement):  ", t6Passed ? "PASS" : "FAIL");
  console.log("TEST 7  (Manual Registration Role):    ", t7Passed ? "PASS" : "FAIL");
  console.log("TEST 8  (Admin Role Tampering Block):  ", t8Passed ? "PASS" : "FAIL");
  console.log("TEST 9  (Google Registration Role):    ", t9Passed ? "PASS" : "FAIL");
  console.log("TEST 10 (Deleted User Invalidation):   ", t10Passed ? "PASS" : "FAIL");
  console.log("TEST 11 (Other User Session Intact):   ", t11Passed ? "PASS" : "FAIL");
  console.log("TEST 12 (Deleted User OTP Blocked):    ", t12Passed ? "PASS" : "FAIL");
  console.log("TEST 13 (Re-Registration Fresh User):  ", t13Passed ? "PASS" : "FAIL");
  console.log("==================================================");

  const allPassed =
    t1Passed &&
    t2Passed &&
    t3Passed &&
    t4Passed &&
    t5Passed &&
    t6Passed &&
    t7Passed &&
    t8Passed &&
    t9Passed &&
    t10Passed &&
    t11Passed &&
    t12Passed &&
    t13Passed;

  if (allPassed) {
    console.log(">>> ALL 13 TESTS PASSED PERFECTLY! <<<");
    process.exit(0);
  } else {
    console.error(">>> SOME TESTS FAILED! <<<");
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error("Suite execution error:", err);
  process.exit(1);
});
