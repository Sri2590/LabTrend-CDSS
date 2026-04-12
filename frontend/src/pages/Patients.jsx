import { useEffect, useState, useCallback } from "react";
import { RefreshCw, UserPlus, X, Pencil } from "lucide-react";
import { fetchPatients, createPatient, updatePatient, fetchNextPatientId } from "../api/services";
import { useAuth } from "../context/AuthContext";
import RiskBadge from "../components/RiskBadge";

const today = new Date().toISOString().split("T")[0];

function PatientModal({ existing, onClose, onSaved }) {
  const isEdit = !!existing;
  const [form, setForm]       = useState(
    isEdit
      ? { ...existing }
      : { id: "", name: "", age: "", gender: "M", dob: "", contact: "", address: "" }
  );
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isEdit) {
      fetchNextPatientId().then(res => setForm(f => ({ ...f, id: res.data.next_id })));
    }
  }, [isEdit]);

  // Auto-calculate age from DOB
  const handleDobChange = (dob) => {
    if (!dob) { setForm(f => ({ ...f, dob, age: "" })); return; }
    const birthDate = new Date(dob);
    const today     = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    setForm(f => ({ ...f, dob, age: age > 0 ? String(age) : "" }));
  };

  const handleSubmit = () => {
    if (!form.name || !form.age || !form.gender) {
      setError("Name, Age and Gender are required."); return;
    }
    setLoading(true);
    const action = isEdit
      ? updatePatient(existing.id, { ...form, age: parseInt(form.age) })
      : createPatient({ ...form, age: parseInt(form.age) });
    action
      .then(() => { onSaved(); onClose(); })
      .catch(err => setError(err.response?.data?.detail || "Failed to save patient."))
      .finally(() => setLoading(false));
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">{isEdit ? "Edit Patient" : "Create New Patient"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        {/* Patient ID */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Patient ID {!isEdit && <span className="text-slate-400 text-xs">(auto-assigned)</span>}
          </label>
          <input type="text" value={form.id || ""} disabled
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-400 focus:outline-none" />
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Full Name *</label>
          <input type="text" placeholder="e.g. Ravi Kumar" value={form.name || ""}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400" />
        </div>

        {/* DOB — auto-calculates age */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Date of Birth
            <span className="text-slate-400 text-xs ml-2">(auto-fills Age)</span>
          </label>
          <input type="date" value={form.dob || ""}
            max={new Date().toISOString().split("T")[0]}
            onChange={e => handleDobChange(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400" />
        </div>

        {/* Age — editable but auto-filled from DOB */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Age *
            <span className="text-slate-400 text-xs ml-2">(auto-calculated from DOB, or enter manually)</span>
          </label>
          <input type="number" placeholder="e.g. 45" value={form.age || ""}
            onChange={e => setForm({ ...form, age: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400" />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Gender *</label>
          <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400">
            <option value="M">Male</option>
            <option value="F">Female</option>
            <option value="O">Other</option>
          </select>
        </div>

        {/* Contact */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Contact</label>
          <input type="text" placeholder="Phone number" value={form.contact || ""}
            onChange={e => setForm({ ...form, contact: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400" />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Address</label>
          <input type="text" placeholder="City, State" value={form.address || ""}
            onChange={e => setForm({ ...form, address: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400" />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        <button onClick={handleSubmit} disabled={loading}
          className="w-full bg-cyan-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-cyan-700 disabled:opacity-50">
          {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Patient"}
        </button>
      </div>
    </div>
  );
}

export default function Patients() {
  const { user } = useAuth();
  const [patients, setPatients]       = useState([]);
  const [search, setSearch]           = useState("");
  const [loading, setLoading]         = useState(true);
  const [modalTarget, setModalTarget] = useState(null);

  const loadPatients = useCallback(() => {
    setLoading(true);
    fetchPatients(search).then(res => setPatients(res.data)).finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { loadPatients(); }, [loadPatients]);

  const canEdit = user?.role === "clinician" || user?.role === "admin";

  return (
    <div className="space-y-6">
      {modalTarget && (
        <PatientModal
          existing={modalTarget === "new" ? null : modalTarget}
          onClose={() => setModalTarget(null)}
          onSaved={loadPatients}
        />
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Patient List</h1>
        <div className="flex gap-2">
          {canEdit && (
            <button onClick={() => setModalTarget("new")}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-cyan-600 text-white hover:bg-cyan-700">
              <UserPlus size={15} /> New Patient
            </button>
          )}
          <button onClick={loadPatients}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>
      <input type="text" placeholder="Search by name or ID..."
        value={search} onChange={e => setSearch(e.target.value)}
        className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400" />
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
        {loading ? <p className="text-sm text-slate-400">Loading...</p> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="pb-2">ID</th><th className="pb-2">Name</th>
                <th className="pb-2">Age</th><th className="pb-2">Gender</th>
                <th className="pb-2">Risk</th>
                {canEdit && <th className="pb-2"></th>}
              </tr>
            </thead>
            <tbody>
              {patients.length === 0 ? (
                <tr><td colSpan={6} className="py-4 text-center text-slate-400">No patients found.</td></tr>
              ) : patients.map(p => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-2 text-slate-400">{p.id}</td>
                  <td className="py-2 font-medium text-slate-800">{p.name}</td>
                  <td className="py-2 text-slate-500">{p.age}</td>
                  <td className="py-2 text-slate-500">{p.gender}</td>
                  <td className="py-2"><RiskBadge level={p.risk} /></td>
                  {canEdit && (
                    <td className="py-2">
                      <button onClick={() => setModalTarget(p)}
                        className="flex items-center gap-1 text-xs text-cyan-600 hover:underline">
                        <Pencil size={12} /> Edit
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}