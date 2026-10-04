const express = require("express");
const { z } = require("zod");

const {
  asyncHandler,
  requireAuth,
  requireRole,
} = require("../../common/middleware");

const {
  created,
  fail,
  ok,
  ApiError,
} = require("../../common/http");

const Requirement = require("../../models/Requirement");
const RequirementResponse = require("../../models/RequirementResponse");
const PharmacyProfile = require("../../models/PharmacyProfile");
const User = require("../../models/User");

const {
  getPharmacyProfileByUserId,
  getStockistProfileByUserId,
  getDisplayProfile,
} = require("../profiles/service");

const {
  matchForRequirement,
} = require("../matching/service");

const {
  createNotification,
} = require("../notifications/service");

const router = express.Router();

router.use(requireAuth);

/*
|--------------------------------------------------------------------------
| Requirement Roles
|--------------------------------------------------------------------------
|
| Distributor and Stockist are ONE role:
|
|     DISTRIBUTOR_STOCKIST
|
*/

const REQUIREMENT_ROLES = [
  "PHARMACY",
  "COMPANY",
  "MR",
  "DISTRIBUTOR_STOCKIST",
];

/*
|--------------------------------------------------------------------------
| Validation
|--------------------------------------------------------------------------
|
| The current Pharmacy frontend sends supplierType.
|
| We continue accepting supplierType so your existing Create page
| does not break.
|
| Internally it is converted into targetRole.
|
*/

const createSchema = z.object({
  category: z.string().trim().min(2),

  title: z.string().trim().min(3),

  description: z.string().trim().min(5),

  urgency: z
    .enum(["LOW", "NORMAL", "HIGH"])
    .default("NORMAL"),

  supplierType: z
    .enum([
      "COMPANY",
      "MR",
      "DISTRIBUTOR_STOCKIST",
    ])
    .optional(),

  targetRole: z
    .enum(REQUIREMENT_ROLES)
    .optional(),
});

const updateSchema = z.object({
  category: z
    .string()
    .trim()
    .min(2)
    .optional(),

  title: z
    .string()
    .trim()
    .min(3)
    .optional(),

  description: z
    .string()
    .trim()
    .min(5)
    .optional(),

  urgency: z
    .enum(["LOW", "NORMAL", "HIGH"])
    .optional(),
});

const responseSchema = z.object({
  message: z.string().trim().min(5).max(2000),
});

/*
|--------------------------------------------------------------------------
| Role Normalizer
|--------------------------------------------------------------------------
*/

function normalizeRole(role) {
  if (!role) return null;

  const normalized = String(role).toUpperCase();

  /*
   * Distributor + Stockist are intentionally treated
   * as one application role.
   */
  if (
    normalized === "DISTRIBUTOR" ||
    normalized === "STOCKIST" ||
    normalized === "DISTRIBUTOR_STOCKIST"
  ) {
    return "DISTRIBUTOR_STOCKIST";
  }

  if (normalized === "PHARMA_COMPANY") {
    return "COMPANY";
  }

  return normalized;
}

/*
|--------------------------------------------------------------------------
| Resolve Current Pharmacy
|--------------------------------------------------------------------------
*/

async function getCurrentPharmacyId(user) {
  if (
    !user ||
    normalizeRole(user.role) !== "PHARMACY"
  ) {
    return null;
  }

  const pharmacy =
    await getPharmacyProfileByUserId(
      user.sub
    );

  if (!pharmacy) {
    return null;
  }

  return (
    pharmacy.id ??
    pharmacy._id ??
    null
  );
}

/*
|--------------------------------------------------------------------------
| Resolve Current User Context
|--------------------------------------------------------------------------
*/

async function getCurrentUserContext(user) {
  const role =
    normalizeRole(user?.role);

  if (!role) {
    return {
      role: null,
      ownerId: null,
      pharmacyId: null,
    };
  }

  if (role === "PHARMACY") {
    const pharmacy =
      await getPharmacyProfileByUserId(
        user.sub
      );

    if (!pharmacy) {
      return {
        role,
        ownerId: null,
        pharmacyId: null,
      };
    }

    const pharmacyId =
      pharmacy.id ??
      pharmacy._id;

    return {
      role,
      ownerId: pharmacyId,
      pharmacyId,
    };
  }

  /*
   * For other roles, the authenticated user ID is used
   * as ownerId for now.
   */
  return {
    role,
    ownerId: user.sub,
    pharmacyId: null,
  };
}

