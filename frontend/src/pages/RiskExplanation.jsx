import { useEffect, useState, useCallback } from "react";
import { ChevronRight, RefreshCw, Download } from "lucide-react";
import { fetchPatients, fetchRisk, exportPatientReport } from "../api/services";
import RiskBadge from "../components/RiskBadge";

export default function RiskExplanation() {
  const [patients, setPatients]         = useState([]);
  const [selectedId, setSelectedId]     = useState("");
  const [data, setData]                 = useState(null);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingRisk, setLoadingRisk]   = useState(false);
  const [error, setError]               = useState(null);

  useEffect(() => {
    fetchPatients()
      .then(res => {
        setPatients(res.data);
        if (res.data.length > 0) setSelectedId(res.data[0].id);
      })
      .finally(() => setLoadingPatients(false));
  }, []);

  const loadRisk = useCallback(() => {
    if (!selectedId) return;
    setLoadingRisk(true);
    setError(null);
    setData(null);
    fetchRisk(selectedId)
      .then(res => setData(res.data))
      .catch(err => setError(
        err.response?.data?.detail || "No risk assessment available for this patient."
      ))
      .finally(() => setLoadingRisk(false));
  }, [selectedId]);

  useEffect(() => { loadRisk(); }, [loadRisk]);

  const handleExport = () => {
    exportPatientReport(selectedId).then(res => {
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/html" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `report_${selectedId}.html`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Risk Explanation</h1>
        <div className="flex gap-2">
          {selectedId && (
            <button onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
              <Download size={14} /> Export Report
            </button>
          )}
          <button onClick={loadRisk}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
            <RefreshCw size={14} className={loadingRisk ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Patient Selector */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
        <label className="text-sm font-medium text-slate-600 shrink-0">Select Patient:</label>
        {loadingPatients ? (
          <p className="text-sm text-slate-400">Loading patients...</p>
        ) : (
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
            ))}
          </select>
        )}
      </div>

      {/* Risk Output */}
      {loadingRisk && <p className="text-sm text-slate-400">Computing risk...</p>}
      {error && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-sm text-slate-500">
          {error}
        </div>
      )}
      {data && (
        <>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">Overall Risk for {data.patient}:</span>
            <RiskBadge level={data.overall_risk} />
          </div>
          <div className="space-y-4">
            {data.scores.map(s => (
              <div key={s.disease} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-800">{s.disease}</h3>
                  <RiskBadge level={s.risk} />
                </div>
                <p className="text-sm text-slate-500 flex items-start gap-2">
                  <ChevronRight size={16} className="mt-0.5 text-cyan-500 shrink-0" />
                  {s.reason}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}