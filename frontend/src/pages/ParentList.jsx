import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import CreateParent from "./CreateParent";
import { apiUrl } from "../utils/api";

function ParentList() {
  const location = useLocation();
  const [parents, setParents] = useState([]);
  const [search, setSearch] = useState(() => location.state?.search || "");
  const [addOpen, setAddOpen] = useState(false);

  const fetchParents = () => {
    fetch(apiUrl("/api/parent-profiles"), {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setParents(data))
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    fetchParents();
  }, []);

  useEffect(() => {
    if (location.state?.modal === "add-guardian" || location.state?.search) {
      const timer = window.setTimeout(() => {
        if (location.state?.search) setSearch(location.state.search);
        if (location.state?.modal === "add-guardian") setAddOpen(true);
      }, 0);
      window.history.replaceState({}, document.title);
      return () => window.clearTimeout(timer);
    }
  }, [location.state]);

  const filteredParents = parents.filter((parent) =>
    [
      parent.fullName,
      parent.contactNumber,
      parent.relationshipToChild,
      parent.emergencyContact,
      parent.address,
    ]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(search.toLowerCase()))
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
          onClick={() => setAddOpen(true)}
        >
          <span className="ti ti-user-plus" />
          Add Guardian
        </button>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Registered Guardians</h2>
          <span>{filteredParents.length} guardian(s) found</span>
        </div>

        <div className="inventory-filters">
          <input
            type="text"
            className="search-input"
            placeholder="Search guardian..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

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

      {addOpen && (
        <div className="modal-overlay" onClick={() => setAddOpen(false)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <CreateParent
              embedded
              onCancel={() => setAddOpen(false)}
              onSaved={() => {
                setAddOpen(false);
                fetchParents();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ParentList;
