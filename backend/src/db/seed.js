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
const Product = require("../models/Product");
const DoctorProfile = require("../models/DoctorProfile");
const RequirementResponse = require("../models/RequirementResponse");
const OpportunityApplication = require("../models/OpportunityApplication");
const Connection = require("../models/Connection");
const Appointment = require("../models/Appointment");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Notification = require("../models/Notification");
const Lead = require("../models/Lead");
const FollowUp = require("../models/FollowUp");
const VerificationDocument = require("../models/VerificationDocument");

const DEMO_PASSWORD = "Password123!";

async function upsertUser(email, mobile, role, status = "ACTIVE") {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  return User.findOneAndUpdate(
    { email },
    { $set: { mobile, passwordHash, role, status } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
}

async function upsertDemoRecord(Model, filter, data) {
  return Model.findOneAndUpdate(
    filter,
    { $setOnInsert: data },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
}

async function run() {
  if (env.nodeEnv === "production") {
    throw new Error("The demo seed cannot run when NODE_ENV=production.");
  }

  await mongoose.connect(env.mongoUri);
  console.log("Connected. Seeding PharmX demo data...");

  // --- Admin ---
  const adminUser = await upsertUser("admin@pharmx.dev", "9990000001", "ADMIN");

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
  await PharmaCompanyProfile.updateOne(
    { _id: company._id },
    {
      $set: {
        businessVerified: true,
        verificationStatus: "VERIFIED",
        verificationDate: new Date(),
      },
    }
  );

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
  const mr2User = await upsertUser("mr2@pharmx.dev", "9990000004", "MR");
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
  const pendingUser = await upsertUser("pending.pharmacy@pharmx.dev", "9990000006", "PHARMACY");
  if (!(await PharmacyProfile.findOne({ userId: pendingUser._id }))) {
    await PharmacyProfile.create({
      userId: pendingUser._id,
      pharmacyName: "New Life Pharmacy",
      location: "Sonipat, Haryana",
    });
  }

  // Keep the verification-workflow account sign-in capable. Business review
  // status is represented on its profile, not as an account-login restriction.
  await PharmacyProfile.updateOne(
    { userId: pendingUser._id },
    { $set: { verificationStatus: "PENDING", businessVerified: false } }
  );

  // --- Stockist ---
  const stockistUser = await upsertUser("stockist1@pharmx.dev", "9990000007", "DISTRIBUTOR_STOCKIST");
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
  const distributorUser = await upsertUser("distributor1@pharmx.dev", "9990000008", "DISTRIBUTOR_STOCKIST");
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

  // --- Doctor profile ---
  const doctorUser = await upsertUser("doctor1@pharmx.dev", "9990000009", "DOCTOR");
  const doctor = await upsertDemoRecord(
    DoctorProfile,
    { userId: doctorUser._id },
    {
      userId: doctorUser._id,
      fullName: "Dr. Meera Kapoor",
      specialty: "Dermatology",
      subspecialty: "Clinical Dermatology",
      qualification: "MBBS, MD Dermatology",
      registrationCouncil: "Haryana Medical Council",
      registrationNumber: "DEMO-HMC-1042",
      registrationStatus: "VERIFIED",
      clinicHospitalAffiliation: "Lotus Skin & Wellness Clinic",
      location: "Karnal, Haryana",
      languages: ["Hindi", "English"],
      professionalInterests: ["Dermatology", "Patient education"],
      acceptsMRRequests: true,
      acceptsCompanyInformation: true,
      acceptedCategories: ["Dermatology"],
      communicationModes: ["VIDEO", "PHYSICAL"],
      appointmentDurationMinutes: 30,
      maximumRequestsPerWeek: 8,
      businessVerified: true,
      verificationDate: new Date(),
    }
  );

  // The static file is explicitly marked as a mock so nobody mistakes it for
  // a real licence or registration document.
  await upsertDemoRecord(
    VerificationDocument,
    { userId: companyUser._id, docType: "BUSINESS_REG" },
    {
      userId: companyUser._id,
      docType: "BUSINESS_REG",
      fileUrl: "/uploads/demo-verification-placeholder.txt",
      status: "APPROVED",
      reviewedBy: adminUser._id,
      reviewedAt: new Date(),
    }
  );
  await upsertDemoRecord(
    VerificationDocument,
    { userId: doctorUser._id, docType: "MEDICAL_REGISTRATION" },
    {
      userId: doctorUser._id,
      docType: "MEDICAL_REGISTRATION",
      fileUrl: "/uploads/demo-verification-placeholder.txt",
      status: "APPROVED",
      reviewedBy: adminUser._id,
      reviewedAt: new Date(),
    }
  );
  await upsertDemoRecord(
    VerificationDocument,
    { userId: pendingUser._id, docType: "DRUG_LICENSE" },
    {
      userId: pendingUser._id,
      docType: "DRUG_LICENSE",
      fileUrl: "/uploads/demo-verification-placeholder.txt",
      status: "PENDING",
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    }
  );

  // --- Product catalogue fixtures ---
  const products = await Promise.all([
    upsertDemoRecord(
      Product,
      { companyId: company._id, name: "DermaClear Cream" },
      {
        companyId: company._id,
        createdBy: companyUser._id,
        name: "DermaClear Cream",
        category: "Dermatology",
        activeIngredient: "Demo formulation",
        strength: "1%",
        dosageForm: "Topical cream",
        packSize: "20 g",
        description: "Sample catalogue listing for exploring product details.",
        status: "PUBLISHED",
      }
    ),
    upsertDemoRecord(
      Product,
      { companyId: company._id, name: "CardioBalance Tablets" },
      {
        companyId: company._id,
        createdBy: companyUser._id,
        name: "CardioBalance Tablets",
        category: "Cardiology",
        activeIngredient: "Demo formulation",
        strength: "5 mg",
        dosageForm: "Tablet",
        packSize: "10 tablets",
        description: "Sample listing with structured strength and pack information.",
        status: "PUBLISHED",
      }
    ),
    upsertDemoRecord(
      Product,
      { companyId: company._id, name: "Vertex Sample Draft" },
      {
        companyId: company._id,
        createdBy: companyUser._id,
        name: "Vertex Sample Draft",
        category: "General Medicine",
        description: "Draft product fixture for the company catalogue workspace.",
        status: "DRAFT",
      }
    ),
  ]);

  // --- Marketplace posts, replies, and applications ---
  const requirement = await upsertDemoRecord(
    Requirement,
    { ownerId: pharmacyUser._id, title: "Looking for dermatology product line" },
    {
      pharmacyId: pharmacy._id,
      ownerId: pharmacyUser._id,
      ownerRole: "PHARMACY",
      targetRole: "DISTRIBUTOR_STOCKIST",
      category: "Dermatology",
      title: "Looking for dermatology product line",
      description:
        "We get frequent requests for acne and pigmentation treatments and want a reliable supplier for a steady weekly replenishment.",
      urgency: "HIGH",
      status: "OPEN",
    }
  );
  const mrRequirement = await upsertDemoRecord(
    Requirement,
    { ownerId: pharmacyUser._id, title: "Seeking a local dermatology representative" },
    {
      pharmacyId: pharmacy._id,
      ownerId: pharmacyUser._id,
      ownerRole: "PHARMACY",
      targetRole: "MR",
      category: "Dermatology",
      title: "Seeking a local dermatology representative",
      description:
        "Our team would like a product briefing and a local point of contact for dermatology updates.",
      urgency: "NORMAL",
      status: "OPEN",
    }
  );
  const opportunity = await upsertDemoRecord(
    Opportunity,
    { companyId: company._id, title: "Field MR needed — Haryana dermatology line" },
    {
      companyId: company._id,
      type: "MR_HIRING",
      title: "Field MR needed — Haryana dermatology line",
      description:
        "Vertex Biosciences is expanding its dermatology range into Haryana and welcomes experienced and independent MRs.",
      categories: ["Dermatology"],
      territories: ["Haryana", "Karnal"],
      status: "OPEN",
      expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    }
  );

  await upsertDemoRecord(
    RequirementResponse,
    { requirementId: requirement._id, responderUserId: stockistUser._id },
    {
      requirementId: requirement._id,
      responderUserId: stockistUser._id,
      responderRole: "DISTRIBUTOR_STOCKIST",
      message:
        "We serve Karnal and can share our dermatology range and delivery schedule.",
      status: "PENDING",
    }
  );
  await upsertDemoRecord(
    RequirementResponse,
    { requirementId: mrRequirement._id, responderUserId: mr1User._id },
    {
      requirementId: mrRequirement._id,
      responderUserId: mr1User._id,
      responderRole: "MR",
      message:
        "I cover Karnal and can arrange a short dermatology product briefing.",
      status: "SHORTLISTED",
    }
  );
  await upsertDemoRecord(
    OpportunityApplication,
    { opportunityId: opportunity._id, applicantUserId: mr1User._id },
    {
      opportunityId: opportunity._id,
      applicantUserId: mr1User._id,
      status: "SHORTLISTED",
    }
  );

  // --- Connections, appointments, and messages ---
  const acceptedConnection = await upsertDemoRecord(
    Connection,
    { requesterId: pharmacyUser._id, recipientId: mr1User._id },
    {
      requesterId: pharmacyUser._id,
      recipientId: mr1User._id,
      status: "ACCEPTED",
      message: "Let's stay in touch about dermatology product updates.",
      respondedAt: new Date(),
    }
  );
  await Connection.updateOne(
    { _id: acceptedConnection._id },
    { $set: { status: "ACCEPTED", respondedAt: acceptedConnection.respondedAt || new Date() } }
  );
  await upsertDemoRecord(
    Connection,
    { requesterId: pharmacyUser._id, recipientId: distributorUser._id },
    {
      requesterId: pharmacyUser._id,
      recipientId: distributorUser._id,
      status: "PENDING",
      message: "Please share your supply coverage and product categories.",
    }
  );

  await upsertDemoRecord(
    Appointment,
    { requesterId: mr1User._id, recipientId: doctorUser._id, purposeCategory: "Dermatology" },
    {
      requesterId: mr1User._id,
      recipientId: doctorUser._id,
      scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      durationMinutes: 30,
      mode: "VIDEO",
      status: "CONFIRMED",
      purposeCategory: "Dermatology",
      notes: "Demo appointment to explore the professional appointment workflow.",
    }
  );
  let conversation = await Conversation.findOne({
    participantIds: { $all: [pharmacyUser._id, mr1User._id] },
  });
  if (!conversation) {
    conversation = await Conversation.create({
      participantIds: [pharmacyUser._id, mr1User._id],
      lastMessageAt: new Date(),
    });
  }
  const firstMessage = await upsertDemoRecord(
    Message,
    {
      conversationId: conversation._id,
      senderId: mr1User._id,
      body: "Hello from the demo workspace. I can share the dermatology catalogue and arrange a visit.",
    },
    {
      conversationId: conversation._id,
      senderId: mr1User._id,
      body: "Hello from the demo workspace. I can share the dermatology catalogue and arrange a visit.",
    }
  );
  await upsertDemoRecord(
    Message,
    { conversationId: conversation._id, senderId: pharmacyUser._id, body: "Thanks, please send the product details." },
    {
      conversationId: conversation._id,
      senderId: pharmacyUser._id,
      body: "Thanks, please send the product details.",
      readAt: new Date(),
    }
  );
  await Conversation.updateOne(
    { _id: conversation._id },
    { $set: { lastMessageAt: firstMessage.createdAt } }
  );
  // --- MR CRM sample ---
  const lead = await upsertDemoRecord(
    Lead,
    { createdBy: mr1User._id, title: "Sunrise Pharmacy — dermatology follow-up" },
    {
      createdBy: mr1User._id,
      ownerRole: "MR",
      targetUserId: pharmacyUser._id,
      requirementId: mrRequirement._id,
      source: "REQUIREMENT",
      title: "Sunrise Pharmacy — dermatology follow-up",
      category: "Dermatology",
      territory: "Karnal, Haryana",
      priority: "HIGH",
      stage: "FOLLOW_UP",
      notes: "Demo lead linked to the open pharmacy requirement.",
      nextFollowUpAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      history: [{
        fromStage: null,
        toStage: "NEW",
        actorId: mr1User._id,
        reason: "Seeded demo record",
      }, {
        fromStage: "NEW",
        toStage: "FOLLOW_UP",
        actorId: mr1User._id,
        reason: "Demo follow-up scheduled",
      }],
    }
  );
  await upsertDemoRecord(
    FollowUp,
    { leadId: lead._id, ownerUserId: mr1User._id, notes: "Demo follow-up: share product details." },
    {
      leadId: lead._id,
      ownerUserId: mr1User._id,
      createdBy: mr1User._id,
      dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      status: "PENDING",
      notes: "Demo follow-up: share product details.",
    }
  );

  await upsertDemoRecord(
    Lead,
    { createdBy: companyUser._id, title: "Sunrise Pharmacy — catalogue introduction" },
    {
      createdBy: companyUser._id,
      ownerRole: "PHARMA_COMPANY",
      ownerCompanyId: company._id,
      targetUserId: pharmacyUser._id,
      requirementId: requirement._id,
      source: "REQUIREMENT",
      title: "Sunrise Pharmacy — catalogue introduction",
      category: "Dermatology",
      territory: "Karnal, Haryana",
      priority: "NORMAL",
      stage: "CONTACT_REQUESTED",
      notes: "Demo company lead linked to the pharmacy requirement.",
      history: [{
        fromStage: null,
        toStage: "CONTACT_REQUESTED",
        actorId: companyUser._id,
        reason: "Seeded demo record",
      }],
    }
  );

  await upsertDemoRecord(
    Lead,
    { createdBy: distributorUser._id, title: "Sunrise Pharmacy — supply partnership" },
    {
      createdBy: distributorUser._id,
      ownerRole: "DISTRIBUTOR_STOCKIST",
      targetUserId: pharmacyUser._id,
      requirementId: requirement._id,
      source: "REQUIREMENT",
      title: "Sunrise Pharmacy — supply partnership",
      category: "Dermatology",
      territory: "Karnal, Haryana",
      priority: "NORMAL",
      stage: "NEW",
      notes: "Demo distributor lead linked to the pharmacy requirement.",
      history: [{
        fromStage: null,
        toStage: "NEW",
        actorId: distributorUser._id,
        reason: "Seeded demo record",
      }],
    }
  );

  const notificationFixtures = [
    [pharmacyUser, "REQUIREMENT_MATCH", "Suppliers found for your requirement", "Your dermatology requirement has a matching distributor."],
    [mr1User, "OPPORTUNITY_MATCH", "A new opportunity matches your profile", "A dermatology opportunity is open in Haryana."],
    [mr1User, "MESSAGE", "New message from Sunrise Pharmacy", "Please send the product details."],
    [doctorUser, "APPOINTMENT_UPDATE", "Appointment confirmed", "Your video appointment is scheduled for the coming days."],
    [stockistUser, "REQUIREMENT_MATCH", "New requirement in your territory", "A pharmacy is looking for dermatology products."],
    [companyUser, "SYSTEM", "Welcome to your demo company workspace", "Explore your product catalogue and opportunity dashboard."],
    [distributorUser, "CONNECTION_REQUEST", "New connection request", "Sunrise Pharmacy would like to connect."],
    [adminUser, "SYSTEM", "Demo environment ready", "Seeded role accounts and sample workflows are available."],
    [mr2User, "SYSTEM", "Welcome to your independent MR workspace", "Explore sample profiles and opportunities in your territory."],
    [pendingUser, "VERIFICATION_UPDATE", "Verification review in progress", "Your sample drug licence is awaiting administrator review."],
  ];
  await Promise.all(
    notificationFixtures.map(([user, type, title, body]) =>
      upsertDemoRecord(
        Notification,
        { userId: user._id, title },
        { userId: user._id, type, title, body, readAt: null }
      )
    )
  );

  console.log(`Seed complete. Demo accounts (password for all: ${DEMO_PASSWORD}):`);
  console.log("  Admin:              admin@pharmx.dev");
  console.log("  Pharma Company:     company1@pharmx.dev");
  console.log("  MR:                 mr1@pharmx.dev");
  console.log("  Independent MR:     mr2@pharmx.dev");
  console.log("  Pharmacy:           pharmacy1@pharmx.dev");
  console.log("  Pharmacy (pending): pending.pharmacy@pharmx.dev");
  console.log("  Stockist:           stockist1@pharmx.dev");
  console.log("  Distributor:        distributor1@pharmx.dev");
  console.log("  Doctor:             doctor1@pharmx.dev");
  console.log(`  Added ${products.length} product fixtures and marketplace, appointment, connection, message, notification, and CRM samples.`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
