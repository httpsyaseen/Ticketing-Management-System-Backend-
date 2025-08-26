import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import User from "../models/user.js";
import Market from "../models/market.js";
import Department from "../models/department.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Seed markets and users from data/markets_users.json
 * - Avoids duplicate markets (market.name is unique)
 * - Uses bulk insert for markets (insertMany with ordered:false)
 * - Creates users in parallel (Promise.allSettled) but preserves model hooks via User.create
 */
const seedMarketsAndUsers = async () => {
  try {
    // Load JSON file
    const filePath = path.join(__dirname, "../data/markets_users.json");
    const rawData = fs.readFileSync(filePath, "utf-8");
    const jsonData = JSON.parse(rawData);

    if (!jsonData?.markets || !Array.isArray(jsonData.markets)) {
      console.log("No markets data found in JSON.");
      return { success: false, message: "No markets data" };
    }

    // Normalize market entries and collect unique market names
    const marketEntries = jsonData.markets
      .filter((m) => m && typeof m.name === "string" && m.name.trim())
      .map((m) => ({
        name: m.name.trim(),
        users: Array.isArray(m.users) ? m.users : [],
      }));

    const marketNames = [...new Set(marketEntries.map((m) => m.name))];

    // Fetch existing markets
    const existingMarkets = await Market.find({
      name: { $in: marketNames },
    }).lean();
    const existingNamesSet = new Set(existingMarkets.map((m) => m.name));

    // Prepare missing markets
    const marketsToCreate = marketNames
      .filter((n) => !existingNamesSet.has(n))
      .map((name) => ({ name }));

    // Insert missing markets in bulk (ordered:false to continue on duplicates)
    if (marketsToCreate.length) {
      try {
        await Market.insertMany(marketsToCreate, { ordered: false });
        console.log(`Created ${marketsToCreate.length} new markets.`);
      } catch (err) {
        // ignore duplicate key errors (possible race) but log others
        if (err.code && err.code === 11000) {
          console.warn(
            "Some markets already existed (duplicate key), continuing..."
          );
        } else {
          console.warn("insertMany warnings:", err.message);
        }
      }
    } else {
      console.log("No new markets to create.");
    }

    // Re-fetch all relevant markets to build name -> id map
    const allMarkets = await Market.find({ name: { $in: marketNames } }).lean();
    const marketMap = new Map(allMarkets.map((m) => [m.name, m._id]));

    // Prepare users to create (dedupe emails, skip existing users)
    const allUserRows = [];
    for (const entry of marketEntries) {
      const marketId = marketMap.get(entry.name);
      if (!marketId) {
        console.warn(`Market not found after creation: ${entry.name}`);
        continue;
      }
      for (const u of entry.users) {
        if (!u || !u.email) continue;
        allUserRows.push({
          name:
            (u.name && u.name.trim()) ||
            `${entry.name.replace(/^Sahulat Bazaar\s*/i, "")} Bazaar`,
          email: u.email.trim().toLowerCase(),
          role: u.role || "user",
          assignedTo: marketId,
          assignedToType: "Market",
        });
      }
    }

    if (!allUserRows.length) {
      console.log("No users found in JSON to create.");
      return {
        success: true,
        marketsCreated: marketsToCreate.length,
        usersCreated: 0,
      };
    }

    const emails = [...new Set(allUserRows.map((u) => u.email))];
    const existingUsers = await User.find({ email: { $in: emails } })
      .select("email")
      .lean();
    const existingEmails = new Set(
      existingUsers.map((u) => u.email.toLowerCase())
    );

    const usersToCreate = allUserRows.filter(
      (u) => !existingEmails.has(u.email)
    );

    // Create users in parallel while preserving model hooks (User.create)
    const userPromises = usersToCreate.map((u) =>
      User.create({
        name: u.name,
        email: u.email,
        password: "yaseenpsba",
        role: u.role,
        assignedTo: u.assignedTo,
        assignedToType: u.assignedToType,
      })
    );

    const settled = await Promise.allSettled(userPromises);
    const createdUsers = settled
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value);
    const failed = settled
      .filter((r) => r.status === "rejected")
      .map((r) => r.reason?.message || String(r.reason));

    console.log(
      `Users created: ${createdUsers.length}, failed: ${failed.length}`
    );

    return {
      success: true,
      marketsCreated: marketsToCreate.length,
      usersCreated: createdUsers.length,
      usersSkippedExisting: existingEmails.size,
      errors: failed,
    };
  } catch (err) {
    console.error("❌ Error seeding database:", err);
    return { success: false, error: err.message };
  }
};

const starter = async () => {
  // Check for superadmin user
  const user = await User.findOne({ email: "superadmin@gmail.com" });
  let department = await Department.findOne({
    name: "Head Office Administration",
  });

  if (!department) {
    department = await Department.create({
      name: "Head Office Administration",
    });
  }
  if (!user) {
    await User.create({
      name: "Super Admin",
      email: "superadmin@gmail.com",
      password: "yaseenpsba",
      role: "superadmin",
      assignedTo: department._id,
      assignedToType: "Department",
    });
  }

  // Check for IT user
  const itUser = await User.findOne({ email: "it@gmail.com" });
  let itDepartment = await Department.findOne({
    name: "IT Department",
  });

  if (!itDepartment) {
    itDepartment = await Department.create({
      name: "IT Department",
    });
  }
  if (!itUser) {
    await User.create({
      name: "IT Admin",
      email: "it@gmail.com",
      password: "yaseenpsba",
      role: "superadmin",
      assignedTo: itDepartment._id,
      assignedToType: "Department",
    });
  }

  return;
};

export { seedMarketsAndUsers, starter };
