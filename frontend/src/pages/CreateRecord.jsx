import { useState } from "react";
import { useNavigate } from "react-router-dom";

function CreateRecord() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
      alert("Failed to create record");
    }
  };

  return (
    <div>
      <h1>Create Medical Record</h1>

      <form onSubmit={handleSubmit}>
        <input name="patientName" placeholder="Patient Name" onChange={handleChange} />
        <input name="age" type="number" placeholder="Age" onChange={handleChange} />

        <select name="gender" onChange={handleChange}>
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
        </select>

        <input name="phone" placeholder="Phone" onChange={handleChange} />
        <input name="address" placeholder="Address" onChange={handleChange} />
        <input name="chiefComplaint" placeholder="Chief Complaint" onChange={handleChange} />
        <input name="diagnosis" placeholder="Diagnosis" onChange={handleChange} />
        <input name="treatment" placeholder="Treatment" onChange={handleChange} />
        <input name="prescription" placeholder="Prescription" onChange={handleChange} />
        <input name="doctorName" placeholder="Doctor Name" onChange={handleChange} />

        <button type="submit">Save Record</button>
      </form>
    </div>
  );
}

export default CreateRecord;