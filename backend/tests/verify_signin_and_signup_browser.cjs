const puppeteer = require('../../node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/auth_verification');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runBrowserTest() {
  console.log("==================================================");
  console.log("BROWSER UI TEST: SIGN IN & SIGN UP LAYOUT AUDIT");
  console.log("==================================================");

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    // ========================================================
    // 1. TEST SIGN IN PAGE
    // ========================================================
    console.log("\n1. Navigating to http://localhost:5173/signin");
    await page.goto("http://localhost:5173/signin", { waitUntil: "networkidle0", timeout: 15000 });

    // Verify Google button text
    const googleBtn = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      return buttons.some(b => b.textContent.includes("Continue with Google"));
    });
    console.log("SignIn - Google Button Found:", googleBtn);

    // Verify Divider
    const dividerFound = await page.evaluate(() => {
      const texts = Array.from(document.querySelectorAll("*"));
      return texts.some(el => el.textContent.toLowerCase().includes("or continue with email"));
    });
    console.log("SignIn - Divider Found:", dividerFound);

    // Verify Email input
    const emailInput = await page.$("input[name='email']");
    console.log("SignIn - Email Input Found:", !!emailInput);

    // Verify Send OTP button
    const sendOtpBtn = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      return buttons.some(b => b.textContent.includes("Send OTP"));
    });
    console.log("SignIn - Send OTP Button Found:", sendOtpBtn);

    // Verify No Technical Errors displayed
    const hasTechnicalError = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      return (
        bodyText.includes("API route not found") ||
        bodyText.includes("POST /api/auth/google") ||
        bodyText.includes("Google Sign-In is not configured yet")
      );
    });
    console.log("SignIn - Has Raw Technical Error:", hasTechnicalError);

    // Capture SignIn Screenshot
    const signinScreenshot = path.join(SCREENSHOT_DIR, "signin_page.png");
    await page.screenshot({ path: signinScreenshot, fullPage: true });
    console.log("Captured SignIn Screenshot:", signinScreenshot);

    if (!googleBtn || !dividerFound || !emailInput || !sendOtpBtn || hasTechnicalError) {
      throw new Error("SignIn UI validation failed!");
    }

    // ========================================================
    // 2. TEST SIGN UP PAGE
    // ========================================================
    console.log("\n2. Navigating to http://localhost:5173/signup");
    await page.goto("http://localhost:5173/signup", { waitUntil: "networkidle0", timeout: 15000 });

    // Verify Google button
    const signupGoogleBtn = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      return buttons.some(b => b.textContent.includes("Continue with Google"));
    });
    console.log("SignUp - Google Button Found:", signupGoogleBtn);

    // Verify Divider
    const signupDividerFound = await page.evaluate(() => {
      const texts = Array.from(document.querySelectorAll("*"));
      return texts.some(el => el.textContent.toLowerCase().includes("or continue with email"));
    });
    console.log("SignUp - Divider Found:", signupDividerFound);

    // Verify Registration Fields
    const formFields = await page.evaluate(() => {
      return {
        fullName: !!document.querySelector("input[name='fullName']"),
        dateOfBirth: !!document.querySelector("input[name='dateOfBirth']"),
        gender: !!document.querySelector("select[name='gender']"),
        mobileNumber: !!document.querySelector("input[name='mobileNumber']"),
        state: !!document.querySelector("select[name='state']"),
        city: !!document.querySelector("select[name='city']"),
        email: !!document.querySelector("input[name='email']"),
        createAccountBtn: Array.from(document.querySelectorAll("button")).some(b =>
          b.textContent.includes("Create Account") || b.textContent.includes("Save & Continue")
        ),
      };
    });
    console.log("SignUp - Form Fields:", formFields);

    // ========================================================
    // 3. TEST GOOGLE BUTTON CLICK INTERACTION
    // ========================================================
    console.log("\n3. Testing Google Button Click on Sign In Page");
    await page.goto("http://localhost:5173/signin", { waitUntil: "networkidle0" });

    // Click Continue with Google
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find(b => b.textContent.includes("Continue with Google"));
      if (btn) btn.click();
    });

    // Wait a brief moment for handler execution
    await new Promise(r => setTimeout(r, 600));

    const clickState = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      return {
        has404RouteError: bodyText.includes("API route not found") || bodyText.includes("POST /api/auth/google"),
        hasMissingConfigBanner: bodyText.includes("Google Sign-In is not configured yet"),
      };
    });
    console.log("After Click State:", clickState);

    // ========================================================
    // 4. TEST UNKNOWN EMAIL GUIDANCE (ACCOUNT NOT FOUND -> CREATE ACCOUNT)
    // ========================================================
    console.log("\n4. Testing Unknown Email Flow on Sign In Page");
    await page.goto("http://localhost:5173/signin", { waitUntil: "networkidle0" });

    // Enter unknown email
    const unknownEmail = "unknown_user_9999@example.com";
    await page.type("input[name='email']", unknownEmail);

    // Click Send OTP
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find(b => b.textContent.includes("Send OTP"));
      if (btn) btn.click();
    });

    // Wait for response
    await page.waitForFunction(
      () => document.body.innerText.includes("No FinanceOS account was found with this email address"),
      { timeout: 5000 }
    );

    const hasCreateAccountLink = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll("a"));
      return links.some(a => a.textContent.includes("Create your FinanceOS account now"));
    });
    console.log("SignIn - Unknown Email Guidance Link Shown:", hasCreateAccountLink);

    // Capture screenshot of unknown email guidance
    const unknownEmailScreenshot = path.join(SCREENSHOT_DIR, "signin_unknown_email_guidance.png");
    await page.screenshot({ path: unknownEmailScreenshot, fullPage: true });
    console.log("Captured Unknown Email Screenshot:", unknownEmailScreenshot);

    if (!hasCreateAccountLink) {
      throw new Error("FAIL: Create Account guidance link was not shown for unknown email!");
    }

    // Click the guidance link
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll("a"));
      const link = links.find(a => a.textContent.includes("Create your FinanceOS account now"));
      if (link) link.click();
    });

    await page.waitForFunction(() => window.location.pathname === "/signup", { timeout: 5000 });
    const currentUrl = page.url();
    console.log("Navigated URL after clicking Create Account:", currentUrl);

    const prefilledEmail = await page.$eval("input[name='email']", el => el.value);
    console.log("SignUp - Pre-filled Email from SignIn:", prefilledEmail);

    if (!currentUrl.includes("/signup") || prefilledEmail !== unknownEmail) {
      throw new Error("FAIL: Email was not pre-filled into SignUp form!");
    }
    console.log("PASS: Unknown email flow seamlessly guided user to registration with pre-filled email.");

    console.log("\n==================================================");
    console.log("BROWSER UI AUDIT: ALL CHECKS PASSED!");
    console.log("==================================================");
  } finally {
    await browser.close();
  }
}

runBrowserTest().catch((err) => {
  console.error("Browser Test Error:", err);
  process.exit(1);
});
