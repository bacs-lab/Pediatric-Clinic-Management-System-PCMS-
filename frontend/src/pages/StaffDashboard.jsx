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
      .then((data) => setRecords(data))
      .catch((err) => console.log(err));
  }, []);

  return (
    <div>
      <h1>Clinic Staff Dashboard</h1>
      <button onClick={logout}>Logout</button>

      <h2>Medical Records</h2>
      <button onClick={() => navigate("/staff/create-record")}>
  Add Medical Record
</button>

      {records.length === 0 ? (
        <p>No records found.</p>
      ) : (
        <table border="1" cellPadding="10">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Complaint</th>
              <th>Diagnosis</th>
              <th>Doctor</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {records.map((record) => (
              <tr key={record._id}>
                <td>{record.patientName}</td>
                <td>{record.age}</td>
                <td>{record.gender}</td>
                <td>{record.chiefComplaint}</td>
                <td>{record.diagnosis}</td>
                <td>{record.doctorName}</td>
                <td>
  <button onClick={() => navigate(`/staff/records/${record._id}`)}>
    View
  </button>
</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default StaffDashboard;