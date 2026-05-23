import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function InventoryList() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [showLowStock, setShowLowStock] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/api/inventory", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setItems(data));
  }, []);

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.itemName
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesLowStock = showLowStock
      ? item.stockQuantity <= item.lowStockLevel
      : true;

    return matchesSearch && matchesLowStock;
  });

  return (
    <div className="dashboard-bg">
        <div className="dashboard-hero">
          <div>
            <p className="eyebrow">CLINIC STOCK CONTROL</p>
            <h1>Inventory</h1>
            <span>Monitor medicines, vaccines, supplies, stocks, and expiration dates.</span>
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

            <input
              type="text"
              placeholder="Search inventory..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: "320px", marginBottom: 0 }}
            />
          </div>

          <label style={{ display: "block", margin: "15px 0", color: "#64748b" }}>
            <input
              type="checkbox"
              checked={showLowStock}
              onChange={() => setShowLowStock(!showLowStock)}
              style={{ width: "auto", marginRight: "8px" }}
            />
            Show Low Stock Only
          </label>

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
                </tr>
              </thead>

              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="7">No inventory items found.</td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isLowStock = item.stockQuantity <= item.lowStockLevel;

                    return (
                      <tr key={item._id}>
                        <td><strong>{item.itemName}</strong></td>
                        <td>{item.category}</td>
                        <td>{item.stockQuantity}</td>
                        <td>{item.unit}</td>
                        <td>₱{item.price}</td>
                        <td>
                          {item.expirationDate
                            ? new Date(item.expirationDate).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td>
                          <span className={`status-badge ${isLowStock ? "unpaid" : "paid"}`}>
                            {isLowStock ? "Low Stock" : item.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
}

export default InventoryList;