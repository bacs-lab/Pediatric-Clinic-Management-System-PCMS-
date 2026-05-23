# Navbar Refactor — Pediatric Clinic Management System

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate duplicated sidebar/topbar/layout markup from 25+ page files into a single reusable `Navbar` component with dropdown menus, arrow indicators, and Tabler Icons, while normalizing all routes to use `MainLayout`.

**Architecture:** Extract nav items into a `navConfig.js` data file (pure config, no logic). Build a `Navbar` component that reads that config and renders expandable/collapsible dropdown sections with chevron indicators. `MainLayout` consumes `Navbar` + `Topbar` + `{children}`. Every page strips its inline layout/sidebar/topbar and becomes content-only. All ~30 routes in `App.jsx` get normalized to `<ProtectedRoute><MainLayout><Page /></MainLayout></ProtectedRoute>`.

**Tech Stack:** React 19, React Router 7, Tabler Icons (CDN), custom CSS (no Tailwind)

**Key insight:** Currently pages wrapped in `MainLayout` ALSO render their own sidebar + Topbar — producing doubled layouts and double Topbars. Pages NOT wrapped in `MainLayout` render their own full layout. After refactoring, `MainLayout` is the single source of truth for sidebar + Topbar, and pages contain only their domain content.

---

### File Map

| Action | File | Responsibility |
|--------|------|----------------|
| CREATE | `frontend/src/components/navConfig.js` | Staff/parent nav item arrays (pure data) |
| CREATE | `frontend/src/components/Navbar.jsx` | Sidebar with dropdown menus, arrow indicators, Tabler icons |
| MODIFY | `frontend/src/components/MainLayout.jsx` | Use Navbar + Topbar; remove old inline sidebar |
| MODIFY | `frontend/src/index.css` | Add `.nav-parent-btn`, `.nav-child-item`, `.nav-arrow`, `.nav-logout-btn` styles |
| MODIFY | `frontend/src/App.jsx` | Normalize all routes: every route gets ProtectedRoute + MainLayout |
| MODIFY | `frontend/src/pages/StaffDashboard.jsx` | Remove `<Topbar />` import/render, remove `<div className="main-content dashboard-bg">` wrapper |
| MODIFY | `frontend/src/pages/ParentDashboard.jsx` | Remove `<Topbar />` import/render, remove wrapper; remove unused `logout` |
| MODIFY | `frontend/src/pages/PatientList.jsx` | Remove inline sidebar + Topbar; content only |
| MODIFY | `frontend/src/pages/AppointmentList.jsx` | Remove inline sidebar + Topbar; content only |
| MODIFY | `frontend/src/pages/QueueList.jsx` | Remove inline sidebar + Topbar; content only |
| MODIFY | `frontend/src/pages/ParentList.jsx` | Remove inline sidebar + Topbar; content only |
| MODIFY | `frontend/src/pages/CreateRecord.jsx` | Remove inline sidebar + Topbar; content only |
| MODIFY | `frontend/src/pages/CreateParent.jsx` | Remove inline sidebar + Topbar; content only |
| MODIFY | `frontend/src/pages/CreatePatient.jsx` | Remove inline sidebar + Topbar; content only |
| MODIFY | `frontend/src/pages/CreateAppointment.jsx` | Remove inline sidebar + Topbar; content only |
| MODIFY | `frontend/src/pages/CreateAssessment.jsx` | Remove inline sidebar + Topbar; content only |
| MODIFY | `frontend/src/pages/CreateConsultation.jsx` | Remove inline sidebar + Topbar; content only |
| MODIFY | `frontend/src/pages/CreateBilling.jsx` | Remove inline sidebar + Topbar; content only |
| MODIFY | `frontend/src/pages/BillingList.jsx` | Remove full layout + sidebar + Topbar; content only |
| MODIFY | `frontend/src/pages/InventoryList.jsx` | Remove full layout + sidebar + Topbar; content only |
| MODIFY | `frontend/src/pages/VaccineList.jsx` | Remove full layout + sidebar + Topbar; content only |
| MODIFY | `frontend/src/pages/Reports.jsx` | Remove full layout + sidebar + Topbar; content only |
| MODIFY | `frontend/src/pages/CreateInventoryItem.jsx` | Remove full layout + sidebar + Topbar; content only |
| MODIFY | `frontend/src/pages/CreateVaccineRecord.jsx` | Remove full layout + sidebar + Topbar; content only |
| MODIFY | `frontend/src/pages/EditRecord.jsx` | Remove full layout + sidebar + Topbar; content only |
| MODIFY | `frontend/src/pages/RecordDetails.jsx` | Remove full layout + sidebar + Topbar; content only |
| MODIFY | `frontend/src/pages/ParentAppointments.jsx` | Remove inline sidebar + Topbar; content only |
| MODIFY | `frontend/src/pages/ParentBilling.jsx` | Remove full layout + sidebar + Topbar; content only |
| MODIFY | `frontend/src/pages/ParentVaccines.jsx` | Remove full layout + sidebar + Topbar; content only |
| MODIFY | `frontend/src/pages/ParentPatientRecords.jsx` | Remove full layout + sidebar + Topbar; content only |
| MODIFY | `frontend/index.html` | Fix typo "Clinice" → "Clinic" |
| DELETE | `frontend/src/App.css` | Unused Vite boilerplate |

