const express = require("express");
const router = express.Router();

const Patient = require("../models/Patient");
const { protect, allowRoles } = require("../middleware/authMiddleware");

// CREATE patient
router.post("/", protect, allowRoles("staff", "admin", "secretary", "nurse"), async (req, res) => {
  try {
    const patient = await Patient.create(req.body);
    res.status(201).json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET all patients
router.get("/", protect, allowRoles("staff", "admin", "secretary", "nurse", "doctor"), async (req, res) => {
  try {
    const patients = await Patient.find();
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET patients by guardian/parent
router.get("/guardian/:guardianId", protect, allowRoles("parent", "staff", "admin"), async (req, res) => {
  try {
    const patients = await Patient.find({
      guardianId: req.params.guardianId,
    });

    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single patient
router.get("/:id", async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE patient
router.put("/:id", async (req, res) => {
  try {
    const updatedPatient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
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