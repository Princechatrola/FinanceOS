// ============================================================
// FINANCEOS - EMAIL DELIVERABILITY & PRODUCTION AUDIT TEST SUITE
// ============================================================

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const jwt = require("jsonwebtoken");
const tls = require("tls");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const BASE_URL = "http://localhost:5000";
const JWT_SECRET = process.env.JWT_SECRET || "financeos_jwt_secret_key_prod_2026";

function createToken(user, role = "user") {
  return jwt.sign(
    {
      id: user._id,
      userId: user.userId,
      email: user.email,
      role: role,
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
}

let passedCount = 0;
let totalCount = 0;

function assert(condition, message) {
  totalCount++;
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedCount++;
  console.log(`[PASS] ${message}`);
}

// IMAP helper to search and fetch message from recipient mailbox
function verifyMailboxArrival(subjectTimestamp) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(993, "imap.gmail.com", { rejectUnauthorized: false }, () => {});
    let buffer = "";
    let step = "INIT";
    let found = false;

    socket.on("data", (d) => {
      buffer += d.toString();

      if (step === "INIT" && buffer.includes("* OK")) {
        step = "LOGIN";
        buffer = "";
        const cleanPass = (process.env.EMAIL_PASSWORD || "").replace(/\s+/g, "");
        socket.write(`a1 LOGIN "${process.env.EMAIL_USER}" "${cleanPass}"\r\n`);
      } else if (step === "LOGIN" && buffer.includes("a1 OK")) {
        step = "SELECT";
        buffer = "";
        socket.write("a2 SELECT INBOX\r\n");
      } else if (step === "SELECT" && buffer.includes("a2 OK")) {
        step = "SEARCH";
        buffer = "";
        socket.write(`a3 SEARCH SUBJECT "${subjectTimestamp}"\r\n`);
      } else if (step === "SEARCH" && buffer.includes("a3 OK")) {
        const match = buffer.match(/\*\s+SEARCH\s+([\d\s]+)/);
        const ids = match && match[1] ? match[1].trim().split(/\s+/).filter(Boolean) : [];
        if (ids.length > 0) {
          const id = ids[ids.length - 1];
          step = "FETCH";
          buffer = "";
          socket.write(`a4 FETCH ${id} (BODY[HEADER.FIELDS (SUBJECT FROM TO DATE)] BODY[TEXT])\r\n`);
        } else {
          socket.write("a5 LOGOUT\r\n");
          socket.end();
          resolve({ found: false });
        }
      } else if (step === "FETCH" && buffer.includes("a4 OK")) {
        found = true;
        const details = buffer.trim();
        socket.write("a5 LOGOUT\r\n");
        socket.end();
        resolve({ found: true, details });
      }
    });

    socket.on("error", (err) => {
      console.error("IMAP error:", err.message);
      reject(err);
    });

    setTimeout(() => {
      socket.end();
      resolve({ found: false, timeout: true });
    }, 15000);
  });
}