/*
|--------------------------------------------------------------------------
| Ownership Check
|--------------------------------------------------------------------------
|
| New requirements:
|     ownerId
|
| Old pharmacy requirements:
|     pharmacyId
|
| Both are supported.
|
*/

function isOwner(
  requirement,
  context
) {
  const currentOwnerId =
    context.ownerId?.toString?.() ??
    null;

  const requirementOwnerId =
    requirement.ownerId?.toString?.() ??
    null;

  /*
   * New ownership system.
   */
  if (
    currentOwnerId &&
    requirementOwnerId
  ) {
    return (
      currentOwnerId ===
      requirementOwnerId
    );
  }

  /*
   * Backward compatibility for old Pharmacy
   * requirements.
   */
  if (
    context.role === "PHARMACY" &&
    context.pharmacyId &&
    requirement.pharmacyId
  ) {
    return (
      context.pharmacyId.toString() ===
      requirement.pharmacyId.toString()
    );
  }

  return false;
}

/*
|--------------------------------------------------------------------------
| Serializer
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| This response NEVER contains matching profiles.
|
| Matching profiles are private to the requirement owner
| and are handled separately by the matching endpoint.
|
*/

function serialize(
  requirement,
  context
) {
  const owner =
    isOwner(
      requirement,
      context
    );

  const targetRole =
    normalizeRole(
      requirement.targetRole
    );

  const targetedUser =
    Boolean(targetRole) &&
    context.role === targetRole;

  return {
    id: requirement._id,

    pharmacyId:
      requirement.pharmacyId,

    ownerId:
      requirement.ownerId ?? null,

    ownerRole:
      requirement.ownerRole ?? null,

    targetRole,

    category:
      requirement.category,

    title:
      requirement.title,

    description:
      requirement.description,

    urgency:
      requirement.urgency,

    status:
      requirement.status,

    createdAt:
      requirement.createdAt,

    updatedAt:
      requirement.updatedAt,

    isOwner:
      Boolean(owner),

    isTargetRole:
      Boolean(targetedUser),

    canSeeRequirement:
      Boolean(
        owner ||
        targetedUser
      ),
  };
}

/*
|--------------------------------------------------------------------------
| GET /requirements
|--------------------------------------------------------------------------
|
| ROLE-BASED VISIBILITY
|
| Pharmacy:
|   - Own requirements only
|
| MR:
|   - MR requirements
|   - Own requirements
|
| Company:
|   - Company requirements
|   - Own requirements
|
| Distributor/Stockist:
|   - DISTRIBUTOR_STOCKIST requirements
|   - Own requirements
|
| Nobody gets unrelated requirements.
|
*/

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const status =
      req.query.status ||
      "OPEN";

    const context =
      await getCurrentUserContext(
        req.user
      );

    if (!context.role) {
      return fail(
        res,
        401,
        "UNAUTHORIZED",
        "Unable to determine account role"
      );
    }

    /*
     * Pharmacy must have a profile.
     */
    if (
      context.role === "PHARMACY" &&
      !context.pharmacyId
    ) {
      return fail(
        res,
        404,
        "PHARMACY_PROFILE_NOT_FOUND",
        "Pharmacy profile not found"
      );
    }

    const visibility = [];

    /*
     * User's own requirements.
     */
    if (context.ownerId) {
      visibility.push({
        ownerId:
          context.ownerId,
      });
    }

    /*
     * Existing Pharmacy requirements.
     */
    if (
      context.role === "PHARMACY" &&
      context.pharmacyId
    ) {
      visibility.push({
        pharmacyId:
          context.pharmacyId,
      });
    }

    /*
     * Requirements specifically targeting
     * the current user's role.
     */
    visibility.push({
      targetRole:
        context.role,
    });

    const rows =
      await Requirement.find({
        status,
        $or: visibility,
      }).sort({
        createdAt: -1,
      });

    /*
     * Final authorization filter.
     */
    const visibleRows =
      rows.filter((row) => {
        const data =
          serialize(
            row,
            context
          );

        return (
          data.isOwner ||
          data.isTargetRole
        );
      });

    return ok(
      res,
      visibleRows.map((row) =>
        serialize(
          row,
          context
        )
      )
    );
  })
);

