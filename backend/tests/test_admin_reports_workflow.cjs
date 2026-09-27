const puppeteer = require('../../node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const JWT_SECRET = process.env.JWT_SECRET || 'financeos_secret_key_2026';

async function runReportsAudit() {
  console.log("============================================================");
  console.log("FINANCEOS - ADMIN REPORTS COMPREHENSIVE WORKFLOW AUDIT");
  console.log("============================================================\n");

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const testResults = [];

  try {
    // 0. Set up authenticated session
    console.log("Setting up Admin session...");
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });

    const adminToken = jwt.sign(
      { id: '6a875580c5f0a5da7d75313f', role: 'admin', email: 'financeos.system@gmail.com' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const adminUser = JSON.stringify({
      _id: '6a875580c5f0a5da7d75313f',
      role: 'admin',
      name: 'Admin System',
      email: 'financeos.system@gmail.com'
    });

    await page.evaluate((tok, usr) => {
      localStorage.setItem('financeos_token', tok);
      localStorage.setItem('financeos_user', usr);
    }, adminToken, adminUser);

    // 1. Navigate to /admin/reports
    console.log("Navigating to /admin/reports...");
    await page.goto('http://localhost:5173/admin/reports', { waitUntil: 'networkidle0' });
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const initialRowCount = await page.$$eval('table tbody tr', rows => rows.length);
    console.log(`Initial rows loaded: ${initialRowCount}`);

    // ========================================================
    // TEST 1 — Individual User Download
    // ========================================================
    console.log("\n--- TEST 1: Individual User Download ---");
    const targetUserRow = await page.evaluateHandle(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      return rows.find(r => r.innerText.includes('Dip Jivrajani') || r.innerText.includes('FOS-U-000001'));
    });

    let pass1 = false;
    if (targetUserRow) {
      const downloadBtn = await targetUserRow.$('button[title="Download Report"]');
      if (downloadBtn) {
        let requestedUrl = "";
        const requestListener = req => {
          if (req.url().includes('/api/admin/users/') && req.url().includes('/reports')) {
            requestedUrl = req.url();
          }
        };
        page.on('request', requestListener);

        await downloadBtn.evaluate(b => b.click());
        await new Promise(r => setTimeout(r, 1200));

        page.off('request', requestListener);
        console.log(`  Report Request URL: ${requestedUrl}`);
        pass1 = requestedUrl.length > 0 && requestedUrl.includes('/reports');
      }
    }
    console.log(`Test 1 Result: ${pass1 ? "PASS" : "FAIL"}`);
    testResults.push({ name: "TEST 1 — Individual User Download", pass: pass1 });

    // ========================================================
    // TEST 2 — Select One
    // ========================================================
    console.log("\n--- TEST 2: Select One ---");
    const firstRowCheckbox = await page.$('table tbody tr:first-child input[type="checkbox"]');
    await firstRowCheckbox.evaluate(b => b.click());
    await new Promise(r => setTimeout(r, 400));

    const selectedText1 = await page.$eval('section.rounded-2xl div.sticky p', el => el.innerText);
    console.log(`  Header count text: "${selectedText1}"`);
    const pass2 = selectedText1.includes('1 user selected');
    console.log(`Test 2 Result: ${pass2 ? "PASS" : "FAIL"}`);
    testResults.push({ name: "TEST 2 — Select One User", pass: pass2 });

    // ========================================================
    // TEST 3 — Select Multiple (5 users) while scrolling
    // ========================================================
    console.log("\n--- TEST 3: Select Multiple (5 Users) ---");
    const rowCheckboxes = await page.$$('table tbody tr input[type="checkbox"]');
    for (let i = 1; i < Math.min(5, rowCheckboxes.length); i++) {
      await rowCheckboxes[i].evaluate(b => b.click());
    }
    await new Promise(r => setTimeout(r, 400));

    const selectedText5 = await page.$eval('section.rounded-2xl div.sticky p', el => el.innerText);
    console.log(`  Selected 5 count text: "${selectedText5}"`);
    const pass3_count = selectedText5.includes('5 users selected');

    // Scroll deep into the container
    await page.evaluate(() => {
      const main = document.querySelector('main');
      if (main) main.scrollTop = 400;
    });
    await new Promise(r => setTimeout(r, 300));

    // Verify sticky header is still visible within viewport
    const stickyBox = await page.$eval('section.rounded-2xl div.sticky', el => {
      const rect = el.getBoundingClientRect();
      return { top: rect.top, height: rect.height, visible: rect.top >= 0 && rect.bottom > 0 };
    });
    console.log(`  Sticky header position while scrolled: top=${stickyBox.top}, visible=${stickyBox.visible}`);

    const pass3 = pass3_count && stickyBox.visible;
    console.log(`Test 3 Result: ${pass3 ? "PASS" : "FAIL"}`);
    testResults.push({ name: "TEST 3 — Select 5 Users & Sticky Access", pass: pass3 });

    // ========================================================
    // TEST 4 — Select All
    // ========================================================
    console.log("\n--- TEST 4: Select All ---");
    const resetBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.innerText.includes('Reset'));
    });
    if (resetBtn) await resetBtn.evaluate(b => b.click());
    await new Promise(r => setTimeout(r, 400));

    // Filter by Status = "Active"
    await page.select('select', 'Active');
    await new Promise(r => setTimeout(r, 400));

    const activeRowsCount = await page.$$eval('table tbody tr', rows => rows.length);
    console.log(`  Active rows count: ${activeRowsCount}`);

    // Click Select All checkbox
    const selectAllBox = await page.$('thead input[type="checkbox"]');
    await selectAllBox.evaluate(b => b.click());
    await new Promise(r => setTimeout(r, 400));

    const selectedAllText = await page.$eval('section.rounded-2xl div.sticky p', el => el.innerText);
    console.log(`  After Select All count text: "${selectedAllText}"`);
    const isChecked = await page.$eval('thead input[type="checkbox"]', el => el.checked);

    const pass4 = selectedAllText.includes(`${activeRowsCount} users selected`) && isChecked;
    console.log(`Test 4 Result: ${pass4 ? "PASS" : "FAIL"}`);
    testResults.push({ name: "TEST 4 — Select All Filtered Users", pass: pass4 });

    // ========================================================
    // TEST 5 — Deselect One User (Indeterminate State)
    // ========================================================
    console.log("\n--- TEST 5: Deselect One (Indeterminate Checkbox) ---");
    const firstActiveRowCheckbox = await page.$('table tbody tr:first-child input[type="checkbox"]');
    await firstActiveRowCheckbox.evaluate(b => b.click());
    await new Promise(r => setTimeout(r, 400));

    const afterDeselectText = await page.$eval('section.rounded-2xl div.sticky p', el => el.innerText);
    console.log(`  After unchecking 1 row: "${afterDeselectText}"`);

    const checkboxState = await page.$eval('thead input[type="checkbox"]', el => ({
      checked: el.checked,
      indeterminate: el.indeterminate
    }));
    console.log(`  Select All checkbox: checked=${checkboxState.checked}, indeterminate=${checkboxState.indeterminate}`);

    const pass5 =
      afterDeselectText.includes(`${activeRowsCount - 1} users selected`) &&
      checkboxState.indeterminate === true;
    console.log(`Test 5 Result: ${pass5 ? "PASS" : "FAIL"}`);
    testResults.push({ name: "TEST 5 — Deselect & Indeterminate State", pass: pass5 });

    // ========================================================
    // TEST 6 — Filter + Select All Behavior
    // ========================================================
    console.log("\n--- TEST 6: Filter + Select All ---");
    const resetBtn2 = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.innerText.includes('Reset'));
    });
    if (resetBtn2) await resetBtn2.evaluate(b => b.click());
    await new Promise(r => setTimeout(r, 400));

    // Type search query "Dip"
    const searchInput = await page.$('input[placeholder*="Search User ID"]');
    await searchInput.type('Dip');
    await new Promise(r => setTimeout(r, 400));

    const searchRowsCount = await page.$$eval('table tbody tr', rows => rows.length);
    console.log(`  Rows matching "Dip": ${searchRowsCount}`);

    // Click Select All
    const selectAllBox2 = await page.$('thead input[type="checkbox"]');
    await selectAllBox2.evaluate(b => b.click());
    await new Promise(r => setTimeout(r, 400));

    const filterSelectedText = await page.$eval('section.rounded-2xl div.sticky p', el => el.innerText);
    console.log(`  Filter Select All text: "${filterSelectedText}"`);

    const pass6 = filterSelectedText.includes(`${searchRowsCount} users selected`);
    console.log(`Test 6 Result: ${pass6 ? "PASS" : "FAIL"}`);
    testResults.push({ name: "TEST 6 — Filter + Select All Matching Only", pass: pass6 });

    // ========================================================
    // TEST 7 — Scroll Deep & Sticky Actions
    // ========================================================
    console.log("\n--- TEST 7: Scroll & Sticky Action Usability ---");
    await page.evaluate(() => {
      const input = document.querySelector('input[placeholder*="Search User ID"]');
      if (input) {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await new Promise(r => setTimeout(r, 300));

    // Scroll down 600px
    await page.evaluate(() => {
      const main = document.querySelector('main');
      if (main) main.scrollTop = 600;
    });
    await new Promise(r => setTimeout(r, 300));

    // Check sticky header action buttons are visible and clickable
    const stickyButtons = await page.$$eval('section.rounded-2xl div.sticky button', btns =>
      btns.map(b => ({ text: b.innerText.trim(), disabled: b.disabled }))
    );
    console.log(`  Sticky header buttons:`, stickyButtons);

    const hasRefresh = stickyButtons.some(b => b.text.includes('Refresh'));
    const hasCSV = stickyButtons.some(b => b.text.includes('Export CSV'));
    const hasPDF = stickyButtons.some(b => b.text.includes('Generate PDF'));

    const pass7 = hasRefresh && hasCSV && hasPDF;
    console.log(`Test 7 Result: ${pass7 ? "PASS" : "FAIL"}`);
    testResults.push({ name: "TEST 7 — Sticky Action Controls Accessibility", pass: pass7 });

    // ========================================================
    // TEST 8 — Page Refresh Stability
    // ========================================================
    console.log("\n--- TEST 8: Refresh Page Stability ---");
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const reloadedRowCount = await page.$$eval('table tbody tr', rows => rows.length);
    console.log(`  Reloaded row count: ${reloadedRowCount}`);

    const pass8 = reloadedRowCount === initialRowCount && reloadedRowCount > 0;
    console.log(`Test 8 Result: ${pass8 ? "PASS" : "FAIL"}`);
    testResults.push({ name: "TEST 8 — Page Refresh Stability", pass: pass8 });

    // ========================================================
    // TEST 9 — No Users Selected Modal & Alert Protection
    // ========================================================
    console.log("\n--- TEST 9: No Users Selected Modal & Alert Protection ---");
    // Filter to zero results
    const searchInput2 = await page.$('input[placeholder*="Search User ID"]');
    await searchInput2.type('NON_EXISTENT_QUERY_9999');
    await new Promise(r => setTimeout(r, 400));

    // Listen for unexpected browser alert dialog
    let browserAlertCalled = false;
    page.on('dialog', async dialog => {
      browserAlertCalled = true;
      await dialog.dismiss();
    });

    const exportCsvBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.innerText.includes('Export CSV'));
    });
    if (exportCsvBtn) await exportCsvBtn.evaluate(b => b.click());
    await new Promise(r => setTimeout(r, 400));

    const modalVisible = await page.$eval('[role="dialog"]', el => {
      return el && el.innerText.includes('No users selected');
    }).catch(() => false);
    console.log(`  Modal opened with proper message: ${modalVisible}`);
    console.log(`  Browser alert() prevented: ${!browserAlertCalled}`);

    const pass9 = modalVisible && !browserAlertCalled;
    console.log(`Test 9 Result: ${pass9 ? "PASS" : "FAIL"}`);
    testResults.push({ name: "TEST 9 — Modal Notification & Zero Browser Alert", pass: pass9 });

  } finally {
    await browser.close();
  }

  console.log("\n============================================================");
  console.log("AUDIT SUMMARY RESULTS");
  console.log("============================================================");
  let allPass = true;
  testResults.forEach(r => {
    console.log(`- [${r.pass ? "PASS" : "FAIL"}] ${r.name}`);
    if (!r.pass) allPass = false;
  });
  console.log("============================================================");
  console.log(`FINAL RESULT: ${allPass ? "ALL 8 TESTS PASSED" : "FAILURES DETECTED"}`);
  console.log("============================================================\n");

  if (!allPass) process.exit(1);
}

runReportsAudit().catch(err => {
  console.error("Test Suite Fatal Error:", err);
  process.exit(1);
});
