const { ApiError } = require("../../common/http");
const MRProfile = require("../../models/MRProfile");
const PharmaCompanyProfile = require("../../models/PharmaCompanyProfile");
const PharmacyProfile = require("../../models/PharmacyProfile");
const StockistProfile = require("../../models/StockistProfile");

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
  const p = await MRProfile.findOneAndUpdate(
    { userId },
    { $set: patch },
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

  if (excludeUserId) {
    query.userId = { $ne: excludeUserId };
  }

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

  const rows = await MRProfile
    .find(query)
    .sort({ updatedAt: -1 });

  return rows.map(serializeMR);
}

// ============================================================
// Pharma Company
// ============================================================

function serializePharma(p) {
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
    contactPersonName: p.contactPersonName,
    contactPersonDesignation: p.contactPersonDesignation,

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

  return serializePharma(p);
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
  const query = {};

  if (excludeUserId) {
    query.userId = { $ne: excludeUserId };
  }

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

  const rows = await PharmaCompanyProfile
    .find(query)
    .sort({ updatedAt: -1 });

  return rows.map(serializePharma);
}

// ============================================================
// Pharmacy
// ============================================================

function serializePharmacy(p) {
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
    exactAddress: p.showExactAddress ? p.exactAddress : undefined,
    showExactAddress: p.showExactAddress,
    mapLocation: p.mapLocation,

    // Legal / licensing
    drugLicenceNumber: p.drugLicenceNumber,
    licenceType: p.licenceType,
    licenceIssueDate: p.licenceIssueDate,
    licenceExpiryDate: p.licenceExpiryDate,
    licensingAuthority: p.licensingAuthority,
    gstin: p.gstin,
    businessRegistration: p.businessRegistration,
    pharmacistDetails: p.pharmacistDetails,

    // Verification
    businessVerified: p.businessVerified,
    verificationStatus: p.verificationStatus,
    lastVerifiedDate: p.lastVerifiedDate,
    nextVerificationDate: p.nextVerificationDate,

    // Do not expose verification document URLs
    // through the normal public profile response.
    verificationDocuments: (p.verificationDocuments || []).map((doc) => ({
      name: doc.name,
      type: doc.type,
      uploadedAt: doc.uploadedAt,
      status: doc.status,
    })),

    verificationNotes: p.verificationNotes,

    // Procurement
    interestedCategories: p.interestedCategories,
    preferredSuppliers: p.preferredSuppliers,
    newCompanyInterest: p.newCompanyInterest,
    alternativeBrandAcceptance: p.alternativeBrandAcceptance,
    demandRange: p.demandRange,
    deliveryPreferences: p.deliveryPreferences,
    coldChainRequirement: p.coldChainRequirement,
    urgentSupplyRequirement: p.urgentSupplyRequirement,

    // Communication
    preferredCommunicationMethod: p.preferredCommunicationMethod,
    preferredMRVisitHours: p.preferredMRVisitHours,
    noVisitDays: p.noVisitDays,

    // Existing appointment field
    preferredAppointmentWindows: p.preferredAppointmentWindows,

    // Privacy
    privacy: p.privacy,

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

  return serializePharmacy(p);
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
    "licenceExpiryDate",
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
  const query = {};

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

  const rows = await PharmacyProfile
    .find(query)
    .sort({ updatedAt: -1 });

  return rows.map(serializePharmacy);
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
  const p = await StockistProfile.findOneAndUpdate(
    { userId },
    { $set: patch },
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
  const query = {};

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

  const rows = await StockistProfile
    .find(query)
    .sort({ updatedAt: -1 });

  return rows.map(serializeStockist);
}

// ============================================================
// Generic display profile
// ============================================================

/**
 * Used by connections, appointments, messages, etc.
 * to render a display name for any user.
 */
async function getDisplayProfile(userId, role) {
  try {
    if (role === "MR" || role === "INDEPENDENT_MR") {
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

    if (role === "STOCKIST" || role === "DISTRIBUTOR") {
      const p = await getStockistProfileByUserId(userId);

      return {
        name: p.companyName,
        imageUrl: null,
        role,
      };
    }
  } catch {
    // Profile missing — fall through.
  }

  return {
    name: "Admin",
    imageUrl: null,
    role,
  };
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

  // Generic
  getDisplayProfile,
};