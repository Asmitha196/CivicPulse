import React, { useState, useEffect } from 'react';
import { reportsService, issuesService, aiService } from '../../services/api';
import {
  Copy,
  Sparkles,
  CheckCircle2,
  XCircle,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Brain,
  Info
} from 'lucide-react';

const AdminDuplicateReviewPage = () => {
  const [duplicateReports, setDuplicateReports] = useState([]);
  const [issueGroupsMap, setIssueGroupsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState({});
  const [processingId, setProcessingId] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');

  const loadDuplicates = async () => {
    try {
      const [repRes, issRes] = await Promise.all([
        reportsService.getAll(),
        issuesService.getAll()
      ]);

      const groups = {};
      (issRes.data || []).forEach((g) => {
        groups[g.id] = g;
      });
      setIssueGroupsMap(groups);

      // Find all reports with duplicate detected that are SUBMITTED or need review
      const dups = (repRes.data || []).filter(
        (r) => r.ai_suggestion && r.ai_suggestion.duplicate_detected && r.status === 'SUBMITTED'
      );
      setDuplicateReports(dups);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDuplicates();
  }, []);

  const handleMergeAction = async (report, targetGroupId, status) => {
    setProcessingId(report.id);
    setActionSuccess('');

    try {
      const notes = adminNotes[report.id] || (status === 'APPROVED' ? 'Approved duplicate grouping after administrator review.' : 'Administrator rejected duplicate candidate.');
      await issuesService.mergeDuplicate(targetGroupId, {
        secondary_report_id: report.id,
        admin_notes: notes,
        status: status // 'APPROVED' or 'REJECTED'
      });

      setActionSuccess(
        status === 'APPROVED'
          ? `Report #${report.complaint_id} successfully merged into Issue Group #${issueGroupsMap[targetGroupId]?.reference_code || targetGroupId}!`
          : `Report #${report.complaint_id} marked as independent.`
      );

      // Reload
      loadDuplicates();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Action failed.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold mb-1">
            <Brain className="w-3.5 h-3.5" />
            <span>AI Semantic & Spatial Intelligence</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Duplicate Complaint Verification
          </h1>
          <p className="text-xs text-purple-200 mt-1 max-w-xl">
            Sentence Transformers calculate description similarity and PostGIS evaluates geographic distance. Human administrator holds final approval authority.
          </p>
        </div>

        <div className="p-3 bg-white/10 rounded-xl border border-white/10 text-center shrink-0">
          <span className="block text-[11px] text-purple-200 font-bold uppercase tracking-wider">
            Pending AI Reviews
          </span>
          <span className="text-2xl font-black text-white">{duplicateReports.length}</span>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Duplicate Candidates List */}
      <div className="space-y-6">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            Analyzing active civic complaints...
          </div>
        ) : duplicateReports.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              No Pending Duplicate Conflicts
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              All reported complaints have either been verified, linked into consolidated master issue groups, or kept separate.
            </p>
          </div>
        ) : (
          duplicateReports.map((report) => {
            const ai = report.ai_suggestion;
            const targetGroupId = ai.matched_issue_group_id;
            const primaryGroup = issueGroupsMap[targetGroupId];

            const simPercent = Math.round((ai.similarity_score || 0.85) * 100);
            const distMeters = Math.round(ai.distance_meters || 35);

            return (
              <div
                key={report.id}
                className="bg-white rounded-2xl border border-purple-200 shadow-md overflow-hidden"
              >
                {/* AI Match Metrics Bar */}
                <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 px-6 py-3 border-b border-purple-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <span className="inline-flex items-center text-xs font-bold text-purple-900 bg-purple-200/60 px-2.5 py-1 rounded-lg">
                      <Sparkles className="w-3.5 h-3.5 mr-1 text-purple-700" />
                      Semantic Match: {simPercent}%
                    </span>
                    <span className="inline-flex items-center text-xs font-bold text-indigo-900 bg-indigo-200/60 px-2.5 py-1 rounded-lg">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-indigo-700" />
                      PostGIS Distance: {distMeters}m
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-500 font-mono">
                    Model: {ai.model_name}
                  </span>
                </div>

                {/* Side-by-side comparison */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: New Citizen Report */}
                  <div className="space-y-3 p-4 bg-slate-50/80 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                        New Citizen Report
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-700">
                        {report.complaint_id}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{report.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-100">
                      "{report.description}"
                    </p>

                    {report.image_url && (
                      <img
                        src={report.image_url}
                        alt="Citizen Upload"
                        className="w-full h-40 object-cover rounded-lg border border-slate-200"
                      />
                    )}

                    <div className="text-[11px] text-slate-500 flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                      <span className="truncate">{report.location_address || `Lat: ${report.latitude.toFixed(4)}, Lon: ${report.longitude.toFixed(4)}`}</span>
                    </div>
                  </div>

                  {/* Right: Existing Master Issue Group */}
                  <div className="space-y-3 p-4 bg-purple-50/40 rounded-xl border border-purple-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                        Existing Master Ticket
                      </span>
                      <span className="font-mono text-xs font-bold text-purple-900">
                        {primaryGroup?.reference_code || 'Target Group'}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">
                      {primaryGroup?.title || 'Active Civic Task'}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-100">
                      "{primaryGroup?.description || 'Existing municipal record'}"
                    </p>

                    <div className="p-3 bg-white rounded-lg border border-purple-100 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Current Status:</span>
                        <span className="font-bold text-slate-800">{primaryGroup?.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Priority Level:</span>
                        <span className="font-bold text-purple-700">{primaryGroup?.priority}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Location:</span>
                        <span className="text-slate-800 truncate max-w-[180px]">{primaryGroup?.location_address}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <input
                    type="text"
                    placeholder="Administrator verification remarks (optional)..."
                    value={adminNotes[report.id] || ''}
                    onChange={(e) =>
                      setAdminNotes({ ...adminNotes, [report.id]: e.target.value })
                    }
                    className="w-full sm:w-1/2 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                  />

                  <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      disabled={processingId === report.id}
                      onClick={() => handleMergeAction(report, targetGroupId, 'REJECTED')}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs transition"
                    >
                      Reject • Keep Separate
                    </button>

                    <button
                      type="button"
                      disabled={processingId === report.id}
                      onClick={() => handleMergeAction(report, targetGroupId, 'APPROVED')}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition flex items-center"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      Approve & Merge into Master Ticket
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminDuplicateReviewPage;

