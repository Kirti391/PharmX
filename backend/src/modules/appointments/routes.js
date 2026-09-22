const express = require("express");
const { z } = require("zod");
const { asyncHandler, requireAuth } = require("../../common/middleware");
const { ApiError, created, fail, ok } = require("../../common/http");
const Appointment = require("../../models/Appointment");
const AppointmentReschedule = require("../../models/AppointmentReschedule");
const User = require("../../models/User");
const { getDisplayProfile } = require("../profiles/service");
const { createNotification } = require("../notifications/service");
const { emitRealtime } = require("../../realtime/bus");

const router = express.Router();
router.use(requireAuth);

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
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().int().positive().max(240).default(30),
  mode: z.enum(["PHYSICAL", "VIDEO"]).default("PHYSICAL"),
  notes: z.string().optional(),
});

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, 400, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input");
    const recipient = await User.findById(parsed.data.recipientId);
    if (!recipient) return fail(res, 404, "NOT_FOUND", "Recipient not found");

    const row = await Appointment.create({
      requesterId: req.user.sub,
      recipientId: parsed.data.recipientId,
      scheduledAt: parsed.data.scheduledAt,
      durationMinutes: parsed.data.durationMinutes,
      mode: parsed.data.mode,
      notes: parsed.data.notes || "",
    });

    const requesterProfile = await getDisplayProfile(req.user.sub, req.user.role);
    await notifyAppointment(
      row,
      parsed.data.recipientId,
      "New appointment request",
      `${requesterProfile.name} requested an appointment on ${new Date(parsed.data.scheduledAt).toLocaleString()}.`
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
  status: z.enum(["RUNNING_LATE", "EMERGENCY", "CANCELLED", "COMPLETED", "CONFIRMED"]),
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
