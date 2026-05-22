import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Topbar from "../components/Topbar";

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
        <h2>KIDS FIRST</h2>

        <ul>
          <li><button onClick={() => navigate("/staff/dashboard")}>Dashboard</button></li>
          <li><button onClick={() => window.print()}>Print Report</button></li>
          <li><button onClick={() => navigate(-1)}>Back</button></li>
        </ul>
      </div>

      <div className="main-content dashboard-bg">
        <Topbar />
        <div className="dashboard-hero">
          <div>
            <p className="eyebrow">CLINIC PERFORMANCE</p>
            <h1>Reports Summary</h1>
            <span>Overview of patients, appointments, revenue, vaccines, and inventory alerts.</span>
          </div>

          <button className="primary-btn" onClick={() => window.print()}>
            Print Report
          </button>
        </div>

        <div className="stats-row">
          <div className="metric-card blue"><p>Total Patients</p><h2>{summary.totalPatients}</h2></div>
          <div className="metric-card cyan"><p>Total Appointments</p><h2>{summary.totalAppointments}</h2></div>
          <div className="metric-card teal"><p>Completed Appointments</p><h2>{summary.completedAppointments}</h2></div>
          <div className="metric-card yellow"><p>Total Revenue</p><h2>₱{summary.totalRevenue}</h2></div>
          <div className="metric-card green"><p>Vaccine Records</p><h2>{summary.vaccineRecords}</h2></div>
          <div className="metric-card red"><p>Low Stock Items</p><h2>{summary.lowStockItems.length}</h2></div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Low Stock Inventory Items</h2>
            <span style={{ color: "#64748b" }}>
              {summary.lowStockItems.length} item(s)
            </span>
          </div>

          {summary.lowStockItems.length === 0 ? (
            <p>No low stock items.</p>
          ) : (
            <div className="table-container flat">
              <table>
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Category</th>
                    <th>Current Stock</th>
                    <th>Low Stock Level</th>
                  </tr>
                </thead>

                <tbody>
                  {summary.lowStockItems.map((item) => (
                    <tr key={item._id}>
                      <td><strong>{item.itemName}</strong></td>
                      <td>{item.category}</td>
                      <td>{item.stockQuantity}</td>
                      <td>{item.lowStockLevel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Reports;