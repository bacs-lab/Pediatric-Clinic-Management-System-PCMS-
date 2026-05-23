import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiUrl } from "../utils/api";
import { notify } from "../utils/notify";

function CreateRecord({ embedded = false, initialPatientId = "", onCancel, onSaved }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedPatientId = initialPatientId || searchParams.get("patientId");
  const token = localStorage.getItem("token");

  const [patients, setPatients] = useState([]);

  const [form, setForm] = useState({
    patientId: "",
    patientName: "",
    age: "",
    gender: "Male",
    phone: "",
    address: "",
    chiefComplaint: "",
    diagnosis: "",
    treatment: "",
    prescription: "",
    doctorName: "",
  });

  useEffect(() => {
  fetch(apiUrl("/api/patients"), {
  headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
},
})
    .then((res) => res.json())
    .then((data) => {
      setPatients(data);

      if (selectedPatientId) {
        const selectedPatient = data.find(
          (patient) => patient._id === selectedPatientId
        );

        if (selectedPatient) {
          setForm((prevForm) => ({
            ...prevForm,
            patientId: selectedPatient._id,
            patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
            age: calculateAge(selectedPatient.birthDate),
            gender: selectedPatient.gender,
            phone: selectedPatient.contactNumber || "",
            address: selectedPatient.address || "",
          }));
        }
      }
    })
    .catch((err) => console.log(err));
}, [selectedPatientId, token]);

  const calculateAge = (birthDate) => {
    const birth = new Date(birthDate);
    const today = new Date();

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  };

  const handlePatientSelect = (e) => {
    const selectedPatient = patients.find(
      (patient) => patient._id === e.target.value
    );

    if (!selectedPatient) return;

    setForm({
      ...form,
      patientId: selectedPatient._id,
      patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
      age: calculateAge(selectedPatient.birthDate),
      gender: selectedPatient.gender,
      phone: selectedPatient.contactNumber || "",
      address: selectedPatient.address || "",
    });
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.patientId) {
  notify("Please select a patient first");
  return;
}

if (!form.chiefComplaint.trim()) {
  notify("Chief complaint is required");
  return;
}

if (!form.diagnosis.trim()) {
  notify("Diagnosis is required");
  return;
}

if (!form.treatment.trim()) {
  notify("Treatment is required");
  return;
}

if (!form.doctorName.trim()) {
  notify("Doctor name is required");
  return;
}

    const res = await fetch(apiUrl("/api/records"), {
      method: "POST",
     headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
},
      body: JSON.stringify(form),
    });

    if (res.ok) {
      notify("Medical record created!");
      if (onSaved) onSaved();
      else navigate("/staff/records");
    } else {
      const errorData = await res.json();
      notify(errorData.message || "Failed to create record");
    }
  };

  return (
    <>
        <h1 className={embedded ? "modal-title" : "page-title"}>Create Medical Record</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Patient</label>
            <select name="patientId" value={form.patientId} onChange={handlePatientSelect}>
              <option value="">Select Patient</option>
              {patients.map((patient) => (
                <option key={patient._id} value={patient._id}>
                  {patient.firstName} {patient.lastName}
                </option>
              ))}
            </select>
          </div>

          {form.patientId && (
            <div className="form-info-card">
              <div className="info-item">
                <span className="info-label">Patient Name</span>
                <span className="info-value">{form.patientName}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Age</span>
                <span className="info-value">{form.age}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Gender</span>
                <span className="info-value">{form.gender}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Phone</span>
                <span className="info-value">{form.phone}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Address</span>
                <span className="info-value">{form.address}</span>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Chief Complaint</label>
            <input
              name="chiefComplaint"
              placeholder="Chief Complaint"
              value={form.chiefComplaint}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Diagnosis</label>
            <input
              name="diagnosis"
              placeholder="Diagnosis"
              value={form.diagnosis}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Treatment</label>
            <input
              name="treatment"
              placeholder="Treatment"
              value={form.treatment}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Prescription</label>
            <input
              name="prescription"
              placeholder="Prescription"
              value={form.prescription}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Doctor Name</label>
            <input
              name="doctorName"
              placeholder="Doctor Name"
              value={form.doctorName}
              onChange={handleChange}
            />
          </div>

          <div className="modal-buttons">
            {embedded && (
              <button className="secondary-btn" type="button" onClick={onCancel}>
                Cancel
              </button>
            )}
            <button className="primary-btn" type="submit">
              Save Record
            </button>
          </div>
        </form>
      </>
  );
}

export default CreateRecord;
