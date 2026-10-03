const express = require("express");
const DoctorProfile = require("../../models/DoctorProfile");
const MRProfile = require("../../models/MRProfile");
const PharmaCompanyProfile = require("../../models/PharmaCompanyProfile");
const CompanyAuthorization = require("../../models/CompanyAuthorization");
const User = require("../../models/User");
const VerificationDocument = require("../../models/VerificationDocument");

const {
  asyncHandler,
  requireAuth,
  requireRole,
} = require("../../common/middleware");
const { ok } = require("../../common/http");

const {
  listMRs,
  listPharmaCompanies,
  listPharmacies,
  listStockists,
} = require("../profiles/service");

const router = express.Router();

router.use(requireAuth);

router.get(
  "/companies",
  requireRole("PHARMACY", "MR", "DISTRIBUTOR_STOCKIST"),
  asyncHandler(async (req, res) => {
    ok(
      res,
      await listPharmaCompanies({
        territory: req.query.territory,
        category: req.query.category,
        excludeUserId: req.user?.sub,
      })
    );
  })
);

router.get(
  "/mrs",
  requireRole("PHARMACY", "PHARMA_COMPANY", "DISTRIBUTOR_STOCKIST"),
  asyncHandler(async (req, res) => {
    ok(
      res,
      await listMRs({
        territory: req.query.territory,
        specialization: req.query.specialization,
        workMode: req.query.workMode,
        excludeUserId: req.user?.sub,
      })
    );
  })
);

router.get(
  "/pharmacies",
  requireRole("MR", "PHARMA_COMPANY", "DISTRIBUTOR_STOCKIST"),
  asyncHandler(async (req, res) => {
    ok(
      res,
      await listPharmacies({
        territory: req.query.territory,
        category: req.query.category,
        excludeUserId: req.user?.sub,
      })
    );
  })
);

router.get(
  "/stockists",
  requireRole("PHARMACY", "MR", "PHARMA_COMPANY"),
  asyncHandler(async (req, res) => {
    ok(
      res,
      await listStockists({
        territory: req.query.territory,
        category: req.query.category,
        type: req.query.type,
        excludeUserId: req.user?.sub,
      })
    );
  })
);

router.get(
  "/doctors",
  requireRole("MR", "PHARMA_COMPANY"),
  asyncHandler(async (req, res) => {
    let mrAuthorizations = [];
    if (req.user.role === "MR") {
      const rows = await CompanyAuthorization.find({
        mrUserId: req.user.sub,
        status: "ACTIVE",
        expiresAt: { $gt: new Date() },
      }).sort({ expiresAt: 1 });
      const verifiedCompanies = await PharmaCompanyProfile.find({
        _id: { $in: rows.map((row) => row.companyId) },
        businessVerified: true,
        verificationStatus: "VERIFIED",
      }).select("_id companyName");
      const companiesById = new Map(
        verifiedCompanies.map((company) => [
          company._id.toString(),
          company,
        ])
      );
      const currentAuthorizationDocuments = new Set(
        (
          await VerificationDocument.distinct("_id", {
            _id: {
              $in: rows.map((row) => row.verificationDocumentId),
            },
            docType: "COMPANY_AUTHORIZATION",
            status: "APPROVED",
            $or: [
              { expiryDate: null },
              { expiryDate: { $gt: new Date() } },
            ],
          })
        ).map((id) => id.toString())
      );
      mrAuthorizations = rows
        .filter((row) =>
          companiesById.has(row.companyId.toString()) &&
          currentAuthorizationDocuments.has(
            row.verificationDocumentId.toString()
          )
        )
        .map((row) => ({
          row,
          company: companiesById.get(row.companyId.toString()),
        }));

      if (mrAuthorizations.length === 0) {
        return ok(res, []);
      }

      const mr = await MRProfile.findOne({
        userId: req.user.sub,
      });
      if (!mr) {
        return ok(res, []);
      }
    } else {
      const company = await PharmaCompanyProfile.findOne({
        userId: req.user.sub,
        businessVerified: true,
        verificationStatus: "VERIFIED",
      }).select("_id userId");
      if (!company) {
        return ok(res, []);
      }
      const currentRegistration = await VerificationDocument.exists({
        userId: company.userId,
        docType: "BUSINESS_REG",
        status: "APPROVED",
        $or: [
          { expiryDate: null },
          { expiryDate: { $gt: new Date() } },
        ],
      });
      if (!currentRegistration) return ok(res, []);
    }

    const acceptsField =
      req.user.role === "MR"
        ? "acceptsMRRequests"
        : "acceptsCompanyInformation";
    const query = {
      registrationStatus: "VERIFIED",
      businessVerified: true,
      communicationModes: { $in: ["VIDEO", "PHYSICAL"] },
      blockedUserIds: { $ne: req.user.sub },
      [acceptsField]: true,
    };
    const currentlyRegisteredDoctors = await VerificationDocument.distinct(
      "userId",
      {
        docType: "MEDICAL_REGISTRATION",
        status: "APPROVED",
        $or: [
          { expiryDate: null },
          { expiryDate: { $gt: new Date() } },
        ],
      }
    );
    query.userId = { $in: currentlyRegisteredDoctors };

    if (req.query.category) {
      query.$or = [
        { acceptedCategories: { $size: 0 } },
        { acceptedCategories: req.query.category },
      ];
    }

    const profiles = await DoctorProfile.find(query)
      .sort({ updatedAt: -1 })
      .limit(50);
    const activeUsers = await User.find({
      _id: { $in: profiles.map((profile) => profile.userId) },
      status: "ACTIVE",
    }).select("_id");
    const activeIds = new Set(
      activeUsers.map((user) => user._id.toString())
    );

    const doctorResults = profiles
      .filter((profile) => activeIds.has(profile.userId.toString()))
      .map((profile) => {
        const authorization = mrAuthorizations.find(({ row }) => {
          const location = profile.location.trim().toLowerCase();
          const territoryMatches = row.territories.some((territory) => {
            const normalizedTerritory = territory.trim().toLowerCase();
            return (
              normalizedTerritory === location ||
              normalizedTerritory.includes(location) ||
              location.includes(normalizedTerritory)
            );
          });
          const categoryMatches =
            !req.query.category ||
            row.categories.some(
              (category) =>
                category.toLowerCase() ===
                String(req.query.category).toLowerCase()
            );
          const acceptedCategoryMatches =
            profile.acceptedCategories.length === 0 ||
            row.categories.some((category) =>
              profile.acceptedCategories.some(
                (accepted) =>
                  accepted.toLowerCase() === category.toLowerCase()
              )
            );
          return (
            territoryMatches &&
            categoryMatches &&
            acceptedCategoryMatches
          );
        });
        if (req.user.role === "MR" && !authorization) return null;
        return {
          id: profile._id,
          userId: profile.userId,
          ...(authorization
            ? {
                companyId: authorization.company._id,
                companyName: authorization.company.companyName,
              }
            : {}),
          fullName: profile.fullName,
          profileImageUrl: profile.profileImageUrl,
          specialty: profile.specialty,
          subspecialty: profile.subspecialty,
          clinicHospitalAffiliation:
            profile.clinicHospitalAffiliation,
          location: profile.location,
          languages: profile.languages,
          professionalInterests:
            profile.professionalInterests,
          acceptedCategories:
            profile.acceptedCategories,
          communicationModes:
            profile.communicationModes,
          appointmentDurationMinutes:
            profile.appointmentDurationMinutes,
        };
      })
      .filter(Boolean);

    ok(res, doctorResults);
  })
);

module.exports = router;