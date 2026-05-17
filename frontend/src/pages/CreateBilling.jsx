import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function CreateBilling() {
  const navigate = useNavigate();
  const location = useLocation();
  const queueItem = location.state;

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

    const res = await fetch("http://localhost:5000/api/billings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      alert("Billing saved! Queue completed.");
      navigate("/staff/queue");
    } else {
      alert("Failed to save billing");
    }
  };

  return (
    <div className="layout">
      <div className="sidebar">
        <h2>PCMS Staff</h2>
        <ul>
          <li><button onClick={() => navigate("/staff/queue")}>Queue</button></li>
          <li><button onClick={() => navigate(-1)}>Back</button></li>
        </ul>
      </div>

      <div className="main-content">
        <h1 className="page-title">Create Billing</h1>

        <form onSubmit={handleSubmit}>
          <input value={form.patientName} readOnly />

          <input
            name="consultationFee"
            type="number"
            placeholder="Consultation Fee"
            value={form.consultationFee}
            onChange={handleChange}
          />

          <input
            name="medicineFee"
            type="number"
            placeholder="Medicine Fee"
            value={form.medicineFee}
            onChange={handleChange}
          />

          <input
            name="vaccineFee"
            type="number"
            placeholder="Vaccine Fee"
            value={form.vaccineFee}
            onChange={handleChange}
          />

          <input
            name="otherFee"
            type="number"
            placeholder="Other Fee"
            value={form.otherFee}
            onChange={handleChange}
          />

          <select
            name="paymentStatus"
            value={form.paymentStatus}
            onChange={handleChange}
          >
            <option>Unpaid</option>
            <option>Partial</option>
            <option>Paid</option>
          </select>

          <textarea
            name="remarks"
            placeholder="Remarks"
            value={form.remarks}
            onChange={handleChange}
          />

          <div className="card">
            <h2>Total: ₱{total}</h2>
          </div>

          <button className="primary-btn" type="submit">
            Save Billing
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateBilling;