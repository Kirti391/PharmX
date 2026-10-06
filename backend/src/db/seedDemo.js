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
const DoctorProfile = require("../models/DoctorProfile");
const Requirement = require("../models/Requirement");
const RequirementResponse = require("../models/RequirementResponse");
const Connection = require("../models/Connection");
const Appointment = require("../models/Appointment");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const VerificationDocument = require("../models/VerificationDocument");
const CompanyAuthorization = require("../models/CompanyAuthorization");

const DEMO_PASSWORD = "PharmXDemo!2026";
const DEMO_EXPIRY = new Date("2030-12-31T00:00:00.000Z");
const REGIONS = [
  { city: "Karnal", state: "Haryana" },
  { city: "Jaipur", state: "Rajasthan" },
  { city: "Pune", state: "Maharashtra" },
  { city: "Kochi", state: "Kerala" },
  { city: "Lucknow", state: "Uttar Pradesh" },
];
const CATEGORIES = [
  "Dermatology",
  "Cardiology",
  "Pediatrics",
  "General Medicine",
  "Neurology",
];
const MR_DEMO_DETAILS = [
  {
    experienceYears: 6,
    bio: "Fictional demo representative with a six-year track record supporting pharmacy teams across Karnal, Panipat, and Kurukshetra. Focused on ethical product education, territory planning, and reliable follow-up in dermatology and general medicine.",
    languages: ["Hindi", "English", "Punjabi"],
    specializations: ["Dermatology", "General Medicine"],
    territories: ["Karnal, Haryana", "Panipat, Haryana", "Kurukshetra, Haryana"],
    companiesRepresented: "Northstar Therapeutics",
    workMode: "HYBRID",
    isIndependent: false,
    availabilityStatus: "AVAILABLE",
  },
  {
    experienceYears: 4,
    bio: "Fictional demo representative experienced in building pharmacy relationships across Jaipur, Ajmer, and nearby Rajasthan districts. Provides compliant product information and structured account follow-up for cardiology and pediatrics.",
    languages: ["Hindi", "English", "Rajasthani"],
    specializations: ["Cardiology", "Pediatrics"],
    territories: ["Jaipur, Rajasthan", "Ajmer, Rajasthan", "Sikar, Rajasthan"],
    companiesRepresented: "Asterion Life Sciences",
    workMode: "FIELD",
    isIndependent: false,
    availabilityStatus: "AVAILABLE",
  },
  {
    experienceYears: 6,
    bio: "Fictional demo representative serving Pune, Pimpri-Chinchwad, and Satara. Supports professional education and territory coordination across general medicine and neurology.",
    languages: ["Marathi", "Hindi", "English"],
    specializations: ["General Medicine", "Neurology"],
    territories: ["Pune, Maharashtra", "Pimpri-Chinchwad, Maharashtra", "Satara, Maharashtra"],
    companiesRepresented: "BluePeak Pharma",
    workMode: "HYBRID",
    isIndependent: false,
    availabilityStatus: "AVAILABLE",
  },
  {
    experienceYears: 8,
    bio: "Fictional demo representative with broad field experience in Kochi, Thrissur, and Ernakulam. Currently balancing an established pharmacy network with scheduled territory visits across pediatrics and general medicine.",
    languages: ["Malayalam", "English", "Tamil"],
    specializations: ["Pediatrics", "General Medicine"],
    territories: ["Kochi, Kerala", "Thrissur, Kerala", "Ernakulam, Kerala"],
    companiesRepresented: "Cedar Health Labs",
    workMode: "FIELD",
    isIndependent: false,
    availabilityStatus: "BUSY",
  },
  {
    experienceYears: 10,
    bio: "Fictional independent demo representative covering Lucknow, Kanpur, and nearby Uttar Pradesh districts. Brings ten years of compliant field experience across neurology and dermatology, with flexible multi-company engagement.",
    languages: ["Hindi", "English", "Urdu"],
    specializations: ["Neurology", "Dermatology"],
    territories: ["Lucknow, Uttar Pradesh", "Kanpur, Uttar Pradesh", "Barabanki, Uttar Pradesh"],
    companiesRepresented: "Independent · multi-company portfolio",
    workMode: "HYBRID",
    isIndependent: true,
    availabilityStatus: "AVAILABLE",
  },
];

