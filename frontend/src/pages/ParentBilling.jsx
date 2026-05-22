import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Topbar from "../components/Topbar";

function ParentBilling() {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const [billings, setBillings] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:5000/api/billings/patient/${patientId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setBillings(data))
      .catch((err) => console.log(err));
  }, [patientId]);

  return (
    <div className="layout">
      <div className="sidebar">
        <h2>KIDS FIRST</h2>

        <ul>
          <li><button onClick={() => navigate("/parent/dashboard")}>Dashboard</button></li>
          <li><button onClick={() => navigate(-1)}>Back</button></li>
        </ul>
      </div>

      <div className="main-content dashboard-bg">
        <Topbar />
        <div className="dashboard-hero">
          <div>
            <p className="eyebrow">PARENT BILLING PORTAL</p>
            <h1>Billing History</h1>
            <span>View clinic payment records and billing status.</span>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Billing Records</h2>
            <span style={{ color: "#64748b" }}>
              {billings.length} billing record(s)
            </span>
          </div>

          <div className="table-container flat">
            <table>
              <thead>
                <tr>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Remarks</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {billings.length === 0 ? (
                  <tr>
                    <td colSpan="4">No billing records found.</td>
                  </tr>
                ) : (
                  billings.map((billing) => (
                    <tr key={billing._id}>
                      <td><strong>₱{billing.totalAmount}</strong></td>
                      <td>
                        <span className={`status-badge ${billing.paymentStatus.toLowerCase()}`}>
                          {billing.paymentStatus}
                        </span>
                      </td>
                      <td>{billing.remarks || "N/A"}</td>
                      <td>{new Date(billing.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ParentBilling;