/*
|--------------------------------------------------------------------------
| GET /requirements/:id
|--------------------------------------------------------------------------
|
| Only:
|
|   OWNER
|       OR
|
|   TARGET ROLE
|
| can view the requirement.
|
| Matching profiles are NOT returned here.
|
*/

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const row =
      await Requirement.findById(
        req.params.id
      );

    if (!row) {
      return fail(
        res,
        404,
        "NOT_FOUND",
        "Requirement not found"
      );
    }

    const context =
      await getCurrentUserContext(
        req.user
      );

    const owner =
      isOwner(
        row,
        context
      );

    const targetRole =
      normalizeRole(
        row.targetRole
      );

    const targetedUser =
      Boolean(targetRole) &&
      context.role === targetRole;

    /*
     * Nobody else can view it.
     */
    if (
      !owner &&
      !targetedUser
    ) {
      throw new ApiError(
        403,
        "FORBIDDEN",
        "You are not allowed to view this requirement"
      );
    }

    return ok(
      res,
      serialize(
        row,
        context
      )
    );
  })
);

/*
|--------------------------------------------------------------------------
| Requirement responses
|--------------------------------------------------------------------------
*/

async function getAccessibleRequirement(id, user) {
  const row = await Requirement.findById(id);
  if (!row) {
    throw new ApiError(404, "NOT_FOUND", "Requirement not found");
  }

  const context = await getCurrentUserContext(user);
  const owner = isOwner(row, context);
  const targetedUser =
    normalizeRole(row.targetRole) === context.role;

  if (!owner && !targetedUser) {
    throw new ApiError(
      403,
      "FORBIDDEN",
      "You are not allowed to access responses for this requirement"
    );
  }

  return { row, context, owner, targetedUser };
}

async function serializeRequirementResponse(response) {
  const responderUser = await User.findById(
    response.responderUserId
  ).select("role");
  const responder = responderUser
    ? await getDisplayProfile(
        responderUser._id,
        responderUser.role
      )
    : { name: "Business account", role: response.responderRole };

  return {
    id: response._id,
    message: response.message,
    status: response.status,
    createdAt: response.createdAt,
    responder: {
      name: responder.name,
      role: normalizeRole(responder.role || response.responderRole),
      imageUrl: responder.imageUrl || null,
    },
  };
}

router.get(
  "/:id/responses",
  asyncHandler(async (req, res) => {
    const { row, owner } = await getAccessibleRequirement(
      req.params.id,
      req.user
    );
    if (!owner) {
      throw new ApiError(
        403,
        "FORBIDDEN",
        "Only the requirement owner can review responses"
      );
    }

    const responses = await RequirementResponse.find({
      requirementId: row._id,
      status: { $nin: ["WITHDRAWN", "REJECTED"] },
    }).sort({ createdAt: -1 });

    return ok(
      res,
      await Promise.all(responses.map(serializeRequirementResponse))
    );
  })
);

router.get(
  "/:id/my-response",
  requireRole("DISTRIBUTOR_STOCKIST"),
  asyncHandler(async (req, res) => {
    const { row, targetedUser } = await getAccessibleRequirement(
      req.params.id,
      req.user
    );
    if (!targetedUser) {
      throw new ApiError(
        403,
        "FORBIDDEN",
        "This requirement is not intended for distributors or stockists"
      );
    }

    const response = await RequirementResponse.findOne({
      requirementId: row._id,
      responderUserId: req.user.sub,
    });

    return ok(
      res,
      response ? await serializeRequirementResponse(response) : null
    );
  })
);

