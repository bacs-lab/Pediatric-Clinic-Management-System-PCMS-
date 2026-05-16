import { useState } from "react";
import { useNavigate } from "react-router-dom";

function CreateParent() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    contactNumber: "",
    address: "",
    relationshipToChild: "",
    emergencyContact: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // CREATE USER ACCOUNT
      const userRes = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.fullName,
            email: form.email,
            password: form.password,
            role: "parent",
          }),
        }
      );

      const userData = await userRes.json();

      if (!userRes.ok) {
        alert(userData.message || "Failed to create parent account");
        return;
      }

      // CREATE PARENT PROFILE
      const profileRes = await fetch(
        "http://localhost:5000/api/parent-profiles",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: userData.user._id,
            fullName: form.fullName,
            contactNumber: form.contactNumber,
            address: form.address,
            relationshipToChild: form.relationshipToChild,
            emergencyContact: form.emergencyContact,
          }),
        }
      );

      if (profileRes.ok) {
        alert("Parent account and profile created!");
        navigate("/staff/dashboard");
      } else {
        alert("Failed to create parent profile");
      }
    } catch (error) {
      console.log(error);
      alert("Something went wrong");
    }
  };

  return (
    <div className="layout">
      <div className="sidebar">
        <h2>PCMS Staff</h2>

        <ul>
          <li>
            <button onClick={() => navigate("/staff/dashboard")}>
              Dashboard
            </button>
          </li>

          <li>
            <button onClick={() => navigate(-1)}>
              Back
            </button>
          </li>
        </ul>
      </div>

      <div className="main-content">
        <h1 className="page-title">Create Guardian Account</h1>

        <form onSubmit={handleSubmit}>
          <input
            name="fullName"
            placeholder="Full Name"
            value={form.fullName}
            onChange={handleChange}
          />

          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
          />

          <input
            name="contactNumber"
            placeholder="Contact Number"
            value={form.contactNumber}
            onChange={handleChange}
          />

          <input
            name="address"
            placeholder="Address"
            value={form.address}
            onChange={handleChange}
          />

          <input
            name="relationshipToChild"
            placeholder="Relationship to Child"
            value={form.relationshipToChild}
            onChange={handleChange}
          />

          <input
            name="emergencyContact"
            placeholder="Emergency Contact"
            value={form.emergencyContact}
            onChange={handleChange}
          />

          <button className="primary-btn" type="submit">
            Create Guardian
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateParent;