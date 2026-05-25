const express = require("express");
const router = express.Router();

const Appointment = require("../models/Appointment");
const Patient = require("../models/Patient");
const Queue = require("../models/Queue");
const { protect, allowRoles } = require("../middleware/authMiddleware");
const { normalizeQueueStatus } = require("../constants/queueWorkflow");
const {
  APPOINTMENT_CREATION_ROLES,
  APPOINTMENT_EDIT_ROLES,
  ROLES,
  STAFF_ROLES,
} = require("../constants/roles");

const ACTIVE_QUEUE_FILTER = {
  status: { $nin: ["Completed", "Cancelled"] },
};

const buildQueuePayload = (appointment) => ({
  appointmentId: appointment._id,
  patientId: appointment.patientId,
  patientName: appointment.patientName,
  guardianName: appointment.guardianName,
  appointmentDate: appointment.appointmentDate,
  appointmentTime: appointment.appointmentTime,
  requestedAt: appointment.createdAt || new Date(),
});

const getNextQueueNumber = async () => {
  const lastQueueItem = await Queue.findOne()
    .sort({ queueNumber: -1 })
    .select("queueNumber");

  return (lastQueueItem?.queueNumber || 0) + 1;
};

const syncAppointmentQueue = async (appointment) => {
  if (!appointment) return null;

  if (appointment.status === "Approved") {
    const existingQueueItem = await Queue.findOne({
      appointmentId: appointment._id,
      ...ACTIVE_QUEUE_FILTER,
    });

    if (existingQueueItem) {
      existingQueueItem.patientId = appointment.patientId;
      existingQueueItem.patientName = appointment.patientName;
      existingQueueItem.guardianName = appointment.guardianName;
      existingQueueItem.appointmentDate = appointment.appointmentDate;
      existingQueueItem.appointmentTime = appointment.appointmentTime;
      existingQueueItem.requestedAt = appointment.createdAt || existingQueueItem.requestedAt;
      existingQueueItem.status = normalizeQueueStatus(existingQueueItem.status);
      await existingQueueItem.save();
      return existingQueueItem;
    }

    return Queue.create({
      ...buildQueuePayload(appointment),
      queueNumber: await getNextQueueNumber(),
      status: "Waiting",
    });
  }

  if (["Pending", "Rescheduled", "Cancelled"].includes(appointment.status)) {
    return Queue.findOneAndUpdate(
      {
        appointmentId: appointment._id,
        ...ACTIVE_QUEUE_FILTER,
      },
      { status: "Cancelled" },
      { new: true }
    );
  }

  return null;
};

const buildAppointmentPayload = ({ patient, body, currentStatus, clinicCreated }) => {
  const patientName = `${patient.firstName} ${patient.lastName}`.trim();
  const payload = {
    patientId: patient._id,
    guardianId: patient.guardianId,
    patientName,
    guardianName: patient.guardianName,
    appointmentDate: body.appointmentDate,
    appointmentTime: body.appointmentTime,
    reason: body.reason,
  };

  if (body.status) {
    payload.status = body.status;
  } else if (clinicCreated) {
    payload.status = currentStatus || "Approved";
  } else if (currentStatus) {
    payload.status = currentStatus;
  }

  if (typeof body.remarks !== "undefined") {
    payload.remarks = body.remarks;
  }

  return payload;
};

const validateClinicAppointmentAccess = ({ patient, requestedGuardianId, user }) => {
  const patientGuardianId = patient.guardianId?.toString();

  if (user.role === ROLES.PARENT) {
    if (requestedGuardianId !== user.id || patientGuardianId !== user.id) {
      return "Access denied";
    }
  }

  if (
    user.role !== ROLES.PARENT &&
    requestedGuardianId &&
    patientGuardianId !== requestedGuardianId
  ) {
    return "Selected child does not belong to the chosen guardian.";
  }

  return null;
};

