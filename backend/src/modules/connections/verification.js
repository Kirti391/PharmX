const VerificationDocument = require("../../models/VerificationDocument");

const REQUIRED_DOCUMENT_BY_ROLE = {
  PHARMA_COMPANY: "BUSINESS_REG",
  PHARMACY: "DRUG_LICENSE",
  DISTRIBUTOR_STOCKIST: "DRUG_LICENSE",
  DOCTOR: "MEDICAL_REGISTRATION",
};

async function hasCurrentApprovedDocument(userId, docType, now) {
  return Boolean(
    await VerificationDocument.exists({
      userId,
      docType,
      status: "APPROVED",
      $or: [{ expiryDate: null }, { expiryDate: { $gt: now } }],
    })
  );
}

async function hasCurrentConnectionVerification(user, now = new Date()) {
  const docType =
    user.role === "MR" ? "ID_PROOF" : REQUIRED_DOCUMENT_BY_ROLE[user.role];
  return docType
    ? hasCurrentApprovedDocument(user._id, docType, now)
    : false;
}

module.exports = { hasCurrentConnectionVerification };
