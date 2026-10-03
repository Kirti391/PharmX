const express = require("express");
const { z } = require("zod");
const {
  asyncHandler,
  requireAuth,
  requireRole,
} = require("../../common/middleware");
const { created, fail, ok } = require("../../common/http");
const PharmaCompanyProfile = require("../../models/PharmaCompanyProfile");
const Product = require("../../models/Product");
const User = require("../../models/User");
const VerificationDocument = require("../../models/VerificationDocument");
const { recordAudit } = require("../../common/audit");

const router = express.Router();
router.use(requireAuth);

const MARKET_ROLES = [
  "PHARMACY",
  "MR",
  "PHARMA_COMPANY",
  "DISTRIBUTOR_STOCKIST",
];
const isObjectId = (value) => /^[a-f\d]{24}$/i.test(String(value));

const productFields = {
  name: z.string().trim().min(2).max(160),
  category: z.string().trim().min(2).max(120),
  activeIngredient: z.string().trim().max(200).optional(),
  strength: z.string().trim().max(120).optional(),
  dosageForm: z.string().trim().max(120).optional(),
  packSize: z.string().trim().max(120).optional(),
  description: z.string().trim().max(2000).optional(),
  imageUrl: z.string().trim().max(1000).optional(),
};

const createProductSchema = z.object(productFields);
const updateProductSchema = z
  .object(productFields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one product field is required",
  });

async function getCompanyForUser(userId) {
  return PharmaCompanyProfile.findOne({ userId }).select(
    "_id userId companyName businessVerified verificationStatus"
  );
}

async function hasCurrentRegistration(company) {
  return Boolean(
    await VerificationDocument.exists({
      userId: company.userId,
      docType: "BUSINESS_REG",
      status: "APPROVED",
      $or: [{ expiryDate: null }, { expiryDate: { $gt: new Date() } }],
    })
  );
}

async function serializeProduct(product, companyName) {
  return {
    id: product._id,
    companyId: product.companyId,
    companyName: companyName || null,
    name: product.name,
    category: product.category,
    activeIngredient: product.activeIngredient,
    strength: product.strength,
    dosageForm: product.dosageForm,
    packSize: product.packSize,
    description: product.description,
    imageUrl: product.imageUrl,
    status: product.status,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

router.get(
  "/products",
  requireRole(...MARKET_ROLES),
  asyncHandler(async (req, res) => {
    const query = { status: "PUBLISHED" };
    if (req.query.companyId) {
      if (!/^[a-f\d]{24}$/i.test(String(req.query.companyId))) {
        return fail(res, 400, "VALIDATION_ERROR", "Invalid companyId");
      }
      query.companyId = req.query.companyId;
    }
    if (req.query.category) {
      const category = String(req.query.category).trim();
      if (!category || category.length > 120) {
        return fail(res, 400, "VALIDATION_ERROR", "Invalid category filter");
      }
      query.category = category;
    }
    if (req.query.search) {
      const search = String(req.query.search).trim();
      if (!search || search.length > 100) {
        return fail(res, 400, "VALIDATION_ERROR", "Invalid search query");
      }
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { category: { $regex: escaped, $options: "i" } },
        { activeIngredient: { $regex: escaped, $options: "i" } },
        { description: { $regex: escaped, $options: "i" } },
      ];
    }

    const products = await Product.find(query)
      .sort({ updatedAt: -1 })
      .limit(100);
    const companyIds = [...new Set(products.map((product) => product.companyId.toString()))];
    const companies = await PharmaCompanyProfile.find({
      _id: { $in: companyIds },
      businessVerified: true,
      verificationStatus: "VERIFIED",
    }).select("_id userId companyName");
    const currentRegistrationUsers = new Set(
      (
        await VerificationDocument.distinct("userId", {
          userId: { $in: companies.map((company) => company.userId) },
          docType: "BUSINESS_REG",
          status: "APPROVED",
          $or: [
            { expiryDate: null },
            { expiryDate: { $gt: new Date() } },
          ],
        })
      ).map((id) => id.toString())
    );
    const activeUsers = new Set(
      (
        await User.distinct("_id", {
          _id: { $in: companies.map((company) => company.userId) },
          status: "ACTIVE",
        })
      ).map((id) => id.toString())
    );
    const companyNames = new Map(
      companies
        .filter(
          (company) =>
            currentRegistrationUsers.has(company.userId.toString()) &&
            activeUsers.has(company.userId.toString())
        )
        .map((company) => [company._id.toString(), company.companyName])
    );
    ok(
      res,
      await Promise.all(
        products
          .filter((product) => companyNames.has(product.companyId.toString()))
          .map((product) =>
            serializeProduct(
              product,
              companyNames.get(product.companyId.toString())
            )
          )
      )
    );
  })
);

router.get(
  "/products/mine",
  requireRole("PHARMA_COMPANY"),
  asyncHandler(async (req, res) => {
    const company = await getCompanyForUser(req.user.sub);
    if (!company) {
      return fail(res, 404, "NOT_FOUND", "Company profile not found");
    }
    const products = await Product.find({ companyId: company._id })
      .sort({ updatedAt: -1 })
      .limit(200);
    ok(
      res,
      await Promise.all(
        products.map((product) =>
          serializeProduct(product, company.companyName)
        )
      )
    );
  })
);

router.post(
  "/products",
  requireRole("PHARMA_COMPANY"),
  asyncHandler(async (req, res) => {
    const parsed = createProductSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(
        res,
        400,
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message || "Invalid product details"
      );
    }
    const company = await getCompanyForUser(req.user.sub);
    if (!company) {
      return fail(res, 404, "NOT_FOUND", "Company profile not found");
    }
    const product = await Product.create({
      ...parsed.data,
      companyId: company._id,
      createdBy: req.user.sub,
      status: "DRAFT",
    });
    await recordAudit({
      userId: req.user.sub,
      action: "PRODUCT_CATALOGUE_DRAFT_CREATED",
      targetType: "Product",
      targetId: product._id.toString(),
    });
    created(res, await serializeProduct(product, company.companyName));
  })
);

