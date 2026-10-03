const express = require("express");
const { z } = require("zod");
const { asyncHandler, requireAuth } = require("../../common/middleware");
const { ApiError, created, fail, ok } = require("../../common/http");
const Appointment = require("../../models/Appointment");
const AppointmentReschedule = require("../../models/AppointmentReschedule");
const Connection = require("../../models/Connection");
const CompanyAuthorization = require("../../models/CompanyAuthorization");
const DoctorProfile = require("../../models/DoctorProfile");
const PharmaCompanyProfile = require("../../models/PharmaCompanyProfile");
const VerificationDocument = require("../../models/VerificationDocument");
const User = require("../../models/User");
const { getDisplayProfile } = require("../profiles/service");
const { createNotification } = require("../notifications/service");
const { emitRealtime } = require("../../realtime/bus");

const router = express.Router();
router.use(requireAuth);

async function hasCurrentCompanyRegistration(company, date) {
  return Boolean(
    await VerificationDocument.exists({
      userId: company.userId,
      docType: "BUSINESS_REG",
      status: "APPROVED",
      $or: [{ expiryDate: null }, { expiryDate: { $gt: date } }],
    })
  );
}

const APPOINTMENT_ROLES = {
  PHARMACY: [
    "MR",
    "PHARMA_COMPANY",
    "DISTRIBUTOR_STOCKIST",
  ],
  MR: [
    "PHARMACY",
    "PHARMA_COMPANY",
    "DISTRIBUTOR_STOCKIST",
    "DOCTOR",
  ],
  PHARMA_COMPANY: [
    "MR",
    "PHARMACY",
    "DISTRIBUTOR_STOCKIST",
    "DOCTOR",
  ],
  DISTRIBUTOR_STOCKIST: [
    "MR",
    "PHARMACY",
    "PHARMA_COMPANY",
  ],
};

async function serialize(a) {
  const requester = await User.findById(a.requesterId);
  const recipient = await User.findById(a.recipientId);

  let pendingReschedule = null;
  if (a.status === "RESCHEDULE_REQUESTED") {
    const pending = await AppointmentReschedule.findOne({ appointmentId: a._id, status: "PENDING" }).sort({
      createdAt: -1,
    });
    if (pending) {
      pendingReschedule = {
        id: pending._id,
        proposedByUserId: pending.proposedByUserId,
        proposedSlots: pending.proposedSlots,
      };
    }
  }

  return {
    id: a._id,
    requester: requester ? { userId: requester._id, ...(await getDisplayProfile(requester._id, requester.role)) } : null,
    recipient: recipient ? { userId: recipient._id, ...(await getDisplayProfile(recipient._id, recipient.role)) } : null,
    scheduledAt: a.scheduledAt,
    durationMinutes: a.durationMinutes,
    mode: a.mode,
    purposeCategory: a.purposeCategory || "",
    status: a.status,
    disruptionReason: a.disruptionReason,
    notes: a.notes,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
    pendingReschedule,
  };
}

function assertParticipant(a, userId) {
  if (a.requesterId.toString() !== userId && a.recipientId.toString() !== userId) {
    throw new ApiError(403, "FORBIDDEN", "You are not part of this appointment");
  }
}

function otherParty(a, userId) {
  return a.requesterId.toString() === userId ? a.recipientId : a.requesterId;
}

async function notifyAppointment(a, targetUserId, title, body) {
  const serialized = await serialize(a);
  const notification = await createNotification({
    userId: targetUserId,
    type: "APPOINTMENT_UPDATE",
    title,
    body,
    data: { appointmentId: a._id },
  });
  emitRealtime({
    type: "appointment:updated",
    userIds: [a.requesterId.toString(), a.recipientId.toString()],
    payload: { appointment: serialized, notification },
  });
}

