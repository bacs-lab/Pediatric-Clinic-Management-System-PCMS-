import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl, authHeaders } from "../utils/api";
import { notify } from "../utils/notify";
import {
  APPOINTMENT_CREATION_ROLES,
  APPOINTMENT_EDIT_ROLES,
  ROLES,
} from "../utils/roles";

const formatDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const buildInitialForm = (userId, appointment, isParent) => ({
  patientId: appointment?.patientId || "",
  guardianId: appointment?.guardianId || (isParent ? userId : ""),
  patientName: appointment?.patientName || "",
  guardianName: appointment?.guardianName || "",
  appointmentDate: formatDateInput(appointment?.appointmentDate),
  appointmentTime: appointment?.appointmentTime || "",
  reason: appointment?.reason || "",
  remarks: appointment?.remarks || "",
});

function CreateAppointment({
  embedded = false,
  appointment = null,
  onCancel,
  onSaved,
}) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const userId = user?.id || user?._id || "";
  const isParent = user?.role === ROLES.PARENT;
  const canCreateClinicAppointment = APPOINTMENT_CREATION_ROLES.includes(user?.role);
  const canEditClinicAppointment = APPOINTMENT_EDIT_ROLES.includes(user?.role);

  const [guardians, setGuardians] = useState([]);
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState(() => buildInitialForm(userId, appointment, isParent));

  useEffect(() => {
    if (!userId) return;

    if (isParent) {
      fetch(apiUrl(`/api/patients/guardian/${userId}`), {
        headers: authHeaders(),
      })
        .then((res) => res.json())
        .then((data) =>
          setPatients(
            Array.isArray(data)
              ? data.filter((patient) => (patient.status || "Active") === "Active")
              : []
          )
        )
        .catch(() => setPatients([]));
      return;
    }

    if (!canCreateClinicAppointment && !canEditClinicAppointment) {
      return;
    }

    Promise.all([
      fetch(apiUrl("/api/parent-profiles"), {
        headers: authHeaders(),
      }).then((res) => res.json()),
      fetch(apiUrl("/api/patients"), {
        headers: authHeaders(),
      }).then((res) => res.json()),
    ])
      .then(([guardianData, patientData]) => {
        setGuardians(Array.isArray(guardianData) ? guardianData : []);
        setPatients(
          Array.isArray(patientData)
            ? patientData.filter((patient) => (patient.status || "Active") === "Active")
            : []
        );
      })
      .catch(() => {
        setGuardians([]);
        setPatients([]);
      });
  }, [canCreateClinicAppointment, canEditClinicAppointment, isParent, userId]);

  const availablePatients = useMemo(() => {
    if (isParent || !form.guardianId) {
      return patients;
    }

    return patients.filter(
      (patient) => String(patient.guardianId) === String(form.guardianId)
    );
  }, [form.guardianId, isParent, patients]);

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient._id === form.patientId) || null,
    [form.patientId, patients]
  );

  const handleGuardianSelect = (event) => {
    const selectedGuardian = guardians.find(
      (guardian) => guardian.userId === event.target.value
    );

    setForm((current) => {
      const nextGuardianId = selectedGuardian?.userId || "";
      const currentPatientBelongsToGuardian = patients.some(
        (patient) =>
          patient._id === current.patientId &&
          String(patient.guardianId) === String(nextGuardianId)
      );

      return {
        ...current,
        guardianId: nextGuardianId,
        guardianName: selectedGuardian?.fullName || "",
        patientId: currentPatientBelongsToGuardian ? current.patientId : "",
        patientName: currentPatientBelongsToGuardian ? current.patientName : "",
      };
    });
  };

  const handlePatientSelect = (event) => {
    const patient = patients.find((item) => item._id === event.target.value);

    if (!patient) {
      setForm((current) => ({
        ...current,
        patientId: "",
        patientName: "",
      }));
      return;
    }

    setForm((current) => ({
      ...current,
      patientId: patient._id,
      patientName: `${patient.firstName} ${patient.lastName}`.trim(),
      guardianId: String(patient.guardianId || current.guardianId || ""),
      guardianName: patient.guardianName || current.guardianName,
    }));
  };

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isParent && !form.guardianId) {
      notify("Please select a parent or guardian");
      return;
    }

    if (!form.patientId) {
      notify(`Please select ${isParent ? "a child" : "a child patient"}`);
      return;
    }

    if (!form.appointmentDate) {
      notify("Please select appointment date");
      return;
    }

    if (!form.appointmentTime) {
      notify("Please select appointment time");
      return;
    }

    if (!form.reason.trim()) {
      notify("Please enter reason for appointment");
      return;
    }

    const payload = {
      guardianId: form.guardianId,
      patientId: form.patientId,
      appointmentDate: form.appointmentDate,
      appointmentTime: form.appointmentTime,
      reason: form.reason.trim(),
      remarks: form.remarks.trim(),
    };

    const targetUrl = appointment
      ? apiUrl(`/api/appointments/${appointment._id}`)
      : apiUrl("/api/appointments");

    const res = await fetch(targetUrl, {
      method: appointment ? "PUT" : "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      notify(data.message || "Failed to save appointment");
      return;
    }

    if (appointment) {
      notify("Appointment updated.");
    } else if (isParent) {
      notify("Appointment request submitted!");
    } else {
      notify("Appointment created.");
    }

    if (onSaved) {
      onSaved(data);
      return;
    }

    navigate(isParent ? "/parent/appointments" : "/staff/appointments");
  };

  const title = appointment
    ? "Edit Appointment"
    : isParent
      ? "Request Appointment"
      : "Create Appointment";

  const submitLabel = appointment
    ? "Save Appointment"
    : isParent
      ? "Request Appointment"
      : "Create Appointment";

  return (
    <>
      <h1 className={embedded ? "modal-title" : "page-title"}>{title}</h1>

      <form onSubmit={handleSubmit}>
        {!isParent && (
          <div className="form-group">
            <label className="form-label">Parent / Guardian</label>
            <select
              name="guardianId"
              value={form.guardianId}
              onChange={handleGuardianSelect}
            >
              <option value="">Select Parent / Guardian</option>
              {guardians.map((guardian) => (
                <option key={guardian._id} value={guardian.userId}>
                  {guardian.fullName}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Child</label>
          <select name="patientId" value={form.patientId} onChange={handlePatientSelect}>
            <option value="">
              {isParent ? "Select Child" : "Select Child Patient"}
            </option>
            {availablePatients.map((patient) => (
              <option key={patient._id} value={patient._id}>
                {patient.firstName} {patient.lastName}
              </option>
            ))}
          </select>
        </div>

        {!isParent && selectedPatient && (
          <div className="form-info-card">
            <div className="info-item">
              <span className="info-label">Guardian</span>
              <span className="info-value">
                {selectedPatient.guardianName || "Unassigned"}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Contact</span>
              <span className="info-value">
                {selectedPatient.contactNumber || "No contact on file"}
              </span>
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Appointment Date</label>
          <input
            type="date"
            name="appointmentDate"
            value={form.appointmentDate}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Appointment Time</label>
          <input
            type="time"
            name="appointmentTime"
            value={form.appointmentTime}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Reason</label>
          <textarea
            name="reason"
            placeholder="Reason for appointment"
            value={form.reason}
            onChange={handleChange}
          />
        </div>

        {appointment && !isParent && (
          <div className="form-group">
            <label className="form-label">Remarks</label>
            <textarea
              name="remarks"
              placeholder="Add scheduling notes if needed"
              value={form.remarks}
              onChange={handleChange}
            />
          </div>
        )}

        <div className="modal-buttons">
          {embedded && (
            <button className="secondary-btn" type="button" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button className="primary-btn" type="submit">
            {submitLabel}
          </button>
        </div>
      </form>
    </>
  );
}

export default CreateAppointment;
