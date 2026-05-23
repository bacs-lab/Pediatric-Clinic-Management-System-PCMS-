import { useEffect, useMemo, useState } from "react";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import { apiUrl, authHeaders } from "../utils/api";
import { exportCsv } from "../utils/exportCsv";
import { notifyError, notifySuccess } from "../utils/notify";

function AppointmentList() {
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchAppointments = () => {
    fetch(apiUrl("/api/appointments"), {
      headers: authHeaders(),
    })
      .then((res) => res.json())
      .then((data) => setAppointments(Array.isArray(data) ? data : []))
      .catch(() => notifyError("Failed to load appointments."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const updateStatus = async (id, status) => {
    const res = await fetch(apiUrl(`/api/appointments/${id}`), {
      method: "PUT",
      headers: authHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({ status }),
    });

    if (res.ok) {
      notifySuccess(`Appointment marked ${status}.`);
      fetchAppointments();
    } else {
      notifyError("Failed to update appointment.");
    }
  };

  const addToQueue = async (appointment) => {
    const res = await fetch(apiUrl("/api/queue"), {
      method: "POST",
      headers: authHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({
        appointmentId: appointment._id,
        patientId: appointment.patientId,
        patientName: appointment.patientName,
      }),
    });

    if (res.ok) {
      notifySuccess("Patient added to queue.");
    } else {
      const data = await res.json().catch(() => ({}));
      notifyError(data.message || "Failed to add patient to queue.");
    }
  };

  const filtered = useMemo(
    () =>
      appointments.filter((appointment) => {
        const matchesSearch =
          appointment.patientName?.toLowerCase().includes(search.toLowerCase()) ||
          appointment.guardianName?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter ? appointment.status === statusFilter : true;
        const matchesDate = dateFilter
          ? appointment.appointmentDate?.slice(0, 10) === dateFilter
          : true;
        return matchesSearch && matchesStatus && matchesDate;
      }),
    [appointments, search, statusFilter, dateFilter]
  );

  const statuses = [...new Set(appointments.map((item) => item.status))];

  const exportAppointments = () => {
    exportCsv("appointments.csv", filtered, [
      { label: "Patient", value: (item) => item.patientName },
      { label: "Guardian", value: (item) => item.guardianName },
      { label: "Date", value: (item) => new Date(item.appointmentDate).toLocaleDateString() },
      { label: "Time", value: (item) => item.appointmentTime },
      { label: "Reason", value: (item) => item.reason },
      { label: "Status", value: (item) => item.status },
    ]);
  };

  if (loading) return <LoadingState title="Loading appointment requests..." />;

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
          <span>{filtered.length} request(s)</span>
        </div>

        <div className="inventory-filters">
          <input
            type="text"
            className="search-input"
            placeholder="Search patient or guardian..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">All Statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <input
            type="date"
            className="filter-select date-filter"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
          />
          <button className="secondary-btn" onClick={exportAppointments}>
            <span className="ti ti-download" />
            Export CSV
          </button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon="ti ti-calendar-off"
            title="No appointments found"
            message="Try another filter or wait for parent appointment requests."
          />
        ) : (
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
                {filtered.map((appointment) => (
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
                        {appointment.status !== "Approved" && (
                          <button
                            className="primary-btn"
                            onClick={() => updateStatus(appointment._id, "Approved")}
                          >
                            Approve
                          </button>
                        )}

                        {appointment.status !== "Cancelled" && (
                          <button
                            className="danger-btn"
                            onClick={() => updateStatus(appointment._id, "Cancelled")}
                          >
                            Cancel
                          </button>
                        )}

                        {appointment.status === "Approved" && (
                          <button
                            className="secondary-btn"
                            onClick={() => addToQueue(appointment)}
                          >
                            Add to Queue
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AppointmentList;