const createSchema = z.object({
  recipientId: z.string().min(1),
  companyId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().int().positive().max(240).default(30),
  mode: z.enum(["PHYSICAL", "VIDEO"]).default("PHYSICAL"),
  notes: z.string().trim().max(1000).optional(),
  purposeCategory: z.string().trim().max(120).optional(),
});

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, 400, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input");
    const recipient = await User.findById(parsed.data.recipientId);
    if (!recipient) return fail(res, 404, "NOT_FOUND", "Recipient not found");
    if (recipient.status !== "ACTIVE") {
      return fail(
        res,
        403,
        "RECIPIENT_ACCOUNT_RESTRICTED",
        "Appointments cannot be requested from an inactive account"
      );
    }

    if (
      !APPOINTMENT_ROLES[req.user.role]?.includes(recipient.role)
    ) {
      return fail(
        res,
        403,
        "ROLE_APPOINTMENT_RESTRICTED",
        "Appointments are not available between these account roles"
      );
    }

    if (new Date(parsed.data.scheduledAt) <= new Date()) {
      return fail(res, 400, "VALIDATION_ERROR", "Appointment time must be in the future");
    }

    let doctorProfile = null;
    if (recipient.role === "DOCTOR") {
      if (!["MR", "PHARMA_COMPANY"].includes(req.user.role)) {
        return fail(
          res,
          403,
          "DOCTOR_CONTACT_RESTRICTED",
          "Only medical representatives or pharmaceutical companies may request a professional doctor appointment"
        );
      }

      doctorProfile = await DoctorProfile.findOne({
        userId: recipient._id,
      });
      if (
        !doctorProfile ||
        doctorProfile.registrationStatus !== "VERIFIED" ||
        !doctorProfile.businessVerified ||
        (doctorProfile.reVerificationDate &&
          doctorProfile.reVerificationDate <= new Date())
      ) {
        return fail(
          res,
          403,
          "DOCTOR_REGISTRATION_UNVERIFIED",
          "Professional appointment requests require a verified doctor registration"
        );
      }
      const currentMedicalRegistration = await VerificationDocument.exists({
        userId: recipient._id,
        docType: "MEDICAL_REGISTRATION",
        status: "APPROVED",
        $or: [
          { expiryDate: null },
          { expiryDate: { $gt: new Date(parsed.data.scheduledAt) } },
        ],
      });
      if (!currentMedicalRegistration) {
        return fail(
          res,
          403,
          "DOCTOR_REGISTRATION_EXPIRED",
          "A current approved medical registration is required"
        );
      }

      if (
        doctorProfile.blockedUserIds.some(
          (blockedUserId) =>
            blockedUserId.toString() === req.user.sub
        )
      ) {
        return fail(
          res,
          403,
          "DOCTOR_BLOCKED_REQUESTER",
          "This doctor is not accepting requests from your account"
        );
      }

      if (req.user.role === "PHARMA_COMPANY") {
        const company = await PharmaCompanyProfile.findOne({
          userId: req.user.sub,
          businessVerified: true,
          verificationStatus: "VERIFIED",
        });
        if (!company) {
          return fail(
            res,
            403,
            "COMPANY_VERIFICATION_REQUIRED",
            "Only verified pharmaceutical companies may request doctor appointments"
          );
        }
        if (
          !(await hasCurrentCompanyRegistration(
            company,
            new Date(parsed.data.scheduledAt)
          ))
        ) {
          return fail(
            res,
            403,
            "COMPANY_REGISTRATION_EXPIRED",
            "A current approved company registration is required"
          );
        }
      }

      const acceptsRequest =
        req.user.role === "MR"
          ? doctorProfile.acceptsMRRequests
          : doctorProfile.acceptsCompanyInformation;

      if (!doctorProfile || !acceptsRequest) {
        return fail(
          res,
          403,
          "DOCTOR_NOT_ACCEPTING_REQUESTS",
          "This doctor is not accepting this type of professional request"
        );
      }

      if (
        !doctorProfile.communicationModes.includes(
          parsed.data.mode
        ) ||
        parsed.data.durationMinutes !==
          doctorProfile.appointmentDurationMinutes
      ) {
        return fail(
          res,
          400,
          "DOCTOR_PREFERENCES_MISMATCH",
          "The proposed meeting mode and duration must match the doctor's stated preferences"
        );
      }

      if (
        !parsed.data.purposeCategory ||
        !parsed.data.notes ||
        parsed.data.notes.length < 10
      ) {
        return fail(
          res,
          400,
          "VALIDATION_ERROR",
          "Doctor requests need a therapeutic category and a clear professional purpose"
        );
      }

      if (req.user.role === "MR") {
        if (!parsed.data.companyId) {
          return fail(
            res,
            400,
            "MR_COMPANY_AUTHORIZATION_REQUIRED",
            "Select the company you are authorized to represent"
          );
        }
        const authorization = await CompanyAuthorization.findOne({
          companyId: parsed.data.companyId,
          mrUserId: req.user.sub,
          status: "ACTIVE",
          expiresAt: { $gt: new Date(parsed.data.scheduledAt) },
        });
        const authorizationDocument = authorization
          ? await VerificationDocument.findOne({
              _id: authorization.verificationDocumentId,
              userId: req.user.sub,
              companyId: authorization.companyId,
              docType: "COMPANY_AUTHORIZATION",
              status: "APPROVED",
              $or: [
                { expiryDate: null },
                { expiryDate: { $gt: new Date(parsed.data.scheduledAt) } },
              ],
            }).select("_id")
          : null;
        const categoryAuthorized = authorization?.categories.some(
          (category) =>
            category.toLowerCase() ===
            parsed.data.purposeCategory.toLowerCase()
        );
        const doctorLocation = doctorProfile.location.trim().toLowerCase();
        const territoryAuthorized =
          authorization?.territories.some((territory) => {
            const normalizedTerritory = territory.trim().toLowerCase();
            return (
              normalizedTerritory === doctorLocation ||
              normalizedTerritory.includes(doctorLocation) ||
              doctorLocation.includes(normalizedTerritory)
            );
          }) ?? false;
        const companyStillVerified = authorization
          ? await PharmaCompanyProfile.findOne({
              _id: authorization.companyId,
              businessVerified: true,
              verificationStatus: "VERIFIED",
            }).select("_id userId")
          : false;
        const companyRegistrationCurrent =
          companyStillVerified &&
          (await hasCurrentCompanyRegistration(
            companyStillVerified,
            new Date(parsed.data.scheduledAt)
          ));

        if (
          !authorization ||
          !authorizationDocument ||
          !categoryAuthorized ||
          !territoryAuthorized ||
          !companyRegistrationCurrent
        ) {
          return fail(
            res,
            403,
            "MR_AUTHORIZATION_SCOPE_MISMATCH",
            "Your active company authorization must cover this category, territory, and appointment date"
          );
        }
      }

      if (
        doctorProfile.acceptedCategories.length > 0 &&
        !doctorProfile.acceptedCategories.some(
          (category) =>
            category.toLowerCase() ===
            parsed.data.purposeCategory.toLowerCase()
        )
      ) {
        return fail(
          res,
          403,
          "DOCTOR_CATEGORY_NOT_ACCEPTED",
          "This doctor is not accepting requests for that category"
        );
      }

      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const requestsThisWeek = await Appointment.countDocuments({
        recipientId: recipient._id,
        createdAt: { $gte: weekAgo },
      });

      if (requestsThisWeek >= doctorProfile.maximumRequestsPerWeek) {
        return fail(
          res,
          429,
          "DOCTOR_REQUEST_LIMIT_REACHED",
          "This doctor's weekly professional appointment request limit has been reached"
        );
      }
    } else {
      const acceptedConnection = await Connection.exists({
        status: "ACCEPTED",
        $or: [
          {
            requesterId: recipient._id,
            recipientId: req.user.sub,
          },
          {
            requesterId: req.user.sub,
            recipientId: recipient._id,
          },
        ],
      });

      if (!acceptedConnection) {
        return fail(
          res,
          403,
          "ACCEPTED_CONNECTION_REQUIRED",
          "Appointments may be requested only with an accepted connection"
        );
      }
    }

    const row = await Appointment.create({
      requesterId: req.user.sub,
      recipientId: parsed.data.recipientId,
      scheduledAt: parsed.data.scheduledAt,
      durationMinutes: parsed.data.durationMinutes,
      mode: parsed.data.mode,
      notes: parsed.data.notes || "",
      purposeCategory: parsed.data.purposeCategory || "",
      status: recipient.role === "DOCTOR" ? "REQUESTED" : "CONFIRMED",
    });

    const requesterProfile = await getDisplayProfile(req.user.sub, req.user.role);
    await notifyAppointment(
      row,
      parsed.data.recipientId,
      recipient.role === "DOCTOR"
        ? "New professional appointment request"
        : "New appointment request",
      recipient.role === "DOCTOR"
        ? `${requesterProfile.name} requested a ${parsed.data.purposeCategory} meeting: ${parsed.data.notes}`
        : `${requesterProfile.name} requested an appointment on ${new Date(parsed.data.scheduledAt).toLocaleString()}.`
    );
    created(res, await serialize(row));
  })
);

