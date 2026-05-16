import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import StaffDashboard from "./pages/StaffDashboard";
import ParentDashboard from "./pages/ParentDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import CreateRecord from "./pages/CreateRecord";
import EditRecord from "./pages/EditRecord";
import RecordDetails from "./pages/RecordDetails";
import ParentPatientRecords from "./pages/ParentPatientRecords";


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