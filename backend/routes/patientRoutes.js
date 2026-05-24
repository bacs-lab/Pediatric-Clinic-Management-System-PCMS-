const express = require("express");
const router = express.Router();

const Patient = require("../models/Patient");
const { protect, allowRoles } = require("../middleware/authMiddleware");
const {
  FRONT_DESK_ROLES,
  PATIENT_APPROVAL_ROLES,
  ROLES,
  STAFF_ROLES,
} = require("../constants/roles");

const canAccessPatient = (req, patient) =>
  STAFF_ROLES.includes(req.user.role) ||
  patient.guardianId?.toString() === req.user.id;

// CREATE patient
router.post(
  "/",
  protect,
  allowRoles(ROLES.PARENT, ...FRONT_DESK_ROLES),
  async (req, res) => {
  try {
    const isParentRequest = req.user.role === ROLES.PARENT;
    const patientPayload = {
      ...req.body,
      status: isParentRequest ? "Pending" : "Active",
      requestedBy: req.user.id,
      approvedBy: isParentRequest ? undefined : req.user.id,
      approvedAt: isParentRequest ? undefined : new Date(),
    };

    if (isParentRequest) {
      patientPayload.guardianId = req.user.id;
      patientPayload.guardianName = req.user.name;
    }

    const patient = await Patient.create(patientPayload);
    res.status(201).json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET all patients
router.get("/", protect, allowRoles(...STAFF_ROLES), async (req, res) => {
  try {
    const patients = await Patient.find();
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET pending patient requests for clinic approval
router.get(
  "/pending",
  protect,
  allowRoles(...PATIENT_APPROVAL_ROLES),
  async (req, res) => {
  try {
    const patients = await Patient.find({ status: "Pending" }).sort({
      createdAt: -1,
    });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET patients by guardian/parent
router.get(
  "/guardian/:guardianId",
  protect,
  allowRoles("parent", ...STAFF_ROLES),
  async (req, res) => {
  try {
    if (req.user.role === "parent" && req.params.guardianId !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const patients = await Patient.find({
      guardianId: req.params.guardianId,
    });

    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// APPROVE pending patient request
router.put(
  "/:id/approve",
  protect,
  allowRoles(...PATIENT_APPROVAL_ROLES),
  async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    patient.status = "Active";
    patient.approvedBy = req.user.id;
    patient.approvedAt = new Date();

    const updatedPatient = await patient.save();
    res.json(updatedPatient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single patient
router.get("/:id", protect, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    if (!canAccessPatient(req, patient)) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE patient
router.put("/:id", protect, allowRoles(...FRONT_DESK_ROLES), async (req, res) => {
  try {
    const patientUpdates = { ...req.body };
    delete patientUpdates.status;
    delete patientUpdates.requestedBy;
    delete patientUpdates.approvedBy;
    delete patientUpdates.approvedAt;

    const updatedPatient = await Patient.findByIdAndUpdate(
      req.params.id,
      patientUpdates,
      { new: true }
    );

    if (!updatedPatient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.json(updatedPatient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
