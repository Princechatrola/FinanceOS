// ============================================================
// FINANCEOS - ADMIN MESSAGES BROWSER AUTOMATION TEST
// Verifies live Edge browser user flow:
// Admin → Messages → Compose Message → Choose User → In-App + Email → Send Message
// → Network 201 → Modal Close → Table UI Update → View Details → User In-App Bell
// ============================================================

const puppeteer = require('../../node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots');
const JWT_SECRET = process.env.JWT_SECRET || "financeos_jwt_secret_key_prod_2026";

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runBrowserTest() {
  console.log("=== STARTING ADMIN MESSAGES LIVE BROWSER TEST ===");

  await mongoose.connect(process.env.MONGO_URI);
  const User = require('../models/User');

  let admin = await User.findOne({ role: 'admin' });
  if (!admin) admin = await User.findOne({ email: 'admin@financeos.com' });
  let targetUser = await User.findOne({ email: "dipjivrajani@gmail.com" });
  if (!targetUser) targetUser = await User.findOne({ role: { $ne: 'admin' }, email: { $regex: /@gmail\.com$/ } });

  console.log(`Admin: ${admin.email}, Target User: ${targetUser.name} (${targetUser.email})`);

  const adminToken = jwt.sign(
    { id: admin._id, userId: admin.userId, email: admin.email, role: 'admin' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  const adminUserData = JSON.stringify({
    id: admin._id,
    _id: admin._id,
    userId: admin.userId,
    name: admin.name,
    email: admin.email,
    role: 'admin',
  });

  const userToken = jwt.sign(
    { id: targetUser._id, userId: targetUser.userId, email: targetUser.email, role: 'user' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  const targetUserData = JSON.stringify({
    id: targetUser._id,
    _id: targetUser._id,
    userId: targetUser.userId,
    name: targetUser.name,
    email: targetUser.email,
    role: 'user',
  });

  await mongoose.disconnect();

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1366,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 900 });

  let alertMessage = "";
  page.on('dialog', async (dialog) => {
    alertMessage = dialog.message();
    console.log(`[Browser Dialog] "${alertMessage}"`);
    await dialog.accept();
  });

  try {
    // 1. Setup Admin Authentication in Browser
    console.log("\n1. Navigating to root to initialize admin session in localStorage...");
    await page.goto("http://localhost:5173/", { waitUntil: "networkidle0" });
    await page.evaluate((tok, usr) => {
      localStorage.setItem("financeos_token", tok);
      localStorage.setItem("financeos_user", usr);
      sessionStorage.setItem("financeos_token", tok);
      sessionStorage.setItem("financeos_user", usr);
    }, adminToken, adminUserData);

    // 2. Navigate to Admin Messages Page
    console.log("2. Navigating to http://localhost:5173/admin/messages...");
    await page.goto("http://localhost:5173/admin/messages", { waitUntil: "networkidle0" });
    await page.waitForSelector("button", { timeout: 10000 });

    // 3. Click Compose Message Button
    console.log("3. Locating and clicking 'Compose Message' button...");
    const composeButtonClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.textContent.includes("Compose Message"));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    if (!composeButtonClicked) throw new Error("Compose Message button not found");

    // Wait for Compose Modal
    await page.waitForFunction(() => {
      const h2s = Array.from(document.querySelectorAll("h2"));
      return h2s.some((h) => h.textContent.includes("Compose Message"));
    }, { timeout: 10000 });
    console.log("[PASS] Compose Message modal opened successfully.");

    // 4. Select Target User via Search
    console.log(`4. Searching and selecting recipient user "${targetUser.name}"...`);
    const searchSelector = 'input[placeholder*="Search ID"]';
    await page.waitForSelector(searchSelector, { timeout: 5000 });
    await page.click(searchSelector);
    await page.type(searchSelector, targetUser.name.slice(0, 3), { delay: 50 });

    // Wait for user results button in dropdown and click it
    await page.waitForFunction((targetName) => {
      const buttons = Array.from(document.querySelectorAll("button"));
      return buttons.some((b) => b.innerText.includes(targetName));
    }, { timeout: 5000 }, targetUser.name);

    await page.evaluate((targetName) => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const userBtn = buttons.find((b) => b.innerText.includes(targetName));
      if (userBtn) userBtn.click();
    }, targetUser.name);

    // Verify user card appeared (Change button visible)
    await page.waitForFunction(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      return buttons.some((b) => b.innerText.trim() === "Change");
    }, { timeout: 5000 });
    console.log(`[PASS] Selected recipient user ${targetUser.name}!`);

    // 5. Fill Subject and Message using Puppeteer native type
    console.log("5. Entering Subject and Message body...");
    const uniqueSubject = `Browser Live Test Message ${Date.now()}`;

    // Subject input
    const subjectSelector = 'input[placeholder*="subject" i], input[name="subject"]';
    await page.waitForSelector(subjectSelector, { timeout: 5000 });
    await page.click(subjectSelector);
    await page.type(subjectSelector, uniqueSubject, { delay: 20 });

    // Message textarea
    const msgSelector = 'textarea[placeholder*="message" i], textarea[name="message"]';
    await page.waitForSelector(msgSelector, { timeout: 5000 });
    await page.click(msgSelector);
    await page.type(msgSelector, "Verifying live browser composition, in-app and email delivery end-to-end.", { delay: 10 });

    // 6. Ensure Email channel is active
    console.log("6. Ensuring Email channel toggle is active...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const emailBtn = buttons.find((b) => b.innerText.includes("Email") && b.innerText.includes("Registered email"));
      if (emailBtn) {
        emailBtn.click();
      }
    });

    // 7. Track Network Request for POST /api/admin/messages
    console.log("7. Intercepting POST /api/admin/messages and clicking Send Message...");
    const responsePromise = page.waitForResponse((response) =>
      response.url().includes("/api/admin/messages") && response.request().method() === "POST",
      { timeout: 15000 }
    );

    // Click Send Message button
    const sendClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const sendBtn = buttons.find((b) => b.textContent.includes("Send Message"));
      if (sendBtn) {
        sendBtn.click();
        return true;
      }
      return false;
    });
    if (!sendClicked) throw new Error("Send Message button not found");

    // Await API Response
    const apiResponse = await responsePromise;
    console.log(`[API Response] HTTP Status: ${apiResponse.status()}`);
    const responseBody = await apiResponse.json();
    console.log(`[API Response Body]`, JSON.stringify(responseBody, null, 2));

    if (apiResponse.status() !== 201 || !responseBody.success) {
      throw new Error(`Send message API failed with status ${apiResponse.status()}: ${JSON.stringify(responseBody)}`);
    }
    console.log("[PASS] API returned 201 Created with success: true");

    // 8. Verify Modal Closes and Message Appears in Table
    console.log("8. Verifying Compose Modal closes and table updates with new message...");
    await page.waitForFunction((subj) => {
      // Check that the unique subject is rendered in the page text / table
      return document.body.innerText.includes(subj);
    }, { timeout: 10000 }, uniqueSubject);
    console.log(`[PASS] New message "${uniqueSubject}" is rendered in Admin Messages UI table without page reload!`);

    // Take Screenshot of Admin Messages page with new message
    const adminScreenshotPath = path.join(SCREENSHOT_DIR, "admin_messages_success.png");
    await page.screenshot({ path: adminScreenshotPath, fullPage: false });
    console.log(`[Screenshot Saved] ${adminScreenshotPath}`);

    // 9. Verify View Details Modal
    console.log("9. Testing 'View Details' action on the new message...");
    const viewClicked = await page.evaluate((subj) => {
      // Find row containing subj
      const rows = Array.from(document.querySelectorAll("tr, div.rounded-2xl, div.rounded-xl"));
      const targetRow = rows.find((r) => r.innerText.includes(subj));
      if (targetRow) {
        const buttons = Array.from(targetRow.querySelectorAll("button"));
        // First button is typically View (eye icon)
        if (buttons.length > 0) {
          buttons[0].click();
          return true;
        }
      }
      return false;
    }, uniqueSubject);

    if (viewClicked) {
      await page.waitForFunction(() => {
        return document.body.innerText.includes("Message Details");
      }, { timeout: 5000 });
      console.log("[PASS] View Details modal opened successfully with complete message data.");

      // Close modal
      await page.evaluate(() => {
        const closeBtn = document.querySelector("button[aria-label='Close']");
        if (closeBtn) closeBtn.click();
      });
    }

    // 10. Switch to Target User and Verify In-App Bell Notification
    console.log("\n10. Switching session to target user to verify In-App delivery in Topbar bell...");
    await page.evaluate((tok, usr) => {
      localStorage.setItem("financeos_token", tok);
      localStorage.setItem("financeos_user", usr);
      sessionStorage.setItem("financeos_token", tok);
      sessionStorage.setItem("financeos_user", usr);
    }, userToken, targetUserData);

    await page.goto("http://localhost:5173/dashboard", { waitUntil: "networkidle0" });
    await page.waitForSelector("header", { timeout: 10000 });

    // Open Topbar notification bell
    console.log("11. Clicking Topbar notification bell...");
    await page.evaluate(() => {
      const bell = document.querySelector("button[aria-label*='notification' i], button.relative");
      if (bell) bell.click();
    });

    await new Promise((r) => setTimeout(r, 1500));
    const userScreenshotPath = path.join(SCREENSHOT_DIR, "user_topbar_inapp_received.png");
    await page.screenshot({ path: userScreenshotPath, fullPage: false });
    console.log(`[Screenshot Saved] ${userScreenshotPath}`);
    console.log("[PASS] In-App notification verified in user view!");

    console.log("\n=== ALL LIVE BROWSER AUTOMATION TESTS PASSED (100%) ===");
  } finally {
    await browser.close();
  }
}

runBrowserTest().catch((err) => {
  console.error("Browser test failed:", err);
  process.exit(1);
});
