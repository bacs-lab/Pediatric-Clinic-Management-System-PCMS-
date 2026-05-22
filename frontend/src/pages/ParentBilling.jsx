import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function ParentBilling() {
  const navigate = useNavigate();
  const { patientId } = useParams();

  const [billings, setBillings] = useState([]);

  useEffect(() => {
  fetch(
    `http://localhost:5000/api/billings/patient/${patientId}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  )
    .then((res) => res.json())
    .then((data) => setBillings(data))
    .catch((err) => console.log(err));
}, [patientId]);

  return (
    <div className="layout">
      <div className="sidebar">
        <h2>Parent Portal</h2>

        <ul>
          <li>
            <button onClick={() => navigate("/parent/dashboard")}>
              Dashboard
            </button>
          </li>

          <li>
            <button onClick={() => navigate(-1)}>
              Back
            </button>
          </li>
        </ul>
      </div>

      <div className="main-content">
        <h1 className="page-title">
          Billing History
        </h1>

        <div className="table-container">
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
              {billings.map((billing) => (
                <tr key={billing._id}>
                  <td>₱{billing.totalAmount}</td>

                  <td>{billing.paymentStatus}</td>

                  <td>{billing.remarks}</td>

                  <td>
                    {new Date(
                      billing.createdAt
                    ).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ParentBilling;