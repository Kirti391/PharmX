const { ApiError } = require("../../common/http");
const MRProfile = require("../../models/MRProfile");
const PharmaCompanyProfile = require("../../models/PharmaCompanyProfile");
const PharmacyProfile = require("../../models/PharmacyProfile");
const StockistProfile = require("../../models/StockistProfile");
const DoctorProfile = require("../../models/DoctorProfile");
const User = require("../../models/User");
const VerificationDocument = require("../../models/VerificationDocument");
const { normalizeRole } = require("../../common/constants");

// ============================================================
// MR
// ============================================================

function serializeMR(p) {
  return {
    id: p._id,
    userId: p.userId,
    fullName: p.fullName,
    profileImageUrl: p.profileImageUrl,
    experienceYears: p.experienceYears,
    bio: p.bio,
    languages: p.languages,
    specializations: p.specializations,
    territories: p.territories,
    companiesRepresented: p.companiesRepresented,
    workMode: p.workMode,
    isIndependent: p.isIndependent,
    availabilityStatus: p.availabilityStatus,
    updatedAt: p.updatedAt,
  };
}

async function getMRProfileByUserId(userId) {
  const p = await MRProfile.findOne({ userId });

  if (!p) {
    throw new ApiError(404, "NOT_FOUND", "MR profile not found");
  }

  return serializeMR(p);
}

async function getMRProfileById(id) {
  const p = await MRProfile.findById(id);

  if (!p) {
    throw new ApiError(404, "NOT_FOUND", "MR profile not found");
  }

  return serializeMR(p);
}

async function updateMRProfile(userId, patch) {
  const allowedFields = [
    "fullName",
    "profileImageUrl",
    "experienceYears",
    "bio",
    "languages",
    "specializations",
    "territories",
    "workMode",
    "isIndependent",
    "availabilityStatus",
  ];
  const safePatch = {};
  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(patch, field)) {
      safePatch[field] = patch[field];
    }
  }

  const p = await MRProfile.findOneAndUpdate(
    { userId },
    { $set: safePatch },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!p) {
    throw new ApiError(404, "NOT_FOUND", "MR profile not found");
  }

  return serializeMR(p);
}

async function listMRs({ territory, specialization, workMode, excludeUserId }) {
  const query = {};

  if (workMode) {
    query.workMode = workMode;
  }

  if (territory) {
    query.territories = {
      $regex: territory,
      $options: "i",
    };
  }

  if (specialization) {
    query.specializations = {
      $regex: specialization,
      $options: "i",
    };
  }

  const [verifiedUsers, activeUsers] = await Promise.all([
    VerificationDocument.distinct("userId", {
      docType: "ID_PROOF",
      status: "APPROVED",
    }),
    User.distinct("_id", { status: "ACTIVE" }),
  ]);
  const activeIds = new Set(
    activeUsers.map((id) => id.toString())
  );
  query.userId = {
    $in: verifiedUsers.filter(
      (id) =>
        activeIds.has(id.toString()) &&
        id.toString() !== String(excludeUserId || "")
    ),
  };

  const rows = await MRProfile.find(query)
    .sort({ updatedAt: -1 });

  return rows.map(serializeMR);
}

// ============================================================
// Pharma Company
// ============================================================

function serializePharma(p, includePrivate = false) {
  return {
    id: p._id,
    userId: p.userId,

    companyName: p.companyName,
    logoUrl: p.logoUrl,
    description: p.description,

    manufacturingLocation: p.manufacturingLocation,
    areasOfOperation: p.areasOfOperation,
    productCategories: p.productCategories,

    website: p.website,
    ...(includePrivate
      ? {
          contactPersonName: p.contactPersonName,
          contactPersonDesignation: p.contactPersonDesignation,
        }
      : {}),

    businessVerified: p.businessVerified,
    verificationStatus: p.verificationStatus,
    verificationDate: p.verificationDate,

    updatedAt: p.updatedAt,
  };
}

async function getPharmaProfileByUserId(userId) {
  const p = await PharmaCompanyProfile.findOne({ userId });

  if (!p) {
    throw new ApiError(
      404,
      "NOT_FOUND",
      "Company profile not found"
    );
  }

  return serializePharma(p, true);
}

