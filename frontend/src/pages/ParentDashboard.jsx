import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import CreateAppointment from "./CreateAppointment";
import CreatePatient from "./CreatePatient";
import { apiUrl, authHeaders } from "../utils/api";

function ParentDashboard() {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appointmentOpen, setAppointmentOpen] = useState(false);
  const [childOpen, setChildOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user")) || {};
  const userId = user.id || user._id || "";

  const loadPortal = useCallback(() => {
    if (!userId) {
      return Promise.resolve().then(() => setLoading(false));
    }

    return Promise.all([
      fetch(apiUrl(`/api/patients/guardian/${userId}`), {
        headers: authHeaders(),
      }).then((res) => res.json()),
      fetch(apiUrl(`/api/appointments/guardian/${userId}`), {
        headers: authHeaders(),
      }).then((res) => res.json()),
    ])
      .then(([patientData, appointmentData]) => {
        setPatients(Array.isArray(patientData) ? patientData : []);
        setAppointments(Array.isArray(appointmentData) ? appointmentData : []);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    loadPortal();
  }, [loadPortal]);

  const activeChildren = patients.filter(
    (patient) => (patient.status || "Active") === "Active"
  );
  const activeAppointments = appointments.filter(
    (item) => item.status !== "Completed"
  );

  if (loading) return <LoadingState title="Loading parent portal..." />;

  return (
    <div className="dashboard-bg">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">PARENT PORTAL</p>
          <h1>Welcome, {user.name || "Parent"}</h1>
          <span>View your child's clinic records, appointments, vaccines, and billing.</span>
        </div>

        <div className="hero-actions">
          <button
            className="secondary-btn"
            onClick={() => setChildOpen(true)}
          >
            <span className="ti ti-user-plus" />
            Add Child
          </button>
          <button
            className="primary-btn"
            onClick={() => setAppointmentOpen(true)}
          >
            <span className="ti ti-calendar-plus" />
            Request Appointment
          </button>
        </div>
      </div>

      <div className="parent-summary">
        <div className="summary-pill">
          <span className="ti ti-users" />
          <strong>{activeChildren.length}</strong>
          <small>Active child record(s)</small>
        </div>
        <div className="summary-pill">
          <span className="ti ti-heart-handshake" />
          <strong>{patients.length}</strong>
          <small>Total child record(s)</small>
        </div>
        <div className="summary-pill">
          <span className="ti ti-calendar-check" />
          <strong>{activeAppointments.length}</strong>
          <small>Active appointment(s)</small>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>My Children</h2>
          <span>{patients.length} child record(s)</span>
        </div>

        {patients.length === 0 ? (
          <EmptyState
            icon="ti ti-baby-carriage"
            title="No child records found"
            message="Add a child profile to start managing records, appointments, billing, and vaccines."
            actionLabel="Add Child"
            onAction={() => setChildOpen(true)}
          />
        ) : (
          patients.map((patient) => {
            const status = patient.status || "Active";
            const isRejected = status === "Rejected";
            const isActive = status === "Active";

            return (
              <div className="child-card" key={patient._id}>
                <div>
                  <div className="child-title-row">
                    <h2>
                      {patient.firstName} {patient.lastName}
                    </h2>
                    <span className={`status-badge ${status.toLowerCase()}`}>
                      {status}
                    </span>
                  </div>
                  <p><strong>Gender:</strong> {patient.gender}</p>
                  <p><strong>Relationship:</strong> {patient.relationshipToChild || "N/A"}</p>
                  <p><strong>Contact Number:</strong> {patient.contactNumber || "N/A"}</p>
                  <p><strong>Blood Type:</strong> {patient.bloodType || "N/A"}</p>
                  <p><strong>Allergies:</strong> {patient.allergies || "None"}</p>
                </div>

                {!isActive ? (
                  <div className={`child-pending-note${isRejected ? " rejected" : ""}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="ti ti-alert-circle" />
                      Child record is not active
                    </div>
                  </div>
                ) : (
                  <div className="child-actions">
                    <button
                      className="secondary-btn"
                      onClick={() => setEditingPatient(patient)}
                    >
                      Edit Details
                    </button>
                    <button
                      className="secondary-btn"
                      onClick={() => navigate(`/parent/patient/${patient._id}/records`)}
                    >
                      Records
                    </button>

                    <button
                      className="primary-btn"
                      onClick={() => navigate(`/parent/patient/${patient._id}/billing`)}
                    >
                      Billing
                    </button>

                    <button
                      className="primary-btn"
                      onClick={() => navigate(`/parent/patient/${patient._id}/vaccines`)}
                    >
                      Vaccines
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {childOpen && (
        <div className="modal-overlay" onClick={() => setChildOpen(false)}>
          <div className="modal-content modal-content-wide" onClick={(event) => event.stopPropagation()}>
            <CreatePatient
              key="parent-add-child"
              embedded
              parentMode
              onCancel={() => setChildOpen(false)}
              onSaved={() => {
                setChildOpen(false);
                loadPortal();
              }}
            />
          </div>
        </div>
      )}

      {editingPatient && (
        <div className="modal-overlay" onClick={() => setEditingPatient(null)}>
          <div className="modal-content modal-content-wide" onClick={(event) => event.stopPropagation()}>
            <CreatePatient
              key={`parent-edit-${editingPatient._id}-${editingPatient.updatedAt || ""}`}
              embedded
              parentMode
              editMode
              patient={editingPatient}
              onCancel={() => setEditingPatient(null)}
              onSaved={() => {
                setEditingPatient(null);
                loadPortal();
              }}
            />
          </div>
        </div>
      )}

      {appointmentOpen && (
        <div className="modal-overlay" onClick={() => setAppointmentOpen(false)}>
          <div className="modal-content modal-content-wide" onClick={(event) => event.stopPropagation()}>
            <CreateAppointment
              embedded
              onCancel={() => setAppointmentOpen(false)}
              onSaved={() => {
                setAppointmentOpen(false);
                fetch(apiUrl(`/api/appointments/guardian/${userId}`), {
                  headers: authHeaders(),
                })
                  .then((res) => res.json())
                  .then((data) =>
                    setAppointments(Array.isArray(data) ? data : [])
                  );
              }}
            />
          </div>
        </div>
      )}

    </div>
  );
}

export default ParentDashboard;
