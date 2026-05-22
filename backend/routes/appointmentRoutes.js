const express = require("express");
const router = express.Router();

const Appointment = require("../models/Appointment");
const { protect, allowRoles } = require("../middleware/authMiddleware");

// CREATE appointment
router.post(
  "/",
  protect,
  allowRoles("parent", "staff", "admin", "secretary"),
  async (req, res) => {
    try {
      const existingAppointment = await Appointment.findOne({
        patientId: req.body.patientId,
        appointmentDate: req.body.appointmentDate,
        appointmentTime: req.body.appointmentTime,
        status: { $ne: "Cancelled" },
      });

      if (existingAppointment) {
        return res.status(400).json({
          message: "This patient already has an appointment at this schedule",
        });
      }

      const appointment = await Appointment.create(req.body);

      res.status(201).json(appointment);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// GET all appointments
router.get(
  "/",
  protect,
  allowRoles("staff", "admin", "secretary", "nurse", "doctor"),
  async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({
      appointmentDate: 1,
    });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET appointments by guardian
router.get(
  "/guardian/:guardianId",
  protect,
  allowRoles("parent", "staff", "admin"),
  async (req, res) => {
  try {
    const appointments = await Appointment.find({
      guardianId: req.params.guardianId,
    }).sort({ appointmentDate: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE appointment status/details
router.put(
  "/:id",
  protect,
  allowRoles("staff", "admin", "secretary"),
  async (req, res) => {
  try {
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedAppointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json(updatedAppointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;