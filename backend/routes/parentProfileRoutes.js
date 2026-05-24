const express = require("express");
const router = express.Router();

const Appointment = require("../models/Appointment");
const ParentProfile = require("../models/ParentProfile");
const Patient = require("../models/Patient");
const User = require("../models/User");
const { protect, allowRoles } = require("../middleware/authMiddleware");
const { ROLES, STAFF_ROLES } = require("../constants/roles");

const canAccessProfile = (req, profile) =>
  STAFF_ROLES.includes(req.user.role) ||
  profile.userId?.toString() === req.user.id;

// CREATE parent profile
router.post("/", protect, async (req, res) => {
  try {
    if (req.user.role === "parent" && req.body.userId !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!STAFF_ROLES.includes(req.user.role) && req.user.role !== "parent") {
      return res.status(403).json({ message: "Access denied" });
    }

    const profile = await ParentProfile.create(req.body);

    res.status(201).json(profile);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});


// GET all parent profiles
router.get("/", protect, allowRoles(...STAFF_ROLES), async (req, res) => {
  try {
    const profiles = await ParentProfile.find();

    res.json(profiles);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});


// GET one parent profile
router.get("/:id", protect, async (req, res) => {
  try {
    const profile = await ParentProfile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({
        message: "Parent profile not found",
      });
    }

    if (!canAccessProfile(req, profile)) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});


// UPDATE parent profile
router.put("/:id", protect, async (req, res) => {
  try {
    const profile = await ParentProfile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({
        message: "Parent profile not found",
      });
    }

    if (!canAccessProfile(req, profile)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const updatedProfile = await ParentProfile.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({
        message: "Parent profile not found",
      });
    }

    if (updatedProfile.userId && req.body.fullName?.trim()) {
      const guardianName = req.body.fullName.trim();

      await Promise.all([
        User.findByIdAndUpdate(updatedProfile.userId, { name: guardianName }),
        Patient.updateMany(
          { guardianId: updatedProfile.userId },
          { guardianName }
        ),
        Appointment.updateMany(
          { guardianId: updatedProfile.userId },
          { guardianName }
        ),
      ]);
    }

    res.json(updatedProfile);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.delete(
  "/:id",
  protect,
  allowRoles(ROLES.ADMIN),
  async (req, res) => {
    try {
      const profile = await ParentProfile.findByIdAndDelete(req.params.id);

      if (!profile) {
        return res.status(404).json({
          message: "Parent profile not found",
        });
      }

      res.json({ message: "Guardian profile removed" });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

module.exports = router;
