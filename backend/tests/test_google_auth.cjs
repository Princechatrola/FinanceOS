const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const User = require("../models/User");
const { googleLogin } = require("../controllers/authController");

async function runTest() {
  console.log("==================================================");
  console.log("RUNNING GOOGLE AUTHENTICATION TEST");
  console.log("==================================================");

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected successfully");

    // Mock Express req and res
    function createMockRes() {
      const res = {
        statusCode: 200,
        body: null,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(data) {
          this.body = data;
          return this;
        }
      };
      return res;
    }

    // Test 1: Sign in with admin Google account
    console.log("\n--- TEST 1: Google Login with Admin Email ---");
    const reqAdmin = {
      body: {
        email: "admin@financeos.com",
        name: "Admin User",
        googleId: "google-123456"
      }
    };
    const resAdmin = createMockRes();
    await googleLogin(reqAdmin, resAdmin);

    console.log("Status:", resAdmin.statusCode);
    console.log("Success:", resAdmin.body?.success);
    console.log("Role:", resAdmin.body?.user?.role);
    console.log("Has JWT Token:", !!resAdmin.body?.token);

    if (resAdmin.statusCode !== 200 || !resAdmin.body?.token || resAdmin.body?.user?.role !== "admin") {
      throw new Error("Test 1 Failed: Admin Google login did not return expected admin token");
    }
    console.log(">>> TEST 1 PASSED!");

    // Test 2: Sign in with a new user Google account (Auto-provision)
    console.log("\n--- TEST 2: Google Login with New User Email ---");
    const testUserEmail = `google_test_${Date.now()}@gmail.com`;
    const reqNewUser = {
      body: {
        email: testUserEmail,
        name: "Google Test User",
        googleId: `gid_${Date.now()}`
      }
    };
    const resNewUser = createMockRes();
    await googleLogin(reqNewUser, resNewUser);

    console.log("Status:", resNewUser.statusCode);
    console.log("Success:", resNewUser.body?.success);
    console.log("Assigned User ID:", resNewUser.body?.user?.userId);
    console.log("Role:", resNewUser.body?.user?.role);
    console.log("Name:", resNewUser.body?.user?.name);
    console.log("Has JWT Token:", !!resNewUser.body?.token);

    if (resNewUser.statusCode !== 200 || !resNewUser.body?.token || resNewUser.body?.user?.role !== "user") {
      throw new Error("Test 2 Failed: New user Google login did not provision and return user token");
    }
    console.log(">>> TEST 2 PASSED!");

    // Clean up test user
    await User.deleteOne({ email: testUserEmail });
    console.log("Cleaned up test user.");

    console.log("\n==================================================");
    console.log("ALL GOOGLE AUTH TESTS COMPLETED SUCCESSFULLY!");
    console.log("==================================================");
    process.exit(0);
  } catch (err) {
    console.error("Test Error:", err);
    process.exit(1);
  }
}

runTest();
