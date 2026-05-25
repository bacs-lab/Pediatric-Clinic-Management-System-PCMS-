import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import GuardianRequestReviewModal from "../components/GuardianRequestReviewModal";
import LoadingState from "../components/LoadingState";
import { apiUrl, authHeaders } from "../utils/api";
import { notifyError, notifySuccess } from "../utils/notify";

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString() : "N/A";

function RequestCenter() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(() => location.state?.search || "");
  const [guardianRequests, setGuardianRequests] = useState([]);
  const [selectedGuardianRequest, setSelectedGuardianRequest] = useState(null);
  const [reviewBusy, setReviewBusy] = useState(false);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/parent-profiles/pending"), {
        headers: authHeaders(),
      });

      const data = res.ok ? await res.json() : [];
      setGuardianRequests(Array.isArray(data) ? data : []);
    } catch {
      notifyError("Failed to load guardian account requests.");
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
    if (!location.state?.search) return;

    const timer = window.setTimeout(() => {
      setSearch(location.state.search);
    }, 0);

    window.history.replaceState({}, document.title);
    return () => window.clearTimeout(timer);
  }, [location.state]);

  const requestRows = useMemo(() => {
    const term = search.toLowerCase();

    return guardianRequests
      .filter((guardian) =>
        [
          guardian.fullName,
          guardian.email,
          guardian.contactNumber,
          guardian.address,
          "guardian account",
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term)
      )
      .sort(
        (a, b) =>
          new Date(b.submittedAt || b.createdAt) -
          new Date(a.submittedAt || a.createdAt)
      );
  }, [guardianRequests, search]);

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
        notifyError(data.message || `Failed to ${action} guardian account`);
        return;
      }

      setGuardianRequests((items) =>
        items.filter((item) => item._id !== selectedGuardianRequest._id)
      );
      setSelectedGuardianRequest(null);
      notifySuccess(
        action === "accept"
          ? "Guardian account approved."
          : "Guardian account rejected."
      );
    } catch {
      notifyError(`Failed to ${action} guardian account`);
    } finally {
      setReviewBusy(false);
    }
  };

  if (loading) return <LoadingState title="Loading guardian account requests..." />;

  return (
    <div className="dashboard-bg">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">REQUEST CENTER</p>
          <h1>Guardian Verification</h1>
          <span>
            Review parent and guardian signups before they can access the parent portal.
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
          <p>Pending Guardians</p>
          <h2>{guardianRequests.length}</h2>
        </div>
        <div className="metric-card blue">
          <span className="ti ti-shield-check" />
          <p>Verification Type</p>
          <h2>Account</h2>
        </div>
        <div className="metric-card violet">
          <span className="ti ti-inbox" />
          <p>Visible Requests</p>
          <h2>{requestRows.length}</h2>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">
            <i className="ti ti-mail-opened" aria-hidden="true" />
            Incoming Guardian Requests
          </h2>
          <span>{requestRows.length} request(s)</span>
        </div>

        <div className="inventory-filters">
          <input
            type="text"
            className="search-input"
            placeholder="Search guardian..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {requestRows.length === 0 ? (
          <EmptyState
            icon="ti ti-inbox-off"
            title="No pending guardian requests"
            message="New guardian signups will appear here for verification."
          />
        ) : (
          <div className="table-container flat">
            <table>
              <thead>
                <tr>
                  <th>Request Type</th>
                  <th>Guardian</th>
                  <th>Email</th>
                  <th>Contact</th>
                  <th>Submitted On</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {requestRows.map((guardian) => (
                  <tr key={guardian._id}>
                    <td>
                      <span className="request-kind-badge guardian-request">
                        <span className="ti ti-user-question" />
                        Guardian account
                      </span>
                    </td>
                    <td>
                      <strong>{guardian.fullName}</strong>
                      <span className="request-row-detail">
                        {guardian.address || "Address not provided"}
                      </span>
                    </td>
                    <td>{guardian.email || "N/A"}</td>
                    <td>{guardian.contactNumber || "N/A"}</td>
                    <td>{formatDate(guardian.submittedAt || guardian.createdAt)}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="primary-btn"
                          onClick={() => setSelectedGuardianRequest(guardian)}
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

export default RequestCenter;
