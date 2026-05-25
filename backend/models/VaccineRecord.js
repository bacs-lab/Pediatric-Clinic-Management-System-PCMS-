const mongoose = require("mongoose");

const vaccineRecordSchema = new mongoose.Schema(
  {
    
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    patientName: {
      type: String,
      required: true,
    },

    vaccineName: {
      type: String,
      required: true,
    },

    vaccineDate: {
      type: Date,
      required: true,
    },

    doseNumber: {
      type: Number,
      min: 1,
      default: 1,
    },

    nextDoseDate: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["Completed", "Upcoming", "Missed", "Rescheduled"],
      default: "Completed",
    },

    administeredBy: {
      type: String,
    },

    remarks: {
      type: String,
    },
    inventoryItemId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "InventoryItem",
},
  },
  { timestamps: true }
);

module.exports = mongoose.model("VaccineRecord", vaccineRecordSchema);