router.post(
  "/:id/responses",
  requireRole("DISTRIBUTOR_STOCKIST"),
  asyncHandler(async (req, res) => {
    const parsed = responseSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(
        res,
        400,
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message || "Enter a response message"
      );
    }

    const { row, context, owner, targetedUser } =
      await getAccessibleRequirement(req.params.id, req.user);
    const isPharmacyRequirement =
      row.ownerRole === "PHARMACY" ||
      (!row.ownerRole && row.pharmacyId);
    if (owner || !targetedUser || !isPharmacyRequirement) {
      throw new ApiError(
        403,
        "FORBIDDEN",
        "Only pharmacy requirements intended for distributors or stockists can be answered"
      );
    }
    if (row.status !== "OPEN") {
      throw new ApiError(
        409,
        "REQUIREMENT_CLOSED",
        "This requirement is no longer accepting responses"
      );
    }

    const profile = await getStockistProfileByUserId(req.user.sub);
    if (!profile.businessVerified) {
      throw new ApiError(
        403,
        "DISTRIBUTOR_NOT_VERIFIED",
        "Your distributor or stockist account must be verified before responding to pharmacy requirements"
      );
    }
    if (
      profile.licenceExpiryDate &&
      new Date(profile.licenceExpiryDate) <= new Date()
    ) {
      throw new ApiError(
        403,
        "DISTRIBUTOR_LICENCE_EXPIRED",
        "Your wholesale licence has expired. Renew and verify it before responding"
      );
    }

    const existingResponse = await RequirementResponse.findOne({
      requirementId: row._id,
      responderUserId: req.user.sub,
    });
    if (existingResponse) {
      throw new ApiError(
        409,
        "ALREADY_RESPONDED",
        "You have already responded to this requirement"
      );
    }

    let response;
    try {
      response = await RequirementResponse.create({
        requirementId: row._id,
        responderUserId: req.user.sub,
        responderRole: context.role,
        message: parsed.data.message,
      });
    } catch (createError) {
      if (createError?.code === 11000) {
        throw new ApiError(
          409,
          "ALREADY_RESPONDED",
          "You have already responded to this requirement"
        );
      }
      throw createError;
    }

    try {
      const pharmacy = await PharmacyProfile.findById(
        row.pharmacyId || row.ownerId
      ).select("userId");
      if (pharmacy?.userId) {
        await createNotification({
          userId: pharmacy.userId,
          type: "SYSTEM",
          title: "New supplier response",
          body: `${profile.companyName} responded to your requirement: ${row.title}`,
          data: {
            requirementId: row._id,
            responseId: response._id,
          },
        });
      }
    } catch (notificationError) {
      console.error("Requirement response notification failed:", notificationError);
    }

    return created(
      res,
      {
        id: response._id,
        message: response.message,
        status: response.status,
        createdAt: response.createdAt,
        responder: {
          name: profile.companyName,
          role: context.role,
          imageUrl: null,
        },
      }
    );
  })
);

/*
|--------------------------------------------------------------------------
| POST /requirements
|--------------------------------------------------------------------------
|
| Pharmacy creates procurement requirements.
|
| Example:
|
| Pharmacy -> COMPANY
| Pharmacy -> MR
| Pharmacy -> DISTRIBUTOR_STOCKIST
|
*/

router.post(
  "/",
  requireRole("PHARMACY"),
  asyncHandler(async (req, res) => {
    const parsed =
      createSchema.safeParse(
        req.body
      );

    if (!parsed.success) {
      return fail(
        res,
        400,
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ??
          "Invalid requirement data"
      );
    }

    const pharmacy =
      await getPharmacyProfileByUserId(
        req.user.sub
      );

    if (!pharmacy) {
      return fail(
        res,
        404,
        "PHARMACY_PROFILE_NOT_FOUND",
        "Pharmacy profile not found"
      );
    }

    const pharmacyId =
      pharmacy.id ??
      pharmacy._id;

    const {
      category,
      title,
      description,
      urgency,
      supplierType,
      targetRole,
    } = parsed.data;

    /*
     * Your current frontend sends supplierType.
     *
     * We convert it to targetRole internally.
     */
    const finalTargetRole =
      targetRole ||
      supplierType;

    /*
     * Pharmacy requirements may target
     * ONLY these three roles.
     */
    if (
      ![
        "COMPANY",
        "MR",
        "DISTRIBUTOR_STOCKIST",
      ].includes(
        finalTargetRole
      )
    ) {
      return fail(
        res,
        400,
        "INVALID_TARGET_ROLE",
        "Please select a valid supplier role"
      );
    }

    const row =
      await Requirement.create({
        /*
         * Existing field — keep it.
         */
        pharmacyId,

        /*
         * New role-based ownership fields.
         */
        ownerId:
          pharmacyId,

        ownerRole:
          "PHARMACY",

        /*
         * This determines exactly which role
         * receives/sees this requirement.
         */
        targetRole:
          finalTargetRole,

        category,
        title,
        description,
        urgency,
      });

    /*
     * Match ONLY profiles belonging to targetRole.
     *
     * The matching service must enforce this.
     */
    let matchedCount = 0;

    try {
      const matches =
        await matchForRequirement(
          row._id
        );

      matchedCount =
        Array.isArray(matches)
          ? matches.length
          : 0;

      /*
       * Notify only matching users.
       */
      for (
        const match of
        matches.slice(0, 5)
      ) {
        try {
          await createNotification({
            userId:
              match.userId,

            type:
              "REQUIREMENT_MATCH",

            title:
              "New pharmacy requirement matches your profile",

            body:
              `${pharmacy.pharmacyName} is looking for ${category} products/services.`,

            data: {
              requirementId:
                row._id,

              score:
                match.score,

              reasons:
                match.reasons,
            },
          });
        } catch (
          notificationError
        ) {
          console.error(
            "Requirement notification failed:",
            notificationError
          );
        }
      }
    } catch (
      matchingError
    ) {
      /*
       * Requirement creation should succeed even
       * when matching temporarily fails.
       */
      console.error(
        "Requirement matching failed:",
        matchingError
      );
    }

    return created(
      res,
      {
        requirement:
          serialize(
            row,
            {
              role: "PHARMACY",
              ownerId: pharmacyId,
              pharmacyId,
            }
          ),

        matchedCount,
      }
    );
  })
);

