const puppeteer = require('../../node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const JWT_SECRET = process.env.JWT_SECRET || 'financeos_secret_key_2026';
const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots_cleanup');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runCleanupAudit() {
  console.log("============================================================");
  console.log("FINANCEOS - ADMIN CLEANUP, USERS & LOGOUT E2E AUDIT");
  console.log("============================================================\n");

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const testResults = [];

  const setupAuth = async () => {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    const adminToken = jwt.sign(
      { id: '6a875580c5f0a5da7d75313f', role: 'admin', email: 'financeos.system@gmail.com' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const adminUser = JSON.stringify({
      _id: '6a875580c5f0a5da7d75313f',
      role: 'admin',
      name: 'Super Admin',
      email: 'financeos.system@gmail.com'
    });

    await page.evaluate((tok, usr) => {
      localStorage.setItem('financeos_token', tok);
      localStorage.setItem('financeos_user', usr);
      sessionStorage.setItem('financeos_token', tok);
      sessionStorage.setItem('financeos_user', usr);
    }, adminToken, adminUser);
  };

  try {
    // ----------------------------------------------------
    // TEST A: ADMIN DASHBOARD
    // ----------------------------------------------------
    console.log("--- TEST A: ADMIN DASHBOARD ---");
    await setupAuth();
    await page.goto('http://localhost:5173/admin/dashboard', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));

    // Verify "Manage Admins" is gone
    const manageAdminsText = await page.evaluate(() => {
      return document.body.innerText.includes("Manage Admins");
    });
    console.log("1. Manage Admins gone:", !manageAdminsText);

    // Verify "Recent Admin Activity" is gone
    const recentAdminActivityText = await page.evaluate(() => {
      return document.body.innerText.includes("Recent Admin Activity") ||
             document.body.innerText.includes("Activity API not connected yet");
    });
    console.log("2. Recent Admin Activity gone:", !recentAdminActivityText);

    // Verify Quick Actions count
    const quickActionsCount = await page.evaluate(() => {
      const administrationH2 = Array.from(document.querySelectorAll('h2')).find(h => h.innerText.includes('Quick Actions'));
      if (!administrationH2) return 0;
      const cardContainer = administrationH2.parentElement.nextElementSibling;
      return cardContainer ? cardContainer.children.length : 0;
    });
    console.log("3. Quick Actions count (expected 3):", quickActionsCount);

    // Verify Recent Registrations section present and clean
    const recentRegs = await page.evaluate(() => {
      return document.body.innerText.includes("Recent Registrations");
    });
    console.log("4. Recent Registrations present:", recentRegs);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_admin_dashboard.png') });

    // Test Quick Action: Create User navigation
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Create User'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 600));
    const isCreateUserPage = page.url().includes('/admin/users');
    console.log("5. Create User navigation works:", isCreateUserPage, page.url());

    // Test Quick Action: Generate Report navigation
    await page.goto('http://localhost:5173/admin/dashboard', { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Generate Report'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 600));
    const isReportsPage = page.url().includes('/admin/reports');
    console.log("6. Generate Report navigation works:", isReportsPage, page.url());

    // Test Quick Action: Create Message navigation
    await page.goto('http://localhost:5173/admin/dashboard', { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Create Message'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 600));
    const isMessagesPage = page.url().includes('/admin/messages');
    console.log("7. Create Message navigation works:", isMessagesPage, page.url());

    const testAPass = !manageAdminsText && !recentAdminActivityText && quickActionsCount === 3 && recentRegs && isCreateUserPage && isReportsPage && isMessagesPage;
    testResults.push({ name: "TEST A - Admin Dashboard Cleanup & Quick Actions", pass: testAPass });

    // ----------------------------------------------------
    // TEST B: ADMIN USERS & USER LOOKUP
    // ----------------------------------------------------
    console.log("\n--- TEST B: ADMIN USERS & USER LOOKUP ---");
    await page.goto('http://localhost:5173/admin/users', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));

    // Verify Sub-Admin / Manage Admin option is gone
    const subAdminOnUsersPage = await page.evaluate(() => {
      return document.body.innerText.includes("Sub Admin") || document.body.innerText.includes("Manage Admins");
    });
    console.log("1. Sub-Admin option absent on Users page:", !subAdminOnUsersPage);

    // Test First visible user
    console.log("2. Testing first user details...");
    await page.goto('http://localhost:5173/admin/users/6a6b7281682b6cd19e2e3eb9', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 800));
    const firstUserContent = await page.evaluate(() => document.body.innerText);
    const firstUserNotFound = firstUserContent.includes("User not found") || firstUserContent.includes("Error Loading User");
    const firstUserHasName = firstUserContent.includes("Dip Jivrajani");
    console.log("  - First user loads correctly:", !firstUserNotFound && firstUserHasName);

    // Test Middle user
    console.log("3. Testing middle user details...");
    await page.goto('http://localhost:5173/admin/users/6a8f4a943985d9478466c6c5', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 800));
    const middleUserContent = await page.evaluate(() => document.body.innerText);
    const middleUserNotFound = middleUserContent.includes("User not found") || middleUserContent.includes("Error Loading User");
    const middleUserHasName = middleUserContent.includes("madoo");
    console.log("  - Middle user loads correctly:", !middleUserNotFound && middleUserHasName);

    // Test Last visible user (FOS-U-000011)
    console.log("4. Testing last user details by Mongo ID...");
    await page.goto('http://localhost:5173/admin/users/6aa18e2f10e3472554221d3e', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 800));
    const lastUserContent = await page.evaluate(() => document.body.innerText);
    const lastUserNotFound = lastUserContent.includes("User not found") || lastUserContent.includes("Error Loading User");
    console.log("  - Last user loads correctly:", !lastUserNotFound);

    // Test FinanceOS ID directly in URL
    console.log("5. Testing user with FinanceOS ID (FOS-U-000011)...");
    await page.goto('http://localhost:5173/admin/users/FOS-U-000011', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 800));
    const fosUserContent = await page.evaluate(() => document.body.innerText);
    const fosUserNotFound = fosUserContent.includes("User not found") || fosUserContent.includes("Error Loading User");
    const fosUserHasDetails = fosUserContent.includes("FOS-U-000011") && fosUserContent.includes("Dip Jivrajani");
    console.log("  - FinanceOS ID resolves correctly:", !fosUserNotFound && fosUserHasDetails);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_user_by_financeos_id.png') });

    // Test Super Admin user details
    console.log("6. Testing Super Admin user lookup...");
    await page.goto('http://localhost:5173/admin/users/6a875580c5f0a5da7d75313f', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 800));
    const superAdminContent = await page.evaluate(() => document.body.innerText);
    const superAdminNotFound = superAdminContent.includes("User not found") || superAdminContent.includes("Error Loading User");
    console.log("  - Super Admin resolves correctly without 404:", !superAdminNotFound);

    // Test Manage User Access page with FinanceOS ID
    console.log("7. Testing Manage User Access (/admin/users/FOS-U-000011/access)...");
    await page.goto('http://localhost:5173/admin/users/FOS-U-000011/access', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 800));
    const accessPageContent = await page.evaluate(() => document.body.innerText);
    const accessPageError = accessPageContent.includes("User not found") || accessPageContent.includes("Unable to load user permissions");
    const accessPageHasModules = accessPageContent.includes("Dashboard") && accessPageContent.includes("Monthly Finance") && accessPageContent.includes("Manage User Access");
    console.log("  - Manage User Access loads cleanly without User not found:", !accessPageError && accessPageHasModules);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_manage_user_access_clean.png') });

    const testBPass = !subAdminOnUsersPage && !firstUserNotFound && !middleUserNotFound && !lastUserNotFound && !fosUserNotFound && !superAdminNotFound && !accessPageError && accessPageHasModules;
    testResults.push({ name: "TEST B - Users Page & Valid User Lookup (No User Not Found)", pass: testBPass });

    // ----------------------------------------------------
    // TEST C: REMOVED ROUTES
    // ----------------------------------------------------
    console.log("\n--- TEST C: REMOVED ROUTES REDIRECTION ---");
    // Test /admin/administrators redirects
    await page.goto('http://localhost:5173/admin/administrators', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 500));
    const redirectedUrl1 = page.url();
    console.log("1. /admin/administrators redirected to:", redirectedUrl1);

    // Test /admin/administrators/create redirects
    await page.goto('http://localhost:5173/admin/administrators/create', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 500));
    const redirectedUrl2 = page.url();
    console.log("2. /admin/administrators/create redirected to:", redirectedUrl2);

    // Test /admin/administrators/123/access redirects
    await page.goto('http://localhost:5173/admin/administrators/123/access', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 500));
    const redirectedUrl3 = page.url();
    console.log("3. /admin/administrators/123/access redirected to:", redirectedUrl3);

    const testCPass = redirectedUrl1.includes('/admin/dashboard') && redirectedUrl2.includes('/admin/dashboard') && redirectedUrl3.includes('/admin/dashboard');
    testResults.push({ name: "TEST C - Old Administrator Routes Cleanly Redirected", pass: testCPass });

    // ----------------------------------------------------
    // TEST D: LOGOUT CONFIRMATION MODAL & EXECUTION
    // ----------------------------------------------------
    console.log("\n--- TEST D: LOGOUT CONFIRMATION WORKFLOW ---");
    await page.goto('http://localhost:5173/admin/dashboard', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 500));

    // Click Sign Out button in sidebar
    console.log("1. Clicking Sign Out in sidebar...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const signOutBtn = btns.find(b => b.innerText.includes('Sign Out'));
      if (signOutBtn) signOutBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    // Check if modal appears
    const modalVisible = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"]') || document.querySelector('.fixed.inset-0');
      const text = document.body.innerText;
      return text.includes("Are you sure you want to sign out?") && !!modal;
    });
    console.log("2. Confirmation modal visible with 'Are you sure you want to sign out?':", modalVisible);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_signout_confirmation_modal.png') });

    // Click Cancel
    console.log("3. Clicking Cancel button in modal...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const cancelBtn = btns.find(b => b.innerText.trim() === 'Cancel');
      if (cancelBtn) cancelBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    // Verify modal closed and still on dashboard and authenticated
    const stillOnDashboard = page.url().includes('/admin/dashboard');
    const tokenAfterCancel = await page.evaluate(() => localStorage.getItem('financeos_token'));
    const modalClosed = await page.evaluate(() => !document.body.innerText.includes("Are you sure you want to sign out?"));
    console.log("4. Cancel closes modal, stays on dashboard, session retained:", stillOnDashboard && !!tokenAfterCancel && modalClosed);

    // Click Sign Out again
    console.log("5. Clicking Sign Out again...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const signOutBtn = btns.find(b => b.innerText.includes('Sign Out'));
      if (signOutBtn) signOutBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    // Click confirm "Sign Out" inside modal
    console.log("6. Confirming Sign Out in modal...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      // Find the Sign Out button inside the modal dialog
      const dialog = document.querySelector('[role="dialog"]') || document.querySelector('.relative.z-50') || document.querySelector('.bg-white.rounded-2xl');
      if (dialog) {
        const dialogBtns = Array.from(dialog.querySelectorAll('button'));
        const confirmBtn = dialogBtns.find(b => b.innerText.includes('Sign Out'));
        if (confirmBtn) confirmBtn.click();
      }
    });
    await new Promise(r => setTimeout(r, 1000));

    // Verify session cleared and redirected to /signin
    const currentUrlAfterLogout = page.url();
    const tokenAfterLogout = await page.evaluate(() => localStorage.getItem('financeos_token') || sessionStorage.getItem('financeos_token'));
    const userAfterLogout = await page.evaluate(() => localStorage.getItem('financeos_user') || sessionStorage.getItem('financeos_user'));
    const isRedirectedToSignin = currentUrlAfterLogout.includes('/signin');
    const isSessionCleared = !tokenAfterLogout && !userAfterLogout;
    console.log("7. Redirected to /signin:", isRedirectedToSignin, currentUrlAfterLogout);
    console.log("8. Session/tokens cleared:", isSessionCleared);

    // Attempt to access protected admin route
    console.log("9. Attempting to access protected /admin/dashboard without auth...");
    await page.goto('http://localhost:5173/admin/dashboard', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 500));
    const protectedUrl = page.url();
    const isBlocked = protectedUrl.includes('/signin');
    console.log("10. Protected route redirects back to /signin:", isBlocked, protectedUrl);

    const testDPass = modalVisible && stillOnDashboard && !!tokenAfterCancel && modalClosed && isRedirectedToSignin && isSessionCleared && isBlocked;
    testResults.push({ name: "TEST D - Logout Confirmation, Session Clearing & Protected Route", pass: testDPass });

  } catch (error) {
    console.error("Test execution failed:", error);
  } finally {
    await browser.close();
  }

  console.log("\n============================================================");
  console.log("AUDIT RESULTS SUMMARY");
  console.log("============================================================");
  testResults.forEach(t => {
    console.log(`${t.pass ? '✓ PASS' : '✗ FAIL'} : ${t.name}`);
  });
  console.log("============================================================\n");
}

runCleanupAudit().catch(console.error);
