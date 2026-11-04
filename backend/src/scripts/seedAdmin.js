import mongoose from "mongoose";
import { env } from "../config/env.js";
import { User } from "../models/user.model.js";

const run = async () => {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@careeros.com").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "AdminPass123!";
  const adminName = (process.env.ADMIN_NAME || "System Admin").trim();

  if (!adminPassword || adminPassword.length < 8) {
    console.error("❌ ADMIN_PASSWORD must be at least 8 characters long.");
    process.exit(1);
  }

  console.log(`Connecting to MongoDB to seed admin (${adminEmail})...`);
  await mongoose.connect(env.MONGO_URI);

  try {
    let adminUser = await User.findOne({ email: adminEmail }).select("+password");

    if (adminUser) {
      console.log(`Found existing user with email ${adminEmail}. Updating to admin...`);
      adminUser.name = adminName;
      adminUser.role = "admin";
      adminUser.isEmailVerified = true;
      adminUser.status = "active";
      adminUser.password = adminPassword; // Triggers pre-save bcrypt hook
      await adminUser.save();
      console.log(`✅ Admin user (${adminEmail}) updated successfully.`);
    } else {
      adminUser = await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: "admin",
        isEmailVerified: true,
        status: "active",
      });
      console.log(`✅ Admin user (${adminEmail}) created successfully.`);
    }
  } catch (err) {
    console.error("❌ Failed to seed admin user:", err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed.");
    process.exit(0);
  }
};

run().catch((err) => {
  console.error("Fatal error during admin seeding:", err);
  process.exit(1);
});