/*
|--------------------------------------------------------------------------
| PATCH /requirements/:id
|--------------------------------------------------------------------------
|
| Only the Pharmacy that owns the requirement can edit it.
|
| targetRole is deliberately NOT editable here.
|
*/

router.patch(
  "/:id",
  requireRole("PHARMACY"),
  asyncHandler(async (req, res) => {
    const parsed =
      updateSchema.safeParse(
        req.body
      );

    if (!parsed.success) {
      return fail(
        res,
        400,
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ??
          "Invalid requirement data"
      );
    }

    const row =
      await Requirement.findById(
        req.params.id
      );

    if (!row) {
      return fail(
        res,
        404,
        "NOT_FOUND",
        "Requirement not found"
      );
    }

    const pharmacy =
      await getPharmacyProfileByUserId(
        req.user.sub
      );

    if (!pharmacy) {
      return fail(
        res,
        404,
        "PHARMACY_PROFILE_NOT_FOUND",
        "Pharmacy profile not found"
      );
    }

    const pharmacyId =
      pharmacy.id ??
      pharmacy._id;

    const owner =
      (
        row.ownerId &&
        row.ownerId.toString() ===
          pharmacyId.toString()
      ) ||
      (
        row.pharmacyId &&
        row.pharmacyId.toString() ===
          pharmacyId.toString()
      );

    if (!owner) {
      throw new ApiError(
        403,
        "FORBIDDEN",
        "You can only edit your own requirement"
      );
    }

    Object.assign(
      row,
      parsed.data
    );

    await row.save();

    return ok(
      res,
      {
        requirement:
          serialize(
            row,
            {
              role: "PHARMACY",
              ownerId: pharmacyId,
              pharmacyId,
            }
          ),
      }
    );
  })
);

/*
|--------------------------------------------------------------------------
| DELETE /requirements/:id
|--------------------------------------------------------------------------
|
| Only the Pharmacy that owns the requirement can delete it.
|
*/

router.delete(
  "/:id",
  requireRole("PHARMACY"),
  asyncHandler(async (req, res) => {
    const row =
      await Requirement.findById(
        req.params.id
      );

    if (!row) {
      return fail(
        res,
        404,
        "NOT_FOUND",
        "Requirement not found"
      );
    }

    const pharmacy =
      await getPharmacyProfileByUserId(
        req.user.sub
      );

    if (!pharmacy) {
      return fail(
        res,
        404,
        "PHARMACY_PROFILE_NOT_FOUND",
        "Pharmacy profile not found"
      );
    }

    const pharmacyId =
      pharmacy.id ??
      pharmacy._id;

    const owner =
      (
        row.ownerId &&
        row.ownerId.toString() ===
          pharmacyId.toString()
      ) ||
      (
        row.pharmacyId &&
        row.pharmacyId.toString() ===
          pharmacyId.toString()
      );

    if (!owner) {
      throw new ApiError(
        403,
        "FORBIDDEN",
        "You can only delete your own requirement"
      );
    }

    await row.deleteOne();

    return ok(
      res,
      {
        deleted: true,
        requirementId:
          row._id,
      }
    );
  })
);

module.exports = router;