const mongoose = require("mongoose");

const billingSchema = new mongoose.Schema(
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

    consultationFee: {
      type: Number,
      default: 0,
    },

    medicineFee: {
      type: Number,
      default: 0,
    },

    vaccineFee: {
      type: Number,
      default: 0,
    },

    otherFee: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      default: 0,
    },

    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Partial", "Paid"],
      default: "Unpaid",
    },

    remarks: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Billing", billingSchema);