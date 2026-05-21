const { protect, allowRoles } = require("../middleware/authMiddleware");
const express = require("express");
const router = express.Router();

const Assessment = require("../models/Assessment");
const Queue = require("../models/Queue");

// CREATE assessment
router.post("/", async (req, res) => {
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
router.get("/", async (req, res) => {
  try {
    const assessments = await Assessment.find().sort({ createdAt: -1 });
    res.json(assessments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET assessment by patient
router.get("/patient/:patientId", async (req, res) => {
  try {
    const assessments = await Assessment.find({
      patientId: req.params.patientId,
    }).sort({ createdAt: -1 });

    res.json(assessments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;