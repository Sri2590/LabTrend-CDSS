import { Menu, X, LogOut, LayoutDashboard, Users, FlaskConical, TrendingUp, ShieldAlert, Bell, Settings } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const allNavItems = [
  { id: "dashboard", label: "Dashboard",       icon: LayoutDashboard, roles: ["clinician", "admin"] },
  { id: "patients",  label: "Patients",         icon: Users,           roles: ["clinician", "admin"] },
  { id: "labentry",  label: "Lab Entry",        icon: FlaskConical,    roles: ["clinician", "lab_technician", "admin"] },
  { id: "trends",    label: "Lab Trends",       icon: TrendingUp,      roles: ["clinician", "admin"] },
  { id: "risk",      label: "Risk Explanation", icon: ShieldAlert,     roles: ["clinician", "admin"] },
  { id: "alerts",    label: "Alerts",           icon: Bell,            roles: ["clinician", "admin"] },
  { id: "admin",     label: "Admin",            icon: Settings,        roles: ["admin"] },
];

export default function Sidebar({ active, setActive, collapsed, setCollapsed }) {
  const { user, logout } = useAuth();
  const role = user?.role || "";

  const navItems = allNavItems.filter(item => item.roles.includes(role));

  return (
    <aside className={`h-full bg-slate-900 text-white flex flex-col transition-all duration-300 ${collapsed ? "w-16" : "w-60"}`}>
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-700">
        {!collapsed && (
          <div>
            <span className="text-lg font-bold text-cyan-400 tracking-wide">LabTrend</span>
            <p className="text-xs text-slate-500 capitalize">{role.replace("_", " ")}</p>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="text-slate-400 hover:text-white">
          {collapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>
      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${active === id ? "bg-cyan-600 text-white" : "text-slate-300 hover:bg-slate-700"}`}
          >
            <Icon size={18} />
            {!collapsed && <span>{label}</span>}
          </button>
        ))}
      </nav>
      <div className="px-2 pb-4">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-700 hover:text-white"
        >
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}