const mongoose = require("mongoose");

const inventoryItemSchema = new mongoose.Schema(
  {
    itemName: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      enum: ["Medicine", "Vaccine", "Supply"],
      required: true,
    },

    stockQuantity: {
      type: Number,
      required: true,
      default: 0,
    },

    unit: {
      type: String,
      default: "pcs",
    },

    price: {
      type: Number,
      default: 0,
    },

    expirationDate: {
      type: Date,
    },

    lowStockLevel: {
      type: Number,
      default: 10,
    },

    status: {
      type: String,
      enum: ["Available", "Low Stock", "Expired", "Unavailable"],
      default: "Available",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InventoryItem", inventoryItemSchema);