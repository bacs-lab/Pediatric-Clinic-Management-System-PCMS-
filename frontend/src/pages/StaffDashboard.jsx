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
    fetch("http://localhost:5000/api/records")
      .then((res) => res.json())
      .then((data) => setRecords(data));

    fetch("http://localhost:5000/api/dashboard/stats")
      .then((res) => res.json())
      .then((data) => setStats(data));
  }, []);
  fetch("http://localhost:5000/api/reminders")
  .then((res) => res.json())
  .then((data) => setReminders(data));

  return (
    <div className="layout">
      <div className="sidebar">
        <h2>PCMS Staff</h2>

        <ul>
          <li><button onClick={() => navigate("/staff/dashboard")}>Dashboard</button></li>
          <li><button onClick={() => navigate("/staff/parents")}>Guardians</button></li>
          <li><button onClick={() => navigate("/staff/create-parent")}>Add Guardian</button></li>
          <li><button onClick={() => navigate("/staff/patients")}>Patients</button></li>
          <li><button onClick={() => navigate("/staff/create-patient")}>Add Patient</button></li>
          <li><button onClick={() => navigate("/staff/create-record")}>Add Record</button></li>
          <li><button onClick={() => navigate("/staff/appointments")}>Appointments</button></li>
          <li><button onClick={() => navigate("/staff/queue")}>Queue</button></li>
          <li><button onClick={() => navigate("/staff/billings")}>Billing Records</button></li>
          <li><button onClick={() => navigate("/staff/inventory")}>Inventory</button></li>
          <li><button onClick={() => navigate("/staff/vaccines")}>Vaccines</button></li>
          <li><button onClick={logout}>Logout</button></li>
        </ul>
      </div>

      <div className="main-content">
        <h1 className="page-title">Clinic Staff Dashboard</h1>

        <div className="dashboard-grid">
          <div className="card">
  <h2>Upcoming Follow-ups</h2>

  {reminders.upcomingFollowUps.length === 0 ? (
    <p>No upcoming follow-ups.</p>
  ) : (
    reminders.upcomingFollowUps.slice(0, 5).map((item) => (
      <div key={item._id}>
        <p>
          <strong>{item.patientName}</strong>
        </p>

        <p>
          Follow-up:
          {" "}
          {new Date(
            item.followUpDate
          ).toLocaleDateString()}
        </p>

        <hr />
      </div>
    ))
  )}
</div>

<div className="card">
  <h2>Upcoming Vaccines</h2>

  {reminders.upcomingVaccines.length === 0 ? (
    <p>No upcoming vaccines.</p>
  ) : (
    reminders.upcomingVaccines.slice(0, 5).map((item) => (
      <div key={item._id}>
        <p>
          <strong>{item.patientName}</strong>
        </p>

        <p>
          Vaccine:
          {" "}
          {item.vaccineName}
        </p>

        <p>
          Next Dose:
          {" "}
          {new Date(
            item.nextDoseDate
          ).toLocaleDateString()}
        </p>

        <hr />
      </div>
    ))
  )}
</div>
          <div className="card"><h3>Total Patients</h3><h2>{stats.totalPatients}</h2></div>
          <div className="card"><h3>Pending Appointments</h3><h2>{stats.pendingAppointments}</h2></div>
          <div className="card"><h3>Current Queue</h3><h2>{stats.currentQueue}</h2></div>
          <div className="card"><h3>Completed Visits</h3><h2>{stats.completedVisits}</h2></div>
          <div className="card"><h3>Total Revenue</h3><h2>₱{stats.totalRevenue}</h2></div>
          <div className="card"><h3>Low Stock Items</h3><h2>{stats.lowStockItems}</h2></div>
        </div>

        <div className="card">
          <h2>Recent Medical Records</h2>
        </div>

        <div className="table-container">
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
  );
}

export default StaffDashboard;