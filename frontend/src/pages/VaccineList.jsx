import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function VaccineList() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/api/vaccines", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setRecords(data));
  }, []);

  const filtered = records.filter((r) => {
    const matchesSearch =
      r.patientName?.toLowerCase().includes(search.toLowerCase()) ||
      r.vaccineName?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? r.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const statuses = [...new Set(records.map((r) => r.status))];

  return (
    <div className="dashboard-bg">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">PEDIATRIC IMMUNIZATION</p>
          <h1>Vaccine Records</h1>
          <span>Track administered vaccines, next doses, and vaccination status.</span>
        </div>

        <button
          className="primary-btn"
          onClick={() => navigate("/staff/create-vaccine")}
        >
          + Add Vaccine
        </button>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Vaccination History</h2>
          <span style={{ color: "#64748b" }}>
            {filtered.length} record(s)
          </span>
        </div>

        <div className="inventory-filters">
          <input
            type="text"
            className="search-input"
            placeholder="Search patient or vaccine..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="table-container flat">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Vaccine</th>
                <th>Date Given</th>
                <th>Next Dose</th>
                <th>Status</th>
                <th>Administered By</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6">No vaccine records found.</td>
                </tr>
              ) : (
                filtered.map((record) => (
                  <tr key={record._id}>
                    <td><strong>{record.patientName}</strong></td>
                    <td>{record.vaccineName}</td>
                    <td>{new Date(record.vaccineDate).toLocaleDateString()}</td>
                    <td>
                      {record.nextDoseDate
                        ? new Date(record.nextDoseDate).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td>
                      <span className={`status-badge ${record.status.toLowerCase()}`}>
                        {record.status}
                      </span>
                    </td>
                    <td>{record.administeredBy}</td>
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

export default VaccineList;