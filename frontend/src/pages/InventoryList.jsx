import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function InventoryList() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/inventory")
      .then((res) => res.json())
      .then((data) => setItems(data));
  }, []);

  return (
    <div className="layout">
      <div className="sidebar">
        <h2>PCMS Staff</h2>
        <ul>
          <li><button onClick={() => navigate("/staff/dashboard")}>Dashboard</button></li>
          <li><button onClick={() => navigate("/staff/create-inventory")}>Add Item</button></li>
        </ul>
      </div>

      <div className="main-content">
        <h1 className="page-title">Inventory</h1>

        <div className="table-container">
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
              {items.map((item) => (
                <tr key={item._id}>
                  <td>{item.itemName}</td>
                  <td>{item.category}</td>
                  <td>{item.stockQuantity}</td>
                  <td>{item.unit}</td>
                  <td>₱{item.price}</td>
                  <td>{item.expirationDate ? new Date(item.expirationDate).toLocaleDateString() : "N/A"}</td>
                  <td>
                    {item.stockQuantity <= item.lowStockLevel
                      ? "Low Stock"
                      : item.status}
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

export default InventoryList;