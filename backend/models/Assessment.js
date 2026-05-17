const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema(
  {
    queueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Queue",
      required: true,
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
    height: String,
    weight: String,
    temperature: String,
    bloodPressure: String,
    heartRate: String,
    symptoms: String,
    reasonForVisit: String,
    remarks: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Assessment", assessmentSchema);