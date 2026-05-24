const express = require("express");
const bcrypt = require("bcryptjs");

const AuditLog = require("../models/AuditLog");
const User = require("../models/User");
const { protect, allowRoles } = require("../middleware/authMiddleware");
const { ALLOWED_STAFF_CREATION_ROLES } = require("../constants/roles");

const router = express.Router();

const staffProjection = "_id name email role status mustChangePassword createdAt updatedAt";

const auditNonAdminStaffCreateAttempt = async (req, res, next) => {
  if (req.user?.role === "admin") {
    return next();
  }

  await AuditLog.create({
    userId: req.user?._id,
    action: "Failed attempt to create staff by non-admin user",
    role: req.user?.role,
  });

  return res.status(403).json({ message: "Only admins can create staff accounts." });
};

const validateStaffPayload = ({ name, email, password, role }) => {
  if (!name?.trim()) return "Name is required";
  if (!email?.trim()) return "Email is required";
  if (!password) return "Temporary password is required.";
  if (!ALLOWED_STAFF_CREATION_ROLES.includes(role)) return "Invalid staff role.";
  return null;
};

router.get("/", protect, allowRoles("admin"), async (req, res) => {
  try {
    const users = await User.find({
      role: { $in: ALLOWED_STAFF_CREATION_ROLES },
    })
      .select(staffProjection)
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post(
  "/create-staff",
  protect,
  auditNonAdminStaffCreateAttempt,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { name, email, password, role } = req.body;
      const validationError = validateStaffPayload({ name, email, password, role });

      if (validationError) {
        return res.status(400).json({ message: validationError });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const existingUser = await User.findOne({ email: normalizedEmail });

      if (existingUser) {
        return res.status(400).json({ message: "Email already exists." });
      }

      const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: await bcrypt.hash(password, 10),
        role,
        status: "Active",
        mustChangePassword: true,
      });

      await AuditLog.create({
        userId: req.user._id,
        action: "Admin created staff account",
        targetUserId: user._id,
        role: user.role,
      });

      const createdUser = await User.findById(user._id).select(staffProjection);
      res.status(201).json(createdUser);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.put("/:id/status", protect, allowRoles("admin"), async (req, res) => {
  try {
    const { status } = req.body;

    if (!["Active", "Disabled"].includes(status)) {
      return res.status(400).json({ message: "Invalid user status." });
    }

    const user = await User.findById(req.params.id);

    if (!user || !ALLOWED_STAFF_CREATION_ROLES.includes(user.role)) {
      return res.status(404).json({ message: "Staff account not found." });
    }

    user.status = status;
    await user.save();

    if (status === "Disabled") {
      await AuditLog.create({
        userId: req.user._id,
        action: "Admin disabled staff account",
        targetUserId: user._id,
        role: user.role,
      });
    }

    const updatedUser = await User.findById(user._id).select(staffProjection);
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id/reset-password", protect, allowRoles("admin"), async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Temporary password is required." });
    }

    const user = await User.findById(req.params.id);

    if (!user || !ALLOWED_STAFF_CREATION_ROLES.includes(user.role)) {
      return res.status(404).json({ message: "Staff account not found." });
    }

    user.password = await bcrypt.hash(password, 10);
    user.mustChangePassword = true;
    await user.save();

    await AuditLog.create({
      userId: req.user._id,
      action: "Admin reset staff password",
      targetUserId: user._id,
      role: user.role,
    });

    const updatedUser = await User.findById(user._id).select(staffProjection);
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
