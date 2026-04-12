import { useEffect, useState } from "react";
import { Sliders, ClipboardList, RefreshCw, Pencil, X } from "lucide-react";
import { fetchAuditLogs, fetchTestCatalog, updateCustomTest } from "../api/services";

// ── Edit Custom Test Modal ────────────────────────────────────
function EditTestModal({ test, onClose, onSaved }) {
  const [form, setForm]     = useState({ unit: test.unit, reference_range: test.reference_range });
  const [error, setError]   = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    if (!form.unit || !form.reference_range) {
      setError("Both Unit and Reference Range are required."); return;
    }
    setLoading(true);
    updateCustomTest(test.name, { name: test.name, unit: form.unit, reference_range: form.reference_range })
      .then(() => { onSaved(); onClose(); })
      .catch(() => setError("Failed to update test."))
      .finally(() => setLoading(false));
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Edit Custom Test</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Test Name</label>
          <input type="text" value={test.name} disabled
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Unit</label>
          <input type="text" value={form.unit}
            onChange={e => setForm({ ...form, unit: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Reference Range
            <span className="text-slate-400 text-xs ml-2">e.g. &lt;5.7 or &gt;60 or 70-100</span>
          </label>
          <input type="text" value={form.reference_range}
            onChange={e => setForm({ ...form, reference_range: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400" />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button onClick={handleSave} disabled={loading}
          className="w-full bg-cyan-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-cyan-700 disabled:opacity-50">
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ── Audit Log ─────────────────────────────────────────────────
function AuditLogSection() {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const load = () => {
    setLoading(true);
    fetchAuditLogs().then(res => setLogs(res.data)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-700">Audit Log</h2>
        <button onClick={load} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>
      {loading ? <p className="text-sm text-slate-400">Loading...</p> : logs.length === 0 ? (
        <p className="text-sm text-slate-400">No audit logs yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="pb-2 pr-4">Time</th>
                <th className="pb-2 pr-4">Action</th>
                <th className="pb-2 pr-4">Performed By</th>
                <th className="pb-2">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-2 pr-4 text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                  <td className="py-2 pr-4">
                    <span className="bg-slate-100 text-slate-700 text-xs font-mono px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-slate-600 capitalize">{log.performed_by.replace("_", " ")}</td>
                  <td className="py-2 text-slate-500">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Thresholds ────────────────────────────────────────────────
function ThresholdsSection() {
  const [tests, setTests]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [editTarget, setEditTarget] = useState(null);

  const load = () => {
    setLoading(true);
    fetchTestCatalog().then(res => setTests(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-4">
      {editTarget && (
        <EditTestModal
          test={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={load}
        />
      )}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-700">Clinical Thresholds</h2>
        <button onClick={load} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>
      {loading ? <p className="text-sm text-slate-400">Loading...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="pb-2">Test Name</th>
                <th className="pb-2">Reference Range</th>
                <th className="pb-2">Unit</th>
                <th className="pb-2">Type</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {tests.map(t => (
                <tr key={t.name} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-2 font-medium text-slate-800">{t.name}</td>
                  <td className="py-2 text-slate-600">{t.reference_range}</td>
                  <td className="py-2 text-slate-500">{t.unit}</td>
                  <td className="py-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                      ${t.is_custom
                        ? "bg-purple-100 text-purple-700"
                        : "bg-slate-100 text-slate-600"}`}>
                      {t.is_custom ? "Custom" : "Built-in"}
                    </span>
                  </td>
                  <td className="py-2">
                    {t.is_custom && (
                      <button
                        onClick={() => setEditTarget(t)}
                        className="flex items-center gap-1 text-xs text-cyan-600 hover:underline">
                        <Pencil size={12} /> Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-slate-400">
        Custom tests are added automatically when first used in Lab Entry. Only custom tests can be edited.
      </p>
    </div>
  );
}

// ── Page Shell ────────────────────────────────────────────────
export default function Admin() {
  const [section, setSection] = useState("audit");
  const sections = [
    { id: "audit",      label: "Audit Log",          icon: ClipboardList },
    { id: "thresholds", label: "Clinical Thresholds", icon: Sliders },
  ];
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Admin Panel</h1>
      <div className="flex gap-2">
        {sections.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setSection(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              ${section === id
                ? "bg-cyan-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>
      {section === "audit"      && <AuditLogSection />}
      {section === "thresholds" && <ThresholdsSection />}
    </div>
  );
}