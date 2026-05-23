import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../utils/authFetch";

function InventoryList() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showLowStock, setShowLowStock] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    itemName: "",
    category: "Medicine",
    stockQuantity: "",
    unit: "pcs",
    price: "",
    expirationDate: "",
    lowStockLevel: 10,
  });

  const token = localStorage.getItem("token");

  const fetchItems = () => {
    authFetch("http://localhost:5000/api/inventory")
      .then((res) => res.json())
      .then((data) => setItems(data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;

    console.log("Attempting to delete ID:", id);

    try {
      const res = await fetch(`http://localhost:5000/api/inventory/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      if (res.ok) {
        setItems((prev) => prev.filter((item) => item._id !== id));
      } else {
        console.error("Server responded with:", res.status);
        const data = await res.json().catch(() => ({}));
        alert(data.message || `Delete failed (status ${res.status})`);
      }
    } catch (err) {
      alert("Network error — is the backend server running?");
    }
  };

  const openEdit = (item) => {
    setEditingItem(item._id);
    setEditForm({
      itemName: item.itemName,
      category: item.category,
      stockQuantity: item.stockQuantity,
      unit: item.unit,
      price: item.price,
      expirationDate: item.expirationDate
        ? new Date(item.expirationDate).toISOString().split("T")[0]
        : "",
      lowStockLevel: item.lowStockLevel,
    });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (!editForm.itemName.trim()) {
      alert("Item name is required");
      return;
    }

    const payload = {
      ...editForm,
      stockQuantity: Number(editForm.stockQuantity) || 0,
      price: Number(editForm.price) || 0,
      lowStockLevel: Number(editForm.lowStockLevel) || 10,
      expirationDate: editForm.expirationDate || undefined,
    };

    const res = await fetch(
      `http://localhost:5000/api/inventory/${editingItem}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (res.ok) {
      const updated = await res.json();
      setItems((prev) =>
        prev.map((item) => (item._id === editingItem ? updated : item))
      );
      setEditingItem(null);
    } else {
      alert("Failed to update item.");
    }
  };

  const categories = [...new Set(items.map((i) => i.category))];

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.itemName
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory = categoryFilter
      ? item.category === categoryFilter
      : true;

    const matchesLowStock = showLowStock
      ? item.stockQuantity <= item.lowStockLevel
      : true;

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const getStatus = (item) => {
    if (item.stockQuantity === 0) return { label: "Out of Stock", cls: "missed" };
    if (item.stockQuantity <= item.lowStockLevel)
      return { label: "Low Stock", cls: "unpaid" };
    if (
      item.expirationDate &&
      new Date(item.expirationDate) <
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    )
      return { label: "Expiring Soon", cls: "pending" };
    return { label: item.status || "Available", cls: "paid" };
  };

  return (
    <div className="dashboard-bg">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">CLINIC STOCK CONTROL</p>
          <h1>Inventory</h1>
          <span>
            Monitor medicines, vaccines, supplies, stocks, and expiration dates.
          </span>
        </div>

        <button
          className="primary-btn"
          onClick={() => navigate("/staff/create-inventory")}
        >
          + Add Item
        </button>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Inventory Items</h2>
          <span style={{ color: "#64748b" }}>
            {filteredItems.length} item(s)
          </span>
        </div>

        <div className="inventory-filters">
          <input
            type="text"
            placeholder="Search inventory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showLowStock}
              onChange={() => setShowLowStock(!showLowStock)}
            />
            Low Stock Only
          </label>
        </div>

        <div className="table-container flat">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Unit</th>
                <th>Price</th>
                <th>Expiration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center" }}>
                    No inventory items found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const status = getStatus(item);

                  return (
                    <tr key={item._id}>
                      <td>
                        <strong>{item.itemName}</strong>
                      </td>
                      <td>{item.category}</td>
                      <td>{item.stockQuantity}</td>
                      <td>{item.unit}</td>
                      <td>₱{Number(item.price).toFixed(2)}</td>
                      <td>
                        {item.expirationDate
                          ? new Date(item.expirationDate).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td>
                        <span className={`status-badge ${status.cls}`}>
                          {status.label}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="primary-btn"
                            onClick={() => openEdit(item)}
                          >
                            Edit
                          </button>
                          <button
                            className="danger-btn"
                            onClick={() => handleDelete(item._id, item.itemName)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div
          className="modal-overlay"
          onClick={() => setEditingItem(null)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Edit Inventory Item</h2>
              <button
                className="modal-close"
                onClick={() => setEditingItem(null)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="form-label">Item Name</label>
                <input
                  name="itemName"
                  value={editForm.itemName}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  name="category"
                  value={editForm.category}
                  onChange={handleEditChange}
                >
                  <option>Medicine</option>
                  <option>Vaccine</option>
                  <option>Supply</option>
                </select>
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label className="form-label">Stock Quantity</label>
                  <input
                    name="stockQuantity"
                    type="number"
                    value={editForm.stockQuantity}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <input
                    name="unit"
                    value={editForm.unit}
                    onChange={handleEditChange}
                  />
                </div>
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label className="form-label">Price (₱)</label>
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    value={editForm.price}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Low Stock Level</label>
                  <input
                    name="lowStockLevel"
                    type="number"
                    value={editForm.lowStockLevel}
                    onChange={handleEditChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Expiration Date</label>
                <input
                  name="expirationDate"
                  type="date"
                  value={editForm.expirationDate}
                  onChange={handleEditChange}
                />
              </div>

              <div className="modal-buttons">
                <button
                  type="button"
                  className="danger-btn"
                  onClick={() => setEditingItem(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-btn">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryList;