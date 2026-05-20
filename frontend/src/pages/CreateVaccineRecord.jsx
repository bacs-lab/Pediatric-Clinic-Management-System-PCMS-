import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function CreateVaccineRecord() {
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
    nextDoseDate: "",
    status: "Completed",
    administeredBy: "",
    remarks: "",
  });

  useEffect(() => {
    fetch("http://localhost:5000/api/patients", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setPatients(data));

    fetch("http://localhost:5000/api/inventory", {
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
      alert("Please select a patient");
      return;
    }

    if (!form.inventoryItemId) {
      alert("Please select a vaccine from inventory");
      return;
    }

    const res = await fetch("http://localhost:5000/api/vaccines", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      alert("Vaccine record saved and inventory deducted!");
      navigate("/staff/vaccines");
    } else {
      const data = await res.json();
      alert(data.message || "Failed to save vaccine record");
    }
  };

  return (
    <div className="layout">
      <div className="sidebar">
        <h2>PCMS Staff</h2>

        <ul>
          <li>
            <button onClick={() => navigate("/staff/vaccines")}>
              Vaccines
            </button>
          </li>

          <li>
            <button onClick={() => navigate(-1)}>Back</button>
          </li>
        </ul>
      </div>

      <div className="main-content">
        <h1 className="page-title">Add Vaccine Record</h1>

        <form onSubmit={handleSubmit}>
          <select value={form.patientId} onChange={handlePatientSelect}>
            <option value="">Select Patient</option>

            {patients.map((patient) => (
              <option key={patient._id} value={patient._id}>
                {patient.firstName} {patient.lastName}
              </option>
            ))}
          </select>

          <input value={form.patientName} readOnly placeholder="Patient Name" />

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

          <input
            name="vaccineName"
            placeholder="Vaccine Name"
            value={form.vaccineName}
            readOnly
          />

          <input
            name="vaccineDate"
            type="date"
            value={form.vaccineDate}
            onChange={handleChange}
            required
          />

          <input
            name="nextDoseDate"
            type="date"
            value={form.nextDoseDate}
            onChange={handleChange}
          />

          <select name="status" value={form.status} onChange={handleChange}>
            <option>Completed</option>
            <option>Upcoming</option>
            <option>Missed</option>
            <option>Rescheduled</option>
          </select>

          <input
            name="administeredBy"
            placeholder="Administered By"
            value={form.administeredBy}
            onChange={handleChange}
          />

          <textarea
            name="remarks"
            placeholder="Remarks"
            value={form.remarks}
            onChange={handleChange}
          />

          <button className="primary-btn" type="submit">
            Save Vaccine Record
          </button>
        </form>
      </div>
    </div>
  );  
}

export default CreateVaccineRecord;