const express = require("express");
const router = express.Router();

const Patient = require("../models/Patient");
const Appointment = require("../models/Appointment");
const Queue = require("../models/Queue");
const Billing = require("../models/Billing");
const InventoryItem = require("../models/InventoryItem");
const { protect, allowRoles } = require("../middleware/authMiddleware");
const { STAFF_ROLES } = require("../constants/roles");

router.get("/stats", protect, allowRoles(...STAFF_ROLES), async (req, res) => {
  try {
    const totalPatients = await Patient.countDocuments();

    const pendingAppointments =
      await Appointment.countDocuments({
        status: "Pending",
      });

    const currentQueue =
      await Queue.countDocuments({
        status: {
          $nin: ["Completed", "Cancelled"],
        },
      });

    const completedVisits =
      await Queue.countDocuments({
        status: "Completed",
      });

    const lowStockItems =
      await InventoryItem.countDocuments({
        stockQuantity: { $lte: 10 },
      });

    const billings = await Billing.find();

    const totalRevenue = billings.reduce(
      (sum, billing) =>
        sum + (billing.totalAmount || 0),
      0
    );

    res.json({
      totalPatients,
      pendingAppointments,
      currentQueue,
      completedVisits,
      totalRevenue,
      lowStockItems,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router;
