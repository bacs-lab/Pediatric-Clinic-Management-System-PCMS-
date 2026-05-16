import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function ParentList() {
  const [parents, setParents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/api/parent-profiles")
      .then((res) => res.json())
      .then((data) => setParents(data));
  }, []);

  return (
    <div className="layout">
      <div className="sidebar">
        <h2>PCMS Staff</h2>
        <ul>
          <li><button onClick={() => navigate("/staff/dashboard")}>Dashboard</button></li>
          <li><button onClick={() => navigate("/staff/create-parent")}>Add Guardian</button></li>
        </ul>
      </div>

      <div className="main-content">
        <h1 className="page-title">Guardians</h1>

        {parents.map((parent) => (
          <div className="card" key={parent._id}>
            <h2>{parent.fullName}</h2>
            <p><strong>Contact:</strong> {parent.contactNumber}</p>
            <p><strong>Address:</strong> {parent.address}</p>
            <p><strong>Relationship:</strong> {parent.relationshipToChild}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ParentList;