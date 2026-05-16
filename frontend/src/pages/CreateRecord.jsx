import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function CreateRecord() {
  const navigate = useNavigate();

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
    fetch("http://localhost:5000/api/patients")
      .then((res) => res.json())
      .then((data) => setPatients(data))
      .catch((err) => console.log(err));
  }, []);

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
      alert("Please select a patient first");
      return;
    }

    const res = await fetch("http://localhost:5000/api/records", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      alert("Medical record created!");
      navigate("/staff/dashboard");
    } else {
      const errorData = await res.json();
      alert(errorData.message || "Failed to create record");
    }
  };

  return (
    <div className="layout">
      <div className="sidebar">
        <h2>PCMS Staff</h2>

        <ul>
          <li>
            <button onClick={() => navigate("/staff/dashboard")}>
              Dashboard
            </button>
          </li>

          <li>
            <button onClick={() => navigate(-1)}>Back</button>
          </li>
        </ul>
      </div>

      <div className="main-content">
        <h1 className="page-title">Create Medical Record</h1>

        <form onSubmit={handleSubmit}>
          <select name="patientId" value={form.patientId} onChange={handlePatientSelect}>
            <option value="">Select Patient</option>

            {patients.map((patient) => (
              <option key={patient._id} value={patient._id}>
                {patient.firstName} {patient.lastName}
              </option>
            ))}
          </select>

          <input
            name="patientName"
            placeholder="Patient Name"
            value={form.patientName}
            readOnly
          />

          <input
            name="age"
            type="number"
            placeholder="Age"
            value={form.age}
            readOnly
          />

          <input
            name="gender"
            placeholder="Gender"
            value={form.gender}
            readOnly
          />

          <input
            name="phone"
            placeholder="Phone"
            value={form.phone}
            readOnly
          />

          <input
            name="address"
            placeholder="Address"
            value={form.address}
            readOnly
          />

          <input
            name="chiefComplaint"
            placeholder="Chief Complaint"
            value={form.chiefComplaint}
            onChange={handleChange}
          />

          <input
            name="diagnosis"
            placeholder="Diagnosis"
            value={form.diagnosis}
            onChange={handleChange}
          />

          <input
            name="treatment"
            placeholder="Treatment"
            value={form.treatment}
            onChange={handleChange}
          />

          <input
            name="prescription"
            placeholder="Prescription"
            value={form.prescription}
            onChange={handleChange}
          />

          <input
            name="doctorName"
            placeholder="Doctor Name"
            value={form.doctorName}
            onChange={handleChange}
          />

          <button className="primary-btn" type="submit">
            Save Record
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateRecord;