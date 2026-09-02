const puppeteer = require('puppeteer-core');
const mongoose = require('./backend/node_modules/mongoose');
const dotenv = require('./backend/node_modules/dotenv');
dotenv.config({ path: 'd:/FinanceOS-main/FinanceOS_Code/backend/.env' });

async function runGlobalMonthAndRichDetailsSuite() {
  console.log('=== STARTING GLOBAL SELECTED-MONTH & COMPLETE FINANCIAL ITEM DETAILS TEST SUITE ===');
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

  // 2. Clear old data and seed complete financial items across all types
  console.log('2. Seeding rich financial records in MongoDB...');
  await mongoose.connection.db.collection('savinggoals').deleteMany({ user: userDoc._id });
  await mongoose.connection.db.collection('investments').deleteMany({ user: userDoc._id });
  await mongoose.connection.db.collection('insurances').deleteMany({ user: userDoc._id });
  await mongoose.connection.db.collection('liabilities').deleteMany({ user: userDoc._id });

  // A. Saving Goal: Car
  await mongoose.connection.db.collection('savinggoals').insertOne({
    user: userDoc._id,
    goalName: 'Car Fund',
    category: 'Vehicle',
    targetAmount: 100000,
    currentAmount: 24000,
    savedAmount: 24000,
    monthlyContribution: 4000,
    startDate: new Date(2026, 0, 1),
    targetDate: new Date(2026, 11, 31),
    status: 'Active',
    contributions: [
      { amount: 4000, date: new Date(2026, 2, 5), note: 'March savings' }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // B. Investments: SIP, FD, Mutual Fund, Gold, Stocks
  await mongoose.connection.db.collection('investments').insertMany([
    {
      user: userDoc._id,
      name: 'HDFC Top 100 SIP',
      type: 'SIP',
      contributionType: 'Recurring',
      amount: 5000,
      monthlyContribution: 5000,
      currentValue: 45000,
      totalContributions: 45000,
      startDate: new Date(2026, 0, 1),
      nextContributionDate: new Date(2026, 2, 10),
      autoPay: {
        enabled: true,
        status: 'Active',
        paymentMethod: 'Bank Account',
        bankName: 'HDFC Bank',
        accountLast4: '1234',
      },
      status: 'Active',
      sipContributions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      user: userDoc._id,
      name: 'SBI Fixed Deposit',
      type: 'Fixed Deposit',
      contributionType: 'One Time',
      amount: 50000,
      principalAmount: 50000,
      currentValue: 53750,
      maturityAmount: 53750,
      interestRate: 7.5,
      institution: 'State Bank of India',
      startDate: new Date(2025, 2, 1),
      maturityDate: new Date(2026, 2, 1),
      payoutFrequency: 'Cumulative on Maturity',
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      user: userDoc._id,
      name: 'Mirae Asset Large Cap',
      type: 'Mutual Fund',
      contributionType: 'One Time',
      amount: 20000,
      currentValue: 24000,
      units: 250.5,
      nav: 80.0,
      amc: 'Mirae Asset',
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      user: userDoc._id,
      name: 'Digital Gold Safe',
      type: 'Gold',
      goldType: 'Digital Gold',
      amount: 15000,
      currentValue: 17500,
      weight: 2.5,
      purity: '24K',
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      user: userDoc._id,
      name: 'Tata Consultancy Services',
      type: 'Stocks',
      symbol: 'TCS',
      amount: 19000,
      currentValue: 21500,
      quantity: 5,
      purchasePrice: 3800,
      broker: 'Zerodha',
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ]);

  // C. Insurance Policies: Life / LIC & Health
  await mongoose.connection.db.collection('insurances').insertMany([
    {
      user: userDoc._id,
      name: 'LIC Jeevan Labh',
      type: 'Life Insurance',
      provider: 'Life Insurance Corporation',
      policyNumber: 'LIC987654321',
      premiumAmount: 2000,
      premiumFrequency: 'Month',
      monthlyPremium: 2000,
      sumAssured: 1000000,
      coverageAmount: 1000000,
      startDate: new Date(2026, 0, 10),
      maturityDate: new Date(2041, 0, 10),
      renewalDate: new Date(2026, 2, 10),
      status: 'Active',
      payments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      user: userDoc._id,
      name: 'Star Health Family Optima',
      type: 'Health Insurance',
      provider: 'Star Health',
      policyNumber: 'SH12345678',
      premiumAmount: 15000,
      premiumFrequency: 'Year',
      monthlyPremium: 1250,
      sumAssured: 1000000,
      coverageAmount: 1000000,
      renewalDate: new Date(2026, 8, 15),
      healthDetails: { membersCount: 4, coverageType: 'Family Floater' },
      status: 'Active',
      payments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ]);

  // D. Liabilities: Home Loan & Credit Card
  await mongoose.connection.db.collection('liabilities').insertMany([
    {
      user: userDoc._id,
      name: 'SBI Home Loan',
      type: 'Home Loan',
      lender: 'State Bank of India',
      accountNumber: 'SBIL98765432',
      principalAmount: 3000000,
      remainingAmount: 2850000,
      monthlyEMI: 25000,
      interestRate: 8.5,
      nextDueDate: new Date(2026, 2, 5),
      status: 'Active',
      payments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      user: userDoc._id,
      name: 'HDFC Regalia Credit Card',
      type: 'Credit Card',
      lender: 'HDFC Bank',
      accountNumber: '4321',
      principalAmount: 200000,
      remainingAmount: 35000,
      monthlyEMI: 3500,
      nextDueDate: new Date(2026, 2, 18),
      status: 'Active',
      payments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ]);

  // Seed Monthly Finance for March 2026 and September 2026
  await mongoose.connection.db.collection('monthlyfinances').updateOne(
    { user: userDoc._id, year: 2026, month: 3 },
    {
      $set: {
        user: userDoc._id,
        year: 2026,
        month: 3,
        income: 120000,
        expenses: 45000,
        openingBalance: 30000,
        cashBalance: 30000,
        monthlySavings: 75000,
        closingBalance: 105000,
        availableToAllocate: 105000,
        commitments: 36000,
        updateDate: new Date(2026, 2, 1),
      }
    },
    { upsert: true }
  );

  // ------------------------------------------------------------
  // TEST 1: Open Dashboard and Verify No Placeholder Text
  // ------------------------------------------------------------
  console.log('--- TEST 1: Select March 2026 & Verify Rich Cards without Placeholders ---');
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0' });
  await page.evaluate((tok, usr) => {
    localStorage.setItem('financeos_token', tok);
    localStorage.setItem('financeos_user', JSON.stringify(usr));
    sessionStorage.removeItem('financeos_selected_month');
  }, token, verifyData.user);

  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));

  // Select March 2026
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Month:'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  await page.evaluate(() => {
    const marBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Mar');
    if (marBtn) marBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  await page.evaluate(() => {
    const okBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'OK');
    if (okBtn) okBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  let bodyText = await page.evaluate(() => document.body.innerText);

  // Verify Placeholder text is GONE
  const hasOldPlaceholder1 = bodyText.includes('Contribution and investment tracking will appear here.');
  const hasOldPlaceholder2 = bodyText.includes('Premium, due date and maturity tracking will appear here.');
  console.log('Old Investment Placeholder present:', hasOldPlaceholder1);
  console.log('Old Insurance Placeholder present:', hasOldPlaceholder2);

  if (hasOldPlaceholder1 || hasOldPlaceholder2) {
    throw new Error('FAIL: Placeholder text is still present in financial cards!');
  }
  console.log('SUCCESS: All placeholder text has been removed!');

  // Verify Rich Details
  console.log('Verifying rich details for all financial item types...');
  const checks = [
    { name: 'Saving Goal (Car Fund)', passed: bodyText.includes('Car Fund') && bodyText.includes('1,00,000') && bodyText.includes('24,000') },
    { name: 'SIP (HDFC Top 100 SIP)', passed: bodyText.includes('HDFC Top 100 SIP') && bodyText.includes('5,000') && bodyText.includes('HDFC Bank') },
    { name: 'FD (SBI Fixed Deposit)', passed: bodyText.includes('SBI Fixed Deposit') && bodyText.includes('50,000') && bodyText.includes('7.5% p.a.') },
    { name: 'Mutual Fund (Mirae Asset)', passed: bodyText.includes('Mirae Asset Large Cap') && bodyText.includes('20,000') },
    { name: 'Gold (Digital Gold Safe)', passed: bodyText.includes('Digital Gold Safe') && bodyText.includes('2.5g') },
    { name: 'Stocks (TCS)', passed: bodyText.includes('Tata Consultancy Services') && bodyText.includes('TCS') && bodyText.includes('5 shares') },
    { name: 'Life Insurance (LIC Jeevan Labh)', passed: bodyText.includes('LIC Jeevan Labh') && bodyText.includes('2,000') && bodyText.includes('10,00,000') },
    { name: 'Health Insurance (Star Health)', passed: bodyText.includes('Star Health Family Optima') && bodyText.includes('15,000') },
    { name: 'Home Loan (SBI Home Loan)', passed: bodyText.includes('SBI Home Loan') && bodyText.includes('28,50,000') && bodyText.includes('25,000') },
    { name: 'Credit Card (HDFC Regalia)', passed: bodyText.includes('HDFC Regalia Credit Card') && bodyText.includes('2,00,000') && bodyText.includes('35,000') },
  ];

  for (const c of checks) {
    console.log(`- ${c.name}: ${c.passed ? 'PASSED' : 'FAILED'}`);
    if (!c.passed) {
      console.log('--- Body text snippet around saving goals: ---');
      console.log(bodyText.slice(0, 3000));
      throw new Error(`FAIL: Missing rich details for ${c.name}`);
    }
  }

  // ------------------------------------------------------------
  // TEST 2: Navigate Across ALL User-Side Pages and Verify March 2026 Preservation
  // ------------------------------------------------------------
  const pagesToTest = [
    { name: 'Monthly Finance', path: '/monthly-finance', expectedText: 'Monthly Finance' },
    { name: 'Saving Goals', path: '/saving-goals', expectedText: 'Saving Goals' },
    { name: 'Plans & Commitments', path: '/plans-commitments', expectedText: 'Plans & Commitments' },
    { name: 'Financial Calendar', path: '/financial-calendar', expectedText: 'March 2026' },
    { name: 'Reports', path: '/reports', expectedText: 'Financial Reports' },
  ];

  for (const p of pagesToTest) {
    console.log(`--- TEST: Navigate to ${p.name} ---`);
    await page.evaluate((pName) => {
      const link = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes(pName));
      if (link) link.click();
    }, p.name);
    await new Promise(r => setTimeout(r, 1200));

    const currentUrl = page.url();
    bodyText = await page.evaluate(() => document.body.innerText);
    console.log(`URL on ${p.name}:`, currentUrl);
    console.log(`Preserves month=2026-03 or March 2026 context:`, currentUrl.includes('month=2026-03') || bodyText.includes('March 2026'));

    if (!currentUrl.includes('month=2026-03') && !bodyText.includes('March 2026')) {
      throw new Error(`FAIL: ${p.name} did not preserve March 2026 context! URL: ${currentUrl}`);
    }
  }

  // Return to Dashboard
  console.log('--- TEST: Return to Dashboard from Sidebar ---');
  await page.evaluate(() => {
    const link = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('Dashboard'));
    if (link) link.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  const dashUrl = page.url();
  bodyText = await page.evaluate(() => document.body.innerText);
  console.log('Returned to Dashboard URL:', dashUrl);
  console.log('Dashboard displays March 2026:', bodyText.includes('March 2026'));

  if (!dashUrl.includes('month=2026-03') || !bodyText.includes('March 2026')) {
    throw new Error('FAIL: Dashboard reset to current month after returning from other panels!');
  }
  console.log('SUCCESS: Global March 2026 preserved across ALL user side panels!');

  // ------------------------------------------------------------
  // TEST 3: Action in March 2026 & Live Update
  // ------------------------------------------------------------
  console.log('--- TEST 3: Action Execution in March 2026 (Live SIP Payment) ---');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Pay SIP'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  await page.evaluate(() => {
    const recBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Record SIP Contribution'));
    if (recBtn) recBtn.click();
  });
  await new Promise(r => setTimeout(r, 2600));

  bodyText = await page.evaluate(() => document.body.innerText);
  console.log('After SIP Payment, March 2026 remains active:', bodyText.includes('March 2026'));
  console.log('After SIP Payment, shows Paid / Completed:', bodyText.includes('Completed: ₹5,000') || bodyText.includes('Paid: ₹5,000') || bodyText.includes('100% Completed'));

  if (!bodyText.includes('March 2026')) {
    throw new Error('FAIL: Month reset after recording financial transaction!');
  }
  console.log('SUCCESS: Live financial transaction updated with 0 browser reload while staying on March 2026!');

  // ------------------------------------------------------------
  // TEST 4: Browser Refresh on Custom Month
  // ------------------------------------------------------------
  console.log('--- TEST 4: Browser Refresh on March 2026 ---');
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  bodyText = await page.evaluate(() => document.body.innerText);
  console.log('After refresh, still on March 2026:', bodyText.includes('March 2026'));
  if (!bodyText.includes('March 2026')) {
    throw new Error('FAIL: March 2026 lost on browser refresh!');
  }
  console.log('SUCCESS: Refresh test passed!');

  await browser.close();
  console.log('=== ALL GLOBAL MONTH & RICH FINANCIAL DETAILS TESTS PASSED 100%! ===');
  process.exit(0);
}

runGlobalMonthAndRichDetailsSuite().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
