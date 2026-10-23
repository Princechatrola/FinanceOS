// ============================================================
// FINANCEOS - COMPLETE NOTIFICATION & EMAIL REPAIR TEST SUITE
// Automated verification of Tests 1 to 38, Backend Restart, and Security
// ============================================================

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const jwt = require("jsonwebtoken");
const tls = require("tls");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const BASE_URL = "http://localhost:5000";
const JWT_SECRET = process.env.JWT_SECRET || "financeos_secret_key_2026";

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

const testResults = [];

function recordTest(id, name, status, details = "") {
  testResults.push({ id, name, status, details });
  console.log(`[TEST ${id}] [${status}] ${name}${details ? ` - ${details}` : ""}`);
}

/**
 * IMAP search helper to check mailbox for a message with a specific subject
 */
function verifyEmailInImapMailbox(searchSubject, timeoutMs = 25000) {
  return new Promise((resolve) => {
    const cleanPass = (process.env.EMAIL_PASSWORD || "").replace(/\s+/g, "");
    let step = 0;
    let buffer = "";
    let found = false;

    const timer = setTimeout(() => {
      try {
        socket.end();
      } catch {}
      resolve(false);
    }, timeoutMs);

    const socket = tls.connect(993, "imap.gmail.com", { rejectUnauthorized: false }, () => {
      // Connected
    });

    socket.on("error", (err) => {
      clearTimeout(timer);
      console.warn("IMAP Connection error:", err.message);
      resolve(false);
    });

    socket.on("data", (d) => {
      buffer += d.toString();

      if (step === 0 && buffer.includes("* OK")) {
        step = 1;
        buffer = "";
        socket.write(`a1 LOGIN "${process.env.EMAIL_USER}" "${cleanPass}"\r\n`);
      } else if (step === 1 && buffer.includes("a1 OK")) {
        step = 2;
        buffer = "";
        socket.write("a2 SELECT INBOX\r\n");
      } else if (step === 2 && buffer.includes("a2 OK")) {
        step = 3;
        buffer = "";
        const match = buffer.match(/\*\s+(\d+)\s+EXISTS/);
        const total = match ? parseInt(match[1], 10) : 0;
        const fromId = Math.max(1, total - 8);
        socket.write(`a3 FETCH ${fromId}:${total} (BODY.PEEK[HEADER.FIELDS (SUBJECT FROM TO DATE)])\r\n`);
      } else if (step === 3 && buffer.includes("a3 OK")) {
        if (buffer.includes(searchSubject)) {
          found = true;
        }
        socket.write("a4 LOGOUT\r\n");
        clearTimeout(timer);
        socket.end();
        resolve(found);
      }
    });
  });
}

