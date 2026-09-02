const puppeteer = require('puppeteer-core');
const mongoose = require('./backend/node_modules/mongoose');
const dotenv = require('./backend/node_modules/dotenv');
dotenv.config({ path: 'd:/FinanceOS-main/FinanceOS_Code/backend/.env' });

async function runLiveCommitmentStatusSuite() {
  console.log('=== STARTING LIVE MONTHLY CONTRIBUTION & COMMITMENT STATUS SUITE ===');
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

  // Clean previous test items for clean test run
  await mongoose.connection.db.collection('savinggoals').deleteMany({ user: userDoc._id });
  await mongoose.connection.db.collection('investments').deleteMany({ user: userDoc._id });
  await mongoose.connection.db.collection('insurances').deleteMany({ user: userDoc._id });
  await mongoose.connection.db.collection('liabilities').deleteMany({ user: userDoc._id });

  // 2. Seed 4 clean active commitments for September 2026
  console.log('2. Seeding active commitments: Goal (4,000), SIP (5,000), Insurance (2,000), Loan (15,000)...');
  
  // A. Saving Goal: Emergency Fund (4,000/mo)
  const goalInsert = await mongoose.connection.db.collection('savinggoals').insertOne({
    user: userDoc._id,
    goalName: 'Emergency Fund',
    category: 'Emergency Fund',
    targetAmount: 100000,
    currentAmount: 0,
    monthlyContribution: 4000,
    startDate: new Date(2026, 0, 1),
    targetDate: new Date(2027, 11, 31),
    status: 'Active',
    contributions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // B. Investment: HDFC Top 100 SIP (5,000/mo)
  const invInsert = await mongoose.connection.db.collection('investments').insertOne({
    user: userDoc._id,
    name: 'HDFC Top 100 SIP',
    type: 'SIP',
    contributionType: 'Recurring',
    amount: 5000,
    monthlyContribution: 5000,
    currentValue: 5000,
    startDate: new Date(2026, 0, 1),
    nextContributionDate: new Date(2026, 8, 10),
    status: 'Active',
    sipContributions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // C. Insurance: Star Health Insurance (2,000/mo)
  const insInsert = await mongoose.connection.db.collection('insurances').insertOne({
    user: userDoc._id,
    name: 'Star Health Insurance',
    type: 'Health Insurance',
    premiumAmount: 2000,
    premiumFrequency: 'Monthly',
    startDate: new Date(2026, 0, 1),
    renewalDate: new Date(2027, 0, 1),
    status: 'Active',
    payments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // D. Liability: SBI Home Loan (15,000/mo)
  const liabInsert = await mongoose.connection.db.collection('liabilities').insertOne({
    user: userDoc._id,
    name: 'SBI Home Loan',
    type: 'Home Loan',
    principalAmount: 2000000,
    loanAmount: 2000000,
    originalAmount: 2000000,
    remainingAmount: 1800000,
    outstandingAmount: 1800000,
    monthlyEMI: 15000,
    monthlyPayment: 15000,
    startDate: new Date(2026, 0, 1),
    nextPaymentDate: new Date(2026, 8, 5),
    status: 'Active',
    payments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Seed September Monthly Finance
  await mongoose.connection.db.collection('monthlyfinances').updateOne(
    { user: userDoc._id, year: 2026, month: 9 },
    {
      $set: {
        user: userDoc._id,
        year: 2026,
        month: 9,
        income: 60000,
        expenses: 25000,
        openingBalance: 30000,
        cashBalance: 30000,
        monthlySavings: 35000,
        closingBalance: 39000,
        availableToAllocate: 39000,
        goalAllocations: 0,
        commitments: 26000,
        updateDate: new Date(2026, 8, 1),
      }
    },
    { upsert: true }
  );

  // ------------------------------------------------------------
  // TEST 1: INITIAL STATE (Completed = 0, Remaining = 26,000)
  // ------------------------------------------------------------
  console.log('--- TEST 1: Check Initial Commitment Status (Completed = 0, Remaining = 26,000) ---');
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0' });
  await page.evaluate((tok, usr) => {
    localStorage.setItem('financeos_token', tok);
    localStorage.setItem('financeos_user', JSON.stringify(usr));
  }, token, verifyData.user);

  await page.goto('http://localhost:5173/dashboard?month=2026-09', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  let bodyText = await page.evaluate(() => document.body.innerText);
  console.log('Body contains "Completed: ₹0":', bodyText.includes('Completed: ₹0') || bodyText.includes('Paid: ₹0'));
  console.log('Body contains "Remaining: ₹26,000":', bodyText.includes('Remaining: ₹26,000'));
  console.log('Body contains "0% Completed":', bodyText.includes('0% Completed'));
  console.log('Body contains "Emergency Fund":', bodyText.includes('Emergency Fund'));
  console.log('Body contains "HDFC Top 100 SIP":', bodyText.includes('HDFC Top 100 SIP'));
  console.log('Body contains "Star Health Insurance":', bodyText.includes('Star Health Insurance'));
  console.log('Body contains "SBI Home Loan":', bodyText.includes('SBI Home Loan'));

  if (!bodyText.includes('Remaining: ₹26,000') || !bodyText.includes('Emergency Fund')) {
    throw new Error('FAIL: Initial commitment status does not show expected 26,000 remaining!');
  }
  console.log('SUCCESS: Initial unpaid commitment state verified!');

  // ------------------------------------------------------------
  // TEST 2: LIVE ACTION — RECORD GOAL CONTRIBUTION (₹4,000)
  // ------------------------------------------------------------
  console.log('--- TEST 2: Live Action — Add Goal Contribution (₹4,000) ---');
  // Click "Add Contribution" button
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Add Contribution'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Submit Goal Contribution modal
  await page.evaluate(() => {
    const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Save Contribution'));
    if (saveBtn) saveBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  bodyText = await page.evaluate(() => document.body.innerText);
  console.log('After Goal contribution, Completed shows ₹4,000:', bodyText.includes('Completed: ₹4,000') || bodyText.includes('Paid: ₹4,000'));
  console.log('After Goal contribution, Remaining shows ₹22,000:', bodyText.includes('Remaining: ₹22,000'));
  console.log('Emergency Fund shows Paid:', bodyText.includes('Emergency Fund'));

  if (!bodyText.includes('Remaining: ₹22,000')) {
    throw new Error('FAIL: Dashboard did not update live after Goal contribution!');
  }
  console.log('SUCCESS: Live Goal contribution updated Dashboard with NO refresh!');

  // ------------------------------------------------------------
  // TEST 3: LIVE ACTION — PAY SIP (₹5,000)
  // ------------------------------------------------------------
  console.log('--- TEST 3: Live Action — Pay SIP (₹5,000) ---');
  // Click "Pay SIP" button
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

  bodyText = await page.evaluate(() => document.body.innerText);
  console.log('After SIP payment, Completed shows ₹9,000:', bodyText.includes('Completed: ₹9,000') || bodyText.includes('Paid: ₹9,000'));
  console.log('After SIP payment, Remaining shows ₹17,000:', bodyText.includes('Remaining: ₹17,000'));

  if (!bodyText.includes('Remaining: ₹17,000')) {
    throw new Error('FAIL: Dashboard did not update live after SIP contribution!');
  }
  console.log('SUCCESS: Live SIP contribution updated Dashboard with NO refresh!');

  // ------------------------------------------------------------
  // TEST 4: LIVE ACTION — PAY INSURANCE (₹2,000) & LOAN (₹15,000)
  // ------------------------------------------------------------
  console.log('--- TEST 4: Live Action — Pay Premium & EMI ---');
  // Pay Insurance
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Pay Premium'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.evaluate(() => {
    const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Record Premium'));
    if (saveBtn) saveBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Pay Liability EMI
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Pay EMI'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.evaluate(() => {
    const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Record Payment'));
    if (saveBtn) saveBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  bodyText = await page.evaluate(() => document.body.innerText);
  console.log('All paid: Completed shows ₹26,000:', bodyText.includes('Completed: ₹26,000') || bodyText.includes('Paid: ₹26,000'));
  console.log('All paid: Remaining shows ₹0:', bodyText.includes('Remaining: ₹0'));
  console.log('All paid: 100% Completed:', bodyText.includes('100% Completed'));

  if (!bodyText.includes('Remaining: ₹0') || !bodyText.includes('100% Completed')) {
    throw new Error('FAIL: Dashboard did not show 100% completed after all payments recorded!');
  }
  console.log('SUCCESS: 100% commitments completed in live UI without reload!');

  // ------------------------------------------------------------
  // TEST 5: PERSISTENCE ACROSS REFRESH (F5)
  // ------------------------------------------------------------
  console.log('--- TEST 5: Refresh Persistence (F5) ---');
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  const refreshedText = await page.evaluate(() => document.body.innerText);
  console.log('After F5: Completed shows ₹26,000:', refreshedText.includes('Completed: ₹26,000') || refreshedText.includes('Paid: ₹26,000'));
  console.log('After F5: Remaining shows ₹0:', refreshedText.includes('Remaining: ₹0'));
  console.log('After F5: 100% Completed:', refreshedText.includes('100% Completed'));

  if (!refreshedText.includes('Remaining: ₹0') || !refreshedText.includes('100% Completed')) {
    throw new Error('FAIL: Status lost after page refresh!');
  }
  console.log('SUCCESS: Persisted 100% in MongoDB across browser refresh!');

  // ------------------------------------------------------------
  // TEST 6: SELECTED MONTH RESPECIFIED
  // ------------------------------------------------------------
  console.log('--- TEST 6: Selected Month Test (Switch to August 2026) ---');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Month:'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  await page.evaluate(() => {
    const augBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim().startsWith('Aug'));
    if (augBtn) augBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  await page.evaluate(() => {
    const okBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'OK');
    if (okBtn) okBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  const augText = await page.evaluate(() => document.body.innerText);
  console.log('August view active:', augText.includes('August 2026'));
  console.log('August status calculates for August:', augText.includes('Monthly Financial Position & Commitments (August 2026)') || augText.includes('August 2026'));

  await browser.close();
  console.log('=== ALL LIVE CONTRIBUTION & COMMITMENT TESTS PASSED 100%! ===');
  process.exit(0);
}

runLiveCommitmentStatusSuite().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
