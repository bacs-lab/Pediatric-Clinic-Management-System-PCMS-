import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import StaffDashboard from './pages/StaffDashboard';
import ParentDashboard from './pages/ParentDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import EditRecord from './pages/EditRecord';
import RecordDetails from './pages/RecordDetails';
import RecordList from './pages/RecordList';
import CreateParent from './pages/CreateParent';
import ParentList from './pages/ParentList';
import CreatePatient from './pages/CreatePatient';
import PatientList from './pages/PatientList';
import CreateAppointment from './pages/CreateAppointment';
import AppointmentList from './pages/AppointmentList';
import ParentAppointments from './pages/ParentAppointments';
import QueueList from './pages/QueueList';
import CreateAssessment from './pages/CreateAssessment';
import CreateConsultation from './pages/CreateConsultation';
import CreateBilling from './pages/CreateBilling';
import BillingList from './pages/BillingList';
import ParentBilling from './pages/ParentBilling';
import InventoryList from './pages/InventoryList';
import CreateInventoryItem from './pages/CreateInventoryItem';
import VaccineList from './pages/VaccineList';
import CreateVaccineRecord from './pages/CreateVaccineRecord';
import ParentVaccines from './pages/ParentVaccines';
import Reports from './pages/Reports';
import ParentPatientRecords from './pages/ParentPatientRecords';
import PatientProfile from './pages/PatientProfile';
import ToastProvider from './components/ToastProvider';

const STAFF_ROLES = ['staff', 'admin', 'doctor', 'nurse', 'secretary'];

function App() {
  return (
    <BrowserRouter>
      <ToastProvider />
      <Routes>
        <Route path="/" element={<Login />} />

        {/* Staff routes */}
        <Route path="/staff/dashboard" element={<ProtectedRoute allowedRoles={STAFF_ROLES}><MainLayout><StaffDashboard /></MainLayout></ProtectedRoute>} />
        <Route path="/staff/create-record" element={<ProtectedRoute allowedRoles={STAFF_ROLES}><Navigate to="/staff/records" replace state={{ modal: 'add-record' }} /></ProtectedRoute>} />
        <Route path="/staff/create-parent" element={<ProtectedRoute allowedRoles={STAFF_ROLES}><MainLayout><CreateParent /></MainLayout></ProtectedRoute>} />
        <Route path="/staff/parents" element={<ProtectedRoute allowedRoles={STAFF_ROLES}><MainLayout><ParentList /></MainLayout></ProtectedRoute>} />
        <Route path="/staff/create-patient" element={<ProtectedRoute allowedRoles={STAFF_ROLES}><MainLayout><CreatePatient /></MainLayout></ProtectedRoute>} />
        <Route path="/staff/patients" element={<ProtectedRoute allowedRoles={STAFF_ROLES}><MainLayout><PatientList /></MainLayout></ProtectedRoute>} />
        <Route path="/staff/patients/:id" element={<ProtectedRoute allowedRoles={STAFF_ROLES}><MainLayout><PatientProfile /></MainLayout></ProtectedRoute>} />
        <Route path="/staff/appointments" element={<ProtectedRoute allowedRoles={STAFF_ROLES}><MainLayout><AppointmentList /></MainLayout></ProtectedRoute>} />
        <Route path="/staff/queue" element={<ProtectedRoute allowedRoles={STAFF_ROLES}><MainLayout><QueueList /></MainLayout></ProtectedRoute>} />
        <Route path="/staff/create-assessment" element={<ProtectedRoute allowedRoles={STAFF_ROLES}><MainLayout><CreateAssessment /></MainLayout></ProtectedRoute>} />
        <Route path="/staff/create-consultation" element={<ProtectedRoute allowedRoles={STAFF_ROLES}><MainLayout><CreateConsultation /></MainLayout></ProtectedRoute>} />
        <Route path="/staff/create-billing" element={<ProtectedRoute allowedRoles={STAFF_ROLES}><MainLayout><CreateBilling /></MainLayout></ProtectedRoute>} />
        <Route path="/staff/billings" element={<ProtectedRoute allowedRoles={STAFF_ROLES}><MainLayout><BillingList /></MainLayout></ProtectedRoute>} />
        <Route path="/staff/inventory" element={<ProtectedRoute allowedRoles={STAFF_ROLES}><MainLayout><InventoryList /></MainLayout></ProtectedRoute>} />
        <Route path="/staff/create-inventory" element={<ProtectedRoute allowedRoles={STAFF_ROLES}><MainLayout><CreateInventoryItem /></MainLayout></ProtectedRoute>} />
        <Route path="/staff/vaccines" element={<ProtectedRoute allowedRoles={STAFF_ROLES}><MainLayout><VaccineList /></MainLayout></ProtectedRoute>} />
        <Route path="/staff/create-vaccine" element={<ProtectedRoute allowedRoles={STAFF_ROLES}><MainLayout><CreateVaccineRecord /></MainLayout></ProtectedRoute>} />
        <Route path="/staff/records" element={<ProtectedRoute allowedRoles={STAFF_ROLES}><MainLayout><RecordList /></MainLayout></ProtectedRoute>} />
        <Route path="/staff/records/:id/edit" element={<ProtectedRoute allowedRoles={STAFF_ROLES}><MainLayout><EditRecord /></MainLayout></ProtectedRoute>} />
        <Route path="/staff/records/:id" element={<ProtectedRoute allowedRoles={STAFF_ROLES}><MainLayout><RecordDetails /></MainLayout></ProtectedRoute>} />
        <Route path="/staff/reports" element={<ProtectedRoute allowedRoles={STAFF_ROLES}><MainLayout><Reports /></MainLayout></ProtectedRoute>} />

        {/* Parent routes */}
        <Route path="/parent/dashboard" element={<ProtectedRoute allowedRole="parent"><MainLayout><ParentDashboard /></MainLayout></ProtectedRoute>} />
        <Route path="/parent/create-appointment" element={<ProtectedRoute allowedRole="parent"><MainLayout><CreateAppointment /></MainLayout></ProtectedRoute>} />
        <Route path="/parent/appointments" element={<ProtectedRoute allowedRole="parent"><MainLayout><ParentAppointments /></MainLayout></ProtectedRoute>} />
        <Route path="/parent/patient/:patientId/records" element={<ProtectedRoute allowedRole="parent"><MainLayout><ParentPatientRecords /></MainLayout></ProtectedRoute>} />
        <Route path="/parent/patient/:patientId/billing" element={<ProtectedRoute allowedRole="parent"><MainLayout><ParentBilling /></MainLayout></ProtectedRoute>} />
        <Route path="/parent/patient/:patientId/vaccines" element={<ProtectedRoute allowedRole="parent"><MainLayout><ParentVaccines /></MainLayout></ProtectedRoute>} />
              </Routes>
    </BrowserRouter>
  );
}

export default App;
