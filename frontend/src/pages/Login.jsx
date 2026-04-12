import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../api/services";
import { FlaskConical } from "lucide-react";

export default function Login({ onLogin }) {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await loginUser(username, password);
      login(res.data.access_token, res.data.role);
      onLogin(res.data.role);
    } catch {
      setError("Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-10 w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="bg-cyan-600 p-3 rounded-xl">
            <FlaskConical size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">LabTrend-CDSS</h1>
          <p className="text-sm text-slate-400">Clinical Decision Support System</p>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Username</label>
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-cyan-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-cyan-700 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        {/* Role hint for development */}
        <div className="text-xs text-slate-400 space-y-1 border-t border-slate-100 pt-4">
          <p className="font-medium text-slate-500 mb-1">Dev credentials:</p>
          <p>clinician / clinic123</p>
          <p>labtech / lab123</p>
          <p>admin / admin123</p>
        </div>

      </div>
    </div>
  );
}