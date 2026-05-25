const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const AuditLog = require("../models/AuditLog");
const Appointment = require("../models/Appointment");
const ParentProfile = require("../models/ParentProfile");
const Patient = require("../models/Patient");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const buildAuthUser = (user, profile = null) => ({
  id: user._id,
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  verificationStatus: profile?.verificationStatus || "Approved",
  mustChangePassword: user.mustChangePassword,
  contactNumber: profile?.contactNumber || "",
  address: profile?.address || "",
});

const isGuardianProfileApproved = (profile) =>
  !profile?.verificationStatus || profile.verificationStatus === "Approved";

const getInactiveLoginMessage = (status) => {
  if (status === "Pending") {
    return "Your parent account request is waiting for clinic approval before you can log in.";
  }

  if (status === "Rejected") {
    return "Your parent account request was rejected. Please contact the clinic for assistance.";
  }

  if (status === "Disabled") {
    return "Account is disabled";
  }

  return "Account is not active";
};

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      contactNumber,
      address,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    if (!email?.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      const existingProfile =
        existingUser.role === "parent"
          ? await ParentProfile.findOne({ userId: existingUser._id }).select(
              "verificationStatus"
            )
          : null;

      if (
        existingUser.role === "parent" &&
        (existingUser.status === "Pending" ||
          existingProfile?.verificationStatus === "Pending")
      ) {
        return res.status(400).json({
          message:
            "A parent account request for this email is already waiting for clinic approval.",
        });
      }

      if (
        existingUser.role === "parent" &&
        (existingUser.status === "Rejected" ||
          existingProfile?.verificationStatus === "Rejected")
      ) {
        return res.status(400).json({
          message:
            "This parent account request was rejected. Please contact the clinic before signing up again.",
        });
      }

      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "parent",
      status: "Pending",
      mustChangePassword: false,
    });

    const profile = await ParentProfile.create({
      userId: user._id,
      fullName: user.name,
      contactNumber,
      address,
      verificationStatus: "Pending",
    });

    await AuditLog.create({
      userId: user._id,
      action: "Parent account request submitted",
      targetUserId: user._id,
      role: user.role,
    });

    res.status(202).json({
      message:
        "Parent account request submitted. Wait for clinic approval before logging in.",
      user: buildAuthUser(user, profile),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email?.toLowerCase().trim() });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const profile =
      user.role === "parent"
        ? await ParentProfile.findOne({ userId: user._id })
        : null;

    if (
      user.status !== "Active" ||
      (user.role === "parent" && !isGuardianProfileApproved(profile))
    ) {
      return res.status(403).json({
        message: getInactiveLoginMessage(
          user.status !== "Active" ? user.status : profile?.verificationStatus
        ),
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: buildAuthUser(user, profile),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "_id name email role status mustChangePassword"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const profile =
      user.role === "parent"
        ? await ParentProfile.findOne({ userId: user._id })
        : null;

    res.json({
      user: buildAuthUser(user, profile),
      profile,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/me", protect, async (req, res) => {
  try {
    const {
      name,
      email,
      contactNumber,
      address,
      currentPassword,
      newPassword,
    } = req.body;

    if (!currentPassword) {
      return res.status(400).json({
        message: "Current password is required to save account changes.",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);

    if (!passwordMatch) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    const trimmedName = typeof name === "string" ? name.trim() : "";
    const normalizedEmail =
      typeof email === "string" ? email.toLowerCase().trim() : "";
    const previousName = user.name;

    if (trimmedName) {
      user.name = trimmedName;
    }

    if (normalizedEmail && normalizedEmail !== user.email) {
      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      });

      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }

      user.email = normalizedEmail;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({
          message: "New password must be at least 6 characters.",
        });
      }

      user.password = await bcrypt.hash(newPassword, 10);
      user.mustChangePassword = false;
    }

    await user.save();

    let profile = null;

    if (user.role === "parent") {
      const existingProfile = await ParentProfile.findOne({ userId: user._id });

      profile = await ParentProfile.findOneAndUpdate(
        { userId: user._id },
        {
          userId: user._id,
          fullName: user.name,
          contactNumber: typeof contactNumber === "string" ? contactNumber.trim() : "",
          address: typeof address === "string" ? address.trim() : "",
          verificationStatus:
            existingProfile?.verificationStatus || "Pending",
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      if (previousName !== user.name) {
        await Promise.all([
          Patient.updateMany({ guardianId: user._id }, { guardianName: user.name }),
          Appointment.updateMany({ guardianId: user._id }, { guardianName: user.name }),
        ]);
      }
    }

    await AuditLog.create({
      userId: user._id,
      action: "User updated own account details",
      targetUserId: user._id,
      role: user.role,
    });

    res.json({
      message: "Account details updated.",
      user: buildAuthUser(user, profile),
      profile,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/change-password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({ message: "Current password is required." });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters." });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);

    if (!passwordMatch) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;
    await user.save();

    await AuditLog.create({
      userId: user._id,
      action: "Staff changed temporary password",
      targetUserId: user._id,
      role: user.role,
    });

    const profile =
      user.role === "parent"
        ? await ParentProfile.findOne({ userId: user._id })
        : null;

    res.json({
      message: "Password changed successfully.",
      user: buildAuthUser(user, profile),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
