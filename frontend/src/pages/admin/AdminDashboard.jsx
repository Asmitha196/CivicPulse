import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { issuesService, reportsService, analyticsService } from '../../services/api';
import IssueMap from '../../components/maps/IssueMap';
import {
  Shield,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  Copy,
  Wrench,
  ArrowRight,
  TrendingUp,
  MapPin,
  Sparkles
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [issues, setIssues] = useState([]);
  const [duplicateReports, setDuplicateReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const [statRes, issRes, repRes] = await Promise.all([
          analyticsService.getStats(),
          issuesService.getAll(),
          reportsService.getAll()
        ]);
        setStats(statRes.data?.summary || null);
        setIssues(issRes.data || []);

        // Filter reports that have AI detected duplicates awaiting review
        const dups = (repRes.data || []).filter(
          (r) => r.ai_suggestion && r.ai_suggestion.duplicate_detected && r.status === 'SUBMITTED'
        );
        setDuplicateReports(dups);
      } catch (err) {
        console.error("Admin dashboard load error", err);
      } finally {
        setLoading(false);
      }
    };
    loadAdminData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>Municipal Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Administrator Civic Operations
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Triage citizen reports, review AI semantic duplicate suggestions, verify priority severity, and certify field worker repair evidence.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/admin/duplicates"
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition"
          >
            <Copy className="w-4 h-4 mr-1.5" />
            Duplicate Review ({duplicateReports.length})
          </Link>
          <Link
            to="/admin/analytics"
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition"
          >
            Analytics
          </Link>
        </div>
      </div>

      {/* Duplicate Alert Banner if pending */}
      {duplicateReports.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-purple-900">
                {duplicateReports.length} Potential Duplicate Complaint(s) Flagged by AI
              </h4>
              <p className="text-xs text-purple-700">
                Local Sentence-Transformers & PostGIS identified matching complaints within proximate coordinates.
              </p>
            </div>
          </div>

          <Link
            to="/admin/duplicates"
            className="inline-flex items-center px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition shrink-0"
          >
            Review Duplicates Now
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Link>
        </div>
      )}

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Complaints', value: stats?.total_complaints || 0, color: 'text-slate-900', bg: 'bg-white', icon: Users },
          { label: 'Pending Review', value: stats?.pending_complaints || 0, color: 'text-amber-600', bg: 'bg-amber-50/50', icon: Clock },
          { label: 'Verified Issues', value: stats?.verified_complaints || 0, color: 'text-blue-600', bg: 'bg-blue-50/50', icon: Shield },
          { label: 'Assigned / In Progress', value: (stats?.assigned_complaints || 0) + (stats?.in_progress_complaints || 0), color: 'text-indigo-600', bg: 'bg-indigo-50/50', icon: Wrench },
          { label: 'Verified Resolved', value: stats?.resolved_complaints || 0, color: 'text-emerald-600', bg: 'bg-emerald-50/50', icon: CheckCircle2 },
          { label: 'Critical Hazards', value: stats?.critical_issues || 0, color: 'text-red-600', bg: 'bg-red-50/50', icon: AlertTriangle }
        ].map((card, i) => (
          <div key={i} className={`p-4 rounded-2xl border border-slate-200 shadow-sm ${card.bg} space-y-1`}>
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">{card.label}</span>
              <card.icon className="w-3.5 h-3.5" />
            </div>
            <div className={`text-2xl font-black ${card.color}`}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Interactive Map */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              City-Wide Issue Map & Priority Heatmap
            </h3>
            <p className="text-xs text-slate-500">
              Interactive Leaflet GIS map with PostGIS spatial coordinates
            </p>
          </div>
          <Link
            to="/admin/reports"
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center"
          >
            View all reports table
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <IssueMap issues={issues} height="440px" />
      </div>

      {/* Recent Issues Requiring Admin Action */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Active Municipal Problem Groups
            </h3>
            <p className="text-xs text-slate-500">
              Manage priority, worker dispatch, and repair verification
            </p>
          </div>
          <Link
            to="/admin/reports"
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            See all
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {issues.slice(0, 6).map((iss) => (
            <div
              key={iss.id}
              className="p-5 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {iss.reference_code}
                  </span>
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {iss.category?.name || 'Category'}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      iss.priority === 'CRITICAL'
                        ? 'bg-red-100 text-red-800'
                        : iss.priority === 'HIGH'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {iss.priority}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      iss.status === 'RESOLVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {iss.status}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900">{iss.title}</h4>

                <div className="flex items-center text-xs text-slate-500 space-x-3">
                  <span className="flex items-center truncate max-w-sm">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                    {iss.location_address || 'Reported Location'}
                  </span>
                  <span>•</span>
                  <span>{iss.reports_count || 1} Citizen Report(s) Linked</span>
                </div>
              </div>

              <Link
                to={`/admin/issues/${iss.id}`}
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition shrink-0"
              >
                Inspect & Verify
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

