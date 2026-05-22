const { protect, allowRoles } = require("../middleware/authMiddleware");
const express = require("express");
const router = express.Router();

const Billing = require("../models/Billing");
const Queue = require("../models/Queue");


// CREATE billing
router.post(
  "/",
  protect,
  allowRoles("staff", "admin", "secretary"),
  async (req, res) => {
  try {
    const totalAmount =
      Number(req.body.consultationFee || 0) +
      Number(req.body.medicineFee || 0) +
      Number(req.body.vaccineFee || 0) +
      Number(req.body.otherFee || 0);

    const billing = await Billing.create({
      ...req.body,
      totalAmount,
    });

    await Queue.findByIdAndUpdate(req.body.queueId, {
      status: "Completed",
    });

    res.status(201).json(billing);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});


// GET all billings
router.get(
  "/",
  protect,
  allowRoles("staff", "admin", "secretary"),
  async (req, res) => {
  try {
    const billings = await Billing.find().sort({
      createdAt: -1,
    });

    res.json(billings);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});
// GET billing by patient
router.get(
  "/patient/:patientId",
  protect,
  allowRoles("parent", "staff", "admin", "secretary"),
  async (req, res) => {
  try {
    const billings = await Billing.find({
      patientId: req.params.patientId,
    }).sort({ createdAt: -1 });

    res.json(billings);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});
module.exports = router;