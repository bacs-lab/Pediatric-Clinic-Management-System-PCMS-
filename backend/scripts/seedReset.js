const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const path = require("path");

const Appointment = require("../models/Appointment");
const Assessment = require("../models/Assessment");
const AuditLog = require("../models/AuditLog");
const Billing = require("../models/Billing");
const InventoryItem = require("../models/InventoryItem");
const MedicalRecord = require("../models/MedicalRecord");
const ParentProfile = require("../models/ParentProfile");
const Patient = require("../models/Patient");
const Queue = require("../models/Queue");
const User = require("../models/User");
const VaccineRecord = require("../models/VaccineRecord");
const { ROLES } = require("../constants/roles");

dotenv.config({ path: path.resolve(__dirname, "../.env"), quiet: true });

const DEMO_PASSWORD = "123456";
const CONFIRM_FLAG = "--confirm-reset";

const resetCollections = [
  { label: "Audit Logs", model: AuditLog },
  { label: "Vaccine Records", model: VaccineRecord },
  { label: "Billing Records", model: Billing },
  { label: "Medical Records", model: MedicalRecord },
  { label: "Assessments", model: Assessment },
  { label: "Queue", model: Queue },
  { label: "Appointments", model: Appointment },
  { label: "Patients / Children", model: Patient },
  { label: "Parent Profiles", model: ParentProfile },
  { label: "Inventory Items", model: InventoryItem },
  { label: "Users", model: User },
];

const isoDate = (value) => new Date(`${value}T00:00:00.000Z`);
const isoDateTime = (date, time) => new Date(`${date}T${time}:00.000Z`);

const getArgValue = (name) => {
  const prefix = `${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : "";
};

const calculateAge = (birthDate, asOf = new Date()) => {
  const birth = new Date(birthDate);
  let age = asOf.getFullYear() - birth.getFullYear();
  const monthOffset = asOf.getMonth() - birth.getMonth();

  if (
    monthOffset < 0 ||
    (monthOffset === 0 && asOf.getDate() < birth.getDate())
  ) {
    age -= 1;
  }

  return Math.max(age, 0);
};

const patientName = (patient) => `${patient.firstName} ${patient.lastName}`;

const showResetWarning = () => {
  const collectionList = resetCollections
    .map(({ label, model }) => `- ${label}: ${model.collection.name}`)
    .join("\n");

  console.warn(
    [
      "",
      "WARNING: PCMS DEVELOPMENT DATABASE RESET",
      "This script permanently deletes all documents from the listed collections before inserting demo data.",
      "Do not run this against production or a database containing real patient data.",
      "",
      collectionList,
      "",
    ].join("\n")
  );
};

const assertCanRun = () => {
  const requestedEnv = getArgValue("--env") || process.env.NODE_ENV;

  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run seed reset while NODE_ENV=production.");
  }

  if (requestedEnv !== "development") {
    throw new Error(
      "Seed reset is development-only. Run with --env=development or set NODE_ENV=development."
    );
  }

  if (!process.argv.includes(CONFIRM_FLAG)) {
    throw new Error(
      `Missing ${CONFIRM_FLAG}. This flag is required because the script deletes data.`
    );
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required before running the seed reset.");
  }
};

const connectDatabase = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected to MongoDB database: ${mongoose.connection.name}`);
};

const clearCollections = async () => {
  console.log("Clearing existing development data...");

  for (const { label, model } of resetCollections) {
    const result = await model.deleteMany({});
    console.log(
      `Cleared ${label} (${model.collection.name}): ${result.deletedCount} document(s)`
    );
  }
};

const createUser = async ({ name, email, role, status = "Active" }) => {
  return User.create({
    name,
    email,
    password: await bcrypt.hash(DEMO_PASSWORD, 10),
    role,
    status,
    mustChangePassword: false,
  });
};

const createParentProfile = async ({ user, contactNumber, address }) => {
  return ParentProfile.create({
    userId: user._id,
    fullName: user.name,
    contactNumber,
    address,
    relationshipToChild: "Parent",
    emergencyContact: contactNumber,
    verificationStatus: "Approved",
  });
};

