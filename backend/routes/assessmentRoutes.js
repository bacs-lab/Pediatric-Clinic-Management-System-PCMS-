const { protect, allowRoles } = require("../middleware/authMiddleware");
const express = require("express");
const router = express.Router();

const Assessment = require("../models/Assessment");
const Patient = require("../models/Patient");
const Queue = require("../models/Queue");
const { OPERATIONS_ROLES, ROLES } = require("../constants/roles");
const {
  QUEUE_STATUSES,
  normalizeQueueStatus,
} = require("../constants/queueWorkflow");

const parentOwnsPatient = async (userId, patientId) => {
  const patient = await Patient.findById(patientId).select("guardianId");
  return patient?.guardianId?.toString() === userId;
};

// CREATE assessment
router.post(
  "/",
  protect,
  allowRoles("staff", "secretary", "doctor"),

  async (req, res) => {
  try {
    const queueItem = await Queue.findById(req.body.queueId);

    if (!queueItem) {
      return res.status(404).json({ message: "Queue entry not found" });
    }

    queueItem.status = normalizeQueueStatus(queueItem.status);

    if (queueItem.status !== QUEUE_STATUSES.ASSESSMENT) {
      return res.status(400).json({
        message: "Assessment can only be saved for queue items in Assessment.",
      });
    }

    if (
      req.body.patientId &&
      req.body.patientId !== queueItem.patientId.toString()
    ) {
      return res.status(400).json({
        message: "Assessment must use the selected queue patient.",
      });
    }

    if (queueItem.isModified("status")) {
      await queueItem.save();
    }

    const assessment = await Assessment.create({
      ...req.body,
      queueId: queueItem._id,
      patientId: queueItem.patientId,
      patientName: queueItem.patientName,
    });

    res.status(201).json(assessment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET all assessments
router.get(
  "/",
  protect,
  allowRoles(...OPERATIONS_ROLES.filter((role) => role !== ROLES.SECRETARY)),
  async (req, res) => {
  try {
    const assessments = await Assessment.find().sort({ createdAt: -1 });
    res.json(assessments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET assessment by patient
router.get(
  "/patient/:patientId",
  protect,
  allowRoles("staff", "doctor", "parent"),
  async (req, res) => {
  try {
    if (
      req.user.role === ROLES.PARENT &&
      !(await parentOwnsPatient(req.user.id, req.params.patientId))
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const assessments = await Assessment.find({
      patientId: req.params.patientId,
    }).sort({ createdAt: -1 });

    res.json(assessments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
