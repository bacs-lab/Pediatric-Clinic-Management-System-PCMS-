import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import PatientEditRequestReviewModal from "../components/PatientEditRequestReviewModal";
import PatientRequestReviewModal from "../components/PatientRequestReviewModal";
import { apiUrl, authHeaders } from "../utils/api";
import { notify, notifyError, notifySuccess } from "../utils/notify";

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString() : "N/A";

function RequestCenter() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(() => location.state?.search || "");
  const [typeFilter, setTypeFilter] = useState(
    () => location.state?.requestType || ""
  );
  const [pendingPatients, setPendingPatients] = useState([]);
  const [pendingPatientEdits, setPendingPatientEdits] = useState([]);
  const [selectedPatientRequest, setSelectedPatientRequest] = useState(null);
  const [selectedPatientEditRequest, setSelectedPatientEditRequest] = useState(null);
  const [reviewBusy, setReviewBusy] = useState(false);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingProfilesRes, pendingUpdatesRes] = await Promise.all([
        fetch(apiUrl("/api/patients/pending"), {
          headers: authHeaders(),
        }),
        fetch(apiUrl("/api/patients/pending-updates"), {
          headers: authHeaders(),
        }),
      ]);

      const [pendingProfiles, pendingUpdates] = await Promise.all([
        pendingProfilesRes.ok ? pendingProfilesRes.json() : [],
        pendingUpdatesRes.ok ? pendingUpdatesRes.json() : [],
      ]);

      setPendingPatients(Array.isArray(pendingProfiles) ? pendingProfiles : []);
      setPendingPatientEdits(Array.isArray(pendingUpdates) ? pendingUpdates : []);
    } catch {
      notifyError("Failed to load parent and guardian requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      loadRequests();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [loadRequests]);

  useEffect(() => {
    if (!location.state?.requestType && !location.state?.search) return;

    const timer = window.setTimeout(() => {
      if (location.state?.requestType) {
        setTypeFilter(location.state.requestType);
      }
      if (location.state?.search) {
        setSearch(location.state.search);
      }
    }, 0);

    window.history.replaceState({}, document.title);
    return () => window.clearTimeout(timer);
  }, [location.state]);

  const requestRows = useMemo(() => {
    const childRequests = pendingPatients.map((patient) => ({
      id: `child-${patient._id}`,
      kind: "child-request",
      label: "Child enrollment",
      childName: `${patient.firstName} ${patient.lastName}`.trim(),
      guardianName: patient.guardianName || "Parent request",
      submittedAt: patient.createdAt,
      summary: patient.relationshipToChild || "Guardian relationship not set",
      patient,
    }));

    const detailUpdates = pendingPatientEdits.map((patient) => ({
      id: `edit-${patient._id}`,
      kind: "detail-update",
      label: "Profile update",
      childName: `${patient.firstName} ${patient.lastName}`.trim(),
      guardianName: patient.guardianName || "Parent request",
      submittedAt: patient.updatedAt,
      summary: `${Object.keys(patient.pendingUpdate || {}).length} field(s) requested`,
      patient,
    }));

    return [...childRequests, ...detailUpdates]
      .filter((item) => {
        const matchesType = typeFilter ? item.kind === typeFilter : true;
        const haystack = [
          item.childName,
          item.guardianName,
          item.label,
          item.summary,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return matchesType && haystack.includes(search.toLowerCase());
      })
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  }, [pendingPatientEdits, pendingPatients, search, typeFilter]);

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
        notifyError(data.message || `Failed to ${action} patient request`);
        return;
      }

      setPendingPatients((items) =>
        items.filter((item) => item._id !== selectedPatientRequest._id)
      );
      setSelectedPatientRequest(null);
      notifySuccess(
        action === "accept"
          ? "Child request accepted."
          : "Child request rejected."
      );
    } catch {
      notifyError(`Failed to ${action} patient request`);
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
      notifySuccess(
        action === "accept"
          ? "Patient detail update approved."
          : "Patient detail update rejected."
      );
    } catch {
      notifyError(`Failed to ${action} patient update request`);
    } finally {
      setReviewBusy(false);
    }
  };

  if (loading) return <LoadingState title="Loading parent and guardian requests..." />;

  return (
    <div className="dashboard-bg">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">REQUEST CENTER</p>
          <h1>Parent & Guardian Requests</h1>
          <span>
            Review new child patient submissions and requested profile changes from
            parent and guardian accounts.
          </span>
        </div>

        <div className="hero-actions">
          <button className="secondary-btn" onClick={loadRequests}>
            <span className="ti ti-refresh" />
            Refresh
          </button>
        </div>
      </div>

      <div className="stats-row users-stats-row">
        <div className="metric-card yellow">
          <span className="ti ti-user-question" />
          <p>Child Enrollment Requests</p>
          <h2>{pendingPatients.length}</h2>
        </div>
        <div className="metric-card violet">
          <span className="ti ti-edit-circle" />
          <p>Profile Update Requests</p>
          <h2>{pendingPatientEdits.length}</h2>
        </div>
        <div className="metric-card blue">
          <span className="ti ti-inbox" />
          <p>Total Pending Requests</p>
          <h2>{pendingPatients.length + pendingPatientEdits.length}</h2>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">
            <i className="ti ti-mail-opened" aria-hidden="true" />
            Incoming Requests
          </h2>
          <span>{requestRows.length} request(s)</span>
        </div>

        <div className="inventory-filters">
          <input
            type="text"
            className="search-input"
            placeholder="Search child or guardian..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            className="filter-select"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          >
            <option value="">All request types</option>
            <option value="child-request">Child enrollment</option>
            <option value="detail-update">Profile update</option>
          </select>
        </div>

        {requestRows.length === 0 ? (
          <EmptyState
            icon="ti ti-inbox-off"
            title="No pending parent or guardian requests"
            message="New child submissions and profile update requests will appear here."
          />
        ) : (
          <div className="table-container flat">
            <table>
              <thead>
                <tr>
                  <th>Request Type</th>
                  <th>Child</th>
                  <th>Parent / Guardian</th>
                  <th>Submitted On</th>
                  <th>Summary</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {requestRows.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className={`request-kind-badge ${item.kind}`}>
                        <span
                          className={`ti ${
                            item.kind === "child-request"
                              ? "ti-user-question"
                              : "ti-edit-circle"
                          }`}
                        />
                        {item.label}
                      </span>
                    </td>
                    <td>
                      <strong>{item.childName}</strong>
                    </td>
                    <td>{item.guardianName}</td>
                    <td>{formatDate(item.submittedAt)}</td>
                    <td>
                      <span className="request-row-detail">{item.summary}</span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="primary-btn"
                          onClick={() =>
                            item.kind === "child-request"
                              ? setSelectedPatientRequest(item.patient)
                              : setSelectedPatientEditRequest(item.patient)
                          }
                        >
                          Review
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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

export default RequestCenter;
