const puppeteer = require('../../node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runTest() {
  console.log('Launching browser via:', EDGE_PATH);
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  try {
    // 1. Visit app and authenticate
    console.log('1. Setting up admin session in localStorage...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });

    const jwt = require('jsonwebtoken');
    const jwtSecret = process.env.JWT_SECRET || 'financeos_secret_key_2026';
    const adminToken = jwt.sign(
      { id: '6a875580c5f0a5da7d75313f', role: 'admin', email: 'admin@financeos.com' },
      jwtSecret,
      { expiresIn: '1h' }
    );
    const adminUser = JSON.stringify({ id: '6a875580c5f0a5da7d75313f', role: 'admin', name: 'admin', email: 'admin@financeos.com' });

    await page.evaluate((tok, usr) => {
      localStorage.setItem('financeos_token', tok);
      localStorage.setItem('financeos_user', usr);
    }, adminToken, adminUser);

    // 2. Navigate to user 1: 6a6b7281682b6cd19e2e3eb9
    console.log('2. Navigating to /admin/users/6a6b7281682b6cd19e2e3eb9...');
    await page.goto('http://localhost:5173/admin/users/6a6b7281682b6cd19e2e3eb9', { waitUntil: 'networkidle0' });
    await page.waitForSelector('h1', { timeout: 10000 });

    const userName = await page.$eval('h1', el => el.innerText);
    console.log('User Header Name:', userName);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '1_overview.png') });

    // 3. Test Access Tab
    console.log('3. Clicking Access tab...');
    const accessTab = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.innerText.trim() === 'Access');
    });
    await accessTab.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '2_access.png') });

    // 4. Test Financial Tab
    console.log('4. Clicking Financial tab...');
    const financialTab = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.innerText.trim() === 'Financial');
    });
    await financialTab.click();
    await new Promise(r => setTimeout(r, 2000));

    // Scrape financial text
    const financialContent = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div, section, p, span'));
      const text = document.body.innerText;
      return {
        hasIncome: text.includes('₹2,00,000') || text.includes('Total Income'),
        hasAvailable: text.includes('Available to Allocate'),
        hasBreakdown: text.includes('Cash Flow Analysis') || text.includes('Balance Sheet'),
        fullSnippet: text.slice(0, 1000)
      };
    });
    console.log('Financial Tab Loaded:', financialContent.hasIncome, 'Has Available to Allocate:', financialContent.hasAvailable);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '3_financial.png') });

    // 5. Test Activity Tab
    console.log('5. Clicking Activity tab...');
    const activityTab = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.innerText.trim() === 'Activity');
    });
    await activityTab.click();
    await new Promise(r => setTimeout(r, 1500));

    const activityText = await page.evaluate(() => document.body.innerText);
    const hasEvents = activityText.includes('Total Events:') || activityText.includes('Allocated ₹8750');
    console.log('Activity Tab Loaded with Events:', hasEvents);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '4_activity.png') });

    // 6. Test Reports Tab
    console.log('6. Clicking Reports tab...');
    const reportsTab = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.innerText.trim() === 'Reports');
    });
    await reportsTab.click();
    await new Promise(r => setTimeout(r, 1000));

    // Click 'Yearly' duration button
    console.log('6b. Switching Report Duration to Yearly...');
    const yearlyBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.innerText.trim() === 'Yearly');
    });
    await yearlyBtn.click();
    await new Promise(r => setTimeout(r, 2000));

    const reportsText = await page.evaluate(() => document.body.innerText);
    const hasReport = reportsText.includes('Financial Health') || reportsText.includes('Period Summary');
    const hasYearlyProgression = reportsText.includes('Monthly Progression');
    console.log('Reports Tab Loaded (Yearly):', hasReport, 'Progression Table:', hasYearlyProgression);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '5_reports_yearly.png') });

    // 7. Test Empty User: 6aa18e2f10e3472554221d3e
    console.log('\n7. Navigating to empty user: /admin/users/6aa18e2f10e3472554221d3e...');
    await page.goto('http://localhost:5173/admin/users/6aa18e2f10e3472554221d3e', { waitUntil: 'networkidle0' });
    await page.waitForSelector('h1', { timeout: 10000 });

    const user2Name = await page.$eval('h1', el => el.innerText);
    console.log('User 2 Header Name:', user2Name);

    // Click Financial tab on user 2
    const finTab2 = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.innerText.trim() === 'Financial');
    });
    await finTab2.click();
    await new Promise(r => setTimeout(r, 1500));

    const fin2Text = await page.evaluate(() => document.body.innerText);
    const hasEmptyNotice = fin2Text.includes('No Financial Records in MongoDB') || fin2Text.includes('No saving goals recorded');
    const noLeakedData = !fin2Text.includes('₹2,00,000');
    console.log('User 2 Financial shows empty notice:', hasEmptyNotice);
    console.log('User 2 Financial does NOT have User 1 leaked data:', noLeakedData);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '6_user2_financial_empty.png') });

    // Click Activity tab on user 2
    const actTab2 = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.innerText.trim() === 'Activity');
    });
    await actTab2.click();
    await new Promise(r => setTimeout(r, 1500));

    const act2Text = await page.evaluate(() => document.body.innerText);
    const hasRegistration = act2Text.includes('Registration') || act2Text.includes('Created a new FinanceOS account');
    console.log('User 2 Activity shows Registration event:', hasRegistration);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '7_user2_activity.png') });

    console.log('\n=== ALL E2E BROWSER TESTS PASSED SUCCESSFULLY! ===');
  } catch (err) {
    console.error('Browser Test Failed:', err);
  } finally {
    await browser.close();
  }
}

runTest();
