import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import CreateVaccineRecord from "./CreateVaccineRecord";
import { apiUrl, authHeaders } from "../utils/api";
import { exportCsv } from "../utils/exportCsv";
import { notifyError, notifySuccess } from "../utils/notify";

const VACCINE_STATUSES = ["Completed", "Upcoming", "Missed", "Rescheduled"];

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "N/A";

const toDateInput = (value) =>
  value ? new Date(value).toISOString().split("T")[0] : "";

const getDoseLabel = (doseNumber) =>
  doseNumber ? `Dose ${doseNumber}` : "Dose 1";

function VaccineList() {
  const location = useLocation();
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState(() => location.state?.search || "");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editBusy, setEditBusy] = useState(false);
  const [editForm, setEditForm] = useState({
    doseNumber: "1",
    nextDoseDate: "",
    status: "Completed",
    remarks: "",
  });

  const fetchRecords = () => {
    fetch(apiUrl("/api/vaccines"), {
      headers: authHeaders(),
    })
      .then((res) => res.json())
      .then((data) => setRecords(Array.isArray(data) ? data : []))
      .catch(() => notifyError("Failed to load vaccine records."))
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

  const statuses = [...new Set(records.map((record) => record.status).filter(Boolean))];

  const openEdit = (record) => {
    setEditingRecord(record);
    setEditForm({
      doseNumber: String(record.doseNumber || 1),
      nextDoseDate: toDateInput(record.nextDoseDate),
      status: record.status || "Completed",
      remarks: record.remarks || "",
    });
  };

  const handleEditChange = (event) => {
    setEditForm({
      ...editForm,
      [event.target.name]: event.target.value,
    });
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();

    if (!editingRecord) return;

    const doseNumber = Number(editForm.doseNumber);

    if (!Number.isInteger(doseNumber) || doseNumber < 1) {
      notifyError("Please enter a valid dose number.");
      return;
    }

    setEditBusy(true);

    try {
      const res = await fetch(apiUrl(`/api/vaccines/${editingRecord._id}`), {
        method: "PUT",
        headers: authHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          doseNumber,
          nextDoseDate: editForm.nextDoseDate || null,
          status: editForm.status,
          remarks: editForm.remarks,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        notifyError(data.message || "Failed to update vaccine status.");
        return;
      }

      setRecords((currentRecords) =>
        currentRecords.map((record) =>
          record._id === editingRecord._id ? data : record
        )
      );
      setEditingRecord(null);
      notifySuccess("Vaccine status updated.");
    } catch {
      notifyError("Network error. Is the backend server running?");
    } finally {
      setEditBusy(false);
    }
  };

  const exportVaccines = () => {
    exportCsv("vaccine-records.csv", filtered, [
      { label: "Patient", value: (item) => item.patientName },
      { label: "Vaccine", value: (item) => item.vaccineName },
      { label: "Dose", value: (item) => item.doseNumber || 1 },
      {
        label: "Date Given",
        value: (item) => formatDate(item.vaccineDate),
      },
      {
        label: "Next Dose",
        value: (item) => formatDate(item.nextDoseDate),
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

        <button className="primary-btn" onClick={() => setAddOpen(true)}>
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
              <option key={status} value={status}>
                {status}
              </option>
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
                  <th>Dose</th>
                  <th>Date Given</th>
                  <th>Next Dose</th>
                  <th>Status</th>
                  <th>Administered By</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((record) => {
                  const status = record.status || "Completed";

                  return (
                    <tr key={record._id}>
                      <td>
                        <strong>{record.patientName}</strong>
                      </td>
                      <td>{record.vaccineName}</td>
                      <td>{getDoseLabel(record.doseNumber)}</td>
                      <td>{formatDate(record.vaccineDate)}</td>
                      <td>{formatDate(record.nextDoseDate)}</td>
                      <td>
                        <span className={`status-badge ${status.toLowerCase()}`}>
                          {status}
                        </span>
                      </td>
                      <td>{record.administeredBy || "N/A"}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="secondary-btn"
                            onClick={() => openEdit(record)}
                          >
                            <span className="ti ti-edit" />
                            Edit Status
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {editingRecord && (
        <div className="modal-overlay" onClick={() => setEditingRecord(null)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Vaccine Status</h2>
              <button
                className="modal-close"
                type="button"
                onClick={() => setEditingRecord(null)}
                aria-label="Close edit vaccine status form"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="form-info-card">
                <div className="info-item">
                  <span className="info-label">Patient</span>
                  <span className="info-value">{editingRecord.patientName}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Vaccine</span>
                  <span className="info-value">{editingRecord.vaccineName}</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Dose Number</label>
                <input
                  name="doseNumber"
                  type="number"
                  min="1"
                  step="1"
                  value={editForm.doseNumber}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Next Dose Date</label>
                <input
                  name="nextDoseDate"
                  type="date"
                  value={editForm.nextDoseDate}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  name="status"
                  value={editForm.status}
                  onChange={handleEditChange}
                >
                  {VACCINE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Remarks</label>
                <textarea
                  name="remarks"
                  placeholder="Remarks"
                  value={editForm.remarks}
                  onChange={handleEditChange}
                />
              </div>

              <div className="modal-buttons">
                <button
                  className="secondary-btn"
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  disabled={editBusy}
                >
                  Cancel
                </button>
                <button className="primary-btn" type="submit" disabled={editBusy}>
                  {editBusy ? "Saving..." : "Save Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default VaccineList;
