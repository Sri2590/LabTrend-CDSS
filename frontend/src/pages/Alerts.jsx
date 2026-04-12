import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, Clock, RefreshCw } from "lucide-react";
import { fetchAlerts } from "../api/services";

export default function Alerts() {
  const [alerts, setAlerts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("All");

  const load = () => {
    setLoading(true);
    fetchAlerts()
      .then(res => setAlerts(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === "All" ? alerts : alerts.filter(a => a.severity === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Alerts</h1>
        <button onClick={load}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Summary counts */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "High",   color: "bg-red-50 border-red-200 text-red-700" },
            { label: "Medium", color: "bg-yellow-50 border-yellow-200 text-yellow-700" },
            { label: "Low",    color: "bg-green-50 border-green-200 text-green-700" },
          ].map(({ label, color }) => (
            <div key={label} className={`rounded-xl border p-4 text-center ${color}`}>
              <p className="text-2xl font-bold">{alerts.filter(a => a.severity === label).length}</p>
              <p className="text-xs font-medium mt-1">{label} Severity</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2">
        {["All", "High", "Medium", "Low"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium
              ${filter === f ? "bg-cyan-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Alert list */}
      {loading ? (
        <p className="text-sm text-slate-400">Loading alerts...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-400">No alerts for this filter.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => {
            const Icon = a.severity === "High" ? AlertTriangle : a.severity === "Low" ? CheckCircle : Clock;
            const colors = {
              High:   "border-red-200 bg-red-50",
              Medium: "border-yellow-200 bg-yellow-50",
              Low:    "border-green-200 bg-green-50"
            };
            const iconColors = {
              High: "text-red-500", Medium: "text-yellow-500", Low: "text-green-500"
            };
            return (
              <div key={a.id} className={`flex items-start gap-4 rounded-xl border p-4 ${colors[a.severity]}`}>
                <Icon size={20} className={`mt-0.5 shrink-0 ${iconColors[a.severity]}`} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">
                    {a.patient}
                    <span className="text-slate-400 font-normal ml-2 text-xs">{a.patient_id}</span>
                  </p>
                  <p className="text-sm text-slate-600">{a.message}</p>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">{a.time}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}