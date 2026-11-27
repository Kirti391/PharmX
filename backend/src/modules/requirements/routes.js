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
const Connection = require("../../models/Connection");
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
const { hasCurrentConnectionVerification } = require("../connections/verification");
const {
  getRequirementStage,
  getMRSupportRequestValidationError,
} = require("./workflow");
const { MR_SUPPORT_REQUEST_TYPES } = require("../../common/constants");

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
const REQUIREMENT_SUPPLIER_ROLES = [
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

  requestType: z
    .enum(MR_SUPPORT_REQUEST_TYPES)
    .optional(),

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

  requestType: z
    .enum(MR_SUPPORT_REQUEST_TYPES)
    .optional(),
});

const responseSchema = z.object({
  message: z.string().trim().min(5).max(2000),
});

const responseStatusSchema = z.object({
  status: z.enum(["PENDING", "SHORTLISTED"]),
});

const requirementStatusSchema = z.object({
  status: z.enum(["FULFILLED", "CLOSED"]),
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

    requestType:
      requirement.requestType ?? null,

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

    matchingCount:
      requirement.matchingCount ?? 0,

    fulfilledAt:
      requirement.fulfilledAt ?? null,

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

async function getWorkflowSummaries(rows, context) {
  const summaries = new Map();
  if (context.role !== "PHARMACY" || rows.length === 0) {
    return summaries;
  }

  const pharmacy = await PharmacyProfile.findById(context.pharmacyId)
    .select("userId")
    .lean();
  const requirementIds = rows.map((row) => row._id);
  const responses = await RequirementResponse.find({
    requirementId: { $in: requirementIds },
    status: { $in: ["PENDING", "SHORTLISTED", "ACCEPTED"] },
  })
    .select("requirementId responderUserId status")
    .lean();
  const responsesByRequirement = new Map();
  for (const response of responses) {
    const requirementId = response.requirementId.toString();
    const requirementResponses =
      responsesByRequirement.get(requirementId) || [];
    requirementResponses.push(response);
    responsesByRequirement.set(requirementId, requirementResponses);
  }

  const responderIds = [
    ...new Set(responses.map((response) => response.responderUserId.toString())),
  ];
  const connectedResponderIds = new Set();

  if (pharmacy?.userId && responderIds.length > 0) {
    const connections = await Connection.find({
      status: "ACCEPTED",
      $or: [
        {
          requesterId: pharmacy.userId,
          recipientId: { $in: responderIds },
        },
        {
          recipientId: pharmacy.userId,
          requesterId: { $in: responderIds },
        },
      ],
    })
      .select("requesterId recipientId")
      .lean();

    for (const connection of connections) {
      const otherUserId =
        connection.requesterId.toString() === pharmacy.userId.toString()
          ? connection.recipientId.toString()
          : connection.requesterId.toString();
      connectedResponderIds.add(otherUserId);
    }
  }

  for (const row of rows) {
    const requirementResponses =
      responsesByRequirement.get(row._id.toString()) || [];

    summaries.set(row._id.toString(), {
      pipelineStage: getRequirementStage(
        row,
        requirementResponses,
        connectedResponderIds
      ),
      responseCount: requirementResponses.length,
    });
  }

  return summaries;
}

async function refreshLegacyMatchingCounts(rows) {
  const activeRows = rows.filter((row) =>
    ["OPEN", "MATCHED"].includes(row.status)
  );
  if (activeRows.length === 0) return;

  const missingRows = await Requirement.collection
    .find({
      _id: { $in: activeRows.map((row) => row._id) },
      matchingCount: { $exists: false },
    })
    .project({ _id: 1 })
    .toArray();
  const missingIds = new Set(
    missingRows.map((row) => row._id.toString())
  );
  const rowsToRefresh = activeRows.filter((row) =>
    missingIds.has(row._id.toString())
  );

  for (let index = 0; index < rowsToRefresh.length; index += 3) {
    const batch = rowsToRefresh.slice(index, index + 3);
    await Promise.all(
      batch.map(async (row) => {
        try {
          const matches = await matchForRequirement(row._id);
          const matchingCount = Array.isArray(matches) ? matches.length : 0;
          await Requirement.updateOne(
            {
              _id: row._id,
              matchingCount: { $exists: false },
            },
            { $set: { matchingCount } }
          );
          row.matchingCount = matchingCount;
        } catch (matchingError) {
          console.error(
            `Legacy requirement matching refresh failed for ${row._id}:`,
            matchingError
          );
        }
      })
    );
  }
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
    const status = String(req.query.status || "ALL").toUpperCase();
    const supportedStatuses = [
      "ALL",
      "OPEN",
      "MATCHING",
      "RESPONSES",
      "SHORTLISTED",
      "CONNECTED",
      "FULFILLED",
      "CLOSED",
    ];
    if (!supportedStatuses.includes(status)) {
      return fail(
        res,
        400,
        "VALIDATION_ERROR",
        "Unsupported requirement status"
      );
    }

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
     * Stockists/distributors receive pharmacy and company supply requests,
     * but never requirements posted by other stockists/distributors.
     */
    if (context.role !== "DISTRIBUTOR_STOCKIST") {
      visibility.push({
        targetRole: context.role,
        ...(context.role === "MR"
          ? { requestType: { $in: MR_SUPPORT_REQUEST_TYPES } }
          : {}),
      });
    } else {
      visibility.push({
        targetRole: "DISTRIBUTOR_STOCKIST",
        ownerRole: { $ne: "DISTRIBUTOR_STOCKIST" },
      });
    }

    const query = { $or: visibility };
    if (context.role !== "PHARMACY" && status !== "ALL") {
      query.status = status;
    }

    const rows = await Requirement.find(query).sort({
      createdAt: -1,
    });
    const workflowRows = rows.filter((row) => isOwner(row, context));
    if (context.role === "PHARMACY") {
      await refreshLegacyMatchingCounts(workflowRows);
    }
    const workflowSummaries = await getWorkflowSummaries(
      workflowRows,
      context
    );

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

    const result = visibleRows.map((row) => {
      const data = serialize(row, context);
      const workflow = workflowSummaries.get(row._id.toString());

      return workflow
        ? { ...data, ...workflow }
        : { ...data, pipelineStage: row.status };
    });

    return ok(
      res,
      result.filter((requirement) => {
        if (status === "ALL") return true;
        if (context.role === "PHARMACY") {
          return requirement.pipelineStage === status;
        }
        return requirement.status === status;
      })
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

    const data = serialize(row, context);
    const workflow = owner
      ? await getWorkflowSummaries([row], context)
      : new Map();

    return ok(res, {
      ...data,
      ...(workflow.get(row._id.toString()) || {
        pipelineStage: row.status,
      }),
    });
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

async function serializeRequirementResponse(
  response,
  connectionStatus = null
) {
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
      userId: response.responderUserId,
      name: responder.name,
      role: normalizeRole(responder.role || response.responderRole),
      imageUrl: responder.imageUrl || null,
      connectionStatus,
    },
  };
}

async function getResponseConnectionStatuses(row, responses) {
  const pharmacy = await PharmacyProfile.findById(
    row.pharmacyId || row.ownerId
  )
    .select("userId")
    .lean();
  if (!pharmacy?.userId || responses.length === 0) {
    return new Map();
  }

  const responderIds = [
    ...new Set(
      responses.map((response) =>
        response.responderUserId.toString()
      )
    ),
  ];
  const connections = await Connection.find({
    status: { $in: ["PENDING", "ACCEPTED", "DECLINED"] },
    $or: [
      {
        requesterId: pharmacy.userId,
        recipientId: { $in: responderIds },
      },
      {
        recipientId: pharmacy.userId,
        requesterId: { $in: responderIds },
      },
    ],
  })
    .select("requesterId recipientId status")
    .lean();

  const statuses = new Map();
  for (const connection of connections) {
    const responderId =
      connection.requesterId.toString() === pharmacy.userId.toString()
        ? connection.recipientId.toString()
        : connection.requesterId.toString();
    if (
      connection.status === "ACCEPTED" ||
      !statuses.has(responderId)
    ) {
      statuses.set(responderId, connection.status);
    }
  }
  return statuses;
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
    const connectionStatuses = await getResponseConnectionStatuses(
      row,
      responses
    );

    return ok(
      res,
      await Promise.all(
        responses.map((response) =>
          serializeRequirementResponse(
            response,
            connectionStatuses.get(
              response.responderUserId.toString()
            ) || null
          )
        )
      )
    );
  })
);

