import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportsService, issuesService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import IssueMap from '../../components/maps/IssueMap';
import {
  PlusCircle,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  MapPin,
  ChevronRight
} from 'lucide-react';

const CitizenDashboard = () => {
  const { user } = useAuth();
  const [myReports, setMyReports] = useState([]);
  const [allIssues, setAllIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [repRes, issRes] = await Promise.all([
          reportsService.getMyReports(),
          issuesService.getAll()
        ]);
        setMyReports(repRes.data || []);
        setAllIssues(issRes.data || []);
      } catch (err) {
        console.error("Dashboard data load error", err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const totalReports = myReports.length;
  const inProgressReports = myReports.filter((r) => r.status === 'LINKED' || r.status === 'SUBMITTED').length;
  const resolvedReports = myReports.filter((r) => r.status === 'RESOLVED').length;

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg shadow-blue-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
            Citizen Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            Welcome back, {user?.full_name}!
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-xl">
            Spot a civic issue in your neighborhood? Report it immediately to alert municipal teams and track repair progress transparently.
          </p>
        </div>

        <Link
          to="/citizen/report"
          className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-white text-blue-700 font-bold text-sm shadow-md hover:bg-blue-50 transition shrink-0"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Report New Problem
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              My Complaints
            </span>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalReports}</h3>
            <span className="text-[11px] text-slate-400">Total submitted</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active / In Progress
            </span>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{inProgressReports}</h3>
            <span className="text-[11px] text-slate-400">Under municipal review</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Resolved & Verified
            </span>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{resolvedReports}</h3>
            <span className="text-[11px] text-slate-400">Repairs completed</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Interactive Map of Local Issues */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Civic Issues in Your Locality
            </h3>
            <p className="text-xs text-slate-500">
              Live status map of community problems reported by citizens
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center text-red-600 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-1.5"></span> Critical
            </span>
            <span className="flex items-center text-orange-600 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 mr-1.5"></span> High
            </span>
            <span className="flex items-center text-blue-600 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-1.5"></span> Medium
            </span>
            <span className="flex items-center text-emerald-600 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5"></span> Resolved
            </span>
          </div>
        </div>

        <IssueMap issues={allIssues} height="380px" />
      </div>

      {/* Recent Complaints by This Citizen */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              My Recent Complaints
            </h3>
            <p className="text-xs text-slate-500">
              Track the exact progress of issues you have submitted
            </p>
          </div>
          <Link
            to="/citizen/complaints"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center"
          >
            View all ({myReports.length})
            <ChevronRight className="w-4 h-4 ml-0.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {myReports.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No complaints reported yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Notice an overflowing bin, pothole, or dark streetlight?
              </p>
              <Link
                to="/citizen/report"
                className="mt-4 inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700"
              >
                Submit Your First Complaint
              </Link>
            </div>
          ) : (
            myReports.slice(0, 5).map((rep) => (
              <div
                key={rep.id}
                className="p-4 sm:p-5 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {rep.complaint_id}
                    </span>
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {rep.category?.name || 'General'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        rep.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {rep.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">{rep.title}</h4>

                  <div className="flex items-center text-xs text-slate-500 space-x-3">
                    <span className="flex items-center truncate max-w-xs">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                      {rep.location_address || 'Reported Location'}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(rep.created_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <Link
                  to={`/citizen/track/${rep.complaint_id}`}
                  className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-white hover:text-blue-600 hover:border-blue-300 shadow-sm transition shrink-0"
                >
                  Track Status
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;

