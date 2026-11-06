import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  ChevronUp,
  ChevronDown,
  User,
  Shield,
  Wrench,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Layers,
  MapPin,
  Camera,
  Star
} from 'lucide-react';

const HackathonDemoGuide = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const handleQuickSwitch = async (email, password, redirectPath) => {
    try {
      await login(email, password);
      if (redirectPath) navigate(redirectPath);
    } catch (err) {
      console.error(err);
    }
  };

  const steps = [
    {
      step: 1,
      role: 'Citizen A',
      action: 'Submit Initial Pothole Complaint',
      desc: 'Report crater on Bellandur ORR with photo & GPS pin.',
      email: 'citizen@civicpulse.org',
      pass: 'citizen123',
      target: '/citizen/report',
      icon: MapPin,
      badge: 'bg-blue-100 text-blue-800'
    },
    {
      step: 2,
      role: 'Citizen B',
      action: 'Submit Duplicate Complaint',
      desc: 'Report same pothole ~30m away. AI immediately flags duplicate candidate.',
      email: 'citizen2@civicpulse.org',
      pass: 'citizen123',
      target: '/citizen/report',
      icon: Layers,
      badge: 'bg-indigo-100 text-indigo-800'
    },
    {
      step: 3,
      role: 'Admin',
      action: 'Review AI Duplicate & Merge',
      desc: 'Inspect 98% semantic similarity & 0-30m distance. Approve consolidation.',
      email: 'admin@civicpulse.org',
      pass: 'admin123',
      target: '/admin/duplicates',
      icon: Shield,
      badge: 'bg-purple-100 text-purple-800'
    },
    {
      step: 4,
      role: 'Admin',
      action: 'Set Priority & Dispatch Worker',
      desc: 'Verify CRITICAL priority and assign field technician.',
      email: 'admin@civicpulse.org',
      pass: 'admin123',
      target: '/admin/reports',
      icon: Wrench,
      badge: 'bg-purple-100 text-purple-800'
    },
    {
      step: 5,
      role: 'Field Worker',
      action: 'Execute Repair & Upload Photos',
      desc: 'Set IN_PROGRESS, upload BEFORE & AFTER repair evidence.',
      email: 'worker@civicpulse.org',
      pass: 'worker123',
      target: '/worker',
      icon: Camera,
      badge: 'bg-amber-100 text-amber-800'
    },
    {
      step: 6,
      role: 'Admin & Citizen',
      action: 'Certify Resolution & Feedback',
      desc: 'Admin certifies photo evidence -> RESOLVED. Citizen submits 5-star rating.',
      email: 'admin@civicpulse.org',
      pass: 'admin123',
      target: '/admin',
      icon: Star,
      badge: 'bg-emerald-100 text-emerald-800'
    }
  ];

  return (
    <aside
      aria-label="Hackathon Demo Navigator"
      className="fixed bottom-4 right-4 z-50 max-w-sm w-full sm:w-96 text-xs transition-all duration-300 pointer-events-auto"
    >
      <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-slate-700/80 overflow-hidden">
        {/* Header Bar */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 text-left font-bold"
        >
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span className="font-extrabold tracking-tight">
              Technovate 2.0 • Live Demo Navigator
            </span>
          </div>

          <div className="flex items-center space-x-2 text-[11px] font-semibold">
            <span className="bg-white/20 px-2 py-0.5 rounded-full">
              {isOpen ? 'Minimize' : 'Explore Steps'}
            </span>
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </div>
        </button>

        {/* Collapsible Steps Content */}
        {isOpen && (
          <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-slate-400">
              <span>Current Session: <strong>{user?.full_name || 'Guest'}</strong></span>
              <span className="capitalize text-blue-400">Role: {user?.role || 'None'}</span>
            </div>

            <div className="space-y-2.5">
              {steps.map((st) => (
                <div
                  key={st.step}
                  className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 hover:border-slate-600 transition space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-300 font-bold flex items-center justify-center text-[10px]">
                        {st.step}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${st.badge}`}>
                        {st.role}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleQuickSwitch(st.email, st.pass, st.target)}
                      className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] shadow-sm transition"
                    >
                      <span>Switch & Go</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </button>
                  </div>

                  <h6 className="font-bold text-slate-200 text-xs">{st.action}</h6>
                  <p className="text-[11px] text-slate-400 leading-snug">{st.desc}</p>
                </div>
              ))}
            </div>

            <div className="pt-2 text-center text-[10px] text-slate-400">
              Click any stage above to instantly switch accounts and route directly to the active screen!
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default HackathonDemoGuide;

