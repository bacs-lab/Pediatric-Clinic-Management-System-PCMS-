import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function EditRecord() {
  const navigate = useNavigate();
  const { id } = useParams();

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

  useEffect(() => {
    fetch(`http://localhost:5000/api/records/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setForm({
          patientName: data.patientName || "",
          age: data.age || "",
          gender: data.gender || "Male",
          phone: data.phone || "",
          address: data.address || "",
          chiefComplaint: data.chiefComplaint || "",
          diagnosis: data.diagnosis || "",
          treatment: data.treatment || "",
          prescription: data.prescription || "",
          doctorName: data.doctorName || "",
        });
      })
      .catch((err) => console.log(err));
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch(`http://localhost:5000/api/records/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      alert("Medical record updated!");
      navigate(`/staff/records/${id}`);
    } else {
      alert("Failed to update record");
    }
  };

  return (
    <div>
      <h1>Edit Medical Record</h1>
      <button onClick={() => navigate("/staff/dashboard")}>Back</button>

      <form onSubmit={handleSubmit}>
        <input name="patientName" value={form.patientName} onChange={handleChange} />
        <input name="age" type="number" value={form.age} onChange={handleChange} />

        <select name="gender" value={form.gender} onChange={handleChange}>
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
        </select>

        <input name="phone" value={form.phone} onChange={handleChange} />
        <input name="address" value={form.address} onChange={handleChange} />
        <input name="chiefComplaint" value={form.chiefComplaint} onChange={handleChange} />
        <input name="diagnosis" value={form.diagnosis} onChange={handleChange} />
        <input name="treatment" value={form.treatment} onChange={handleChange} />
        <input name="prescription" value={form.prescription} onChange={handleChange} />
        <input name="doctorName" value={form.doctorName} onChange={handleChange} />

        <button type="submit">Update Record</button>
      </form>
    </div>
  );
}

export default EditRecord;