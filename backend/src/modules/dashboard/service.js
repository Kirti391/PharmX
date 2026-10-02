const Appointment = require("../../models/Appointment");
const Connection = require("../../models/Connection");
const Notification = require("../../models/Notification");
const Requirement = require("../../models/Requirement");
const VerificationDocument = require("../../models/VerificationDocument");
const User = require("../../models/User");

const {
  getPharmacyProfileByUserId,
  getDisplayProfile,
} = require("../profiles/service");

/**
 * Serialize a requirement for the dashboard.
 */
function serializeRequirement(requirement) {
  return {
    id: requirement._id,
    category: requirement.category,
    title: requirement.title,
    description: requirement.description,
    urgency: requirement.urgency,
    status: requirement.status,
    createdAt: requirement.createdAt,
  };
}

/**
 * Get the other participant in a connection and
 * return their public display profile.
 */
async function enrichConnection(
  connection,
  userId
) {
  const otherId =
    connection.requesterId.toString() ===
    userId.toString()
      ? connection.recipientId
      : connection.requesterId;

  const otherUser = await User.findById(
    otherId
  ).select("role");

  const other = otherUser
    ? await getDisplayProfile(
        otherUser._id,
        otherUser.role
      )
    : {
        name: "Unknown",
        imageUrl: null,
        role: null,
      };

  return {
    id: connection._id,
    status: connection.status,
    createdAt: connection.createdAt,
    other,
  };
}

/**
 * Get the other participant in an appointment
 * and return their public display profile.
 */
async function enrichAppointment(
  appointment,
  userId
) {
  const otherId =
    appointment.requesterId.toString() ===
    userId.toString()
      ? appointment.recipientId
      : appointment.requesterId;

  const otherUser = await User.findById(
    otherId
  ).select("role");

  const other = otherUser
    ? await getDisplayProfile(
        otherUser._id,
        otherUser.role
      )
    : {
        name: "Unknown",
        imageUrl: null,
        role: null,
      };

  return {
    id: appointment._id,
    scheduledAt: appointment.scheduledAt,
    durationMinutes:
      appointment.durationMinutes,
    mode: appointment.mode,
    status: appointment.status,
    notes: appointment.notes,
    other,
  };
}

/**
 * Build the complete Pharmacy dashboard payload.
 *
 * This intentionally keeps dashboard aggregation out of
 * PharmacyProfile. Profile data remains profile data, while
 * this service combines data from the different PharmX
 * modules needed by the dashboard.
 */
async function getPharmacyDashboard(
  userId
) {
  const pharmacy =
    await getPharmacyProfileByUserId(userId);

  const now = new Date();

  const [
    requirements,
    appointments,
    connections,
    notifications,
    documents,
  ] = await Promise.all([
    Requirement.find({
      pharmacyId: pharmacy.id,
    })
      .sort({ createdAt: -1 })
      .limit(5),

    Appointment.find({
      $or: [
        { requesterId: userId },
        { recipientId: userId },
      ],
      scheduledAt: {
        $gte: now,
      },
      status: {
        $nin: [
          "CANCELLED",
          "COMPLETED",
        ],
      },
    })
      .sort({ scheduledAt: 1 })
      .limit(5),

    Connection.find({
      $or: [
        { requesterId: userId },
        { recipientId: userId },
      ],
      status: "ACCEPTED",
    })
      .sort({ createdAt: -1 })
      .limit(5),

    Notification.find({
      userId,
    })
      .sort({ createdAt: -1 })
      .limit(5),

    VerificationDocument.find({
      userId,
    }).sort({ createdAt: -1 }),
  ]);

  /**
   * Dashboard counts.
   */
  const openRequirements =
    await Requirement.countDocuments({
      pharmacyId: pharmacy.id,
      status: "OPEN",
    });

  const unreadNotifications =
    await Notification.countDocuments({
      userId,
      readAt: null,
    });

  const totalConnections =
    await Connection.countDocuments({
      $or: [
        { requesterId: userId },
        { recipientId: userId },
      ],
      status: "ACCEPTED",
    });

  /**
   * Verification document counts.
   */
  const pendingDocuments =
    documents.filter(
      (doc) => doc.status === "PENDING"
    ).length;

  const rejectedDocuments =
    documents.filter(
      (doc) => doc.status === "REJECTED"
    ).length;

  const approvedDocuments =
    documents.filter(
      (doc) => doc.status === "APPROVED"
    ).length;

  /**
   * Determine the overall verification state.
   *
   * Current PharmX data model supports:
   * VERIFIED
   * ACTION_REQUIRED
   * PENDING
   * NOT_SUBMITTED
   */
  let verificationStatus = "NOT_SUBMITTED";

  if (pharmacy.businessVerified) {
    verificationStatus = "VERIFIED";
  } else if (rejectedDocuments > 0) {
    verificationStatus = "ACTION_REQUIRED";
  } else if (pendingDocuments > 0) {
    verificationStatus = "PENDING";
  }

  return {
    profile: {
      id: pharmacy.id,
      pharmacyName:
        pharmacy.pharmacyName,
      location:
        pharmacy.location,
      businessVerified:
        pharmacy.businessVerified,
      interestedCategories:
        pharmacy.interestedCategories,
      preferredAppointmentWindows:
        pharmacy.preferredAppointmentWindows,
    },

    verification: {
      businessVerified:
        pharmacy.businessVerified,

      totalDocuments:
        documents.length,

      pendingDocuments,

      rejectedDocuments,

      approvedDocuments,

      status:
        verificationStatus,
    },

    stats: {
      openRequirements,

      upcomingAppointments:
        appointments.length,

      connections:
        totalConnections,

      unreadNotifications,
    },

    requirements:
      requirements.map(
        serializeRequirement
      ),

    appointments:
      await Promise.all(
        appointments.map(
          (appointment) =>
            enrichAppointment(
              appointment,
              userId
            )
        )
      ),

    connections:
      await Promise.all(
        connections.map(
          (connection) =>
            enrichConnection(
              connection,
              userId
            )
        )
      ),

    notifications:
      notifications.map(
        (notification) => ({
          id: notification._id,
          title:
            notification.title,
          body:
            notification.body,
          readAt:
            notification.readAt,
          createdAt:
            notification.createdAt,
        })
      ),
  };
}

module.exports = {
  getPharmacyDashboard,
};