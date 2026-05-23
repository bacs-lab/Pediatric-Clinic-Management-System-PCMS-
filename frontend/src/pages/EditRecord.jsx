import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiUrl } from "../utils/api";
import { notify } from "../utils/notify";

function EditRecord({ embedded = false, recordId, onCancel, onSaved }) {
  const navigate = useNavigate();
  const { id: routeId } = useParams();
  const id = recordId || routeId;

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
    fetch(apiUrl(`/api/records/${id}`), {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
})
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

    const res = await fetch(apiUrl(`/api/records/${id}`), {
      method: "PUT",
      headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
},
      body: JSON.stringify(form),
    });

    if (res.ok) {
      const updatedRecord = await res.json();
      notify("Medical record updated!");
      if (onSaved) onSaved(updatedRecord);
      else navigate(`/staff/records/${id}`);
    } else {
      const data = await res.json().catch(() => ({}));
      notify(data.message || "Failed to update record");
    }
  };

  const formContent = (
    <>
      <h1 className={embedded ? "modal-title" : "page-title"}>
        Edit Medical Record
      </h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Patient Name</label>
            <input
              name="patientName"
              placeholder="Patient Name"
              value={form.patientName}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Age</label>
            <input
              name="age"
              type="number"
              placeholder="Age"
              value={form.age}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Gender</label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
            >
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Phone</label>
            <input
              name="phone"
              placeholder="Phone"
              value={form.phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <input
              name="address"
              placeholder="Address"
              value={form.address}
              onChange={handleChange}
            />
          </div>

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
              Update Record
            </button>
          </div>
        </form>
    </>
  );

  if (embedded) return formContent;

  return (
  <div className="dashboard-bg">

      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">MEDICAL RECORD MANAGEMENT</p>
          <h1>Edit Medical Record</h1>
          <span>Update patient consultation and treatment details.</span>
        </div>
      </div>

      <div className="panel">
        {formContent}
      </div>
    </div>
  );
}

export default EditRecord;
