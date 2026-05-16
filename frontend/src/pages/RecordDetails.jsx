import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function RecordDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/api/records/${id}`)
      .then((res) => res.json())
      .then((data) => setRecord(data));
  }, [id]);
  const handleDelete = async () => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this medical record?"
  );

  if (!confirmDelete) return;

  try {
    const res = await fetch(`http://localhost:5000/api/records/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      alert("Medical record deleted!");
      navigate("/staff/dashboard");
      return;
    }

    const text = await res.text();
    console.log("Delete failed:", text);
    alert("Failed to delete record");
  } catch (error) {
    console.log("Delete error:", error);
    alert("Something went wrong");
  }
};

  if (!record) return <p>Loading...</p>;

  return (
    <div>
      <button onClick={() => navigate("/staff/dashboard")}>Back</button>

      <h1>{record.patientName}</h1>
      <p>Age: {record.age}</p>
      <p>Gender: {record.gender}</p>
      <p>Phone: {record.phone}</p>
      <p>Address: {record.address}</p>
      <p>Chief Complaint: {record.chiefComplaint}</p>
      <p>Diagnosis: {record.diagnosis}</p>
      <p>Treatment: {record.treatment}</p>
      <p>Prescription: {record.prescription}</p>
      <p>Doctor: {record.doctorName}</p>
      <button onClick={() => navigate(`/staff/records/${record._id}/edit`)}>
  Edit Record
</button>
<button onClick={handleDelete}>
        Delete Record
      </button>
    </div>
  );
}
export default RecordDetails;