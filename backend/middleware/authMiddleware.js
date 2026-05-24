const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select(
      "_id name email role status mustChangePassword"
    );

    if (!user) {
      return res.status(401).json({ message: "Not authorized, user not found" });
    }

    if (user.status === "Disabled") {
      return res.status(403).json({ message: "Account is disabled" });
    }

    req.user = {
      id: user._id.toString(),
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      mustChangePassword: user.mustChangePassword,
    };

    if (
      user.mustChangePassword &&
      !req.originalUrl.startsWith("/api/auth/change-password")
    ) {
      return res.status(403).json({
        message: "You must change your password before continuing.",
      });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };
};

module.exports = {
  protect,
  allowRoles,
};
