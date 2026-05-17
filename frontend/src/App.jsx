import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import StaffDashboard from "./pages/StaffDashboard";
import ParentDashboard from "./pages/ParentDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import CreateRecord from "./pages/CreateRecord";
import EditRecord from "./pages/EditRecord";
import RecordDetails from "./pages/RecordDetails";
import ParentPatientRecords from "./pages/ParentPatientRecords";
import CreateParent from "./pages/CreateParent";
import ParentList from "./pages/ParentList";
import CreatePatient from "./pages/CreatePatient";
import PatientList from "./pages/PatientList";
import CreateAppointment from "./pages/CreateAppointment";
import AppointmentList from "./pages/AppointmentList";
import ParentAppointments from "./pages/ParentAppointments";
import QueueList from "./pages/QueueList";
import CreateAssessment from "./pages/CreateAssessment";
import CreateConsultation from "./pages/CreateConsultation";
import CreateBilling from "./pages/CreateBilling";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/staff/dashboard"
          element={
            <ProtectedRoute allowedRole="staff">
              <StaffDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/parent/dashboard"
          element={
            <ProtectedRoute allowedRole="parent">
              <ParentDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/parent/dashboard" element={<ParentDashboard />} />
        <Route
  path="/staff/create-record"
  element={
    <ProtectedRoute allowedRole="staff">
      <CreateRecord />
    </ProtectedRoute>
  }
/>
<Route
  path="/staff/create-parent"
  element={
    <ProtectedRoute allowedRole="staff">
      <CreateParent />
    </ProtectedRoute>
  }
/>
<Route
  path="/staff/parents"
  element={
    <ProtectedRoute allowedRole="staff">
      <ParentList />
    </ProtectedRoute>
  }
/>
<Route
  path="/staff/create-patient"
  element={
    <ProtectedRoute allowedRole="staff">
      <CreatePatient />
    </ProtectedRoute>
  }
/>
<Route
  path="/staff/patients"
  element={
    <ProtectedRoute allowedRole="staff">
      <PatientList />
    </ProtectedRoute>
  }
/>
<Route
  path="/parent/create-appointment"
  element={
    <ProtectedRoute allowedRole="parent">
      <CreateAppointment />
    </ProtectedRoute>
  }
/>
<Route
  path="/staff/appointments"
  element={
    <ProtectedRoute allowedRole="staff">
      <AppointmentList />
    </ProtectedRoute>
  }
/>
<Route
  path="/parent/appointments"
  element={
    <ProtectedRoute allowedRole="parent">
      <ParentAppointments />
    </ProtectedRoute>
  }
/>
<Route
  path="/staff/queue"
  element={
    <ProtectedRoute allowedRole="staff">
      <QueueList />
    </ProtectedRoute>
  }
/>
<Route
  path="/staff/create-assessment"
  element={
    <ProtectedRoute allowedRole="staff">
      <CreateAssessment />
    </ProtectedRoute>
  }
/>
<Route
  path="/staff/create-consultation"
  element={
    <ProtectedRoute allowedRole="staff">
      <CreateConsultation />
    </ProtectedRoute>
  }
/>
<Route
  path="/staff/create-billing"
  element={
    <ProtectedRoute allowedRole="staff">
      <CreateBilling />
    </ProtectedRoute>
  }
/>
<Route
  path="/parent/patient/:patientId/records"
  element={<ParentPatientRecords />}
/>
<Route
  path="/staff/records/:id/edit"
  element={
    <ProtectedRoute allowedRole="staff">
      <EditRecord />
    </ProtectedRoute>
  }
/>
<Route
  path="/staff/records/:id"
  element={
    <ProtectedRoute allowedRole="staff">
      <RecordDetails />
    </ProtectedRoute>
  }
/>
      </Routes>
    </BrowserRouter>
  );
}


export default App;