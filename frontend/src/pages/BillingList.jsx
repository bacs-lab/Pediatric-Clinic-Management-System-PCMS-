import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function BillingList() {
  const navigate = useNavigate();
  const [billings, setBillings] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/api/billings", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setBillings(data))
      .catch((err) => console.log(err));
  }, []);

  const filtered = billings.filter((b) => {
    const matchesSearch = b.patientName
      ?.toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus = statusFilter
      ? b.paymentStatus === statusFilter
      : true;
    return matchesSearch && matchesStatus;
  });

  const paymentStatuses = [...new Set(billings.map((b) => b.paymentStatus))];

  return (
    <div className="dashboard-bg">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">FINANCIAL MANAGEMENT</p>
          <h1>Billing Records</h1>
          <span>Monitor clinic billing transactions and payment status.</span>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Billing Transactions</h2>
          <span style={{ color: "#64748b" }}>
            {filtered.length} record(s)
          </span>
        </div>

        <div className="inventory-filters">
          <input
            type="text"
            className="search-input"
            placeholder="Search patient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
                <th>Patient</th>
                <th>Consultation</th>
                <th>Medicine</th>
                <th>Vaccine</th>
                <th>Other</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7">No billing records found.</td>
                </tr>
              ) : (
                filtered.map((billing) => (
                  <tr key={billing._id}>
                    <td><strong>{billing.patientName}</strong></td>
                    <td>₱{billing.consultationFee}</td>
                    <td>₱{billing.medicineFee}</td>
                    <td>₱{billing.vaccineFee}</td>
                    <td>₱{billing.otherFee}</td>
                    <td><strong>₱{billing.totalAmount}</strong></td>
                    <td>
                      <span className={`status-badge ${billing.paymentStatus.toLowerCase()}`}>
                        {billing.paymentStatus}
                      </span>
                    </td>
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

export default BillingList;