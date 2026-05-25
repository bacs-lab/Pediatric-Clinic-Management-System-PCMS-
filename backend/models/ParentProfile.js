const mongoose = require("mongoose");

const parentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    fullName: {
      type: String,
      required: true,
    },

    contactNumber: {
      type: String,
    },

    address: {
      type: String,
    },

    relationshipToChild: {
      type: String,
    },

    emergencyContact: {
      type: String,
    },

    verificationStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Approved",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "ParentProfile",
  parentProfileSchema
);
