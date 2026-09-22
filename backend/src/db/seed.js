/* eslint-disable no-console */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const env = require("../config/env");

const User = require("../models/User");
const MRProfile = require("../models/MRProfile");
const PharmaCompanyProfile = require("../models/PharmaCompanyProfile");
const PharmacyProfile = require("../models/PharmacyProfile");
const StockistProfile = require("../models/StockistProfile");
const Requirement = require("../models/Requirement");
const Opportunity = require("../models/Opportunity");

const DEMO_PASSWORD = "Password123!";

async function upsertUser(email, mobile, role, status = "ACTIVE") {
  let user = await User.findOne({ email });
  if (user) return user;
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  user = await User.create({ email, mobile, passwordHash, role, status });
  return user;
}

async function run() {
  await mongoose.connect(env.mongoUri);
  console.log("Connected. Seeding PharmX demo data...");

  // --- Admin ---
  await upsertUser("admin@pharmx.dev", "9990000001", "ADMIN");

  // --- Pharma Company ---
  const companyUser = await upsertUser("company1@pharmx.dev", "9990000002", "PHARMA_COMPANY");
  let company = await PharmaCompanyProfile.findOne({ userId: companyUser._id });
  if (!company) {
    company = await PharmaCompanyProfile.create({
      userId: companyUser._id,
      companyName: "Vertex Biosciences",
      description: "Mid-size pharma manufacturer specializing in dermatology and cardiology lines.",
      manufacturingLocation: "Ahmedabad, Gujarat",
      areasOfOperation: ["Haryana", "Delhi", "Punjab"],
      productCategories: ["Dermatology", "Cardiology"],
    });
  }

  // --- MR (company-affiliated) ---
  const mr1User = await upsertUser("mr1@pharmx.dev", "9990000003", "MR");
  if (!(await MRProfile.findOne({ userId: mr1User._id }))) {
    await MRProfile.create({
      userId: mr1User._id,
      fullName: "Ananya Sharma",
      experienceYears: 6,
      bio: "Dermatology-focused MR covering Haryana with a strong pharmacy network.",
      languages: ["Hindi", "English"],
      specializations: ["Dermatology"],
      territories: ["Karnal, Haryana", "Panipat, Haryana"],
      workMode: "HYBRID",
      isIndependent: false,
    });
  }

  // --- Independent MR ---
  const mr2User = await upsertUser("mr2@pharmx.dev", "9990000004", "INDEPENDENT_MR");
  if (!(await MRProfile.findOne({ userId: mr2User._id }))) {
    await MRProfile.create({
      userId: mr2User._id,
      fullName: "Rohan Verma",
      experienceYears: 9,
      bio: "Independent MR, cardiology and general medicine, flexible territory.",
      languages: ["Hindi", "English", "Punjabi"],
      specializations: ["Cardiology", "General Medicine"],
      territories: ["Delhi", "Gurugram, Haryana"],
      workMode: "FIELD",
      isIndependent: true,
    });
  }

  // --- Pharmacy ---
  const pharmacyUser = await upsertUser("pharmacy1@pharmx.dev", "9990000005", "PHARMACY");
  let pharmacy = await PharmacyProfile.findOne({ userId: pharmacyUser._id });
  if (!pharmacy) {
    pharmacy = await PharmacyProfile.create({
      userId: pharmacyUser._id,
      pharmacyName: "Sunrise Pharmacy",
      location: "Karnal, Haryana",
      businessVerified: true,
      interestedCategories: ["Dermatology"],
    });
  }

  // --- Pending pharmacy (demonstrates the admin verification workflow) ---
  const pendingUser = await upsertUser("pending.pharmacy@pharmx.dev", "9990000006", "PHARMACY", "PENDING_VERIFICATION");
  if (!(await PharmacyProfile.findOne({ userId: pendingUser._id }))) {
    await PharmacyProfile.create({
      userId: pendingUser._id,
      pharmacyName: "New Life Pharmacy",
      location: "Sonipat, Haryana",
    });
  }

  // --- Stockist ---
  const stockistUser = await upsertUser("stockist1@pharmx.dev", "9990000007", "STOCKIST");
  if (!(await StockistProfile.findOne({ userId: stockistUser._id }))) {
    await StockistProfile.create({
      userId: stockistUser._id,
      companyName: "MedSupply Stockists",
      type: "STOCKIST",
      serviceAreas: ["Haryana", "Delhi"],
      productCategories: ["Dermatology", "Cardiology"],
      businessVerified: true,
    });
  }

  // --- Distributor ---
  const distributorUser = await upsertUser("distributor1@pharmx.dev", "9990000008", "DISTRIBUTOR");
  if (!(await StockistProfile.findOne({ userId: distributorUser._id }))) {
    await StockistProfile.create({
      userId: distributorUser._id,
      companyName: "PanIndia Pharma Distribution",
      type: "DISTRIBUTOR",
      serviceAreas: ["Punjab", "Haryana", "Delhi"],
      productCategories: ["Cardiology", "General Medicine"],
      businessVerified: true,
    });
  }

  // --- Sample requirement + opportunity so the marketplace isn't empty on first load ---
  if (!(await Requirement.findOne())) {
    await Requirement.create({
      pharmacyId: pharmacy._id,
      category: "Dermatology",
      title: "Looking for dermatology product line",
      description:
        "We get frequent requests for acne and pigmentation treatments and want a reliable dermatology supplier or MR to visit weekly.",
      urgency: "HIGH",
    });
  }

  if (!(await Opportunity.findOne())) {
    await Opportunity.create({
      companyId: company._id,
      type: "MR_HIRING",
      title: "Field MR needed — Haryana dermatology line",
      description: "Vertex Biosciences is expanding its dermatology range into Haryana and is looking for experienced or independent MRs.",
      categories: ["Dermatology"],
      territories: ["Haryana"],
    });
  }

  console.log(`Seed complete. Demo accounts (password for all: ${DEMO_PASSWORD}):`);
  console.log("  Admin:              admin@pharmx.dev");
  console.log("  Pharma Company:     company1@pharmx.dev");
  console.log("  MR:                 mr1@pharmx.dev");
  console.log("  Independent MR:     mr2@pharmx.dev");
  console.log("  Pharmacy:           pharmacy1@pharmx.dev");
  console.log("  Pharmacy (pending): pending.pharmacy@pharmx.dev");
  console.log("  Stockist:           stockist1@pharmx.dev");
  console.log("  Distributor:        distributor1@pharmx.dev");

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
