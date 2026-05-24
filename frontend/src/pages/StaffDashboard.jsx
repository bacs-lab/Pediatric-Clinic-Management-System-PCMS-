import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import CreatePatient from "./CreatePatient";
import { apiUrl, authHeaders } from "../utils/api";
import { FRONT_DESK_ROLES } from "../utils/roles";

const formatNumber = (num) => Number(num || 0).toLocaleString("en-US");

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString() : "N/A";

const EXPIRING_SOON_CUTOFF = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

function StaffDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const canCreatePatients = FRONT_DESK_ROLES.includes(user.role);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [queue, setQueue] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [addPatientOpen, setAddPatientOpen] = useState(false);
  const [reminders, setReminders] = useState({
    upcomingFollowUps: [],
    upcomingVaccines: [],
  });

  const [stats, setStats] = useState({
    totalPatients: 0,
    pendingAppointments: 0,
    currentQueue: 0,
    completedVisits: 0,
    totalRevenue: 0,
    lowStockItems: 0,
  });

  const loadDashboard = async () => {
    try {
      const [
        recordsRes,
        statsRes,
        remindersRes,
        appointmentsRes,
        queueRes,
        inventoryRes,
      ] = await Promise.all([
        fetch(apiUrl("/api/records"), { headers: authHeaders() }),
        fetch(apiUrl("/api/dashboard/stats"), { headers: authHeaders() }),
        fetch(apiUrl("/api/reminders"), { headers: authHeaders() }),
        fetch(apiUrl("/api/appointments"), { headers: authHeaders() }),
        fetch(apiUrl("/api/queue"), { headers: authHeaders() }),
        fetch(apiUrl("/api/inventory"), { headers: authHeaders() }),
      ]);

      const [
        recordsData,
        statsData,
        remindersData,
        appointmentsData,
        queueData,
        inventoryData,
      ] = await Promise.all([
        recordsRes.json(),
        statsRes.json(),
        remindersRes.json(),
        appointmentsRes.json(),
        queueRes.json(),
        inventoryRes.json(),
      ]);

      setRecords(Array.isArray(recordsData) ? recordsData : []);
      setStats(statsData || {});
      setReminders({
        upcomingFollowUps: remindersData.upcomingFollowUps || [],
        upcomingVaccines: remindersData.upcomingVaccines || [],
      });
      setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
      setQueue(Array.isArray(queueData) ? queueData : []);
      setInventory(Array.isArray(inventoryData) ? inventoryData : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const todayAppointments = useMemo(() => {
    const today = new Date().toDateString();
    return appointments.filter(
      (appointment) =>
        appointment.appointmentDate &&
        new Date(appointment.appointmentDate).toDateString() === today
    );
  }, [appointments]);

  const activeQueue = queue.filter(
    (item) => !["Completed", "Cancelled"].includes(item.status)
  );

  const stockAlerts = inventory
    .filter(
      (item) =>
        item.stockQuantity <= item.lowStockLevel ||
        (item.expirationDate &&
          new Date(item.expirationDate) < EXPIRING_SOON_CUTOFF)
    )
    .slice(0, 5);

  if (loading) return <LoadingState title="Preparing clinic dashboard..." />;

  return (
    <div className="dashboard-bg">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">PEDIATRIC CLINIC MANAGEMENT</p>
          <h1>Dashboard</h1>
          <span>Today's care queue, reminders, inventory alerts, and clinic activity.</span>
        </div>

        <div className="hero-actions">
          <button
            className="secondary-btn"
            onClick={() => navigate("/staff/appointments")}
          >
            <span className="ti ti-calendar" />
            Appointments
          </button>
          {canCreatePatients && (
            <button
              className="primary-btn"
              onClick={() => setAddPatientOpen(true)}
            >
              <span className="ti ti-user-plus" />
              Add Patient
            </button>
          )}
        </div>
      </div>

      <div className="stats-row">
        <div className="metric-card blue">
          <span className="ti ti-users" />
          <p>Total Patients</p>
          <h2>{stats.totalPatients}</h2>
        </div>

        <div className="metric-card cyan">
          <span className="ti ti-calendar-clock" />
          <p>Pending Appointments</p>
          <h2>{stats.pendingAppointments}</h2>
        </div>

        <div className="metric-card teal">
          <span className="ti ti-list-check" />
          <p>Current Queue</p>
          <h2>{stats.currentQueue}</h2>
        </div>

        <div className="metric-card green">
          <span className="ti ti-circle-check" />
          <p>Completed Visits</p>
          <h2>{stats.completedVisits}</h2>
        </div>

        <div className="metric-card yellow">
          <span className="ti ti-wallet" />
          <p>Total Revenue</p>
          <h2>PHP {formatNumber(stats.totalRevenue)}</h2>
        </div>

        <div className="metric-card red">
          <span className="ti ti-alert-triangle" />
          <p>Low Stock Items</p>
          <h2>{stats.lowStockItems}</h2>
        </div>
      </div>

      <div className="quick-actions-grid">
        <button onClick={() => navigate("/staff/queue")}>
          <span className="ti ti-stethoscope" />
          <strong>Run Queue</strong>
          <small>{activeQueue.length} active patient(s)</small>
        </button>
        <button onClick={() => navigate("/staff/vaccines")}>
          <span className="ti ti-vaccine" />
          <strong>Review Vaccines</strong>
          <small>{reminders.upcomingVaccines.length} upcoming dose(s)</small>
        </button>
        <button onClick={() => navigate("/staff/inventory")}>
          <span className="ti ti-package" />
          <strong>Stock Alerts</strong>
          <small>{stockAlerts.length} item(s) need attention</small>
        </button>
        <button onClick={() => navigate("/staff/billings")}>
          <span className="ti ti-receipt" />
          <strong>Billing Desk</strong>
          <small>Check unpaid and partial bills</small>
        </button>
      </div>

      <div className="dashboard-sections">
        <div className="panel">
          <div className="panel-header">
            <h2>Today's Appointments</h2>
            <span>{todayAppointments.length} scheduled</span>
          </div>
          {todayAppointments.length === 0 ? (
            <EmptyState
              icon="ti ti-calendar-off"
              title="No appointments today"
              message="Approved and pending appointments for today will appear here."
            />
          ) : (
            todayAppointments.slice(0, 5).map((item) => (
              <div className="mini-item" key={item._id}>
                <strong>{item.patientName}</strong>
                <span>{item.appointmentTime} · {item.status}</span>
              </div>
            ))
          )}
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Care Reminders</h2>
            <span>
              {reminders.upcomingFollowUps.length + reminders.upcomingVaccines.length} alert(s)
            </span>
          </div>
          {[...reminders.upcomingFollowUps, ...reminders.upcomingVaccines]
            .slice(0, 5)
            .map((item) => (
              <div className="mini-item" key={item._id}>
                <strong>{item.patientName}</strong>
                <span>
                  {item.vaccineName || "Follow-up"} ·{" "}
                  {formatDate(item.nextDoseDate || item.followUpDate)}
                </span>
              </div>
            ))}
          {reminders.upcomingFollowUps.length === 0 &&
            reminders.upcomingVaccines.length === 0 && (
              <EmptyState
                icon="ti ti-bell-off"
                title="No reminders"
                message="Follow-ups and upcoming vaccine doses will appear here."
              />
            )}
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="panel">
          <div className="panel-header">
            <h2>Active Queue</h2>
            <button className="secondary-btn" onClick={() => navigate("/staff/queue")}>
              View Queue
            </button>
          </div>
          {activeQueue.length === 0 ? (
            <EmptyState
              icon="ti ti-list"
              title="Queue is clear"
              message="Patients added from approved appointments will appear here."
            />
          ) : (
            activeQueue.slice(0, 5).map((item) => (
              <div className="mini-item" key={item._id}>
                <strong>#{item.queueNumber} {item.patientName}</strong>
                <span>{item.status}</span>
              </div>
            ))
          )}
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Recent Medical Records</h2>
            <button
              className="secondary-btn"
              onClick={() =>
                navigate("/staff/records", { state: { modal: "add-record" } })
              }
            >
              Add Record
            </button>
          </div>

          {records.length === 0 ? (
            <EmptyState
              icon="ti ti-notes-off"
              title="No medical records yet"
              message="New consultations and EMR entries will appear here."
            />
          ) : (
            <div className="table-container flat">
              <table>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Diagnosis</th>
                    <th>Doctor</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {records.slice(0, 6).map((record) => (
                    <tr key={record._id}>
                      <td>{record.patientName}</td>
                      <td>{record.diagnosis || "N/A"}</td>
                      <td>{record.doctorName || "N/A"}</td>
                      <td>
                        <button
                          className="secondary-btn"
                          onClick={() => navigate(`/staff/records/${record._id}`)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {addPatientOpen && (
        <div className="modal-overlay" onClick={() => setAddPatientOpen(false)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <CreatePatient
              embedded
              onCancel={() => setAddPatientOpen(false)}
              onSaved={() => {
                setAddPatientOpen(false);
                loadDashboard();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffDashboard;
