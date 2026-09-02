const puppeteer = require('puppeteer-core');
const mongoose = require('./backend/node_modules/mongoose');
const dotenv = require('./backend/node_modules/dotenv');
dotenv.config({ path: 'd:/FinanceOS-main/FinanceOS_Code/backend/.env' });

async function runPreserveMonthNavigationSuite() {
  console.log('=== STARTING PRESERVE SELECTED DASHBOARD MONTH ACROSS NAVIGATION TEST SUITE ===');
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

  const verifyRes = await fetch('http://localhost:5000/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dip@test.com', otp: userDoc.otp })
  });
  const verifyData = await verifyRes.json();
  const token = verifyData.token;

  // Clean and seed March 2026 and September 2026 commitments
  await mongoose.connection.db.collection('savinggoals').deleteMany({ user: userDoc._id });
  await mongoose.connection.db.collection('investments').deleteMany({ user: userDoc._id });
  await mongoose.connection.db.collection('insurances').deleteMany({ user: userDoc._id });
  await mongoose.connection.db.collection('liabilities').deleteMany({ user: userDoc._id });

  // Seed SIP Investment: HDFC Top 100 SIP (5,000/mo)
  await mongoose.connection.db.collection('investments').insertOne({
    user: userDoc._id,
    name: 'HDFC Top 100 SIP',
    type: 'SIP',
    contributionType: 'Recurring',
    amount: 5000,
    monthlyContribution: 5000,
    currentValue: 5000,
    startDate: new Date(2026, 0, 1),
    nextContributionDate: new Date(2026, 2, 10),
    status: 'Active',
    sipContributions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Seed March 2026 Monthly Finance
  await mongoose.connection.db.collection('monthlyfinances').updateOne(
    { user: userDoc._id, year: 2026, month: 3 },
    {
      $set: {
        user: userDoc._id,
        year: 2026,
        month: 3,
        income: 50000,
        expenses: 20000,
        openingBalance: 15000,
        cashBalance: 15000,
        monthlySavings: 30000,
        closingBalance: 40000,
        availableToAllocate: 40000,
        commitments: 5000,
        updateDate: new Date(2026, 2, 1),
      }
    },
    { upsert: true }
  );

  // ------------------------------------------------------------
  // TEST 1: Initial Login & Select March 2026
  // ------------------------------------------------------------
  console.log('--- TEST 1: Open Dashboard and Select March 2026 ---');
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0' });
  await page.evaluate((tok, usr) => {
    localStorage.setItem('financeos_token', tok);
    localStorage.setItem('financeos_user', JSON.stringify(usr));
    sessionStorage.removeItem('financeos_selected_month');
  }, token, verifyData.user);

  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));

  // Open Month Modal
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Month:'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Select Mar
  await page.evaluate(() => {
    const marBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Mar');
    if (marBtn) marBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Click OK
  await page.evaluate(() => {
    const okBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'OK');
    if (okBtn) okBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  let currentUrl = page.url();
  let bodyText = await page.evaluate(() => document.body.innerText);
  console.log('URL after selecting March 2026:', currentUrl);
  console.log('Dashboard displays March 2026:', bodyText.includes('March 2026'));
  console.log('Dashboard displays March Income (50,000):', bodyText.includes('50,000'));
  console.log('Dashboard displays Remaining: ₹5,000:', bodyText.includes('Remaining: ₹5,000'));

  if (!currentUrl.includes('month=2026-03') || !bodyText.includes('March 2026')) {
    throw new Error('FAIL: Month selector did not set March 2026 context!');
  }
  console.log('SUCCESS: March 2026 selected and displayed on Dashboard!');

  // ------------------------------------------------------------
  // TEST 2: Navigate to Plans & Commitments and Return
  // ------------------------------------------------------------
  console.log('--- TEST 2: Navigate to Plans & Commitments -> Click Dashboard in Sidebar ---');
  await page.evaluate(() => {
    const link = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('Plans & Commitments'));
    if (link) link.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  console.log('Currently on page:', page.url());

  // Click Dashboard in Sidebar
  await page.evaluate(() => {
    const link = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('Dashboard'));
    if (link) link.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  currentUrl = page.url();
  bodyText = await page.evaluate(() => document.body.innerText);
  console.log('URL after returning from Plans & Commitments:', currentUrl);
  console.log('Dashboard still displays March 2026:', bodyText.includes('March 2026'));

  if (!bodyText.includes('March 2026')) {
    throw new Error('FAIL: Dashboard reset to current month after navigating back from Plans & Commitments!');
  }
  console.log('SUCCESS: March 2026 preserved after Plans & Commitments navigation!');

  // ------------------------------------------------------------
  // TEST 3: Navigate to Monthly Finance and Click "Back to Dashboard"
  // ------------------------------------------------------------
  console.log('--- TEST 3: Navigate to Monthly Finance -> Click "Back to Dashboard" ---');
  await page.evaluate(() => {
    const link = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('Monthly Finance'));
    if (link) link.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  console.log('Currently on page:', page.url());

  // Click Back to Dashboard
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Back to Dashboard'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  currentUrl = page.url();
  bodyText = await page.evaluate(() => document.body.innerText);
  console.log('URL after clicking Back to Dashboard in Monthly Finance:', currentUrl);
  console.log('Dashboard still displays March 2026:', bodyText.includes('March 2026'));

  if (!bodyText.includes('March 2026')) {
    throw new Error('FAIL: Dashboard reset to current month after Back to Dashboard from Monthly Finance!');
  }
  console.log('SUCCESS: March 2026 preserved after Monthly Finance navigation!');

  // ------------------------------------------------------------
  // TEST 4: Action in March 2026 — Record SIP Contribution & Verify Live Update
  // ------------------------------------------------------------
  console.log('--- TEST 4: Record SIP Contribution in March 2026 and verify March remains active ---');
  // Click "Pay SIP"
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Pay SIP'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // In SIPContributionModal, click "Record SIP Contribution"
  await page.evaluate(() => {
    const recBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Record SIP Contribution'));
    if (recBtn) recBtn.click();
  });
  await new Promise(r => setTimeout(r, 2600));

  currentUrl = page.url();
  bodyText = await page.evaluate(() => document.body.innerText);
  console.log('URL after recording SIP contribution:', currentUrl);
  console.log('Dashboard still displays March 2026:', bodyText.includes('March 2026'));
  console.log('Completed shows ₹5,000:', bodyText.includes('Completed: ₹5,000') || bodyText.includes('Paid: ₹5,000'));
  console.log('Remaining shows ₹0:', bodyText.includes('Remaining: ₹0'));
  console.log('Progress shows 100% Completed:', bodyText.includes('100% Completed'));

  if (!bodyText.includes('March 2026') || !bodyText.includes('100% Completed')) {
    throw new Error('FAIL: Dashboard did not stay on March 2026 or did not update 100% completed!');
  }
  console.log('SUCCESS: SIP action completed, Dashboard remains on March 2026 with live 100% status!');

  // ------------------------------------------------------------
  // TEST 5: Refresh Browser on March 2026 (F5)
  // ------------------------------------------------------------
  console.log('--- TEST 5: Refresh Browser (F5) on March 2026 ---');
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  currentUrl = page.url();
  bodyText = await page.evaluate(() => document.body.innerText);
  console.log('URL after F5 refresh:', currentUrl);
  console.log('Dashboard after F5 still displays March 2026:', bodyText.includes('March 2026'));
  console.log('Dashboard after F5 still displays 100% Completed:', bodyText.includes('100% Completed'));

  if (!bodyText.includes('March 2026') || !bodyText.includes('100% Completed')) {
    throw new Error('FAIL: March 2026 context lost on browser refresh!');
  }
  console.log('SUCCESS: March 2026 persisted across browser refresh!');

  // ------------------------------------------------------------
  // TEST 6: Reset to Current Month
  // ------------------------------------------------------------
  console.log('--- TEST 6: Explicit Reset to Current Month ---');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Current Month') || b.textContent.includes('Return to'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  currentUrl = page.url();
  bodyText = await page.evaluate(() => document.body.innerText);
  console.log('URL after resetting to Current Month:', currentUrl);
  console.log('Dashboard returned to September 2026:', bodyText.includes('September 2026'));

  if (!bodyText.includes('September 2026')) {
    throw new Error('FAIL: Reset to current month did not return to September 2026!');
  }
  console.log('SUCCESS: Reset to current month works as expected!');

  await browser.close();
  console.log('=== ALL PRESERVE MONTH NAVIGATION TESTS PASSED 100%! ===');
  process.exit(0);
}

runPreserveMonthNavigationSuite().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
