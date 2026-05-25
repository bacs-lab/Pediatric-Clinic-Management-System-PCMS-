import { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import CreateAppointment from "./CreateAppointment";
import ConfirmDialog from "../components/ConfirmDialog";
import Pagination from "../components/Pagination";
import { apiUrl, authHeaders } from "../utils/api";
import { notify, notifySuccess } from "../utils/notify";

function ParentAppointments() {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const userId = user.id || user._id || "";
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  const [addOpen, setAddOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [pendingCancel, setPendingCancel] = useState(null);

  useEffect(() => {
    if (!userId) return;

    fetch(apiUrl(`/api/appointments/guardian/${userId}`), {
      headers: authHeaders(),
    })
      .then((res) => res.json())
      .then((data) => setAppointments(Array.isArray(data) ? data : []))
      .catch((err) => console.log(err));
  }, [refreshKey, userId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    if (location.state?.modal === "request-appointment") {
      const timer = window.setTimeout(() => setAddOpen(true), 0);
      window.history.replaceState({}, document.title);
      return () => window.clearTimeout(timer);
    }
  }, [location.state]);

  const cancelAppointment = async () => {
    if (!pendingCancel) return;

    try {
      const res = await fetch(apiUrl(`/api/appointments/${pendingCancel._id}/cancel`), {
        method: "PUT",
        headers: authHeaders(),
      });

      if (res.ok) {
        notifySuccess("Appointment cancelled.");
        setRefreshKey((k) => k + 1);
      } else {
        const data = await res.json().catch(() => ({}));
        notify(data.message || "Failed to cancel appointment.");
      }
    } catch {
      notify("Failed to cancel appointment.");
    } finally {
      setPendingCancel(null);
    }
  };

  const filtered = useMemo(() => {
    const sorted = [...appointments].sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));
    
    return sorted.filter((a) => {
      const matchesSearch =
        a.patientName?.toLowerCase().includes(search.toLowerCase()) ||
        a.reason?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter ? a.status === statusFilter : true;
      return matchesSearch && matchesStatus;
    });
  }, [appointments, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / recordsPerPage);
  const currentRecords = filtered.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

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
                <th>Date Requested</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {currentRecords.length === 0 ? (
                <tr>
                  <td colSpan="7">No appointments found.</td>
                </tr>
              ) : (
                currentRecords.map((appointment) => (
                  <tr key={appointment._id}>
                    <td><strong>{appointment.patientName}</strong></td>
                    <td>{new Date(appointment.appointmentDate).toLocaleDateString()}</td>
                    <td>{appointment.appointmentTime}</td>
                    <td>{new Date(appointment.createdAt).toLocaleDateString()}</td>
                    <td>{appointment.reason}</td>
                    <td>
                      <span className={`status-badge ${appointment.status.toLowerCase()}`}>
                        {appointment.status}
                      </span>
                    </td>
                    <td>
                      {["Pending", "Approved", "Rescheduled"].includes(appointment.status) && (
                        <button
                          className="danger-btn"
                          style={{ padding: '6px 12px', fontSize: '13px' }}
                          onClick={() => setPendingCancel(appointment)}
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
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

      {pendingCancel && (
        <ConfirmDialog
          title="Cancel appointment?"
          message={`Are you sure you want to cancel the appointment for ${pendingCancel.patientName} on ${new Date(pendingCancel.appointmentDate).toLocaleDateString()} at ${pendingCancel.appointmentTime}?`}
          confirmLabel="Yes, Cancel"
          onCancel={() => setPendingCancel(null)}
          onConfirm={cancelAppointment}
        />
      )}
    </div>
  );
}

export default ParentAppointments;