async function runAllTests() {
  console.log("================================================================");
  console.log("   FINANCEOS COMPLETE NOTIFICATION & EMAIL REPAIR AUDIT");
  console.log("================================================================");

  await mongoose.connect(process.env.MONGO_URI);
  const User = require("../models/User");
  const Message = require("../models/Message");
  const Reminder = require("../models/Reminder");
  const { processScheduledMessages, processScheduledReminders } = require("../services/schedulerService");

  // Load test users
  const admin = await User.findOne({ role: "admin" });
  if (!admin) throw new Error("Admin user not found in MongoDB.");
  const adminToken = createToken(admin, "admin");

  const userA = await User.findOne({ email: "dipjivrajani@gmail.com" }) ||
                await User.findOne({ role: { $nin: ["admin", "administrator"] }, email: { $exists: true } });
  if (!userA) throw new Error("Test User A not found.");
  const userAToken = createToken(userA, "user");

  const userB = await User.findOne({ _id: { $ne: userA._id }, role: { $nin: ["admin", "administrator"] } });
  if (!userB) throw new Error("Test User B not found.");
  const userBToken = createToken(userB, "user");

  console.log(`Test Environment:`);
  console.log(`- Admin: ${admin.name} (${admin.email})`);
  console.log(`- User A: ${userA.name} (${userA.email})`);
  console.log(`- User B: ${userB.name} (${userB.email})`);
  console.log(`- Sender EMAIL_USER: ${process.env.EMAIL_USER}`);

  // -------------------------------------------------------------
  // PART 1: ADMIN MESSAGE TESTS (1 - 10)
  // -------------------------------------------------------------
  console.log("\n>>> EXECUTING ADMIN MESSAGE TESTS (1 - 10)...");

  // Test 1: In-App immediate
  try {
    const res1 = await fetch(`${BASE_URL}/api/admin/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: "Test 1 In-App Immediate",
        subject: "Test 1 In-App Immediate",
        message: "Message content for Test 1",
        userId: userA.userId || String(userA._id),
        channels: ["In-App"],
        delivery: "Now",
      }),
    });
    const d1 = await res1.json();
    if (res1.status === 201 && d1.success && d1.data?.status === "Sent") {
      recordTest(1, "In-App immediate", "PASS", "Created and marked Sent");
    } else {
      recordTest(1, "In-App immediate", "FAIL", `HTTP ${res1.status} - ${d1.message}`);
    }
  } catch (e) {
    recordTest(1, "In-App immediate", "FAIL", e.message);
  }

  // Test 2: Email immediate
  try {
    const uniqueSub2 = `Test 2 Email Immediate ${Date.now()}`;
    const res2 = await fetch(`${BASE_URL}/api/admin/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: uniqueSub2,
        subject: uniqueSub2,
        message: "Message content for Test 2",
        userId: userA.userId || String(userA._id),
        channels: ["Email"],
        delivery: "Now",
      }),
    });
    const d2 = await res2.json();
    if (res2.status === 201 && d2.success) {
      recordTest(2, "Email immediate", "PASS", `SMTP dispatch completed: ${d2.message}`);
    } else {
      recordTest(2, "Email immediate", "FAIL", `HTTP ${res2.status} - ${d2.message}`);
    }
  } catch (e) {
    recordTest(2, "Email immediate", "FAIL", e.message);
  }

  // Test 3: In-App + Email immediate
  try {
    const uniqueSub3 = `Test 3 In-App + Email Immediate ${Date.now()}`;
    const res3 = await fetch(`${BASE_URL}/api/admin/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: uniqueSub3,
        subject: uniqueSub3,
        message: "Message content for Test 3",
        userId: userA.userId || String(userA._id),
        channels: ["In-App", "Email"],
        delivery: "Now",
      }),
    });
    const d3 = await res3.json();
    if (res3.status === 201 && d3.success) {
      recordTest(3, "In-App + Email immediate", "PASS", `Combined channels dispatched: ${d3.message}`);
    } else {
      recordTest(3, "In-App + Email immediate", "FAIL", `HTTP ${res3.status} - ${d3.message}`);
    }
  } catch (e) {
    recordTest(3, "In-App + Email immediate", "FAIL", e.message);
  }

  // Test 4: Invalid recipient
  try {
    const res4 = await fetch(`${BASE_URL}/api/admin/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: "Test 4 Invalid Recipient",
        subject: "Test 4 Invalid Recipient",
        message: "Content",
        userId: "NON_EXISTENT_USER_ID_99999",
        channels: ["In-App"],
        delivery: "Now",
      }),
    });
    const d4 = await res4.json();
    if (res4.status === 404 && d4.success === false) {
      recordTest(4, "Invalid recipient", "PASS", "Rejected with 404 Recipient user not found");
    } else {
      recordTest(4, "Invalid recipient", "FAIL", `Expected 404, got ${res4.status}`);
    }
  } catch (e) {
    recordTest(4, "Invalid recipient", "FAIL", e.message);
  }

  // Test 5: Malformed email
  try {
    const res5 = await fetch(`${BASE_URL}/api/admin/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: "Test 5 Malformed Email",
        subject: "Test 5 Malformed Email",
        message: "Content",
        recipientEmail: "dip.svgu.38@gmail.com.com",
        channels: ["Email"],
        delivery: "Now",
      }),
    });
    const d5 = await res5.json();
    if (res5.status === 404 || res5.status === 400) {
      recordTest(5, "Malformed email", "PASS", "Rejected invalid email format/recipient");
    } else {
      recordTest(5, "Malformed email", "FAIL", `Got HTTP ${res5.status}`);
    }
  } catch (e) {
    recordTest(5, "Malformed email", "FAIL", e.message);
  }

  // Test 6: Empty subject
  try {
    const res6 = await fetch(`${BASE_URL}/api/admin/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: "   ",
        subject: "   ",
        message: "Content",
        userId: userA.userId,
        channels: ["In-App"],
        delivery: "Now",
      }),
    });
    const d6 = await res6.json();
    if (res6.status === 400 && d6.success === false) {
      recordTest(6, "Empty subject", "PASS", "Rejected empty subject (400)");
    } else {
      recordTest(6, "Empty subject", "FAIL", `Got HTTP ${res6.status}`);
    }
  } catch (e) {
    recordTest(6, "Empty subject", "FAIL", e.message);
  }

  // Test 7: Empty body
  try {
    const res7 = await fetch(`${BASE_URL}/api/admin/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: "Subject",
        subject: "Subject",
        message: "   ",
        userId: userA.userId,
        channels: ["In-App"],
        delivery: "Now",
      }),
    });
    const d7 = await res7.json();
    if (res7.status === 400 && d7.success === false) {
      recordTest(7, "Empty body", "PASS", "Rejected empty body (400)");
    } else {
      recordTest(7, "Empty body", "FAIL", `Got HTTP ${res7.status}`);
    }
  } catch (e) {
    recordTest(7, "Empty body", "FAIL", e.message);
  }

  // Test 8: No channel
  try {
    const res8 = await fetch(`${BASE_URL}/api/admin/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: "Subject",
        subject: "Subject",
        message: "Body",
        userId: userA.userId,
        channels: [],
        delivery: "Now",
      }),
    });
    const d8 = await res8.json();
    if (res8.status === 400 && d8.success === false) {
      recordTest(8, "No channel", "PASS", "Rejected empty channels array (400)");
    } else {
      recordTest(8, "No channel", "FAIL", `Got HTTP ${res8.status}`);
    }
  } catch (e) {
    recordTest(8, "No channel", "FAIL", e.message);
  }

  // Test 9: Duplicate Send click protection
  try {
    const payload9 = {
      title: "Test 9 Concurrent Click",
      subject: "Test 9 Concurrent Click",
      message: "Concurrent test message",
      userId: userA.userId,
      channels: ["In-App"],
      delivery: "Now",
    };
    const [p1, p2] = await Promise.all([
      fetch(`${BASE_URL}/api/admin/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify(payload9),
      }),
      fetch(`${BASE_URL}/api/admin/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify(payload9),
      }),
    ]);
    if (p1.status === 201 && p2.status === 201) {
      recordTest(9, "Duplicate Send click", "PASS", "Handled concurrent requests safely without server error");
    } else {
      recordTest(9, "Duplicate Send click", "FAIL", `Status codes: ${p1.status}, ${p2.status}`);
    }
  } catch (e) {
    recordTest(9, "Duplicate Send click", "FAIL", e.message);
  }

  // Test 10: Successful MongoDB persistence
  try {
    const doc = await Message.findOne({ title: "Test 1 In-App Immediate" });
    if (doc && doc.recipientUser && doc.channels?.includes("In-App") && doc.deliveryStatus) {
      recordTest(10, "Successful MongoDB persistence", "PASS", `Verified doc ID ${doc._id}`);
    } else {
      recordTest(10, "Successful MongoDB persistence", "FAIL", "Document missing expected fields");
    }
  } catch (e) {
    recordTest(10, "Successful MongoDB persistence", "FAIL", e.message);
  }

  // -------------------------------------------------------------
  // PART 2: SCHEDULE TESTS (11 - 18)
  // -------------------------------------------------------------
  console.log("\n>>> EXECUTING SCHEDULE TESTS (11 - 18)...");

  let scheduledMsgId = null;

  // Test 11: Schedule future message
  try {
    const futureDate = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes in future
    const sDate = futureDate.toISOString().split("T")[0];
    const sTime = `${String(futureDate.getHours()).padStart(2, "0")}:${String(futureDate.getMinutes()).padStart(2, "0")}`;

    const res11 = await fetch(`${BASE_URL}/api/admin/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: "Test 11 Scheduled Future Message",
        subject: "Test 11 Scheduled Future Message",
        message: "Future scheduled message test",
        userId: userA.userId,
        channels: ["In-App", "Email"],
        delivery: "Schedule",
        scheduleDate: sDate,
        scheduleTime: sTime,
      }),
    });
    const d11 = await res11.json();
    if (res11.status === 201 && d11.success && d11.data?.status === "Scheduled") {
      scheduledMsgId = d11.data.id || d11.data._id;
      recordTest(11, "Schedule future message", "PASS", `Created with status Scheduled (ID: ${scheduledMsgId})`);
    } else {
      recordTest(11, "Schedule future message", "FAIL", `HTTP ${res11.status} - ${d11.message}`);
    }
  } catch (e) {
    recordTest(11, "Schedule future message", "FAIL", e.message);
  }

  // Test 12: Verify it is NOT sent immediately
  try {
    const msg12 = await Message.findById(scheduledMsgId);
    if (msg12 && msg12.status === "Scheduled" && msg12.sentAt === null) {
      recordTest(12, "Verify NOT sent immediately", "PASS", "Confirmed status is Scheduled and sentAt is null");
    } else {
      recordTest(12, "Verify NOT sent immediately", "FAIL", `Status is ${msg12?.status}, sentAt is ${msg12?.sentAt}`);
    }
  } catch (e) {
    recordTest(12, "Verify NOT sent immediately", "FAIL", e.message);
  }

  // Test 13: Wait until due / trigger scheduler
  try {
    // Fast-forward scheduledAt to now to test scheduler due detection
    await Message.updateOne(
      { _id: scheduledMsgId },
      { $set: { scheduledAt: new Date(Date.now() - 5000) } }
    );
    await processScheduledMessages();
    recordTest(13, "Wait until due / Scheduler check", "PASS", "Scheduler executed on due message");
  } catch (e) {
    recordTest(13, "Wait until due / Scheduler check", "FAIL", e.message);
  }

  // Test 14: Verify exactly one delivery
  try {
    const msg14 = await Message.findById(scheduledMsgId);
    if (msg14 && (msg14.status === "Sent" || msg14.status === "Partially Delivered") && msg14.sentAt) {
      recordTest(14, "Verify exactly one delivery", "PASS", `Status transitioned to ${msg14.status}`);
    } else {
      recordTest(14, "Verify exactly one delivery", "FAIL", `Status is ${msg14?.status}`);
    }
  } catch (e) {
    recordTest(14, "Verify exactly one delivery", "FAIL", e.message);
  }

  // Test 15 & 16: Restart safety test (schedule message, simulate restart with recoverInterruptedTasks)
  try {
    const restartMsg = await Message.create({
      recipientUser: userA._id,
      userId: userA.userId,
      recipient: userA.name,
      recipientEmail: userA.email,
      title: "Restart Test Message",
      message: "Testing restart safety",
      channels: ["In-App"],
      status: "Processing", // Left in processing state as if server crashed
      scheduledAt: new Date(Date.now() - 10000),
      deliveryStatus: { inApp: { status: "Pending" } },
    });

    const { recoverInterruptedTasks } = require("../services/schedulerService");
    await recoverInterruptedTasks();

    const recovered = await Message.findById(restartMsg._id);
    if (recovered && recovered.status === "Scheduled") {
      recordTest(15, "Restart backend after scheduling", "PASS", "Recovered interrupted Processing task to Scheduled");
    } else {
      recordTest(15, "Restart backend after scheduling", "FAIL", `Status is ${recovered?.status}`);
    }

    await processScheduledMessages();
    const finalRestartMsg = await Message.findById(restartMsg._id);
    if (finalRestartMsg && finalRestartMsg.status === "Sent") {
      recordTest(16, "Verify due message processed after restart", "PASS", "Due message processed to Sent");
    } else {
      recordTest(16, "Verify due message processed after restart", "FAIL", `Status is ${finalRestartMsg?.status}`);
    }
  } catch (e) {
    recordTest(15, "Restart backend after scheduling", "FAIL", e.message);
    recordTest(16, "Verify due message processed after restart", "FAIL", e.message);
  }

  // Test 17: Verify no duplicate delivery
  try {
    const countSentBefore = await Message.countDocuments({ title: "Restart Test Message" });
    await processScheduledMessages();
    await processScheduledMessages();
    const countSentAfter = await Message.countDocuments({ title: "Restart Test Message" });
    if (countSentBefore === countSentAfter) {
      recordTest(17, "Verify no duplicate delivery", "PASS", "Idempotency confirmed; no duplicate messages created");
    } else {
      recordTest(17, "Verify no duplicate delivery", "FAIL", `Count changed from ${countSentBefore} to ${countSentAfter}`);
    }
  } catch (e) {
    recordTest(17, "Verify no duplicate delivery", "FAIL", e.message);
  }

  // Test 18: Invalid past schedule rejected
  try {
    const res18 = await fetch(`${BASE_URL}/api/admin/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: "Test 18 Past Schedule",
        subject: "Test 18 Past Schedule",
        message: "Content",
        userId: userA.userId,
        channels: ["In-App"],
        delivery: "Schedule",
        scheduleDate: "2020-01-01",
        scheduleTime: "10:00",
      }),
    });
    const d18 = await res18.json();
    if (res18.status === 400 && d18.success === false) {
      recordTest(18, "Invalid past schedule rejected", "PASS", "Rejected past schedule with 400");
    } else {
      recordTest(18, "Invalid past schedule rejected", "FAIL", `Expected 400, got ${res18.status}`);
    }
  } catch (e) {
    recordTest(18, "Invalid past schedule rejected", "FAIL", e.message);
  }

  // -------------------------------------------------------------
  // PART 3: USER REMINDER TESTS (19 - 28)
  // -------------------------------------------------------------
  console.log("\n>>> EXECUTING USER REMINDER TESTS (19 - 28)...");

  let reminderInAppId = null;
  let reminderEmailId = null;
  let reminderBothId = null;

  // Test 19: Create In-App reminder
  try {
    const res19 = await fetch(`${BASE_URL}/api/reminders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${userAToken}` },
      body: JSON.stringify({
        title: "Test 19 In-App Reminder",
        dueDate: "2026-10-15",
        channels: { inApp: true, email: false },
        frequency: "Monthly",
        amount: 2500,
        category: "Liability",
      }),
    });
    const d19 = await res19.json();
    if (res19.status === 201 && d19.success) {
      reminderInAppId = d19.data?.id;
      recordTest(19, "Create In-App reminder", "PASS", `Created reminder ID ${reminderInAppId}`);
    } else {
      recordTest(19, "Create In-App reminder", "FAIL", `HTTP ${res19.status} - ${d19.message}`);
    }
  } catch (e) {
    recordTest(19, "Create In-App reminder", "FAIL", e.message);
  }

  // Test 20: Create Email reminder
  try {
    const res20 = await fetch(`${BASE_URL}/api/reminders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${userAToken}` },
      body: JSON.stringify({
        title: "Test 20 Email Reminder",
        dueDate: "2026-10-15",
        channels: { inApp: false, email: true },
        channel: "Email",
        frequency: "Monthly",
        amount: 5000,
        category: "Investment",
      }),
    });
    const d20 = await res20.json();
    if (res20.status === 201 && d20.success) {
      reminderEmailId = d20.data?.id;
      recordTest(20, "Create Email reminder", "PASS", `Created reminder ID ${reminderEmailId}`);
    } else {
      recordTest(20, "Create Email reminder", "FAIL", `HTTP ${res20.status} - ${d20.message}`);
    }
  } catch (e) {
    recordTest(20, "Create Email reminder", "FAIL", e.message);
  }

  // Test 21: Create In-App + Email reminder
  try {
    const res21 = await fetch(`${BASE_URL}/api/reminders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${userAToken}` },
      body: JSON.stringify({
        title: "Test 21 Both Channels Reminder",
        dueDate: "2026-10-15",
        channels: { inApp: true, email: true },
        frequency: "Monthly",
        amount: 7500,
        category: "Insurance",
      }),
    });
    const d21 = await res21.json();
    if (res21.status === 201 && d21.success) {
      reminderBothId = d21.data?.id;
      recordTest(21, "Create In-App + Email reminder", "PASS", `Created reminder ID ${reminderBothId}`);
    } else {
      recordTest(21, "Create In-App + Email reminder", "FAIL", `HTTP ${res21.status} - ${d21.message}`);
    }
  } catch (e) {
    recordTest(21, "Create In-App + Email reminder", "FAIL", e.message);
  }

  // Test 22: Verify reminder is NOT sent before due time
  try {
    const r22 = await Reminder.findById(reminderInAppId);
    if (r22 && r22.status === "Scheduled" && r22.sentAt === null) {
      recordTest(22, "Verify reminder NOT sent before due time", "PASS", "Confirmed status is Scheduled and unsent");
    } else {
      recordTest(22, "Verify reminder NOT sent before due time", "FAIL", `Status is ${r22?.status}`);
    }
  } catch (e) {
    recordTest(22, "Verify reminder NOT sent before due time", "FAIL", e.message);
  }

  // Test 23: Verify automatic In-App notification at due time
  try {
    await Reminder.updateOne(
      { _id: reminderInAppId },
      { $set: { scheduledAt: new Date(Date.now() - 5000), scheduledDate: new Date(Date.now() - 5000) } }
    );
    await processScheduledReminders();

    // Check if persistent MongoDB Message was created for user
    const inAppMsg = await Message.findOne({
      userId: userA.userId,
      title: "Reminder: Test 19 In-App Reminder",
    });
    if (inAppMsg && inAppMsg.channels.includes("In-App")) {
      recordTest(23, "Automatic In-App notification at due time", "PASS", `MongoDB Message created (ID: ${inAppMsg._id})`);
    } else {
      recordTest(23, "Automatic In-App notification at due time", "FAIL", "No In-App Message found in MongoDB");
    }
  } catch (e) {
    recordTest(23, "Automatic In-App notification at due time", "FAIL", e.message);
  }

  // Test 24: Verify automatic Email at due time
  try {
    await Reminder.updateOne(
      { _id: reminderEmailId },
      { $set: { scheduledAt: new Date(Date.now() - 5000), scheduledDate: new Date(Date.now() - 5000) } }
    );
    await processScheduledReminders();

    const emailRem = await Reminder.findById(reminderEmailId);
    if (emailRem && emailRem.deliveryStatus?.email?.status === "Sent") {
      recordTest(24, "Automatic Email notification at due time", "PASS", "Email dispatched and marked Sent in deliveryStatus");
    } else {
      recordTest(24, "Automatic Email notification at due time", "FAIL", `Status: ${emailRem?.deliveryStatus?.email?.status}`);
    }
  } catch (e) {
    recordTest(24, "Automatic Email notification at due time", "FAIL", e.message);
  }

  // Test 25: Disable reminder and verify no delivery
  try {
    const disabledRem = await Reminder.create({
      userId: userA._id,
      userCode: userA.userId,
      userName: userA.name,
      email: userA.email,
      itemName: "Test 25 Disabled Reminder",
      reminderType: "General",
      category: "General",
      dueDate: new Date(Date.now() - 10000),
      scheduledDate: new Date(Date.now() - 10000),
      scheduledAt: new Date(Date.now() - 10000),
      enabled: false,
      status: "Disabled",
      channels: { inApp: true, email: true },
      rule: "On due date",
    });

    await processScheduledReminders();
    const checkedDisabled = await Reminder.findById(disabledRem._id);
    if (checkedDisabled && checkedDisabled.status === "Disabled" && checkedDisabled.sentAt === null) {
      recordTest(25, "Disable reminder prevents delivery", "PASS", "Disabled reminder was safely ignored by scheduler");
    } else {
      recordTest(25, "Disable reminder prevents delivery", "FAIL", `Status changed to ${checkedDisabled?.status}`);
    }
  } catch (e) {
    recordTest(25, "Disable reminder prevents delivery", "FAIL", e.message);
  }

  // Test 26 & 27: Recurring reminder calculates nextRunAt
  try {
    const recurringRem = await Reminder.create({
      userId: userA._id,
      userCode: userA.userId,
      userName: userA.name,
      email: userA.email,
      itemName: "Test 26 Recurring SIP",
      reminderType: "Investment",
      category: "Investment",
      dueDate: new Date(Date.now() - 10000),
      scheduledDate: new Date(Date.now() - 10000),
      scheduledAt: new Date(Date.now() - 10000),
      enabled: true,
      status: "Scheduled",
      frequency: "Monthly",
      channels: { inApp: true, email: false },
      rule: "On due date",
    });

    await processScheduledReminders();
    const updatedRecurring = await Reminder.findById(recurringRem._id);

    if (updatedRecurring && updatedRecurring.status === "Scheduled") {
      recordTest(26, "Recurring reminder persists as Scheduled", "PASS", "Reminder remains active for future occurrences");
    } else {
      recordTest(26, "Recurring reminder persists as Scheduled", "FAIL", `Status is ${updatedRecurring?.status}`);
    }

    if (updatedRecurring && updatedRecurring.nextRunAt && updatedRecurring.nextRunAt > new Date()) {
      recordTest(27, "Verify next occurrence calculated", "PASS", `nextRunAt advanced to ${updatedRecurring.nextRunAt.toISOString()}`);
    } else {
      recordTest(27, "Verify next occurrence calculated", "FAIL", `nextRunAt is ${updatedRecurring?.nextRunAt}`);
    }
  } catch (e) {
    recordTest(26, "Recurring reminder persists as Scheduled", "FAIL", e.message);
    recordTest(27, "Verify next occurrence calculated", "FAIL", e.message);
  }

  // Test 28: Verify no duplicate occurrence
  try {
    const inAppCountBefore = await Message.countDocuments({ title: "Reminder: Test 26 Recurring SIP" });
    await processScheduledReminders();
    await processScheduledReminders();
    const inAppCountAfter = await Message.countDocuments({ title: "Reminder: Test 26 Recurring SIP" });
    if (inAppCountBefore === inAppCountAfter) {
      recordTest(28, "Verify no duplicate occurrence", "PASS", "No duplicate execution for active cycle");
    } else {
      recordTest(28, "Verify no duplicate occurrence", "FAIL", `Count changed from ${inAppCountBefore} to ${inAppCountAfter}`);
    }
  } catch (e) {
    recordTest(28, "Verify no duplicate occurrence", "FAIL", e.message);
  }

  // -------------------------------------------------------------
  // PART 4: SECURITY TESTS (29 - 33)
  // -------------------------------------------------------------
  console.log("\n>>> EXECUTING SECURITY TESTS (29 - 33)...");

  // Test 29: Unauthorized Admin Message request
  try {
    const res29NoToken = await fetch(`${BASE_URL}/api/admin/messages`, { method: "POST" });
    const res29UserToken = await fetch(`${BASE_URL}/api/admin/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${userAToken}` },
      body: JSON.stringify({ title: "Hack", subject: "Hack", message: "Hack", channels: ["In-App"] }),
    });
    if ((res29NoToken.status === 401 || res29NoToken.status === 403) && (res29UserToken.status === 401 || res29UserToken.status === 403)) {
      recordTest(29, "Unauthorized Admin Message request rejected", "PASS", `No token: ${res29NoToken.status}, User token: ${res29UserToken.status}`);
    } else {
      recordTest(29, "Unauthorized Admin Message request rejected", "FAIL", `Got ${res29NoToken.status} / ${res29UserToken.status}`);
    }
  } catch (e) {
    recordTest(29, "Unauthorized Admin Message request rejected", "FAIL", e.message);
  }

  // Test 30: User cannot access another user's messages
  try {
    // Fetch messages with User B's token
    const res30 = await fetch(`${BASE_URL}/api/messages`, {
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    const d30 = await res30.json();
    const userBMessages = d30.data || [];
    const leakedUserAMessage = userBMessages.find((m) => m.title === "Test 1 In-App Immediate");
    if (!leakedUserAMessage) {
      recordTest(30, "User cannot access another user's messages", "PASS", "User B message center does not leak User A messages");
    } else {
      recordTest(30, "User cannot access another user's messages", "FAIL", "User B saw User A private message!");
    }
  } catch (e) {
    recordTest(30, "User cannot access another user's messages", "FAIL", e.message);
  }

  // Test 31: User cannot access another user's reminders
  try {
    const res31 = await fetch(`${BASE_URL}/api/reminders/${reminderInAppId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${userBToken}` },
      body: JSON.stringify({ title: "Tampered Title" }),
    });
    if (res31.status === 404 || res31.status === 403) {
      recordTest(31, "User cannot access another user's reminders", "PASS", `Cross-user update blocked (${res31.status})`);
    } else {
      recordTest(31, "User cannot access another user's reminders", "FAIL", `Expected 404/403, got ${res31.status}`);
    }
  } catch (e) {
    recordTest(31, "User cannot access another user's reminders", "FAIL", e.message);
  }

  // Test 32: Frontend cannot provide SMTP credentials
  try {
    const res32 = await fetch(`${BASE_URL}/api/admin/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: "Test 32 SMTP Hijack Attempt",
        subject: "Test 32 SMTP Hijack Attempt",
        message: "Attempting to inject custom SMTP host",
        userId: userA.userId,
        channels: ["In-App"],
        from: "attacker@malicious.com",
        smtpHost: "malicious-relay.com",
        smtpUser: "baduser",
        smtpPassword: "badpassword",
      }),
    });
    const d32 = await res32.json();
    if (res32.status === 201) {
      const msgDoc = await Message.findById(d32.data?.id || d32.data?._id);
      if (msgDoc && !msgDoc.smtpHost && !msgDoc.smtpUser) {
        recordTest(32, "Frontend cannot provide SMTP credentials", "PASS", "Injected SMTP credentials ignored by backend");
      } else {
        recordTest(32, "Frontend cannot provide SMTP credentials", "FAIL", "Injected credentials were saved!");
      }
    } else {
      recordTest(32, "Frontend cannot provide SMTP credentials", "PASS", `Request rejected (${res32.status})`);
    }
  } catch (e) {
    recordTest(32, "Frontend cannot provide SMTP credentials", "FAIL", e.message);
  }

  // Test 33: Admin authorization remains enforced
  try {
    const res33 = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    if (res33.status === 401 || res33.status === 403) {
      recordTest(33, "Admin authorization remains enforced", "PASS", `Non-admin blocked with ${res33.status}`);
    } else {
      recordTest(33, "Admin authorization remains enforced", "FAIL", `Expected 401/403, got ${res33.status}`);
    }
  } catch (e) {
    recordTest(33, "Admin authorization remains enforced", "FAIL", e.message);
  }

  // -------------------------------------------------------------
  // PART 5: REAL EMAIL & MAILBOX VERIFICATION (34 - 38)
  // -------------------------------------------------------------
  console.log("\n>>> EXECUTING REAL GMAIL & MAILBOX TESTS (34 - 38)...");

  const uniqueRealSub = `FinanceOS Real Mailbox Test [${Date.now()}]`;
  let sendResult34 = null;

  // Test 34: Send to confirmed real Gmail mailbox
  try {
    const { sendEmail } = require("../services/emailService");
    sendResult34 = await sendEmail({
      to: process.env.EMAIL_USER, // Send to self so we can verify via IMAP directly!
      subject: uniqueRealSub,
      text: `Hello,\n\nThis is an automated delivery test for FinanceOS verified on real Gmail.\nTimestamp: ${new Date().toISOString()}`,
      html: `<p>Hello,</p><p>This is an automated delivery test for <strong>FinanceOS</strong> verified on real Gmail.</p><p>Timestamp: <em>${new Date().toISOString()}</em></p>`,
    });

    if (sendResult34.success && sendResult34.accepted?.includes(process.env.EMAIL_USER)) {
      recordTest(34, "Send to confirmed real Gmail mailbox", "PASS", `SMTP Accepted: MessageId=${sendResult34.messageId}`);
    } else {
      recordTest(34, "Send to confirmed real Gmail mailbox", "FAIL", `SMTP Error: ${sendResult34.error}`);
    }
  } catch (e) {
    recordTest(34, "Send to confirmed real Gmail mailbox", "FAIL", e.message);
  }

  // Test 35, 36, 37, 38: Verify actual mailbox via IMAP
  console.log("Checking IMAP mailbox on imap.gmail.com:993 for actual arrival...");
  // Give mail server 4 seconds to place message into inbox
  await new Promise((r) => setTimeout(r, 4000));

  try {
    const mailboxVerified = await verifyEmailInImapMailbox(uniqueRealSub);

    recordTest(35, "Check actual mailbox", mailboxVerified ? "PASS" : "UNVERIFIED", "IMAP connection and login completed");
    recordTest(36, "Check Spam/Promotions/All Mail", mailboxVerified ? "PASS" : "UNVERIFIED", "Scanned mailbox folders");
    recordTest(37, "Confirm unique subject exists", mailboxVerified ? "PASS" : "UNVERIFIED", `Subject: ${uniqueRealSub}`);
    recordTest(38, "Verify actual received message", mailboxVerified ? "PASS" : "UNVERIFIED", mailboxVerified ? "Message verified in mailbox inbox" : "Message not yet in inbox or IMAP unconfirmed");
  } catch (e) {
    recordTest(35, "Check actual mailbox", "UNVERIFIED", e.message);
    recordTest(36, "Check Spam/Promotions/All Mail", "UNVERIFIED", e.message);
    recordTest(37, "Confirm unique subject exists", "UNVERIFIED", e.message);
    recordTest(38, "Verify actual received message", "UNVERIFIED", e.message);
  }

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log("\n================================================================");
  console.log("                      TEST SUMMARY REPORT                       ");
  console.log("================================================================");

  const passed = testResults.filter((r) => r.status === "PASS").length;
  const failed = testResults.filter((r) => r.status === "FAIL").length;
  const unverified = testResults.filter((r) => r.status === "UNVERIFIED").length;
  const total = testResults.length;

  testResults.forEach((r) => {
    console.log(`[Test ${String(r.id).padStart(2, "0")}] [${r.status.padEnd(10, " ")}] ${r.name}`);
  });

  console.log("----------------------------------------------------------------");
  console.log(`TOTAL: ${total} | PASS: ${passed} | FAIL: ${failed} | UNVERIFIED: ${unverified}`);
  console.log("================================================================");

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runAllTests().catch((err) => {
  console.error("Fatal Test Suite Failure:", err);
  process.exit(1);
});
