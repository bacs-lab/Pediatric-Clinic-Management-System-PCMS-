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
  },
  { timestamps: true }
);

module.exports = mongoose.model("VaccineRecord", vaccineRecordSchema);