router.patch(
  "/:id/responses/:responseId",
  requireRole("PHARMACY"),
  asyncHandler(async (req, res) => {
    const parsed = responseStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(
        res,
        400,
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message || "Invalid response status"
      );
    }

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

    const response = await RequirementResponse.findOne({
      _id: req.params.responseId,
      requirementId: row._id,
    });
    if (!response) {
      throw new ApiError(404, "NOT_FOUND", "Supplier response not found");
    }
    if (!["PENDING", "SHORTLISTED"].includes(response.status)) {
      throw new ApiError(
        409,
        "RESPONSE_ALREADY_RESOLVED",
        "Only pending or shortlisted responses can be updated"
      );
    }

    response.status = parsed.data.status;
    await response.save();

    const connectionStatuses = await getResponseConnectionStatuses(
      row,
      [response]
    );
    return ok(
      res,
      await serializeRequirementResponse(
        response,
        connectionStatuses.get(response.responderUserId.toString()) || null
      )
    );
  })
);

router.get(
  "/:id/my-response",
  asyncHandler(async (req, res) => {
    const { row, context, targetedUser } = await getAccessibleRequirement(
      req.params.id,
      req.user
    );
    if (
      !REQUIREMENT_SUPPLIER_ROLES.includes(context.role) ||
      !targetedUser
    ) {
      throw new ApiError(
        403,
        "FORBIDDEN",
        "This requirement is not intended for your supplier role"
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
    const isProcurementRequirement =
      row.ownerRole === "PHARMACY" ||
      row.ownerRole === "DISTRIBUTOR_STOCKIST" ||
      (!row.ownerRole && row.pharmacyId);
    if (
      owner ||
      !targetedUser ||
      !isProcurementRequirement ||
      !REQUIREMENT_SUPPLIER_ROLES.includes(context.role)
    ) {
      throw new ApiError(
        403,
        "FORBIDDEN",
        "Only procurement requirements intended for your supplier role can be answered"
      );
    }
    if (context.role === "MR" && !row.requestType) {
      throw new ApiError(
        409,
        "LEGACY_MR_REQUEST_FORMAT",
        "This older request must be updated to a Medical Representative support request before it can be answered."
      );
    }
    if (!["OPEN", "MATCHED"].includes(row.status)) {
      throw new ApiError(
        409,
        "REQUIREMENT_CLOSED",
        "This requirement is no longer accepting responses"
      );
    }

    const responderUser = await User.findById(req.user.sub).select(
      "_id role status"
    );
    if (
      !responderUser ||
      responderUser.status !== "ACTIVE" ||
      !(await hasCurrentConnectionVerification(responderUser))
    ) {
      throw new ApiError(
        403,
        "SUPPLIER_NOT_VERIFIED",
        "Your account must be active and have current admin-approved verification before responding"
      );
    }

    let supplierName;
    if (context.role === "DISTRIBUTOR_STOCKIST") {
      const profile = await getStockistProfileByUserId(req.user.sub);
      if (!profile) {
        throw new ApiError(
          404,
          "DISTRIBUTOR_PROFILE_NOT_FOUND",
          "Distributor or stockist profile not found"
        );
      }
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
      supplierName = profile.companyName;
    } else {
      const displayProfile = await getDisplayProfile(
        responderUser._id,
        responderUser.role
      );
      supplierName = displayProfile.name;
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
          body: `${supplierName} responded to your requirement: ${row.title}`,
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
          name: supplierName,
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
  requireRole("PHARMACY", "DISTRIBUTOR_STOCKIST", "DISTRIBUTOR", "STOCKIST"),
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

    const contextRole = normalizeRole(req.user.role);
    let pharmacyId = null;

    if (contextRole === "PHARMACY") {
      const pharmacy =
        await getPharmacyProfileByUserId(req.user.sub);

      if (!pharmacy) {
        return fail(
          res,
          404,
          "PHARMACY_PROFILE_NOT_FOUND",
          "Pharmacy profile not found"
        );
      }
      pharmacyId = pharmacy.id ?? pharmacy._id;
    }

    const {
      category,
      title,
      description,
      urgency,
      supplierType,
      targetRole,
      requestType,
    } = parsed.data;

    /*
     * Your current frontend sends supplierType.
     *
     * We convert it to targetRole internally.
     */
    const finalTargetRole =
      targetRole ||
      supplierType;

    if (
      contextRole === "DISTRIBUTOR_STOCKIST" &&
      finalTargetRole !== "COMPANY"
    ) {
      return fail(
        res,
        400,
        "INVALID_TARGET_ROLE",
        "Stockist and distributor requirements can only be sent to pharmaceutical companies."
      );
    }

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

    const requestValidationError =
      getMRSupportRequestValidationError(
        finalTargetRole,
        category,
        requestType
      );
    if (requestValidationError) {
      return fail(
        res,
        400,
        "INVALID_MR_SUPPORT_REQUEST_TYPE",
        requestValidationError === "INVALID_THERAPEUTIC_AREA"
          ? "Select a supported therapeutic area for Medical Representative matching."
          : requestValidationError === "REQUEST_TYPE_REQUIRED"
            ? "Select the kind of support you need from the Medical Representative."
            : "Support request types can only be used for Medical Representative requests."
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
          contextRole === "PHARMACY" ? pharmacyId : req.user.sub,

        ownerRole:
          contextRole,

        /*
         * This determines exactly which role
         * receives/sees this requirement.
         */
        targetRole:
          finalTargetRole,

        requestType:
          finalTargetRole === "MR"
            ? requestType
            : null,

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
              finalTargetRole === "MR"
                ? "New pharmacy support request matches your profile"
                : "New pharmacy requirement matches your profile",

            body:
              finalTargetRole === "MR"
                ? `${pharmacy.pharmacyName} requests ${requestType.toLowerCase().replaceAll("_", " ")} support in ${category}.`
                : `${pharmacy.pharmacyName} is looking for ${category} products/services.`,

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

    row.matchingCount = matchedCount;
    await row.save();

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

    const requestValidationError =
      getMRSupportRequestValidationError(
        normalizeRole(row.targetRole),
        parsed.data.category ?? row.category,
        parsed.data.requestType ?? row.requestType
      );
    if (requestValidationError) {
      return fail(
        res,
        400,
        "INVALID_MR_SUPPORT_REQUEST_TYPE",
        requestValidationError === "INVALID_THERAPEUTIC_AREA"
          ? "Select a supported therapeutic area for Medical Representative matching."
          : requestValidationError === "REQUEST_TYPE_REQUIRED"
            ? "Select the kind of support you need from the Medical Representative."
            : "Support request types can only be used for Medical Representative requests."
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

router.patch(
  "/:id/status",
  requireRole("PHARMACY"),
  asyncHandler(async (req, res) => {
    const parsed = requirementStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(
        res,
        400,
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message || "Invalid requirement status"
      );
    }

    const row = await Requirement.findById(req.params.id);
    if (!row) {
      return fail(res, 404, "NOT_FOUND", "Requirement not found");
    }

    const pharmacy = await getPharmacyProfileByUserId(req.user.sub);
    if (!pharmacy) {
      return fail(
        res,
        404,
        "PHARMACY_PROFILE_NOT_FOUND",
        "Pharmacy profile not found"
      );
    }

    const pharmacyId = pharmacy.id ?? pharmacy._id;
    if (!isOwner(row, {
      role: "PHARMACY",
      ownerId: pharmacyId,
      pharmacyId,
    })) {
      throw new ApiError(
        403,
        "FORBIDDEN",
        "You can only update your own requirement"
      );
    }
    if (!["OPEN", "MATCHED"].includes(row.status)) {
      throw new ApiError(
        409,
        "REQUIREMENT_ALREADY_CLOSED",
        "This requirement is already fulfilled or closed"
      );
    }

    row.status = parsed.data.status;
    row.fulfilledAt =
      parsed.data.status === "FULFILLED" ? new Date() : null;
    await row.save();

    return ok(res, {
      requirement: serialize(
        row,
        {
          role: "PHARMACY",
          ownerId: pharmacyId,
          pharmacyId,
        }
      ),
    });
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
