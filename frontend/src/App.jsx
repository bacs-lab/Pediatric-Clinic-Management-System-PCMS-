import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
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
import ParentPatientRecords from './pages/ParentPatientRecords';
import PatientProfile from './pages/PatientProfile';
import ManageUsers from './pages/ManageUsers';
import RequestCenter from './pages/RequestCenter';
import ToastProvider from './components/ToastProvider';
import { ADMIN_ONLY, EMR_WRITE_ROLES, FRONT_DESK_ROLES, MEDICAL_ROLES, OPERATIONS_ROLES, PATIENT_APPROVAL_ROLES, PATIENT_CREATION_ROLES, STAFF_ROLES } from './utils/roles';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />

        {/* Staff routes */}
        <Route path="/staff/dashboard" element={<ProtectedRoute allowedRoles={OPERATIONS_ROLES}><MainLayout><StaffDashboard /></MainLayout></ProtectedRoute>} />
        <Route path="/staff/create-record" element={<ProtectedRoute allowedRoles={EMR_WRITE_ROLES}><Navigate to="/staff/records" replace state={{ modal: 'add-record' }} /></ProtectedRoute>} />
        <Route path="/staff/create-parent" element={<ProtectedRoute allowedRoles={PATIENT_CREATION_ROLES}><MainLayout><CreateParent /></MainLayout></ProtectedRoute>} />
        <Route path="/staff/parents" element={<ProtectedRoute allowedRoles={FRONT_DESK_ROLES}><MainLayout><ParentList /></MainLayout></ProtectedRoute>} />
        <Route path="/staff/create-patient" element={<ProtectedRoute allowedRoles={PATIENT_CREATION_ROLES}><MainLayout><CreatePatient /></MainLayout></ProtectedRoute>} />
        <Route path="/staff/patients" element={<ProtectedRoute allowedRoles={STAFF_ROLES}><MainLayout><PatientList /></MainLayout></ProtectedRoute>} />
        <Route path="/staff/patients/:id" element={<ProtectedRoute allowedRoles={STAFF_ROLES}><MainLayout><PatientProfile /></MainLayout></ProtectedRoute>} />
        <Route path="/staff/requests" element={<ProtectedRoute allowedRoles={PATIENT_APPROVAL_ROLES}><MainLayout><RequestCenter /></MainLayout></ProtectedRoute>} />
        <Route path="/staff/appointments" element={<ProtectedRoute allowedRoles={OPERATIONS_ROLES}><MainLayout><AppointmentList /></MainLayout></ProtectedRoute>} />
        <Route path="/staff/queue" element={<ProtectedRoute allowedRoles={OPERATIONS_ROLES}><MainLayout><QueueList /></MainLayout></ProtectedRoute>} />
        <Route path="/staff/create-assessment" element={<ProtectedRoute allowedRoles={['staff', 'doctor', 'nurse']}><MainLayout><CreateAssessment /></MainLayout></ProtectedRoute>} />
        <Route path="/staff/create-consultation" element={<ProtectedRoute allowedRoles={MEDICAL_ROLES}><MainLayout><CreateConsultation /></MainLayout></ProtectedRoute>} />
        <Route path="/staff/create-billing" element={<ProtectedRoute allowedRoles={['secretary', 'staff']}><MainLayout><CreateBilling /></MainLayout></ProtectedRoute>} />
        <Route path="/staff/billings" element={<ProtectedRoute allowedRoles={['secretary', 'staff']}><MainLayout><BillingList /></MainLayout></ProtectedRoute>} />
        <Route path="/staff/inventory" element={<ProtectedRoute allowedRoles={OPERATIONS_ROLES}><MainLayout><InventoryList /></MainLayout></ProtectedRoute>} />
        <Route path="/staff/create-inventory" element={<ProtectedRoute allowedRoles={OPERATIONS_ROLES}><MainLayout><CreateInventoryItem /></MainLayout></ProtectedRoute>} />
        <Route path="/staff/vaccines" element={<ProtectedRoute allowedRoles={MEDICAL_ROLES}><MainLayout><VaccineList /></MainLayout></ProtectedRoute>} />
        <Route path="/staff/create-vaccine" element={<ProtectedRoute allowedRoles={MEDICAL_ROLES}><MainLayout><CreateVaccineRecord /></MainLayout></ProtectedRoute>} />
        <Route path="/staff/records" element={<ProtectedRoute allowedRoles={MEDICAL_ROLES}><MainLayout><RecordList /></MainLayout></ProtectedRoute>} />
        <Route path="/staff/records/:id/edit" element={<ProtectedRoute allowedRoles={EMR_WRITE_ROLES}><MainLayout><EditRecord /></MainLayout></ProtectedRoute>} />
        <Route path="/staff/records/:id" element={<ProtectedRoute allowedRoles={MEDICAL_ROLES}><MainLayout><RecordDetails /></MainLayout></ProtectedRoute>} />
        <Route path="/staff/users" element={<ProtectedRoute allowedRoles={ADMIN_ONLY}><MainLayout><ManageUsers /></MainLayout></ProtectedRoute>} />
        <Route path="/staff/reports" element={<ProtectedRoute allowedRoles={ADMIN_ONLY}><Navigate to="/staff/users" replace /></ProtectedRoute>} />

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