router.patch(
  "/products/:id",
  requireRole("PHARMA_COMPANY"),
  asyncHandler(async (req, res) => {
    if (!isObjectId(req.params.id)) {
      return fail(res, 400, "VALIDATION_ERROR", "Invalid product id");
    }
    const parsed = updateProductSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(
        res,
        400,
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message || "Invalid product details"
      );
    }
    const company = await getCompanyForUser(req.user.sub);
    if (!company) {
      return fail(res, 404, "NOT_FOUND", "Company profile not found");
    }
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, companyId: company._id },
      { $set: parsed.data },
      { new: true, runValidators: true }
    );
    if (!product) {
      return fail(res, 404, "NOT_FOUND", "Product not found");
    }
    await recordAudit({
      userId: req.user.sub,
      action: "PRODUCT_CATALOGUE_UPDATED",
      targetType: "Product",
      targetId: product._id.toString(),
    });
    ok(res, await serializeProduct(product, company.companyName));
  })
);

router.patch(
  "/products/:id/status",
  requireRole("PHARMA_COMPANY"),
  asyncHandler(async (req, res) => {
    if (!isObjectId(req.params.id)) {
      return fail(res, 400, "VALIDATION_ERROR", "Invalid product id");
    }
    const parsed = z
      .object({ status: z.enum(["PUBLISHED", "ARCHIVED"]) })
      .safeParse(req.body);
    if (!parsed.success) {
      return fail(
        res,
        400,
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message || "Invalid catalogue status"
      );
    }
    const company = await getCompanyForUser(req.user.sub);
    if (!company) {
      return fail(res, 404, "NOT_FOUND", "Company profile not found");
    }
    if (
      parsed.data.status === "PUBLISHED" &&
      (!company.businessVerified ||
        company.verificationStatus !== "VERIFIED" ||
        !(await hasCurrentRegistration(company)))
    ) {
      return fail(
        res,
        403,
        "COMPANY_VERIFICATION_REQUIRED",
        "A current verified company registration is required to publish products"
      );
    }
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, companyId: company._id },
      { $set: { status: parsed.data.status } },
      { new: true, runValidators: true }
    );
    if (!product) {
      return fail(res, 404, "NOT_FOUND", "Product not found");
    }
    await recordAudit({
      userId: req.user.sub,
      action: `PRODUCT_CATALOGUE_${parsed.data.status}`,
      targetType: "Product",
      targetId: product._id.toString(),
    });
    ok(res, await serializeProduct(product, company.companyName));
  })
);

module.exports = router;
