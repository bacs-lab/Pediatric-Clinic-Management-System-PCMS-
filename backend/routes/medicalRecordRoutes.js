const express = require("express");
const router = express.Router();

const MedicalRecord = require("../models/MedicalRecord");
const Patient = require("../models/Patient");
const Queue = require("../models/Queue");
const { protect, allowRoles } = require("../middleware/authMiddleware");
const { EMR_WRITE_ROLES, MEDICAL_ROLES, ROLES } = require("../constants/roles");
const {
  QUEUE_STATUSES,
  normalizeQueueStatus,
} = require("../constants/queueWorkflow");

const parentOwnsPatient = async (userId, patientId) => {
  const patient = await Patient.findById(patientId).select("guardianId");
  return patient?.guardianId?.toString() === userId;
};



// CREATE medical record
router.post(
  "/",
  protect,
  allowRoles(...EMR_WRITE_ROLES),
  async (req, res) => {
  try {
    const payload = { ...req.body };

    if (req.body.queueId) {
      const queueItem = await Queue.findById(req.body.queueId);

      if (!queueItem) {
        return res.status(404).json({ message: "Queue entry not found" });
      }

      queueItem.status = normalizeQueueStatus(queueItem.status);

      if (queueItem.status !== QUEUE_STATUSES.CONSULTATION) {
        return res.status(400).json({
          message:
            "Consultation records can only be saved for queue items in Consultation.",
        });
      }

      if (
        req.body.patientId &&
        req.body.patientId !== queueItem.patientId.toString()
      ) {
        return res.status(400).json({
          message: "Consultation must use the selected queue patient.",
        });
      }

      if (queueItem.isModified("status")) {
        await queueItem.save();
      }

      const patient = await Patient.findById(queueItem.patientId).select(
        "age gender contactNumber address"
      );

      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      payload.queueId = queueItem._id;
      payload.patientId = queueItem.patientId;
      payload.patientName = queueItem.patientName;
      payload.age = patient.age;
      payload.gender = patient.gender;
      payload.phone = patient.contactNumber;
      payload.address = patient.address;
    }

    const newRecord = new MedicalRecord(payload);

    const savedRecord = await newRecord.save();

    res.status(201).json(savedRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// GET all medical records
router.get(
  "/",
  protect,
  allowRoles(...MEDICAL_ROLES),
  async (req, res) => {
  try {
    const records = await MedicalRecord.find();

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// GET records by patient
router.get(
  "/patient/:patientId",
  protect,
  allowRoles(...MEDICAL_ROLES, ROLES.PARENT),
  async (req, res) => {
  try {
    if (
      req.user.role === ROLES.PARENT &&
      !(await parentOwnsPatient(req.user.id, req.params.patientId))
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const records = await MedicalRecord.find({
      patientId: req.params.patientId,
    });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET one medical record
router.get(
  "/:id",
  protect,
  allowRoles(...MEDICAL_ROLES, ROLES.PARENT),
  async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    if (
      req.user.role === ROLES.PARENT &&
      !(await parentOwnsPatient(req.user.id, record.patientId))
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// UPDATE medical record
router.put(
  "/:id",
  protect,
  allowRoles(...EMR_WRITE_ROLES),
  async (req, res) => {
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
router.delete(
  "/:id",
  protect,
  allowRoles(...EMR_WRITE_ROLES),
  async (req, res) => {
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
