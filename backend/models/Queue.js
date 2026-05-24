const mongoose = require("mongoose");

const queueSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },

    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    patientName: {
      type: String,
      required: true,
    },

    guardianName: {
      type: String,
    },

    appointmentDate: {
      type: Date,
    },

    appointmentTime: {
      type: String,
    },

    requestedAt: {
      type: Date,
    },

    queueNumber: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "Waiting",
        "In Assessment",
        "For Consultation",
        "In Consultation",
        "For Billing",
        "Completed",
        "Cancelled",
      ],
      default: "Waiting",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Queue", queueSchema);
