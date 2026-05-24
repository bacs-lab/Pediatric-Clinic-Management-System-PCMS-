import { useEffect, useMemo, useState } from "react";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import Pagination from "../components/Pagination";
import { apiUrl, authHeaders } from "../utils/api";
import { exportCsv } from "../utils/exportCsv";

function BillingList() {
  const [billings, setBillings] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    fetch(apiUrl("/api/billings"), {
      headers: authHeaders(),
    })
      .then((res) => res.json())
      .then((data) => setBillings(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => {
      const sorted = [...billings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      return sorted.filter((billing) => {
        const matchesSearch = billing.patientName
          ?.toLowerCase()
          .includes(search.toLowerCase());
        const matchesStatus = statusFilter
          ? billing.paymentStatus === statusFilter
          : true;
        return matchesSearch && matchesStatus;
      });
    },
    [billings, search, statusFilter]
  );

  const totalPages = Math.ceil(filtered.length / recordsPerPage);
  const currentRecords = filtered.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  const paymentStatuses = [...new Set(billings.map((item) => item.paymentStatus))];

  const exportBilling = () => {
    exportCsv("billing-records.csv", filtered, [
      { label: "Patient", value: (item) => item.patientName },
      { label: "Consultation", value: (item) => item.consultationFee },
      { label: "Medicine", value: (item) => item.medicineFee },
      { label: "Vaccine", value: (item) => item.vaccineFee },
      { label: "Other", value: (item) => item.otherFee },
      { label: "Total", value: (item) => item.totalAmount },
      { label: "Status", value: (item) => item.paymentStatus },
    ]);
  };

  if (loading) return <LoadingState title="Loading billing records..." />;

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
          <span>{filtered.length} record(s)</span>
        </div>

        <div className="inventory-filters">
          <input
            type="text"
            className="search-input"
            placeholder="Search patient..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">All Statuses</option>
            {paymentStatuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <button className="secondary-btn" onClick={exportBilling}>
            <span className="ti ti-download" />
            Export CSV
          </button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon="ti ti-receipt-off"
            title="No billing records found"
            message="Billing records will appear after visits are completed."
          />
        ) : (
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
                {currentRecords.map((billing) => (
                  <tr key={billing._id}>
                    <td><strong>{billing.patientName}</strong></td>
                    <td>PHP {billing.consultationFee}</td>
                    <td>PHP {billing.medicineFee}</td>
                    <td>PHP {billing.vaccineFee}</td>
                    <td>PHP {billing.otherFee}</td>
                    <td><strong>PHP {billing.totalAmount}</strong></td>
                    <td>
                      <span className={`status-badge ${billing.paymentStatus.toLowerCase()}`}>
                        {billing.paymentStatus}
                      </span>
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
    </div>
  );
}

export default BillingList;
