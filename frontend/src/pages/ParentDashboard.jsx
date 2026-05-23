import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import CreateAppointment from "./CreateAppointment";
import { apiUrl, authHeaders } from "../utils/api";

function ParentDashboard() {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appointmentOpen, setAppointmentOpen] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user")) || {};

  useEffect(() => {
    if (!user.id) return;

    const loadPortal = () => Promise.all([
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
    loadPortal();
  }, [user.id]);

  if (loading) return <LoadingState title="Loading parent portal..." />;

  return (
    <div className="dashboard-bg">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">PARENT PORTAL</p>
          <h1>Welcome, {user.name || "Parent"}</h1>
          <span>View your child's clinic records, appointments, vaccines, and billing.</span>
        </div>

        <button
          className="primary-btn"
          onClick={() => setAppointmentOpen(true)}
        >
          <span className="ti ti-calendar-plus" />
          Request Appointment
        </button>
      </div>

      <div className="parent-summary">
        <div className="summary-pill">
          <span className="ti ti-users" />
          <strong>{patients.length}</strong>
          <small>Child record(s)</small>
        </div>
        <div className="summary-pill">
          <span className="ti ti-calendar-check" />
          <strong>
            {appointments.filter((item) => item.status !== "Completed").length}
          </strong>
          <small>Active appointment(s)</small>
        </div>
        <div className="summary-pill">
          <span className="ti ti-bell-heart" />
          <strong>
            {appointments.filter((item) => item.status === "Pending").length}
          </strong>
          <small>Pending request(s)</small>
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
            message="Please contact the clinic staff if a child profile should be connected to your account."
          />
        ) : (
          patients.map((patient) => (
            <div className="child-card" key={patient._id}>
              <div>
                <h2>
                  {patient.firstName} {patient.lastName}
                </h2>
                <p><strong>Gender:</strong> {patient.gender}</p>
                <p><strong>Blood Type:</strong> {patient.bloodType || "N/A"}</p>
                <p><strong>Allergies:</strong> {patient.allergies || "None"}</p>
              </div>

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
            </div>
          ))
        )}
      </div>

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