const createPatient = async ({
  firstName,
  lastName,
  birthDate,
  gender,
  guardian,
  contactNumber,
  address,
  relationshipToChild,
  emergencyContact,
  bloodType,
  allergies,
  notes,
  approvedBy,
}) => {
  return Patient.create({
    firstName,
    lastName,
    birthDate: isoDate(birthDate),
    age: calculateAge(isoDate(birthDate)),
    gender,
    guardianId: guardian._id,
    guardianName: guardian.name,
    relationshipToChild,
    emergencyContact,
    contactNumber,
    address,
    bloodType,
    allergies,
    notes,
    status: "Active",
    requestedBy: guardian._id,
    approvedBy: approvedBy._id,
    approvedAt: isoDate("2026-05-10"),
  });
};

const createAppointmentWithQueue = async ({
  patient,
  guardian,
  appointmentDate,
  appointmentTime,
  reason,
  appointmentStatus,
  queueNumber,
  queueStatus,
  requestedAt,
  remarks,
}) => {
  const appointment = await Appointment.create({
    patientId: patient._id,
    guardianId: guardian._id,
    patientName: patientName(patient),
    guardianName: guardian.name,
    appointmentDate: isoDate(appointmentDate),
    appointmentTime,
    reason,
    status: appointmentStatus,
    remarks,
  });

  const queue = await Queue.create({
    appointmentId: appointment._id,
    patientId: patient._id,
    patientName: patientName(patient),
    guardianName: guardian.name,
    appointmentDate: appointment.appointmentDate,
    appointmentTime,
    requestedAt: isoDateTime(requestedAt, "08:00"),
    queueNumber,
    status: queueStatus,
  });

  return { appointment, queue };
};

const createAssessment = async ({ queue, patient, overrides = {} }) => {
  return Assessment.create({
    queueId: queue._id,
    patientId: patient._id,
    patientName: patientName(patient),
    height: overrides.height || "112 cm",
    weight: overrides.weight || "19 kg",
    temperature: overrides.temperature || "37.1 C",
    bloodPressure: overrides.bloodPressure || "96/62",
    heartRate: overrides.heartRate || "98 bpm",
    symptoms: overrides.symptoms || "Mild cough and nasal congestion",
    reasonForVisit: overrides.reasonForVisit || "Clinic consultation",
    remarks: overrides.remarks || "Stable vital signs.",
  });
};

const createMedicalRecord = async ({
  patient,
  assessment,
  queue,
  chiefComplaint,
  diagnosis,
  treatment,
  prescription,
  consultationNotes,
  visitDate,
  followUpDate,
  doctor,
}) => {
  return MedicalRecord.create({
    patientId: patient._id,
    patientName: patientName(patient),
    age: patient.age,
    gender: patient.gender,
    phone: patient.contactNumber,
    address: patient.address,
    chiefComplaint,
    diagnosis,
    treatment,
    prescription,
    doctorName: doctor.name,
    visitDate: isoDate(visitDate),
    assessmentId: assessment?._id,
    queueId: queue?._id,
    consultationNotes,
    followUpDate: followUpDate ? isoDate(followUpDate) : undefined,
  });
};

const createBilling = async ({ queue, patient }) => {
  return Billing.create({
    queueId: queue._id,
    patientId: patient._id,
    patientName: patientName(patient),
    consultationFee: 500,
    medicineFee: 250,
    vaccineFee: 0,
    otherFee: 0,
    totalAmount: 750,
    paymentStatus: "Paid",
    remarks: "Paid by Cash on 2026-05-23.",
  });
};

