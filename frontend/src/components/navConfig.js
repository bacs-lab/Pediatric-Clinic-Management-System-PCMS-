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
      { label: 'Add Patient', icon: 'ti ti-plus', path: '/staff/create-patient' },
    ],
  },
  {
    label: 'Guardians',
    icon: 'ti ti-users',
    path: '/staff/parents',
    children: [
      { label: 'Add Guardian', icon: 'ti ti-plus', path: '/staff/create-parent' },
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
      { label: 'New Assessment', icon: 'ti ti-stethoscope', path: '/staff/create-assessment' },
      { label: 'New Consultation', icon: 'ti ti-notes', path: '/staff/create-consultation' },
      { label: 'New Billing', icon: 'ti ti-wallet', path: '/staff/create-billing' },
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
      { label: 'Add Item', icon: 'ti ti-plus', path: '/staff/create-inventory' },
    ],
  },
  {
    label: 'Vaccines',
    icon: 'ti ti-heart-pulse',
    path: '/staff/vaccines',
    children: [
      { label: 'Add Record', icon: 'ti ti-plus', path: '/staff/create-vaccine' },
    ],
  },
  {
    label: 'Reports',
    icon: 'ti ti-bar-chart-2',
    path: '/staff/reports',
  },
];

export const parentNavItems = [
  {
    label: 'Dashboard',
    icon: 'ti ti-home',
    path: '/parent/dashboard',
  },
  {
    label: 'Request Appointment',
    icon: 'ti ti-calendar-plus',
    path: '/parent/create-appointment',
  },
  {
    label: 'My Appointments',
    icon: 'ti ti-calendar-check',
    path: '/parent/appointments',
  },
];