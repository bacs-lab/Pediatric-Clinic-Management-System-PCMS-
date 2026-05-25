const express = require("express");
const router = express.Router();

const VaccineRecord = require("../models/VaccineRecord");
const InventoryItem = require("../models/InventoryItem");
const Patient = require("../models/Patient");
const { protect, allowRoles } = require("../middleware/authMiddleware");
const { MEDICAL_ROLES, ROLES } = require("../constants/roles");

const VACCINE_STATUSES = ["Completed", "Upcoming", "Missed", "Rescheduled"];

const parentOwnsPatient = async (userId, patientId) => {
  const patient = await Patient.findById(patientId).select("guardianId");
  return patient?.guardianId?.toString() === userId;
};

// CREATE vaccine record
router.post(
  "/",
  protect,
  allowRoles("staff", ...MEDICAL_ROLES),
  async (req, res) => {
    try {
      if (req.body.inventoryItemId && req.body.status === "Completed") {
        const item = await InventoryItem.findById(req.body.inventoryItemId);

        if (!item) {
          return res.status(404).json({
            message: "Vaccine inventory item not found",
          });
        }

        if (item.stockQuantity <= 0) {
          return res.status(400).json({
            message: "Vaccine is out of stock",
          });
        }

        item.stockQuantity -= 1;
        await item.save();
      }

      const vaccineRecord = await VaccineRecord.create(req.body);

      res.status(201).json(vaccineRecord);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// UPDATE vaccine status details
router.put(
  "/:id",
  protect,
  allowRoles("staff", ...MEDICAL_ROLES),
  async (req, res) => {
    try {
      const doseNumber = Number(req.body.doseNumber);

      if (!Number.isInteger(doseNumber) || doseNumber < 1) {
        return res.status(400).json({
          message: "Dose number must be a whole number greater than 0",
        });
      }

      if (!VACCINE_STATUSES.includes(req.body.status)) {
        return res.status(400).json({ message: "Invalid vaccine status" });
      }

      const updates = {
        doseNumber,
        nextDoseDate: req.body.nextDoseDate || null,
        status: req.body.status,
        remarks: req.body.remarks || "",
      };

      const updatedRecord = await VaccineRecord.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true, runValidators: true }
      );

      if (!updatedRecord) {
        return res.status(404).json({ message: "Vaccine record not found" });
      }

      res.json(updatedRecord);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// GET all vaccine records
router.get(
  "/",
  protect,
  allowRoles("staff", ...MEDICAL_ROLES),
  async (req, res) => {
    try {
      const records = await VaccineRecord.find().sort({ createdAt: -1 });
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// GET vaccine records by patient
router.get(
  "/patient/:patientId",
  protect,
  allowRoles("parent", "staff", ...MEDICAL_ROLES),
  async (req, res) => {
    try {
      if (
        req.user.role === ROLES.PARENT &&
        !(await parentOwnsPatient(req.user.id, req.params.patientId))
      ) {
        return res.status(403).json({ message: "Access denied" });
      }

      const records = await VaccineRecord.find({
        patientId: req.params.patientId,
      }).sort({ vaccineDate: -1 });

      res.json(records);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