---

### Task 1: Create Navigation Configuration

**Files:**
- Create: `frontend/src/components/navConfig.js`

- [ ] **Step 1: Write the nav config file**

Create `frontend/src/components/navConfig.js`:

```js
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
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/navConfig.js
git commit -m "feat: add navigation configuration for staff and parent roles
"
```

---

### Task 2: Create Navbar Component

**Files:**
- Create: `frontend/src/components/Navbar.jsx`

- [ ] **Step 1: Write the Navbar component**

Create `frontend/src/components/Navbar.jsx`:

```jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function Navbar({ navItems, title = 'KIDS FIRST', onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState({});

  // Auto-open parent menu when a child route is active
  useEffect(() => {
    const next = {};
    navItems.forEach((item) => {
      if (item.children) {
        const childActive = item.children.some(
          (child) => location.pathname === child.path
        );
        if (childActive) {
          next[item.label] = true;
        }
      }
    });
    setOpenMenus((prev) => ({ ...prev, ...next }));
  }, [location.pathname, navItems]);

  const toggleMenu = (label) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (path) => location.pathname === path;

  const handleParentClick = (item) => {
    if (item.children?.length > 0) {
      toggleMenu(item.label);
    } else {
      navigate(item.path);
    }
  };

  return (
    <div className="sidebar">
      <h2>{title}</h2>

      <ul>
        {navItems.map((item) => {
          const hasChildren = item.children?.length > 0;
          const childActive =
            hasChildren &&
            item.children.some((child) => isActive(child.path));
          const menuOpen = openMenus[item.label] || false;
          const parentActive = isActive(item.path) || childActive;

          return (
            <li key={item.label} className="nav-item">
              <button
                className={`nav-parent-btn${parentActive ? ' active' : ''}`}
                onClick={() => handleParentClick(item)}
              >
                <span className="nav-label">
                  <span className={item.icon}></span>
                  {item.label}
                </span>
                {hasChildren && (
                  <span
                    className={`nav-arrow ti ti-chevron-${menuOpen ? 'up' : 'down'}`}
                  ></span>
                )}
              </button>

              {hasChildren && menuOpen && (
                <ul className="nav-child-list">
                  {item.children.map((child) => (
                    <li key={child.path} className="nav-child-item">
                      <button
                        className={isActive(child.path) ? 'active' : ''}
                        onClick={() => navigate(child.path)}
                      >
                        <span className={child.icon}></span>
                        {child.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      {onLogout && (
        <div className="nav-footer">
          <button className="nav-logout-btn" onClick={onLogout}>
            <span className="ti ti-logout"></span>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default Navbar;
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/Navbar.jsx
git commit -m "feat: create reusable Navbar component with dropdown menus and arrow indicators
"
```

---

### Task 3: Update MainLayout to Use Navbar

**Files:**
- Modify: `frontend/src/components/MainLayout.jsx` (complete rewrite)

- [ ] **Step 1: Replace MainLayout content**

Replace the entire content of `frontend/src/components/MainLayout.jsx`:

