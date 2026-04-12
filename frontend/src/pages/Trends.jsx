import { useEffect, useState, useCallback } from "react";
import { RefreshCw, ArrowUp, ArrowDown } from "lucide-react";
import { fetchPatients, fetchLabResults } from "../api/services";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from "recharts";

const TEST_COLORS = {
  "HbA1c":       "#0891b2",
  "eGFR":        "#7c3aed",
  "Systolic BP":  "#dc2626",
  "Fasting Glucose": "#16a34a",
  "Creatinine":   "#ea580c",
};

function buildChartData(results) {
  const byDate = {};
  results.forEach(r => {
    if (!byDate[r.date]) byDate[r.date] = { date: r.date };
    byDate[r.date][r.test_name] = r.result_value;
  });
  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
}

function getAbnormalStatus(value, referenceRange) {
  if (!referenceRange) return "normal";
  try {
    if (referenceRange.startsWith("<")) {
      const threshold = parseFloat(referenceRange.slice(1));
      if (value >= threshold) return "high";
    } else if (referenceRange.startsWith(">")) {
      const threshold = parseFloat(referenceRange.slice(1));
      if (value < threshold) return "low";
    } else if (referenceRange.includes("-")) {
      const [lo, hi] = referenceRange.split("-").map(parseFloat);
      if (value > hi) return "high";
      if (value < lo) return "low";
    }
  } catch {
    return "normal";
  }
  return "normal";
}

export default function Trends() {
  const [patients, setPatients]           = useState([]);
  const [selectedId, setSelectedId]       = useState("");
  const [results, setResults]             = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingResults, setLoadingResults]   = useState(false);
  const [error, setError]                 = useState(null);

  useEffect(() => {
    fetchPatients()
      .then(res => {
        setPatients(res.data);
        if (res.data.length > 0) setSelectedId(res.data[0].id);
      })
      .finally(() => setLoadingPatients(false));
  }, []);

  const loadResults = useCallback(() => {
    if (!selectedId) return;
    setLoadingResults(true);
    setError(null);
    fetchLabResults(selectedId)
      .then(res => setResults(res.data))
      .catch(() => setError("No lab results found for this patient."))
      .finally(() => setLoadingResults(false));
  }, [selectedId]);

  useEffect(() => { loadResults(); }, [loadResults]);

  const chartData  = buildChartData(results);
  const testNames  = [...new Set(results.map(r => r.test_name))];
  const selected   = patients.find(p => p.id === selectedId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Lab Trends</h1>
        <button onClick={loadResults}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
          <RefreshCw size={14} className={loadingResults ? "animate-spin" : ""} />
          Refresh
        </button>
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
        {selected && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0
            ${selected.risk === "High" ? "bg-red-100 text-red-700" :
              selected.risk === "Medium" ? "bg-yellow-100 text-yellow-700" :
              "bg-green-100 text-green-700"}`}>
            {selected.risk} Risk
          </span>
        )}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-base font-semibold text-slate-700 mb-4">
          {selected ? `${selected.name} — Lab Values Over Time` : "Lab Values Over Time"}
        </h2>
        {loadingResults ? (
          <p className="text-sm text-slate-400">Loading results...</p>
        ) : error ? (
          <p className="text-sm text-slate-400">{error}</p>
        ) : chartData.length === 0 ? (
          <p className="text-sm text-slate-400">No lab results available for this patient.</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              {testNames.map(name => (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={TEST_COLORS[name] || "#64748b"}
                  strokeWidth={2}
                  dot
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Raw Results Table */}
      {results.length > 0 && (
  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
    <h2 className="text-base font-semibold text-slate-700 mb-4">All Lab Results</h2>
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-slate-500 border-b border-slate-100">
          <th className="pb-2">Test</th>
          <th className="pb-2">Value</th>
          <th className="pb-2">Unit</th>
          <th className="pb-2">Reference Range</th>
          <th className="pb-2">Date</th>
        </tr>
      </thead>
      <tbody>
        {results.map(r => {
          const status = getAbnormalStatus(r.result_value, r.reference_range);
          const isHigh   = status === "high";
          const isLow    = status === "low";
          const isAbnormal = isHigh || isLow;
          return (
            <tr key={r.id}
              className={`border-b border-slate-50 ${isAbnormal ? "bg-red-50" : "hover:bg-slate-50"}`}>
              <td className="py-2 font-medium text-slate-800">{r.test_name}</td>
              <td className="py-2">
                <span className={`flex items-center gap-1 font-medium
                  ${isHigh ? "text-red-600" : isLow ? "text-blue-600" : "text-slate-700"}`}>
                  {r.result_value}
                  {isHigh && <ArrowUp size={14} className="text-red-500 shrink-0" />}
                  {isLow  && <ArrowDown size={14} className="text-blue-500 shrink-0" />}
                </span>
              </td>
              <td className="py-2 text-slate-500">{r.unit}</td>
              <td className="py-2 text-slate-500">{r.reference_range}</td>
              <td className="py-2 text-slate-400">{r.date}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
)}
    </div>
  );
}