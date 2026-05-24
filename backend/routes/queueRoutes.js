const { protect, allowRoles } = require("../middleware/authMiddleware");
const express = require("express");
const router = express.Router();

const Appointment = require("../models/Appointment");
const Queue = require("../models/Queue");
const { OPERATIONS_ROLES } = require("../constants/roles");

const getNextQueueNumber = async () => {
  const lastQueueItem = await Queue.findOne()
    .sort({ queueNumber: -1 })
    .select("queueNumber");

  return (lastQueueItem?.queueNumber || 0) + 1;
};

// CREATE queue entry
router.post(
  "/",
  protect,
  allowRoles(...OPERATIONS_ROLES),
  async (req, res) => {
    try {
      const existingQueue = await Queue.findOne({
        appointmentId: req.body.appointmentId,
        status: { $nin: ["Completed", "Cancelled"] },
      });

      if (existingQueue) {
        return res.status(400).json({
          message: "This appointment is already in the queue",
        });
      }

      const queue = await Queue.create({
        ...req.body,
        queueNumber: await getNextQueueNumber(),
      });

      res.status(201).json(queue);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// GET all queue entries
router.get(
  "/",
  protect,
  allowRoles(...OPERATIONS_ROLES),
  async (req, res) => {
  try {
    const queue = await Queue.find().sort({ queueNumber: 1 });
    res.json(queue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE queue status
router.put(
  "/:id",
  protect,
  allowRoles(...OPERATIONS_ROLES),
  async (req, res) => {
  try {
    const existingQueue = await Queue.findById(req.params.id);

    if (!existingQueue) {
      return res.status(404).json({ message: "Queue entry not found" });
    }

    const updatedQueue = await Queue.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (existingQueue.appointmentId && req.body.status === "Cancelled") {
      await Appointment.findByIdAndUpdate(existingQueue.appointmentId, {
        status: "Cancelled",
      });
    }

    res.json(updatedQueue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
