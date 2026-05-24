import { ADMIN_ONLY, EMR_WRITE_ROLES, FRONT_DESK_ROLES, MEDICAL_ROLES, OPERATIONS_ROLES, PATIENT_APPROVAL_ROLES, STAFF_ROLES } from "../utils/roles";

export const adminNavItems = [
  {
    label: 'Manage Users',
    icon: 'ti ti-user-cog',
    path: '/staff/users',
    roles: ADMIN_ONLY,
  },
  {
    label: 'Requests',
    icon: 'ti ti-mail-opened',
    path: '/staff/requests',
    roles: ADMIN_ONLY,
  },
  {
    label: 'Patients',
    icon: 'ti ti-user-plus',
    path: '/staff/patients',
    roles: ADMIN_ONLY,
  },
  {
    label: 'Guardians',
    icon: 'ti ti-users',
    path: '/staff/parents',
    roles: ADMIN_ONLY,
  },
];

export const staffNavItems = [
  {
    label: 'Dashboard',
    icon: 'ti ti-home',
    path: '/staff/dashboard',
    roles: OPERATIONS_ROLES,
  },
  {
    label: 'Patients',
    icon: 'ti ti-user-plus',
    path: '/staff/patients',
    roles: STAFF_ROLES,
    children: [
      { label: 'Add Patient', icon: 'ti ti-plus', path: '/staff/patients', state: { modal: 'add-patient' }, roles: FRONT_DESK_ROLES },
    ],
  },
  {
    label: 'Medical Records',
    icon: 'ti ti-notes',
    path: '/staff/records',
    roles: MEDICAL_ROLES,
    children: [
      { label: 'Add Record', icon: 'ti ti-plus', path: '/staff/records', state: { modal: 'add-record' }, roles: EMR_WRITE_ROLES },
    ],
  },
  {
    label: 'Guardians',
    icon: 'ti ti-users',
    path: '/staff/parents',
    roles: FRONT_DESK_ROLES,
    children: [
      { label: 'Add Guardian', icon: 'ti ti-plus', path: '/staff/parents', state: { modal: 'add-guardian' } },
    ],
  },
  {
    label: 'Appointments',
    icon: 'ti ti-calendar',
    path: '/staff/appointments',
    roles: STAFF_ROLES,
  },
  {
    label: 'Requests',
    icon: 'ti ti-mail-opened',
    path: '/staff/requests',
    roles: PATIENT_APPROVAL_ROLES,
  },
  {
    label: 'Queue',
    icon: 'ti ti-list-check',
    path: '/staff/queue',
    roles: STAFF_ROLES,
    children: [
      { label: 'New Assessment', icon: 'ti ti-stethoscope', path: '/staff/queue', state: { modal: 'assessment' }, roles: ['admin', 'staff', 'doctor', 'nurse'] },
      { label: 'New Consultation', icon: 'ti ti-notes', path: '/staff/queue', state: { modal: 'consultation' }, roles: MEDICAL_ROLES },
      { label: 'New Billing', icon: 'ti ti-wallet', path: '/staff/queue', state: { modal: 'billing' }, roles: ['admin', 'secretary', 'staff'] },
    ],
  },
  {
    label: 'Billing',
    icon: 'ti ti-receipt',
    path: '/staff/billings',
    roles: ['admin', 'secretary', 'staff'],
  },
  {
    label: 'Inventory',
    icon: 'ti ti-box',
    path: '/staff/inventory',
    roles: STAFF_ROLES,
    children: [
      { label: 'Add Item', icon: 'ti ti-plus', path: '/staff/inventory', state: { modal: 'add-item' } },
    ],
  },
  {
    label: 'Vaccines',
    icon: 'ti ti-vaccine',
    path: '/staff/vaccines',
    roles: MEDICAL_ROLES,
    children: [
      { label: 'Add Record', icon: 'ti ti-plus', path: '/staff/vaccines', state: { modal: 'add-vaccine' } },
    ],
  },
  {
    label: 'Manage Users',
    icon: 'ti ti-user-cog',
    path: '/staff/users',
    roles: ADMIN_ONLY,
  },
  {
    label: 'Reports',
    icon: 'ti ti-report-analytics',
    path: '/staff/reports',
    roles: ADMIN_ONLY,
  },
];

export const parentNavItems = [
  {
    label: 'My Children',
    icon: 'ti ti-home',
    path: '/parent/dashboard',
  },
  {
    label: 'Medical Records',
    icon: 'ti ti-notes',
    path: '/parent/records',
  },
  {
    label: 'Billing',
    icon: 'ti ti-receipt',
    path: '/parent/billing',
  },
  {
    label: 'Vaccines',
    icon: 'ti ti-vaccine',
    path: '/parent/vaccines',
  },
  {
    label: 'My Appointments',
    icon: 'ti ti-calendar-check',
    path: '/parent/appointments',
  },
];
