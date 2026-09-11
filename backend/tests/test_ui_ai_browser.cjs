const puppeteer = require('../../node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/ai_verification');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runBrowserVerification() {
  console.log('=== FINANCEOS AI ADVISER FRONTEND UI VERIFICATION ===');
  
  await mongoose.connect('mongodb://127.0.0.1:27017/financeos');
  const User = mongoose.model('User', new mongoose.Schema({
    email: String,
    role: String,
    name: String,
    userId: String,
  }));
  
  let user = await User.findOne({ email: 'dip@test.com' });
  if (!user) {
    user = await User.findOne({ role: 'user' });
  }
  
  console.log(`Using user: ${user.email} (ID: ${user._id})`);
  
  const token = jwt.sign(
    { id: user._id.toString(), role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );
  
  const userPayload = JSON.stringify({
    id: user._id.toString(),
    _id: user._id.toString(),
    role: user.role,
    name: user.name || 'Dip Jivrajani',
    email: user.email,
  });

  console.log('Launching browser via:', EDGE_PATH);
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,960'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960 });

  try {
    // 1. Authenticate via localStorage
    console.log('1. Setting auth credentials in localStorage...');
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
    await page.evaluate((tok, usr) => {
      localStorage.setItem('financeos_token', tok);
      localStorage.setItem('financeos_user', usr);
    }, token, userPayload);

    // 2. Visit Dashboard
    console.log('2. Navigating to Dashboard (http://localhost:5173/dashboard)...');
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2500));

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_dashboard_loaded.png') });
    console.log('Screenshot saved: 01_dashboard_loaded.png');

    // 3. Look for AI Suggestion Header Button or Card
    console.log('3. Checking AI Suggestions section on Dashboard...');
    const hasAiButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const refreshBtn = buttons.find(b => b.innerText.includes('Refresh AI') || b.innerText.includes('AI Suggestion') || b.innerText.includes('Refresh Analysis'));
      return !!refreshBtn;
    });
    console.log('Dashboard has AI refresh/suggestion button:', hasAiButton);

    // Click Refresh AI Suggestion button
    console.log('4. Clicking "Refresh AI Suggestion" button on Dashboard...');
    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.innerText.includes('Refresh AI') || b.innerText.includes('Get AI Suggestion') || b.innerText.includes('Refresh Analysis'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    if (clicked) {
      console.log('Waiting for AI analysis generation and modal display...');
      // Wait for modal or response
      await new Promise(r => setTimeout(r, 6000));
      const dashModalShot = path.join(SCREENSHOT_DIR, '02_ai_modal_or_result.png');
      await page.screenshot({ path: dashModalShot });
      console.log('Screenshot saved: 02_ai_modal_or_result.png');

      // Check modal contents
      const modalText = await page.evaluate(() => document.body.innerText);
      const hasGoldData = modalText.includes('/ gram') || modalText.includes('24K') || modalText.includes('Gold');
      const hasSilverData = modalText.includes('Silver') || modalText.includes('₹');
      const hasEquitiesData = modalText.includes('Nifty') || modalText.includes('Equities');
      const hasFDData = modalText.includes('Fixed Deposit') || modalText.includes('Bank FD') || modalText.includes('Card Rates');
      const hasOutlook = modalText.includes('Future Outlook') || modalText.includes('Base Case') || modalText.includes('Scenario');
      const hasDisclaimer = modalText.includes('Invest at your own risk — market prices and conditions can change, and values may increase or decrease.');

      console.log('Dashboard Modal Verification:');
      console.log('  - Gold Market Data present:', hasGoldData);
      console.log('  - Silver Market Data present:', hasSilverData);
      console.log('  - Equities / Nifty 50 present:', hasEquitiesData);
      console.log('  - Fixed Deposit rates present:', hasFDData);
      console.log('  - Future Outlook present:', hasOutlook);
      console.log('  - Mandatory Risk Disclaimer present:', hasDisclaimer);
    }

    // 5. Navigate to Plans & Commitments
    console.log('5. Navigating to Plans & Commitments (http://localhost:5173/plans-commitments)...');
    await page.goto('http://localhost:5173/plans-commitments', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2500));

    const plansShot = path.join(SCREENSHOT_DIR, '03_plans_commitments.png');
    await page.screenshot({ path: plansShot });
    console.log('Screenshot saved: 03_plans_commitments.png');

    // Check for "Re-analyze" or "Get AI Suggestion" button on Plans page
    const plansAiButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => 
        b.innerText.includes('Get AI Suggestion') || 
        b.innerText.includes('Re-analyze') || 
        b.innerText.includes('AI Suggestions')
      );
      return btn ? btn.innerText.trim() : null;
    });
    console.log('Plans page AI button text:', plansAiButton);

    // Click it to trigger fresh analysis
    if (plansAiButton) {
      console.log(`6. Triggering fresh analysis on Plans page using: "${plansAiButton}"...`);
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => 
          b.innerText.includes('Get AI Suggestion') || 
          b.innerText.includes('Re-analyze') || 
          b.innerText.includes('AI Suggestions')
        );
        if (btn) btn.click();
      });

      await new Promise(r => setTimeout(r, 6000));
      const plansRefreshShot = path.join(SCREENSHOT_DIR, '04_plans_after_refresh.png');
      await page.screenshot({ path: plansRefreshShot });
      console.log('Screenshot saved: 04_plans_after_refresh.png');

      const plansModalText = await page.evaluate(() => document.body.innerText);
      const hasFreshData = plansModalText.includes('Deploy') || plansModalText.includes('Verified External Market Benchmarks') || plansModalText.includes('Gold');
      const hasPlansOutlook = plansModalText.includes('Future Outlook') || plansModalText.includes('Base Case') || plansModalText.includes('Bull Case');
      const hasPlansDisclaimer = plansModalText.includes('Invest at your own risk — market prices and conditions can change, and values may increase or decrease.');

      console.log('Plans Page Verification:');
      console.log('  - Fresh verified data present:', hasFreshData);
      console.log('  - Future Outlook present:', hasPlansOutlook);
      console.log('  - Mandatory Risk Disclaimer present:', hasPlansDisclaimer);
    }

    // Copy screenshots to Artifacts Directory
    const ARTIFACT_DIR = "C:\\Users\\dipji\\.gemini\\antigravity-ide\\brain\\09807129-9254-41c1-aac8-7aea2184900a";
    if (fs.existsSync(ARTIFACT_DIR)) {
      const files = ['01_dashboard_loaded.png', '02_ai_modal_or_result.png', '03_plans_commitments.png', '04_plans_after_refresh.png'];
      for (const file of files) {
        const src = path.join(SCREENSHOT_DIR, file);
        const dst = path.join(ARTIFACT_DIR, file);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dst);
          console.log(`Copied ${file} to artifact directory.`);
        }
      }
    }

    console.log('=== BROWSER UI VERIFICATION COMPLETED SUCCESSFULLY ===');
  } catch (err) {
    console.error('Browser verification error:', err);
    throw err;
  } finally {
    await browser.close();
    await mongoose.disconnect();
  }
}

runBrowserVerification().catch(err => {
  console.error(err);
  process.exit(1);
});
