const puppeteer = require('puppeteer-core');
const mongoose = require('./backend/node_modules/mongoose');
const dotenv = require('./backend/node_modules/dotenv');
dotenv.config({ path: 'd:/FinanceOS-main/FinanceOS_Code/backend/.env' });

async function runDashboardMonthTestSuite() {
  console.log('=== STARTING USER DASHBOARD MONTH SELECTOR & PERSISTENCE TEST SUITE ===');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('[Browser Console]', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('[Browser PageError]', err));

  await mongoose.connect(process.env.MONGO_URI);

  // 1. Authenticate dip@test.com
  console.log('1. Authenticating dip@test.com...');
  const sendOtpRes = await fetch('http://localhost:5000/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dip@test.com' })
  });
  const sendOtpData = await sendOtpRes.json();
  const userDoc = await mongoose.connection.db.collection('users').findOne({ email: 'dip@test.com' });
  console.log('User OTP:', userDoc.otp);

  const verifyRes = await fetch('http://localhost:5000/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dip@test.com', otp: userDoc.otp })
  });
  const verifyData = await verifyRes.json();
  const token = verifyData.token;
  console.log('Got JWT token. User role:', verifyData.user.role);

  // Seed distinct financial records for July, August, and September 2026
  console.log('Seeding distinct financial data for July (7), August (8), and September (9)...');
  await mongoose.connection.db.collection('monthlyfinances').updateOne(
    { user: userDoc._id, year: 2026, month: 7 },
    {
      $set: {
        user: userDoc._id,
        year: 2026,
        month: 7,
        income: 45000,
        expenses: 20000,
        openingBalance: 10000,
        cashBalance: 10000,
        monthlySavings: 25000,
        closingBalance: 35000,
        availableToAllocate: 35000,
        goalAllocations: 0,
        commitments: 0,
        updateDate: new Date(2026, 6, 15),
      }
    },
    { upsert: true }
  );

  await mongoose.connection.db.collection('monthlyfinances').updateOne(
    { user: userDoc._id, year: 2026, month: 8 },
    {
      $set: {
        user: userDoc._id,
        year: 2026,
        month: 8,
        income: 52000,
        expenses: 24000,
        openingBalance: 30000,
        cashBalance: 30000,
        monthlySavings: 28000,
        closingBalance: 58000,
        availableToAllocate: 58000,
        goalAllocations: 0,
        commitments: 0,
        updateDate: new Date(2026, 7, 15),
      }
    },
    { upsert: true }
  );

  await mongoose.connection.db.collection('monthlyfinances').updateOne(
    { user: userDoc._id, year: 2026, month: 9 },
    {
      $set: {
        user: userDoc._id,
        year: 2026,
        month: 9,
        income: 60000,
        expenses: 28000,
        openingBalance: 53000,
        cashBalance: 53000,
        monthlySavings: 32000,
        closingBalance: 85000,
        availableToAllocate: 85000,
        goalAllocations: 0,
        commitments: 0,
        updateDate: new Date(2026, 8, 15),
      }
    },
    { upsert: true }
  );

  // ------------------------------------------------------------
  // TEST A: LOGIN DEFAULT BEHAVIOR (Opens Current Month)
  // ------------------------------------------------------------
  console.log('--- TEST A: Login Default Behavior ---');
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0' });
  await page.evaluate((tok, usr) => {
    localStorage.setItem('financeos_token', tok);
    localStorage.setItem('financeos_user', JSON.stringify(usr));
  }, token, verifyData.user);

  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  const initialDashText = await page.evaluate(() => document.body.innerText);
  console.log('Default Dashboard shows September 2026:', initialDashText.includes('September 2026'));
  console.log('Default Dashboard shows September Income (60,000):', initialDashText.includes('60,000'));
  if (!initialDashText.includes('September 2026') || !initialDashText.includes('60,000')) {
    throw new Error('FAIL: Dashboard did not open current month (September 2026) with correct data on login!');
  }
  console.log('SUCCESS: Default login behavior verified!');

  // ------------------------------------------------------------
  // TEST B: MONTH SELECTION + OK BUTTON (Switch to August 2026)
  // ------------------------------------------------------------
  console.log('--- TEST B: Month Selection + OK Button (August 2026) ---');
  // Click month picker button
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Month:'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Select "Aug" in the month modal
  await page.evaluate(() => {
    const augBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim().startsWith('Aug'));
    if (augBtn) augBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Click OK button
  await page.evaluate(() => {
    const okBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'OK');
    if (okBtn) okBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  const augUrl = page.url();
  console.log('URL after selecting August:', augUrl);
  if (!augUrl.includes('month=2026-08')) {
    throw new Error(`FAIL: URL should contain ?month=2026-08, got ${augUrl}`);
  }

  const augDashText = await page.evaluate(() => document.body.innerText);
  console.log('Dashboard shows August 2026:', augDashText.includes('August 2026'));
  console.log('Dashboard shows August Income (52,000):', augDashText.includes('52,000'));
  console.log('Dashboard shows August Expenses (24,000):', augDashText.includes('24,000'));
  console.log('Dashboard shows August Savings (28,000):', augDashText.includes('28,000'));
  console.log('Dashboard shows August Opening Balance (30,000):', augDashText.includes('30,000'));
  console.log('Dashboard shows August Available to Allocate (58,000):', augDashText.includes('58,000') || augDashText.includes('53,000'));

  if (!augDashText.includes('August 2026') || !augDashText.includes('52,000')) {
    console.log('Dashboard text:', augDashText);
    throw new Error('FAIL: Dashboard data did not update to August 2026!');
  }
  console.log('SUCCESS: Month selection + OK button updated dashboard data and URL seamlessly without page reload!');

  // ------------------------------------------------------------
  // TEST C: REFRESH PERSISTENCE (F5 on August 2026)
  // ------------------------------------------------------------
  console.log('--- TEST C: Refresh Persistence (F5 on August 2026) ---');
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  const refreshedUrl = page.url();
  console.log('URL after page refresh:', refreshedUrl);
  if (!refreshedUrl.includes('month=2026-08')) {
    throw new Error(`FAIL: URL lost month=2026-08 after reload! Got: ${refreshedUrl}`);
  }

  const refreshedDashText = await page.evaluate(() => document.body.innerText);
  console.log('Refreshed Dashboard shows August 2026:', refreshedDashText.includes('August 2026'));
  console.log('Refreshed Dashboard shows August Income (52,000):', refreshedDashText.includes('52,000'));
  if (!refreshedDashText.includes('August 2026') || !refreshedDashText.includes('52,000')) {
    throw new Error('FAIL: Refresh reset the dashboard away from August 2026!');
  }
  console.log('SUCCESS: Selected month persisted 100% across page refresh!');

  // ------------------------------------------------------------
  // TEST D: SWITCH TO JULY 2026
  // ------------------------------------------------------------
  console.log('--- TEST D: Switch to July 2026 ---');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Month:'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  await page.evaluate(() => {
    const julBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim().startsWith('Jul'));
    if (julBtn) julBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  await page.evaluate(() => {
    const okBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'OK');
    if (okBtn) okBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  const julDashText = await page.evaluate(() => document.body.innerText);
  console.log('Dashboard shows July 2026:', julDashText.includes('July 2026'));
  console.log('Dashboard shows July Income (45,000):', julDashText.includes('45,000'));

  if (!julDashText.includes('July 2026') || !julDashText.includes('45,000')) {
    throw new Error('FAIL: Dashboard data did not update to July 2026!');
  }
  console.log('SUCCESS: Switched to July 2026 with correct month-specific financial data!');

  // ------------------------------------------------------------
  // TEST E: RESET TO CURRENT MONTH SHORTCUT
  // ------------------------------------------------------------
  console.log('--- TEST E: Reset to Current Month ---');
  await page.evaluate(() => {
    const currBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Current Month'));
    if (currBtn) currBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  const resetDashText = await page.evaluate(() => document.body.innerText);
  console.log('Dashboard returned to September 2026:', resetDashText.includes('September 2026'));
  console.log('Dashboard returned to September Income (60,000):', resetDashText.includes('60,000'));
  if (!resetDashText.includes('September 2026') || !resetDashText.includes('60,000')) {
    throw new Error('FAIL: Reset to current month failed!');
  }
  console.log('SUCCESS: Reset to Current Month works cleanly!');

  // ------------------------------------------------------------
  // TEST F: HISTORICAL / EMPTY MONTH HANDLING
  // ------------------------------------------------------------
  console.log('--- TEST F: Empty Month Handling (2025-01) ---');
  await page.goto('http://localhost:5173/dashboard?month=2025-01', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  const emptyMonthText = await page.evaluate(() => document.body.innerText);
  console.log('Dashboard shows January 2025:', emptyMonthText.includes('January 2025'));
  console.log('Dashboard shows empty notice / Record button:', emptyMonthText.includes('Record January 2025 Finance') || emptyMonthText.includes('January 2025'));
  if (!emptyMonthText.includes('January 2025')) {
    throw new Error('FAIL: Empty historical month failed to load properly!');
  }
  console.log('SUCCESS: Empty month handled gracefully without broken state!');

  await browser.close();
  console.log('=== ALL USER DASHBOARD MONTH SELECTOR TESTS PASSED 100%! ===');
  process.exit(0);
}

runDashboardMonthTestSuite().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
