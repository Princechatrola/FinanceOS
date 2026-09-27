const puppeteer = require('../../node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const JWT_SECRET = process.env.JWT_SECRET || 'financeos_secret_key_2026';
const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots_reports');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function captureScreenshots() {
  console.log("Capturing Admin Reports screenshots...");
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  try {
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

    await page.goto('http://localhost:5173/admin/reports', { waitUntil: 'networkidle0' });
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // 1. Initial State
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_initial_reports_view.png') });
    console.log('Saved 01_initial_reports_view.png');

    // 2. Select 1 User
    const firstCheckbox = await page.$('table tbody tr:first-child input[type="checkbox"]');
    await firstCheckbox.evaluate(b => b.click());
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_one_user_selected.png') });
    console.log('Saved 02_one_user_selected.png');

    // 3. Select 5 Users and Scroll down (verifying sticky controls)
    const checkboxes = await page.$$('table tbody tr input[type="checkbox"]');
    for (let i = 1; i < 5; i++) {
      await checkboxes[i].evaluate(b => b.click());
    }
    await page.evaluate(() => {
      const main = document.querySelector('main');
      if (main) main.scrollTop = 500;
    });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_scrolled_sticky_actions.png') });
    console.log('Saved 03_scrolled_sticky_actions.png');

    // 4. Select All Filtered & Indeterminate
    const resetBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.innerText.includes('Reset'));
    });
    if (resetBtn) await resetBtn.evaluate(b => b.click());
    await new Promise(r => setTimeout(r, 400));

    // Search Dip
    const searchInput = await page.$('input[placeholder*="Search User ID"]');
    await searchInput.type('Dip');
    await new Promise(r => setTimeout(r, 400));

    // Click Select All
    const selectAllBox = await page.$('thead input[type="checkbox"]');
    await selectAllBox.evaluate(b => b.click());
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_filtered_select_all.png') });
    console.log('Saved 04_filtered_select_all.png');

    // Deselect 1 row -> Indeterminate
    const firstActiveRowCheckbox = await page.$('table tbody tr:first-child input[type="checkbox"]');
    await firstActiveRowCheckbox.evaluate(b => b.click());
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_indeterminate_select_all.png') });
    console.log('Saved 05_indeterminate_select_all.png');

    console.log('All screenshots captured successfully in:', SCREENSHOT_DIR);
  } finally {
    await browser.close();
  }
}

captureScreenshots().catch(err => {
  console.error("Screenshot capture error:", err);
  process.exit(1);
});