async function getPharmaProfileById(id) {
  const p = await PharmaCompanyProfile.findById(id);

  if (!p) {
    throw new ApiError(
      404,
      "NOT_FOUND",
      "Company profile not found"
    );
  }

  return serializePharma(p);
}

async function updatePharmaProfile(userId, patch) {
  const allowedFields = [
    "companyName",
    "logoUrl",
    "description",
    "manufacturingLocation",
    "areasOfOperation",
    "productCategories",
    "website",
    "contactPersonName",
    "contactPersonDesignation",
  ];

  const safePatch = {};

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(patch, field)) {
      safePatch[field] = patch[field];
    }
  }

  const p = await PharmaCompanyProfile.findOneAndUpdate(
    { userId },
    { $set: safePatch },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!p) {
    throw new ApiError(
      404,
      "NOT_FOUND",
      "Company profile not found"
    );
  }

  return serializePharma(p);
}

async function listPharmaCompanies({ territory, category, excludeUserId }) {
  const query = {
    businessVerified: true,
    verificationStatus: "VERIFIED",
  };

  if (territory) {
    query.areasOfOperation = {
      $regex: territory,
      $options: "i",
    };
  }

  if (category) {
    query.productCategories = {
      $regex: category,
      $options: "i",
    };
  }

  const currentRegistrationUsers = await VerificationDocument.distinct(
    "userId",
    {
      docType: "BUSINESS_REG",
      status: "APPROVED",
      $or: [{ expiryDate: null }, { expiryDate: { $gt: new Date() } }],
    }
  );
  query.userId = {
    $in: currentRegistrationUsers,
    ...(excludeUserId ? { $ne: excludeUserId } : {}),
  };

  const rows = await PharmaCompanyProfile.find(query)
    .sort({ updatedAt: -1 });
  const activeUsers = new Set(
    (
      await User.distinct("_id", {
        _id: { $in: rows.map((row) => row.userId) },
        status: "ACTIVE",
      })
    ).map((id) => id.toString())
  );

  return rows
    .filter((row) => activeUsers.has(row.userId.toString()))
    .map(serializePharma);
}

// ============================================================
// Pharmacy
// ============================================================

function serializePharmacy(p, includePrivate = false) {
  return {
    id: p._id,
    userId: p.userId,

    // Basic information
    pharmacyName: p.pharmacyName,
    displayName: p.displayName,
    profileImage: p.profileImage,
    pharmacyType: p.pharmacyType,
    description: p.description,
    yearEstablished: p.yearEstablished,
    ownershipType: p.ownershipType,
    businessHours: p.businessHours,
    languages: p.languages,

    // Existing compatibility field
    location: p.location,

    // Location
    city: p.city,
    district: p.district,
    state: p.state,
    pinCode: p.pinCode,
    serviceArea: p.serviceArea,
    ...(includePrivate
      ? {
          exactAddress: p.exactAddress,
          showExactAddress: p.showExactAddress,
          mapLocation: p.mapLocation,
          drugLicenceNumber: p.drugLicenceNumber,
          licenceType: p.licenceType,
          licenceIssueDate: p.licenceIssueDate,
          licenceExpiryDate: p.licenceExpiryDate,
          licensingAuthority: p.licensingAuthority,
          gstin: p.gstin,
          businessRegistration: p.businessRegistration,
          pharmacistDetails: p.pharmacistDetails,
        }
      : {}),

    // Verification
    businessVerified: p.businessVerified,
    verificationStatus: p.verificationStatus,
    lastVerifiedDate: p.lastVerifiedDate,
    nextVerificationDate: p.nextVerificationDate,

    ...(includePrivate
      ? {
          verificationDocuments: p.verificationDocuments,
          verificationNotes: p.verificationNotes,
        }
      : {}),

    // Procurement
    interestedCategories: p.interestedCategories,
    newCompanyInterest: p.newCompanyInterest,
    alternativeBrandAcceptance: p.alternativeBrandAcceptance,
    deliveryPreferences: p.deliveryPreferences,
    coldChainRequirement: p.coldChainRequirement,
    urgentSupplyRequirement: p.urgentSupplyRequirement,

    // Communication
    ...(includePrivate
      ? {
          preferredSuppliers: p.preferredSuppliers,
          demandRange: p.demandRange,
          preferredCommunicationMethod: p.preferredCommunicationMethod,
          preferredMRVisitHours: p.preferredMRVisitHours,
          noVisitDays: p.noVisitDays,
          privacy: p.privacy,
        }
      : {}),

    // Existing appointment field
    preferredAppointmentWindows: p.preferredAppointmentWindows,

    updatedAt: p.updatedAt,
  };
}

