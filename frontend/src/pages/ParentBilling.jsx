import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function ParentBilling() {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const [billings, setBillings] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetch(`http://localhost:5000/api/billings/patient/${patientId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setBillings(data))
      .catch((err) => console.log(err));
  }, [patientId]);

  const filtered = billings.filter((b) =>
    statusFilter ? b.paymentStatus === statusFilter : true
  );

  const paymentStatuses = [...new Set(billings.map((b) => b.paymentStatus))];

  return (
    <div className="dashboard-bg">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">PARENT BILLING PORTAL</p>
          <h1>Billing History</h1>
          <span>View clinic payment records and billing status.</span>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Billing Records</h2>
          <span style={{ color: "#64748b" }}>
            {filtered.length} record(s)
          </span>
        </div>

        <div className="inventory-filters">
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            {paymentStatuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="table-container flat">
          <table>
            <thead>
              <tr>
                <th>Total</th>
                <th>Status</th>
                <th>Remarks</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="4">No billing records found.</td>
                </tr>
              ) : (
                filtered.map((billing) => (
                  <tr key={billing._id}>
                    <td><strong>₱{billing.totalAmount}</strong></td>
                    <td>
                      <span className={`status-badge ${billing.paymentStatus.toLowerCase()}`}>
                        {billing.paymentStatus}
                      </span>
                    </td>
                    <td>{billing.remarks || "N/A"}</td>
                    <td>{new Date(billing.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ParentBilling;