import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, UploadCloud, MessageSquare, Library, Brain, Users, Building2, User } from "lucide-react";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/upload", label: "Upload", icon: UploadCloud },
  { to: "/chat", label: "Ask", icon: MessageSquare },
  { to: "/explorer", label: "Explorer", icon: Library },
];

const scopes = [
  { id: "personal", label: "Personal", icon: User },
  { id: "team", label: "Team", icon: Users },
  { id: "org", label: "Org", icon: Building2 },
];

export default function Sidebar({ scope, setScope }) {
  return (
    <aside className="w-60 shrink-0 bg-panel border-r border-line flex flex-col">
      <div className="px-5 py-6 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center">
          <Brain size={16} className="text-accent" />
        </div>
        <div>
          <div className="font-display font-bold text-sm tracking-tight">Pulse</div>
          <div className="text-[10px] text-muted font-mono">knowledge layer</div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent/15 text-accent border border-accent/30"
                  : "text-muted hover:text-white hover:bg-white/5 border border-transparent"
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-5 pt-3 border-t border-line">
        <div className="text-[10px] uppercase tracking-wider text-muted font-mono px-3 mb-2">
          Knowledge Scope
        </div>
        <div className="space-y-1">
          {scopes.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setScope(id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                scope === id
                  ? "bg-accent2/10 text-accent2 border border-accent2/30"
                  : "text-muted hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
