import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Topbar from "../components/Topbar";

function BillingList() {
  const navigate = useNavigate();
  const [billings, setBillings] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/billings", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setBillings(data))
      .catch((err) => console.log(err));
  }, []);

  return (
    <div className="layout">
      <div className="sidebar">
        <h2>KIDS FIRST</h2>

        <ul>
          <li><button onClick={() => navigate("/staff/dashboard")}>Dashboard</button></li>
          <li><button onClick={() => navigate("/staff/queue")}>Queue</button></li>
          <li><button onClick={() => navigate("/staff/reports")}>Reports</button></li>
          <li><button onClick={() => navigate(-1)}>Back</button></li>
        </ul>
      </div>

      <div className="main-content dashboard-bg">
        <Topbar />
        <div className="dashboard-hero">
          <div>
            <p className="eyebrow">FINANCIAL MANAGEMENT</p>
            <h1>Billing Records</h1>
            <span>Monitor clinic billing transactions and payment status.</span>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Billing Transactions</h2>

            <span style={{ color: "#64748b" }}>
              {billings.length} billing record(s)
            </span>
          </div>

          <div className="table-container flat">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Consultation</th>
                  <th>Medicine</th>
                  <th>Vaccine</th>
                  <th>Other</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {billings.length === 0 ? (
                  <tr>
                    <td colSpan="7">No billing records found.</td>
                  </tr>
                ) : (
                  billings.map((billing) => (
                    <tr key={billing._id}>
                      <td>
                        <strong>{billing.patientName}</strong>
                      </td>

                      <td>₱{billing.consultationFee}</td>

                      <td>₱{billing.medicineFee}</td>

                      <td>₱{billing.vaccineFee}</td>

                      <td>₱{billing.otherFee}</td>

                      <td>
                        <strong>₱{billing.totalAmount}</strong>
                      </td>

                      <td>
                        <span
                          className={`status-badge ${billing.paymentStatus.toLowerCase()}`}
                        >
                          {billing.paymentStatus}
                        </span>
                      </td>
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

export default BillingList;