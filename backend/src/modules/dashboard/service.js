const Appointment = require("../../models/Appointment");
const CompanyAuthorization = require("../../models/CompanyAuthorization");
const Connection = require("../../models/Connection");
const FollowUp = require("../../models/FollowUp");
const Lead = require("../../models/Lead");
const Notification = require("../../models/Notification");
const Opportunity = require("../../models/Opportunity");
const Requirement = require("../../models/Requirement");
const VerificationDocument = require("../../models/VerificationDocument");
const User = require("../../models/User");
const { CLOSED_LEAD_STAGES } = require("../../common/constants");

const {
  getDoctorProfileByUserId,
  getMRProfileByUserId,
  getPharmaProfileByUserId,
  getPharmacyProfileByUserId,
  getStockistProfileByUserId,
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
    createdAt: appointment.createdAt,
    durationMinutes:
      appointment.durationMinutes,
    mode: appointment.mode,
    purposeCategory: appointment.purposeCategory,
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
  const appointmentFilter = {
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
  };
  const [
    requirements,
    appointments,
    upcomingAppointmentCount,
    connections,
    notifications,
    documents,
  ] = await Promise.all([
    Requirement.find({
      pharmacyId: pharmacy.id,
    })
      .sort({ createdAt: -1 })
      .limit(5),

    Appointment.find(appointmentFilter)
      .sort({ scheduledAt: 1 })
      .limit(5),

    Appointment.countDocuments(appointmentFilter),

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
        upcomingAppointmentCount,

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

function serializeOpportunity(opportunity) {
  return {
    id: opportunity._id,
    type: opportunity.type,
    title: opportunity.title,
    description: opportunity.description,
    categories: opportunity.categories,
    territories: opportunity.territories,
    status: opportunity.status,
    createdAt: opportunity.createdAt,
    expiresAt: opportunity.expiresAt,
  };
}

async function getRoleDashboard(userId, role) {
  const profileByRole = {
    MR: getMRProfileByUserId,
    PHARMA_COMPANY: getPharmaProfileByUserId,
    DISTRIBUTOR_STOCKIST: getStockistProfileByUserId,
    DOCTOR: getDoctorProfileByUserId,
  };
  const getProfile = profileByRole[role];

  if (!getProfile) {
    throw new Error(`Unsupported dashboard role: ${role}`);
  }

  const profile = await getProfile(userId);
  const now = new Date();
  const appointmentFilter = {
    $or: [
      { requesterId: userId },
      { recipientId: userId },
    ],
    scheduledAt: { $gte: now },
    status: {
      $nin: ["CANCELLED", "COMPLETED", "DECLINED"],
    },
  };
  const doctorUpcomingAppointmentFilter = {
    $or: [
      { requesterId: userId },
      { recipientId: userId },
    ],
    scheduledAt: { $gte: now },
    status: {
      $nin: ["CANCELLED", "COMPLETED", "DECLINED", "REQUESTED"],
    },
  };
  const requirementFilter = {
    status: "OPEN",
    $or: [
      { ownerId: role === "PHARMA_COMPANY" ? userId : profile.id },
      {
        targetRole:
          role === "PHARMA_COMPANY" ? "COMPANY" : role,
      },
    ],
  };
  const opportunityFilter =
    role === "PHARMA_COMPANY"
      ? { companyId: profile.id, status: "OPEN" }
      : role === "MR"
        ? { type: "MR_HIRING", status: "OPEN" }
        : role === "DISTRIBUTOR_STOCKIST"
          ? { type: "DISTRIBUTION", status: "OPEN" }
          : null;
  const currentCompanyRegistration =
    role === "PHARMA_COMPANY"
      ? await VerificationDocument.exists({
            userId,
            docType: "BUSINESS_REG",
            status: "APPROVED",
            $or: [{ expiryDate: null }, { expiryDate: { $gt: now } }],
          })
      : true;
  const currentDistributorLicence =
    role === "DISTRIBUTOR_STOCKIST" &&
    profile.licenceExpiryDate &&
    profile.licenceExpiryDate <= now
      ? false
      : true;
  const canManageLeads =
    role !== "DOCTOR" &&
    (role === "MR" ||
      (profile.businessVerified &&
        (role !== "PHARMA_COMPANY" ||
          profile.verificationStatus === "VERIFIED") &&
        currentCompanyRegistration &&
        currentDistributorLicence));
  const leadFilter =
    !canManageLeads
      ? null
      : role === "PHARMA_COMPANY"
        ? { ownerCompanyId: profile.id }
        : { createdBy: userId };

  const [
    appointments,
    doctorAppointmentRequests,
    upcomingAppointments,
    pendingAppointments,
    connections,
    connectionCount,
    connectionRequests,
    connectionRequestCount,
    notifications,
    unreadNotifications,
    requirements,
    openRequirements,
    opportunities,
    openOpportunities,
    activeAuthorizations,
    pendingAuthorizations,
    openLeads,
    dueFollowUps,
  ] = await Promise.all([
    Appointment.find(role === "DOCTOR" ? doctorUpcomingAppointmentFilter : appointmentFilter)
      .sort({ scheduledAt: 1 })
      .limit(5),
    role === "DOCTOR"
      ? Appointment.find({
          recipientId: userId,
          status: "REQUESTED",
        })
          .sort({ createdAt: -1 })
          .limit(5)
      : Promise.resolve([]),
    Appointment.countDocuments(
      role === "DOCTOR" ? doctorUpcomingAppointmentFilter : appointmentFilter
    ),
    role === "DOCTOR"
      ? Appointment.countDocuments({
          recipientId: userId,
          status: "REQUESTED",
        })
      : Promise.resolve(0),
    Connection.find({
      $or: [
        { requesterId: userId },
        { recipientId: userId },
      ],
      status: "ACCEPTED",
    })
      .sort({ updatedAt: -1 })
      .limit(5),
    Connection.countDocuments({
      $or: [
        { requesterId: userId },
        { recipientId: userId },
      ],
      status: "ACCEPTED",
    }),
    Connection.find({
      recipientId: userId,
      status: "PENDING",
    })
      .sort({ createdAt: -1 })
      .limit(5),
    Connection.countDocuments({
      recipientId: userId,
      status: "PENDING",
    }),
    Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5),
    Notification.countDocuments({
      userId,
      readAt: null,
    }),
    Requirement.find(requirementFilter)
      .sort({ createdAt: -1 })
      .limit(5),
    Requirement.countDocuments(requirementFilter),
    opportunityFilter
      ? Opportunity.find(opportunityFilter)
          .sort({ createdAt: -1 })
          .limit(5)
      : Promise.resolve([]),
    opportunityFilter
      ? Opportunity.countDocuments(opportunityFilter)
      : Promise.resolve(0),
    role === "MR"
      ? CompanyAuthorization.countDocuments({
          mrUserId: userId,
          status: "ACTIVE",
          expiresAt: { $gt: now },
        })
      : Promise.resolve(0),
    role === "PHARMA_COMPANY"
      ? CompanyAuthorization.countDocuments({
          companyId: profile.id,
          status: "PENDING",
          expiresAt: { $gt: now },
        })
      : Promise.resolve(0),
    leadFilter
      ? Lead.countDocuments({
          ...leadFilter,
          stage: { $nin: CLOSED_LEAD_STAGES },
        })
      : Promise.resolve(0),
    canManageLeads
      ? FollowUp.countDocuments({
          ownerUserId: userId,
          status: "PENDING",
          dueAt: { $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
        })
      : Promise.resolve(0),
  ]);

  return {
    role,
    profile,
    stats: {
      upcomingAppointments,
      pendingAppointments,
      connections: connectionCount,
      connectionRequests: connectionRequestCount,
      unreadNotifications,
      openRequirements,
      openOpportunities,
      activeAuthorizations,
      pendingAuthorizations,
      openLeads,
      dueFollowUps,
    },
    appointments: await Promise.all(
      appointments.map((appointment) =>
        enrichAppointment(appointment, userId)
      )
    ),
    appointmentRequests: await Promise.all(
      doctorAppointmentRequests.map((appointment) =>
        enrichAppointment(appointment, userId)
      )
    ),
    connections: await Promise.all(
      connections.map((connection) =>
        enrichConnection(connection, userId)
      )
    ),
    connectionRequests: await Promise.all(
      connectionRequests.map((connection) =>
        enrichConnection(connection, userId)
      )
    ),
    notifications: notifications.map((notification) => ({
      id: notification._id,
      title: notification.title,
      body: notification.body,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
    })),
    requirements: requirements.map(serializeRequirement),
    opportunities: opportunities.map(serializeOpportunity),
  };
}

module.exports = {
  getPharmacyDashboard,
  getRoleDashboard,
};