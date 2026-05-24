import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import { apiUrl, authHeaders } from "../utils/api";

function ParentChildList({ type, title, subtitle, icon }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const userId = user.id || user._id || "";

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/patients/guardian/${userId}`), {
        headers: authHeaders(),
      });
      const data = await res.json();
      const activeOnly = Array.isArray(data)
        ? data.filter((p) => (p.status || "Active") === "Active")
        : [];

      // Filter children that have data for the specific type
      const filtered = await Promise.all(
        activeOnly.map(async (patient) => {
          let endpoint = "";
          if (type === "records") endpoint = `/api/records/patient/${patient._id}`;
          else if (type === "billing") endpoint = `/api/billings/patient/${patient._id}`;
          else if (type === "vaccines") endpoint = `/api/vaccines/patient/${patient._id}`;

          if (!endpoint) return patient;

          try {
            const dataRes = await fetch(apiUrl(endpoint), {
              headers: authHeaders(),
            });
            const items = await dataRes.json();
            return Array.isArray(items) && items.length > 0 ? patient : null;
          } catch (err) {
            console.error(`Error fetching ${type} for patient ${patient._id}:`, err);
            return null;
          }
        })
      );

      setPatients(filtered.filter(Boolean));
    } catch (error) {
      console.error("Error loading children list:", error);
    } finally {
      setLoading(false);
    }
  }, [userId, type]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <LoadingState title={`Checking ${title} records...`} />;

  return (
    <div className="dashboard-bg">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">PARENT PORTAL</p>
          <h1>{title}</h1>
          <span>{subtitle}</span>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Select Child</h2>
          <span>{patients.length} child record(s) with {title.toLowerCase()} data</span>
        </div>

        {patients.length === 0 ? (
          <EmptyState
            icon={icon}
            title={`No ${title.toLowerCase()} found`}
            message={`None of your children have ${title.toLowerCase()} data at this time.`}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
            {patients.map((patient) => (
              <div
                key={patient._id}
                className="child-card"
                style={{ cursor: 'pointer', margin: 0 }}
                onClick={() => navigate(`/parent/patient/${patient._id}/${type}`)}
              >
                <div style={{ flex: 1 }}>
                  <div className="child-title-row">
                    <h2 style={{ fontSize: '20px' }}>
                      {patient.firstName} {patient.lastName}
                    </h2>
                  </div>
                  <p><strong>Age:</strong> {patient.age} years old</p>
                  <p><strong>Gender:</strong> {patient.gender}</p>
                </div>
                <div style={{ display: 'grid', placeItems: 'center', width: '48px' }}>
                   <span className="ti ti-chevron-right" style={{ fontSize: '24px', color: 'var(--blue)' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ParentChildList;
