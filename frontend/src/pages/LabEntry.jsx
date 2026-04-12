import { useState, useEffect, useRef } from "react";
import { FlaskConical, CheckCircle, XCircle, AlertTriangle, X } from "lucide-react";
import {
  createLabResult, fetchPatients, fetchTestCatalog,
  updateLabResult, fetchLabResults, addCustomTest
} from "../api/services";
import axiosClient from "../api/axiosClient";

// ── Date Input ────────────────────────────────────────────────
function DateInput({ value, onChange, label }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>}
      <input type="date" value={value} onChange={e => onChange(e.target.value)}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400" />
    </div>
  );
}

// ── Test Combobox ─────────────────────────────────────────────
function TestCombobox({ catalog, value, onChange, onSelect }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef();

  useEffect(() => { setQuery(value); }, [value]);
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query.trim() === ""
    ? catalog
    : catalog.filter(t => t.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-slate-600 mb-1">Test Name</label>
      <input type="text" placeholder="Search or type test name..."
        value={query}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400" />
      {open && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-2 text-sm text-slate-400">
              No match — "{query}" will be saved as a new custom test
            </div>
          ) : filtered.map(t => (
            <button key={t.name} onMouseDown={() => { onSelect(t); setQuery(t.name); setOpen(false); }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-cyan-50 border-b border-slate-50 last:border-0">
              <span className="font-medium text-slate-800">{t.name}</span>
              <span className="text-slate-400 ml-2 text-xs">{t.unit} · {t.reference_range}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Patient Search Block (shared) ─────────────────────────────
function PatientSearchBlock({ selectedPatient, onSelect, onClear }) {
  const [patientSearch, setPatientSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching]         = useState(false);

  const handleSearch = () => {
    if (!patientSearch.trim()) return;
    setSearching(true);
    fetchPatients(patientSearch).then(res => setSearchResults(res.data)).finally(() => setSearching(false));
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-2">Select Patient</label>
      {!selectedPatient ? (
        <>
          <div className="flex gap-2">
            <input type="text" placeholder="Search by name or patient ID..."
              value={patientSearch} onChange={e => setPatientSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400" />
            <button onClick={handleSearch}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-800">
              {searching ? "..." : "Search"}
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-2 border border-slate-200 rounded-lg overflow-hidden">
              {searchResults.map(p => (
                <button key={p.id} onClick={() => { onSelect(p); setSearchResults([]); setPatientSearch(""); }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-cyan-50 border-b border-slate-100 last:border-0">
                  <span className="font-medium text-slate-800">{p.name}</span>
                  <span className="text-slate-400 ml-2">{p.id}</span>
                </button>
              ))}
            </div>
          )}
          {searchResults.length === 0 && patientSearch && !searching && (
            <p className="text-xs text-slate-400 mt-2">No patients found. Patients must be created by a Clinician first.</p>
          )}
        </>
      ) : (
        <div className="flex items-center justify-between bg-cyan-50 border border-cyan-200 rounded-lg px-4 py-2">
          <div>
            <p className="text-sm font-semibold text-cyan-800">{selectedPatient.name}</p>
            <p className="text-xs text-cyan-600">{selectedPatient.id} · Age {selectedPatient.age} · {selectedPatient.gender}</p>
          </div>
          <button onClick={onClear} className="text-cyan-400 hover:text-cyan-700"><X size={16} /></button>
        </div>
      )}
    </div>
  );
}

// ── Edit Lab Result Modal ─────────────────────────────────────
function EditLabResultModal({ result, catalog, onClose, onSaved }) {
  const [form, setForm]   = useState({ ...result });
  const [status, setStatus] = useState(null);

  const handleSave = () => {
    updateLabResult(result.id, {
      patient_id: form.patient_id, test_name: form.test_name,
      result_value: parseFloat(form.result_value),
      unit: form.unit, reference_range: form.reference_range, date: form.date,
    }).then(() => { onSaved(); onClose(); })
      .catch(() => setStatus("Failed to update."));
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Edit Lab Result</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <TestCombobox catalog={catalog} value={form.test_name}
          onChange={v => setForm({ ...form, test_name: v })}
          onSelect={t => setForm({ ...form, test_name: t.name, unit: t.unit, reference_range: t.reference_range })} />
        {[
          { label: "Result Value",    key: "result_value" },
          { label: "Unit",            key: "unit" },
          { label: "Reference Range", key: "reference_range" },
        ].map(({ label, key }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
            <input type="text" value={form[key]}
              onChange={e => setForm({ ...form, [key]: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400" />
          </div>
        ))}
        <DateInput label="Date" value={form.date} onChange={v => setForm({ ...form, date: v })} />
        {status && <p className="text-sm text-red-500">{status}</p>}
        <button onClick={handleSave}
          className="w-full bg-cyan-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-cyan-700">
          Save Changes
        </button>
      </div>
    </div>
  );
}

// ── Manual Entry ──────────────────────────────────────────────
function ManualEntryForm({ catalog, onCatalogUpdate }) {
  const today = new Date().toISOString().split("T")[0];
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [form, setForm]     = useState({ test_name: "", result_value: "", unit: "", reference_range: "", date: today });
  const [status, setStatus] = useState(null);
  const [recentResults, setRecentResults] = useState([]);
  const [editTarget, setEditTarget]       = useState(null);

  const selectPatient = (p) => {
    setSelectedPatient(p);
    fetchLabResults(p.id).then(res => setRecentResults(res.data));
  };

  const handleSubmit = () => {
    if (!selectedPatient) { setStatus({ type: "error", msg: "Please select a patient first." }); return; }
    if (!form.test_name || !form.result_value || !form.date) { setStatus({ type: "error", msg: "Test name, result and date are required." }); return; }

    const isCustom = !catalog.find(t => t.name === form.test_name);

    const save = () => createLabResult({ ...form, patient_id: selectedPatient.id, result_value: parseFloat(form.result_value) })
      .then(() => {
        setStatus({ type: "success", msg: `Result saved for ${selectedPatient.name}.` });
        setForm({ test_name: "", result_value: "", unit: "", reference_range: "", date: today });
        fetchLabResults(selectedPatient.id).then(res => setRecentResults(res.data));
      })
      .catch(() => setStatus({ type: "error", msg: "Failed to save. Check all fields." }));

    if (isCustom && form.unit && form.reference_range) {
      addCustomTest({ name: form.test_name, unit: form.unit, reference_range: form.reference_range })
        .then(() => onCatalogUpdate())
        .finally(() => save());
    } else {
      save();
    }
  };

  return (
    <div className="space-y-5 max-w-lg">
      {editTarget && (
        <EditLabResultModal result={editTarget} catalog={catalog}
          onClose={() => setEditTarget(null)}
          onSaved={() => fetchLabResults(selectedPatient.id).then(res => setRecentResults(res.data))} />
      )}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-4">
        <PatientSearchBlock
          selectedPatient={selectedPatient}
          onSelect={selectPatient}
          onClear={() => { setSelectedPatient(null); setRecentResults([]); }} />
        <div className="border-t border-slate-100 pt-4 space-y-4">
          <TestCombobox catalog={catalog} value={form.test_name}
            onChange={v => setForm({ ...form, test_name: v })}
            onSelect={t => setForm({ ...form, test_name: t.name, unit: t.unit, reference_range: t.reference_range })} />
          {[
            { label: "Result Value",    key: "result_value" },
            { label: "Unit",            key: "unit" },
            { label: "Reference Range", key: "reference_range" },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
              <input type="text" placeholder={`Enter ${label}`} value={form[key]}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400" />
            </div>
          ))}
          <DateInput label="Date" value={form.date} onChange={v => setForm({ ...form, date: v })} />
        </div>
        {status && <p className={`text-sm ${status.type === "success" ? "text-green-600" : "text-red-500"}`}>{status.msg}</p>}
        <button onClick={handleSubmit}
          className="w-full bg-cyan-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-cyan-700">
          Save Lab Result
        </button>
      </div>
      {recentResults.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-3">Existing Results for {selectedPatient?.name}</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="pb-2">Test</th><th className="pb-2">Value</th>
                <th className="pb-2">Unit</th><th className="pb-2">Date</th><th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {recentResults.map(r => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-1.5 font-medium text-slate-800">{r.test_name}</td>
                  <td className="py-1.5 text-slate-700">{r.result_value}</td>
                  <td className="py-1.5 text-slate-500">{r.unit}</td>
                  <td className="py-1.5 text-slate-400">{r.date}</td>
                  <td className="py-1.5">
                    <button onClick={() => setEditTarget(r)} className="text-xs text-cyan-600 hover:underline">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── CSV Upload ────────────────────────────────────────────────
const REQUIRED_HEADERS = ["test_name", "result_value", "unit", "reference_range", "date"];

function parseCSV(text) {
  const lines = text.trim().split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return { error: "CSV must have a header row and at least one data row." };
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
  const missing = REQUIRED_HEADERS.filter(h => !headers.includes(h));
  if (missing.length > 0) return { error: `Missing columns: ${missing.join(", ")}` };
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map(v => v.trim());
    const row = {};
    headers.forEach((h, idx) => { row[h] = values[idx] ?? ""; });
    rows.push({ rowNum: i + 1, data: row });
  }
  return { headers, rows };
}

function validateRow(row) {
  const errors = [];
  REQUIRED_HEADERS.forEach(f => { if (!row[f] || row[f].trim() === "") errors.push(`${f} is empty`); });
  if (row.result_value && isNaN(parseFloat(row.result_value))) errors.push("result_value must be a number");
  if (row.date && !/^\d{4}-\d{2}-\d{2}$/.test(row.date)) errors.push("date must be YYYY-MM-DD");
  return errors;
}

function CSVUploadForm() {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [preview, setPreview]                 = useState(null);
  const [parseError, setParseError]           = useState(null);
  const [uploadResult, setUploadResult]       = useState(null);
  const [uploading, setUploading]             = useState(false);
  const [dragOver, setDragOver]               = useState(false);

  const processFile = (file) => {
    setUploadResult(null); setParseError(null); setPreview(null);
    if (!file.name.endsWith(".csv")) { setParseError("Only .csv files are accepted."); return; }
    const reader = new FileReader();
    reader.onload = e => {
      const result = parseCSV(e.target.result);
      if (result.error) { setParseError(result.error); return; }
      setPreview({
        headers: result.headers,
        rows: result.rows.map(({ rowNum, data }) => ({ rowNum, data, errors: validateRow(data) }))
      });
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!selectedPatient) return;
    const validRows = preview.rows.filter(r => r.errors.length === 0)
      .map(r => ({
        patient_id: selectedPatient.id,
        test_name: r.data.test_name,
        result_value: parseFloat(r.data.result_value),
        unit: r.data.unit,
        reference_range: r.data.reference_range,
        date: r.data.date,
      }));
    if (validRows.length === 0) { setUploadResult({ type: "error", msg: "No valid rows to upload." }); return; }
    setUploading(true);
    try {
      const res = await axiosClient.post("/lab-results/bulk", { records: validRows });
      setUploadResult({ type: "success", msg: `${res.data.saved} row(s) saved for ${selectedPatient.name}.` });
    } catch { setUploadResult({ type: "error", msg: "Upload failed." }); }
    finally { setUploading(false); }
  };

  const validCount   = preview ? preview.rows.filter(r => r.errors.length === 0).length : 0;
  const invalidCount = preview ? preview.rows.filter(r => r.errors.length > 0).length : 0;

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Patient must be selected first */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
        <PatientSearchBlock
          selectedPatient={selectedPatient}
          onSelect={setSelectedPatient}
          onClear={() => { setSelectedPatient(null); setPreview(null); setUploadResult(null); }} />
      </div>

      {/* Only show upload area after patient selected */}
      {selectedPatient && (
        <>
          <div onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); processFile(e.dataTransfer.files[0]); }}
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer
              ${dragOver ? "border-cyan-400 bg-cyan-50" : "border-slate-200 bg-white"}`}>
            <FlaskConical size={32} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm text-slate-400 mb-1">
              Upload results for <span className="font-semibold text-slate-600">{selectedPatient.name}</span>
            </p>
            <p className="text-xs text-slate-400 mb-3">Drag and drop a CSV file, or</p>
            <label className="cursor-pointer bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-cyan-700">
              Browse File
              <input type="file" accept=".csv" className="hidden" onChange={e => processFile(e.target.files[0])} />
            </label>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-500">
            <p className="font-semibold text-slate-600 mb-1">Expected CSV format (no patient_id needed):</p>
            <code>test_name,result_value,unit,reference_range,date</code><br />
            <code>HbA1c,7.4,%,&lt;5.7,2024-05-01</code>
          </div>

          {parseError && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              <XCircle size={16} />{parseError}
            </div>
          )}

          {preview && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-700">Preview</h3>
                <div className="flex gap-3 text-xs">
                  <span className="text-green-600 font-medium">{validCount} valid</span>
                  {invalidCount > 0 && <span className="text-red-500 font-medium">{invalidCount} invalid</span>}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-100">
                      <th className="pb-2 pr-3">Row</th>
                      {preview.headers.map(h => <th key={h} className="pb-2 pr-3 capitalize">{h.replace(/_/g, " ")}</th>)}
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map(({ rowNum, data, errors }) => (
                      <tr key={rowNum} className={`border-b border-slate-50 ${errors.length > 0 ? "bg-red-50" : ""}`}>
                        <td className="py-1 pr-3 text-slate-400">{rowNum}</td>
                        {preview.headers.map(h => <td key={h} className="py-1 pr-3 text-slate-700">{data[h]}</td>)}
                        <td className="py-1">
                          {errors.length === 0
                            ? <CheckCircle size={14} className="text-green-500" />
                            : <span className="text-red-500 flex items-center gap-1"><AlertTriangle size={14} />{errors.join("; ")}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {uploadResult && (
                <p className={`text-sm ${uploadResult.type === "success" ? "text-green-600" : "text-red-500"}`}>
                  {uploadResult.msg}
                </p>
              )}
              <button onClick={handleUpload} disabled={uploading || validCount === 0}
                className="w-full bg-cyan-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-cyan-700 disabled:opacity-50">
                {uploading ? "Uploading..." : `Upload ${validCount} Valid Row(s) for ${selectedPatient.name}`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Page Shell ────────────────────────────────────────────────
export default function LabEntry() {
  const [tab, setTab]         = useState("manual");
  const [catalog, setCatalog] = useState([]);

  const loadCatalog = () => fetchTestCatalog().then(res => setCatalog(res.data));
  useEffect(() => { loadCatalog(); }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Lab Entry</h1>
      <div className="flex gap-2">
        {["manual", "csv"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t ? "bg-cyan-600 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>
            {t === "manual" ? "Manual Entry" : "CSV Upload"}
          </button>
        ))}
      </div>
      {tab === "manual"
        ? <ManualEntryForm catalog={catalog} onCatalogUpdate={loadCatalog} />
        : <CSVUploadForm />}
    </div>
  );
}