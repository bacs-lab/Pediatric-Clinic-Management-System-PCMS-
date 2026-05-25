import { useEffect, useMemo, useState } from "react";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import CreateAssessment from "./CreateAssessment";
import CreateBilling from "./CreateBilling";
import CreateConsultation from "./CreateConsultation";
import { apiUrl, authHeaders } from "../utils/api";
import { notifyError, notifySuccess } from "../utils/notify";
import {
  QUEUE_COLUMNS,
  QUEUE_STATUSES,
  canContinueQueue,
  canRevertQueue,
  getContinueLabel,
  getRevertLabel,
  getWorkflowTypeForStatus,
  normalizeQueueStatus,
} from "../utils/queueWorkflow";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "N/A";

const formatSlot = (item) => {
  const date = item.appointmentDate ? formatDate(item.appointmentDate) : null;
  const time = item.appointmentTime || null;

  if (date && time) return `${date} - ${time}`;
  return date || time || "No slot recorded";
};

const statusClassName = (status) =>
  normalizeQueueStatus(status).toLowerCase().replace(/\s+/g, "-");

function QueueList() {
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
      .then((data) =>
        setQueue(
          Array.isArray(data)
            ? data.map((item) => ({
                ...item,
                status: normalizeQueueStatus(item.status),
              }))
            : []
        )
      )
      .catch(() => notifyError("Failed to load queue."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const updateQueueItem = (updatedItem) => {
    setQueue((items) =>
      items.map((item) =>
        item._id === updatedItem._id
          ? { ...updatedItem, status: normalizeQueueStatus(updatedItem.status) }
          : item
      )
    );
  };

  const continueQueueItem = async (item) => {
    const currentStatus = normalizeQueueStatus(item.status);

    if (currentStatus === QUEUE_STATUSES.BILLING) {
      setWorkflowModal({ type: "billing", item });
      return;
    }

    const res = await fetch(apiUrl(`/api/queue/${item._id}/continue`), {
      method: "POST",
      headers: authHeaders(),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      notifyError(data.message || "Failed to continue queue item.");
      return;
    }

    const updatedItem = {
      ...data,
      status: normalizeQueueStatus(data.status),
    };
    updateQueueItem(updatedItem);

    const workflowType = getWorkflowTypeForStatus(updatedItem.status);

    if (workflowType && updatedItem.status !== QUEUE_STATUSES.BILLING) {
      setWorkflowModal({ type: workflowType, item: updatedItem });
    } else {
      notifySuccess(`Queue moved to ${updatedItem.status}.`);
    }
  };

  const revertQueueItem = async (item) => {
    const res = await fetch(apiUrl(`/api/queue/${item._id}/revert`), {
      method: "POST",
      headers: authHeaders(),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      notifyError(data.message || "Failed to revert queue item.");
      return;
    }

    updateQueueItem(data);
    notifySuccess(`Queue reverted to ${normalizeQueueStatus(data.status)}.`);
  };

  const filtered = useMemo(
    () =>
      queue.filter((item) => {
        const term = search.toLowerCase();
        const itemStatus = normalizeQueueStatus(item.status);
        const matchesSearch =
          item.patientName?.toLowerCase().includes(term) ||
          item.guardianName?.toLowerCase().includes(term);
        const matchesStatus = statusFilter ? itemStatus === statusFilter : true;

        return matchesSearch && matchesStatus;
      }),
    [queue, search, statusFilter]
  );

  const grouped = QUEUE_COLUMNS.map((status) => ({
    status,
    items: filtered.filter((item) => normalizeQueueStatus(item.status) === status),
  }));

  const cancelled = filtered.filter(
    (item) => normalizeQueueStatus(item.status) === QUEUE_STATUSES.CANCELLED
  );

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
          <span>
            Approved appointments move through waiting, assessment, consultation,
            billing, and completion in order.
          </span>
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
            {[...QUEUE_COLUMNS, QUEUE_STATUSES.CANCELLED].map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
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
                  column.items.map((item) => {
                    const normalizedStatus = normalizeQueueStatus(item.status);
                    const canContinue = canContinueQueue(
                      normalizedStatus,
                      user?.role
                    );
                    const canRevert = canRevertQueue(normalizedStatus, user?.role);

                    return (
                      <article className="queue-card" key={item._id}>
                        <div>
                          <div className="queue-card-topline">
                            <strong>#{item.queueNumber}</strong>
                            <span
                              className={`status-badge ${statusClassName(
                                normalizedStatus
                              )}`}
                            >
                              {normalizedStatus}
                            </span>
                          </div>
                          <h4>{item.patientName}</h4>
                          <div className="queue-card-meta">
                            <span>{item.guardianName || "Guardian not set"}</span>
                            <span>Slot: {formatSlot(item)}</span>
                            <span>
                              Requested:{" "}
                              {formatDate(item.requestedAt || item.createdAt)}
                            </span>
                          </div>
                        </div>

                        {(canContinue || canRevert) && (
                          <div className="queue-card-actions">
                            {canRevert && (
                              <button
                                className="secondary-btn"
                                type="button"
                                onClick={() => revertQueueItem(item)}
                              >
                                {getRevertLabel(normalizedStatus)}
                              </button>
                            )}
                            {canContinue && (
                              <button
                                className="primary-btn"
                                type="button"
                                onClick={() => continueQueueItem(item)}
                              >
                                {getContinueLabel(normalizedStatus)}
                              </button>
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })
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
          <div
            className="modal-content modal-content-wide"
            onClick={(event) => event.stopPropagation()}
          >
            {workflowModal.type === "assessment" && (
              <CreateAssessment
                embedded
                initialQueueItem={workflowModal.item}
                onCancel={closeWorkflow}
                onSaved={handleWorkflowSaved}
              />
            )}
            {workflowModal.type === "consultation" && (
              <CreateConsultation
                embedded
                initialQueueItem={workflowModal.item}
                onCancel={closeWorkflow}
                onSaved={handleWorkflowSaved}
              />
            )}
            {workflowModal.type === "billing" && (
              <CreateBilling
                embedded
                initialQueueItem={workflowModal.item}
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
