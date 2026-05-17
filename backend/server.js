const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const medicalRecordRoutes = require("./routes/medicalRecordRoutes");


const authRoutes = require("./routes/authRoutes");

const patientRoutes = require("./routes/patientRoutes");

const parentProfileRoutes = require("./routes/parentProfileRoutes");

const appointmentRoutes = require("./routes/appointmentRoutes");
const queueRoutes = require("./routes/queueRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");
const billingRoutes = require("./routes/billingRoutes");

const app = express();

app.use(cors());
app.use(express.json());


app.use("/api/records", medicalRecordRoutes);


app.use("/api/auth", authRoutes);

app.use("/api/patients", patientRoutes);

app.use("/api/parent-profiles", parentProfileRoutes);

app.use("/api/appointments", appointmentRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/billings", billingRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("Backend Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});