const mongoose = require("mongoose");
const { QUEUE_STATUS_VALUES } = require("../constants/queueWorkflow");

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
      enum: QUEUE_STATUS_VALUES,
      default: "Waiting",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Queue", queueSchema);
