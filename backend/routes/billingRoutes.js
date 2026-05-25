const { protect, allowRoles } = require("../middleware/authMiddleware");
const express = require("express");
const router = express.Router();

const Appointment = require("../models/Appointment");
const Billing = require("../models/Billing");
const Patient = require("../models/Patient");
const Queue = require("../models/Queue");
const { ROLES } = require("../constants/roles");
const {
  QUEUE_STATUSES,
  normalizeQueueStatus,
} = require("../constants/queueWorkflow");

const parentOwnsPatient = async (userId, patientId) => {
  const patient = await Patient.findById(patientId).select("guardianId");
  return patient?.guardianId?.toString() === userId;
};


// CREATE billing
router.post(
  "/",
  protect,
  allowRoles("staff", "secretary"),
  async (req, res) => {
  try {
    const queueItem = await Queue.findById(req.body.queueId);

    if (!queueItem) {
      return res.status(404).json({ message: "Queue entry not found" });
    }

    queueItem.status = normalizeQueueStatus(queueItem.status);

    if (queueItem.status !== QUEUE_STATUSES.BILLING) {
      return res.status(400).json({
        message: "Billing can only be saved for queue items in Billing.",
      });
    }

    if (
      req.body.patientId &&
      req.body.patientId !== queueItem.patientId.toString()
    ) {
      return res.status(400).json({
        message: "Billing must use the selected queue patient.",
      });
    }

    const existingBilling = await Billing.findOne({ queueId: queueItem._id });

    if (existingBilling) {
      return res.status(400).json({
        message: "Billing already exists for this queue item.",
      });
    }

    const totalAmount =
      Number(req.body.consultationFee || 0) +
      Number(req.body.medicineFee || 0) +
      Number(req.body.vaccineFee || 0) +
      Number(req.body.otherFee || 0);

    const billing = await Billing.create({
      ...req.body,
      queueId: queueItem._id,
      patientId: queueItem.patientId,
      patientName: queueItem.patientName,
      totalAmount,
    });

    queueItem.status = QUEUE_STATUSES.COMPLETED;
    await queueItem.save();

    if (queueItem?.appointmentId) {
      await Appointment.findByIdAndUpdate(queueItem.appointmentId, {
        status: "Completed",
      });
    }

    res.status(201).json(billing);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});


// GET all billings
router.get(
  "/",
  protect,
  allowRoles("staff", "secretary"),
  async (req, res) => {
  try {
    const billings = await Billing.find().sort({
      createdAt: -1,
    });

    res.json(billings);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});
// GET billing by patient
router.get(
  "/patient/:patientId",
  protect,
  allowRoles("parent", "staff", "secretary"),
  async (req, res) => {
  try {
    if (
      req.user.role === ROLES.PARENT &&
      !(await parentOwnsPatient(req.user.id, req.params.patientId))
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const billings = await Billing.find({
      patientId: req.params.patientId,
    }).sort({ createdAt: -1 });

    res.json(billings);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});
module.exports = router;
