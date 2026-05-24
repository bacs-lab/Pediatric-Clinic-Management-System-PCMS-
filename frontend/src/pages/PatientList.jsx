import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import CreatePatient from "./CreatePatient";
import { authFetch } from "../utils/authFetch";
import { apiUrl, authHeaders } from "../utils/api";
import { exportCsv } from "../utils/exportCsv";
import { notify } from "../utils/notify";
import { PATIENT_APPROVAL_ROLES } from "../utils/roles";

function PatientList() {
  const location = useLocation();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState(() => location.state?.search || "");
  const [statusFilter, setStatusFilter] = useState(
    () => location.state?.statusFilter || ""
  );
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const canApprovePatients = PATIENT_APPROVAL_ROLES.includes(user.role);

  const fetchPatients = () => {
    authFetch("/api/patients")
      .then((res) => res.json())
      .then((data) => setPatients(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (
      location.state?.modal === "add-patient" ||
      location.state?.search ||
      location.state?.statusFilter
    ) {
      const timer = window.setTimeout(() => {
        if (location.state?.search) setSearch(location.state.search);
        if (location.state?.statusFilter) {
          setStatusFilter(location.state.statusFilter);
        }
        if (location.state?.modal === "add-patient") setAddOpen(true);
      }, 0);
      window.history.replaceState({}, document.title);
      return () => window.clearTimeout(timer);
    }
  }, [location.state]);

  const filteredPatients = patients.filter((patient) => {
    const status = patient.status || "Active";
    const searchText = [
      patient.firstName,
      patient.lastName,
      patient.guardianName,
      patient.contactNumber,
      patient.relationshipToChild,
      patient.emergencyContact,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return (
      searchText.includes(search.toLowerCase()) &&
      (!statusFilter || status === statusFilter)
    );
  });

  const approvePatient = async (patient) => {
    const res = await fetch(apiUrl(`/api/patients/${patient._id}/approve`), {
      method: "PUT",
      headers: authHeaders(),
    });
    const data = await res.json();

    if (!res.ok) {
      notify(data.message || "Failed to approve patient request");
      return;
    }

    setPatients((items) =>
      items.map((item) => (item._id === patient._id ? data : item))
    );
    notify("Patient request approved");
  };

  const exportPatients = () => {
    exportCsv("patients.csv", filteredPatients, [
      { label: "Child Name", value: (patient) => `${patient.firstName} ${patient.lastName}` },
      { label: "Gender", value: (patient) => patient.gender },
      { label: "Guardian", value: (patient) => patient.guardianName },
      { label: "Relationship", value: (patient) => patient.relationshipToChild || "" },
      { label: "Emergency Contact", value: (patient) => patient.emergencyContact || "" },
      { label: "Contact", value: (patient) => patient.contactNumber || "" },
      { label: "Blood Type", value: (patient) => patient.bloodType || "" },
      { label: "Status", value: (patient) => patient.status || "Active" },
    ]);
  };

  if (loading) return <LoadingState title="Loading child patient records..." />;

  return (
    <div className="dashboard-bg">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">PATIENT MANAGEMENT</p>
          <h1>Patient List</h1>
          <span>View, search, and manage child patient records.</span>
        </div>

        <button
          className="primary-btn"
          onClick={() => setAddOpen(true)}
        >
          <span className="ti ti-user-plus" />
          Add Patient
        </button>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Registered Patients</h2>
          <span>{filteredPatients.length} patient(s)</span>
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
            <option value="">All statuses</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
          </select>
          <button className="secondary-btn" onClick={exportPatients}>
            <span className="ti ti-download" />
            Export CSV
          </button>
        </div>

        {filteredPatients.length === 0 ? (
          <EmptyState
            icon="ti ti-users-off"
            title="No patients found"
            message="Try another search or add a new child patient."
            actionLabel="Add Patient"
            onAction={() => setAddOpen(true)}
          />
        ) : (
          <div className="table-container flat">
            <table>
              <thead>
                <tr>
                  <th>Child Name</th>
                  <th>Gender</th>
                  <th>Guardian</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredPatients.map((patient) => {
                  const status = patient.status || "Active";
                  const isPending = status === "Pending";

                  return (
                    <tr key={patient._id}>
                      <td>
                        <strong>
                          {patient.firstName} {patient.lastName}
                        </strong>
                      </td>
                      <td>{patient.gender}</td>
                      <td>{patient.guardianName}</td>
                      <td>{patient.contactNumber || "N/A"}</td>
                      <td>
                        <span className={`status-badge ${status.toLowerCase()}`}>
                          {status}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          {isPending ? (
                            canApprovePatients ? (
                              <button
                                className="primary-btn"
                                onClick={() => approvePatient(patient)}
                              >
                                Accept Request
                              </button>
                            ) : (
                              <span className="status-badge pending">
                                Pending review
                              </span>
                            )
                          ) : (
                            <>
                              <button
                                className="secondary-btn"
                                onClick={() => navigate(`/staff/patients/${patient._id}`)}
                              >
                                Profile
                              </button>
                              <button
                                className="primary-btn"
                                onClick={() =>
                                  navigate("/staff/records", {
                                    state: {
                                      modal: "add-record",
                                      patientId: patient._id,
                                    },
                                  })
                                }
                              >
                                Add EMR
                              </button>
                            </>
                          )}
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
            <CreatePatient
              embedded
              onCancel={() => setAddOpen(false)}
              onSaved={() => {
                setAddOpen(false);
                fetchPatients();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientList;
