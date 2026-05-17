import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function QueueList() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);

  const fetchQueue = () => {
    fetch("http://localhost:5000/api/queue")
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (res.ok) fetchQueue();
    else alert("Failed to update queue");
  };

  return (
    <div className="layout">
      <div className="sidebar">
        <h2>PCMS Staff</h2>
        <ul>
          <li><button onClick={() => navigate("/staff/dashboard")}>Dashboard</button></li>
          <li><button onClick={() => navigate("/staff/appointments")}>Appointments</button></li>
          <li><button onClick={() => navigate(-1)}>Back</button></li>
        </ul>
      </div>

      <div className="main-content">
        <h1 className="page-title">Queue Management</h1>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Queue #</th>
                <th>Patient</th>
                <th>Status</th>
                <th>Update Status</th>
              </tr>
            </thead>

            <tbody>
              {queue.map((item) => (
                <tr key={item._id}>
                  <td>{item.queueNumber}</td>
                  <td>{item.patientName}</td>
                  <td>{item.status}</td>
                  <td>
                    <select
                      value={item.status}
                      onChange={(e) => updateStatus(item._id, e.target.value)}
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
      navigate("/staff/create-assessment", {
        state: item,
      })
    }
  >
    Assess
  </button>
)}
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

export default QueueList;