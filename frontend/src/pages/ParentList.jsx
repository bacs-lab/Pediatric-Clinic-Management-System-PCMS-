import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import CreateParent from "./CreateParent";
import Pagination from "../components/Pagination";
import { apiUrl, authHeaders } from "../utils/api";
import { notify } from "../utils/notify";

function ParentList() {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const canAddGuardian = user.role !== "admin";
  const canManageGuardians = user.role === "admin";
  const [parents, setParents] = useState([]);
  const [search, setSearch] = useState(() => location.state?.search || "");
  const [sortBy, setSortBy] = useState("alphabetical"); // "alphabetical" or "newest"
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  const [addOpen, setAddOpen] = useState(false);
  const [editingParent, setEditingParent] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const fetchParents = () => {
    fetch(apiUrl("/api/parent-profiles"), {
      headers: authHeaders(),
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
      parent.address,
    ]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(search.toLowerCase()))
  );

  const sortedParents = [...filteredParents].sort((a, b) => {
    if (sortBy === "alphabetical") {
      return (a.fullName || "").localeCompare(b.fullName || "");
    } else if (sortBy === "newest") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    return 0;
  });

  const totalPages = Math.ceil(sortedParents.length / recordsPerPage);
  const currentRecords = sortedParents.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortBy]);

  const deleteGuardian = async () => {
    if (!pendingDelete) return;

    const res = await fetch(apiUrl(`/api/parent-profiles/${pendingDelete._id}`), {
      method: "DELETE",
      headers: authHeaders(),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      notify(data.message || "Failed to delete guardian profile");
      return;
    }

    setParents((current) => current.filter((item) => item._id !== pendingDelete._id));
    setPendingDelete(null);
    notify("Guardian profile deleted.");
  };

  return (
    <div className="dashboard-bg">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">GUARDIAN MANAGEMENT</p>
          <h1>Guardians</h1>
          <span>Manage registered parents and guardians.</span>
        </div>

        {canAddGuardian && (
          <button
            className="primary-btn"
            onClick={() => setAddOpen(true)}
          >
            <span className="ti ti-user-plus" />
            Add Guardian
          </button>
        )}
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
          <select
            className="filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="alphabetical">Alphabetical (A-Z)</option>
            <option value="newest">Date (Newest to Oldest)</option>
          </select>
        </div>

        <div className="table-container flat">
          <table>
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Contact</th>
                <th>Address</th>
                {canManageGuardians && <th>Action</th>}
              </tr>
            </thead>

            <tbody>
              {currentRecords.length === 0 ? (
                <tr>
                  <td colSpan={canManageGuardians ? 4 : 3}>No guardians found.</td>
                </tr>
              ) : (
                currentRecords.map((parent) => (
                  <tr key={parent._id}>
                    <td><strong>{parent.fullName}</strong></td>
                    <td>{parent.contactNumber}</td>
                    <td>{parent.address || "N/A"}</td>
                    {canManageGuardians && (
                      <td>
                        <div className="table-actions">
                          <button
                            className="secondary-btn"
                            onClick={() => setEditingParent(parent)}
                          >
                            Edit
                          </button>
                          <button
                            className="danger-btn"
                            onClick={() => setPendingDelete(parent)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
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

      {editingParent && (
        <div className="modal-overlay" onClick={() => setEditingParent(null)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <CreateParent
              embedded
              editMode
              parentProfile={editingParent}
              onCancel={() => setEditingParent(null)}
              onSaved={() => {
                setEditingParent(null);
                fetchParents();
              }}
            />
          </div>
        </div>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete guardian profile?"
          message={`${pendingDelete.fullName} will be removed from the guardian list. This will not remove existing child records.`}
          confirmLabel="Delete Guardian"
          onCancel={() => setPendingDelete(null)}
          onConfirm={deleteGuardian}
        />
      )}
    </div>
  );
}

export default ParentList;
