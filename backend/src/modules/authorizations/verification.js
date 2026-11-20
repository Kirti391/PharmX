const VerificationDocument = require("../../models/VerificationDocument");

async function hasCurrentCompanyRegistration(company, asOf = new Date()) {
  return Boolean(
    await VerificationDocument.exists({
      userId: company.userId,
      docType: "BUSINESS_REG",
      status: "APPROVED",
      $or: [{ expiryDate: null }, { expiryDate: { $gt: asOf } }],
    })
  );
}

module.exports = { hasCurrentCompanyRegistration };
