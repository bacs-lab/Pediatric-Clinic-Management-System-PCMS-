import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Topbar from "../components/Topbar";

function QueueList() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);

  const fetchQueue = () => {
    fetch("http://localhost:5000/api/queue", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setQueue(data))
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const updateStatus = async (id, status) => {
    const res = await fetch(`http://localhost:5000/api/queue/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ status }),
    });

    if (res.ok) fetchQueue();
    else alert("Failed to update queue");
  };

  return (
    <div className="layout">
      <div className="sidebar">
        <h2>KIDS FIRST</h2>
        <ul>
          <li><button onClick={() => navigate("/staff/dashboard")}>Dashboard</button></li>
          <li><button onClick={() => navigate("/staff/appointments")}>Appointments</button></li>
          <li><button onClick={() => navigate("/staff/patients")}>Patients</button></li>
          <li><button onClick={() => navigate(-1)}>Back</button></li>
        </ul>
      </div>

      <div className="main-content dashboard-bg">
        <Topbar />
        <div className="dashboard-hero">
          <div>
            <p className="eyebrow">CLINIC PATIENT FLOW</p>
            <h1>Queue Management</h1>
            <span>Track patients from waiting area to billing completion.</span>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Current Queue</h2>
            <span style={{ color: "#64748b" }}>
              {queue.length} queue item(s)
            </span>
          </div>

          <div className="table-container flat">
            <table>
              <thead>
                <tr>
                  <th>Queue #</th>
                  <th>Patient</th>
                  <th>Status</th>
                  <th>Update / Action</th>
                </tr>
              </thead>

              <tbody>
                {queue.length === 0 ? (
                  <tr>
                    <td colSpan="4">No patients in queue.</td>
                  </tr>
                ) : (
                  queue.map((item) => (
                    <tr key={item._id}>
                      <td><strong>#{item.queueNumber}</strong></td>
                      <td><strong>{item.patientName}</strong></td>
                      <td>
                        <span className={`status-badge ${item.status.toLowerCase().replaceAll(" ", "-")}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <select
                          value={item.status}
                          onChange={(e) => updateStatus(item._id, e.target.value)}
                          style={{ maxWidth: "220px", marginBottom: "0", marginRight: "8px" }}
                        >
                          <option>Waiting</option>
                          <option>In Assessment</option>
                          <option>For Consultation</option>
                          <option>In Consultation</option>
                          <option>For Billing</option>
                          <option>Completed</option>
                          <option>Cancelled</option>
                        </select>

                        {item.status === "In Assessment" && (
                          <button
                            className="primary-btn"
                            onClick={() =>
                              navigate("/staff/create-assessment", { state: item })
                            }
                          >
                            Assess
                          </button>
                        )}

                        {item.status === "For Consultation" && (
                          <button
                            className="primary-btn"
                            onClick={() =>
                              navigate("/staff/create-consultation", { state: item })
                            }
                          >
                            Consult
                          </button>
                        )}

                        {item.status === "For Billing" && (
                          <button
                            className="primary-btn"
                            onClick={() =>
                              navigate("/staff/create-billing", { state: item })
                            }
                          >
                            Billing
                          </button>
                        )}
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

export default QueueList;