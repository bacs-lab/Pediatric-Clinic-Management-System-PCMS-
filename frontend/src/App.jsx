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
import BillingList from "./pages/BillingList";
import ParentBilling from "./pages/ParentBilling";
import InventoryList from "./pages/InventoryList";
import CreateInventoryItem from "./pages/CreateInventoryItem";
import VaccineList from "./pages/VaccineList";
import CreateVaccineRecord from "./pages/CreateVaccineRecord";
import ParentVaccines from "./pages/ParentVaccines";
import Reports from "./pages/Reports";



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/staff/dashboard"
          element={
            <ProtectedRoute allowedRoles={["staff", "admin", "doctor", "nurse", "secretary"]}>
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
    <ProtectedRoute allowedRoles={["staff", "admin", "doctor", "nurse", "secretary"]}>
      <CreateRecord />
    </ProtectedRoute>
  }
/>
<Route
  path="/staff/create-parent"
  element={
    <ProtectedRoute allowedRoles={["staff", "admin", "doctor", "nurse", "secretary"]}>
      <CreateParent />
    </ProtectedRoute>
  }
/>
<Route
  path="/staff/parents"
  element={
    <ProtectedRoute allowedRoles={["staff", "admin", "doctor", "nurse", "secretary"]}>
      <ParentList />
    </ProtectedRoute>
  }
/>
<Route
  path="/staff/create-patient"
  element={
    <ProtectedRoute allowedRoles={["staff", "admin", "doctor", "nurse", "secretary"]}>
      <CreatePatient />
    </ProtectedRoute>
  }
/>
<Route
  path="/staff/patients"
  element={
    <ProtectedRoute allowedRoles={["staff", "admin", "doctor", "nurse", "secretary"]}>
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
    <ProtectedRoute allowedRoles={["staff", "admin", "doctor", "nurse", "secretary"]}>
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
    <ProtectedRoute allowedRoles={["staff", "admin", "doctor", "nurse", "secretary"]}>
      <QueueList />
    </ProtectedRoute>
  }
/>
<Route
  path="/staff/create-assessment"
  element={
    <ProtectedRoute allowedRoles={["staff", "admin", "doctor", "nurse", "secretary"]}>
      <CreateAssessment />
    </ProtectedRoute>
  }
/>
<Route
  path="/staff/create-consultation"
  element={
    <ProtectedRoute allowedRoles={["staff", "admin", "doctor", "nurse", "secretary"]}>
      <CreateConsultation />
    </ProtectedRoute>
  }
/>
<Route
  path="/staff/create-billing"
  element={
    <ProtectedRoute allowedRoles={["staff", "admin", "doctor", "nurse", "secretary"]}>
      <CreateBilling />
    </ProtectedRoute>
  }
/>
<Route
  path="/staff/billings"
  element={
    <ProtectedRoute allowedRoles={["staff", "admin", "doctor", "nurse", "secretary"]}>
      <BillingList />
    </ProtectedRoute>
  }
/>
<Route
  path="/parent/patient/:patientId/billing"
  element={
    <ProtectedRoute allowedRole="parent">
      <ParentBilling />
    </ProtectedRoute>
  }
/>
<Route
  path="/staff/inventory"
  element={
    <ProtectedRoute allowedRoles={["staff", "admin", "doctor", "nurse", "secretary"]}>
      <InventoryList />
    </ProtectedRoute>
  }
/>
<Route
  path="/staff/create-inventory"
  element={
    <ProtectedRoute allowedRoles={["staff", "admin", "doctor", "nurse", "secretary"]}>
      <CreateInventoryItem />
    </ProtectedRoute>
  }
/>
<Route
  path="/staff/vaccines"
  element={
    <ProtectedRoute allowedRoles={["staff", "admin", "doctor", "nurse", "secretary"]}>
      <VaccineList />
    </ProtectedRoute>
  }
/>

<Route
  path="/staff/create-vaccine"
  element={
    <ProtectedRoute allowedRoles={["staff", "admin", "doctor", "nurse", "secretary"]}>
      <CreateVaccineRecord />
    </ProtectedRoute>
  }
/>
<Route
  path="/parent/patient/:patientId/vaccines"
  element={
    <ProtectedRoute allowedRole="parent">
      <ParentVaccines />
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
    <ProtectedRoute allowedRoles={["staff", "admin", "doctor", "nurse", "secretary"]}>
      <EditRecord />
    </ProtectedRoute>
  }
/>
<Route
  path="/staff/records/:id"
  element={
    <ProtectedRoute allowedRoles={["staff", "admin", "doctor", "nurse", "secretary"]}>
      <RecordDetails />
    </ProtectedRoute>
  }
/>
<Route
  path="/staff/reports"
  element={
    <ProtectedRoute allowedRoles={["staff", "admin", "doctor", "nurse", "secretary"]}>
      <Reports />
    </ProtectedRoute>
  }
/>
      </Routes>
    </BrowserRouter>
  );
}


export default App;