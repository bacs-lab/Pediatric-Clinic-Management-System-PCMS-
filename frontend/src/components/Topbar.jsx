import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GuardianRequestReviewModal from "./GuardianRequestReviewModal";
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
  const [pendingGuardians, setPendingGuardians] = useState([]);
  const [selectedGuardianRequest, setSelectedGuardianRequest] = useState(null);
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

    fetch(apiUrl("/api/parent-profiles/pending"), {
      headers: authHeaders(),
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setPendingGuardians(Array.isArray(data) ? data : []))
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

    const guardianRequests = pendingGuardians.slice(0, 4).map((guardian) => ({
      id: `guardian-request-${guardian._id}`,
      icon: "ti ti-user-question",
      title: `${guardian.fullName} pending verification`,
      body: guardian.email || "Guardian account request",
      kind: "guardian-request",
      guardian,
    }));

    return [...guardianRequests, ...followUps, ...vaccines];
  })();

  const openNotification = (item) => {
    if (item.kind === "guardian-request" && item.guardian) {
      setSelectedGuardianRequest(item.guardian);
      setNotificationsOpen(false);
      return;
    }

    if (!item.path) return;

    navigate(item.path, item.state ? { state: item.state } : undefined);
    setNotificationsOpen(false);
  };

  const openRequestCenter = () => {
    navigate("/staff/requests");
    setNotificationsOpen(false);
  };

  const reviewGuardianRequest = async (action) => {
    if (!selectedGuardianRequest) return;

    setReviewBusy(true);

    try {
      const route = action === "accept" ? "approve" : "reject";
      const res = await fetch(
        apiUrl(`/api/parent-profiles/${selectedGuardianRequest._id}/${route}`),
        {
          method: "PUT",
          headers: authHeaders(),
        }
      );
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        notify(data.message || `Failed to ${action} guardian account`);
        return;
      }

      setPendingGuardians((items) =>
        items.filter((item) => item._id !== selectedGuardianRequest._id)
      );

      setSelectedGuardianRequest(null);
      notify(
        action === "accept"
          ? "Guardian account approved."
          : "Guardian account rejected."
      );
    } catch {
      notify(`Failed to ${action} guardian account`);
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

        <button
          className="user-chip"
          type="button"
          onClick={() => navigate("/account")}
          aria-label="Edit account details"
        >
          <div className="avatar">
            {user?.name?.charAt(0)?.toUpperCase() || "K"}
          </div>
          <div className="user-info">
            <strong>{user?.name || "Kids First"}</strong>
            <span>{user?.role || "clinic user"}</span>
          </div>
        </button>
      </div>

      {selectedGuardianRequest && (
        <GuardianRequestReviewModal
          guardian={selectedGuardianRequest}
          busy={reviewBusy}
          onAccept={() => reviewGuardianRequest("accept")}
          onReject={() => reviewGuardianRequest("reject")}
          onClose={() => {
            if (!reviewBusy) setSelectedGuardianRequest(null);
          }}
        />
      )}
    </div>
  );
}

export default Topbar;
