import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl, authHeaders } from "../utils/api";
import { notify } from "../utils/notify";

const formatDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const buildInitialForm = (patient) => {
  const source = patient ?? {};

  return ({
  firstName: source.firstName || "",
  lastName: source.lastName || "",
  birthDate: formatDateInput(source.birthDate),
  gender: source.gender || "Male",
  guardianId: source.guardianId || "",
  guardianName: source.guardianName || "",
  relationshipToChild: source.relationshipToChild || "",
  emergencyContact: source.emergencyContact || "",
  contactNumber: source.contactNumber || "",
  address: source.address || "",
  bloodType: source.bloodType || "",
  allergies: source.allergies || "",
  notes: source.notes || "",
  });
};

function CreatePatient({
  embedded = false,
  parentMode = false,
  editMode = false,
  patient = null,
  onCancel,
  onSaved,
}) {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user")) || {};
  const currentUserId = currentUser.id || currentUser._id || "";

  const [guardians, setGuardians] = useState([]);
  const [form, setForm] = useState(() => buildInitialForm(patient));

  useEffect(() => {
    if (parentMode) {
      if (!editMode) {
        setForm((current) => ({
          ...current,
          contactNumber: currentUser.contactNumber || "",
          address: currentUser.address || "",
        }));
      }
      return;
    }

    fetch(apiUrl("/api/parent-profiles"), {
      headers: authHeaders(),
    })
      .then((res) => res.json())
      .then((data) => setGuardians(Array.isArray(data) ? data : []))
      .catch(() => setGuardians([]));
  }, [parentMode]);

  const formTitle = useMemo(() => {
    if (parentMode && editMode) return "Request Child Detail Update";
    if (parentMode) return "Request Child Patient";
    if (editMode) return "Edit Child Patient";
    return "Create Child Patient";
  }, [editMode, parentMode]);

  const submitLabel = useMemo(() => {
    if (parentMode && editMode) return "Submit Update Request";
    if (parentMode) return "Submit Request";
    if (editMode) return "Save Patient";
    return "Create Patient";
  }, [editMode, parentMode]);

  const calculateAge = (birthDate) => {
    if (!birthDate) return "";

    const birth = new Date(birthDate);
    if (Number.isNaN(birth.getTime())) return "";

    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age -= 1;
    }

    return String(Math.max(age, 0));
  };

  const handleGuardianSelect = (event) => {
    const selectedGuardian = guardians.find(
      (guardian) => guardian.userId === event.target.value
    );

    setForm((current) => ({
      ...current,
      guardianId: selectedGuardian?.userId || "",
      guardianName: selectedGuardian?.fullName || "",
      contactNumber: selectedGuardian?.contactNumber || "",
      address: selectedGuardian?.address || "",
    }));
  };

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.firstName.trim()) {
      notify("First name is required");
      return;
    }

    if (!form.lastName.trim()) {
      notify("Last name is required");
      return;
    }

    if (!form.birthDate) {
      notify("Birth date is required");
      return;
    }

    if (!form.gender) {
      notify("Gender is required");
      return;
    }

    if (!parentMode && !form.guardianId) {
      notify("Please select a guardian");
      return;
    }

    if (parentMode && !currentUserId) {
      notify("Please log in again before adding a child");
      return;
    }

    if (!form.relationshipToChild.trim()) {
      notify("Relationship to child is required");
      return;
    }

    if (!form.contactNumber.trim()) {
      notify("Contact number is required");
      return;
    }

    if (form.contactNumber.length < 11) {
      notify("Contact number must be at least 11 digits");
      return;
    }

    if (!form.emergencyContact.trim()) {
      notify("Emergency contact number is required");
      return;
    }

    if (form.emergencyContact.length < 11) {
      notify("Emergency contact number must be at least 11 digits");
      return;
    }

    const payload = {
      ...form,
      guardianId: parentMode ? currentUserId : form.guardianId,
      guardianName: parentMode ? currentUser.name : form.guardianName,
      age: form.birthDate ? Number(calculateAge(form.birthDate)) : undefined,
    };

    let targetUrl = apiUrl("/api/patients");
    let method = "POST";

    if (editMode && patient?._id) {
      method = "PUT";
      targetUrl = parentMode
        ? apiUrl(`/api/patients/${patient._id}/request-edit`)
        : apiUrl(`/api/patients/${patient._id}`);
    }

    const res = await fetch(targetUrl, {
      method,
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      notify(data.message || "Failed to save patient");
      return;
    }

    if (parentMode && editMode) {
      notify(
        patient?.pendingUpdateStatus === "Pending"
          ? "Child detail update request refreshed for clinic review."
          : "Child detail update request submitted for approval."
      );
    } else if (parentMode) {
      notify("Child request submitted for approval!");
    } else if (editMode) {
      notify("Child patient updated.");
    } else {
      notify("Child patient created!");
    }

    if (onSaved) {
      onSaved(data);
      return;
    }

    navigate(parentMode ? "/parent/dashboard" : "/staff/patients");
  };

  return (
    <>
      <h1 className={embedded ? "modal-title" : "page-title"}>{formTitle}</h1>
      {parentMode && editMode && (
        <p className="modal-support-text">
          The clinic team will review these child detail changes before the live patient
          record is updated.
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">First Name</label>
          <input
            name="firstName"
            placeholder="First Name"
            value={form.firstName}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Last Name</label>
          <input
            name="lastName"
            placeholder="Last Name"
            value={form.lastName}
            onChange={handleChange}
          />
        </div>

        {parentMode ? (
          <div className="form-group">
            <label className="form-label">Name of Guardian</label>
            <input
              name="guardianName"
              value={form.guardianName || currentUser.name || "Current parent"}
              readOnly
            />
          </div>
        ) : (
          <div className="form-group">
            <label className="form-label">Name of Guardian</label>
            <select
              name="guardianId"
              value={form.guardianId}
              onChange={handleGuardianSelect}
            >
              <option value="">Select Guardian</option>
              {guardians.map((guardian) => (
                <option key={guardian._id} value={guardian.userId}>
                  {guardian.fullName}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Birth Date</label>
          <input
            name="birthDate"
            type="date"
            value={form.birthDate}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Gender</label>
          <select name="gender" value={form.gender} onChange={handleChange}>
            <option>Male</option>
            <option>Female</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Relationship to Child</label>
          <input
            name="relationshipToChild"
            placeholder="Mother, father, guardian..."
            value={form.relationshipToChild}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Address</label>
          <input
            name="address"
            placeholder="Address"
            value={form.address}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Emergency Contact Number</label>
          <input
            name="emergencyContact"
            placeholder="Emergency Contact Number"
            value={form.emergencyContact}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Blood Type</label>
          <input
            name="bloodType"
            placeholder="Blood Type"
            value={form.bloodType}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Allergies</label>
          <input
            name="allergies"
            placeholder="Allergies"
            value={form.allergies}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea
            name="notes"
            placeholder="Notes"
            value={form.notes}
            onChange={handleChange}
          />
        </div>

        <div className="modal-buttons">
          {embedded && (
            <button className="secondary-btn" type="button" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button className="primary-btn" type="submit">
            {submitLabel}
          </button>
        </div>
      </form>
    </>
  );
}

export default CreatePatient;
