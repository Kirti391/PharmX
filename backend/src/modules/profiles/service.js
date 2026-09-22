const { ApiError } = require("../../common/http");
const MRProfile = require("../../models/MRProfile");
const PharmaCompanyProfile = require("../../models/PharmaCompanyProfile");
const PharmacyProfile = require("../../models/PharmacyProfile");
const StockistProfile = require("../../models/StockistProfile");

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
  if (!p) throw new ApiError(404, "NOT_FOUND", "MR profile not found");
  return serializeMR(p);
}

async function getMRProfileById(id) {
  const p = await MRProfile.findById(id);
  if (!p) throw new ApiError(404, "NOT_FOUND", "MR profile not found");
  return serializeMR(p);
}

async function updateMRProfile(userId, patch) {
  const p = await MRProfile.findOneAndUpdate({ userId }, { $set: patch }, { new: true, runValidators: true });
  if (!p) throw new ApiError(404, "NOT_FOUND", "MR profile not found");
  return serializeMR(p);
}

async function listMRs({ territory, specialization, workMode }) {
  const query = {};
  if (workMode) query.workMode = workMode;
  // $regex with "i" flag is Mongo's equivalent of the old SQL "LIKE %x%" substring filter.
  if (territory) query.territories = { $regex: territory, $options: "i" };
  if (specialization) query.specializations = { $regex: specialization, $options: "i" };
  const rows = await MRProfile.find(query).sort({ updatedAt: -1 });
  return rows.map(serializeMR);
}

// ---------- Pharma Company ----------
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
    updatedAt: p.updatedAt,
  };
}

async function getPharmaProfileByUserId(userId) {
  const p = await PharmaCompanyProfile.findOne({ userId });
  if (!p) throw new ApiError(404, "NOT_FOUND", "Company profile not found");
  return serializePharma(p);
}

async function getPharmaProfileById(id) {
  const p = await PharmaCompanyProfile.findById(id);
  if (!p) throw new ApiError(404, "NOT_FOUND", "Company profile not found");
  return serializePharma(p);
}

async function updatePharmaProfile(userId, patch) {
  const p = await PharmaCompanyProfile.findOneAndUpdate({ userId }, { $set: patch }, { new: true, runValidators: true });
  if (!p) throw new ApiError(404, "NOT_FOUND", "Company profile not found");
  return serializePharma(p);
}

async function listPharmaCompanies({ territory, category }) {
  const query = {};
  if (territory) query.areasOfOperation = { $regex: territory, $options: "i" };
  if (category) query.productCategories = { $regex: category, $options: "i" };
  const rows = await PharmaCompanyProfile.find(query).sort({ updatedAt: -1 });
  return rows.map(serializePharma);
}

// ---------- Pharmacy ----------
function serializePharmacy(p) {
  return {
    id: p._id,
    userId: p.userId,
    pharmacyName: p.pharmacyName,
    location: p.location,
    businessVerified: p.businessVerified,
    interestedCategories: p.interestedCategories,
    preferredAppointmentWindows: p.preferredAppointmentWindows,
    updatedAt: p.updatedAt,
  };
}

async function getPharmacyProfileByUserId(userId) {
  const p = await PharmacyProfile.findOne({ userId });
  if (!p) throw new ApiError(404, "NOT_FOUND", "Pharmacy profile not found");
  return serializePharmacy(p);
}

async function getPharmacyProfileById(id) {
  const p = await PharmacyProfile.findById(id);
  if (!p) throw new ApiError(404, "NOT_FOUND", "Pharmacy profile not found");
  return serializePharmacy(p);
}

async function updatePharmacyProfile(userId, patch) {
  const p = await PharmacyProfile.findOneAndUpdate({ userId }, { $set: patch }, { new: true, runValidators: true });
  if (!p) throw new ApiError(404, "NOT_FOUND", "Pharmacy profile not found");
  return serializePharmacy(p);
}

async function listPharmacies({ territory, category }) {
  const query = {};
  if (territory) query.location = { $regex: territory, $options: "i" };
  if (category) query.interestedCategories = { $regex: category, $options: "i" };
  const rows = await PharmacyProfile.find(query).sort({ updatedAt: -1 });
  return rows.map(serializePharmacy);
}

// ---------- Stockist / Distributor ----------
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
  if (!p) throw new ApiError(404, "NOT_FOUND", "Stockist/distributor profile not found");
  return serializeStockist(p);
}

async function getStockistProfileById(id) {
  const p = await StockistProfile.findById(id);
  if (!p) throw new ApiError(404, "NOT_FOUND", "Stockist/distributor profile not found");
  return serializeStockist(p);
}

async function updateStockistProfile(userId, patch) {
  const p = await StockistProfile.findOneAndUpdate({ userId }, { $set: patch }, { new: true, runValidators: true });
  if (!p) throw new ApiError(404, "NOT_FOUND", "Stockist/distributor profile not found");
  return serializeStockist(p);
}

async function listStockists({ territory, category, type }) {
  const query = {};
  if (type) query.type = type;
  if (territory) query.serviceAreas = { $regex: territory, $options: "i" };
  if (category) query.productCategories = { $regex: category, $options: "i" };
  const rows = await StockistProfile.find(query).sort({ updatedAt: -1 });
  return rows.map(serializeStockist);
}

/** Generic dispatcher used by connections/appointments/messages to render a display name for any user. */
async function getDisplayProfile(userId, role) {
  try {
    if (role === "MR" || role === "INDEPENDENT_MR") {
      const p = await getMRProfileByUserId(userId);
      return { name: p.fullName, imageUrl: p.profileImageUrl, role };
    }
    if (role === "PHARMA_COMPANY") {
      const p = await getPharmaProfileByUserId(userId);
      return { name: p.companyName, imageUrl: p.logoUrl, role };
    }
    if (role === "PHARMACY") {
      const p = await getPharmacyProfileByUserId(userId);
      return { name: p.pharmacyName, imageUrl: null, role };
    }
    if (role === "STOCKIST" || role === "DISTRIBUTOR") {
      const p = await getStockistProfileByUserId(userId);
      return { name: p.companyName, imageUrl: null, role };
    }
  } catch {
    // profile missing — fall through
  }
  return { name: "Admin", imageUrl: null, role };
}

module.exports = {
  getMRProfileByUserId, getMRProfileById, updateMRProfile, listMRs,
  getPharmaProfileByUserId, getPharmaProfileById, updatePharmaProfile, listPharmaCompanies,
  getPharmacyProfileByUserId, getPharmacyProfileById, updatePharmacyProfile, listPharmacies,
  getStockistProfileByUserId, getStockistProfileById, updateStockistProfile, listStockists,
  getDisplayProfile,
};
