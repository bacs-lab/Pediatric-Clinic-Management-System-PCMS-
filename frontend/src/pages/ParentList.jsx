import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function ParentList() {
  const [parents, setParents] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/api/parent-profiles", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setParents(data))
      .catch((err) => console.log(err));
  }, []);

  const filteredParents = parents.filter((parent) =>
    parent.fullName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dashboard-bg">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">GUARDIAN MANAGEMENT</p>
          <h1>Guardians</h1>
          <span>Manage registered parents and guardians.</span>
        </div>

        <button
          className="primary-btn"
          onClick={() => navigate("/staff/create-parent")}
        >
          + Add Guardian
        </button>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Registered Guardians</h2>

          <input
            type="text"
            className="search-input"
            placeholder="Search guardian..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <p style={{ margin: "10px 0 20px", color: "#64748b" }}>
          {filteredParents.length} guardian(s) found
        </p>

        <div className="table-container flat">
          <table>
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Contact</th>
                <th>Relationship</th>
                <th>Emergency Contact</th>
              </tr>
            </thead>

            <tbody>
              {filteredParents.length === 0 ? (
                <tr>
                  <td colSpan="4">No guardians found.</td>
                </tr>
              ) : (
                filteredParents.map((parent) => (
                  <tr key={parent._id}>
                    <td><strong>{parent.fullName}</strong></td>
                    <td>{parent.contactNumber}</td>
                    <td>{parent.relationshipToChild || "N/A"}</td>
                    <td>{parent.emergencyContact || "N/A"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ParentList;