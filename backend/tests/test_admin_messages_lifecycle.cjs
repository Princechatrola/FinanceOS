// ============================================================
// FINANCEOS - ADMIN MESSAGES COMPREHENSIVE TEST SUITE
// Tests full Admin Message lifecycle, validations, delivery channels,
// scheduling, user isolation, and authorization.
// ============================================================

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const jwt = require("jsonwebtoken");

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

async function runTests() {
  console.log("=== STARTING ADMIN MESSAGES LIFECYCLE AUDIT ===");

  await mongoose.connect(process.env.MONGO_URI);
  const User = require("../models/User");
  const Message = require("../models/Message");

  // 1. Setup Admin & 2 Test Users
  let admin = await User.findOne({ role: "admin" });
  if (!admin) {
    admin = await User.findOne({ email: "admin@financeos.com" });
  }
  assert(admin, "Admin user must exist");
  const adminToken = createToken(admin, "admin");

  const userA = await User.findOne({ email: "dipjivrajani@gmail.com" });
  assert(userA, "User A with deliverable Gmail (dipjivrajani@gmail.com) must exist");

  const userB = await User.findOne({ role: { $nin: ["admin", "administrator"] }, _id: { $ne: userA._id } });
  assert(userB, "User B must exist for user isolation tests");

  const tokenA = createToken(userA, "user");
  const tokenB = createToken(userB, "user");

  console.log(`Test setup: Admin: ${admin.email}, User A: ${userA.name} (${userA.email}), User B: ${userB.name} (${userB.email})`);

  let createdMessageId = null;
  let scheduledMessageId = null;

  try {
    // --------------------------------------------------------
    // TEST 1: Direct message + In-App (Send Now)
    // --------------------------------------------------------
    console.log("\n--- TEST 1: Direct message + In-App (Send Now) ---");
    const payloadInApp = {
      title: "In-App Direct Notification",
      subject: "In-App Direct Notification",
      message: "Direct in-app notification test message content.",
      recipient: userA.name,
      userId: userA.userId || String(userA._id),
      recipientEmail: userA.email,
      type: "Personal",
      audienceType: "Personal",
      channels: ["In-App"],
      delivery: "Now",
      status: "Sent",
      createdBy: "Super Admin",
    };

    const res1 = await fetch(`${BASE_URL}/api/admin/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify(payloadInApp),
    });
    const data1 = await res1.json();
    assert(res1.status === 201, `Status code is 201 (got ${res1.status})`);
    assert(data1.success === true, "Response reports success: true");
    assert(data1.data && data1.data.status === "Sent", "Message status is Sent");
    assert(data1.data.deliveryStatus && data1.data.deliveryStatus["In-App"] === "Sent", "In-App deliveryStatus is Sent");
    assert(data1.data.priority === "Normal", "Priority defaults to valid Normal enum");

    // --------------------------------------------------------
    // TEST 2: Direct message + Email (Send Now)
    // --------------------------------------------------------
    console.log("\n--- TEST 2: Direct message + Email (Send Now) ---");
    const payloadEmail = {
      title: "Email Direct Notification",
      subject: "Email Direct Notification",
      message: "Direct email notification test message content.",
      recipient: userA.name,
      userId: userA.userId || String(userA._id),
      recipientEmail: userA.email,
      type: "Personal",
      audienceType: "Personal",
      channels: ["Email"],
      delivery: "Now",
      status: "Sent",
      createdBy: "Super Admin",
    };

    const res2 = await fetch(`${BASE_URL}/api/admin/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify(payloadEmail),
    });
    const data2 = await res2.json();
    assert(res2.status === 201, `Status code is 201 (got ${res2.status})`);
    assert(data2.success === true, "Response reports success: true");
    assert(data2.data && (data2.data.status === "Sent" || data2.data.status === "Partially Delivered"), "Message status is valid");
    assert(data2.data.deliveryStatus && data2.data.deliveryStatus["Email"], "Email deliveryStatus is tracked");

    // --------------------------------------------------------
    // TEST 3: Direct message + In-App + Email (Send Now)
    // --------------------------------------------------------
    console.log("\n--- TEST 3: Direct message + In-App + Email (Send Now) ---");
    const payloadBoth = {
      title: "Dual Channel Announcement",
      subject: "Dual Channel Announcement",
      message: "Delivering across both In-App and Email simultaneously.",
      recipient: userA.name,
      userId: userA.userId || String(userA._id),
      recipientEmail: userA.email,
      type: "Personal",
      audienceType: "Personal",
      channels: ["In-App", "Email"],
      delivery: "Now",
      status: "Sent",
      createdBy: "Super Admin",
    };

    const res3 = await fetch(`${BASE_URL}/api/admin/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify(payloadBoth),
    });
    const data3 = await res3.json();
    assert(res3.status === 201, `Status code is 201 (got ${res3.status})`);
    assert(data3.success === true, "Response reports success: true");
    assert(data3.data.deliveryStatus["In-App"] === "Sent", "In-App delivery status is Sent");
    assert(Boolean(data3.data.deliveryStatus["Email"]), "Email delivery status is populated");
    createdMessageId = data3.data.id || data3.data._id;

    // --------------------------------------------------------
    // TEST 4: Scheduled Message (Future Date & Time)
    // --------------------------------------------------------
    console.log("\n--- TEST 4: Scheduled Message (Future Date & Time) ---");
    const futureDate = new Date(Date.now() + 86400000 * 3); // 3 days in future
    const futureDateStr = futureDate.toISOString().split("T")[0];
    const payloadSched = {
      title: "Quarterly Scheduled Update",
      subject: "Quarterly Scheduled Update",
      message: "This message is scheduled to dispatch in the future.",
      recipient: userA.name,
      userId: userA.userId || String(userA._id),
      recipientEmail: userA.email,
      type: "Personal",
      audienceType: "Personal",
      channels: ["In-App", "Email"],
      delivery: "Schedule",
      scheduleDate: futureDateStr,
      scheduleTime: "10:00",
      scheduledDate: futureDateStr,
      scheduledTime: "10:00",
      status: "Scheduled",
      createdBy: "Super Admin",
    };

    const res4 = await fetch(`${BASE_URL}/api/admin/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify(payloadSched),
    });
    const data4 = await res4.json();
    assert(res4.status === 201, `Status code is 201 (got ${res4.status})`);
    assert(data4.data.status === "Scheduled", "Message status is Scheduled");
    assert(data4.data.deliveryStatus["In-App"] === "Scheduled", "In-App deliveryStatus is Scheduled");
    assert(data4.data.deliveryStatus["Email"] === "Scheduled", "Email deliveryStatus is Scheduled");
    assert(data4.data.scheduledDate === futureDateStr, "scheduledDate is persisted");
    scheduledMessageId = data4.data.id || data4.data._id;

    // --------------------------------------------------------
    // TEST 5: Negative Validations
    // --------------------------------------------------------
    console.log("\n--- TEST 5: Negative Validations ---");

    // 5a. Empty Subject
    const res5a = await fetch(`${BASE_URL}/api/admin/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ ...payloadInApp, subject: "", title: "", templateTitle: "" }),
    });
    assert(res5a.status === 400, "Empty subject rejected with 400");

    // 5b. Whitespace-only Subject
    const res5b = await fetch(`${BASE_URL}/api/admin/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ ...payloadInApp, subject: "   ", title: "   ", templateTitle: "   " }),
    });
    assert(res5b.status === 400, "Whitespace-only subject rejected with 400");

    // 5c. Empty Message Body
    const res5c = await fetch(`${BASE_URL}/api/admin/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ ...payloadInApp, message: "", templateMessage: "" }),
    });
    assert(res5c.status === 400, "Empty message body rejected with 400");

    // 5d. Whitespace-only Message Body
    const res5d = await fetch(`${BASE_URL}/api/admin/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ ...payloadInApp, message: "    \n\t   ", templateMessage: "   " }),
    });
    assert(res5d.status === 400, "Whitespace-only message body rejected with 400");

    // 5e. Non-existent Recipient User (404)
    const res5e = await fetch(`${BASE_URL}/api/admin/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        ...payloadInApp,
        userId: "NON_EXISTENT_ID_9999",
        recipientEmail: "fake_nonexistent_9999@test.com",
      }),
    });
    assert(res5e.status === 404, "Non-existent recipient returns 404");

    // 5f. Past Schedule Time (400)
    const res5f = await fetch(`${BASE_URL}/api/admin/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        ...payloadSched,
        scheduleDate: "2020-01-01",
        scheduleTime: "10:00",
      }),
    });
    assert(res5f.status === 400, "Past schedule date rejected with 400");

    // 5g. Unsupported SMS Channel (400)
    const res5g = await fetch(`${BASE_URL}/api/admin/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        ...payloadInApp,
        channels: ["SMS"],
      }),
    });
    assert(res5g.status === 400, "SMS channel rejected with 400");

    // 5h. Empty Channels Array (400)
    const res5h = await fetch(`${BASE_URL}/api/admin/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        ...payloadInApp,
        channels: [],
      }),
    });
    assert(res5h.status === 400, "Empty channels rejected with 400");

    // --------------------------------------------------------
    // TEST 6: User Isolation (User A receives, User B does not)
    // --------------------------------------------------------
    console.log("\n--- TEST 6: User Isolation Verification ---");

    // Fetch messages as User A
    const resUserA = await fetch(`${BASE_URL}/api/messages`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const dataUserA = await resUserA.json();
    assert(resUserA.status === 200, "User A can fetch user messages");
    const userAMsgIds = (dataUserA.data || []).map((m) => String(m.rawId || m.id || m._id));
    assert(userAMsgIds.includes(String(createdMessageId)), `User A receives their message (${createdMessageId})`);

    // Fetch messages as User B
    const resUserB = await fetch(`${BASE_URL}/api/messages`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const dataUserB = await resUserB.json();
    assert(resUserB.status === 200, "User B can fetch user messages");
    const userBMsgIds = (dataUserB.data || []).map((m) => String(m.rawId || m.id || m._id));
    assert(!userBMsgIds.includes(String(createdMessageId)), "User B CANNOT see User A's private message (Strict Isolation PASS)");

    // --------------------------------------------------------
    // TEST 7: Mark Message As Read (User side)
    // --------------------------------------------------------
    console.log("\n--- TEST 7: Mark Message As Read ---");
    const resRead = await fetch(`${BASE_URL}/api/messages/${createdMessageId}/read`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const dataRead = await resRead.json();
    assert(resRead.status === 200, "Mark as read returns 200");
    assert(dataRead.success === true, "Mark as read success is true");

    // --------------------------------------------------------
    // TEST 8: Admin List & Details Inspection
    // --------------------------------------------------------
    console.log("\n--- TEST 8: Admin List & Stats Inspection ---");
    const resAdminList = await fetch(`${BASE_URL}/api/admin/messages`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dataAdminList = await resAdminList.json();
    assert(resAdminList.status === 200, "Admin can list messages");
    assert(dataAdminList.success === true, "Admin message list success is true");
    assert(Array.isArray(dataAdminList.data), "Admin messages data is an array");
    assert(dataAdminList.stats && typeof dataAdminList.stats.sent === "number", "Admin stats includes sent count");

    // --------------------------------------------------------
    // TEST 9: Admin Message Update (Edit Scheduled Message)
    // --------------------------------------------------------
    console.log("\n--- TEST 9: Admin Message Update ---");
    const resUpdate = await fetch(`${BASE_URL}/api/admin/messages/${scheduledMessageId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: "Updated Scheduled Update Title",
        priority: "Urgent",
      }),
    });
    const dataUpdate = await resUpdate.json();
    assert(resUpdate.status === 200, "Update message returns 200");
    assert(dataUpdate.data.title === "Updated Scheduled Update Title", "Message title was updated");
    assert(dataUpdate.data.priority === "Urgent", "Message priority was updated");

    // --------------------------------------------------------
    // TEST 10: Admin Message Deletion
    // --------------------------------------------------------
    console.log("\n--- TEST 10: Admin Message Deletion ---");
    const resDelete = await fetch(`${BASE_URL}/api/admin/messages/${scheduledMessageId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dataDelete = await resDelete.json();
    assert(resDelete.status === 200, "Delete message returns 200");
    assert(dataDelete.success === true, "Delete message reports success: true");

    // Verify it no longer exists
    const checkDeleted = await Message.findById(scheduledMessageId);
    assert(checkDeleted === null, "Deleted message no longer exists in MongoDB");

    // --------------------------------------------------------
    // TEST 11: Authorization (Non-admin rejected)
    // --------------------------------------------------------
    console.log("\n--- TEST 11: Authorization Verification ---");
    const resAuth = await fetch(`${BASE_URL}/api/admin/messages`, {
      headers: { Authorization: `Bearer ${tokenA}` }, // User token
    });
    assert(resAuth.status === 403, `Non-admin is rejected with 403 Forbidden (got ${resAuth.status})`);

    console.log(`\n=== ADMIN MESSAGES AUDIT RESULT: ${passedCount}/${totalCount} TESTS PASSED ===`);
  } finally {
    await mongoose.disconnect();
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
