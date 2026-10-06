import React, { useState, useEffect } from "react";
import Icon from "../../../components/common/Icon.jsx";
import { toast } from "react-hot-toast";
import patientService from "../../../api/services/patientService";
import "./PatientDirectoryTable.css";

// SVG Avatars for male/female patients matching the screenshot visual design
const Avatar = ({ gender, name }) => {
  const isFemale = gender?.toLowerCase().includes("female");
  const bg = isFemale ? "#fce7f3" : "#e0f2fe";
  const headColor = isFemale ? "#db2777" : "#0284c7";
  const hairColor = isFemale ? "#831843" : "#0f172a";

  return (
    <div className="pd-avatar" style={{ backgroundColor: bg }}>
      <svg viewBox="0 0 36 36" width="32" height="32">
        <circle cx="18" cy="18" r="18" fill={bg} />
        {/* Hair background */}
        <path
          d={isFemale ? "M10 18 C10 10, 26 10, 26 18 C26 24, 28 26, 28 28 C26 30, 10 30, 8 28 C8 26, 10 24, 10 18 Z" : "M11 15 C11 9, 25 9, 25 15 Z"}
          fill={hairColor}
        />
        {/* Face */}
        <circle cx="18" cy="16" r="7" fill="#fde047" />
        {/* Body/Shoulders */}
        <path d="M9 32 C9 25, 27 25, 27 32 Z" fill={headColor} />
      </svg>
    </div>
  );
};

const DEFAULT_PATIENTS = [
  {
    id: 1,
    uhid: "UHID12345",
    name: "Rohit Kumar",
    age: 28,
    gender: "Male",
    phone: "9876543210",
    type: "OPD",
    lastVisitDate: "29-09-2026",
    department: "General Medicine",
    status: "Active",
    bloodGroup: "O+"
  },
  {
    id: 2,
    uhid: "UHID12346",
    name: "Priya Singh",
    age: 34,
    gender: "Female",
    phone: "8765432109",
    type: "IPD",
    lastVisitDate: "27-09-2026",
    department: "Gynecology",
    status: "Admitted",
    bloodGroup: "B+"
  },
  {
    id: 3,
    uhid: "UHID12347",
    name: "Amit Gupta",
    age: 45,
    gender: "Male",
    phone: "7654321098",
    type: "Emergency",
    lastVisitDate: "28-09-2026",
    department: "Emergency",
    status: "Discharged",
    bloodGroup: "A+"
  },
  {
    id: 4,
    uhid: "UHID12348",
    name: "Suman Yadav",
    age: 19,
    gender: "Female",
    phone: "9876123456",
    type: "OPD",
    lastVisitDate: "25-09-2026",
    department: "Dermatology",
    status: "Active",
    bloodGroup: "AB+"
  },
  {
    id: 5,
    uhid: "UHID12349",
    name: "Shivam Pandey",
    age: 52,
    gender: "Male",
    phone: "9123456780",
    type: "IPD",
    lastVisitDate: "26-09-2026",
    department: "Cardiology",
    status: "Admitted",
    bloodGroup: "O-"
  },
  {
    id: 6,
    uhid: "UHID12350",
    name: "Neha Verma",
    age: 31,
    gender: "Female",
    phone: "9988776655",
    type: "OPD",
    lastVisitDate: "24-09-2026",
    department: "Radiology",
    status: "Active",
    bloodGroup: "A-"
  },
  {
    id: 7,
    uhid: "UHID12351",
    name: "Abdul Rahman",
    age: 40,
    gender: "Male",
    phone: "8877665544",
    type: "Emergency",
    lastVisitDate: "23-09-2026",
    department: "Emergency",
    status: "Discharged",
    bloodGroup: "B-"
  },
  {
    id: 8,
    uhid: "UHID12352",
    name: "Kavita Srivastava",
    age: 36,
    gender: "Female",
    phone: "9234567890",
    type: "OPD",
    lastVisitDate: "20-09-2026",
    department: "Endocrinology",
    status: "Active",
    bloodGroup: "O+"
  },
  {
    id: 9,
    uhid: "UHID12353",
    name: "Manoj Tiwari",
    age: 60,
    gender: "Male",
    phone: "9345678901",
    type: "IPD",
    lastVisitDate: "18-09-2026",
    department: "Orthopedics",
    status: "Discharged",
    bloodGroup: "AB-"
  },
  {
    id: 10,
    uhid: "UHID12354",
    name: "Pooja Mishra",
    age: 27,
    gender: "Female",
    phone: "8765901234",
    type: "OPD",
    lastVisitDate: "15-09-2026",
    department: "Obstetrics & Gynecology",
    status: "Active",
    bloodGroup: "A+"
  }
];

