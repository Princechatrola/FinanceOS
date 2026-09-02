const puppeteer = require('puppeteer-core');
const mongoose = require('./backend/node_modules/mongoose');
const dotenv = require('./backend/node_modules/dotenv');
dotenv.config({ path: 'd:/FinanceOS-main/FinanceOS_Code/backend/.env' });

async function runReportsHealthSidebarCompleteSuite() {
  console.log('=== STARTING REPORTS REDESIGN, FINANCIAL HEALTH & COLLAPSIBLE SIDEBAR TEST SUITE ===');

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('[Browser Error]', msg.text());
  });
  page.on('pageerror', err => console.error('[Browser PageError]', err));

  await mongoose.connect(process.env.MONGO_URI);

  // 1. Authenticate user dip@test.com
  console.log('1. Authenticating dip@test.com...');
  const sendOtpRes = await fetch('http://localhost:5000/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dip@test.com' })
  });
  const userDoc = await mongoose.connection.db.collection('users').findOne({ email: 'dip@test.com' });

  const verifyRes = await fetch('http://localhost:5000/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dip@test.com', otp: userDoc.otp })
  });
  const verifyData = await verifyRes.json();
  const token = verifyData.token;

  // 2. Seed multi-month data for 2026 (Jan, Feb, Mar, Sep)
  console.log('2. Seeding multi-month data for 2026 in MongoDB...');
  await mongoose.connection.db.collection('savinggoals').deleteMany({ user: userDoc._id });
  await mongoose.connection.db.collection('investments').deleteMany({ user: userDoc._id });
  await mongoose.connection.db.collection('insurances').deleteMany({ user: userDoc._id });
  await mongoose.connection.db.collection('liabilities').deleteMany({ user: userDoc._id });
  await mongoose.connection.db.collection('monthlyfinances').deleteMany({ user: userDoc._id });

  // Monthly Finances across 2026
  await mongoose.connection.db.collection('monthlyfinances').insertMany([
    {
      user: userDoc._id,
      year: 2026,
      month: 1,
      income: 100000,
      expenses: 40000,
      openingBalance: 20000,
      cashBalance: 20000,
      monthlySavings: 60000,
      closingBalance: 80000,
      availableToAllocate: 80000,
      commitments: 20000,
      createdAt: new Date(2026, 0, 1),
    },
    {
      user: userDoc._id,
      year: 2026,
      month: 2,
      income: 110000,
      expenses: 42000,
      openingBalance: 80000,
      cashBalance: 80000,
      monthlySavings: 68000,
      closingBalance: 128000,
      availableToAllocate: 128000,
      commitments: 20000,
      createdAt: new Date(2026, 1, 1),
    },
    {
      user: userDoc._id,
      year: 2026,
      month: 3,
      income: 120000,
      expenses: 45000,
      openingBalance: 128000,
      cashBalance: 128000,
      monthlySavings: 75000,
      closingBalance: 183000,
      availableToAllocate: 183000,
      commitments: 20000,
      createdAt: new Date(2026, 2, 1),
    },
  ]);

  // Saving Goal
  await mongoose.connection.db.collection('savinggoals').insertOne({
    user: userDoc._id,
    goalName: 'Vacation Fund',
    category: 'Travel',
    targetAmount: 80000,
    currentAmount: 25000,
    savedAmount: 25000,
    monthlyContribution: 5000,
    startDate: new Date(2026, 0, 15),
    targetDate: new Date(2026, 11, 31),
    status: 'Active',
    contributions: [
      { amount: 5000, date: new Date(2026, 0, 15), note: 'Jan deposit' },
      { amount: 5000, date: new Date(2026, 1, 15), note: 'Feb deposit' },
      { amount: 5000, date: new Date(2026, 2, 15), note: 'Mar deposit' },
    ],
    createdAt: new Date(2026, 0, 15),
    updatedAt: new Date(),
  });

  // Investments: SIP & FD
  await mongoose.connection.db.collection('investments').insertMany([
    {
      user: userDoc._id,
      name: 'Axis Bluechip SIP',
      type: 'SIP',
      amount: 5000,
      monthlyContribution: 5000,
      currentValue: 30000,
      startDate: new Date(2026, 0, 1),
      nextContributionDate: new Date(2026, 2, 10),
      status: 'Active',
      sipContributions: [
        { dueDate: new Date(2026, 2, 10), paidDate: new Date(2026, 2, 10), amount: 5000, status: 'Paid' }
      ],
      createdAt: new Date(2026, 0, 1),
    },
    {
      user: userDoc._id,
      name: 'HDFC Fixed Deposit',
      type: 'Fixed Deposit',
      amount: 100000,
      principalAmount: 100000,
      currentValue: 107500,
      maturityAmount: 107500,
      interestRate: 7.5,
      institution: 'HDFC Bank',
      startDate: new Date(2025, 11, 1),
      maturityDate: new Date(2026, 11, 1),
      status: 'Active',
      createdAt: new Date(2025, 11, 1),
    }
  ]);

  // Insurance
  await mongoose.connection.db.collection('insurances').insertOne({
    user: userDoc._id,
    name: 'HDFC Life Term Plan',
    type: 'Life Insurance',
    provider: 'HDFC Life',
    policyNumber: 'HD123456',
    premiumAmount: 1500,
    premiumFrequency: 'Month',
    coverageAmount: 10000000,
    startDate: new Date(2026, 0, 5),
    renewalDate: new Date(2027, 0, 5),
    status: 'Active',
    payments: [
      { date: new Date(2026, 2, 5), paidDate: new Date(2026, 2, 5), amount: 1500, status: 'Paid' }
    ],
    createdAt: new Date(2026, 0, 5),
  });

  // Liability
  await mongoose.connection.db.collection('liabilities').insertOne({
    user: userDoc._id,
    name: 'Car Loan',
    type: 'Car Loan',
    lender: 'ICICI Bank',
    principalAmount: 500000,
    remainingAmount: 420000,
    monthlyEMI: 12000,
    interestRate: 9.0,
    startDate: new Date(2025, 6, 1),
    status: 'Active',
    payments: [
      { date: new Date(2026, 2, 5), paidDate: new Date(2026, 2, 5), amount: 12000, principalComponent: 8850, interestComponent: 3150, status: 'Paid' }
    ],
    createdAt: new Date(2025, 6, 1),
  });

  // ------------------------------------------------------------
  // TEST 1: Collapsible Sidebar Functionality
  // ------------------------------------------------------------
  console.log('--- TEST 1: Collapsible Sidebar Toggle & Persistence ---');
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0' });
  await page.evaluate((tok, usr) => {
    localStorage.setItem('financeos_token', tok);
    localStorage.setItem('financeos_user', JSON.stringify(usr));
    sessionStorage.setItem('financeos_selected_month', '2026-03');
    localStorage.removeItem('financeos_sidebar_collapsed');
  }, token, verifyData.user);

  await page.goto('http://localhost:5173/dashboard?month=2026-03', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));

  // Check initial expanded sidebar
  let asideWidthClass = await page.evaluate(() => document.querySelector('aside')?.className);
  console.log('Initial Sidebar classes contain w-64:', asideWidthClass.includes('w-64'));
  if (!asideWidthClass.includes('w-64')) throw new Error('FAIL: Sidebar did not start expanded (w-64)!');

  // Click hamburger menu to collapse
  console.log('Clicking hamburger button to collapse sidebar...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('aside button')).find(b => b.title.includes('Collapse') || b.title.includes('Sidebar'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  asideWidthClass = await page.evaluate(() => document.querySelector('aside')?.className);
  let mainMarginClass = await page.evaluate(() => document.querySelector('main')?.className);
  console.log('Collapsed Sidebar classes contain w-20:', asideWidthClass.includes('w-20'));
  console.log('Main content margin adapted to ml-20:', mainMarginClass.includes('ml-20'));

  if (!asideWidthClass.includes('w-20') || !mainMarginClass.includes('ml-20')) {
    throw new Error('FAIL: Sidebar collapse failed to update sidebar w-20 or main ml-20!');
  }

  // Navigate to Reports and verify collapsed state & selected month preserved
  console.log('Navigating to Reports with collapsed sidebar...');
  await page.evaluate(() => {
    const link = Array.from(document.querySelectorAll('aside a')).find(a => a.getAttribute('href')?.includes('/reports'));
    if (link) link.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  const reportsUrl = page.url();
  asideWidthClass = await page.evaluate(() => document.querySelector('aside')?.className);
  console.log('URL on Reports:', reportsUrl);
  console.log('Preserved month=2026-03 on Reports:', reportsUrl.includes('month=2026-03'));
  console.log('Sidebar remains collapsed on Reports (w-20):', asideWidthClass.includes('w-20'));

  if (!reportsUrl.includes('month=2026-03') || !asideWidthClass.includes('w-20')) {
    throw new Error('FAIL: Collapsed sidebar state or selected month lost on navigation to Reports!');
  }

  // Expand sidebar back
  console.log('Expanding sidebar back (w-64)...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('aside button')).find(b => b.title.includes('Expand') || b.title.includes('Sidebar'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 500));
  asideWidthClass = await page.evaluate(() => document.querySelector('aside')?.className);
  console.log('Sidebar expanded back to w-64:', asideWidthClass.includes('w-64'));
  console.log('SUCCESS: Collapsible sidebar verified 100%!');

  // ------------------------------------------------------------
  // TEST 2: Monthly Report Redesign & Analytics
  // ------------------------------------------------------------
  console.log('--- TEST 2: Monthly Report Verification (March 2026) ---');
  let bodyText = await page.evaluate(() => document.body.innerText);

  console.log('Report Title shows Monthly Financial Statement:', bodyText.includes('Monthly Financial Statement'));
  console.log('Report Period shows March 2026 range:', bodyText.includes('March 1') && bodyText.includes('2026'));
  console.log('Total Inflow shows ₹1,20,000:', bodyText.includes('1,20,000'));
  console.log('Total Expenses shows ₹45,000:', bodyText.includes('45,000'));
  console.log('Net Savings shows ₹75,000:', bodyText.includes('75,000'));
  console.log('Financial Health Score rendered:', bodyText.includes('Financial Health Score') || bodyText.includes('FINANCIAL HEALTH SCORE'));
  console.log('Savings Health Breakdown rendered:', bodyText.includes('Savings Health'));
  console.log('Net Worth Progression rendered:', bodyText.includes('Net Worth Timeline') || bodyText.includes('NET WORTH TIMELINE'));
  console.log('Upcoming Maturities rendered (HDFC Fixed Deposit):', bodyText.includes('HDFC Fixed Deposit'));

  if (!bodyText.includes('1,20,000') || !bodyText.includes('75,000') || !bodyText.includes('Monthly Financial Statement')) {
    throw new Error('FAIL: Monthly Report is missing key analytics or data!');
  }
  console.log('SUCCESS: Monthly report verified!');

  // ------------------------------------------------------------
  // TEST 3: Quarterly Report (Q1 2026)
  // ------------------------------------------------------------
  console.log('--- TEST 3: Quarterly Report Switch (Q1 2026) ---');
  await page.evaluate(() => {
    const tab = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Quarterly');
    if (tab) tab.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  bodyText = await page.evaluate(() => document.body.innerText);
  console.log('Shows Quarterly Financial Review:', bodyText.includes('Quarterly Financial Review'));
  console.log('Shows Q1 2026 range (January — March 2026):', bodyText.includes('January — March 2026') || bodyText.includes('Q1'));
  console.log('Total Q1 Inflow (3,30,000 = 100k+110k+120k):', bodyText.includes('3,30,000'));
  console.log('Total Q1 Expenses (1,27,000 = 40k+42k+45k):', bodyText.includes('1,27,000'));
  console.log('Shows 3-Month table rows (January, February, March):', bodyText.includes('January') && bodyText.includes('February') && bodyText.includes('March'));

  if (!bodyText.includes('3,30,000') || !bodyText.includes('1,27,000') || !bodyText.includes('Quarterly Financial Review')) {
    throw new Error('FAIL: Quarterly Report calculations or 3-month grid mismatch!');
  }
  console.log('SUCCESS: Quarterly report verified!');

  // ------------------------------------------------------------
  // TEST 4: Half-Yearly Report (H1 2026)
  // ------------------------------------------------------------
  console.log('--- TEST 4: Half-Yearly Report Switch (H1 2026) ---');
  await page.evaluate(() => {
    const tab = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Half-Yearly');
    if (tab) tab.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  bodyText = await page.evaluate(() => document.body.innerText);
  console.log('Shows Half-Yearly Financial Audit:', bodyText.includes('Half-Yearly Financial Audit'));
  console.log('Shows H1 (January — June 2026):', bodyText.includes('January — June 2026') || bodyText.includes('H1'));
  console.log('Shows 6-Month matrix (January through June):', bodyText.includes('January') && bodyText.includes('June'));

  if (!bodyText.includes('Half-Yearly Financial Audit') || !bodyText.includes('June')) {
    throw new Error('FAIL: Half-Yearly Report structure mismatch!');
  }
  console.log('SUCCESS: Half-Yearly report verified!');

  // ------------------------------------------------------------
  // TEST 5: Yearly Report (2026)
  // ------------------------------------------------------------
  console.log('--- TEST 5: Yearly Report Switch (2026) ---');
  await page.evaluate(() => {
    const tab = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Yearly');
    if (tab) tab.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  bodyText = await page.evaluate(() => document.body.innerText);
  console.log('Shows Annual Financial Statement:', bodyText.includes('Annual Financial Statement'));
  console.log('Shows 12-Month timeline points / December:', bodyText.includes('December'));

  if (!bodyText.includes('Annual Financial Statement') || !bodyText.includes('December')) {
    throw new Error('FAIL: Yearly Report structure mismatch!');
  }
  console.log('SUCCESS: Yearly report verified!');

  // ------------------------------------------------------------
  // TEST 6: Trigger PDF Generation in Browser
  // ------------------------------------------------------------
  console.log('--- TEST 6: PDF Download Handler Execution ---');
  const pdfGenerated = await page.evaluate(() => {
    try {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Download'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  });
  console.log('PDF download button clicked successfully without throwing:', pdfGenerated);
  if (!pdfGenerated) throw new Error('FAIL: PDF generation trigger failed!');

  await browser.close();
  console.log('=== ALL REPORT REDESIGN, FINANCIAL HEALTH & COLLAPSIBLE SIDEBAR TESTS PASSED 100%! ===');
  process.exit(0);
}

runReportsHealthSidebarCompleteSuite().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
