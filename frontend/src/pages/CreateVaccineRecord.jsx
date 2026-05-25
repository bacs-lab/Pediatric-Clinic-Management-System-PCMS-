import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../utils/api";
import { notify } from "../utils/notify";

function CreateVaccineRecord({ embedded = false, onCancel, onSaved }) {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const [patients, setPatients] = useState([]);
  const [vaccines, setVaccines] = useState([]);

  const [form, setForm] = useState({
    patientId: "",
    patientName: "",
    inventoryItemId: "",
    vaccineName: "",
    vaccineDate: "",
    doseNumber: "1",
    nextDoseDate: "",
    status: "Completed",
    administeredBy: "",
    remarks: "",
  });

  useEffect(() => {
    fetch(apiUrl("/api/patients"), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setPatients(data));

    fetch(apiUrl("/api/inventory"), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const vaccineItems = data.filter(
          (item) => item.category === "Vaccine" && item.stockQuantity > 0
        );

        setVaccines(vaccineItems);
      });
  }, [token]);

  const handlePatientSelect = (e) => {
    const patient = patients.find((p) => p._id === e.target.value);

    if (!patient) return;

    setForm({
      ...form,
      patientId: patient._id,
      patientName: `${patient.firstName} ${patient.lastName}`,
    });
  };

  const handleVaccineSelect = (e) => {
    const selectedVaccine = vaccines.find(
      (vaccine) => vaccine._id === e.target.value
    );

    setForm({
      ...form,
      inventoryItemId: e.target.value,
      vaccineName: selectedVaccine?.itemName || "",
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
      notify("Please select a patient");
      return;
    }

    if (!form.inventoryItemId) {
      notify("Please select a vaccine");
      return;
    }

    if (!form.vaccineDate) {
      notify("Please select vaccine date");
      return;
    }

    const doseNumber = Number(form.doseNumber);

    if (!Number.isInteger(doseNumber) || doseNumber < 1) {
      notify("Please enter a valid dose number");
      return;
    }

    if (!form.administeredBy.trim()) {
      notify("Please enter administered by");
      return;
    }

    const payload = {
      ...form,
      doseNumber,
      nextDoseDate: form.nextDoseDate || null,
    };

    const res = await fetch(apiUrl("/api/vaccines"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      notify("Vaccine record saved and inventory deducted!");
      if (onSaved) onSaved();
      else navigate("/staff/vaccines");
    } else {
      const data = await res.json();
      notify(data.message || "Failed to save vaccine record");
    }
  };

  return (
    <>
        <h1 className={embedded ? "modal-title" : "page-title"}>Add Vaccine Record</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Patient</label>
            <select value={form.patientId} onChange={handlePatientSelect}>
              <option value="">Select Patient</option>
              {patients.map((patient) => (
                <option key={patient._id} value={patient._id}>
                  {patient.firstName} {patient.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Vaccine</label>
            <select
              name="inventoryItemId"
              value={form.inventoryItemId}
              onChange={handleVaccineSelect}
              required
            >
              <option value="">Select Vaccine</option>
              {vaccines.map((vaccine) => (
                <option key={vaccine._id} value={vaccine._id}>
                  {vaccine.itemName} — Stock: {vaccine.stockQuantity}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Vaccine Date</label>
            <input
              name="vaccineDate"
              type="date"
              value={form.vaccineDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Dose Number</label>
            <input
              name="doseNumber"
              type="number"
              min="1"
              step="1"
              value={form.doseNumber}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Next Dose Date</label>
            <input
              name="nextDoseDate"
              type="date"
              value={form.nextDoseDate}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select name="status" value={form.status} onChange={handleChange}>
              <option>Completed</option>
              <option>Upcoming</option>
              <option>Missed</option>
              <option>Rescheduled</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Administered By</label>
            <input
              name="administeredBy"
              placeholder="Administered By"
              value={form.administeredBy}
              onChange={handleChange}
            />
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

          <div className="modal-buttons">
            {embedded && (
              <button className="secondary-btn" type="button" onClick={onCancel}>
                Cancel
              </button>
            )}
            <button className="primary-btn" type="submit">
              Save Vaccine Record
            </button>
          </div>
        </form>
      </>
    );
}

export default CreateVaccineRecord;