async function getPharmacyProfileByUserId(userId) {
  const p = await PharmacyProfile.findOne({ userId });

  if (!p) {
    throw new ApiError(
      404,
      "NOT_FOUND",
      "Pharmacy profile not found"
    );
  }

  return serializePharmacy(p, true);
}

async function getPharmacyProfileById(id) {
  const p = await PharmacyProfile.findById(id);

  if (!p) {
    throw new ApiError(
      404,
      "NOT_FOUND",
      "Pharmacy profile not found"
    );
  }

  return serializePharmacy(p);
}

async function updatePharmacyProfile(userId, patch) {
  const allowedFields = [
    // Basic information
    "pharmacyName",
    "displayName",
    "profileImage",
    "pharmacyType",
    "description",
    "yearEstablished",
    "ownershipType",
    "businessHours",
    "languages",

    // Location
    "location",
    "city",
    "district",
    "state",
    "pinCode",
    "serviceArea",
    "exactAddress",
    "showExactAddress",
    "mapLocation",

    // Legal / licensing
    "drugLicenceNumber",
    "licenceType",
    "licenceIssueDate",
    "licensingAuthority",
    "gstin",
    "businessRegistration",
    "pharmacistDetails",

    // Procurement
    "interestedCategories",
    "preferredSuppliers",
    "newCompanyInterest",
    "alternativeBrandAcceptance",
    "demandRange",
    "deliveryPreferences",
    "coldChainRequirement",
    "urgentSupplyRequirement",

    // Communication
    "preferredCommunicationMethod",
    "preferredMRVisitHours",
    "noVisitDays",
    "preferredAppointmentWindows",

    // Privacy
    "privacy",
  ];

  const safePatch = {};

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(patch, field)) {
      safePatch[field] = patch[field];
    }
  }

  /*
   * Verification fields are intentionally NOT editable
   * through the normal pharmacy profile endpoint:
   *
   * businessVerified
   * verificationStatus
   * lastVerifiedDate
   * nextVerificationDate
   * verificationDocuments
   * verificationNotes
   *
   * Those should be controlled by the verification workflow/admin.
   */

  const p = await PharmacyProfile.findOneAndUpdate(
    { userId },
    { $set: safePatch },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!p) {
    throw new ApiError(
      404,
      "NOT_FOUND",
      "Pharmacy profile not found"
    );
  }

  return serializePharmacy(p);
}

async function listPharmacies({ territory, category, excludeUserId }) {
  const query = {
    businessVerified: true,
    verificationStatus: "VERIFIED",
  };

  if (excludeUserId) {
    query.userId = { $ne: excludeUserId };
  }

  if (territory) {
    query.location = {
      $regex: territory,
      $options: "i",
    };
  }

  if (category) {
    query.interestedCategories = {
      $regex: category,
      $options: "i",
    };
  }

  const rows = await PharmacyProfile.find(query)
    .sort({ updatedAt: -1 });
  const activeUsers = new Set(
    (
      await User.distinct("_id", {
        _id: { $in: rows.map((row) => row.userId) },
        status: "ACTIVE",
      })
    ).map((id) => id.toString())
  );

  const now = new Date();
  return rows
    .filter(
      (row) =>
        activeUsers.has(row.userId.toString()) &&
        (!row.licenceExpiryDate || row.licenceExpiryDate > now)
    )
    .map(serializePharmacy);
}

// ============================================================
// Stockist / Distributor
// ============================================================

function serializeStockist(p) {
  return {
    id: p._id,
    userId: p.userId,
    companyName: p.companyName,
    type: p.type,
    serviceAreas: p.serviceAreas,
    productCategories: p.productCategories,
    associatedCompanies: p.associatedCompanies,
    businessVerified: p.businessVerified,
    licenceExpiryDate: p.licenceExpiryDate,
    updatedAt: p.updatedAt,
  };
}

async function getStockistProfileByUserId(userId) {
  const p = await StockistProfile.findOne({ userId });

  if (!p) {
    throw new ApiError(
      404,
      "NOT_FOUND",
      "Stockist/distributor profile not found"
    );
  }

  return serializeStockist(p);
}

async function getStockistProfileById(id) {
  const p = await StockistProfile.findById(id);

  if (!p) {
    throw new ApiError(
      404,
      "NOT_FOUND",
      "Stockist/distributor profile not found"
    );
  }

  return serializeStockist(p);
}

async function updateStockistProfile(userId, patch) {
  const allowedFields = [
    "companyName",
    "type",
    "serviceAreas",
    "productCategories",
    "associatedCompanies",
  ];
  const safePatch = {};
  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(patch, field)) {
      safePatch[field] = patch[field];
    }
  }
  const p = await StockistProfile.findOneAndUpdate(
    { userId },
    { $set: safePatch },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!p) {
    throw new ApiError(
      404,
      "NOT_FOUND",
      "Stockist/distributor profile not found"
    );
  }

  return serializeStockist(p);
}

async function listStockists({ territory, category, type, excludeUserId }) {
  const query = { businessVerified: true };

  if (excludeUserId) {
    query.userId = { $ne: excludeUserId };
  }

  if (type) {
    query.type = type;
  }

  if (territory) {
    query.serviceAreas = {
      $regex: territory,
      $options: "i",
    };
  }

  if (category) {
    query.productCategories = {
      $regex: category,
      $options: "i",
    };
  }

  const rows = await StockistProfile.find(query)
    .sort({ updatedAt: -1 });
  const activeUsers = new Set(
    (
      await User.distinct("_id", {
        _id: { $in: rows.map((row) => row.userId) },
        status: "ACTIVE",
      })
    ).map((id) => id.toString())
  );

  const now = new Date();
  return rows
    .filter(
      (row) =>
        activeUsers.has(row.userId.toString()) &&
        (!row.licenceExpiryDate || row.licenceExpiryDate > now)
    )
    .map(serializeStockist);
}

// ============================================================
// Doctor
// ============================================================

function serializeDoctor(profile) {
  const registrationStatus =
    profile.registrationStatus === "VERIFIED" &&
    profile.reVerificationDate &&
    profile.reVerificationDate <= new Date()
      ? "EXPIRED"
      : profile.registrationStatus;
  return {
    id: profile._id,
    userId: profile.userId,
    fullName: profile.fullName,
    specialty: profile.specialty,
    subspecialty: profile.subspecialty,
    qualification: profile.qualification,
    registrationCouncil: profile.registrationCouncil,
    registrationNumber: profile.registrationNumber,
    registrationStatus,
    clinicHospitalAffiliation: profile.clinicHospitalAffiliation,
    location: profile.location,
    languages: profile.languages,
    professionalInterests: profile.professionalInterests,
    profileImageUrl: profile.profileImageUrl,
    acceptsMRRequests: profile.acceptsMRRequests,
    acceptsCompanyInformation: profile.acceptsCompanyInformation,
    acceptedCategories: profile.acceptedCategories,
    communicationModes: profile.communicationModes,
    appointmentDurationMinutes: profile.appointmentDurationMinutes,
    maximumRequestsPerWeek: profile.maximumRequestsPerWeek,
    businessVerified: profile.businessVerified,
    verificationDate: profile.verificationDate,
    reVerificationDate: profile.reVerificationDate,
    updatedAt: profile.updatedAt,
  };
}

async function getDoctorProfileByUserId(userId) {
  const profile = await DoctorProfile.findOne({ userId });

  if (!profile) {
    throw new ApiError(404, "NOT_FOUND", "Doctor profile not found");
  }

  return serializeDoctor(profile);
}

