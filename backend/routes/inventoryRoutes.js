const express = require("express");
const router = express.Router();

const InventoryItem = require("../models/InventoryItem");

// CREATE item
router.post("/", async (req, res) => {
  try {
    const item = await InventoryItem.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET all items
router.get("/", async (req, res) => {
  try {
    const items = await InventoryItem.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE item
router.put("/:id", async (req, res) => {
  try {
    const updatedItem = await InventoryItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;