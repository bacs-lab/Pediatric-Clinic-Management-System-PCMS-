const mongoose = require("mongoose");

const medicalRecordSchema = new mongoose.Schema(
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
    age: {
      type: Number,
      required: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },
    phone: {
      type: String,
    },
    address: {
      type: String,
    },
    chiefComplaint: {
      type: String,
      required: true,
    },
    diagnosis: {
      type: String,
    },
    treatment: {
      type: String,
    },
    prescription: {
      type: String,
    },
    doctorName: {
      type: String,
    },
    visitDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);