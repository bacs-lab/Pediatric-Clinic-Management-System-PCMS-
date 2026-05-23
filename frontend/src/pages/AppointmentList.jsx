import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function AppointmentList() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchAppointments = () => {
    fetch("http://localhost:5000/api/appointments", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setAppointments(data))
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const updateStatus = async (id, status) => {
    const res = await fetch(`http://localhost:5000/api/appointments/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ status }),
    });

    if (res.ok) fetchAppointments();
    else alert("Failed to update appointment");
  };

  const addToQueue = async (appointment) => {
    const res = await fetch("http://localhost:5000/api/queue", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        appointmentId: appointment._id,
        patientId: appointment.patientId,
        patientName: appointment.patientName,
      }),
    });

    if (res.ok) alert("Patient added to queue!");
    else {
      const data = await res.json();
      alert(data.message || "Failed to add patient to queue");
    }
  };

  const filtered = appointments.filter((a) => {
    const matchesSearch =
      a.patientName?.toLowerCase().includes(search.toLowerCase()) ||
      a.guardianName?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? a.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const statuses = [...new Set(appointments.map((a) => a.status))];

  return (
    <div className="dashboard-bg">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">CLINIC SCHEDULING</p>
          <h1>Appointments</h1>
          <span>Review, approve, cancel, and queue appointment requests.</span>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Appointment Requests</h2>
          <span style={{ color: "#64748b" }}>
            {filtered.length} request(s)
          </span>
        </div>

        <div className="inventory-filters">
          <input
            type="text"
            className="search-input"
            placeholder="Search patient or guardian..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="table-container flat">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Guardian</th>
                <th>Date</th>
                <th>Time</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7">No appointments found.</td>
                </tr>
              ) : (
                filtered.map((appointment) => (
                  <tr key={appointment._id}>
                    <td><strong>{appointment.patientName}</strong></td>
                    <td>{appointment.guardianName}</td>
                    <td>{new Date(appointment.appointmentDate).toLocaleDateString()}</td>
                    <td>{appointment.appointmentTime}</td>
                    <td>{appointment.reason}</td>
                    <td>
                      <span className={`status-badge ${appointment.status.toLowerCase()}`}>
                        {appointment.status}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="primary-btn"
                          onClick={() => updateStatus(appointment._id, "Approved")}
                        >
                          Approve
                        </button>

                        <button
                          className="danger-btn"
                          onClick={() => updateStatus(appointment._id, "Cancelled")}
                        >
                          Cancel
                        </button>

                        {appointment.status === "Approved" && (
                          <button
                            className="primary-btn"
                            onClick={() => addToQueue(appointment)}
                          >
                            Add to Queue
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AppointmentList;