import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  MapPin,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Users,
  Wrench,
  Clock,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LandingPage = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-blue-50/60 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Technovate 2.0 • Civic Technology Platform (PS-14)</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Report Problems. Track Progress.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Build Better Communities.
              </span>
            </h1>

            <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              CivicPulse connects citizens, municipal administrators, and field repair technicians through one intelligent, transparent civic resolution system with AI duplicate detection and strict evidence verification.
            </p>

            {/* Call to Actions */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to={isAuthenticated ? (user?.role === 'admin' ? '/admin' : user?.role === 'worker' ? '/worker' : '/citizen/report') : '/login'}
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition group"
              >
                <span>{isAuthenticated ? 'Open Dashboard' : 'Launch Live Demo'}</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition" />
              </Link>

              <Link
                to="/about"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-sm transition"
              >
                Explore Full Workflow
              </Link>
            </div>

            {/* Quick Demo Credentials Preview */}
            <div className="mt-8 pt-6 border-t border-slate-200 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Instant Demo Logins: </span>
              <span className="inline-block bg-slate-100 px-2 py-0.5 rounded text-slate-700 mx-1">Citizen: citizen@civicpulse.org</span>
              <span className="inline-block bg-slate-100 px-2 py-0.5 rounded text-slate-700 mx-1">Admin: admin@civicpulse.org</span>
              <span className="inline-block bg-slate-100 px-2 py-0.5 rounded text-slate-700 mx-1">Worker: worker@civicpulse.org</span>
            </div>
          </div>
        </div>
      </section>

      {/* 8-Step Core Workflow Section */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              End-to-End Civic Accountability
            </h2>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">
              The 8-Stage Resolution Pipeline
            </p>
            <p className="mt-3 text-slate-500 text-sm max-w-xl mx-auto">
              Issues cannot be closed with a single click. Every repair undergoes photographic verification by municipal officers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Citizen Report', desc: 'Citizen submits complaint with photo and GPS location coordinates.', icon: MapPin, color: 'text-blue-600', bg: 'bg-blue-50' },
              { step: '02', title: 'AI Semantic Analysis', desc: 'Local NLP & Sentence Transformers calculate duplicate candidates & category.', icon: Cpu, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { step: '03', title: 'Admin Verification', desc: 'Officer verifies severity, sets final priority, and approves duplicate grouping.', icon: ShieldCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
              { step: '04', title: 'Worker Assignment', desc: 'Task dispatched to municipal field technicians with geo-routing.', icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50' },
              { step: '05', title: 'Field Repair', desc: 'Technicians execute the repair on site and document progress in real time.', icon: Clock, color: 'text-cyan-600', bg: 'bg-cyan-50' },
              { step: '06', title: 'Evidence Proof', desc: 'Technician uploads mandatory AFTER-repair photographic evidence.', icon: Layers, color: 'text-orange-600', bg: 'bg-orange-50' },
              { step: '07', title: 'Officer Resolution', desc: 'Municipal administrator reviews photo evidence and marks issue RESOLVED.', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { step: '08', title: 'Citizen Feedback', desc: 'Citizens receive verified notice and can submit star rating or request reopening.', icon: Users, color: 'text-rose-600', bg: 'bg-rose-50' }
            ].map((item) => (
              <div key={item.step} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl ${item.bg} ${item.color} flex items-center justify-center font-bold`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    STAGE {item.step}
                  </span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm mb-1.5">{item.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3 Pillars Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">For Citizens</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Instant problem submission with GPS detection, live tracking with unique complaint IDs, and transparent feedback loops with reopen requests.
              </p>
              <Link to="/citizen" className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center">
                Citizen portal features <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">For Administrators</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Interactive Leaflet issue map, AI-powered duplicate grouping review, worker dispatch console, and photographic evidence verification.
              </p>
              <Link to="/admin" className="text-xs font-semibold text-purple-600 hover:text-purple-800 inline-flex items-center">
                Administrator features <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-6">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">For Field Workers</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Mobile-optimized task view, step-by-step progress updating, before/after evidence photograph uploads, and assignment completion.
              </p>
              <Link to="/worker" className="text-xs font-semibold text-amber-600 hover:text-amber-800 inline-flex items-center">
                Field worker console <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;

