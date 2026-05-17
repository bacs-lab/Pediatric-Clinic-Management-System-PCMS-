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
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },
    phone: {
      type: String,
    },
    address: {
      type: String,
    },
    chiefComplaint: {
      type: String,
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
    assessmentId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Assessment",
},

queueId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Queue",
},

consultationNotes: {
  type: String,
},

followUpDate: {
  type: Date,
},
  },
  { timestamps: true }
);

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);