```jsx
import { useNavigate } from 'react-router-dom';
import Topbar from './Topbar';
import Navbar from './Navbar';
import { staffNavItems, parentNavItems } from './navConfig';

function MainLayout({ children }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const isStaff =
    user?.role &&
    ['staff', 'admin', 'doctor', 'nurse', 'secretary'].includes(user.role);
  const isParent = user?.role === 'parent';

  const navItems = isStaff
    ? staffNavItems
    : isParent
      ? parentNavItems
      : [];

  return (
    <div className="layout">
      <Navbar navItems={navItems} onLogout={logout} />
      <div className="main-content">
        <Topbar />
        {children}
      </div>
    </div>
  );
}

export default MainLayout;
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/MainLayout.jsx
git commit -m "refactor: integrate Navbar component into MainLayout, remove old inline sidebar
"
```

---

### Task 4: Add Dropdown Styles to CSS

**Files:**
- Modify: `frontend/src/index.css` (append new styles)

- [ ] **Step 1: Append dropdown navigation styles**

Append the following to `frontend/src/index.css`:

```css

/* ── Navbar dropdown styles ── */

.nav-item {
  margin-bottom: 4px;
}

.nav-parent-btn {
  width: 100%;
  padding: 12px 14px;
  border: none;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.12);
  color: white;
  text-align: left;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 15px;
}

.nav-parent-btn:hover,
.nav-parent-btn.active {
  background: white;
  color: #1e3a8a;
  transform: translateX(4px);
}

.nav-label {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-arrow {
  font-size: 14px;
  transition: transform 0.2s ease;
  opacity: 0.7;
}

/* Child dropdown items — indented and visually distinct */

.nav-child-list {
  list-style: none;
  margin: 2px 0 4px 0;
  padding: 0;
  overflow: hidden;
}

.nav-child-item button {
  width: 100%;
  padding: 9px 14px 9px 36px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.8);
  text-align: left;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  border-left: 2px solid transparent;
}

.nav-child-item button:hover,
.nav-child-item button.active {
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
  border-left-color: rgba(255, 255, 255, 0.5);
}

/* Logout button at the bottom of the sidebar */

.nav-footer {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.18);
}

.nav-logout-btn {
  width: 100%;
  padding: 12px 14px;
  border: none;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.7);
  text-align: left;
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-logout-btn:hover {
  background: rgba(239, 68, 68, 0.7);
  color: white;
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/index.css
git commit -m "style: add dropdown nav, child item, and logout button CSS
"
```

---

### Task 5: Normalize App.jsx Routes

**Files:**
- Modify: `frontend/src/App.jsx` (complete rewrite of route definitions)

- [ ] **Step 1: Rewrite App.jsx with normalized routes**

Replace the entire content of `frontend/src/App.jsx`:

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import StaffDashboard from './pages/StaffDashboard';
import ParentDashboard from './pages/ParentDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import CreateRecord from './pages/CreateRecord';
import EditRecord from './pages/EditRecord';
import RecordDetails from './pages/RecordDetails';
import ParentPatientRecords from './pages/ParentPatientRecords';
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

