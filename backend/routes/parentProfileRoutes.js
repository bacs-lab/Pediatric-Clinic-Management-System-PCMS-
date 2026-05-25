const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();

const AuditLog = require("../models/AuditLog");
const Appointment = require("../models/Appointment");
const ParentProfile = require("../models/ParentProfile");
const Patient = require("../models/Patient");
const User = require("../models/User");
const { protect, allowRoles } = require("../middleware/authMiddleware");
const { ROLES, STAFF_ROLES } = require("../constants/roles");

const canAccessProfile = (req, profile) =>
  STAFF_ROLES.includes(req.user.role) ||
  profile.userId?.toString() === req.user.id;

const parentProfilePopulate = {
  path: "userId",
  select: "_id name email role status createdAt updatedAt",
};

const normalizePendingProfile = (profile) => {
  const item = profile.toObject ? profile.toObject() : profile;
  const user = item.userId || {};

  return {
    ...item,
    guardianUser: user,
    userId: user._id || item.userId,
    email: user.email || "",
    status:
      item.verificationStatus === "Pending"
        ? "Pending"
        : user.status || item.verificationStatus || "Pending",
    verificationStatus: item.verificationStatus || "Approved",
    submittedAt: user.createdAt || item.createdAt,
  };
};

const normalizeProfile = (profile) => {
  const item = profile.toObject ? profile.toObject() : profile;
  const user = item.userId || {};

  return {
    ...item,
    userId: user._id || item.userId,
    email: user.email || "",
    status: user.status || "Active",
    verificationStatus: item.verificationStatus || "Approved",
  };
};

const loadPendingGuardianRequest = async (id) => {
  const profile = await ParentProfile.findById(id).populate(parentProfilePopulate);

  if (!profile || !profile.userId) {
    return { error: { status: 404, message: "Guardian request not found" } };
  }

  if (
    profile.userId.status !== "Pending" &&
    profile.verificationStatus !== "Pending"
  ) {
    return {
      error: {
        status: 400,
        message: "Only pending guardian account requests can be reviewed",
      },
    };
  }

  return { profile };
};