async function runAudit() {
  console.log("=== FINANCEOS EMAIL DELIVERABILITY & AUDIT ===");

  await mongoose.connect(process.env.MONGO_URI);
  const User = require("../models/User");
  const Message = require("../models/Message");
  const { isDeliverableEmail, maskEmail, transporter } = require("../utils/emailService");

  // 1. Verify SMTP Configuration
  console.log("\n--- SECTION 1: SMTP CONFIGURATION & SECURITY ---");
  assert(Boolean(process.env.EMAIL_USER), "EMAIL_USER is configured");
  assert(Boolean(process.env.EMAIL_PASSWORD), "EMAIL_PASSWORD is configured");
  assert(transporter.options.host === "smtp.gmail.com", "Transporter host is smtp.gmail.com");
  assert(transporter.options.port === 465, "Transporter port is 465");
  assert(transporter.options.secure === true, "Transporter uses direct SSL (secure: true)");
  assert(transporter.options.pool === true, "Transporter uses connection pooling");

  // Verify safe email masking
  const masked = maskEmail("dipjivrajani@gmail.com");
  assert(masked.startsWith("d") && masked.endsWith("@gmail.com") && masked.includes("***"), "maskEmail formats correctly");

  // 2. Deliverability Validation Rules
  console.log("\n--- SECTION 2: EMAIL DELIVERABILITY VALIDATOR ---");
  assert(isDeliverableEmail("dipjivrajani@gmail.com") === true, "Real gmail address is deliverable");
  assert(isDeliverableEmail("financeos.system@gmail.com") === true, "System gmail address is deliverable");
  assert(isDeliverableEmail("dip.svgu.38@gmail.com") === true, "Corrected SVGU email is deliverable");
  assert(isDeliverableEmail("dip@test.com") === false, "Mock domain test.com is rejected");
  assert(isDeliverableEmail("user@example.com") === false, "Mock domain example.com is rejected");
  assert(isDeliverableEmail("user@financeos-test.com") === false, "Mock domain financeos-test.com is rejected");
  assert(isDeliverableEmail("dip.svgu.38@gmail.com.com") === false, "Typo domain .com.com is rejected");
  assert(isDeliverableEmail("123@gm.c") === false, "Incomplete TLD gm.c is rejected");
  assert(isDeliverableEmail("") === false, "Empty email is rejected");

  // 3. User Setup
  console.log("\n--- SECTION 3: DATABASE USERS & CREDENTIALS ---");
  const admin = await User.findOne({ role: "admin" });
  assert(admin, "Admin account exists in MongoDB");
  const adminToken = createToken(admin, "admin");

  // Locate real Gmail user and mock user in DB
  const realGmailUser = await User.findOne({ email: "dipjivrajani@gmail.com" });
  assert(realGmailUser, "User with real Gmail (dipjivrajani@gmail.com) exists");

  const mockUser = await User.findOne({ email: "dip@test.com" });
  assert(mockUser, "User with mock email (dip@test.com) exists for bounce/rejection test");

  const otherUser = await User.findOne({ userId: "FOS-U-000003" }) || await User.findOne({ role: "user", _id: { $ne: realGmailUser._id } });
  assert(otherUser, "Second regular user exists for isolation testing");

  // 4. Save-First & Real Delivery Test (Gmail Recipient)
  console.log("\n--- SECTION 4: SAVE-FIRST & REAL DISPATCH TO GMAIL ---");
  const uniqueTimestamp = Date.now();
  const testSubject = `FinanceOS Email Delivery Test - ${uniqueTimestamp}`;
  const testMessage = `Hello Dip,\n\nThis is a verified delivery test sent at ${new Date().toISOString()}.\n\nRegards,\nFinanceOS Admin`;

  const payloadReal = {
    title: testSubject,
    subject: testSubject,
    message: testMessage,
    recipient: realGmailUser.name,
    userId: realGmailUser.userId || String(realGmailUser._id),
    recipientEmail: realGmailUser.email,
    type: "Personal",
    audienceType: "Personal",
    channels: ["In-App", "Email"],
    delivery: "Now",
    status: "Sent",
    createdBy: "Super Admin",
  };

  const resSend = await fetch(`${BASE_URL}/api/admin/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify(payloadReal),
  });
  const dataSend = await resSend.json();

  assert(resSend.status === 201, "API returns HTTP 201 Created");
  assert(dataSend.success === true, "API response success is true");
  assert(dataSend.data, "Message data object returned");
  assert(dataSend.data.deliveryStatus["In-App"] === "Sent", "In-App delivery status is Sent");
  assert(dataSend.data.deliveryStatus["Email"] === "Sent", "Email delivery status is Sent (SMTP Accepted)");
  assert(dataSend.data.status === "Sent", "Overall status is Sent");

  const msgInDb = await Message.findById(dataSend.data._id || dataSend.data.id);
  assert(msgInDb, "Message document was saved to MongoDB");
  assert(msgInDb.deliveryStatus.get("Email") === "Sent", "MongoDB persisted Email deliveryStatus as Sent");
  console.log(`[SMTP ACCEPTED] Message ${msgInDb._id} dispatched with SMTP status: Sent`);

  // 5. Real Mailbox Delivery & IMAP Verification
  console.log("\n--- SECTION 5: REAL MAILBOX VERIFICATION (IMAP PROBE) ---");
  // Target the exact mailbox account that IMAP is authenticated to inspect
  const systemUser = await User.findOne({ email: process.env.EMAIL_USER });
  assert(systemUser, "System user corresponding to EMAIL_USER exists in MongoDB");

  const adminTestTimestamp = `IMAP-${Date.now()}`;
  const adminTestSubject = `FinanceOS Email Delivery Test - ${adminTestTimestamp}`;
  const payloadAdminSelf = {
    title: adminTestSubject,
    subject: adminTestSubject,
    message: "Automated end-to-end IMAP mailbox reception verification test.",
    recipient: systemUser.name,
    userId: systemUser.userId || String(systemUser._id),
    recipientEmail: systemUser.email,
    type: "Personal",
    audienceType: "Personal",
    channels: ["Email"],
    delivery: "Now",
    status: "Sent",
    createdBy: "Super Admin",
  };

  const resSelf = await fetch(`${BASE_URL}/api/admin/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify(payloadAdminSelf),
  });
  const dataSelf = await resSelf.json();
  assert(resSelf.status === 201, "Self-send API returns HTTP 201");
  assert(dataSelf.data.deliveryStatus["Email"] === "Sent", "SMTP Accepted for system recipient");

  console.log("Waiting 3 seconds for Google Mail delivery to inbox...");
  await new Promise((r) => setTimeout(r, 3000));

  const imapResult = await verifyMailboxArrival(adminTestTimestamp);
  assert(imapResult.found === true, "Email arrived in actual recipient mailbox (Verified via IMAP on port 993)");
  console.log("[REAL MAILBOX VERIFIED] Email successfully received in external Gmail Inbox!");

  // 6. Controlled Bounce / Invalid Domain Test
  console.log("\n--- SECTION 6: CONTROLLED BOUNCE & MOCK DOMAIN REJECTION ---");
  const payloadMock = {
    title: `Mock Domain Test - ${Date.now()}`,
    subject: `Mock Domain Test - ${Date.now()}`,
    message: "This message should be rejected by the email deliverability filter.",
    recipient: mockUser.name,
    userId: mockUser.userId || String(mockUser._id),
    recipientEmail: mockUser.email, // dip@test.com
    type: "Personal",
    audienceType: "Personal",
    channels: ["In-App", "Email"],
    delivery: "Now",
    status: "Sent",
    createdBy: "Super Admin",
  };

  const resMock = await fetch(`${BASE_URL}/api/admin/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify(payloadMock),
  });
  const dataMock = await resMock.json();

  assert(resMock.status === 201, "Message created in DB for audit trail");
  assert(dataMock.data.deliveryStatus["In-App"] === "Sent", "In-App delivery succeeded");
  assert(dataMock.data.deliveryStatus["Email"] === "Failed", "Email deliveryStatus is Failed for mock domain");
  assert(dataMock.data.status === "Partially Delivered", "Overall status is truthfully Partially Delivered, NOT Sent");

  const mockDbRecord = await Message.findById(dataMock.data._id || dataMock.data.id);
  assert(mockDbRecord.deliveryStatus.get("Email") === "Failed", "MongoDB persists Email deliveryStatus as Failed for mock domain");
  console.log("[BOUNCE TEST PASS] System correctly identified undeliverable domain and set deliveryStatus.Email = Failed without silent false success.");

  // 7. Duplicate Send Prevention (Same second / fast submit)
  console.log("\n--- SECTION 7: DUPLICATE DISPATCH & IDEMPOTENCY ---");
  const beforeCount = await Message.countDocuments({ title: testSubject });
  assert(beforeCount === 1, "Exactly one message document created for original test dispatch (No duplicate sends)");

  // 8. Scheduled Message Validations
  console.log("\n--- SECTION 8: SCHEDULED MESSAGE VALIDATIONS ---");
  // 8A: Future date succeeds
  const futureDate = new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0];
  const schedPayload = {
    title: "Future Scheduled Message",
    subject: "Future Scheduled Message",
    message: "Scheduled for 2 days in the future.",
    recipient: realGmailUser.name,
    userId: realGmailUser.userId || String(realGmailUser._id),
    recipientEmail: realGmailUser.email,
    type: "Personal",
    audienceType: "Personal",
    channels: ["Email"],
    delivery: "Schedule",
    scheduleDate: futureDate,
    scheduleTime: "10:00",
    status: "Scheduled",
  };
  const resSched = await fetch(`${BASE_URL}/api/admin/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify(schedPayload),
  });
  const dataSched = await resSched.json();
  assert(resSched.status === 201, "Future schedule accepted with HTTP 201");
  assert(dataSched.data.status === "Scheduled", "Message status is Scheduled");
  assert(dataSched.data.deliveryStatus["Email"] === "Scheduled", "Email delivery status is Scheduled");

  // 8B: Past date rejected
  const pastPayload = {
    ...schedPayload,
    scheduleDate: "2020-01-01",
    scheduleTime: "00:00",
  };
  const resPast = await fetch(`${BASE_URL}/api/admin/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify(pastPayload),
  });
  assert(resPast.status === 400, "Past schedule date rejected with HTTP 400");

  // 8C: Missing schedule date rejected
  const missingSchedPayload = {
    ...schedPayload,
    scheduleDate: "",
  };
  const resMissingSched = await fetch(`${BASE_URL}/api/admin/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify(missingSchedPayload),
  });
  assert(resMissingSched.status === 400, "Missing schedule date rejected with HTTP 400");

  // 9. User Isolation & Authorization
  console.log("\n--- SECTION 9: USER ISOLATION & AUTHORIZATION ---");
  const tokenReal = createToken(realGmailUser, "user");
  const tokenOther = createToken(otherUser, "user");

  // Query /api/messages as real recipient
  const resIsoReal = await fetch(`${BASE_URL}/api/messages`, {
    headers: { Authorization: `Bearer ${tokenReal}` },
  });
  const dataIsoReal = await resIsoReal.json();
  const realFoundMsg = (dataIsoReal.data || []).some((m) => m.title === testSubject);
  assert(realFoundMsg === true, "Recipient sees the message directed to them");

  // Query /api/messages as other user
  const resIsoOther = await fetch(`${BASE_URL}/api/messages`, {
    headers: { Authorization: `Bearer ${tokenOther}` },
  });
  const dataIsoOther = await resIsoOther.json();
  const otherFoundMsg = (dataIsoOther.data || []).some((m) => m.title === testSubject);
  assert(otherFoundMsg === false, "Other regular user CANNOT see another recipient's message (Isolation PASS)");

  // Regular user cannot post admin messages
  const resUnauthorized = await fetch(`${BASE_URL}/api/admin/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenReal}` },
    body: JSON.stringify(payloadReal),
  });
  assert(resUnauthorized.status === 403 || resUnauthorized.status === 401, "Regular user blocked from POST /api/admin/messages");

  console.log("\n========================================================");
  console.log(`AUDIT COMPLETE: ${passedCount}/${totalCount} ASSERTIONS PASSED (100%)`);
  console.log("========================================================");

  await mongoose.disconnect();
  process.exit(0);
}

runAudit().catch(async (err) => {
  console.error("\n[AUDIT FAILURE]:", err);
  await mongoose.disconnect();
  process.exit(1);
});
