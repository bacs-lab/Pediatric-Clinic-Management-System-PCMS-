import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiUrl } from "../utils/api";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "N/A";

const getDoseLabel = (doseNumber) =>
  doseNumber ? `Dose ${doseNumber}` : "Dose 1";

function ParentVaccines() {
  const { patientId } = useParams();
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch(apiUrl(`/api/vaccines/patient/${patientId}`), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setRecords(Array.isArray(data) ? data : []))
      .catch(() => setRecords([]));
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
                <th>Dose</th>
                <th>Date Given</th>
                <th>Next Dose</th>
                <th>Status</th>
                <th>Remarks</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6">No vaccination records found.</td>
                </tr>
              ) : (
                filtered.map((record) => {
                  const status = record.status || "Completed";

                  return (
                    <tr key={record._id}>
                      <td><strong>{record.vaccineName}</strong></td>
                      <td>{getDoseLabel(record.doseNumber)}</td>
                      <td>{formatDate(record.vaccineDate)}</td>
                      <td>{formatDate(record.nextDoseDate)}</td>
                      <td>
                        <span className={`status-badge ${status.toLowerCase()}`}>
                          {status}
                        </span>
                      </td>
                      <td>{record.remarks || "N/A"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ParentVaccines;
