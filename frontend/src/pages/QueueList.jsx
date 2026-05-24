import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import CreateAssessment from "./CreateAssessment";
import CreateBilling from "./CreateBilling";
import CreateConsultation from "./CreateConsultation";
import { apiUrl, authHeaders } from "../utils/api";
import { notifyError, notifySuccess } from "../utils/notify";
import { MEDICAL_ROLES } from "../utils/roles";

const queueColumns = [
  "Waiting",
  "In Assessment",
  "For Consultation",
  "In Consultation",
  "For Billing",
  "Completed",
];

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "N/A";

const formatSlot = (item) => {
  const date = item.appointmentDate ? formatDate(item.appointmentDate) : null;
  const time = item.appointmentTime || null;

  if (date && time) return `${date} · ${time}`;
  return date || time || "No slot recorded";
};

function QueueList() {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user"));
  const [queue, setQueue] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [workflowModal, setWorkflowModal] = useState(null);

  const fetchQueue = () => {
    fetch(apiUrl("/api/queue"), {
      headers: authHeaders(),
    })
      .then((res) => res.json())
      .then((data) => setQueue(Array.isArray(data) ? data : []))
      .catch(() => notifyError("Failed to load queue."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const canCreateAssessment = ["admin", "staff", "doctor"].includes(user?.role);
  const canCreateConsultation = MEDICAL_ROLES.includes(user?.role) || user?.role === "admin";
  const canCreateBilling = ["admin", "secretary", "staff"].includes(user?.role);

  const canOpenWorkflow = (type) =>
    (type === "assessment" && canCreateAssessment) ||
    (type === "consultation" && canCreateConsultation) ||
    (type === "billing" && canCreateBilling);

  useEffect(() => {
    const modalType = location.state?.modal;
    const modalAllowed =
      (modalType === "assessment" && canCreateAssessment) ||
      (modalType === "consultation" && canCreateConsultation) ||
      (modalType === "billing" && canCreateBilling);

    if (
      ["assessment", "consultation", "billing"].includes(modalType) &&
      modalAllowed
    ) {
      const timer = window.setTimeout(
        () => setWorkflowModal({ type: modalType, item: null }),
        0
      );
      window.history.replaceState({}, document.title);
      return () => window.clearTimeout(timer);
    }
  }, [canCreateAssessment, canCreateBilling, canCreateConsultation, location.state]);

  const updateStatus = async (id, status) => {
    const res = await fetch(apiUrl(`/api/queue/${id}`), {
      method: "PUT",
      headers: authHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({ status }),
    });

    if (res.ok) {
      notifySuccess("Queue status updated.");
      fetchQueue();
    } else {
      notifyError("Failed to update queue.");
    }
  };

  const filtered = useMemo(
    () =>
      queue.filter((item) => {
        const matchesSearch = item.patientName
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
          item.guardianName?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter ? item.status === statusFilter : true;
        return matchesSearch && matchesStatus;
      }),
    [queue, search, statusFilter]
  );

  const grouped = queueColumns.map((status) => ({
    status,
    items: filtered.filter((item) => item.status === status),
  }));

  const cancelled = filtered.filter((item) => item.status === "Cancelled");

  const activeQueueItems = queue.filter(
    (item) => !["Completed", "Cancelled"].includes(item.status)
  );

  const openWorkflow = (type, item = null) => {
    if (!canOpenWorkflow(type)) {
      notifyError("Access denied for this workflow.");
      return;
    }
    setWorkflowModal({ type, item });
  };

  const goToStep = (item) => {
    if (item.status === "In Assessment") {
      openWorkflow("assessment", item);
    }
    if (item.status === "For Consultation") {
      openWorkflow("consultation", item);
    }
    if (item.status === "For Billing") {
      openWorkflow("billing", item);
    }
  };

  const closeWorkflow = () => setWorkflowModal(null);

  const handleWorkflowSaved = () => {
    closeWorkflow();
    fetchQueue();
  };

  if (loading) return <LoadingState title="Loading patient queue..." />;

  return (
    <div className="dashboard-bg">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">CLINIC PATIENT FLOW</p>
          <h1>Queue Management</h1>
          <span>Approved appointments land here automatically so staff can move patients from waiting to assessment, consultation, and billing.</span>
        </div>

        <div className="hero-actions">
          {canCreateAssessment && (
            <button className="secondary-btn" onClick={() => openWorkflow("assessment")}>
              <span className="ti ti-stethoscope" />
              New Assessment
            </button>
          )}
          {canCreateConsultation && (
            <button className="secondary-btn" onClick={() => openWorkflow("consultation")}>
              <span className="ti ti-notes" />
              New Consultation
            </button>
          )}
          {canCreateBilling && (
            <button className="primary-btn" onClick={() => openWorkflow("billing")}>
              <span className="ti ti-wallet" />
              New Billing
            </button>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Live Patient Flow</h2>
          <span>{filtered.length} item(s)</span>
        </div>

        <div className="inventory-filters">
          <input
            type="text"
            className="search-input"
            placeholder="Search patient or guardian..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">All Statuses</option>
            {[...queueColumns, "Cancelled"].map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon="ti ti-list-check"
            title="No queue items found"
            message="Approved appointments automatically move into the waiting queue."
          />
        ) : (
          <div className="queue-board">
            {grouped.map((column) => (
              <section className="queue-column" key={column.status}>
                <header>
                  <h3>{column.status}</h3>
                  <span>{column.items.length}</span>
                </header>

                {column.items.length === 0 ? (
                  <p className="queue-empty">No patients</p>
                ) : (
                  column.items.map((item) => (
                    <article className="queue-card" key={item._id}>
                      <div>
                        <strong>#{item.queueNumber}</strong>
                        <h4>{item.patientName}</h4>
                        <div className="queue-card-meta">
                          <span>{item.guardianName || "Guardian not set"}</span>
                          <span>Slot: {formatSlot(item)}</span>
                          <span>Requested: {formatDate(item.requestedAt || item.createdAt)}</span>
                        </div>
                      </div>

                      <select
                        value={item.status}
                        onChange={(event) => updateStatus(item._id, event.target.value)}
                        className="queue-status-select"
                      >
                        {[...queueColumns, "Cancelled"].map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>

                      {["In Assessment", "For Consultation", "For Billing"].includes(item.status) && (
                        <button className="primary-btn" onClick={() => goToStep(item)}>
                          Continue
                        </button>
                      )}
                    </article>
                  ))
                )}
              </section>
            ))}

            {cancelled.length > 0 && (
              <section className="queue-column muted">
                <header>
                  <h3>Cancelled</h3>
                  <span>{cancelled.length}</span>
                </header>
                {cancelled.map((item) => (
                  <article className="queue-card" key={item._id}>
                    <strong>#{item.queueNumber}</strong>
                    <h4>{item.patientName}</h4>
                    <div className="queue-card-meta">
                      <span>{item.guardianName || "Guardian not set"}</span>
                      <span>Slot: {formatSlot(item)}</span>
                    </div>
                  </article>
                ))}
              </section>
            )}
          </div>
        )}
      </div>

      {workflowModal && (
        <div className="modal-overlay" onClick={closeWorkflow}>
          <div className="modal-content modal-content-wide" onClick={(event) => event.stopPropagation()}>
            {workflowModal.type === "assessment" && (
              <CreateAssessment
                embedded
                initialQueueItem={workflowModal.item}
                queueItems={activeQueueItems}
                onCancel={closeWorkflow}
                onSaved={handleWorkflowSaved}
              />
            )}
            {workflowModal.type === "consultation" && (
              <CreateConsultation
                embedded
                initialQueueItem={workflowModal.item}
                queueItems={activeQueueItems}
                onCancel={closeWorkflow}
                onSaved={handleWorkflowSaved}
              />
            )}
            {workflowModal.type === "billing" && (
              <CreateBilling
                embedded
                initialQueueItem={workflowModal.item}
                queueItems={activeQueueItems}
                onCancel={closeWorkflow}
                onSaved={handleWorkflowSaved}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default QueueList;