function emailFor(role, index) {
  return `demo.${role.toLowerCase()}.${String(index + 1).padStart(2, "0")}@pharmx.dev`;
}

async function upsertUser(role, index) {
  const email = emailFor(role, index);
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  return User.findOneAndUpdate(
    { email },
    {
      $setOnInsert: {
        email,
        mobile: `988${String(Object.keys(ROLE_NAMES).indexOf(role) + 1)}${String(index + 1).padStart(6, "0")}`,
        passwordHash,
        role,
        status: "ACTIVE",
      },
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
}

async function upsert(Model, filter, data) {
  return Model.findOneAndUpdate(
    filter,
    { $set: data },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
}

const ROLE_NAMES = {
  ADMIN: [
    "Demo Admin One",
    "Demo Admin Two",
    "Demo Admin Three",
    "Demo Admin Four",
    "Demo Admin Five",
  ],
  PHARMA_COMPANY: [
    "Northstar Therapeutics",
    "Asterion Life Sciences",
    "BluePeak Pharma",
    "Cedar Health Labs",
    "Meridian Biocare",
  ],
  MR: [
    "Aarav Mehta",
    "Ishita Rao",
    "Kabir Nair",
    "Nisha Iyer",
    "Vihaan Shah",
  ],
  PHARMACY: [
    "GreenCross Pharmacy",
    "WellSpring Medicals",
    "CityCare Pharmacy",
    "Maple Community Pharmacy",
    "Harborview Pharmacy",
  ],
  DISTRIBUTOR_STOCKIST: [
    "CareRoute Stockists",
    "MedAxis Distribution",
    "CureBridge Wholesale",
    "Evergreen Pharma Supply",
    "HealthGrid Distributors",
  ],
  DOCTOR: [
    "Dr. Anika Malhotra",
    "Dr. Dev Menon",
    "Dr. Farah Qureshi",
    "Dr. Kunal Desai",
    "Dr. Leela Nambiar",
  ],
};

async function seedDemoData() {
  if (env.nodeEnv === "production") {
    throw new Error("Demo data is disabled in production.");
  }
  const databaseHost = new URL(env.mongoUri).hostname;
  if (
    !["localhost", "127.0.0.1", "::1"].includes(databaseHost) &&
    process.env.PHARMX_ALLOW_REMOTE_DEMO_SEED !== "true"
  ) {
    throw new Error(
      "Demo seeding is restricted to local MongoDB. Set PHARMX_ALLOW_REMOTE_DEMO_SEED=true only for a dedicated non-production test database."
    );
  }

  await mongoose.connect(env.mongoUri);
  try {
    const users = {};
    const profiles = {};
    for (const role of Object.keys(ROLE_NAMES)) {
      users[role] = [];
      profiles[role] = [];
      const count = 5;

      for (let index = 0; index < count; index += 1) {
        const user = await upsertUser(role, index);
        users[role].push(user);
        const region = REGIONS[index % REGIONS.length];
        const category = CATEGORIES[index % CATEGORIES.length];
        const name = ROLE_NAMES[role][index];
        let profile = null;

        if (role === "PHARMA_COMPANY") {
          profile = await upsert(PharmaCompanyProfile, { userId: user._id }, {
            userId: user._id,
            companyName: name,
            description: `Fictional demo pharmaceutical company focused on ${category.toLowerCase()} and professional education.`,
            manufacturingLocation: `${region.city}, ${region.state}`,
            areasOfOperation: [region.state, "National"],
            productCategories: [category, CATEGORIES[(index + 1) % CATEGORIES.length]],
            website: `https://demo${index + 1}.pharmx.dev`,
            contactPersonName: `Contact Person ${index + 1}`,
            contactPersonDesignation: "Professional Relations",
            businessVerified: true,
            verificationStatus: "VERIFIED",
            verificationDate: new Date(),
          });
        } else if (role === "MR") {
          const details = MR_DEMO_DETAILS[index];
          profile = await upsert(MRProfile, { userId: user._id }, {
            userId: user._id,
            fullName: name,
            ...details,
          });
        } else if (role === "PHARMACY") {
          profile = await upsert(PharmacyProfile, { userId: user._id }, {
            userId: user._id,
            pharmacyName: name,
            displayName: name,
            pharmacyType: "Community Pharmacy",
            description: `Fictional demo pharmacy in ${region.city} exploring verified ${category.toLowerCase()} suppliers.`,
            yearEstablished: 2010 + index,
            ownershipType: "Partnership",
            location: `${region.city}, ${region.state}`,
            city: region.city,
            district: region.city,
            state: region.state,
            pinCode: `56000${index + 1}`,
            serviceArea: `${region.city} and nearby areas`,
            drugLicenceNumber: `DEMO-DL-${index + 1}`,
            licenceType: "Retail & Wholesale",
            licenceExpiryDate: DEMO_EXPIRY,
            licensingAuthority: `${region.state} Drug Control`,
            businessRegistration: `DEMO-BR-${index + 1}`,
            pharmacistDetails: {
              name: `Registered Pharmacist ${index + 1}`,
              registrationNumber: `DEMO-PH-${index + 1}`,
              qualification: "B.Pharm",
              registrationAuthority: `${region.state} Pharmacy Council`,
            },
            businessVerified: true,
            verificationStatus: "VERIFIED",
            lastVerifiedDate: new Date(),
            nextVerificationDate: DEMO_EXPIRY,
            interestedCategories: [category],
            preferredSuppliers: ["Verified suppliers"],
            demandRange: ["Small", "Medium", "Large", "Medium", "Small"][index],
            deliveryPreferences: ["Scheduled delivery", "Order tracking"],
            urgentSupplyRequirement: index % 2 === 0,
            preferredCommunicationMethod: "PharmUnis Messages",
            privacy: {
              showBusinessContact: true,
              showExactAddress: false,
              allowSupplierMessages: true,
              allowMRMessages: true,
              allowConnectionRequests: true,
            },
          });
        } else if (role === "DISTRIBUTOR_STOCKIST") {
          profile = await upsert(StockistProfile, { userId: user._id }, {
            userId: user._id,
            companyName: name,
            type: ["STOCKIST", "DISTRIBUTOR", "C_AND_F_AGENT", "STOCKIST", "DISTRIBUTOR"][index],
            serviceAreas: [region.state, region.city],
            productCategories: [category, CATEGORIES[(index + 1) % CATEGORIES.length]],
            associatedCompanies: [ROLE_NAMES.PHARMA_COMPANY[index]],
            businessVerified: true,
            licenceExpiryDate: DEMO_EXPIRY,
          });
        } else if (role === "DOCTOR") {
          profile = await upsert(DoctorProfile, { userId: user._id }, {
            userId: user._id,
            fullName: name,
            specialty: category,
            subspecialty: `${category} practice`,
            qualification: "MBBS, MD (Demo)",
            registrationCouncil: `${region.state} Medical Council`,
            registrationNumber: `DEMO-MC-${String(index + 1).padStart(4, "0")}`,
            registrationStatus: "VERIFIED",
            clinicHospitalAffiliation: `${region.city} Community Health Centre`,
            location: `${region.city}, ${region.state}`,
            languages: ["English", "Hindi"],
            professionalInterests: [category, "Clinical education"],
            acceptsMRRequests: true,
            acceptsCompanyInformation: true,
            acceptedCategories: [category],
            communicationModes: ["VIDEO", "PHYSICAL"],
            appointmentDurationMinutes: 30,
            maximumRequestsPerWeek: 5,
            businessVerified: true,
            verificationDate: new Date(),
            reVerificationDate: DEMO_EXPIRY,
          });
        }
        if (profile) profiles[role].push(profile);
      }
    }

    const admin = users.ADMIN[0];
    for (let index = 0; index < 5; index += 1) {
      await upsert(
        VerificationDocument,
        { userId: users.PHARMA_COMPANY[index]._id, docType: "BUSINESS_REG" },
        {
          userId: users.PHARMA_COMPANY[index]._id,
          docType: "BUSINESS_REG",
          fileUrl: "/uploads/demo-verification-placeholder.txt",
          status: "APPROVED",
          reviewedBy: admin._id,
          reviewedAt: new Date(),
        }
      );
      await upsert(
        VerificationDocument,
        { userId: users.MR[index]._id, docType: "ID_PROOF" },
        {
          userId: users.MR[index]._id,
          docType: "ID_PROOF",
          fileUrl: "/uploads/demo-verification-placeholder.txt",
          status: "APPROVED",
          reviewedBy: admin._id,
          reviewedAt: new Date(),
        }
      );
      const authorizationDoc = await upsert(
        VerificationDocument,
        {
          userId: users.MR[index]._id,
          docType: "COMPANY_AUTHORIZATION",
          companyId: profiles.PHARMA_COMPANY[index]._id,
        },
        {
          userId: users.MR[index]._id,
          docType: "COMPANY_AUTHORIZATION",
          companyId: profiles.PHARMA_COMPANY[index]._id,
          fileUrl: "/uploads/demo-verification-placeholder.txt",
          status: "APPROVED",
          reviewedBy: admin._id,
          reviewedAt: new Date(),
        }
      );
      await upsert(
        VerificationDocument,
        { userId: users.DOCTOR[index]._id, docType: "MEDICAL_REGISTRATION" },
        {
          userId: users.DOCTOR[index]._id,
          docType: "MEDICAL_REGISTRATION",
          fileUrl: "/uploads/demo-verification-placeholder.txt",
          status: "APPROVED",
          reviewedBy: admin._id,
          reviewedAt: new Date(),
        }
      );
      await upsert(
        CompanyAuthorization,
        {
          companyId: profiles.PHARMA_COMPANY[index]._id,
          mrUserId: users.MR[index]._id,
        },
        {
          companyId: profiles.PHARMA_COMPANY[index]._id,
          mrUserId: users.MR[index]._id,
          requestedBy: users.PHARMA_COMPANY[index]._id,
          verificationDocumentId: authorizationDoc._id,
          categories: [CATEGORIES[index]],
          territories: [REGIONS[index].state, REGIONS[index].city],
          status: "ACTIVE",
          expiresAt: DEMO_EXPIRY,
          reviewedBy: admin._id,
          reviewedAt: new Date(),
        }
      );
    }

    const requirements = [];
    for (let index = 0; index < 5; index += 1) {
      for (const targetRole of ["DISTRIBUTOR_STOCKIST", "MR", "COMPANY"]) {
        requirements.push(await upsert(
          Requirement,
          {
            ownerId: profiles.PHARMACY[index]._id,
            title: `Demo ${CATEGORIES[index]} ${targetRole.toLowerCase().replaceAll("_", " ")} request`,
          },
          {
            pharmacyId: profiles.PHARMACY[index]._id,
            ownerId: profiles.PHARMACY[index]._id,
            ownerRole: "PHARMACY",
            targetRole,
            category: CATEGORIES[index],
            title: `Demo ${CATEGORIES[index]} ${targetRole.toLowerCase().replaceAll("_", " ")} request`,
            description: `Fictional test requirement from ${ROLE_NAMES.PHARMACY[index]} in ${REGIONS[index].city}. Please respond with relevant professional availability or supply coverage.`,
            urgency: index % 2 ? "NORMAL" : "HIGH",
            status: "OPEN",
          }
        ));
      }
    }

    const conversations = [];
    for (let index = 0; index < 5; index += 1) {
      const pharmacyUser = users.PHARMACY[index];

      const connectionPartners = [
        users.PHARMA_COMPANY[index],
        users.MR[index],
        users.DISTRIBUTOR_STOCKIST[index],
      ];
      for (const partner of connectionPartners) {
        await upsert(
          Connection,
          { requesterId: pharmacyUser._id, recipientId: partner._id },
          {
            requesterId: pharmacyUser._id,
            recipientId: partner._id,
            status: "ACCEPTED",
            message: "Fictional demo connection for workflow testing.",
            respondedAt: new Date(),
          }
        );
        let conversation = await Conversation.findOne({
          participantIds: { $all: [pharmacyUser._id, partner._id], $size: 2 },
        });
        if (!conversation) {
          conversation = await Conversation.create({
            participantIds: [pharmacyUser._id, partner._id],
          });
        }
        conversations.push({ conversation, firstUser: pharmacyUser, secondUser: partner });
      }

      const doctorUser = users.DOCTOR[index];
      const mrUser = users.MR[index];
      const meetingDate = new Date(Date.now() + (index + 2) * 86400000);
      await upsert(
        Appointment,
        {
          requesterId: mrUser._id,
          recipientId: doctorUser._id,
          purposeCategory: CATEGORIES[index],
          notes: `Fictional demo appointment ${index + 1}`,
        },
        {
          requesterId: mrUser._id,
          recipientId: doctorUser._id,
          scheduledAt: meetingDate,
          durationMinutes: 30,
          mode: index % 2 ? "PHYSICAL" : "VIDEO",
          status: "CONFIRMED",
          purposeCategory: CATEGORIES[index],
          notes: `Fictional demo appointment ${index + 1}`,
        }
      );
      await upsert(
        Appointment,
        {
          requesterId: users.PHARMA_COMPANY[index]._id,
          recipientId: doctorUser._id,
          purposeCategory: CATEGORIES[index],
          notes: `Fictional pending demo request ${index + 1}`,
        },
        {
          requesterId: users.PHARMA_COMPANY[index]._id,
          recipientId: doctorUser._id,
          scheduledAt: new Date(Date.now() + (index + 4) * 86400000),
          durationMinutes: 30,
          mode: "VIDEO",
          status: "REQUESTED",
          purposeCategory: CATEGORIES[index],
          notes: `Fictional pending demo request ${index + 1}`,
        }
      );
      const responseRequirement = await Requirement.findOne({
        ownerId: profiles.PHARMACY[index]._id,
        targetRole: "DISTRIBUTOR_STOCKIST",
        status: "OPEN",
      });
      if (!responseRequirement) {
        throw new Error(`Expected distributor requirement fixture for pharmacy ${index + 1}`);
      }
      await upsert(
        RequirementResponse,
        {
          requirementId: responseRequirement._id,
          responderUserId: users.DISTRIBUTOR_STOCKIST[index]._id,
        },
        {
          requirementId: responseRequirement._id,
          responderUserId: users.DISTRIBUTOR_STOCKIST[index]._id,
          responderRole: "DISTRIBUTOR_STOCKIST",
          message: `We serve ${REGIONS[index].city} and can support the ${CATEGORIES[index]} requirement. This is a fictional demo response.`,
          status: "PENDING",
        }
      );
      let doctorConversation = await Conversation.findOne({
        participantIds: { $all: [mrUser._id, doctorUser._id], $size: 2 },
      });
      if (!doctorConversation) {
        doctorConversation = await Conversation.create({
          participantIds: [mrUser._id, doctorUser._id],
        });
      }
      conversations.push({ conversation: doctorConversation, firstUser: mrUser, secondUser: doctorUser });
    }

    for (const { conversation, firstUser, secondUser } of conversations) {
      const body = "Hello! This is a fictional PharmX demo conversation for testing.";
      const message = await upsert(
        Message,
        { conversationId: conversation._id, senderId: firstUser._id, body },
        {
          conversationId: conversation._id,
          senderId: firstUser._id,
          body,
        }
      );
      await upsert(
        Message,
        {
          conversationId: conversation._id,
          senderId: secondUser._id,
          body: "Thanks, I can see the demo message and will follow up here.",
        },
        {
          conversationId: conversation._id,
          senderId: secondUser._id,
          body: "Thanks, I can see the demo message and will follow up here.",
          readAt: new Date(),
        }
      );
      await Conversation.updateOne(
        { _id: conversation._id },
        { $set: { lastMessageAt: message.createdAt } }
      );
    }

    console.log("Demo seed complete (additive; no existing records were deleted).");
    console.log(`Shared demo password: ${DEMO_PASSWORD}`);
    for (const role of Object.keys(ROLE_NAMES)) {
      console.log(`${role}: ${users[role].map((user) => user.email).join(", ")}`);
    }
    console.log(`Created or refreshed ${requirements.length} requirement fixtures.`);
    console.log(`Created ${conversations.length} authorized demo conversations.`);
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  seedDemoData().catch((error) => {
    console.error("Demo seed failed:", error);
    process.exitCode = 1;
  });
}

module.exports = { seedDemoData };
