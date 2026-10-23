require("dotenv").config();

const mongoose = require("mongoose");
const User = require("./models/User");

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");

    const adminEmail = "admin@financeos.com";

    const existingAdmin = await User.findOne({
      email: adminEmail,
    });

    if (existingAdmin) {
      console.log("Admin already exists.");
      process.exit(0);
    }

    const admin = await User.create({
      userId: "FOS-A-000001",

      name: "FinanceOS Admin",

      dateOfBirth: new Date("1990-01-01"),

      gender: "prefer-not-to-say",

      phone: "9999999999",

      city: "Ahmedabad",

      state: "Gujarat",

      email: adminEmail,

      role: "admin",

      status: "Active",

      otp: null,

      otpExpiresAt: null,
    });

    console.log("Admin created successfully:");
    console.log(admin);

    process.exit(0);

  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
};

createAdmin();