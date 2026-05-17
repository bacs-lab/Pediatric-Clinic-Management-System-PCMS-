import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function BillingList() {
  const navigate = useNavigate();
  const [billings, setBillings] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/billings")
      .then((res) => res.json())
      .then((data) => setBillings(data))
      .catch((err) => console.log(err));
  }, []);

  return (
    <div className="layout">
      <div className="sidebar">
        <h2>PCMS Staff</h2>
        <ul>
          <li><button onClick={() => navigate("/staff/dashboard")}>Dashboard</button></li>
          <li><button onClick={() => navigate("/staff/queue")}>Queue</button></li>
          <li><button onClick={() => navigate(-1)}>Back</button></li>
        </ul>
      </div>

      <div className="main-content">
        <h1 className="page-title">Billing Records</h1>

        <div className="table-container">
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
              {billings.map((billing) => (
                <tr key={billing._id}>
                  <td>{billing.patientName}</td>
                  <td>₱{billing.consultationFee}</td>
                  <td>₱{billing.medicineFee}</td>
                  <td>₱{billing.vaccineFee}</td>
                  <td>₱{billing.otherFee}</td>
                  <td>₱{billing.totalAmount}</td>
                  <td>{billing.paymentStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default BillingList;