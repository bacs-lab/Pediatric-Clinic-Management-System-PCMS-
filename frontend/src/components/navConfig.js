export const staffNavItems = [
  {
    label: 'Dashboard',
    icon: 'ti ti-home',
    path: '/staff/dashboard',
  },
  {
    label: 'Patients',
    icon: 'ti ti-user-plus',
    path: '/staff/patients',
    children: [
      { label: 'Add Patient', icon: 'ti ti-plus', path: '/staff/patients', state: { modal: 'add-patient' } },
    ],
  },
  {
    label: 'Medical Records',
    icon: 'ti ti-notes',
    path: '/staff/records',
    children: [
      { label: 'Add Record', icon: 'ti ti-plus', path: '/staff/records', state: { modal: 'add-record' } },
    ],
  },
  {
    label: 'Guardians',
    icon: 'ti ti-users',
    path: '/staff/parents',
    children: [
      { label: 'Add Guardian', icon: 'ti ti-plus', path: '/staff/parents', state: { modal: 'add-guardian' } },
    ],
  },
  {
    label: 'Appointments',
    icon: 'ti ti-calendar',
    path: '/staff/appointments',
  },
  {
    label: 'Queue',
    icon: 'ti ti-list-check',
    path: '/staff/queue',
    children: [
      { label: 'New Assessment', icon: 'ti ti-stethoscope', path: '/staff/queue', state: { modal: 'assessment' } },
      { label: 'New Consultation', icon: 'ti ti-notes', path: '/staff/queue', state: { modal: 'consultation' } },
      { label: 'New Billing', icon: 'ti ti-wallet', path: '/staff/queue', state: { modal: 'billing' } },
    ],
  },
  {
    label: 'Billing',
    icon: 'ti ti-receipt',
    path: '/staff/billings',
  },
  {
    label: 'Inventory',
    icon: 'ti ti-box',
    path: '/staff/inventory',
    children: [
      { label: 'Add Item', icon: 'ti ti-plus', path: '/staff/inventory', state: { modal: 'add-item' } },
    ],
  },
  {
    label: 'Vaccines',
    icon: 'ti ti-vaccine',
    path: '/staff/vaccines',
    children: [
      { label: 'Add Record', icon: 'ti ti-plus', path: '/staff/vaccines', state: { modal: 'add-vaccine' } },
    ],
  },
  {
    label: 'Reports',
    icon: 'ti ti-report-analytics',
    path: '/staff/reports',
  },
];

export const parentNavItems = [
  {
    label: 'My Children',
    icon: 'ti ti-home',
    path: '/parent/dashboard',
  },
  {
    label: 'Request Appointment',
    icon: 'ti ti-calendar-plus',
    path: '/parent/appointments',
    state: { modal: 'request-appointment' },
  },
  {
    label: 'My Appointments',
    icon: 'ti ti-calendar-check',
    path: '/parent/appointments',
  },
];
