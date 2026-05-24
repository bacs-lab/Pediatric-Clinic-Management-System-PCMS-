import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import ConfirmDialog from "../components/ConfirmDialog";
import CreateAppointment from "./CreateAppointment";
import CreatePatient from "./CreatePatient";
import { apiUrl, authHeaders } from "../utils/api";
import { notify, notifySuccess } from "../utils/notify";

function ParentDashboard() {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appointmentOpen, setAppointmentOpen] = useState(false);
  const [childOpen, setChildOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [pendingCancelPatient, setPendingCancelPatient] = useState(null);
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

  const cancelPatientRequest = async () => {
    if (!pendingCancelPatient) return;

    try {
      const res = await fetch(apiUrl(`/api/patients/${pendingCancelPatient._id}/cancel`), {
        method: "DELETE",
        headers: authHeaders(),
      });

      if (res.ok) {
        notifySuccess("Child enrollment request cancelled.");
        loadPortal();
      } else {
        const data = await res.json().catch(() => ({}));
        notify(data.message || "Failed to cancel request.");
      }
    } catch {
      notify("Failed to cancel request.");
    } finally {
      setPendingCancelPatient(null);
    }
  };

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
            const isRejected = status === "Rejected";
            const isActive = status === "Active";
            const hasPendingUpdate = patient.pendingUpdateStatus === "Pending";

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
                  {hasPendingUpdate && (
                    <div className="child-pending-note">
                      <span className="ti ti-edit-circle" />
                      Detail update pending clinic review
                    </div>
                  )}
                </div>

                {!isActive ? (
                  <div className={`child-pending-note${isRejected ? " rejected" : ""}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={isPending ? "ti ti-clock-hour-4" : "ti ti-alert-circle"} />
                      {isPending
                        ? "Waiting for clinic approval"
                        : "Request was declined by the clinic"}
                    </div>
                    {isPending && (
                      <button 
                        className="danger-btn" 
                        style={{ marginTop: '12px', padding: '6px 12px', fontSize: '13px' }}
                        onClick={() => setPendingCancelPatient(patient)}
                      >
                        Cancel Request
                      </button>
                    )}
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

      {pendingCancelPatient && (
        <ConfirmDialog
          title="Cancel child enrollment request?"
          message={`Are you sure you want to cancel the enrollment request for ${pendingCancelPatient.firstName} ${pendingCancelPatient.lastName}?`}
          confirmLabel="Yes, Cancel Request"
          onCancel={() => setPendingCancelPatient(null)}
          onConfirm={cancelPatientRequest}
        />
      )}
    </div>
  );
}

export default ParentDashboard;