export default function PatientDirectoryTable() {
  const [patients, setPatients] = useState(DEFAULT_PATIENTS);
  const [loading, setLoading] = useState(false);
  
  // Search & Filter States
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [patientType, setPatientType] = useState("All Types");
  const [department, setDepartment] = useState("All Departments");
  const [statusFilter, setStatusFilter] = useState("Active");
  const [genderFilter, setGenderFilter] = useState("All");
  const [ageGroup, setAgeGroup] = useState("All");
  const [bloodGroup, setBloodGroup] = useState("All");
  
  // Tab State
  const [activeTab, setActiveTab] = useState("All Patients");
  const [viewMode, setViewMode] = useState("list"); // list or grid
  const [selectedPatients, setSelectedPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const data = await patientService.getAll();
        if (data && data.length > 0) {
          const mapped = data.map((p, index) => {
            const age = p.date_of_birth
              ? Math.floor((new Date() - new Date(p.date_of_birth).getTime()) / 3.15576e10)
              : 30 + (index % 20);
            return {
              id: p.id || index + 1,
              uhid: p.uhid || `UHID${12345 + index}`,
              name: p.full_name || p.name || `Patient ${index + 1}`,
              age,
              gender: p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1) : index % 2 === 0 ? "Male" : "Female",
              phone: p.phone || `98765${43210 + index}`,
              type: p.category || (index % 3 === 0 ? "IPD" : index % 5 === 0 ? "Emergency" : "OPD"),
              lastVisitDate: p.created_at ? new Date(p.created_at).toLocaleDateString("en-GB") : "28-09-2026",
              department: p.department || (index % 2 === 0 ? "General Medicine" : "Cardiology"),
              status: index % 3 === 1 ? "Admitted" : index % 3 === 2 ? "Discharged" : "Active",
              bloodGroup: p.blood_group || "O+"
            };
          });
          setPatients(mapped);
        }
      } catch (error) {
        console.log("Using default patient directory data");
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const handleReset = () => {
    setSearch("");
    setFromDate("");
    setToDate("");
    setPatientType("All Types");
    setDepartment("All Departments");
    setStatusFilter("All");
    setGenderFilter("All");
    setAgeGroup("All");
    setBloodGroup("All");
    setActiveTab("All Patients");
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedPatients(filteredPatients.map(p => p.id));
    } else {
      setSelectedPatients([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedPatients.includes(id)) {
      setSelectedPatients(selectedPatients.filter(item => item !== id));
    } else {
      setSelectedPatients([...selectedPatients, id]);
    }
  };

  // Filter Logic
  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.uhid.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search);

    const matchesTab =
      activeTab === "All Patients" ||
      (activeTab === "OPD" && p.type === "OPD") ||
      (activeTab === "IPD" && p.type === "IPD") ||
      (activeTab === "Emergency" && p.type === "Emergency");

    const matchesType = patientType === "All Types" || p.type === patientType;
    const matchesDept = department === "All Departments" || p.department === department;
    const matchesStatus = statusFilter === "All" || p.status === statusFilter;
    const matchesGender = genderFilter === "All" || p.gender === genderFilter;
    const matchesBlood = bloodGroup === "All" || p.bloodGroup === bloodGroup;

    return (
      matchesSearch &&
      matchesTab &&
      matchesType &&
      matchesDept &&
      matchesStatus &&
      matchesGender &&
      matchesBlood
    );
  });

  const getPillClass = (type) => {
    switch (type) {
      case "OPD":
        return "pd-pill--opd";
      case "IPD":
        return "pd-pill--ipd";
      case "Emergency":
        return "pd-pill--emergency";
      default:
        return "pd-pill--opd";
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Active":
        return "pd-status--active";
      case "Admitted":
        return "pd-status--admitted";
      case "Discharged":
        return "pd-status--discharged";
      default:
        return "pd-status--active";
    }
  };

  return (
    <div className="pd-wrapper">
      {/* 1. TOP FILTER CARD */}
      <div className="pd-filter-card">
        <div className="pd-filter-top">
          {/* Search Patient Box */}
          <div className="pd-search-block">
            <div className="pd-section-label">
              <Icon name="LuUser" size={16} className="pd-label-icon" />
              <span>Search Patient</span>
            </div>
            <div className="pd-search-input-group">
              <div className="pd-input-with-icon">
                <Icon name="LuSearch" size={16} className="pd-search-icon" />
                <input
                  type="text"
                  placeholder="Search by UHID, Name, Mobile, Father Name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button type="button" className="pd-btn-search">
                <Icon name="LuSearch" size={15} />
                <span>Search</span>
              </button>
            </div>
          </div>

          {/* Date Range Box */}
          <div className="pd-date-block">
            <div className="pd-section-label">
              <Icon name="LuCalendar" size={16} className="pd-label-icon" />
              <span>Date Range</span>
            </div>
            <div className="pd-date-inputs">
              <div className="pd-date-input-wrap">
                <Icon name="LuCalendar" size={15} className="pd-cal-icon" />
                <input
                  type="text"
                  placeholder="DD-MM-YYYY"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  onFocus={(e) => (e.target.type = "date")}
                  onBlur={(e) => !e.target.value && (e.target.type = "text")}
                />
              </div>
              <span className="pd-date-to">to</span>
              <div className="pd-date-input-wrap">
                <Icon name="LuCalendar" size={15} className="pd-cal-icon" />
                <input
                  type="text"
                  placeholder="DD-MM-YYYY"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  onFocus={(e) => (e.target.type = "date")}
                  onBlur={(e) => !e.target.value && (e.target.type = "text")}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Dropdowns Row */}
        <div className="pd-filter-dropdowns">
          <div className="pd-select-field">
            <label>Patient Type</label>
            <div className="pd-select-wrapper">
              <select value={patientType} onChange={(e) => setPatientType(e.target.value)}>
                <option value="All Types">All Types</option>
                <option value="OPD">OPD</option>
                <option value="IPD">IPD</option>
                <option value="Emergency">Emergency</option>
              </select>
              <Icon name="LuChevronDown" size={14} className="pd-select-arrow" />
            </div>
          </div>

          <div className="pd-select-field">
            <label>Department</label>
            <div className="pd-select-wrapper">
              <select value={department} onChange={(e) => setDepartment(e.target.value)}>
                <option value="All Departments">All Departments</option>
                <option value="General Medicine">General Medicine</option>
                <option value="Gynecology">Gynecology</option>
                <option value="Emergency">Emergency</option>
                <option value="Dermatology">Dermatology</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Radiology">Radiology</option>
                <option value="Endocrinology">Endocrinology</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Obstetrics & Gynecology">Obstetrics & Gynecology</option>
              </select>
              <Icon name="LuChevronDown" size={14} className="pd-select-arrow" />
            </div>
          </div>

          <div className="pd-select-field">
            <label>Status</label>
            <div className="pd-select-wrapper">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="Admitted">Admitted</option>
                <option value="Discharged">Discharged</option>
              </select>
              <Icon name="LuChevronDown" size={14} className="pd-select-arrow" />
            </div>
          </div>

          <div className="pd-select-field">
            <label>Gender</label>
            <div className="pd-select-wrapper">
              <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
                <option value="All">All</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <Icon name="LuChevronDown" size={14} className="pd-select-arrow" />
            </div>
          </div>

          <div className="pd-select-field">
            <label>Age Group</label>
            <div className="pd-select-wrapper">
              <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)}>
                <option value="All">All</option>
                <option value="Child (0-12)">Child (0-12)</option>
                <option value="Teen (13-19)">Teen (13-19)</option>
                <option value="Adult (20-59)">Adult (20-59)</option>
                <option value="Senior (60+)">Senior (60+)</option>
              </select>
              <Icon name="LuChevronDown" size={14} className="pd-select-arrow" />
            </div>
          </div>

          <div className="pd-select-field">
            <label>Blood Group</label>
            <div className="pd-select-wrapper">
              <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                <option value="All">All</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
              <Icon name="LuChevronDown" size={14} className="pd-select-arrow" />
            </div>
          </div>

          <div className="pd-filter-actions">
            <button type="button" className="pd-btn-more-filters">
              <Icon name="LuFilter" size={15} />
              <span>More Filters</span>
            </button>
            <button type="button" className="pd-btn-reset" onClick={handleReset}>
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN PATIENTS DIRECTORY TABLE CARD */}
      <div className="pd-main-card">
        {/* Header Tabs & Actions Toolbar */}
        <div className="pd-toolbar">
          <div className="pd-tabs">
            <button
              type="button"
              className={`pd-tab ${activeTab === "All Patients" ? "pd-tab--active" : ""}`}
              onClick={() => setActiveTab("All Patients")}
            >
              All Patients (12,458)
            </button>
            <button
              type="button"
              className={`pd-tab ${activeTab === "OPD" ? "pd-tab--active" : ""}`}
              onClick={() => setActiveTab("OPD")}
            >
              OPD (8,642)
            </button>
            <button
              type="button"
              className={`pd-tab ${activeTab === "IPD" ? "pd-tab--active" : ""}`}
              onClick={() => setActiveTab("IPD")}
            >
              IPD (2,156)
            </button>
            <button
              type="button"
              className={`pd-tab ${activeTab === "Emergency" ? "pd-tab--active" : ""}`}
              onClick={() => setActiveTab("Emergency")}
            >
              Emergency (482)
            </button>
          </div>

          <div className="pd-toolbar-actions">
            <button type="button" className="pd-btn-outline" onClick={() => toast.success("Exporting Patient Directory...")}>
              <Icon name="LuDownload" size={15} />
              <span>Export</span>
            </button>
            <button type="button" className="pd-btn-outline" onClick={() => window.print()}>
              <Icon name="LuPrinter" size={15} />
              <span>Print</span>
            </button>

            <div className="pd-view-toggle">
              <button
                type="button"
                className={`pd-view-btn ${viewMode === "list" ? "pd-view-btn--active" : ""}`}
                onClick={() => setViewMode("list")}
                title="List View"
              >
                <Icon name="LuList" size={16} />
              </button>
              <button
                type="button"
                className={`pd-view-btn ${viewMode === "grid" ? "pd-view-btn--active" : ""}`}
                onClick={() => setViewMode("grid")}
                title="Grid View"
              >
                <Icon name="LuGrid" size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="pd-table-container">
          <table className="pd-table">
            <thead>
              <tr>
                <th className="pd-col-cb">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      filteredPatients.length > 0 &&
                      selectedPatients.length === filteredPatients.length
                    }
                  />
                </th>
                <th className="pd-col-idx">#</th>
                <th className="pd-col-sortable">
                  UHID <span className="pd-sort-arrow">↕</span>
                </th>
                <th className="pd-col-sortable">
                  Patient Name <span className="pd-sort-arrow">↕</span>
                </th>
                <th>Age / Gender</th>
                <th>Mobile No.</th>
                <th>Patient Type</th>
                <th>Last Visit / Admission</th>
                <th className="pd-col-sortable">
                  Status <span className="pd-sort-arrow">↕</span>
                </th>
                <th className="pd-col-action">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="pd-loading">
                    Loading directory...
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="10" className="pd-empty">
                    No patients found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((p, idx) => (
                  <tr key={p.id} className={selectedPatients.includes(p.id) ? "pd-row--selected" : ""}>
                    <td className="pd-col-cb">
                      <input
                        type="checkbox"
                        checked={selectedPatients.includes(p.id)}
                        onChange={() => handleSelectOne(p.id)}
                      />
                    </td>
                    <td className="pd-col-idx">{idx + 1}</td>
                    <td className="pd-col-uhid">{p.uhid}</td>
                    <td className="pd-col-name">
                      <div className="pd-patient-cell">
                        <Avatar gender={p.gender} name={p.name} />
                        <span className="pd-patient-name">{p.name}</span>
                      </div>
                    </td>
                    <td>{p.age} Y / {p.gender}</td>
                    <td>{p.phone}</td>
                    <td>
                      <span className={`pd-pill ${getPillClass(p.type)}`}>
                        {p.type}
                      </span>
                    </td>
                    <td>
                      <div className="pd-visit-cell">
                        <div className="pd-visit-date">{p.lastVisitDate}</div>
                        <div className="pd-visit-dept">{p.department}</div>
                      </div>
                    </td>
                    <td>
                      <span className={`pd-status-badge ${getStatusClass(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="pd-col-action">
                      <div className="pd-action-icons">
                        <button
                          type="button"
                          className="pd-icon-btn"
                          title="View Details"
                          onClick={() => setSelectedPatient(p)}
                        >
                          <Icon name="LuEye" size={16} />
                        </button>
                        <button
                          type="button"
                          className="pd-icon-btn"
                          title="Edit Patient"
                          onClick={() => toast.success(`Editing ${p.name}`)}
                        >
                          <Icon name="LuPencil" size={15} />
                        </button>
                        <button
                          type="button"
                          className="pd-icon-btn"
                          title="More Options"
                        >
                          <Icon name="LuMoreVertical" size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="pd-pagination">
          <div className="pd-pag-info">
            Showing 1 to 10 of 12,458 patients
          </div>

          <div className="pd-pag-controls">
            <button type="button" className="pd-pag-nav" disabled>
              <Icon name="LuChevronLeft" size={15} />
            </button>
            <button type="button" className="pd-pag-num pd-pag-num--active">1</button>
            <button type="button" className="pd-pag-num">2</button>
            <button type="button" className="pd-pag-num">3</button>
            <button type="button" className="pd-pag-num">4</button>
            <button type="button" className="pd-pag-num">5</button>
            <span className="pd-pag-dots">...</span>
            <button type="button" className="pd-pag-num">1,246</button>
            <button type="button" className="pd-pag-nav">
              <Icon name="LuChevronRight" size={15} />
            </button>
          </div>

          <div className="pd-pag-perpage">
            <select defaultValue="10">
              <option value="10">10 / page</option>
              <option value="25">25 / page</option>
              <option value="50">50 / page</option>
              <option value="100">100 / page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Patient EMR / Details Modal */}
      {selectedPatient && (
        <div className="pd-modal-overlay" onClick={() => setSelectedPatient(null)}>
          <div className="pd-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="pd-modal-header">
              <div className="pd-modal-user">
                <Avatar gender={selectedPatient.gender} name={selectedPatient.name} />
                <div>
                  <h3>{selectedPatient.name}</h3>
                  <p>{selectedPatient.uhid} • {selectedPatient.age} Y / {selectedPatient.gender} • Blood Group: {selectedPatient.bloodGroup}</p>
                </div>
              </div>
              <button
                type="button"
                className="pd-modal-close"
                onClick={() => setSelectedPatient(null)}
              >
                ✕
              </button>
            </div>

            <div className="pd-modal-body">
              <div className="pd-info-grid">
                <div className="pd-info-item">
                  <label>Mobile Number</label>
                  <span>{selectedPatient.phone}</span>
                </div>
                <div className="pd-info-item">
                  <label>Patient Type</label>
                  <span className={`pd-pill ${getPillClass(selectedPatient.type)}`}>
                    {selectedPatient.type}
                  </span>
                </div>
                <div className="pd-info-item">
                  <label>Department</label>
                  <span>{selectedPatient.department}</span>
                </div>
                <div className="pd-info-item">
                  <label>Current Status</label>
                  <span className={`pd-status-badge ${getStatusClass(selectedPatient.status)}`}>
                    {selectedPatient.status}
                  </span>
                </div>
                <div className="pd-info-item">
                  <label>Last Visit Date</label>
                  <span>{selectedPatient.lastVisitDate}</span>
                </div>
                <div className="pd-info-item">
                  <label>Attending Consultant</label>
                  <span>Dr. Rajesh Sharma (General Physician)</span>
                </div>
              </div>
            </div>

            <div className="pd-modal-footer">
              <button
                type="button"
                className="pd-btn-outline"
                onClick={() => setSelectedPatient(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="pd-btn-search"
                onClick={() => {
                  toast.success("Printing EMR Summary...");
                  window.print();
                }}
              >
                <Icon name="LuPrinter" size={15} />
                <span>Print Medical Summary</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

