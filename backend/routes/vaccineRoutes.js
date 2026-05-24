const express = require("express");
const router = express.Router();

const VaccineRecord = require("../models/VaccineRecord");
const InventoryItem = require("../models/InventoryItem");
const Patient = require("../models/Patient");
const { protect, allowRoles } = require("../middleware/authMiddleware");
const { ROLES } = require("../constants/roles");

const parentOwnsPatient = async (userId, patientId) => {
  const patient = await Patient.findById(patientId).select("guardianId");
  return patient?.guardianId?.toString() === userId;
};

// CREATE vaccine record
router.post(
  "/",
  protect,
  allowRoles("staff", "admin", "nurse", "doctor"),
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

// GET all vaccine records
router.get(
  "/",
  protect,
  allowRoles("staff", "admin", "nurse", "doctor"),
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
  allowRoles("parent", "staff", "admin", "nurse", "doctor"),
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