router.get(
  "/calendar",
  asyncHandler(async (req, res) => {
    const from = req.query.from ? new Date(req.query.from) : new Date("0000-01-01");
    const to = req.query.to ? new Date(req.query.to) : new Date("9999-12-31");
    const rows = await Appointment.find({
      $or: [{ requesterId: req.user.sub }, { recipientId: req.user.sub }],
      scheduledAt: { $gte: from, $lte: to },
    }).sort({ scheduledAt: 1 });
    ok(res, await Promise.all(rows.map(serialize)));
  })
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = { $or: [{ requesterId: req.user.sub }, { recipientId: req.user.sub }] };
    if (req.query.status) query.status = req.query.status;
    const rows = await Appointment.find(query).sort({ scheduledAt: 1 });
    ok(res, await Promise.all(rows.map(serialize)));
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const row = await Appointment.findById(req.params.id);
    if (!row) return fail(res, 404, "NOT_FOUND", "Appointment not found");
    assertParticipant(row, req.user.sub);
    ok(res, await serialize(row));
  })
);

const statusSchema = z.object({
  status: z.enum(["RUNNING_LATE", "EMERGENCY", "CANCELLED", "COMPLETED", "CONFIRMED", "DECLINED"]),
  disruptionReason: z
    .enum(["WEATHER", "HEALTH", "TRAVEL", "TRAFFIC", "EMERGENCY", "PREVIOUS_DELAY", "UNAVAILABLE", "OTHER"])
    .optional(),
  notes: z.string().optional(),
});

router.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const row = await Appointment.findById(req.params.id);
    if (!row) return fail(res, 404, "NOT_FOUND", "Appointment not found");
    assertParticipant(row, req.user.sub);
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, 400, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input");

    if (row.status === "REQUESTED") {
      const isDoctorRecipient =
        req.user.role === "DOCTOR" &&
        row.recipientId.toString() === req.user.sub;
      const isRequester =
        row.requesterId.toString() === req.user.sub;

      if (
        (["CONFIRMED", "DECLINED"].includes(parsed.data.status) &&
          !isDoctorRecipient) ||
        (parsed.data.status === "DECLINED" &&
          !isDoctorRecipient) ||
        (parsed.data.status === "CANCELLED" &&
          !isRequester) ||
        !["CONFIRMED", "DECLINED", "CANCELLED"].includes(
          parsed.data.status
        )
      ) {
        return fail(
          res,
          403,
          "REQUEST_DECISION_FORBIDDEN",
          "Only the invited doctor may accept or decline a request; only its requester may cancel it"
        );
      }
    } else if (parsed.data.status === "DECLINED") {
      return fail(
        res,
        409,
        "REQUEST_ALREADY_RESOLVED",
        "Only a pending professional request can be declined"
      );
    }

    row.status = parsed.data.status;
    row.disruptionReason = parsed.data.disruptionReason || null;
    if (parsed.data.notes !== undefined) row.notes = parsed.data.notes;
    await row.save();

    const statusLabel = {
      RUNNING_LATE: "is running late",
      EMERGENCY: "has an emergency and cannot make it",
      CANCELLED: "cancelled the appointment",
      COMPLETED: "marked the appointment as completed",
      CONFIRMED: "confirmed the appointment",
      DECLINED: "declined the professional appointment request",
    };
    const actorProfile = await getDisplayProfile(req.user.sub, req.user.role);
    await notifyAppointment(
      row,
      otherParty(row, req.user.sub),
      "Appointment update",
      `${actorProfile.name} ${statusLabel[parsed.data.status]}${
        parsed.data.disruptionReason ? ` (reason: ${parsed.data.disruptionReason.toLowerCase()})` : ""
      }.`
    );
    ok(res, await serialize(row));
  })
);

