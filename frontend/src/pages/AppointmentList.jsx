import { useEffect, useMemo, useState } from "react";
import AppointmentReviewModal from "../components/AppointmentReviewModal";
import CreateAppointment from "./CreateAppointment";
import Pagination from "../components/Pagination";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import { apiUrl, authHeaders } from "../utils/api";
import { exportCsv } from "../utils/exportCsv";
import { notifyError, notifySuccess } from "../utils/notify";
import {
  APPOINTMENT_CREATION_ROLES,
  APPOINTMENT_EDIT_ROLES,
} from "../utils/roles";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "N/A";

function AppointmentList() {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const canCreateAppointment = APPOINTMENT_CREATION_ROLES.includes(user.role);
  const canEditAppointment = APPOINTMENT_EDIT_ROLES.includes(user.role);

  const [appointments, setAppointments] = useState([]);
  const [queueItems, setQueueItems] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [relativeDateFilter, setRelativeDateFilter] = useState(""); // "", "24h", "7d", "30d"
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [reviewBusy, setReviewBusy] = useState(false);

  const fetchAppointments = () => {
    Promise.all([
      fetch(apiUrl("/api/appointments"), {
        headers: authHeaders(),
      }).then((res) => res.json()),
      fetch(apiUrl("/api/queue"), {
        headers: authHeaders(),
      }).then((res) => res.json()),
    ])
      .then(([appointmentData, queueData]) => {
        setAppointments(Array.isArray(appointmentData) ? appointmentData : []);
        setQueueItems(Array.isArray(queueData) ? queueData : []);
      })
      .catch(() => notifyError("Failed to load appointments."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, dateFilter, relativeDateFilter]);

  const updateStatus = async (appointment, status) => {
    const res = await fetch(apiUrl(`/api/appointments/${appointment._id}`), {
      method: "PUT",
      headers: authHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({ status }),
    });

    if (res.ok) {
      notifySuccess(
        status === "Approved"
          ? "Appointment approved and moved to the waiting queue."
          : `Appointment marked ${status}.`
      );
      fetchAppointments();
      setSelectedAppointment(null);
    } else {
      const data = await res.json().catch(() => ({}));
      notifyError(data.message || "Failed to update appointment.");
    }
  };

  const reviewAppointment = async (action) => {
    if (!selectedAppointment) return;

    setReviewBusy(true);
    await updateStatus(
      selectedAppointment,
      action === "approve" ? "Approved" : "Cancelled"
    );
    setReviewBusy(false);
  };

  const filtered = useMemo(
    () => {
      const sorted = [...appointments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      return sorted.filter((appointment) => {
        const matchesSearch =
          appointment.patientName?.toLowerCase().includes(search.toLowerCase()) ||
          appointment.guardianName?.toLowerCase().includes(search.toLowerCase()) ||
          appointment.reason?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter ? appointment.status === statusFilter : true;
        const matchesDate = dateFilter
          ? appointment.appointmentDate?.slice(0, 10) === dateFilter
          : true;

        let matchesRelativeDate = true;
        if (relativeDateFilter) {
          const now = new Date();
          const appointmentDate = new Date(appointment.createdAt);
          const diffTime = Math.abs(now - appointmentDate);
          const diffDays = diffTime / (1000 * 60 * 60 * 24);

          if (relativeDateFilter === "24h") matchesRelativeDate = diffDays <= 1;
          else if (relativeDateFilter === "7d") matchesRelativeDate = diffDays <= 7;
          else if (relativeDateFilter === "30d") matchesRelativeDate = diffDays <= 30;
        }

        return matchesSearch && matchesStatus && matchesDate && matchesRelativeDate;
      });
    },
    [appointments, search, statusFilter, dateFilter, relativeDateFilter]
  );

  const totalPages = Math.ceil(filtered.length / recordsPerPage);
  const currentRecords = filtered.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  const statuses = [...new Set(appointments.map((item) => item.status))];
  const queueByAppointmentId = useMemo(
    () =>
      new Map(
        queueItems
          .filter((item) => item.appointmentId)
          .map((item) => [String(item.appointmentId), item])
      ),
    [queueItems]
  );

  const exportAppointments = () => {
    exportCsv("appointments.csv", filtered, [
      { label: "Patient", value: (item) => item.patientName },
      { label: "Guardian", value: (item) => item.guardianName },
      {
        label: "Requested On",
        value: (item) => formatDate(item.createdAt),
      },
      {
        label: "Date",
        value: (item) => formatDate(item.appointmentDate),
      },
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
          <span>Review requests, confirm schedules, and move approved patients straight into the waiting queue.</span>
        </div>

        {canCreateAppointment && (
          <button className="primary-btn" onClick={() => setCreateOpen(true)}>
            <span className="ti ti-calendar-plus" />
            New Appointment
          </button>
        )}
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
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select
            className="filter-select"
            value={relativeDateFilter}
            onChange={(event) => setRelativeDateFilter(event.target.value)}
          >
            <option value="">Any Date Range</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
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
            message="Try another filter or create a new clinic appointment."
            actionLabel={canCreateAppointment ? "New Appointment" : undefined}
            onAction={canCreateAppointment ? () => setCreateOpen(true) : undefined}
          />
        ) : (
          <div className="table-container flat">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Guardian</th>
                  <th>Requested On</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {currentRecords.map((appointment) => (
                  <tr key={appointment._id}>
                    <td>
                      <strong>{appointment.patientName}</strong>
                    </td>
                    <td>{appointment.guardianName}</td>
                    <td>{formatDate(appointment.createdAt)}</td>
                    <td>{formatDate(appointment.appointmentDate)}</td>
                    <td>{appointment.appointmentTime}</td>
                    <td>{appointment.reason}</td>
                    <td>
                      <span className={`status-badge ${appointment.status.toLowerCase()}`}>
                        {appointment.status}
                      </span>
                      {appointment.status !== "Cancelled" &&
                      queueByAppointmentId.get(String(appointment._id)) ? (
                        <small className="table-meta-text">
                          Queue: {queueByAppointmentId.get(String(appointment._id)).status}
                        </small>
                      ) : null}
                    </td>
                    <td>
                      <div className="table-actions">
                        {canEditAppointment && (
                          <button
                            className="secondary-btn"
                            onClick={() => setEditingAppointment(appointment)}
                          >
                            Edit
                          </button>
                        )}

                        {!["Cancelled", "Completed"].includes(appointment.status) && (
                          <button
                            className="primary-btn"
                            onClick={() => setSelectedAppointment(appointment)}
                          >
                            Review
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

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {createOpen && (
        <div className="modal-overlay" onClick={() => setCreateOpen(false)}>
          <div
            className="modal-content modal-content-wide"
            onClick={(event) => event.stopPropagation()}
          >
            <CreateAppointment
              embedded
              onCancel={() => setCreateOpen(false)}
              onSaved={() => {
                setCreateOpen(false);
                fetchAppointments();
              }}
            />
          </div>
        </div>
      )}

      {editingAppointment && (
        <div className="modal-overlay" onClick={() => setEditingAppointment(null)}>
          <div
            className="modal-content modal-content-wide"
            onClick={(event) => event.stopPropagation()}
          >
            <CreateAppointment
              embedded
              appointment={editingAppointment}
              onCancel={() => setEditingAppointment(null)}
              onSaved={() => {
                setEditingAppointment(null);
                fetchAppointments();
              }}
            />
          </div>
        </div>
      )}

      {selectedAppointment && (
        <AppointmentReviewModal
          appointment={selectedAppointment}
          queueItem={queueByAppointmentId.get(String(selectedAppointment._id)) || null}
          busy={reviewBusy}
          onApprove={() => reviewAppointment("approve")}
          onCancelRequest={() => reviewAppointment("cancel")}
          onClose={() => {
            if (!reviewBusy) setSelectedAppointment(null);
          }}
        />
      )}
    </div>
  );
}

export default AppointmentList;
