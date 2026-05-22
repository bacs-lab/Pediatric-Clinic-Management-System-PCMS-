import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Reports() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/reports/summary", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setSummary(data))
      .catch((err) => console.log(err));
  }, []);

  if (!summary) return <p>Loading reports...</p>;

  return (
    <div className="layout">
      <div className="sidebar">
        <h2>PCMS Staff</h2>

        <ul>
          <li>
            <button onClick={() => navigate("/staff/dashboard")}>
              Dashboard
            </button>
          </li>

          <li>
            <button onClick={() => window.print()}>
              Print Report
            </button>
          </li>

          <li>
            <button onClick={() => navigate(-1)}>Back</button>
          </li>
        </ul>
      </div>

      <div className="main-content">
        <h1 className="page-title">Reports Summary</h1>

        <div className="dashboard-grid">
          <div className="card">
            <h3>Total Patients</h3>
            <h2>{summary.totalPatients}</h2>
          </div>

          <div className="card">
            <h3>Total Appointments</h3>
            <h2>{summary.totalAppointments}</h2>
          </div>

          <div className="card">
            <h3>Completed Appointments</h3>
            <h2>{summary.completedAppointments}</h2>
          </div>

          <div className="card">
            <h3>Total Revenue</h3>
            <h2>₱{summary.totalRevenue}</h2>
          </div>

          <div className="card">
            <h3>Vaccine Records</h3>
            <h2>{summary.vaccineRecords}</h2>
          </div>

          <div className="card">
            <h3>Low Stock Items</h3>
            <h2>{summary.lowStockItems.length}</h2>
          </div>
        </div>

        <div className="card">
          <h2>Low Stock Inventory Items</h2>

          {summary.lowStockItems.length === 0 ? (
            <p>No low stock items.</p>
          ) : (
            <ul>
              {summary.lowStockItems.map((item) => (
                <li key={item._id}>
                  {item.itemName} — Stock: {item.stockQuantity}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default Reports;