router.post(
  "/create-account",
  protect,
  allowRoles(...STAFF_ROLES),
  async (req, res) => {
    try {
      const { fullName, email, password, contactNumber, address } = req.body;

      if (!fullName?.trim()) {
        return res.status(400).json({ message: "Full name is required" });
      }

      if (!email?.trim()) {
        return res.status(400).json({ message: "Email is required" });
      }

      if (!password || password.length < 6) {
        return res.status(400).json({
          message: "Password must be at least 6 characters",
        });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const existingUser = await User.findOne({ email: normalizedEmail });

      if (existingUser) {
        const existingProfile =
          existingUser.role === ROLES.PARENT
            ? await ParentProfile.findOne({ userId: existingUser._id }).select(
                "verificationStatus"
              )
            : null;

        if (
          existingUser.role === ROLES.PARENT &&
          (existingUser.status === "Pending" ||
            existingProfile?.verificationStatus === "Pending")
        ) {
          return res.status(400).json({
            message:
              "A guardian account request for this email is already waiting for approval.",
          });
        }

        if (
          existingUser.role === ROLES.PARENT &&
          (existingUser.status === "Rejected" ||
            existingProfile?.verificationStatus === "Rejected")
        ) {
          return res.status(400).json({
            message:
              "This guardian account request was rejected. Please contact the clinic before creating it again.",
          });
        }

        return res.status(400).json({ message: "Email already exists" });
      }

      const user = await User.create({
        name: fullName.trim(),
        email: normalizedEmail,
        password: await bcrypt.hash(password, 10),
        role: ROLES.PARENT,
        status: "Pending",
        mustChangePassword: false,
      });

      const profile = await ParentProfile.create({
        userId: user._id,
        fullName: user.name,
        contactNumber: typeof contactNumber === "string" ? contactNumber.trim() : "",
        address: typeof address === "string" ? address.trim() : "",
        verificationStatus: "Pending",
      });

      await AuditLog.create({
        userId: req.user._id,
        action: "Submitted parent account request",
        targetUserId: user._id,
        role: req.user.role,
      });

      const pendingProfile = await ParentProfile.findById(profile._id).populate(
        parentProfilePopulate
      );

      res.status(202).json(normalizePendingProfile(pendingProfile));
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.get(
  "/pending",
  protect,
  allowRoles(...STAFF_ROLES),
  async (req, res) => {
    try {
      const profiles = await ParentProfile.find()
        .populate(parentProfilePopulate)
        .sort({ createdAt: -1 });

      res.json(
        profiles
          .filter(
            (profile) =>
              profile.userId?.status === "Pending" ||
              profile.verificationStatus === "Pending"
          )
          .map(normalizePendingProfile)
      );
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.put(
  "/:id/approve",
  protect,
  allowRoles(...STAFF_ROLES),
  async (req, res) => {
    try {
      const { profile, error } = await loadPendingGuardianRequest(req.params.id);

      if (error) {
        return res.status(error.status).json({ message: error.message });
      }

      profile.userId.status = "Active";
      profile.verificationStatus = "Approved";
      await profile.save();
      await profile.userId.save();

      await AuditLog.create({
        userId: req.user._id,
        action: "Approved parent account request",
        targetUserId: profile.userId._id,
        role: req.user.role,
      });

      const updatedProfile = await ParentProfile.findById(profile._id).populate(
        parentProfilePopulate
      );

      res.json(normalizePendingProfile(updatedProfile));
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.put(
  "/:id/reject",
  protect,
  allowRoles(...STAFF_ROLES),
  async (req, res) => {
    try {
      const { profile, error } = await loadPendingGuardianRequest(req.params.id);

      if (error) {
        return res.status(error.status).json({ message: error.message });
      }

      profile.userId.status = "Rejected";
      profile.verificationStatus = "Rejected";
      await profile.save();
      await profile.userId.save();

      await AuditLog.create({
        userId: req.user._id,
        action: "Rejected parent account request",
        targetUserId: profile.userId._id,
        role: req.user.role,
      });

      const updatedProfile = await ParentProfile.findById(profile._id).populate(
        parentProfilePopulate
      );

      res.json(normalizePendingProfile(updatedProfile));
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// CREATE parent profile
router.post("/", protect, async (req, res) => {
  try {
    if (req.user.role === "parent" && req.body.userId !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!STAFF_ROLES.includes(req.user.role) && req.user.role !== "parent") {
      return res.status(403).json({ message: "Access denied" });
    }

    const profile = await ParentProfile.create(req.body);

    res.status(201).json(profile);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});


// GET all parent profiles
router.get("/", protect, allowRoles(...STAFF_ROLES), async (req, res) => {
  try {
    const profiles = await ParentProfile.find()
      .populate(parentProfilePopulate)
      .sort({ createdAt: -1 });

    res.json(
        profiles
        .filter(
          (profile) =>
            profile.userId?.status === "Active" &&
            (!profile.verificationStatus ||
              profile.verificationStatus === "Approved")
        )
        .map(normalizeProfile)
    );
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});


// GET one parent profile
router.get("/:id", protect, async (req, res) => {
  try {
    const profile = await ParentProfile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({
        message: "Parent profile not found",
      });
    }

    if (!canAccessProfile(req, profile)) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});


// UPDATE parent profile
router.put("/:id", protect, async (req, res) => {
  try {
    const profile = await ParentProfile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({
        message: "Parent profile not found",
      });
    }

    if (!canAccessProfile(req, profile)) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (req.user.role === ROLES.PARENT) {
      if (!req.body.currentPassword) {
        return res.status(400).json({
          message: "Current password is required to update your profile.",
        });
      }

      const user = await User.findById(req.user.id);
      const passwordMatch = user
        ? await bcrypt.compare(req.body.currentPassword, user.password)
        : false;

      if (!passwordMatch) {
        return res.status(400).json({
          message: "Current password is incorrect.",
        });
      }
    }

    const profilePayload = {};

    [
      "fullName",
      "contactNumber",
      "address",
      "relationshipToChild",
      "emergencyContact",
    ].forEach((field) => {
      if (typeof req.body[field] === "string") {
        profilePayload[field] = req.body[field].trim();
      }
    });

    const updatedProfile = await ParentProfile.findByIdAndUpdate(
      req.params.id,
      profilePayload,
      { new: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({
        message: "Parent profile not found",
      });
    }

    if (updatedProfile.userId && req.body.fullName?.trim()) {
      const guardianName = req.body.fullName.trim();

      await Promise.all([
        User.findByIdAndUpdate(updatedProfile.userId, { name: guardianName }),
        Patient.updateMany(
          { guardianId: updatedProfile.userId },
          { guardianName }
        ),
        Appointment.updateMany(
          { guardianId: updatedProfile.userId },
          { guardianName }
        ),
      ]);
    }

    res.json(updatedProfile);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.delete(
  "/:id",
  protect,
  allowRoles(ROLES.ADMIN),
  async (req, res) => {
    try {
      const profile = await ParentProfile.findByIdAndDelete(req.params.id);

      if (!profile) {
        return res.status(404).json({
          message: "Parent profile not found",
        });
      }

      res.json({ message: "Guardian profile removed" });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

module.exports = router;
