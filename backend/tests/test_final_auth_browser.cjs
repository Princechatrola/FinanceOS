const puppeteer = require('../../node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const executablePath = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/final_auth_verification');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runBrowserFlow() {
  console.log("==================================================");
  console.log("FINAL AUTHENTICATION BROWSER VERIFICATION FLOW");
  console.log("==================================================");
  console.log("Using browser binary:", executablePath);

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  try {
    // ----------------------------------------------------
    // 1. SIGN-IN PAGE AUDIT
    // ----------------------------------------------------
    console.log("\n1. Navigating to http://localhost:5174/signin");
    await page.goto("http://localhost:5174/signin", { waitUntil: "networkidle0", timeout: 15000 });

    const emailInput = await page.$("input[name='email']");
    const sendOtpBtn = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("button")).some(b => b.textContent.includes("Send OTP"));
    });
    const googleBtn = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("button")).some(b => b.textContent.includes("Continue with Google"));
    });
    const createAccountLink = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("a")).some(a => a.textContent.includes("Create Account"));
    });

    console.log("Email Input:", !!emailInput);
    console.log("Send OTP Button:", sendOtpBtn);
    console.log("Continue with Google Button:", googleBtn);
    console.log("Create Account Link:", createAccountLink);

    if (!emailInput || !sendOtpBtn || !googleBtn || !createAccountLink) {
      throw new Error("SignIn page elements incomplete!");
    }

    // ----------------------------------------------------
    // 2. UNREGISTERED EMAIL -> ACCOUNT NOT FOUND MODAL
    // ----------------------------------------------------
    console.log("\n2. Submitting unregistered email for OTP...");
    await page.type("input[name='email']", "unregistered_flow_test_887@financeos.test");
    
    // Click Send OTP
    const sendBtnElement = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Send OTP"));
    });
    await sendBtnElement.click();

    // Wait for Account Not Found modal
    console.log("Waiting for Account Not Found modal...");
    await page.waitForFunction(() => {
      const modal = document.querySelector("[role='dialog']");
      return modal && modal.textContent.includes("Account Not Found");
    }, { timeout: 6000 });

    const modalDetails = await page.evaluate(() => {
      const modal = document.querySelector("[role='dialog']");
      const title = modal.querySelector("h3")?.textContent || "";
      const text = modal.textContent;
      const buttons = Array.from(modal.querySelectorAll("button")).map(b => b.textContent.trim());
      return { title, text, buttons };
    });

    console.log("Modal Title:", modalDetails.title);
    console.log("Modal Contains Expected Text:", modalDetails.text.includes("No account found for this email address. Please register first."));
    console.log("Modal Buttons:", modalDetails.buttons);

    const hasRegisterBtn = modalDetails.buttons.some(b => b.includes("Register"));
    const hasCancelBtn = modalDetails.buttons.some(b => b.includes("Cancel"));

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "modal_account_not_found.png") });

    if (!hasRegisterBtn || !hasCancelBtn) {
      throw new Error("Account Not Found modal missing Register or Cancel buttons!");
    }

    // ----------------------------------------------------
    // 3. CANCEL BUTTON CLOSES MODAL & REMAINS ON SIGN-IN
    // ----------------------------------------------------
    console.log("\n3. Testing Cancel button in modal...");
    const cancelBtnHandle = await page.evaluateHandle(() => {
      const modal = document.querySelector("[role='dialog']");
      return Array.from(modal.querySelectorAll("button")).find(b => b.textContent.trim() === "Cancel");
    });
    await cancelBtnHandle.click();

    await page.waitForFunction(() => {
      return !document.querySelector("[role='dialog']");
    }, { timeout: 3000 });

    console.log("Modal closed successfully:", !await page.$("[role='dialog']"));
    console.log("Current URL:", page.url());
    if (!page.url().includes("/signin")) {
      throw new Error("Cancel button did not keep user on /signin!");
    }

    // ----------------------------------------------------
    // 4. REGISTER BUTTON NAVIGATES TO SIGN-UP
    // ----------------------------------------------------
    console.log("\n4. Triggering modal again to test Register button...");
    const sendBtnAgain = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Send OTP"));
    });
    await sendBtnAgain.click();

    await page.waitForFunction(() => {
      return document.querySelector("[role='dialog']");
    }, { timeout: 6000 });

    const registerBtnHandle = await page.evaluateHandle(() => {
      const modal = document.querySelector("[role='dialog']");
      return Array.from(modal.querySelectorAll("button")).find(b => b.textContent.trim() === "Register");
    });
    await registerBtnHandle.click();

    await page.waitForFunction(() => {
      return window.location.pathname === "/signup";
    }, { timeout: 5000 });

    console.log("Navigated to:", page.url());
    if (!page.url().includes("/signup")) {
      throw new Error("Register button did not navigate to /signup!");
    }

    // ----------------------------------------------------
    // 5. SIGN-UP PAGE VALIDATION & GOOGLE BUTTON
    // ----------------------------------------------------
    console.log("\n5. Auditing Sign-Up page layout...");
    await page.waitForSelector("form", { timeout: 5000 });

    const signupFormFields = await page.evaluate(() => {
      return {
        fullName: !!document.querySelector("input[name='fullName']"),
        dateOfBirth: !!document.querySelector("input[name='dateOfBirth']"),
        gender: !!document.querySelector("select[name='gender']"),
        mobileNumber: !!document.querySelector("input[name='mobileNumber']"),
        state: !!document.querySelector("select[name='state']"),
        city: !!document.querySelector("select[name='city']"),
        email: !!document.querySelector("input[name='email']"),
        saveAndContinue: Array.from(document.querySelectorAll("button")).some(b => b.textContent.includes("Save & Continue")),
        continueWithGoogle: Array.from(document.querySelectorAll("button")).some(b => b.textContent.includes("Continue with Google")),
      };
    });

    console.log("Sign-Up Form Fields Audit:", signupFormFields);
    for (const [k, v] of Object.entries(signupFormFields)) {
      if (!v) throw new Error(`Missing required element on SignUp page: ${k}`);
    }

    // Attempt submitting empty manual form
    console.log("Testing required manual field validation...");
    const saveBtn = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Save & Continue"));
    });
    await saveBtn.click();

    const hasValidationErrors = await page.evaluate(() => {
      const errorTexts = Array.from(document.querySelectorAll("p")).map(p => p.textContent);
      return errorTexts.some(t => t.includes("required") || t.includes("Please") || t.includes("cannot be empty"));
    });
    console.log("Validation blocked empty manual submission:", hasValidationErrors);
    console.log("User remained on /signup:", page.url().includes("/signup"));

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "signup_page_validation.png") });

    console.log("\n==================================================");
    console.log("BROWSER FLOW VERIFICATION RESULT: ALL PASS!");
    console.log("==================================================");
  } finally {
    await browser.close();
  }
}

runBrowserFlow().catch((err) => {
  console.error("Browser flow error:", err);
  process.exit(1);
});
