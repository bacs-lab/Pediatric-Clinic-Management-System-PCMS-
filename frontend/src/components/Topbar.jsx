import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl, authHeaders } from "../utils/api";
import { notify } from "../utils/notify";
import { PATIENT_APPROVAL_ROLES } from "../utils/roles";

function Topbar({ onMenuClick }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [globalSearchData, setGlobalSearchData] = useState({
    patients: [],
    guardians: [],
    inventory: [],
    vaccines: [],
    records: [],
  });
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [reminders, setReminders] = useState({
    upcomingFollowUps: [],
    upcomingVaccines: [],
  });
  const [pendingPatients, setPendingPatients] = useState([]);

  const isStaff = ["staff", "admin", "doctor", "nurse", "secretary"].includes(
    user?.role
  );
  const canApprovePatients = PATIENT_APPROVAL_ROLES.includes(user?.role);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  useEffect(() => {
    if (!isStaff) return;

    fetch(apiUrl("/api/reminders"), {
      headers: authHeaders(),
    })
      .then((res) => res.json())
      .then((data) =>
        setReminders({
          upcomingFollowUps: data.upcomingFollowUps || [],
          upcomingVaccines: data.upcomingVaccines || [],
        })
      )
      .catch(() => {});
  }, [isStaff]);

  useEffect(() => {
    if (!canApprovePatients) return;

    fetch(apiUrl("/api/patients/pending"), {
      headers: authHeaders(),
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setPendingPatients(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [canApprovePatients]);

  useEffect(() => {
    if (!isStaff) return;

    let cancelled = false;
    const fetchSource = (path) =>
      fetch(apiUrl(path), { headers: authHeaders() })
        .then((res) => (res.ok ? res.json() : []))
        .catch(() => []);

    Promise.all([
      fetchSource("/api/patients"),
      fetchSource("/api/parent-profiles"),
      fetchSource("/api/inventory"),
      fetchSource("/api/vaccines"),
      fetchSource("/api/records"),
    ]).then(([patients, guardians, inventory, vaccines, records]) => {
      if (cancelled) return;
      setGlobalSearchData({
        patients: Array.isArray(patients) ? patients : [],
        guardians: Array.isArray(guardians) ? guardians : [],
        inventory: Array.isArray(inventory) ? inventory : [],
        vaccines: Array.isArray(vaccines) ? vaccines : [],
        records: Array.isArray(records) ? records : [],
      });
    });

    return () => {
      cancelled = true;
    };
  }, [isStaff]);

  const notificationItems = useMemo(() => {
    if (!isStaff) {
      return [
        {
          id: "parent-appointments",
          icon: "ti ti-calendar-heart",
          title: "Appointment updates",
          body: "Check My Appointments for request status and schedule changes.",
        },
        {
          id: "parent-vaccines",
          icon: "ti ti-vaccine",
          title: "Vaccine reminders",
          body: "Open your child's vaccine tab to review next dose dates.",
        },
      ];
    }

    const followUps = reminders.upcomingFollowUps.slice(0, 3).map((item) => ({
      id: `follow-${item._id}`,
      icon: "ti ti-stethoscope",
      title: `${item.patientName} follow-up`,
      body: item.followUpDate
        ? new Date(item.followUpDate).toLocaleDateString()
        : "Follow-up date pending",
    }));

    const vaccines = reminders.upcomingVaccines.slice(0, 3).map((item) => ({
      id: `vaccine-${item._id}`,
      icon: "ti ti-vaccine",
      title: `${item.patientName} vaccine due`,
      body: item.nextDoseDate
        ? `${item.vaccineName} on ${new Date(item.nextDoseDate).toLocaleDateString()}`
        : item.vaccineName,
    }));

    const patientRequests = pendingPatients.slice(0, 4).map((patient) => ({
      id: `patient-request-${patient._id}`,
      icon: "ti ti-user-question",
      title: `${patient.firstName} ${patient.lastName} pending approval`,
      body: `Guardian: ${patient.guardianName || "Parent request"}`,
      path: "/staff/patients",
      state: { statusFilter: "Pending" },
    }));

    return [...patientRequests, ...followUps, ...vaccines];
  }, [isStaff, pendingPatients, reminders]);

  const globalSearchItems = useMemo(() => {
    const patients = globalSearchData.patients.map((patient) => {
      const name = `${patient.firstName || ""} ${patient.lastName || ""}`.trim();
      return {
        id: `patient-${patient._id}`,
        type: "Patient",
        icon: "ti ti-user-heart",
        title: name || "Unnamed patient",
        subtitle: `Guardian: ${patient.guardianName || "N/A"}`,
        path: `/staff/patients/${patient._id}`,
        keywords: [
          name,
          patient.guardianName,
          patient.contactNumber,
          patient.bloodType,
          patient.allergies,
        ],
      };
    });

    const guardians = globalSearchData.guardians.map((guardian) => ({
      id: `guardian-${guardian._id}`,
      type: "Guardian",
      icon: "ti ti-users",
      title: guardian.fullName || "Unnamed guardian",
      subtitle: guardian.contactNumber || guardian.address || "Guardian account",
      path: "/staff/parents",
      state: { search: guardian.fullName || guardian.contactNumber || "" },
      keywords: [
        guardian.fullName,
        guardian.contactNumber,
        guardian.address,
      ],
    }));

    const inventory = globalSearchData.inventory.map((item) => ({
      id: `inventory-${item._id}`,
      type: item.category === "Vaccine" ? "Vaccine Stock" : "Stock Item",
      icon: item.category === "Vaccine" ? "ti ti-vaccine" : "ti ti-package",
      title: item.itemName || "Unnamed item",
      subtitle: `${item.stockQuantity ?? 0} ${item.unit || "pcs"} - ${
        item.status || item.category || "Inventory"
      }`,
      path: "/staff/inventory",
      state: { search: item.itemName || "" },
      keywords: [
        item.itemName,
        item.category,
        item.status,
        item.unit,
        "stock",
        "inventory",
        item.category === "Vaccine" ? "vaccine" : "",
      ],
    }));

    const vaccines = globalSearchData.vaccines.map((record) => ({
      id: `vaccine-${record._id}`,
      type: "Vaccine Record",
      icon: "ti ti-heart-pulse",
      title: record.vaccineName || "Vaccine record",
      subtitle: `${record.patientName || "Unknown patient"} - ${
        record.status || "No status"
      }`,
      path: "/staff/vaccines",
      state: { search: record.vaccineName || record.patientName || "" },
      keywords: [
        record.vaccineName,
        record.patientName,
        record.status,
        record.administeredBy,
        record.remarks,
      ],
    }));

    const records = globalSearchData.records.map((record) => ({
      id: `record-${record._id}`,
      type: "Medical Record",
      icon: "ti ti-notes-medical",
      title: record.patientName || "Medical record",
      subtitle: record.diagnosis || record.chiefComplaint || "Clinic record",
      path: `/staff/records/${record._id}`,
      keywords: [
        record.patientName,
        record.chiefComplaint,
        record.diagnosis,
        record.treatment,
        record.prescription,
        record.doctorName,
      ],
    }));

    return [...patients, ...guardians, ...inventory, ...vaccines, ...records];
  }, [globalSearchData]);

  const globalResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!isStaff || query.length < 2) return [];

    return globalSearchItems
      .map((item) => ({
        ...item,
        haystack: [item.type, item.title, item.subtitle, ...(item.keywords || [])]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
      }))
      .filter((item) => item.haystack.includes(query))
      .slice(0, 12);
  }, [globalSearchItems, isStaff, search]);

  const openGlobalResult = (item) => {
    navigate(item.path, item.state ? { state: item.state } : undefined);
    setSearch("");
    setSearchOpen(false);
    notify(`Opened ${item.type}: ${item.title}`);
  };

  const openNotification = (item) => {
    if (!item.path) return;

    navigate(item.path, item.state ? { state: item.state } : undefined);
    setNotificationsOpen(false);
  };

  const handleSearch = (event) => {
    event.preventDefault();
    const query = search.trim();

    if (!query) return;

    if (isStaff) {
      if (globalResults.length > 0) {
        openGlobalResult(globalResults[0]);
        return;
      }

      setSearchOpen(true);
      notify(`No clinic results found for "${query}"`);
    } else {
      navigate("/parent/dashboard");
      notify("Open a child card to view records, vaccines, or billing.");
    }
  };

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button
          className="hamburger-btn"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div
          className="global-search-wrap"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setSearchOpen(false);
            }
          }}
        >
          <form className="global-search" onSubmit={handleSearch}>
            <span className="ti ti-search" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder={
                isStaff
                  ? "Search patients, guardians, items, vaccines..."
                  : "Search portal..."
              }
              aria-label="Global search"
            />
          </form>

          {isStaff && searchOpen && (
            <div className="global-search-panel">
              {search.trim().length < 2 ? (
                <p className="global-search-hint">
                  Search patients, guardians, vaccine stocks, inventory items,
                  vaccine records, and medical records.
                </p>
              ) : globalResults.length === 0 ? (
                <p className="global-search-hint">No matching clinic records found.</p>
              ) : (
                globalResults.map((item) => (
                  <button
                    key={item.id}
                    className="global-search-result"
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => openGlobalResult(item)}
                  >
                    <span className={item.icon} />
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.subtitle}</p>
                    </div>
                    <small>{item.type}</small>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-date">
          <span className="ti ti-calendar-event" />
          {today}
        </div>

        <div className="notification-wrap">
          <button
            className="icon-btn notification-btn"
            type="button"
            onClick={() => setNotificationsOpen((open) => !open)}
            aria-label="Open notifications"
          >
            <span className="ti ti-bell" />
            {notificationItems.length > 0 && <i>{notificationItems.length}</i>}
          </button>

          {notificationsOpen && (
            <div className="notification-menu">
              <div className="notification-head">
                <strong>Notifications</strong>
                <span>{notificationItems.length} item(s)</span>
              </div>
              {notificationItems.length === 0 ? (
                <p className="notification-empty">No reminders right now.</p>
              ) : (
                notificationItems.map((item) =>
                  item.path ? (
                    <button
                      className="notification-item"
                      key={item.id}
                      type="button"
                      onClick={() => openNotification(item)}
                    >
                      <span className={item.icon} />
                      <div>
                        <strong>{item.title}</strong>
                        <p>{item.body}</p>
                      </div>
                    </button>
                  ) : (
                    <div className="notification-item" key={item.id}>
                      <span className={item.icon} />
                      <div>
                        <strong>{item.title}</strong>
                        <p>{item.body}</p>
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          )}
        </div>

        <div className="user-chip">
          <div className="avatar">
            {user?.name?.charAt(0)?.toUpperCase() || "K"}
          </div>
          <div className="user-info">
            <strong>{user?.name || "Kids First"}</strong>
            <span>{user?.role || "clinic user"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Topbar;
