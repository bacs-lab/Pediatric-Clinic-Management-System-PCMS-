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
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user")) || {};

  const loadPortal = useCallback(() => {
    if (!user.id) {
      return Promise.resolve().then(() => setLoading(false));
    }

    return Promise.all([
      fetch(apiUrl(`/api/patients/guardian/${user.id}`), {
        headers: authHeaders(),
      }).then((res) => res.json()),
      fetch(apiUrl(`/api/appointments/guardian/${user.id}`), {
        headers: authHeaders(),
      }).then((res) => res.json()),
    ])
      .then(([patientData, appointmentData]) => {
        setPatients(Array.isArray(patientData) ? patientData : []);
        setAppointments(Array.isArray(appointmentData) ? appointmentData : []);
      })
      .finally(() => setLoading(false));
  }, [user.id]);

  useEffect(() => {
    loadPortal();
  }, [loadPortal]);

  const activeChildren = patients.filter(
    (patient) => (patient.status || "Active") === "Active"
  );
  const pendingChildren = patients.filter(
    (patient) => patient.status === "Pending"
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
          <span className="ti ti-user-question" />
          <strong>{pendingChildren.length}</strong>
          <small>Pending child request(s)</small>
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
            message="Add a child request and the clinic team will review it before it becomes active."
            actionLabel="Add Child"
            onAction={() => setChildOpen(true)}
          />
        ) : (
          patients.map((patient) => {
            const status = patient.status || "Active";
            const isPending = status === "Pending";

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
                  <p><strong>Emergency Contact:</strong> {patient.emergencyContact || "N/A"}</p>
                  <p><strong>Blood Type:</strong> {patient.bloodType || "N/A"}</p>
                  <p><strong>Allergies:</strong> {patient.allergies || "None"}</p>
                </div>

                {isPending ? (
                  <div className="child-pending-note">
                    <span className="ti ti-clock-hour-4" />
                    Waiting for clinic approval
                  </div>
                ) : (
                  <div className="child-actions">
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

      {appointmentOpen && (
        <div className="modal-overlay" onClick={() => setAppointmentOpen(false)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <CreateAppointment
              embedded
              onCancel={() => setAppointmentOpen(false)}
              onSaved={() => {
                setAppointmentOpen(false);
                fetch(apiUrl(`/api/appointments/guardian/${user.id}`), {
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
