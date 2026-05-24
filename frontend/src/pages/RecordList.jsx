import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import { apiUrl, authHeaders } from "../utils/api";
import { exportCsv } from "../utils/exportCsv";
import CreateRecord from "./CreateRecord";
import EditRecord from "./EditRecord";
import Pagination from "../components/Pagination";
import { EMR_WRITE_ROLES } from "../utils/roles";

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString() : "N/A";

function RecordList() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const canWriteEmr = EMR_WRITE_ROLES.includes(user.role);
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState(() => location.state?.search || "");
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [prefillPatientId, setPrefillPatientId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const fetchRecords = () => {
    fetch(apiUrl("/api/records"), {
      headers: authHeaders(),
    })
      .then((res) => res.json())
      .then((data) => {
        const sorted = Array.isArray(data)
          ? [...data].sort(
              (a, b) =>
                new Date(b.visitDate || b.createdAt) -
                new Date(a.visitDate || a.createdAt)
            )
          : [];
        setRecords(sorted);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (location.state?.modal === "add-record" || location.state?.search) {
      const patientId = location.state?.patientId || "";
      const timer = window.setTimeout(() => {
        if (location.state?.search) setSearch(location.state.search);
        setPrefillPatientId(patientId);
        if (location.state?.modal === "add-record") setAddOpen(true);
      }, 0);
      window.history.replaceState({}, document.title);
      return () => window.clearTimeout(timer);
    }
  }, [location.state]);

  const filteredRecords = useMemo(() => {
    const term = search.toLowerCase();
    return records.filter((record) =>
      [
        record.patientName,
        record.chiefComplaint,
        record.diagnosis,
        record.treatment,
        record.doctorName,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [records, search]);

  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
  const currentRecords = filteredRecords.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  const openAddRecord = (patientId = "") => {
    setPrefillPatientId(patientId);
    setAddOpen(true);
  };

  const closeAddRecord = () => {
    setAddOpen(false);
    setPrefillPatientId("");
  };

  const exportRecords = () => {
    exportCsv("medical-records.csv", filteredRecords, [
      { label: "Visit Date", value: (record) => formatDate(record.visitDate || record.createdAt) },
      { label: "Patient", value: (record) => record.patientName },
      { label: "Chief Complaint", value: (record) => record.chiefComplaint || "" },
      { label: "Diagnosis", value: (record) => record.diagnosis || "" },
      { label: "Treatment", value: (record) => record.treatment || "" },
      { label: "Prescription", value: (record) => record.prescription || "" },
      { label: "Doctor", value: (record) => record.doctorName || "" },
      { label: "Follow Up", value: (record) => formatDate(record.followUpDate) },
    ]);
  };

  if (loading) return <LoadingState title="Loading medical records..." />;

  return (
    <div className="dashboard-bg">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">CLINICAL HISTORY</p>
          <h1>Medical Records</h1>
          <span>Search consultations, diagnoses, treatment notes, and follow-ups.</span>
        </div>

        {canWriteEmr && (
          <button className="primary-btn" onClick={() => openAddRecord()}>
            <span className="ti ti-notes-medical" />
            Add Record
          </button>
        )}
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Recent Medical Records</h2>
          <span>{filteredRecords.length} record(s)</span>
        </div>

        <div className="inventory-filters">
          <input
            type="text"
            className="search-input"
            placeholder="Search patient, diagnosis, doctor..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button className="secondary-btn" onClick={exportRecords}>
            <span className="ti ti-download" />
            Export CSV
          </button>
        </div>

        {filteredRecords.length === 0 ? (
          <EmptyState
            icon="ti ti-notes-off"
            title="No medical records found"
            message="Create a record after a consultation, assessment, or patient visit."
            actionLabel={canWriteEmr ? "Add Record" : undefined}
            onAction={canWriteEmr ? () => openAddRecord() : undefined}
          />
        ) : (
          <div className="table-container flat">
            <table>
              <thead>
                <tr>
                  <th>Visit Date</th>
                  <th>Patient</th>
                  <th>Chief Complaint</th>
                  <th>Diagnosis</th>
                  <th>Doctor</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {currentRecords.map((record) => (
                  <tr key={record._id}>
                    <td>{formatDate(record.visitDate || record.createdAt)}</td>
                    <td><strong>{record.patientName}</strong></td>
                    <td>{record.chiefComplaint || "N/A"}</td>
                    <td>{record.diagnosis || "N/A"}</td>
                    <td>{record.doctorName || "N/A"}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="secondary-btn"
                          onClick={() => navigate(`/staff/records/${record._id}`)}
                        >
                          View
                        </button>
                        {canWriteEmr && (
                          <button
                            className="secondary-btn"
                            onClick={() => setEditingRecordId(record._id)}
                          >
                            Edit
                          </button>
                        )}
                      </div>
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

      {addOpen && (
        <div className="modal-overlay" onClick={closeAddRecord}>
          <div
            className="modal-content modal-content-wide"
            onClick={(event) => event.stopPropagation()}
          >
            <CreateRecord
              embedded
              initialPatientId={prefillPatientId}
              onCancel={closeAddRecord}
              onSaved={() => {
                closeAddRecord();
                fetchRecords();
              }}
            />
          </div>
        </div>
      )}

      {editingRecordId && (
        <div className="modal-overlay" onClick={() => setEditingRecordId(null)}>
          <div
            className="modal-content modal-content-wide"
            onClick={(event) => event.stopPropagation()}
          >
            <EditRecord
              embedded
              recordId={editingRecordId}
              onCancel={() => setEditingRecordId(null)}
              onSaved={(updatedRecord) => {
                setRecords((current) =>
                  current.map((record) =>
                    record._id === updatedRecord._id ? updatedRecord : record
                  )
                );
                setEditingRecordId(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default RecordList;
