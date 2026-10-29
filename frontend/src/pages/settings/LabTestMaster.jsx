import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Icon from "../../components/common/Icon.jsx";
import settingsService from "../../api/services/settingsService";

const DEFAULT_SECTIONS = [
  "Biochemistry",
  "Hematology",
  "Microbiology",
  "Serology",
  "Hormones",
  "Clinical Pathology",
  "Immunology",
  "General",
];

const DEFAULT_SAMPLE_TYPES = [
  "Blood (EDTA)",
  "Serum",
  "Plasma",
  "Blood (Fluoride)",
  "Blood (Citrate)",
  "Urine",
  "Stool",
  "Sputum",
  "CSF",
  "Swab",
  "Other",
];

export default function LabTestMaster() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSection, setSelectedSection] = useState("All");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Custom Input States for Section & Specimen Type
  const [isCustomSection, setIsCustomSection] = useState(false);
  const [customSection, setCustomSection] = useState("");
  const [isCustomSpecimen, setIsCustomSpecimen] = useState(false);
  const [customSpecimen, setCustomSpecimen] = useState("");

  // Form State
  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    labSection: "Biochemistry",
    specimenType: "Serum",
    price: 350,
    tatHours: 4,
    fastingRequired: false,
    parameters: [
      { name: "", code: "", unit: "", dataType: "numeric" },
    ],
  });

  const loadTests = async () => {
    setLoading(true);
    try {
      const data = await settingsService.getTestDefinitions({ includeInactive: true });
      setTests(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Failed to load lab test definitions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTests();
  }, []);

  // Dynamic sections & sample types: merges standard defaults with all unique values stored in PostgreSQL
  const availableSections = Array.from(
    new Set([
      ...DEFAULT_SECTIONS,
      ...tests.map((t) => t.lab_section).filter(Boolean),
    ])
  );

  const filterSections = ["All", ...availableSections];

  const availableSampleTypes = Array.from(
    new Set([
      ...DEFAULT_SAMPLE_TYPES,
      ...tests.map((t) => t.specimen_type).filter(Boolean),
    ])
  );

  const handleOpenAdd = () => {
    setEditingTest(null);
    setIsCustomSection(false);
    setCustomSection("");
    setIsCustomSpecimen(false);
    setCustomSpecimen("");
    setForm({
      name: "",
      code: "",
      description: "",
      labSection: availableSections[0] || "Biochemistry",
      specimenType: availableSampleTypes[0] || "Serum",
      price: 350,
      tatHours: 4,
      fastingRequired: false,
      parameters: [{ name: "", code: "", unit: "", dataType: "numeric" }],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (test) => {
    setEditingTest(test);
    setIsCustomSection(false);
    setCustomSection("");
    setIsCustomSpecimen(false);
    setCustomSpecimen("");
    setForm({
      name: test.name || "",
      code: test.code || "",
      description: test.description || "",
      labSection: test.lab_section || "Biochemistry",
      specimenType: test.specimen_type || "Serum",
      price: Number(test.price) || 350,
      tatHours: Number(test.tat_hours) || 4,
      fastingRequired: Boolean(test.fasting_required),
      parameters: [],
    });
    setIsModalOpen(true);
  };

  const handleAddParamRow = () => {
    setForm((prev) => ({
      ...prev,
      parameters: [
        ...prev.parameters,
        { name: "", code: "", unit: "", dataType: "numeric" },
      ],
    }));
  };

  const handleRemoveParamRow = (index) => {
    setForm((prev) => ({
      ...prev,
      parameters: prev.parameters.filter((_, idx) => idx !== index),
    }));
  };

  const handleParamChange = (index, field, value) => {
    setForm((prev) => {
      const updated = [...prev.parameters];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, parameters: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      toast.error("Test name and code are required");
      return;
    }

    const finalLabSection = (isCustomSection ? customSection : form.labSection)?.trim();
    const finalSpecimenType = (isCustomSpecimen ? customSpecimen : form.specimenType)?.trim();

    if (!finalLabSection) {
      toast.error("Please specify a Lab Section / Department");
      return;
    }
    if (!finalSpecimenType) {
      toast.error("Please specify a Sample / Specimen Type");
      return;
    }

    setSubmitting(true);
    try {
      if (editingTest) {
        await settingsService.updateTestDefinition(editingTest.service_id || editingTest.id, {
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          description: form.description || null,
          labSection: finalLabSection,
          specimenType: finalSpecimenType,
          price: Number(form.price),
          tatHours: Number(form.tatHours),
          fastingRequired: form.fastingRequired,
        });
        toast.success("Lab test updated successfully!");
      } else {
        const cleanParams = form.parameters
          .filter((p) => p.name.trim())
          .map((p) => ({
            name: p.name.trim(),
            code: (p.code || p.name).trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10),
            unit: p.unit?.trim() || null,
            dataType: p.dataType || "numeric",
          }));

        await settingsService.createTestDefinition({
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          description: form.description || null,
          labSection: finalLabSection,
          specimenType: finalSpecimenType,
          price: Number(form.price),
          tatHours: Number(form.tatHours),
          fastingRequired: form.fastingRequired,
          parameters: cleanParams,
        });
        toast.success("In-house lab test created successfully!");
      }

      setIsModalOpen(false);
      await loadTests();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to save lab test");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (test) => {
    const testId = test.service_id || test.id;
    if (!window.confirm(`Are you sure you want to deactivate or remove "${test.name}"?`)) {
      return;
    }

    try {
      await settingsService.deleteTestDefinition(testId);
      toast.success(`Lab test "${test.name}" removed successfully!`);
      await loadTests();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to remove lab test");
    }
  };

  // Filtered List
  const filteredTests = tests.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      t.name?.toLowerCase().includes(q) ||
      t.code?.toLowerCase().includes(q) ||
      t.lab_section?.toLowerCase().includes(q);

    const matchesSection =
      selectedSection === "All" ||
      t.lab_section?.toLowerCase() === selectedSection.toLowerCase();

    return matchesSearch && matchesSection;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Icon name="LuTestTube" className="text-teal-600" size={20} />
            <span>In-House Lab Test Catalog</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure internal pathology & diagnostic test definitions, specimen types, standard rates, and analyte parameters.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-4 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          <Icon name="LuPlus" size={16} />
          <span>Add In-House Test</span>
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Tests</span>
          <div className="text-2xl font-bold text-slate-800 mt-1">{tests.length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Active Tests</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {tests.filter((t) => t.is_active !== false).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Lab Sections</span>
          <div className="text-2xl font-bold text-indigo-600 mt-1">
            {new Set(tests.map((t) => t.lab_section).filter(Boolean)).size || 1}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Avg Price (₹)</span>
          <div className="text-2xl font-bold text-purple-600 mt-1">
            ₹
            {tests.length > 0
              ? Math.round(
                  tests.reduce((sum, t) => sum + Number(t.price || 0), 0) / tests.length
                )
              : 0}
          </div>
        </div>
      </div>

      {/* Search & Section Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Icon
            name="LuSearch"
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search test name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {filterSections.map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => setSelectedSection(sec)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedSection === sec
                  ? "bg-teal-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {sec}
            </button>
          ))}
        </div>
      </div>

      {/* Test Definitions Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading test catalog...</span>
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Icon name="LuTestTube" size={36} className="mx-auto text-slate-300 mb-2" />
            <p className="font-medium text-slate-700">No test definitions found</p>
            <p className="text-xs text-slate-400 mt-1">
              Try adjusting your search or add a new in-house test.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Test Code</th>
                  <th className="py-3 px-4">Investigation Name</th>
                  <th className="py-3 px-4">Section</th>
                  <th className="py-3 px-4">Sample Type</th>
                  <th className="py-3 px-4">TAT</th>
                  <th className="py-3 px-4">Standard Rate</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTests.map((t) => (
                  <tr key={t.service_id || t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-xs text-teal-700">
                      {t.code}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{t.name}</div>
                      {t.description && (
                        <div className="text-xs text-slate-400 truncate max-w-xs">{t.description}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className="inline-flex px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                        {t.lab_section || "General"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {t.specimen_type || "Blood"}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {t.tat_hours ? `${t.tat_hours} Hours` : "4 Hours"}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      ₹{Number(t.price || 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {t.is_active !== false ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(t)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 hover:bg-indigo-50 rounded transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(t)}
                        className="text-xs text-rose-600 hover:text-rose-800 font-medium px-2 py-1 hover:bg-rose-50 rounded transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Icon name="LuTestTube" className="text-teal-600" size={18} />
                <span>{editingTest ? "Edit In-House Lab Test" : "Add In-House Lab Test"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Icon name="LuX" size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Test Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Complete Blood Count (CBC)"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Test Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LAB-CBC"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 uppercase font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Lab Section / Department *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomSection(!isCustomSection);
                        if (!isCustomSection) setCustomSection("");
                      }}
                      className="text-xs text-teal-600 hover:text-teal-700 font-medium inline-flex items-center gap-1"
                    >
                      {isCustomSection ? "← Choose Existing" : "+ Custom Section"}
                    </button>
                  </div>
                  {isCustomSection ? (
                    <input
                      type="text"
                      required
                      placeholder="e.g. Histopathology, Molecular Biology"
                      value={customSection}
                      onChange={(e) => setCustomSection(e.target.value)}
                      className="w-full text-sm px-3 py-2 border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-teal-50/20"
                    />
                  ) : (
                    <select
                      value={form.labSection}
                      onChange={(e) => {
                        if (e.target.value === "__custom__") {
                          setIsCustomSection(true);
                          setCustomSection("");
                        } else {
                          setForm({ ...form, labSection: e.target.value });
                        }
                      }}
                      className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
                    >
                      {availableSections.map((sec) => (
                        <option key={sec} value={sec}>
                          {sec}
                        </option>
                      ))}
                      <option value="__custom__" className="text-teal-600 font-semibold">
                        + Add Custom Section...
                      </option>
                    </select>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Sample / Specimen Type *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomSpecimen(!isCustomSpecimen);
                        if (!isCustomSpecimen) setCustomSpecimen("");
                      }}
                      className="text-xs text-teal-600 hover:text-teal-700 font-medium inline-flex items-center gap-1"
                    >
                      {isCustomSpecimen ? "← Choose Existing" : "+ Custom Sample Type"}
                    </button>
                  </div>
                  {isCustomSpecimen ? (
                    <input
                      type="text"
                      required
                      placeholder="e.g. Synovial Fluid, Nasal Swab, Pleural Tap"
                      value={customSpecimen}
                      onChange={(e) => setCustomSpecimen(e.target.value)}
                      className="w-full text-sm px-3 py-2 border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-teal-50/20"
                    />
                  ) : (
                    <select
                      value={form.specimenType}
                      onChange={(e) => {
                        if (e.target.value === "__custom__") {
                          setIsCustomSpecimen(true);
                          setCustomSpecimen("");
                        } else {
                          setForm({ ...form, specimenType: e.target.value });
                        }
                      }}
                      className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
                    >
                      {availableSampleTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                      <option value="__custom__" className="text-teal-600 font-semibold">
                        + Add Custom Sample Type...
                      </option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Standard Rate / Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Turnaround Time (Hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.tatHours}
                    onChange={(e) => setForm({ ...form, tatHours: e.target.value })}
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Clinical Indication
                </label>
                <textarea
                  rows="2"
                  placeholder="Optional details or patient instructions"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="fastingRequired"
                  checked={form.fastingRequired}
                  onChange={(e) => setForm({ ...form, fastingRequired: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                />
                <label htmlFor="fastingRequired" className="text-xs text-slate-700 font-medium">
                  Requires Overnight Fasting (8 - 12 hours)
                </label>
              </div>

              {/* Dynamic Parameters List for New Test */}
              {!editingTest && (
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Analytes / Test Parameters
                    </span>
                    <button
                      type="button"
                      onClick={handleAddParamRow}
                      className="text-xs text-teal-600 hover:text-teal-800 font-semibold flex items-center gap-1"
                    >
                      <Icon name="LuPlus" size={14} />
                      <span>Add Analyte</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {form.parameters.map((p, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <input
                          type="text"
                          placeholder="Analyte Name (e.g. Hemoglobin)"
                          value={p.name}
                          onChange={(e) => handleParamChange(idx, "name", e.target.value)}
                          className="flex-1 text-xs px-2.5 py-1.5 border border-slate-200 rounded bg-white"
                        />
                        <input
                          type="text"
                          placeholder="Unit (e.g. g/dL)"
                          value={p.unit}
                          onChange={(e) => handleParamChange(idx, "unit", e.target.value)}
                          className="w-24 text-xs px-2.5 py-1.5 border border-slate-200 rounded bg-white"
                        />
                        <select
                          value={p.dataType}
                          onChange={(e) => handleParamChange(idx, "dataType", e.target.value)}
                          className="w-24 text-xs px-2 py-1.5 border border-slate-200 rounded bg-white"
                        >
                          <option value="numeric">Numeric</option>
                          <option value="text">Text</option>
                          <option value="coded">Coded</option>
                        </select>
                        {form.parameters.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveParamRow(idx)}
                            className="text-rose-500 hover:text-rose-700 p-1"
                          >
                            <Icon name="LuTrash2" size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{editingTest ? "Update Lab Test" : "Create Lab Test"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
