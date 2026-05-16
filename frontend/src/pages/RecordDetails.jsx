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
    </div>
  );
}
export default RecordDetails;