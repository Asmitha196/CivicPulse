import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Copy,
  Users,
  BarChart3,
  PlusCircle,
  Clock,
  Bell,
  CheckCircle2,
  Wrench,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';

const Sidebar = () => {
  const { user, isAdmin, isWorker, isCitizen } = useAuth();
  const location = useLocation();

  const adminLinks = [
    { to: '/admin', label: 'Dashboard Overview', icon: LayoutDashboard, exact: true },
    { to: '/admin/reports', label: 'All Citizen Reports', icon: FileText },
    { to: '/admin/duplicates', label: 'AI Duplicate Review', icon: Copy, badge: 'AI' },
    { to: '/admin/workers', label: 'Worker Assignments', icon: Users },
    { to: '/admin/analytics', label: 'Municipal Analytics', icon: BarChart3 },
  ];

  const citizenLinks = [
    { to: '/citizen', label: 'My Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/citizen/report', label: 'Report New Issue', icon: PlusCircle, highlight: true },
    { to: '/citizen/complaints', label: 'Track My Complaints', icon: Clock },
    { to: '/citizen/notifications', label: 'Notifications', icon: Bell },
  ];

  const workerLinks = [
    { to: '/worker', label: 'Assigned Work Tasks', icon: Wrench, exact: true },
  ];

  const links = isAdmin ? adminLinks : isWorker ? workerLinks : citizenLinks;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0">
      <div>
        {/* User Card */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mb-6 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-600/10 text-blue-600 font-bold flex items-center justify-center shrink-0">
            {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
          </div>
          <div className="overflow-hidden">
            <h5 className="text-xs font-bold text-slate-800 truncate">
              {user?.full_name}
            </h5>
            <span className="text-[11px] font-medium text-slate-500 capitalize">
              {user?.role} Portal
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 block">
            Navigation
          </span>
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = link.exact
              ? location.pathname === link.to
              : location.pathname.startsWith(link.to);

            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                    : link.highlight
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-500/20'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : link.highlight ? 'text-white' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                </div>

                {link.badge && (
                  <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded">
                    {link.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Helpful Civic Tips Banner */}
      <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl mt-6 text-xs">
        <div className="flex items-center text-blue-700 font-semibold mb-1">
          <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />
          <span>Municipal Notice</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-snug">
          Resolution verification requires photographic proof verified by municipal officers before closing complaints.
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;

