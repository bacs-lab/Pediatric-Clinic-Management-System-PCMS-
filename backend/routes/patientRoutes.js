const express = require("express");

const Appointment = require("../models/Appointment");
const Assessment = require("../models/Assessment");
const Billing = require("../models/Billing");
const MedicalRecord = require("../models/MedicalRecord");
const Patient = require("../models/Patient");
const Queue = require("../models/Queue");
const VaccineRecord = require("../models/VaccineRecord");
const { protect, allowRoles } = require("../middleware/authMiddleware");
const {
  FRONT_DESK_ROLES,
  PATIENT_CREATION_ROLES,
  PATIENT_APPROVAL_ROLES,
  ROLES,
  STAFF_ROLES,
} = require("../constants/roles");

const router = express.Router();

const canAccessPatient = (req, patient) =>
  STAFF_ROLES.includes(req.user.role) ||
  patient.guardianId?.toString() === req.user.id;

const calculateAgeFromBirthDate = (birthDateValue) => {
  if (!birthDateValue) return undefined;

  const birthDate = new Date(birthDateValue);
  if (Number.isNaN(birthDate.getTime())) return undefined;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthOffset = today.getMonth() - birthDate.getMonth();

  if (
    monthOffset < 0 ||
    (monthOffset === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return Math.max(age, 0);
};

const sanitizePatientPayload = (body, { allowGuardianOverride = true } = {}) => {
  const payload = {};

  if (typeof body.firstName === "string") payload.firstName = body.firstName.trim();
  if (typeof body.lastName === "string") payload.lastName = body.lastName.trim();
  if (typeof body.gender === "string") payload.gender = body.gender;
  if (typeof body.relationshipToChild === "string") {
    payload.relationshipToChild = body.relationshipToChild.trim();
  }
  if (typeof body.emergencyContact === "string") {
    payload.emergencyContact = body.emergencyContact.trim();
  }
  if (typeof body.contactNumber === "string") {
    payload.contactNumber = body.contactNumber.trim();
  }
  if (typeof body.address === "string") payload.address = body.address.trim();
  if (typeof body.bloodType === "string") payload.bloodType = body.bloodType.trim();
  if (typeof body.allergies === "string") payload.allergies = body.allergies.trim();
  if (typeof body.notes === "string") payload.notes = body.notes.trim();

  if (body.birthDate) {
    const birthDate = new Date(body.birthDate);

    if (!Number.isNaN(birthDate.getTime())) {
      payload.birthDate = birthDate;
      payload.age = calculateAgeFromBirthDate(birthDate);
    }
  }

  if (allowGuardianOverride && body.guardianId) {
    payload.guardianId = body.guardianId;
  }

  if (allowGuardianOverride && typeof body.guardianName === "string") {
    payload.guardianName = body.guardianName.trim();
  }

  return payload;
};

const loadPendingPatientRequest = async (id) => {
  const patient = await Patient.findById(id);

  if (!patient) {
    return { error: { status: 404, message: "Patient not found" } };
  }

  if ((patient.status || "Active") !== "Pending") {
    return {
      error: {
        status: 400,
        message: "Only pending child requests can be reviewed",
      },
    };
  }

  return { patient };
};

const loadPendingPatientUpdateRequest = async (id) => {
  const patient = await Patient.findById(id);

  if (!patient) {
    return { error: { status: 404, message: "Patient not found" } };
  }

  if ((patient.pendingUpdateStatus || "None") !== "Pending" || !patient.pendingUpdate) {
    return {
      error: {
        status: 400,
        message: "Only pending patient detail updates can be reviewed",
      },
    };
  }

  return { patient };
};

router.post(
  "/",
  protect,
  allowRoles(ROLES.PARENT, ...PATIENT_CREATION_ROLES),
  async (req, res) => {
    try {
      const isParentRequest = req.user.role === ROLES.PARENT;
      const patientPayload = {
        ...sanitizePatientPayload(req.body),
        status: isParentRequest ? "Pending" : "Active",
        requestedBy: req.user.id,
        approvedBy: isParentRequest ? undefined : req.user.id,
        approvedAt: isParentRequest ? undefined : new Date(),
      };

      if (isParentRequest) {
        patientPayload.guardianId = req.user.id;
        patientPayload.guardianName = req.user.name;
      }

      const patient = await Patient.create(patientPayload);
      res.status(201).json(patient);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.get("/", protect, allowRoles(...STAFF_ROLES), async (req, res) => {
  try {
    const patients = await Patient.find();
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get(
  "/pending",
  protect,
  allowRoles(...PATIENT_APPROVAL_ROLES),
  async (req, res) => {
    try {
      const patients = await Patient.find({ status: "Pending" }).sort({
        createdAt: -1,
      });
      res.json(patients);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.get(
  "/pending-updates",
  protect,
  allowRoles(...PATIENT_APPROVAL_ROLES),
  async (req, res) => {
    try {
      const patients = await Patient.find({ pendingUpdateStatus: "Pending" }).sort({
        updatedAt: -1,
      });
      res.json(patients);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.get(
  "/guardian/:guardianId",
  protect,
  allowRoles(ROLES.PARENT, ...STAFF_ROLES),
  async (req, res) => {
    try {
      if (req.user.role === ROLES.PARENT && req.params.guardianId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const patients = await Patient.find({
        guardianId: req.params.guardianId,
      });

      res.json(patients);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.put(
  "/:id/request-edit",
  protect,
  allowRoles(ROLES.PARENT),
  async (req, res) => {
    try {
      const patient = await Patient.findById(req.params.id);

      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      if (patient.guardianId?.toString() !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      if ((patient.status || "Active") !== "Active") {
        return res.status(400).json({
          message: "Only active child profiles can be edited.",
        });
      }

      const pendingUpdate = sanitizePatientPayload(req.body, {
        allowGuardianOverride: false,
      });

      if (Object.keys(pendingUpdate).length === 0) {
        return res.status(400).json({ message: "No patient changes submitted." });
      }

      patient.pendingUpdate = pendingUpdate;
      patient.pendingUpdateStatus = "Pending";
      patient.pendingUpdateRequestedBy = req.user.id;
      patient.pendingUpdateReviewedBy = undefined;
      patient.pendingUpdateReviewedAt = undefined;

      const updatedPatient = await patient.save();
      res.json(updatedPatient);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.put(
  "/:id/approve",
  protect,
  allowRoles(...PATIENT_APPROVAL_ROLES),
  async (req, res) => {
    try {
      const { patient, error } = await loadPendingPatientRequest(req.params.id);

      if (error) {
        return res.status(error.status).json({ message: error.message });
      }

      patient.status = "Active";
      patient.approvedBy = req.user.id;
      patient.approvedAt = new Date();

      const updatedPatient = await patient.save();
      res.json(updatedPatient);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.put(
  "/:id/approve-edit",
  protect,
  allowRoles(...PATIENT_APPROVAL_ROLES),
  async (req, res) => {
    try {
      const { patient, error } = await loadPendingPatientUpdateRequest(req.params.id);

      if (error) {
        return res.status(error.status).json({ message: error.message });
      }

      Object.assign(patient, patient.pendingUpdate || {});
      patient.pendingUpdate = null;
      patient.pendingUpdateStatus = "None";
      patient.pendingUpdateReviewedBy = req.user.id;
      patient.pendingUpdateReviewedAt = new Date();

      const updatedPatient = await patient.save();
      res.json(updatedPatient);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.put(
  "/:id/reject",
  protect,
  allowRoles(...PATIENT_APPROVAL_ROLES),
  async (req, res) => {
    try {
      const { patient, error } = await loadPendingPatientRequest(req.params.id);

      if (error) {
        return res.status(error.status).json({ message: error.message });
      }

      patient.status = "Rejected";
      patient.approvedBy = undefined;
      patient.approvedAt = undefined;

      const updatedPatient = await patient.save();
      res.json(updatedPatient);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.put(
  "/:id/reject-edit",
  protect,
  allowRoles(...PATIENT_APPROVAL_ROLES),
  async (req, res) => {
    try {
      const { patient, error } = await loadPendingPatientUpdateRequest(req.params.id);

      if (error) {
        return res.status(error.status).json({ message: error.message });
      }

      patient.pendingUpdate = null;
      patient.pendingUpdateStatus = "None";
      patient.pendingUpdateReviewedBy = req.user.id;
      patient.pendingUpdateReviewedAt = new Date();

      const updatedPatient = await patient.save();
      res.json(updatedPatient);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// CANCEL child enrollment request (Parent)
router.delete(
  "/:id/cancel",
  protect,
  allowRoles(ROLES.PARENT),
  async (req, res) => {
    try {
      const patient = await Patient.findById(req.params.id);

      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      if (patient.guardianId?.toString() !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      if ((patient.status || "Active") !== "Pending") {
        return res.status(400).json({
          message: "Only pending child requests can be cancelled.",
        });
      }

      await Patient.findByIdAndDelete(patient._id);
      res.json({ message: "Child enrollment request cancelled" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.get("/:id", protect, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    if (!canAccessPatient(req, patient)) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", protect, allowRoles(...FRONT_DESK_ROLES), async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const updatedPatient = await Patient.findByIdAndUpdate(
      req.params.id,
      {
        ...sanitizePatientPayload(req.body),
        pendingUpdate: null,
        pendingUpdateStatus: "None",
        pendingUpdateRequestedBy: undefined,
        pendingUpdateReviewedBy: undefined,
        pendingUpdateReviewedAt: undefined,
      },
      { new: true }
    );

    res.json(updatedPatient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", protect, allowRoles(ROLES.ADMIN), async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    await Promise.all([
      Appointment.deleteMany({ patientId: patient._id }),
      Assessment.deleteMany({ patientId: patient._id }),
      Billing.deleteMany({ patientId: patient._id }),
      MedicalRecord.deleteMany({ patientId: patient._id }),
      Queue.deleteMany({ patientId: patient._id }),
      VaccineRecord.deleteMany({ patientId: patient._id }),
      Patient.findByIdAndDelete(patient._id),
    ]);

    res.json({ message: "Patient record removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
