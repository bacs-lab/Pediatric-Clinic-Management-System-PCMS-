const express = require("express");

const Appointment = require("../models/Appointment");
const Assessment = require("../models/Assessment");
const Billing = require("../models/Billing");
const MedicalRecord = require("../models/MedicalRecord");
const ParentProfile = require("../models/ParentProfile");
const Patient = require("../models/Patient");
const Queue = require("../models/Queue");
const VaccineRecord = require("../models/VaccineRecord");
const { protect, allowRoles } = require("../middleware/authMiddleware");
const {
  FRONT_DESK_ROLES,
  PATIENT_CREATION_ROLES,
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

const attachGuardianContactNumber = async (payload, fallbackContactNumber = "") => {
  const trimmedFallback =
    typeof fallbackContactNumber === "string" ? fallbackContactNumber.trim() : "";

  if (payload.guardianId) {
    const guardianProfile = await ParentProfile.findOne({
      userId: payload.guardianId,
    }).select("contactNumber");

    const guardianContact = guardianProfile?.contactNumber?.trim?.() || "";
    payload.contactNumber = guardianContact || trimmedFallback;
    return payload;
  }

  payload.contactNumber = trimmedFallback;
  return payload;
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
        status: "Active",
        requestedBy: req.user.id,
        approvedBy: req.user.id,
        approvedAt: new Date(),
      };

      if (isParentRequest) {
        patientPayload.guardianId = req.user.id;
        patientPayload.guardianName = req.user.name;
      }

      await attachGuardianContactNumber(patientPayload, req.body.contactNumber);

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
  "/:id/parent-edit",
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

      const patientPayload = sanitizePatientPayload(req.body, {
        allowGuardianOverride: false,
      });

      if (Object.keys(patientPayload).length === 0) {
        return res.status(400).json({ message: "No patient changes submitted." });
      }

      await attachGuardianContactNumber(
        patientPayload,
        req.body.contactNumber || patient.contactNumber
      );

      Object.assign(patient, patientPayload);
      patient.pendingUpdate = null;
      patient.pendingUpdateStatus = "None";
      patient.pendingUpdateRequestedBy = undefined;
      patient.pendingUpdateReviewedBy = undefined;
      patient.pendingUpdateReviewedAt = undefined;

      const updatedPatient = await patient.save();
      res.json(updatedPatient);
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
    const patientPayload = {
      ...sanitizePatientPayload(req.body),
      pendingUpdate: null,
      pendingUpdateStatus: "None",
      pendingUpdateRequestedBy: undefined,
      pendingUpdateReviewedBy: undefined,
      pendingUpdateReviewedAt: undefined,
    };

    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    if (!patientPayload.guardianId) {
      patientPayload.guardianId = patient.guardianId;
    }

    await attachGuardianContactNumber(
      patientPayload,
      req.body.contactNumber || patient.contactNumber
    );

    const updatedPatient = await Patient.findByIdAndUpdate(
      req.params.id,
      patientPayload,
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
