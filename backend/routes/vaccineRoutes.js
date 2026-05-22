const express = require("express");
const router = express.Router();

const VaccineRecord = require("../models/VaccineRecord");
const InventoryItem = require("../models/InventoryItem");
const { protect, allowRoles } = require("../middleware/authMiddleware");

// CREATE vaccine record
router.post(
  "/",
  protect,
  allowRoles("staff", "admin", "nurse", "doctor"),
  async (req, res) => {
    try {
      const vaccineRecord = await VaccineRecord.create(req.body);

      if (req.body.inventoryItemId && req.body.status === "Completed") {
        await InventoryItem.findByIdAndUpdate(req.body.inventoryItemId, {
          $inc: { stockQuantity: -1 },
        });
      }

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