const express = require("express");
const router = express.Router();

const ParentProfile = require("../models/ParentProfile");


// CREATE parent profile
router.post("/", async (req, res) => {
  try {
    const profile = await ParentProfile.create(req.body);

    res.status(201).json(profile);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});


// GET all parent profiles
router.get("/", async (req, res) => {
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
router.get("/:id", async (req, res) => {
  try {
    const profile = await ParentProfile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({
        message: "Parent profile not found",
      });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});


// UPDATE parent profile
router.put("/:id", async (req, res) => {
  try {
    const updatedProfile =
      await ParentProfile.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

    if (!updatedProfile) {
      return res.status(404).json({
        message: "Parent profile not found",
      });
    }

    res.json(updatedProfile);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router;