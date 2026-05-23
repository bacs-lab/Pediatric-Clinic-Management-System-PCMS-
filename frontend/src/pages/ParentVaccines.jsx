import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function ParentVaccines() {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch(`http://localhost:5000/api/vaccines/patient/${patientId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setRecords(data));
  }, [patientId, token]);

  const filtered = records.filter((r) => {
    const matchesSearch = r.vaccineName
      ?.toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus = statusFilter ? r.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const statuses = [...new Set(records.map((r) => r.status))];

  return (
    <div className="dashboard-bg">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">CHILD IMMUNIZATION</p>
          <h1>Vaccination History</h1>
          <span>View vaccine records, next dose dates, and vaccine status.</span>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Vaccine Records</h2>
          <span style={{ color: "#64748b" }}>
            {filtered.length} record(s)
          </span>
        </div>

        <div className="inventory-filters">
          <input
            type="text"
            className="search-input"
            placeholder="Search vaccine..."
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
                <th>Vaccine</th>
                <th>Date Given</th>
                <th>Next Dose</th>
                <th>Status</th>
                <th>Remarks</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="5">No vaccination records found.</td>
                </tr>
              ) : (
                filtered.map((record) => (
                  <tr key={record._id}>
                    <td><strong>{record.vaccineName}</strong></td>
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
                    <td>{record.remarks || "N/A"}</td>
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

export default ParentVaccines;