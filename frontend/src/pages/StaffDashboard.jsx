import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function StaffDashboard() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  useEffect(() => {
    fetch("http://localhost:5000/api/records")
      .then((res) => res.json())
      .then((data) => setRecords(data));
  }, []);

  return (
    <div className="layout">
      <div className="sidebar">
        <h2>PCMS Staff</h2>

        <ul>
          <li>
            <button onClick={() => navigate("/staff/dashboard")}>
              Dashboard
            </button>
          </li>

          <li>
            <button onClick={() => navigate("/staff/create-record")}>
              Add Record
            </button>
          </li>

          <li>
            <button onClick={logout}>Logout</button>
          </li>
          <li>
  <button onClick={() => navigate("/staff/create-parent")}>
    Add Guardian
  </button>
</li>
<li>
  <button onClick={() => navigate("/staff/parents")}>
    Guardians
  </button>
</li>
<li>
  <button onClick={() => navigate("/staff/create-patient")}>
    Add Patient
  </button>
</li>
<li><button onClick={() => navigate("/staff/patients")}>
    Patients
  </button></li>
  <li>
  <button
    onClick={() => navigate("/staff/appointments")}
  >
    Appointments
  </button>
</li>
<li>
  <button onClick={() => navigate("/staff/queue")}>
    Queue
  </button>
</li>
        </ul>
      </div>

      <div className="main-content">
        <h1 className="page-title">Clinic Staff Dashboard</h1>

        <div className="card">
          <h2>Medical Records</h2>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Diagnosis</th>
                <th>Doctor</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {records.map((record) => (
                <tr key={record._id}>
                  <td>{record.patientName}</td>
                  <td>{record.diagnosis}</td>
                  <td>{record.doctorName}</td>

                  <td>
                    <button
                      className="primary-btn"
                      onClick={() =>
                        navigate(`/staff/records/${record._id}`)
                      }
                    >
                      View
                    </button>
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

export default StaffDashboard;