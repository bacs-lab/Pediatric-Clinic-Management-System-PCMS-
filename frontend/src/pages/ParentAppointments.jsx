import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import CreateAppointment from "./CreateAppointment";
import { apiUrl } from "../utils/api";

function ParentAppointments() {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const userId = user.id || user._id || "";
  const token = localStorage.getItem("token");
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!userId) return;

    fetch(apiUrl(`/api/appointments/guardian/${userId}`), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setAppointments(data))
      .catch((err) => console.log(err));
  }, [refreshKey, token, userId]);

  useEffect(() => {
    if (location.state?.modal === "request-appointment") {
      const timer = window.setTimeout(() => setAddOpen(true), 0);
      window.history.replaceState({}, document.title);
      return () => window.clearTimeout(timer);
    }
  }, [location.state]);

  const filtered = appointments.filter((a) => {
    const matchesSearch =
      a.patientName?.toLowerCase().includes(search.toLowerCase()) ||
      a.reason?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? a.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const statuses = [...new Set(appointments.map((a) => a.status))];

  return (
    <div className="dashboard-bg">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">PARENT APPOINTMENTS</p>
          <h1>My Appointments</h1>
          <span>Track appointment requests and clinic approval status.</span>
        </div>

        <button
          className="primary-btn"
          onClick={() => setAddOpen(true)}
        >
          <span className="ti ti-calendar-plus" />
          Request Appointment
        </button>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Appointment Schedule</h2>
          <span style={{ color: "#64748b" }}>
            {filtered.length} appointment(s)
          </span>
        </div>

        <div className="inventory-filters">
          <input
            type="text"
            className="search-input"
            placeholder="Search patient or reason..."
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
                <th>Date</th>
                <th>Time</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="5">No appointments found.</td>
                </tr>
              ) : (
                filtered.map((appointment) => (
                  <tr key={appointment._id}>
                    <td><strong>{appointment.patientName}</strong></td>
                    <td>{new Date(appointment.appointmentDate).toLocaleDateString()}</td>
                    <td>{appointment.appointmentTime}</td>
                    <td>{appointment.reason}</td>
                    <td>
                      <span className={`status-badge ${appointment.status.toLowerCase()}`}>
                        {appointment.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {addOpen && (
        <div className="modal-overlay" onClick={() => setAddOpen(false)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <CreateAppointment
              embedded
              onCancel={() => setAddOpen(false)}
              onSaved={() => {
                setAddOpen(false);
                setRefreshKey((current) => current + 1);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ParentAppointments;
