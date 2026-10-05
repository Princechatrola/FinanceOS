// ============================================================
// PUPPETEER TEST: ADMIN USER PERMANENT DELETE UI FLOW
// ============================================================

const puppeteer = require("puppeteer-core");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");
const MonthlyFinance = require("../models/MonthlyFinance");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/financeos";
const JWT_SECRET = process.env.JWT_SECRET || "financeos_secret_key_2026";
const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function runBrowserTest() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);

  // 1. Ensure Super Admin exists
  let admin = await User.findOne({ email: "admin@financeos.com" });
  if (!admin) {
    admin = await User.create({
      userId: "FOS-U-000099",
      name: "Super Admin",
      email: "admin@financeos.com",
      role: "admin",
      status: "Active",
    });
  }

  const adminToken = jwt.sign(
    { id: admin._id, _id: admin._id, email: admin.email, role: "admin" },
    JWT_SECRET,
    { expiresIn: "2h" }
  );

  // 2. Create a specific test user for the UI test
  const testEmail = `ui_delete_test_${Date.now()}@example.com`;
  const testUser = await User.create({
    userId: `FOS-U-${Math.floor(100000 + Math.random() * 900000)}`,
    name: "Alex Johnson UI Test",
    email: testEmail,
    role: "user",
    status: "Active",
    phone: "9876543299",
    city: "Bengaluru",
    state: "Karnataka",
  });

  await MonthlyFinance.create({
    user: testUser._id,
    month: 9,
    year: 2026,
    income: 80000,
    expenses: 40000,
    cashBalance: 60000,
  });

  console.log(`Created test user: ${testUser.name} (${testUser.email}, ${testUser.userId})`);

  console.log("Launching Edge browser...");
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    // Inject auth credentials into localStorage before page load
    await page.goto("http://localhost:5173", { waitUntil: "domcontentloaded" });
    await page.evaluate(
      ({ token, user }) => {
        localStorage.setItem("financeos_token", token);
        localStorage.setItem("financeos_user", JSON.stringify(user));
      },
      {
        token: adminToken,
        user: {
          _id: admin._id.toString(),
          id: admin._id.toString(),
          email: admin.email,
          name: admin.name,
          role: "admin",
        },
      }
    );

    console.log("Navigating to Admin -> Users...");
    await page.goto("http://localhost:5173/admin/users", { waitUntil: "networkidle0" });

    // Wait for the user directory table to be visible
    await page.waitForSelector("table tbody tr", { timeout: 8000 });
    console.log("[PASS] Admin Users directory loaded.");

    // Screenshot initial Admin Users list
    const screenshotDir = path.join(__dirname, "../../");
    await page.screenshot({ path: path.join(screenshotDir, "admin_users_list.png"), fullPage: false });
    console.log("[SCREENSHOT] Saved admin_users_list.png");

    // Check that Super Admin row does NOT have a Delete button
    const hasAdminDeleteBtn = await page.evaluate((adminId) => {
      return !!document.getElementById(`delete-user-btn-${adminId}`);
    }, admin._id.toString());

    if (!hasAdminDeleteBtn) {
      console.log("[PASS] Super Admin account does not show Delete button in UI.");
    } else {
      throw new Error("FAIL: Super Admin account has Delete button!");
    }

    // Check that Alex Johnson has a Delete button
    const deleteBtnSelector = `#delete-user-btn-${testUser._id}`;
    await page.waitForSelector(deleteBtnSelector, { timeout: 5000 });
    console.log(`[PASS] Found Delete button for test user: ${deleteBtnSelector}`);

    // Click Delete button
    await page.click(deleteBtnSelector);

    // Verify Confirmation Modal appears centered
    await page.waitForSelector("#confirm-delete-user-btn", { timeout: 5000 });
    console.log("[PASS] Centered Confirmation Modal appeared.");

    // Check modal text
    const modalText = await page.evaluate(() => {
      const modal = document.querySelector(".fixed.inset-0");
      return modal ? modal.innerText : "";
    });

    if (
      modalText.includes("Are you sure you want to delete this user?") &&
      modalText.includes("permanently delete") &&
      modalText.includes("Alex Johnson UI Test")
    ) {
      console.log("[PASS] Confirmation Modal contains all required text.");
    } else {
      throw new Error("FAIL: Confirmation Modal missing required text: " + modalText);
    }

    await page.screenshot({ path: path.join(screenshotDir, "admin_delete_confirm_modal.png") });
    console.log("[SCREENSHOT] Saved admin_delete_confirm_modal.png");

    // Test CANCEL button
    console.log("Testing Cancel button...");
    await page.click("#cancel-delete-user-btn");
    await page.waitForFunction(() => !document.getElementById("confirm-delete-user-btn"));
    console.log("[PASS] Modal closed on Cancel.");

    // Verify user is still in the table
    const userStillPresent = await page.evaluate((userId) => {
      return document.body.innerText.includes(userId);
    }, testUser.userId);

    if (userStillPresent) {
      console.log("[PASS] User remains in table after Cancel.");
    } else {
      throw new Error("FAIL: User disappeared after clicking Cancel!");
    }

    // Click Delete again
    await page.click(deleteBtnSelector);
    await page.waitForSelector("#confirm-delete-user-btn", { timeout: 5000 });

    // Confirm Delete
    console.log("Clicking Confirm Delete User...");
    await page.click("#confirm-delete-user-btn");

    // Wait for Success Modal
    await page.waitForSelector("#delete-success-ok-btn", { timeout: 8000 });
    console.log("[PASS] Centered Success Modal appeared.");

    const successModalText = await page.evaluate(() => {
      return document.body.innerText;
    });

    if (
      successModalText.includes("User Deleted Successfully") &&
      successModalText.includes("permanently deleted")
    ) {
      console.log("[PASS] Success modal contains required text.");
    } else {
      throw new Error("FAIL: Success modal missing text: " + successModalText);
    }

    await page.screenshot({ path: path.join(screenshotDir, "admin_delete_success_modal.png") });
    console.log("[SCREENSHOT] Saved admin_delete_success_modal.png");

    // Click OK on Success Modal
    await page.click("#delete-success-ok-btn");
    await page.waitForFunction(() => !document.getElementById("delete-success-ok-btn"));
    console.log("[PASS] Success modal closed.");

    // Verify user disappeared from UI list immediately
    const userInTableAfter = await page.evaluate((userId) => {
      return document.body.innerText.includes(userId);
    }, testUser.userId);

    if (!userInTableAfter) {
      console.log("[PASS] User completely disappeared from Admin Users table without page reload.");
    } else {
      throw new Error("FAIL: User still visible in table after successful deletion!");
    }

    await page.screenshot({ path: path.join(screenshotDir, "admin_users_after_delete.png") });
    console.log("[SCREENSHOT] Saved admin_users_after_delete.png");

    // Verify in MongoDB
    const checkDb = await User.findById(testUser._id);
    if (checkDb === null) {
      console.log("[PASS] Verified in MongoDB: User document is permanently deleted (null).");
    } else {
      throw new Error("FAIL: User document still in MongoDB!");
    }

    const checkDbMf = await MonthlyFinance.countDocuments({ user: testUser._id });
    if (checkDbMf === 0) {
      console.log("[PASS] Verified in MongoDB: Associated financial records permanently deleted.");
    } else {
      throw new Error("FAIL: Financial records still in MongoDB!");
    }

    console.log("\n==================================================");
    console.log("PUPPETEER BROWSER TEST COMPLETED WITH 100% SUCCESS!");
    console.log("==================================================");

  } finally {
    await browser.close();
    await mongoose.disconnect();
  }
}

runBrowserTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("BROWSER TEST FAILED:", err);
    process.exit(1);
  });