function suggestSlots(scheduledAt) {
  const base = new Date(scheduledAt);
  return [
    new Date(base.getTime() + 2 * 60 * 60 * 1000), // +2h same day
    new Date(base.getTime() + 24 * 60 * 60 * 1000), // next day, same time
    new Date(base.getTime() + 2 * 24 * 60 * 60 * 1000), // day after, same time
  ];
}

const rescheduleSchema = z.object({
  reason: z
    .enum(["WEATHER", "HEALTH", "TRAVEL", "TRAFFIC", "EMERGENCY", "PREVIOUS_DELAY", "UNAVAILABLE", "OTHER"])
    .default("OTHER"),
  proposedSlots: z.array(z.string().datetime()).optional(),
});

router.post(
  "/:id/reschedule",
  asyncHandler(async (req, res) => {
    const row = await Appointment.findById(req.params.id);
    if (!row) return fail(res, 404, "NOT_FOUND", "Appointment not found");
    assertParticipant(row, req.user.sub);
    if (row.status === "REQUESTED") {
      return fail(
        res,
        409,
        "REQUEST_NOT_ACCEPTED",
        "A professional appointment can be rescheduled after the doctor accepts it"
      );
    }
    const parsed = rescheduleSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, 400, "VALIDATION_ERROR", "Invalid reschedule payload");

    const slots = parsed.data.proposedSlots?.length
      ? parsed.data.proposedSlots.map((s) => new Date(s))
      : suggestSlots(row.scheduledAt);

    const reschedule = await AppointmentReschedule.create({
      appointmentId: row._id,
      proposedByUserId: req.user.sub,
      proposedSlots: slots,
    });

    row.status = "RESCHEDULE_REQUESTED";
    row.disruptionReason = parsed.data.reason;
    await row.save();

    const actorProfile = await getDisplayProfile(req.user.sub, req.user.role);
    await notifyAppointment(
      row,
      otherParty(row, req.user.sub),
      "Reschedule requested",
      `${actorProfile.name} needs to reschedule (${parsed.data.reason.toLowerCase()}). Suggested new times are ready for your review.`
    );

    ok(res, { rescheduleId: reschedule._id, proposedSlots: slots, appointment: await serialize(row) });
  })
);

router.patch(
  "/:id/reschedule/:rescheduleId/confirm",
  asyncHandler(async (req, res) => {
    const row = await Appointment.findById(req.params.id);
    if (!row) return fail(res, 404, "NOT_FOUND", "Appointment not found");
    assertParticipant(row, req.user.sub);

    const reschedule = await AppointmentReschedule.findOne({ _id: req.params.rescheduleId, appointmentId: row._id });
    if (!reschedule) return fail(res, 404, "NOT_FOUND", "Reschedule proposal not found");
    if (reschedule.proposedByUserId.toString() === req.user.sub) {
      throw new ApiError(403, "FORBIDDEN", "The other party must confirm the new slot");
    }
    if (reschedule.status !== "PENDING") return fail(res, 409, "ALREADY_RESOLVED", "This proposal was already resolved");

    const { acceptedSlot } = req.body;
    const match = reschedule.proposedSlots.find((s) => new Date(s).getTime() === new Date(acceptedSlot || 0).getTime());
    if (!acceptedSlot || !match) {
      return fail(res, 400, "VALIDATION_ERROR", "acceptedSlot must be one of the proposed slots");
    }

    reschedule.status = "ACCEPTED";
    reschedule.acceptedSlot = match;
    await reschedule.save();

    row.scheduledAt = match;
    row.status = "CONFIRMED";
    row.disruptionReason = null;
    await row.save();

    const actorProfile = await getDisplayProfile(req.user.sub, req.user.role);
    await notifyAppointment(
      row,
      otherParty(row, req.user.sub),
      "Reschedule confirmed",
      `${actorProfile.name} confirmed the new time: ${new Date(match).toLocaleString()}.`
    );
    ok(res, await serialize(row));
  })
);

module.exports = router;
