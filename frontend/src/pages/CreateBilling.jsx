import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiUrl } from "../utils/api";
import { notify } from "../utils/notify";

function CreateBilling({
  embedded = false,
  initialQueueItem,
  onCancel,
  onSaved,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const queueItem = initialQueueItem || location.state;
  const token = localStorage.getItem("token");
  const lockedQueuePatient = embedded && Boolean(queueItem?._id);

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
    if (lockedQueuePatient) return;

    fetch(apiUrl("/api/patients"), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setPatients(data);
        if (queueItem?.patientId && data.length > 0) {
          const match = data.find((p) => p._id === queueItem.patientId);
          if (match) {
            setForm((prev) => ({
              ...prev,
              patientId: match._id,
              patientName: `${match.firstName} ${match.lastName}`,
            }));
          }
        }
      })
      .catch((err) => console.log(err));
  }, [lockedQueuePatient, queueItem?.patientId, token]);

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
    const payload = lockedQueuePatient
      ? {
          ...form,
          queueId: queueItem._id,
          patientId: queueItem.patientId,
          patientName: queueItem.patientName,
        }
      : form;
    
    if (!payload.patientId || !payload.queueId) {
      notify("No patient/queue selected");
      return;
    }

if (
  Number(payload.consultationFee || 0) < 0 ||
  Number(payload.medicineFee || 0) < 0 ||
  Number(payload.vaccineFee || 0) < 0 ||
  Number(payload.otherFee || 0) < 0
) {
  notify("Fees cannot be negative");
  return;
}

if (!payload.paymentStatus) {
  notify("Please select payment status");
  return;
}

    const res = await fetch(apiUrl("/api/billings"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      notify("Billing saved! Queue completed.");
      if (onSaved) onSaved();
      else navigate("/staff/queue");
    } else {
      const data = await res.json().catch(() => ({}));
      notify(data.message || "Failed to save billing");
    }
  };

  return (
    <>
        <h1 className={embedded ? "modal-title" : "page-title"}>Create Billing</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Patient</label>
            {lockedQueuePatient ? (
              <input
                value={`#${queueItem.queueNumber} - ${queueItem.patientName}`}
                readOnly
              />
            ) : (
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
            )}
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

          <div className="modal-buttons">
            {embedded && (
              <button className="secondary-btn" type="button" onClick={onCancel}>
                Cancel
              </button>
            )}
            <button className="primary-btn" type="submit">
              Save Billing
            </button>
          </div>
        </form>
      </>
    );
}

export default CreateBilling;
