const express = require("express");
const router = express.Router();

const Appointment = require("../models/Appointment");
const Billing = require("../models/Billing");
const Patient = require("../models/Patient");
const VaccineRecord = require("../models/VaccineRecord");
const InventoryItem = require("../models/InventoryItem");

const { protect, allowRoles } = require("../middleware/authMiddleware");

router.get(
  "/summary",
  protect,
  allowRoles("staff", "admin", "secretary", "doctor", "nurse"),
  async (req, res) => {
    try {
      const totalPatients = await Patient.countDocuments();
      const totalAppointments = await Appointment.countDocuments();
      const completedAppointments = await Appointment.countDocuments({
        status: "Completed",
      });

      const billings = await Billing.find();
      const totalRevenue = billings.reduce(
        (sum, item) => sum + (item.totalAmount || 0),
        0
      );

      const vaccineRecords = await VaccineRecord.countDocuments();

      const lowStockItems = await InventoryItem.find({
        $expr: { $lte: ["$stockQuantity", "$lowStockLevel"] },
      });

      res.json({
        totalPatients,
        totalAppointments,
        completedAppointments,
        totalRevenue,
        vaccineRecords,
        lowStockItems,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;