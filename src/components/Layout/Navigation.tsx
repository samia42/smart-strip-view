import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Activity,
  Zap,
  Settings,
  Menu,
  X,
  BarChart2,
  RadioTower,
} from "lucide-react";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const links = [
    { to: "/", label: "Overview", icon: Activity },
    { to: "/devices", label: "Device Monitoring", icon: Zap },
    { to: "/consumption", label: "Consumption", icon: BarChart2 },
    { to: "/settings", label: "Settings", icon: Settings },
    { to: "/websocket", label: "WebSocket", icon: RadioTower },
  ];

  return (
    <nav className="bg-slate-950 border-b border-slate-800 sticky top-0 z-50">
      <div className="w-full px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Zap className="text-blue-500" size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-slate-100 font-bold text-lg leading-none">
                Insight
              </span>
              <span className="text-slate-500 text-xs font-medium">
                Smart Power Strip
              </span>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="flex items-baseline space-x-6">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                      isActive
                        ? "text-blue-500 bg-blue-500/10"
                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50",
                    )
                  }
                >
                  <link.icon size={18} />
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {links.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium transition-colors",
                    isActive
                      ? "text-blue-500 bg-blue-500/10"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800",
                  )}
                >
                  <link.icon size={20} />
                  {link.label}
                </NavLink>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
