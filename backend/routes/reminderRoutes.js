const express = require("express");
const router = express.Router();

const MedicalRecord = require("../models/MedicalRecord");
const VaccineRecord = require("../models/VaccineRecord");

router.get("/", async (req, res) => {
  try {
    const today = new Date();

    const upcomingFollowUps = await MedicalRecord.find({
      followUpDate: { $gte: today },
    }).sort({ followUpDate: 1 });

    const upcomingVaccines = await VaccineRecord.find({
      nextDoseDate: { $gte: today },
      status: { $in: ["Completed", "Upcoming", "Rescheduled"] },
    }).sort({ nextDoseDate: 1 });

    res.json({
      upcomingFollowUps,
      upcomingVaccines,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router;