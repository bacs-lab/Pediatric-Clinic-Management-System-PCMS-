import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function RecordDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/api/records/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setRecord(data))
      .catch((err) => console.log(err));
  }, [id]);

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this medical record?"
    );

    if (!confirmDelete) return;

    const res = await fetch(`http://localhost:5000/api/records/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (res.ok) {
      alert("Medical record deleted!");
      navigate("/staff/dashboard");
    } else {
      alert("Failed to delete record");
    }
  };

  if (!record) return <p>Loading...</p>;

  return (
    <div className="dashboard-bg">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">MEDICAL RECORD</p>
          <h1>Record Details</h1>
          <span>{record.patientName}</span>
        </div>
        <div className="detail-actions">
          <button
            className="primary-btn"
            onClick={() => navigate(`/staff/records/${record._id}/edit`)}
          >
            Edit Record
          </button>
          <button
            className="danger-btn"
            onClick={handleDelete}
          >
            Delete Record
          </button>
        </div>
      </div>

      <div className="card">
        <h2>{record.patientName}</h2>

        <p><strong>Age:</strong> {record.age}</p>
        <p><strong>Gender:</strong> {record.gender}</p>
        <p><strong>Phone:</strong> {record.phone}</p>
        <p><strong>Address:</strong> {record.address}</p>
        <p><strong>Chief Complaint:</strong> {record.chiefComplaint}</p>
        <p><strong>Diagnosis:</strong> {record.diagnosis}</p>
        <p><strong>Treatment:</strong> {record.treatment}</p>
        <p><strong>Prescription:</strong> {record.prescription}</p>
        <p><strong>Doctor:</strong> {record.doctorName}</p>
      </div>
    </div>
  );
}

export default RecordDetails;