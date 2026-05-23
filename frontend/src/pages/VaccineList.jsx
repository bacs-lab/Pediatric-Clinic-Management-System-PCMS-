import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import CreateVaccineRecord from "./CreateVaccineRecord";
import { apiUrl, authHeaders } from "../utils/api";
import { exportCsv } from "../utils/exportCsv";

function VaccineList() {
  const location = useLocation();
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState(() => location.state?.search || "");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const fetchRecords = () => {
    fetch(apiUrl("/api/vaccines"), {
      headers: authHeaders(),
    })
      .then((res) => res.json())
      .then((data) => setRecords(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  useEffect(() => {
    if (location.state?.modal === "add-vaccine" || location.state?.search) {
      const timer = window.setTimeout(() => {
        if (location.state?.search) setSearch(location.state.search);
        if (location.state?.modal === "add-vaccine") setAddOpen(true);
      }, 0);
      window.history.replaceState({}, document.title);
      return () => window.clearTimeout(timer);
    }
  }, [location.state]);

  const filtered = useMemo(
    () =>
      records.filter((record) => {
        const matchesSearch =
          record.patientName?.toLowerCase().includes(search.toLowerCase()) ||
          record.vaccineName?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter ? record.status === statusFilter : true;
        return matchesSearch && matchesStatus;
      }),
    [records, search, statusFilter]
  );

  const statuses = [...new Set(records.map((record) => record.status))];

  const exportVaccines = () => {
    exportCsv("vaccine-records.csv", filtered, [
      { label: "Patient", value: (item) => item.patientName },
      { label: "Vaccine", value: (item) => item.vaccineName },
      {
        label: "Date Given",
        value: (item) => new Date(item.vaccineDate).toLocaleDateString(),
      },
      {
        label: "Next Dose",
        value: (item) =>
          item.nextDoseDate
            ? new Date(item.nextDoseDate).toLocaleDateString()
            : "N/A",
      },
      { label: "Status", value: (item) => item.status },
      { label: "Administered By", value: (item) => item.administeredBy || "" },
    ]);
  };

  if (loading) return <LoadingState title="Loading vaccine records..." />;

  return (
    <div className="dashboard-bg">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">PEDIATRIC IMMUNIZATION</p>
          <h1 className="page-heading">
            <i className="page-heading-icon ti ti-vaccine" aria-hidden="true" />
            Vaccine Records
          </h1>
          <span>Track administered vaccines, next doses, and vaccination status.</span>
        </div>

        <button
          className="primary-btn"
          onClick={() => setAddOpen(true)}
        >
          <span className="ti ti-vaccine" />
          Add Vaccine
        </button>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">
            <i className="ti ti-history" aria-hidden="true" />
            Vaccination History
          </h2>
          <span>{filtered.length} record(s)</span>
        </div>

        <div className="inventory-filters">
          <input
            type="text"
            className="search-input"
            placeholder="Search patient or vaccine..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">All Statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <button className="secondary-btn" onClick={exportVaccines}>
            <span className="ti ti-download" />
            Export CSV
          </button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon="ti ti-vaccine-off"
            title="No vaccine records found"
            message="New vaccine administrations will appear here."
          />
        ) : (
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
                {filtered.map((record) => (
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
                    <td>{record.administeredBy || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {addOpen && (
        <div className="modal-overlay" onClick={() => setAddOpen(false)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <CreateVaccineRecord
              embedded
              onCancel={() => setAddOpen(false)}
              onSaved={() => {
                setAddOpen(false);
                fetchRecords();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default VaccineList;
