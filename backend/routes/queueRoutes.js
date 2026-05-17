const express = require("express");
const router = express.Router();

const Queue = require("../models/Queue");

// CREATE queue entry
router.post("/", async (req, res) => {
  try {
    const count = await Queue.countDocuments();

    const queue = await Queue.create({
      ...req.body,
      queueNumber: count + 1,
    });

    res.status(201).json(queue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET all queue entries
router.get("/", async (req, res) => {
  try {
    const queue = await Queue.find().sort({ queueNumber: 1 });
    res.json(queue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE queue status
router.put("/:id", async (req, res) => {
  try {
    const updatedQueue = await Queue.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedQueue) {
      return res.status(404).json({ message: "Queue entry not found" });
    }

    res.json(updatedQueue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;