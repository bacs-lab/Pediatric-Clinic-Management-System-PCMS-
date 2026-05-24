import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PatientEditRequestReviewModal from "./PatientEditRequestReviewModal";
import PatientRequestReviewModal from "./PatientRequestReviewModal";
import { apiUrl, authHeaders } from "../utils/api";
import { notify } from "../utils/notify";
import { PATIENT_APPROVAL_ROLES, STAFF_ROLES } from "../utils/roles";

function Topbar({ onMenuClick }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [reminders, setReminders] = useState({
    upcomingFollowUps: [],
    upcomingVaccines: [],
  });
  const [pendingPatients, setPendingPatients] = useState([]);
  const [pendingPatientEdits, setPendingPatientEdits] = useState([]);
  const [selectedPatientRequest, setSelectedPatientRequest] = useState(null);
  const [selectedPatientEditRequest, setSelectedPatientEditRequest] = useState(null);
  const [reviewBusy, setReviewBusy] = useState(false);

  const isStaff = STAFF_ROLES.includes(user?.role);
  const canApprovePatients = PATIENT_APPROVAL_ROLES.includes(user?.role);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  useEffect(() => {
    if (!isStaff) return;

    fetch(apiUrl("/api/reminders"), {
      headers: authHeaders(),
    })
      .then((res) => res.json())
      .then((data) =>
        setReminders({
          upcomingFollowUps: data.upcomingFollowUps || [],
          upcomingVaccines: data.upcomingVaccines || [],
        })
      )
      .catch(() => {});
  }, [isStaff]);

  useEffect(() => {
    if (!canApprovePatients) return;

    fetch(apiUrl("/api/patients/pending"), {
      headers: authHeaders(),
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setPendingPatients(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [canApprovePatients]);

  useEffect(() => {
    if (!canApprovePatients) return;

    fetch(apiUrl("/api/patients/pending-updates"), {
      headers: authHeaders(),
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setPendingPatientEdits(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [canApprovePatients]);

  const notificationItems = (() => {
    if (!isStaff) {
      return [
        {
          id: "parent-appointments",
          icon: "ti ti-calendar-heart",
          title: "Appointment updates",
          body: "Check My Appointments for request status and schedule changes.",
        },
        {
          id: "parent-vaccines",
          icon: "ti ti-vaccine",
          title: "Vaccine reminders",
          body: "Open your child's vaccine tab to review next dose dates.",
        },
      ];
    }

    const followUps = reminders.upcomingFollowUps.slice(0, 3).map((item) => ({
      id: `follow-${item._id}`,
      icon: "ti ti-stethoscope",
      title: `${item.patientName} follow-up`,
      body: item.followUpDate
        ? new Date(item.followUpDate).toLocaleDateString()
        : "Follow-up date pending",
    }));

    const vaccines = reminders.upcomingVaccines.slice(0, 3).map((item) => ({
      id: `vaccine-${item._id}`,
      icon: "ti ti-vaccine",
      title: `${item.patientName} vaccine due`,
      body: item.nextDoseDate
        ? `${item.vaccineName} on ${new Date(item.nextDoseDate).toLocaleDateString()}`
        : item.vaccineName,
    }));

    const patientRequests = pendingPatients.slice(0, 4).map((patient) => ({
      id: `patient-request-${patient._id}`,
      icon: "ti ti-user-question",
      title: `${patient.firstName} ${patient.lastName} pending approval`,
      body: `Guardian: ${patient.guardianName || "Parent request"}`,
      kind: "patient-request",
      patient,
    }));

    const patientEditRequests = pendingPatientEdits.slice(0, 4).map((patient) => ({
      id: `patient-edit-${patient._id}`,
      icon: "ti ti-edit-circle",
      title: `${patient.firstName} ${patient.lastName} detail update`,
      body: `Guardian: ${patient.guardianName || "Parent request"}`,
      kind: "patient-edit-request",
      patient,
    }));

    return [...patientRequests, ...patientEditRequests, ...followUps, ...vaccines];
  })();

  const openNotification = (item) => {
    if (item.kind === "patient-request" && item.patient) {
      setSelectedPatientRequest(item.patient);
      setNotificationsOpen(false);
      return;
    }

    if (item.kind === "patient-edit-request" && item.patient) {
      setSelectedPatientEditRequest(item.patient);
      setNotificationsOpen(false);
      return;
    }

    if (!item.path) return;

    navigate(item.path, item.state ? { state: item.state } : undefined);
    setNotificationsOpen(false);
  };

  const openRequestCenter = (requestType) => {
    navigate("/staff/requests", requestType ? { state: { requestType } } : undefined);
    setNotificationsOpen(false);
  };

  const reviewPatientRequest = async (action) => {
    if (!selectedPatientRequest) return;

    setReviewBusy(true);

    try {
      const route = action === "accept" ? "approve" : "reject";
      const res = await fetch(
        apiUrl(`/api/patients/${selectedPatientRequest._id}/${route}`),
        {
          method: "PUT",
          headers: authHeaders(),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        notify(data.message || `Failed to ${action} patient request`);
        return;
      }

      setPendingPatients((items) =>
        items.filter((item) => item._id !== selectedPatientRequest._id)
      );

      setSelectedPatientRequest(null);
      notify(
        action === "accept"
          ? "Child request accepted."
          : "Child request rejected."
      );
    } catch {
      notify(`Failed to ${action} patient request`);
    } finally {
      setReviewBusy(false);
    }
  };

  const reviewPatientEditRequest = async (action) => {
    if (!selectedPatientEditRequest) return;

    setReviewBusy(true);

    try {
      const route = action === "accept" ? "approve-edit" : "reject-edit";
      const res = await fetch(
        apiUrl(`/api/patients/${selectedPatientEditRequest._id}/${route}`),
        {
          method: "PUT",
          headers: authHeaders(),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        notify(data.message || `Failed to ${action} patient update request`);
        return;
      }

      setPendingPatientEdits((items) =>
        items.filter((item) => item._id !== selectedPatientEditRequest._id)
      );

      setSelectedPatientEditRequest(null);
      notify(
        action === "accept"
          ? "Patient detail update approved."
          : "Patient detail update rejected."
      );
    } catch {
      notify(`Failed to ${action} patient update request`);
    } finally {
      setReviewBusy(false);
    }
  };

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button
          className="hamburger-btn"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="topbar-date">
          <span className="ti ti-calendar-event" />
          {today}
        </div>
      </div>

      <div className="topbar-right">

        <div className="notification-wrap">
          <button
            className="icon-btn notification-btn"
            type="button"
            onClick={() => setNotificationsOpen((open) => !open)}
            aria-label="Open notifications"
          >
            <span className="ti ti-bell" />
            {notificationItems.length > 0 && <i>{notificationItems.length}</i>}
          </button>

          {notificationsOpen && (
            <div className="notification-menu">
              <div className="notification-head">
                <strong>Notifications</strong>
                <div className="notification-head-actions">
                  {canApprovePatients && (
                    <button
                      className="notification-link-btn"
                      type="button"
                      onClick={() => openRequestCenter()}
                    >
                      Open Requests
                    </button>
                  )}
                  <span>{notificationItems.length} item(s)</span>
                </div>
              </div>
              {notificationItems.length === 0 ? (
                <p className="notification-empty">No reminders right now.</p>
              ) : (
                notificationItems.map((item) =>
                  item.path || item.kind ? (
                    <button
                      className="notification-item"
                      key={item.id}
                      type="button"
                      onClick={() => openNotification(item)}
                    >
                      <span className={item.icon} />
                      <div>
                        <strong>{item.title}</strong>
                        <p>{item.body}</p>
                      </div>
                    </button>
                  ) : (
                    <div className="notification-item" key={item.id}>
                      <span className={item.icon} />
                      <div>
                        <strong>{item.title}</strong>
                        <p>{item.body}</p>
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          )}
        </div>

        <div className="user-chip">
          <div className="avatar">
            {user?.name?.charAt(0)?.toUpperCase() || "K"}
          </div>
          <div className="user-info">
            <strong>{user?.name || "Kids First"}</strong>
            <span>{user?.role || "clinic user"}</span>
          </div>
        </div>
      </div>

      {selectedPatientRequest && (
        <PatientRequestReviewModal
          patient={selectedPatientRequest}
          busy={reviewBusy}
          onAccept={() => reviewPatientRequest("accept")}
          onReject={() => reviewPatientRequest("reject")}
          onClose={() => {
            if (!reviewBusy) setSelectedPatientRequest(null);
          }}
        />
      )}

      {selectedPatientEditRequest && (
        <PatientEditRequestReviewModal
          patient={selectedPatientEditRequest}
          busy={reviewBusy}
          onAccept={() => reviewPatientEditRequest("accept")}
          onReject={() => reviewPatientEditRequest("reject")}
          onClose={() => {
            if (!reviewBusy) setSelectedPatientEditRequest(null);
          }}
        />
      )}
    </div>
  );
}

export default Topbar;
