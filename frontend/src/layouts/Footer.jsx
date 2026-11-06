import React from 'react';
import { Activity, ShieldCheck, Heart, MapPin, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Activity className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Civic<span className="text-blue-500">Pulse</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              CivicPulse is an intelligent civic problem reporting and resolution platform connecting citizens, municipal administrators, and field workers to build better communities.
            </p>
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-900/60 text-blue-300 border border-blue-700">
                Technovate 2.0 (PS-14)
              </span>
            </div>
          </div>

          {/* Citizen Links */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3">
              Citizen Services
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/citizen/report" className="hover:text-white transition">
                  Report a Problem
                </Link>
              </li>
              <li>
                <Link to="/citizen/complaints" className="hover:text-white transition">
                  Track My Reports
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition">
                  Resolution Workflow
                </Link>
              </li>
              <li>
                <Link to="/citizen/notifications" className="hover:text-white transition">
                  Civic Notifications
                </Link>
              </li>
            </ul>
          </div>

          {/* Municipal Staff */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3">
              Municipal Staff
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/admin" className="hover:text-white transition">
                  Administrator Dashboard
                </Link>
              </li>
              <li>
                <Link to="/admin/duplicates" className="hover:text-white transition">
                  AI Duplicate Detection
                </Link>
              </li>
              <li>
                <Link to="/admin/analytics" className="hover:text-white transition">
                  Civic Analytics & Trends
                </Link>
              </li>
              <li>
                <Link to="/worker" className="hover:text-white transition">
                  Field Technician Console
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Status */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3">
              Platform Integrity
            </h4>
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 space-y-2">
              <div className="flex items-center text-xs text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-ping"></span>
                AI Semantic Engine Active
              </div>
              <p className="text-[11px] text-slate-400">
                Sentence-Transformers, PostGIS Geodesics, and Verification Proofing online.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2026 CivicPulse. Built for Technovate 2.0 Civic Tech Innovation.</p>
          <p className="mt-2 sm:mt-0 flex items-center">
            Report Problems. Track Progress. Build Better Communities.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

