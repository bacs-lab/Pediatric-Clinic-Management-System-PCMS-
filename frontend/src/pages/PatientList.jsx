import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import CreatePatient from "./CreatePatient";
import { authFetch } from "../utils/authFetch";
import { exportCsv } from "../utils/exportCsv";

function PatientList() {
  const location = useLocation();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState(() => location.state?.search || "");
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const navigate = useNavigate();

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
    if (location.state?.modal === "add-patient" || location.state?.search) {
      const timer = window.setTimeout(() => {
        if (location.state?.search) setSearch(location.state.search);
        if (location.state?.modal === "add-patient") setAddOpen(true);
      }, 0);
      window.history.replaceState({}, document.title);
      return () => window.clearTimeout(timer);
    }
  }, [location.state]);

  const filteredPatients = patients.filter((patient) =>
    `${patient.firstName} ${patient.lastName}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const exportPatients = () => {
    exportCsv("patients.csv", filteredPatients, [
      { label: "Child Name", value: (patient) => `${patient.firstName} ${patient.lastName}` },
      { label: "Gender", value: (patient) => patient.gender },
      { label: "Guardian", value: (patient) => patient.guardianName },
      { label: "Contact", value: (patient) => patient.contactNumber || "" },
      { label: "Blood Type", value: (patient) => patient.bloodType || "" },
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
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredPatients.map((patient) => (
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
                      <div className="table-actions">
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
                      </div>
                    </td>
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