// CREATE appointment
router.post(
  "/",
  protect,
  allowRoles(ROLES.PARENT, ...APPOINTMENT_CREATION_ROLES),
  async (req, res) => {
    try {
      const patient = await Patient.findById(req.body.patientId).select(
        "firstName lastName guardianId guardianName status"
      );

      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      if ((patient.status || "Active") !== "Active") {
        return res.status(400).json({
          message: "Only active child patient records can book appointments",
        });
      }

      const accessError = validateClinicAppointmentAccess({
        patient,
        requestedGuardianId: req.body.guardianId,
        user: req.user,
      });

      if (accessError) {
        return res.status(accessError === "Access denied" ? 403 : 400).json({
          message: accessError,
        });
      }

      const existingAppointment = await Appointment.findOne({
        patientId: req.body.patientId,
        appointmentDate: req.body.appointmentDate,
        appointmentTime: req.body.appointmentTime,
        status: { $ne: "Cancelled" },
      });

      if (existingAppointment) {
        return res.status(400).json({
          message: "This patient already has an appointment at this schedule",
        });
      }

      const appointmentDate = new Date(req.body.appointmentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (appointmentDate < today) {
        return res.status(400).json({
          message: "Appointment date cannot be in the past.",
        });
      }

      const appointment = await Appointment.create(
        buildAppointmentPayload({
          patient,
          body: req.body,
          clinicCreated: req.user.role !== ROLES.PARENT,
        })
      );

      await syncAppointmentQueue(appointment);

      res.status(201).json(appointment);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// GET all appointments
router.get(
  "/",
  protect,
  allowRoles(...STAFF_ROLES),
  async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({
      appointmentDate: 1,
    });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET appointments by guardian
router.get(
  "/guardian/:guardianId",
  protect,
  allowRoles(ROLES.PARENT, ...STAFF_ROLES),
  async (req, res) => {
  try {
    if (req.user.role === ROLES.PARENT && req.params.guardianId !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const appointments = await Appointment.find({
      guardianId: req.params.guardianId,
    }).sort({ appointmentDate: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE appointment status/details
router.put(
  "/:id",
  protect,
  allowRoles(...APPOINTMENT_EDIT_ROLES),
  async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const mergedInput = {
      patientId: req.body.patientId || appointment.patientId,
      guardianId:
        typeof req.body.guardianId === "undefined"
          ? appointment.guardianId?.toString()
          : req.body.guardianId,
      appointmentDate: req.body.appointmentDate || appointment.appointmentDate,
      appointmentTime: req.body.appointmentTime || appointment.appointmentTime,
      reason: req.body.reason || appointment.reason,
      status: req.body.status || appointment.status,
      remarks:
        typeof req.body.remarks === "undefined"
          ? appointment.remarks
          : req.body.remarks,
    };

    const patient = await Patient.findById(mergedInput.patientId).select(
      "firstName lastName guardianId guardianName status"
    );

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    if ((patient.status || "Active") !== "Active") {
      return res.status(400).json({
        message: "Only active patient records can hold appointments",
      });
    }

    const accessError = validateClinicAppointmentAccess({
      patient,
      requestedGuardianId: mergedInput.guardianId?.toString?.() || mergedInput.guardianId,
      user: req.user,
    });

    if (accessError) {
      return res.status(accessError === "Access denied" ? 403 : 400).json({
        message: accessError,
      });
    }

    if (
      mergedInput.patientId?.toString() !== appointment.patientId?.toString() ||
      String(mergedInput.appointmentDate) !== String(appointment.appointmentDate) ||
      mergedInput.appointmentTime !== appointment.appointmentTime
    ) {
      const conflictingAppointment = await Appointment.findOne({
        _id: { $ne: appointment._id },
        patientId: mergedInput.patientId,
        appointmentDate: mergedInput.appointmentDate,
        appointmentTime: mergedInput.appointmentTime,
        status: { $ne: "Cancelled" },
      });

      if (conflictingAppointment) {
        return res.status(400).json({
          message: "This patient already has an appointment at this schedule",
        });
      }
    }

    const appointmentDate = new Date(mergedInput.appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (appointmentDate < today) {
      return res.status(400).json({
        message: "Appointment date cannot be in the past.",
      });
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      buildAppointmentPayload({
        patient,
        body: mergedInput,
        currentStatus: mergedInput.status,
        clinicCreated: true,
      }),
      { new: true }
    );

    await syncAppointmentQueue(updatedAppointment);

    res.json(updatedAppointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CANCEL appointment (Parent)
router.put(
  "/:id/cancel",
  protect,
  allowRoles(ROLES.PARENT),
  async (req, res) => {
    try {
      const appointment = await Appointment.findById(req.params.id);

      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      if (appointment.guardianId?.toString() !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (!["Pending", "Approved", "Rescheduled"].includes(appointment.status)) {
        return res.status(400).json({
          message: "Only pending or upcoming appointments can be cancelled.",
        });
      }

      appointment.status = "Cancelled";
      appointment.remarks = appointment.remarks
        ? `${appointment.remarks} (Cancelled by parent)`
        : "Cancelled by parent";

      const updatedAppointment = await appointment.save();
      await syncAppointmentQueue(updatedAppointment);

      res.json(updatedAppointment);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
