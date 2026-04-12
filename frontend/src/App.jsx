import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import LabEntry from "./pages/LabEntry";
import Trends from "./pages/Trends";
import RiskExplanation from "./pages/RiskExplanation";
import Alerts from "./pages/Alerts";
import Admin from "./pages/Admin";

const defaultPageForRole = {
  clinician:       "dashboard",
  lab_technician:  "labentry",
  admin:           "dashboard",
};

function AppShell() {
  const { user, logout } = useAuth();
  const [activePage, setActivePage] = useState(
    user ? defaultPageForRole[user.role] || "dashboard" : "dashboard"
  );
  const [collapsed, setCollapsed] = useState(false);

  if (!user) {
    return <Login onLogin={(role) => setActivePage(defaultPageForRole[role] || "dashboard")} />;
  }

  const pages = {
    dashboard: <Dashboard />,
    patients:  <Patients />,
    labentry:  <LabEntry />,
    trends:    <Trends />,
    risk:      <RiskExplanation />,
    alerts:    <Alerts />,
    admin:     <Admin />,
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar
        active={activePage}
        setActive={setActivePage}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />
      <main className="flex-1 overflow-y-auto p-8">
        {pages[activePage] || <Dashboard />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}