const STAFF_ROLES = ['staff', 'admin', 'doctor', 'nurse', 'secretary'];

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Login />} />

        {/* Staff routes — all use MainLayout */}
        <Route
          path="/staff/dashboard"
          element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}>
              <MainLayout><StaffDashboard /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/create-record"
          element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}>
              <MainLayout><CreateRecord /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/create-parent"
          element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}>
              <MainLayout><CreateParent /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/parents"
          element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}>
              <MainLayout><ParentList /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/create-patient"
          element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}>
              <MainLayout><CreatePatient /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/patients"
          element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}>
              <MainLayout><PatientList /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/appointments"
          element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}>
              <MainLayout><AppointmentList /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/queue"
          element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}>
              <MainLayout><QueueList /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/create-assessment"
          element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}>
              <MainLayout><CreateAssessment /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/create-consultation"
          element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}>
              <MainLayout><CreateConsultation /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/create-billing"
          element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}>
              <MainLayout><CreateBilling /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/billings"
          element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}>
              <MainLayout><BillingList /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/inventory"
          element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}>
              <MainLayout><InventoryList /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/create-inventory"
          element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}>
              <MainLayout><CreateInventoryItem /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/vaccines"
          element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}>
              <MainLayout><VaccineList /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/create-vaccine"
          element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}>
              <MainLayout><CreateVaccineRecord /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/records/:id/edit"
          element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}>
              <MainLayout><EditRecord /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/records/:id"
          element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}>
              <MainLayout><RecordDetails /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/reports"
          element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}>
              <MainLayout><Reports /></MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Parent routes — all use MainLayout */}
        <Route
          path="/parent/dashboard"
          element={
            <ProtectedRoute allowedRole="parent">
              <MainLayout><ParentDashboard /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent/create-appointment"
          element={
            <ProtectedRoute allowedRole="parent">
              <MainLayout><CreateAppointment /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent/appointments"
          element={
            <ProtectedRoute allowedRole="parent">
              <MainLayout><ParentAppointments /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent/patient/:patientId/billing"
          element={
            <ProtectedRoute allowedRole="parent">
              <MainLayout><ParentBilling /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent/patient/:patientId/vaccines"
          element={
            <ProtectedRoute allowedRole="parent">
              <MainLayout><ParentVaccines /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent/patient/:patientId/records"
          element={
            <ProtectedRoute allowedRole="parent">
              <MainLayout><ParentPatientRecords /></MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "refactor: normalize all routes to use MainLayout + ProtectedRoute consistently
"
```

---

### Task 6: Refactor Dashboard Pages

**Files:**
- Modify: `frontend/src/pages/StaffDashboard.jsx`
- Modify: `frontend/src/pages/ParentDashboard.jsx`

- [ ] **Step 1: Refactor StaffDashboard — remove Topbar and wrapper div**

In `frontend/src/pages/StaffDashboard.jsx`:

Remove line 3: `import Topbar from "../components/Topbar";`

Remove lines 22-26 (the unused `logout` function):
```js
const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  navigate("/");
};
```

Replace lines 60-61:
```jsx
    <div className="main-content dashboard-bg">
      <Topbar />
```
with:
```jsx
    <div className="dashboard-bg">
```

Replace line 187 (`</div>` before the closing of the component) — remove the extra closing `</div>` that was closing `main-content`. The component's return should end with:
```jsx
    </div>
  );
}
```

- [ ] **Step 2: Refactor ParentDashboard — remove Topbar, unused logout, and wrapper**

In `frontend/src/pages/ParentDashboard.jsx`:

Remove line 3: `import Topbar from "../components/Topbar";`

Remove lines 12-16 (unused `logout` function):
```js
const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  navigate("/");
};
```

Replace lines 35-36:
```jsx
    <div className="main-content dashboard-bg">
      <Topbar />
```
with:
```jsx
    <div className="dashboard-bg">
```

Remove the extra closing `</div>` for `main-content` at line 101 — the return should end:
```jsx
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/StaffDashboard.jsx frontend/src/pages/ParentDashboard.jsx
git commit -m "refactor: remove duplicate Topbar and unused logout from dashboard pages
"
```

---

### Task 7: Refactor Staff List Pages

**Files:**
- Modify: `frontend/src/pages/PatientList.jsx`
- Modify: `frontend/src/pages/AppointmentList.jsx`
- Modify: `frontend/src/pages/QueueList.jsx`
- Modify: `frontend/src/pages/ParentList.jsx`

- [ ] **Step 1: Read each file first, then apply the refactor pattern**

For each of these four files, apply the same transformation:

**Pattern to remove (from the top of the return JSX):**

Remove the `import Topbar from "../components/Topbar";` line.

Remove the entire inline sidebar block:
```jsx
    <div className="layout">
      <div className="sidebar">
        <h2>PCMS Staff</h2>
        <ul>
          <li><button onClick={() => navigate("/staff/dashboard")}>Dashboard</button></li>
          {/* ... any other buttons ... */}
        </ul>
      </div>
      <div className="main-content">
        <Topbar />
```

And the corresponding closing `</div></div>` at the end of the return.

**What stays:** Everything between `<Topbar />` and the final `</div></div>` (the actual page content: titles, panels, tables, forms, etc.).

**PatientList.jsx** — Remove lines 3-4 (Topbar import), remove the layout/sidebar block (lines 24-42), remove the closing `</div></div>`. The remaining JSX should start with `<h1 className="page-title">Patients</h1>` and end with the `</div>` closing the table-container.

**AppointmentList.jsx** — Same pattern. Remove Topbar import, inline sidebar + Topbar, and closing layout divs.

**QueueList.jsx** — Same pattern.

**ParentList.jsx** — Same pattern.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/PatientList.jsx frontend/src/pages/AppointmentList.jsx frontend/src/pages/QueueList.jsx frontend/src/pages/ParentList.jsx
git commit -m "refactor: remove inline sidebars and Topbar from staff list pages
"
```

---

### Task 8: Refactor Staff Form/Create Pages

**Files:**
- Modify: `frontend/src/pages/CreateRecord.jsx`
- Modify: `frontend/src/pages/CreateParent.jsx`
- Modify: `frontend/src/pages/CreatePatient.jsx`
- Modify: `frontend/src/pages/CreateAppointment.jsx`
- Modify: `frontend/src/pages/CreateAssessment.jsx`
- Modify: `frontend/src/pages/CreateConsultation.jsx`
- Modify: `frontend/src/pages/CreateBilling.jsx`

- [ ] **Step 1: Read each file, then apply the refactor pattern**

For each file, remove:
1. `import Topbar from "../components/Topbar";`
2. The inline sidebar/layout block: `<div className="layout"><div className="sidebar">...</div><div className="main-content"><Topbar />`
3. The closing `</div></div>` at the end

Keep: everything that's the actual page content (page title `<h1>`, form, etc.).

**CreateRecord.jsx** — Remove lines 3 and 148-166 (Topbar import, inline sidebar block starting with `<div className="layout">` through `<Topbar />`). Remove the closing `</div>` on line 256 and `</div>` on line 257 (the closing of main-content and layout). Keep lines 167-254 (page title + form).

**CreateParent.jsx** — Same pattern removal.

**CreatePatient.jsx** — Same pattern removal.

**CreateAppointment.jsx** — Same pattern removal.

**CreateAssessment.jsx** — Same pattern removal.

**CreateConsultation.jsx** — Same pattern removal.

**CreateBilling.jsx** — Same pattern removal.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/CreateRecord.jsx frontend/src/pages/CreateParent.jsx frontend/src/pages/CreatePatient.jsx frontend/src/pages/CreateAppointment.jsx frontend/src/pages/CreateAssessment.jsx frontend/src/pages/CreateConsultation.jsx frontend/src/pages/CreateBilling.jsx
git commit -m "refactor: remove inline sidebars and Topbar from staff create/form pages
"
```

---

### Task 9: Refactor Standalone List Pages (No MainLayout → MainLayout)

**Files:**
- Modify: `frontend/src/pages/BillingList.jsx`
- Modify: `frontend/src/pages/InventoryList.jsx`
- Modify: `frontend/src/pages/VaccineList.jsx`
- Modify: `frontend/src/pages/Reports.jsx`

These pages currently have their own full layout (sidebar + main-content + Topbar). After refactoring, they become content-only since App.jsx now wraps them in MainLayout.

- [ ] **Step 1: Refactor each page**

Same pattern as Task 7/8: remove Topbar import, remove full layout wrapper (sidebar + main-content + Topbar), keep only the page content.

**BillingList.jsx** — Remove lines 3, 21-31 (Topbar import, sidebar block + opening main-content + Topbar). Remove lines 105-106 (closing `</div></div>`). The remaining JSX should start with `<div className="dashboard-hero">`.

**InventoryList.jsx** — Same pattern. Remove layout/sidebar/Topbar. Keep the `dashboard-hero` + panel content.

**VaccineList.jsx** — Same pattern.

**Reports.jsx** — Same pattern.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/BillingList.jsx frontend/src/pages/InventoryList.jsx frontend/src/pages/VaccineList.jsx frontend/src/pages/Reports.jsx
git commit -m "refactor: remove standalone layouts from list pages now using MainLayout
"
```

---

### Task 10: Refactor Record/Form Detail Pages

**Files:**
- Modify: `frontend/src/pages/CreateInventoryItem.jsx`
- Modify: `frontend/src/pages/CreateVaccineRecord.jsx`
- Modify: `frontend/src/pages/EditRecord.jsx`
- Modify: `frontend/src/pages/RecordDetails.jsx`

- [ ] **Step 1: Refactor each page**

Same pattern: remove Topbar import, remove layout/sidebar/Topbar block, keep page content only.

**CreateInventoryItem.jsx** — Remove layout/sidebar/Topbar wrapper. Keep form content.

**CreateVaccineRecord.jsx** — Same.

**EditRecord.jsx** — Same.

**RecordDetails.jsx** — Same.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/CreateInventoryItem.jsx frontend/src/pages/CreateVaccineRecord.jsx frontend/src/pages/EditRecord.jsx frontend/src/pages/RecordDetails.jsx
git commit -m "refactor: remove standalone layouts from detail/form pages now using MainLayout
"
```

---

### Task 11: Refactor Parent Pages

**Files:**
- Modify: `frontend/src/pages/ParentAppointments.jsx`
- Modify: `frontend/src/pages/ParentBilling.jsx`
- Modify: `frontend/src/pages/ParentVaccines.jsx`
- Modify: `frontend/src/pages/ParentPatientRecords.jsx`

- [ ] **Step 1: Refactor each page**

Same pattern: remove Topbar import, remove layout/sidebar/Topbar block, keep page content only.

**ParentAppointments.jsx** — Remove layout/sidebar/Topbar. Keep the appointments list content.

**ParentBilling.jsx** — Remove full layout/sidebar/Topbar. Keep billing content.

**ParentVaccines.jsx** — Remove full layout/sidebar/Topbar. Keep vaccine content.

**ParentPatientRecords.jsx** — Remove full layout/sidebar/Topbar. Keep records content. (This page also had no ProtectedRoute — fixed in Task 5.)

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/ParentAppointments.jsx frontend/src/pages/ParentBilling.jsx frontend/src/pages/ParentVaccines.jsx frontend/src/pages/ParentPatientRecords.jsx
git commit -m "refactor: remove standalone layouts from parent pages now using MainLayout
"
```

---

### Task 12: Cleanup — Remove App.css, Fix Typo, Verify

**Files:**
- Delete: `frontend/src/App.css`
- Modify: `frontend/index.html`

- [ ] **Step 1: Delete unused App.css**

```bash
rm frontend/src/App.css
```

This file contains unused Vite boilerplate (`.counter`, `.hero`, `#center`, `#next-steps`) and is not imported anywhere.

- [ ] **Step 2: Fix typo in index.html title**

In `frontend/index.html`, line 7, change:
```html
    <title>Kids First Clinice - PCMS</title>
```
to:
```html
    <title>Kids First Clinic - PCMS</title>
```

- [ ] **Step 3: Verify the app builds without errors**

Run:
```bash
cd frontend && npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 4: Verify no remaining Topbar imports in pages (should only be in MainLayout.jsx)**

Run:
```bash
grep -r "import Topbar" frontend/src/pages/
```

Expected: No matches (empty output — Topbar should only be imported by MainLayout.jsx).

- [ ] **Step 5: Verify no remaining inline sidebar divs in pages**

Run:
```bash
grep -r 'className="sidebar"' frontend/src/pages/
```

Expected: No matches (sidebar class should only appear in Navbar.jsx).

- [ ] **Step 6: Verify no remaining inline layout divs in pages**

Run:
```bash
grep -r 'className="layout"' frontend/src/pages/
```

Expected: No matches (layout class should only appear in MainLayout.jsx).

- [ ] **Step 7: Commit**

```bash
git add frontend/src/App.css frontend/index.html
git commit -m "chore: delete unused App.css, fix 'Clinice' typo in index.html title
"
```

---

### Self-Review Checklist

**1. Spec coverage:**

| Requirement | Task(s) |
|---|---|
| 1. Component refactor — single reusable Navbar | Tasks 1, 2, 3 |
| 2. Drop-down logic — child dropdown within Navbar | Tasks 1, 2, 4 |
| 3. UI indicators — arrow icon for open/closed | Tasks 2, 4 |
| 4. Icon system — Tabler Icons for all nav items | Tasks 1, 2 |
| 5. Style fix — child buttons visually distinct | Tasks 4 (indentation, border-left, lighter bg) |
| 6. Flow optimization — remove redundancy | Tasks 3, 5, 6-11 (remove duplicate Topbar/sidebar/logout) |
| Bonus: Fix missing ProtectedRoute | Task 5 |
| Bonus: Fix typo in title | Task 12 |
| Bonus: Remove unused App.css | Task 12 |

**2. Placeholder scan:** No TBDs, TODOs, "implement later", or "add error handling" patterns. Every step has concrete code.

**3. Type consistency:** `navConfig.js` exports `staffNavItems` and `parentNavItems` arrays with shape `{label, icon, path, children?}`. `Navbar.jsx` destructures these with matching property names. `MainLayout.jsx` imports both configs and passes the correct one as `navItems` prop. Property names are consistent across all files.