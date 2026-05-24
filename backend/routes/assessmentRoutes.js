const { protect, allowRoles } = require("../middleware/authMiddleware");
const express = require("express");
const router = express.Router();

const Assessment = require("../models/Assessment");
const Patient = require("../models/Patient");
const Queue = require("../models/Queue");
const { OPERATIONS_ROLES, ROLES } = require("../constants/roles");

const parentOwnsPatient = async (userId, patientId) => {
  const patient = await Patient.findById(patientId).select("guardianId");
  return patient?.guardianId?.toString() === userId;
};

// CREATE assessment
router.post(
  "/",
  protect,
  allowRoles("staff", "nurse", "doctor"),
  async (req, res) => {
  try {
    const assessment = await Assessment.create(req.body);

    await Queue.findByIdAndUpdate(req.body.queueId, {
      status: "For Consultation",
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
  allowRoles("staff", "nurse", "doctor", "parent"),
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
