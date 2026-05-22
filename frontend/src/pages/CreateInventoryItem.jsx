import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Topbar from "../components/Topbar";

function CreateInventoryItem() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    itemName: "",
    category: "Medicine",
    stockQuantity: "",
    unit: "pcs",
    price: "",
    expirationDate: "",
    lowStockLevel: 10,
    status: "Available",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.itemName.trim()) {
  alert("Item name is required");
  return;
}

if (!form.category) {
  alert("Category is required");
  return;
}

if (Number(form.stockQuantity) < 0) {
  alert("Stock quantity cannot be negative");
  return;
}

if (Number(form.price) < 0) {
  alert("Price cannot be negative");
  return;
}

if (Number(form.lowStockLevel) < 0) {
  alert("Low stock level cannot be negative");
  return;
}

    const res = await fetch("http://localhost:5000/api/inventory", {
      method: "POST",
      headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
},
      body: JSON.stringify(form),
    });

    if (res.ok) {
      alert("Inventory item added!");
      navigate("/staff/inventory");
    } else {
      alert("Failed to add item");
    }
  };

  return (
    <div className="layout">
      <div className="sidebar">
        <h2>PCMS Staff</h2>
        <ul>
          <li><button onClick={() => navigate("/staff/inventory")}>Inventory</button></li>
          <li><button onClick={() => navigate(-1)}>Back</button></li>
        </ul>
      </div>

      <div className="main-content">
        <Topbar />
        <h1 className="page-title">Add Inventory Item</h1>

        <form onSubmit={handleSubmit}>
          <input name="itemName" placeholder="Item Name" value={form.itemName} onChange={handleChange} />

          <select name="category" value={form.category} onChange={handleChange}>
            <option>Medicine</option>
            <option>Vaccine</option>
            <option>Supply</option>
          </select>

          <input name="stockQuantity" type="number" placeholder="Stock Quantity" value={form.stockQuantity} onChange={handleChange} />
          <input name="unit" placeholder="Unit" value={form.unit} onChange={handleChange} />
          <input name="price" type="number" placeholder="Price" value={form.price} onChange={handleChange} />
          <input name="expirationDate" type="date" value={form.expirationDate} onChange={handleChange} />
          <input name="lowStockLevel" type="number" placeholder="Low Stock Level" value={form.lowStockLevel} onChange={handleChange} />

          <button className="primary-btn" type="submit">Add Item</button>
        </form>
      </div>
    </div>
  );
}

export default CreateInventoryItem;