const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },

    lastName: {
      type: String,
      required: true,
    },

    birthDate: {
      type: Date,
      required: true,
    },

    age: {
      type: Number,
    },

    gender: {
      type: String,
      enum: ["Male", "Female"],
      required: true,
    },

    guardianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    guardianName: {
      type: String,
      required: true,
    },

    relationshipToChild: {
      type: String,
    },

    emergencyContact: {
      type: String,
    },

    contactNumber: {
      type: String,
    },

    address: {
      type: String,
    },

    bloodType: {
      type: String,
    },

    allergies: {
      type: String,
    },

    notes: {
      type: String,
    },

    status: {
      type: String,
      enum: ["Pending", "Active", "Rejected"],
      default: "Active",
    },

    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    approvedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Patient", patientSchema);
