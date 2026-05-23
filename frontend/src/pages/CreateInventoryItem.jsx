import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../utils/api";
import { notify } from "../utils/notify";

function CreateInventoryItem({ embedded = false, onCancel, onSaved }) {
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
  notify("Item name is required");
  return;
}

if (!form.category) {
  notify("Category is required");
  return;
}

if (Number(form.stockQuantity) < 0) {
  notify("Stock quantity cannot be negative");
  return;
}

if (Number(form.price) < 0) {
  notify("Price cannot be negative");
  return;
}

if (Number(form.lowStockLevel) < 0) {
  notify("Low stock level cannot be negative");
  return;
}

    const payload = {
      ...form,
      stockQuantity: form.stockQuantity ? Number(form.stockQuantity) : 0,
      price: form.price ? Number(form.price) : 0,
      lowStockLevel: form.lowStockLevel ? Number(form.lowStockLevel) : 10,
      expirationDate: form.expirationDate || undefined,
      status: "Available",
    };

    const res = await fetch(apiUrl("/api/inventory"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      notify("Inventory item added!");
      if (onSaved) onSaved();
      else navigate("/staff/inventory");
    } else {
      const data = await res.json().catch(() => ({}));
      notify(data.message || "Failed to add item");
    }
  };

  return (
    <>
        <h1 className={embedded ? "modal-title" : "page-title"}>Add Inventory Item</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Item Name</label>
            <input name="itemName" placeholder="Item Name" value={form.itemName} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select name="category" value={form.category} onChange={handleChange}>
              <option>Medicine</option>
              <option>Vaccine</option>
              <option>Supply</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Stock Quantity</label>
            <input name="stockQuantity" type="number" placeholder="Stock Quantity" value={form.stockQuantity} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Unit</label>
            <input name="unit" placeholder="Unit" value={form.unit} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Price (₱)</label>
            <input name="price" type="number" placeholder="Price" value={form.price} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Expiration Date</label>
            <input name="expirationDate" type="date" value={form.expirationDate} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Low Stock Level</label>
            <input name="lowStockLevel" type="number" placeholder="Low Stock Level" value={form.lowStockLevel} onChange={handleChange} />
          </div>

          <div className="modal-buttons">
            {embedded && (
              <button className="secondary-btn" type="button" onClick={onCancel}>
                Cancel
              </button>
            )}
            <button className="primary-btn" type="submit">Add Item</button>
          </div>
        </form>
      </>
    );
}

export default CreateInventoryItem;
