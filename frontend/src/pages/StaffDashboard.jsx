import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function StaffDashboard() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
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

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch("http://localhost:5000/api/records", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setRecords(data));

    fetch("http://localhost:5000/api/dashboard/stats", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setStats(data));

    fetch("http://localhost:5000/api/reminders", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setReminders(data));
  }, []);

  return (
    <div className="layout">
      <div className="sidebar">
        <h2>KIDS FIRST</h2>

        <ul>
          <li><button onClick={() => navigate("/staff/dashboard")}>Dashboard</button></li>
          <li><button onClick={() => navigate("/staff/patients")}>Patients</button></li>
          <li><button onClick={() => navigate("/staff/parents")}>Guardians</button></li>
          <li><button onClick={() => navigate("/staff/appointments")}>Appointments</button></li>
          <li><button onClick={() => navigate("/staff/queue")}>Queue</button></li>
          <li><button onClick={() => navigate("/staff/billings")}>Billing</button></li>
          <li><button onClick={() => navigate("/staff/inventory")}>Inventory</button></li>
          <li><button onClick={() => navigate("/staff/vaccines")}>Vaccines</button></li>
          <li><button onClick={() => navigate("/staff/reports")}>Reports</button></li>
          <li><button onClick={logout}>Logout</button></li>
        </ul>
      </div>

      <div className="main-content dashboard-bg">
        <div className="dashboard-hero">
          <div>
            <p className="eyebrow">PEDIATRIC CLINIC MANAGEMENT</p>
            <h1>Dashboard</h1>
            <span>Welcome to Kids First Clinic system overview.</span>
          </div>

          <button
            className="primary-btn"
            onClick={() => navigate("/staff/create-patient")}
          >
            + Add Patient
          </button>
        </div>

        <div className="stats-row">
          <div className="metric-card blue">
            <p>Total Patients</p>
            <h2>{stats.totalPatients}</h2>
          </div>

          <div className="metric-card cyan">
            <p>Pending Appointments</p>
            <h2>{stats.pendingAppointments}</h2>
          </div>

          <div className="metric-card teal">
            <p>Current Queue</p>
            <h2>{stats.currentQueue}</h2>
          </div>

          <div className="metric-card green">
            <p>Completed Visits</p>
            <h2>{stats.completedVisits}</h2>
          </div>

          <div className="metric-card yellow">
            <p>Total Revenue</p>
            <h2>₱{stats.totalRevenue}</h2>
          </div>

          <div className="metric-card red">
            <p>Low Stock Items</p>
            <h2>{stats.lowStockItems}</h2>
          </div>
        </div>

        <div className="dashboard-sections">
          <div className="panel">
            <h2>Upcoming Follow-ups</h2>

            {reminders.upcomingFollowUps.length === 0 ? (
              <p>No upcoming follow-ups.</p>
            ) : (
              reminders.upcomingFollowUps.slice(0, 5).map((item) => (
                <div className="mini-item" key={item._id}>
                  <strong>{item.patientName}</strong>
                  <span>
                    {new Date(item.followUpDate).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="panel">
            <h2>Upcoming Vaccines</h2>

            {reminders.upcomingVaccines.length === 0 ? (
              <p>No upcoming vaccines.</p>
            ) : (
              reminders.upcomingVaccines.slice(0, 5).map((item) => (
                <div className="mini-item" key={item._id}>
                  <strong>{item.patientName}</strong>
                  <span>
                    {item.vaccineName} —{" "}
                    {new Date(item.nextDoseDate).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Recent Medical Records</h2>
            <button
              className="primary-btn"
              onClick={() => navigate("/staff/create-record")}
            >
              + Add Record
            </button>
          </div>

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
                {records.map((record) => (
                  <tr key={record._id}>
                    <td>{record.patientName}</td>
                    <td>{record.diagnosis}</td>
                    <td>{record.doctorName}</td>
                    <td>
                      <button
                        className="primary-btn"
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
        </div>
      </div>
    </div>
  );
}

export default StaffDashboard;