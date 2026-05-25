import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import CreatePatient from "./CreatePatient";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import { apiUrl, authHeaders } from "../utils/api";
import { exportCsv } from "../utils/exportCsv";
import { notify } from "../utils/notify";
import { EMR_WRITE_ROLES, ROLES } from "../utils/roles";

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString() : "N/A";

const calculateAge = (birthDate) => {
  if (!birthDate) return "N/A";
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthOffset = today.getMonth() - birth.getMonth();
  if (
    monthOffset < 0 ||
    (monthOffset === 0 && today.getDate() < birth.getDate())
  ) {
    age -= 1;
  }
  return `${age} yrs`;
};

function PatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const canWriteEmr = EMR_WRITE_ROLES.includes(user.role);
  const canDeletePatient = user.role === ROLES.ADMIN;
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [vaccines, setVaccines] = useState([]);
  const [billings, setBillings] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    const run = async () => {
      setLoading(true);
      try {
        const patientRes = await fetch(apiUrl(`/api/patients/${id}`), {
          headers: authHeaders(),
        });
        const patientData = await patientRes.json();

        const [recordRes, vaccineRes, billingRes, appointmentRes] = await Promise.all([
          fetch(apiUrl(`/api/records/patient/${id}`), {
            headers: authHeaders(),
          }),
          fetch(apiUrl(`/api/vaccines/patient/${id}`), {
            headers: authHeaders(),
          }),
          fetch(apiUrl(`/api/billings/patient/${id}`), {
            headers: authHeaders(),
          }),
          patientData?.guardianId
            ? fetch(apiUrl(`/api/appointments/guardian/${patientData.guardianId}`), {
                headers: authHeaders(),
              })
            : Promise.resolve(null),
        ]);

        const [recordData, vaccineData, billingData, appointmentData] = await Promise.all([
          recordRes.json(),
          vaccineRes.json(),
          billingRes.json(),
          appointmentRes ? appointmentRes.json() : Promise.resolve([]),
        ]);

        if (!active) return;

        setPatient(patientData);
        setRecords(Array.isArray(recordData) ? recordData : []);
        setVaccines(Array.isArray(vaccineData) ? vaccineData : []);
        setBillings(Array.isArray(billingData) ? billingData : []);
        setAppointments(
          Array.isArray(appointmentData)
            ? appointmentData.filter(
                (appointment) => String(appointment.patientId) === String(id)
              )
            : []
        );
      } catch {
        if (active) setPatient(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [id, refreshKey]);

  const totalBalance = useMemo(
    () =>
      billings
        .filter((billing) => billing.paymentStatus !== "Paid")
        .reduce((sum, billing) => sum + Number(billing.totalAmount || 0), 0),
    [billings]
  );

  const timeline = useMemo(() => {
    const visitItems = records.map((record) => ({
      id: `record-${record._id}`,
      type: "Visit",
      title: record.diagnosis || record.chiefComplaint || "Consultation",
      date: record.visitDate || record.createdAt,
      note: record.treatment || record.prescription || record.consultationNotes,
    }));

    const vaccineItems = vaccines.map((vaccine) => ({
      id: `vaccine-${vaccine._id}`,
      type: "Vaccine",
      title: vaccine.vaccineName,
      date: vaccine.vaccineDate,
      note: vaccine.status,
    }));

    return [...visitItems, ...vaccineItems].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
  }, [records, vaccines]);

  const exportProfile = () => {
    if (!patient) return;

    exportCsv(`${patient.firstName}-${patient.lastName}-timeline.csv`, timeline, [
      { label: "Type", value: (item) => item.type },
      { label: "Title", value: (item) => item.title },
      { label: "Date", value: (item) => formatDate(item.date) },
      { label: "Notes", value: (item) => item.note || "" },
    ]);
  };

  const handleDeletePatient = async () => {
    const res = await fetch(apiUrl(`/api/patients/${id}`), {
      method: "DELETE",
      headers: authHeaders(),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      notify(data.message || "Failed to delete patient");
      return;
    }

    notify("Patient record deleted.");
    navigate("/staff/patients");
  };

  if (loading) return <LoadingState title="Building patient profile..." />;

  if (!patient) {
    return (
      <EmptyState
        icon="ti ti-user-question"
        title="Patient not found"
        message="The selected patient record could not be loaded."
        actionLabel="Back to Patients"
        onAction={() => navigate("/staff/patients")}
      />
    );
  }

  const patientStatus = patient.status || "Active";
  const isPending = patientStatus === "Pending";

  return (
    <div className="dashboard-bg">
      <div className="dashboard-hero patient-hero">
        <div>
          <p className="eyebrow">PATIENT PROFILE</p>
          <h1>
            {patient.firstName} {patient.lastName}
          </h1>
          <span>
            {calculateAge(patient.birthDate)} | {patient.gender} | Guardian:{" "}
            {patient.guardianName}
          </span>
          <div className="hero-status-row">
            <span className={`status-badge ${patientStatus.toLowerCase()}`}>
              {patientStatus}
            </span>
          </div>
        </div>

        <div className="hero-actions">
          <button
            className="secondary-btn"
            onClick={() => navigate("/staff/patients")}
          >
            <span className="ti ti-arrow-left" />
            Back
          </button>
          <button className="secondary-btn" onClick={exportProfile}>
            <span className="ti ti-download" />
            Export Timeline
          </button>
          {!isPending && (
            <button className="secondary-btn" onClick={() => setEditOpen(true)}>
              <span className="ti ti-edit" />
              Edit Details
            </button>
          )}
          {canDeletePatient && (
            <button className="danger-btn" onClick={() => setDeleteOpen(true)}>
              <span className="ti ti-trash" />
              Delete Patient
            </button>
          )}
          {!isPending && canWriteEmr && (
            <button
              className="primary-btn"
              onClick={() =>
                navigate("/staff/records", {
                  state: { modal: "add-record", patientId: patient._id },
                })
              }
            >
              <span className="ti ti-notes-medical" />
              Add EMR
            </button>
          )}
        </div>
      </div>

      <div className="profile-grid">
        <section className="profile-card">
          <span className="profile-kicker">Child Details</span>
          <h2>Clinical Snapshot</h2>
          <div className="profile-facts">
            <p>
              <strong>Parent / Guardian</strong>
              <span>{patient.guardianName || "N/A"}</span>
            </p>
            <p>
              <strong>Birth Date</strong>
              <span>{formatDate(patient.birthDate)}</span>
            </p>
            <p>
              <strong>Blood Type</strong>
              <span>{patient.bloodType || "N/A"}</span>
            </p>
            <p>
              <strong>Allergies</strong>
              <span>{patient.allergies || "None recorded"}</span>
            </p>
            <p>
              <strong>Relationship</strong>
              <span>{patient.relationshipToChild || "N/A"}</span>
            </p>
            <p>
              <strong>Emergency Contact</strong>
              <span>{patient.emergencyContact || "N/A"}</span>
            </p>
            <p>
              <strong>Contact</strong>
              <span>{patient.contactNumber || "N/A"}</span>
            </p>
            <p>
              <strong>Address</strong>
              <span>{patient.address || "N/A"}</span>
            </p>
          </div>
        </section>

        <section className="profile-card profile-alert-card">
          <span className="profile-kicker">Open Items</span>
          <h2>Care Signals</h2>
          <div className="care-signals">
            <div>
              <strong>{appointments.filter((a) => a.status !== "Completed").length}</strong>
              <span>Active appointments</span>
            </div>
            <div>
              <strong>{vaccines.filter((v) => v.nextDoseDate).length}</strong>
              <span>Vaccine follow-ups</span>
            </div>
            <div>
              <strong>PHP {totalBalance.toLocaleString()}</strong>
              <span>Unpaid balance</span>
            </div>
          </div>
        </section>
      </div>

      <div className="dashboard-sections">
        <section className="panel">
          <div className="panel-header">
            <h2>Visit Timeline</h2>
            <span>{timeline.length} event(s)</span>
          </div>
          {timeline.length === 0 ? (
            <EmptyState
              icon="ti ti-timeline"
              title="No timeline yet"
              message="Consultations and vaccine records will appear here."
            />
          ) : (
            <div className="timeline-list">
              {timeline.map((item) => (
                <article className="timeline-item" key={item.id}>
                  <span className={`timeline-type ${item.type.toLowerCase()}`}>
                    {item.type}
                  </span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.note || "No notes recorded."}</p>
                  </div>
                  <time>{formatDate(item.date)}</time>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Appointments</h2>
            <span>{appointments.length} record(s)</span>
          </div>
          {appointments.length === 0 ? (
            <EmptyState
              icon="ti ti-calendar-off"
              title="No appointments"
              message="This child has no appointment history yet."
            />
          ) : (
            <div className="compact-list">
              {appointments.slice(0, 6).map((appointment) => (
                <div className="mini-item" key={appointment._id}>
                  <strong>{formatDate(appointment.appointmentDate)}</strong>
                  <span>
                    {appointment.appointmentTime} | {appointment.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {editOpen && (
        <div className="modal-overlay" onClick={() => setEditOpen(false)}>
          <div
            className="modal-content modal-content-wide"
            onClick={(event) => event.stopPropagation()}
          >
            <CreatePatient
              key={`patient-edit-${patient._id}-${patient.updatedAt || ""}`}
              embedded
              editMode
              patient={patient}
              onCancel={() => setEditOpen(false)}
              onSaved={() => {
                setEditOpen(false);
                setRefreshKey((current) => current + 1);
              }}
            />
          </div>
        </div>
      )}

      {deleteOpen && (
        <ConfirmDialog
          title="Delete patient record?"
          message={`${patient.firstName} ${patient.lastName} and related clinic records will be removed.`}
          confirmLabel="Delete Patient"
          onCancel={() => setDeleteOpen(false)}
          onConfirm={handleDeletePatient}
        />
      )}
    </div>
  );
}

export default PatientProfile;