async function updateDoctorProfile(userId, patch) {
  const profile = await DoctorProfile.findOne({ userId });
  if (!profile) {
    throw new ApiError(404, "NOT_FOUND", "Doctor profile not found");
  }

  const allowedFields = [
    "fullName",
    "specialty",
    "subspecialty",
    "qualification",
    "registrationCouncil",
    "registrationNumber",
    "clinicHospitalAffiliation",
    "location",
    "languages",
    "professionalInterests",
    "acceptsMRRequests",
    "acceptsCompanyInformation",
    "acceptedCategories",
    "communicationModes",
    "appointmentDurationMinutes",
    "maximumRequestsPerWeek",
  ];
  const registrationFields = [
    "registrationCouncil",
    "registrationNumber",
  ];
  const registrationLocked = ["PENDING", "VERIFIED"].includes(
    profile.registrationStatus
  );
  const changedRegistrationField = registrationFields.some(
    (field) =>
      Object.prototype.hasOwnProperty.call(patch, field) &&
      String(patch[field] || "").trim() !==
        String(profile[field] || "").trim()
  );

  if (registrationLocked && changedRegistrationField) {
    throw new ApiError(
      409,
      "REGISTRATION_CHANGE_REQUIRES_REVIEW",
      "Registration details cannot be changed while verification is pending or approved. Contact PharmX support for a correction."
    );
  }

  const safePatch = {};

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(patch, field)) {
      safePatch[field] = patch[field];
    }
  }

  const updatedProfile = await DoctorProfile.findOneAndUpdate(
    { userId },
    { $set: safePatch },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedProfile) {
    throw new ApiError(404, "NOT_FOUND", "Doctor profile not found");
  }

  return serializeDoctor(updatedProfile);
}

// ============================================================
// Generic display profile
// ============================================================

/**
 * Used by connections, appointments, messages, etc.
 * to render a display name for any user.
 */
async function getDisplayProfile(userId, role) {
  role = normalizeRole(role);
  if (role === "MR") {
    const p = await getMRProfileByUserId(userId);

    return {
      name: p.fullName,
      imageUrl: p.profileImageUrl,
      role,
    };
  }

  if (role === "PHARMA_COMPANY") {
    const p = await getPharmaProfileByUserId(userId);

    return {
      name: p.companyName,
      imageUrl: p.logoUrl,
      role,
    };
  }

  if (role === "PHARMACY") {
    const p = await getPharmacyProfileByUserId(userId);

    return {
      name: p.displayName || p.pharmacyName,
      imageUrl: p.profileImage || null,
      role,
    };
  }

  if (role === "DISTRIBUTOR_STOCKIST") {
    const p = await getStockistProfileByUserId(userId);

    return {
      name: p.companyName,
      imageUrl: null,
      role,
    };
  }

  if (role === "DOCTOR") {
    const p = await getDoctorProfileByUserId(userId);

    return {
      name: p.fullName,
      imageUrl: p.profileImageUrl,
      role,
    };
  }

  if (role === "ADMIN") {
    return { name: "Admin", imageUrl: null, role };
  }

  throw new ApiError(
    400,
    "UNSUPPORTED_ROLE",
    `No display profile is available for role ${role || "unknown"}`
  );
}

// ============================================================
// Exports
// ============================================================

module.exports = {
  // MR
  getMRProfileByUserId,
  getMRProfileById,
  updateMRProfile,
  listMRs,

  // Pharma Company
  getPharmaProfileByUserId,
  getPharmaProfileById,
  updatePharmaProfile,
  listPharmaCompanies,

  // Pharmacy
  getPharmacyProfileByUserId,
  getPharmacyProfileById,
  updatePharmacyProfile,
  listPharmacies,

  // Stockist / Distributor
  getStockistProfileByUserId,
  getStockistProfileById,
  updateStockistProfile,
  listStockists,

  // Doctor
  getDoctorProfileByUserId,
  updateDoctorProfile,

  // Generic
  getDisplayProfile,
};