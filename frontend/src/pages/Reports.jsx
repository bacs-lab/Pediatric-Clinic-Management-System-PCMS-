import { useEffect, useState } from "react";
import LoadingState from "../components/LoadingState";
import { apiUrl, authHeaders } from "../utils/api";
import { exportCsv } from "../utils/exportCsv";

function Reports() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetch(apiUrl("/api/reports/summary"), {
      headers: authHeaders(),
    })
      .then((res) => res.json())
      .then((data) => setSummary(data));
  }, []);

  if (!summary) return <LoadingState title="Loading reports..." />;

  const exportLowStock = () => {
    exportCsv("low-stock-items.csv", summary.lowStockItems || [], [
      { label: "Item Name", value: (item) => item.itemName },
      { label: "Category", value: (item) => item.category },
      { label: "Current Stock", value: (item) => item.stockQuantity },
      { label: "Low Stock Level", value: (item) => item.lowStockLevel },
    ]);
  };

  return (
    <div className="dashboard-bg">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">CLINIC PERFORMANCE</p>
          <h1 className="page-heading">
            <i className="page-heading-icon ti ti-report-analytics" aria-hidden="true" />
            Reports Summary
          </h1>
          <span>Overview of patients, appointments, revenue, vaccines, and inventory alerts.</span>
        </div>

        <div className="hero-actions">
          <button className="secondary-btn" onClick={exportLowStock}>
            <span className="ti ti-download" />
            Export Low Stock
          </button>
          <button className="primary-btn" onClick={() => window.print()}>
            <span className="ti ti-printer" />
            Print Report
          </button>
        </div>
      </div>

      <div className="stats-row">
        <div className="metric-card blue"><span className="ti ti-users" /><p>Total Patients</p><h2>{summary.totalPatients}</h2></div>
        <div className="metric-card cyan"><span className="ti ti-calendar" /><p>Total Appointments</p><h2>{summary.totalAppointments}</h2></div>
        <div className="metric-card teal"><span className="ti ti-circle-check" /><p>Completed Appointments</p><h2>{summary.completedAppointments}</h2></div>
        <div className="metric-card yellow"><span className="ti ti-wallet" /><p>Total Revenue</p><h2>PHP {summary.totalRevenue}</h2></div>
        <div className="metric-card green"><span className="ti ti-vaccine" /><p>Vaccine Records</p><h2>{summary.vaccineRecords}</h2></div>
        <div className="metric-card red"><span className="ti ti-alert-triangle" /><p>Low Stock Items</p><h2>{summary.lowStockItems.length}</h2></div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">
            <i className="ti ti-alert-triangle" aria-hidden="true" />
            Low Stock Inventory Items
          </h2>
          <span>{summary.lowStockItems.length} item(s)</span>
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
  );
}

export default Reports;
