import { useEffect, useState, useCallback } from "react";
import { Users, Bell, AlertTriangle, RefreshCw } from "lucide-react";
import { fetchPatients, fetchAlerts } from "../api/services";
import RiskBadge from "../components/RiskBadge";

export default function Dashboard() {
  const [patients, setPatients] = useState([]);
  const [alerts, setAlerts]     = useState([]);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([fetchPatients(), fetchAlerts()])
      .then(([pRes, aRes]) => {
        setPatients(pRes.data);
        setAlerts(aRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const highRisk     = patients.filter(p => p.risk === "High").length;
  const pendingAlerts = alerts.filter(a => a.severity === "High").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Clinician Dashboard</h1>
        <button onClick={load}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Patients",  value: patients.length, icon: Users,          color: "text-blue-600 bg-blue-50" },
          { label: "High Risk",       value: highRisk,        icon: AlertTriangle,   color: "text-red-600 bg-red-50" },
          { label: "High Alerts",     value: pendingAlerts,   icon: Bell,            color: "text-yellow-600 bg-yellow-50" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 border border-slate-100">
            <div className={`p-3 rounded-lg ${color}`}><Icon size={22} /></div>
            <div>
              <p className="text-sm text-slate-500">{label}</p>
              <p className="text-2xl font-bold text-slate-800">{loading ? "—" : value}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
        <h2 className="text-base font-semibold text-slate-700 mb-4">Recent Patients</h2>
        {loading ? <p className="text-sm text-slate-400">Loading...</p> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="pb-2">ID</th><th className="pb-2">Name</th>
                <th className="pb-2">Age</th><th className="pb-2">Risk</th>
              </tr>
            </thead>
            <tbody>
              {patients.length === 0 ? (
                <tr><td colSpan={4} className="py-4 text-center text-slate-400">No patients found.</td></tr>
              ) : patients.map(p => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-2 text-slate-400">{p.id}</td>
                  <td className="py-2 font-medium text-slate-800">{p.name}</td>
                  <td className="py-2 text-slate-500">{p.age}</td>
                  <td className="py-2"><RiskBadge level={p.risk} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}