const createInventory = async () => {
  const items = [
    ["Paracetamol Syrup", "Medicine", 25, "bottle", 120, "2027-05-01", 8],
    ["Cetirizine Syrup", "Medicine", 18, "bottle", 140, "2027-04-15", 8],
    ["Amoxicillin Suspension", "Medicine", 20, "bottle", 180, "2027-03-20", 8],
    ["Oral Rehydration Salts", "Medicine", 40, "sachet", 25, "2028-01-01", 15],
    ["Salbutamol Nebule", "Medicine", 30, "ampule", 45, "2027-06-10", 10],
    ["BCG Vaccine", "Vaccine", 15, "vial", 600, "2026-12-15", 5],
    ["Hepatitis B Vaccine", "Vaccine", 18, "vial", 650, "2027-02-10", 5],
    ["MMR Vaccine", "Vaccine", 12, "vial", 900, "2027-03-15", 5],
    ["Varicella Vaccine", "Vaccine", 10, "vial", 1200, "2027-04-20", 4],
    ["Flu Vaccine", "Vaccine", 20, "vial", 850, "2026-10-01", 6],
    ["Syringe 1ml", "Supply", 100, "pcs", 10, "2028-05-01", 25],
    ["Cotton Balls", "Supply", 50, "pack", 75, "2028-08-01", 12],
    ["Alcohol Pads", "Supply", 200, "pcs", 5, "2028-06-01", 50],
    ["Disposable Gloves", "Supply", 300, "pcs", 3, "2028-09-01", 60],
    ["Thermometer Covers", "Supply", 150, "pcs", 2, "2028-07-01", 40],
  ];

  const inventoryItems = await InventoryItem.insertMany(
    items.map(
      ([
        itemName,
        category,
        stockQuantity,
        unit,
        price,
        expirationDate,
        lowStockLevel,
      ]) => ({
        itemName,
        category,
        stockQuantity,
        unit,
        price,
        expirationDate: isoDate(expirationDate),
        lowStockLevel,
        status: stockQuantity <= lowStockLevel ? "Low Stock" : "Available",
      })
    )
  );

  return new Map(inventoryItems.map((item) => [item.itemName, item]));
};

const createVaccineRecord = async ({
  patient,
  vaccineName,
  inventoryName,
  vaccineDate,
  nextDoseDate,
  doctor,
  remarks,
  inventoryByName,
}) => {
  const inventoryItem = inventoryByName.get(inventoryName);

  if (!inventoryItem) {
    throw new Error(`Missing inventory item for vaccine: ${inventoryName}`);
  }

  const record = await VaccineRecord.create({
    patientId: patient._id,
    patientName: patientName(patient),
    vaccineName,
    vaccineDate: isoDate(vaccineDate),
    doseNumber: 1,
    nextDoseDate: nextDoseDate ? isoDate(nextDoseDate) : undefined,
    status: "Completed",
    administeredBy: doctor.name,
    remarks,
    inventoryItemId: inventoryItem._id,
  });

  inventoryItem.stockQuantity = Math.max(0, inventoryItem.stockQuantity - 1);
  inventoryItem.status =
    inventoryItem.stockQuantity <= inventoryItem.lowStockLevel
      ? "Low Stock"
      : "Available";
  await inventoryItem.save();

  return record;
};

