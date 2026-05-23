import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function CreateBilling() {
  const navigate = useNavigate();
  const location = useLocation();
  const queueItem = location.state;
  const token = localStorage.getItem("token");

  const [patients, setPatients] = useState([]);

  const [form, setForm] = useState({
    queueId: queueItem?._id || "",
    patientId: queueItem?.patientId || "",
    patientName: queueItem?.patientName || "",
    consultationFee: "",
    medicineFee: "",
    vaccineFee: "",
    otherFee: "",
    paymentStatus: "Unpaid",
    remarks: "",
  });

  useEffect(() => {
    fetch("http://localhost:5000/api/patients", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setPatients(data))
      .catch((err) => console.log(err));
  }, [token]);

  // auto-select the queue patient once patients list loads
  useEffect(() => {
    if (queueItem?.patientId && patients.length > 0) {
      const match = patients.find((p) => p._id === queueItem.patientId);
      if (match) {
        setForm((prev) => ({
          ...prev,
          patientId: match._id,
          patientName: `${match.firstName} ${match.lastName}`,
        }));
      }
    }
  }, [queueItem?.patientId, patients]);

  const total =
    Number(form.consultationFee || 0) +
    Number(form.medicineFee || 0) +
    Number(form.vaccineFee || 0) +
    Number(form.otherFee || 0);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.patientId || !form.queueId) {
  alert("No patient/queue selected");
  return;
}

if (
  Number(form.consultationFee || 0) < 0 ||
  Number(form.medicineFee || 0) < 0 ||
  Number(form.vaccineFee || 0) < 0 ||
  Number(form.otherFee || 0) < 0
) {
  alert("Fees cannot be negative");
  return;
}

if (!form.paymentStatus) {
  alert("Please select payment status");
  return;
}

    const res = await fetch("http://localhost:5000/api/billings", {
      method: "POST",
      headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
},
      body: JSON.stringify(form),
    });

    if (res.ok) {
      alert("Billing saved! Queue completed.");
      navigate("/staff/queue");
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.message || "Failed to save billing");
    }
  };

  return (
    <>
        <h1 className="page-title">Create Billing</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Patient</label>
            <select value={form.patientId} onChange={(e) => {
              const selected = patients.find((p) => p._id === e.target.value);
              if (selected) {
                setForm({ ...form, patientId: selected._id, patientName: `${selected.firstName} ${selected.lastName}` });
              } else {
                setForm({ ...form, patientId: "", patientName: "" });
              }
            }}>
              <option value="">Select Patient</option>
              {patients.map((patient) => (
                <option key={patient._id} value={patient._id}>
                  {patient.firstName} {patient.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Consultation Fee (₱)</label>
            <input
              name="consultationFee"
              type="number"
              placeholder="0"
              value={form.consultationFee}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Medicine Fee (₱)</label>
            <input
              name="medicineFee"
              type="number"
              placeholder="0"
              value={form.medicineFee}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Vaccine Fee (₱)</label>
            <input
              name="vaccineFee"
              type="number"
              placeholder="0"
              value={form.vaccineFee}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Other Fee (₱)</label>
            <input
              name="otherFee"
              type="number"
              placeholder="0"
              value={form.otherFee}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Payment Status</label>
            <select
              name="paymentStatus"
              value={form.paymentStatus}
              onChange={handleChange}
            >
              <option>Unpaid</option>
              <option>Partial</option>
              <option>Paid</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Remarks</label>
            <textarea
              name="remarks"
              placeholder="Remarks"
              value={form.remarks}
              onChange={handleChange}
            />
          </div>

          <div className="card">
            <h2>Total: ₱{total}</h2>
          </div>

          <button className="primary-btn" type="submit">
            Save Billing
          </button>
        </form>
      </>
    );
}

export default CreateBilling;