const express = require("express");
const router = express.Router();

const MedicalRecord = require("../models/MedicalRecord");
const { protect, allowRoles } = require("../middleware/authMiddleware");


// CREATE medical record
router.post("/", async (req, res) => {
  try {
    const newRecord = new MedicalRecord(req.body);

    const savedRecord = await newRecord.save();

    res.status(201).json(savedRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// GET all medical records
router.get("/", async (req, res) => {
  try {
    const records = await MedicalRecord.find();

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// GET records by patient
router.get("/patient/:patientId", async (req, res) => {
  try {
    const records = await MedicalRecord.find({
      patientId: req.params.patientId,
    });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET one medical record
router.get("/:id", async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// UPDATE medical record
router.put("/:id", async (req, res) => {
  try {
    const updatedRecord = await MedicalRecord.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedRecord) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.json(updatedRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// DELETE medical record
router.delete("/:id", async (req, res) => {
  try {
    const deletedRecord = await MedicalRecord.findByIdAndDelete(req.params.id);

    if (!deletedRecord) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.json({ message: "Medical record deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
module.exports = router;