const seedData = async () => {
  console.log("Creating demo users...");
  const [doctor, secretary, parent1, parent2] = await Promise.all([
    createUser({
      name: "Dr. Maria Santos",
      email: "doctor@email.com",
      role: ROLES.DOCTOR,
    }),
    createUser({
      name: "Secretary Ana Reyes",
      email: "sec@email.com",
      role: ROLES.SECRETARY,
    }),
    createUser({
      name: "Mika Aplasca",
      email: "parent1@email.com",
      role: ROLES.PARENT,
    }),
    createUser({
      name: "Carlo Bacud",
      email: "parent2@email.com",
      role: ROLES.PARENT,
    }),
  ]);

  console.log("Creating approved parent profiles...");
  await Promise.all([
    createParentProfile({
      user: parent1,
      contactNumber: "09171234567",
      address: "Block 5 Lot 12, Malolos, Bulacan",
    }),
    createParentProfile({
      user: parent2,
      contactNumber: "09181234567",
      address: "28 Mabini Street, Meycauayan, Bulacan",
    }),
  ]);

  console.log("Creating child patient profiles...");
  const parent1Children = [
    ["Chimi", "Aplasca Apin", "2018-03-14", "Female", "O+", "None"],
    ["Lian", "Aplasca Apin", "2019-07-22", "Male", "A+", "Dust allergy"],
    ["Miko", "Aplasca Apin", "2020-11-05", "Male", "B+", "None"],
    ["Nia", "Aplasca Apin", "2021-09-18", "Female", "AB+", "Mild lactose intolerance"],
    ["Theo", "Aplasca Apin", "2022-12-02", "Male", "O-", "None"],
    ["Yumi", "Aplasca Apin", "2024-01-25", "Female", "A-", "None"],
  ];

  const parent2Children = [
    ["Neil", "Bacud", "2017-06-10", "Male", "O+", "None"],
    ["Nina", "Bacud", "2018-10-08", "Female", "A+", "Pollen allergy"],
    ["Nico", "Bacud", "2019-05-16", "Male", "B+", "None"],
    ["Bea", "Bacud", "2020-02-27", "Female", "AB+", "Seafood allergy"],
    ["Marco", "Bacud", "2021-08-12", "Male", "O-", "None"],
    ["Lia", "Bacud", "2023-04-19", "Female", "A-", "None"],
  ];

  const createFamilyPatients = (children, guardian, address, contactNumber) =>
    Promise.all(
      children.map(
        ([firstName, lastName, birthDate, gender, bloodType, allergies]) =>
          createPatient({
            firstName,
            lastName,
            birthDate,
            gender,
            guardian,
            contactNumber,
            address,
            relationshipToChild: guardian._id.equals(parent1._id) ? "Mother" : "Father",
            emergencyContact: contactNumber,
            bloodType,
            allergies,
            notes: "Regular pediatric follow-up patient.",
            approvedBy: secretary,
          })
      )
    );

  const [aplascaChildren, bacudChildren] = await Promise.all([
    createFamilyPatients(
      parent1Children,
      parent1,
      "Block 5 Lot 12, Malolos, Bulacan",
      "09171234567"
    ),
    createFamilyPatients(
      parent2Children,
      parent2,
      "28 Mabini Street, Meycauayan, Bulacan",
      "09181234567"
    ),
  ]);

  const [chimi, lian] = aplascaChildren;
  const [neil, nina] = bacudChildren;

  console.log("Creating appointments and queue entries...");
  const chimiConsultation = await createAppointmentWithQueue({
    patient: chimi,
    guardian: parent1,
    appointmentDate: "2026-05-17",
    appointmentTime: "09:00 AM",
    reason: "Fever and cough",
    appointmentStatus: "Approved",
    queueNumber: 1,
    queueStatus: "In Consultation",
    requestedAt: "2026-05-17",
    remarks: "Currently being seen by the doctor.",
  });

  const chimiFollowUp = await createAppointmentWithQueue({
    patient: chimi,
    guardian: parent1,
    appointmentDate: "2026-05-20",
    appointmentTime: "10:30 AM",
    reason: "Follow-up consultation",
    appointmentStatus: "Approved",
    queueNumber: 2,
    queueStatus: "For Consultation",
    requestedAt: "2026-05-20",
    remarks: "Assessment completed, ready for doctor consultation.",
  });

  const neilCheckup = await createAppointmentWithQueue({
    patient: neil,
    guardian: parent2,
    appointmentDate: "2026-05-21",
    appointmentTime: "01:30 PM",
    reason: "Routine pediatric check-up",
    appointmentStatus: "Approved",
    queueNumber: 3,
    queueStatus: "Waiting",
    requestedAt: "2026-05-21",
    remarks: "Waiting for initial assessment.",
  });

  const neilCompleted = await createAppointmentWithQueue({
    patient: neil,
    guardian: parent2,
    appointmentDate: "2026-05-23",
    appointmentTime: "02:00 PM",
    reason: "Stomach pain",
    appointmentStatus: "Completed",
    queueNumber: 4,
    queueStatus: "Completed",
    requestedAt: "2026-05-23",
    remarks: "Consultation and billing completed.",
  });

  console.log("Creating assessments and consultation records...");
  const assessments = await Promise.all([
    createAssessment({
      queue: chimiConsultation.queue,
      patient: chimi,
      overrides: {
        height: "121 cm",
        weight: "23 kg",
        temperature: "38.2 C",
        bloodPressure: "98/64",
        heartRate: "104 bpm",
        symptoms: "Fever, cough, runny nose",
        reasonForVisit: "Fever and cough",
        remarks: "Hydrated, alert, with mild throat redness.",
      },
    }),
    createAssessment({
      queue: chimiFollowUp.queue,
      patient: chimi,
      overrides: {
        height: "121 cm",
        weight: "23 kg",
        temperature: "37.4 C",
        bloodPressure: "98/62",
        heartRate: "96 bpm",
        symptoms: "Improving cough",
        reasonForVisit: "Follow-up consultation",
        remarks: "Ready for doctor reassessment.",
      },
    }),
    createAssessment({
      queue: neilCompleted.queue,
      patient: neil,
      overrides: {
        height: "126 cm",
        weight: "25 kg",
        temperature: "37.0 C",
        bloodPressure: "100/66",
        heartRate: "92 bpm",
        symptoms: "Stomach pain with loose stool",
        reasonForVisit: "Stomach pain",
        remarks: "No signs of severe dehydration.",
      },
    }),
  ]);
  const chimiAssessment = assessments[0];
  const neilAssessment = assessments[2];

  await Promise.all([
    createMedicalRecord({
      patient: chimi,
      assessment: chimiAssessment,
      queue: chimiConsultation.queue,
      chiefComplaint: "Fever and cough",
      diagnosis: "Acute upper respiratory infection",
      treatment: "Supportive care, fever control, and hydration.",
      prescription: "Paracetamol syrup and increased fluid intake",
      consultationNotes:
        "Monitor temperature every 4 hours. Return if fever persists for more than 3 days.",
      visitDate: "2026-05-17",
      followUpDate: "2026-05-20",
      doctor,
    }),
    createMedicalRecord({
      patient: neil,
      assessment: neilAssessment,
      queue: neilCompleted.queue,
      chiefComplaint: "Stomach pain",
      diagnosis: "Mild gastroenteritis",
      treatment: "Oral rehydration and dietary adjustment.",
      prescription: "Oral rehydration solution and soft diet",
      consultationNotes:
        "Avoid oily food. Return if vomiting or dehydration occurs.",
      visitDate: "2026-05-23",
      followUpDate: "2026-05-30",
      doctor,
    }),
  ]);

  await createBilling({
    queue: neilCompleted.queue,
    patient: neil,
  });

  console.log("Creating inventory items and vaccine records...");
  const inventoryByName = await createInventory();

  await Promise.all([
    createVaccineRecord({
      patient: chimi,
      vaccineName: "BCG",
      inventoryName: "BCG Vaccine",
      vaccineDate: "2026-05-11",
      nextDoseDate: "",
      doctor,
      remarks: "Administered without immediate adverse reaction.",
      inventoryByName,
    }),
    createVaccineRecord({
      patient: lian,
      vaccineName: "Hepatitis B",
      inventoryName: "Hepatitis B Vaccine",
      vaccineDate: "2026-05-12",
      nextDoseDate: "2026-06-12",
      doctor,
      remarks: "Next dose scheduled after one month.",
      inventoryByName,
    }),
    createVaccineRecord({
      patient: neil,
      vaccineName: "MMR",
      inventoryName: "MMR Vaccine",
      vaccineDate: "2026-05-14",
      nextDoseDate: "",
      doctor,
      remarks: "Completed age-appropriate dose.",
      inventoryByName,
    }),
    createVaccineRecord({
      patient: nina,
      vaccineName: "Varicella",
      inventoryName: "Varicella Vaccine",
      vaccineDate: "2026-05-15",
      nextDoseDate: "",
      doctor,
      remarks: "Parent advised about common mild side effects.",
      inventoryByName,
    }),
  ]);

  await AuditLog.create({
    userId: secretary._id,
    action: "Development database reset and seeded with PCMS demo data",
    targetUserId: secretary._id,
    role: secretary.role,
  });

  console.log("Seed complete.");
  console.log("Created demo accounts:");
  console.log(`- Doctor: doctor@email.com / ${DEMO_PASSWORD}`);
  console.log(`- Secretary: sec@email.com / ${DEMO_PASSWORD}`);
  console.log(`- Parent 1: parent1@email.com / ${DEMO_PASSWORD}`);
  console.log(`- Parent 2: parent2@email.com / ${DEMO_PASSWORD}`);

  return {
    users: 4,
    parentProfiles: 2,
    patients: aplascaChildren.length + bacudChildren.length,
    appointments: 4,
    queues: 4,
    assessments: 3,
    medicalRecords: 2,
    billings: 1,
    vaccineRecords: 4,
    inventoryItems: inventoryByName.size,
  };
};

const main = async () => {
  showResetWarning();
  assertCanRun();
  await connectDatabase();
  await clearCollections();
  const summary = await seedData();
  console.log("Seed summary:", summary);
};

main()
  .catch((error) => {
    console.error("Seed reset failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
