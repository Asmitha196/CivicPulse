import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { reportsService, issuesService, feedbackService, evidenceService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import IssueMap from '../../components/maps/IssueMap';
import {
  CheckCircle2,
  Clock,
  MapPin,
  AlertTriangle,
  Camera,
  Star,
  RotateCcw,
  MessageSquare,
  ShieldCheck,
  ChevronLeft,
  Sparkles,
  Info
} from 'lucide-react';

const TrackComplaintPage = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [report, setReport] = useState(null);
  const [issueGroup, setIssueGroup] = useState(null);
  const [evidenceList, setEvidenceList] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Feedback form state
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Reopen modal state
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [submittingReopen, setSubmittingReopen] = useState(false);

  const loadData = async () => {
    try {
      const repRes = await reportsService.getById(id);
      const repData = repRes.data;
      setReport(repData);

      if (repData.issue_group_id) {
        const [issRes, evRes, fbRes] = await Promise.all([
          issuesService.getById(repData.issue_group_id),
          evidenceService.getByIssueId(repData.issue_group_id),
          feedbackService.getByIssueId(repData.issue_group_id)
        ]);
        setIssueGroup(issRes.data);
        setEvidenceList(evRes.data || []);
        setFeedbacks(fbRes.data || []);
      }
    } catch (err) {
      console.error("Failed to load complaint data", err);
      setError("Complaint not found or unauthorized to view.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!issueGroup) return;

    setSubmittingFeedback(true);
    try {
      await feedbackService.submit({
        issue_group_id: issueGroup.id,
        rating: parseInt(rating),
        comments: feedbackComment,
        request_reopen: false
      });
      setFeedbackSuccess(true);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to submit feedback.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleReopenSubmit = async (e) => {
    e.preventDefault();
    if (!reopenReason.trim() || !issueGroup) return;

    setSubmittingReopen(true);
    try {
      await issuesService.reopen(issueGroup.id, { reopen_reason: reopenReason });
      setShowReopenModal(false);
      setReopenReason('');
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to request reopening.");
    } finally {
      setSubmittingReopen(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-slate-500">
        Loading complaint tracking data...
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="py-16 text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">{error || 'Complaint not found'}</h3>
        <Link
          to="/citizen/complaints"
          className="text-xs font-semibold text-blue-600 hover:underline"
        >
          Return to My Complaints
        </Link>
      </div>
    );
  }

  // 6-step progress pipeline
  const currentStatus = issueGroup?.status || 'REPORTED';
  const steps = [
    { label: 'Submitted', key: 'REPORTED', done: true },
    { label: 'Admin Verified', key: 'VERIFIED', done: ['VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_VERIFICATION', 'RESOLVED'].includes(currentStatus) },
    { label: 'Worker Assigned', key: 'ASSIGNED', done: ['ASSIGNED', 'IN_PROGRESS', 'PENDING_VERIFICATION', 'RESOLVED'].includes(currentStatus) },
    { label: 'Repair in Progress', key: 'IN_PROGRESS', done: ['IN_PROGRESS', 'PENDING_VERIFICATION', 'RESOLVED'].includes(currentStatus) },
    { label: 'Evidence Review', key: 'PENDING_VERIFICATION', done: ['PENDING_VERIFICATION', 'RESOLVED'].includes(currentStatus) },
    { label: 'Resolved & Certified', key: 'RESOLVED', done: currentStatus === 'RESOLVED' }
  ];

  const isResolved = currentStatus === 'RESOLVED';
  const isReopened = currentStatus === 'REOPENED';

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-2">
      {/* Back button */}
      <div>
        <Link
          to="/citizen/complaints"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to My Complaints
        </Link>
      </div>

      {/* Top Banner Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-sm font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
              {report.complaint_id}
            </span>
            {issueGroup && (
              <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Master Ticket: {issueGroup.reference_code}
              </span>
            )}
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                isResolved
                  ? 'bg-emerald-100 text-emerald-800'
                  : isReopened
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {currentStatus}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            {report.title}
          </h1>

          <div className="flex items-center text-xs text-slate-500 space-x-3">
            <span className="flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
              {report.location_address || 'Reported Location'}
            </span>
            <span>•</span>
            <span>Category: <strong>{report.category?.name}</strong></span>
            <span>•</span>
            <span>Priority: <strong>{issueGroup?.priority || 'MEDIUM'}</strong></span>
          </div>
        </div>

        {isResolved && (
          <button
            type="button"
            onClick={() => setShowReopenModal(true)}
            className="inline-flex items-center px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition shadow-sm shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Request Reopening
          </button>
        )}
      </div>

      {/* Progress Pipeline Visualization */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">
          Official Municipal Resolution Lifecycle
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          {steps.map((step, idx) => (
            <div key={step.key} className="flex flex-col items-center text-center relative">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs transition mb-2 ${
                  step.done
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {step.done ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
              </div>
              <span className={`text-xs font-bold ${step.done ? 'text-slate-800' : 'text-slate-400'}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Photos, Location & Status History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details & Photographic Evidence */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description & Citizen photo */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Complaint Description & Citizen Photo
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
              {report.description}
            </p>

            {report.image_url && (
              <div>
                <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Citizen Uploaded Photograph
                </span>
                <img
                  src={report.image_url}
                  alt="Citizen Upload"
                  className="rounded-xl max-h-72 w-full object-cover border border-slate-200"
                />
              </div>
            )}
          </div>

          {/* Photographic Repair Verification Evidence */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Field Repair Evidence Photographs
                </h3>
                <p className="text-xs text-slate-500">
                  Photographic proof submitted by field technicians for municipal verification
                </p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                {evidenceList.length} evidence photo(s)
              </span>
            </div>

            {evidenceList.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-400">
                <Camera className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                Technician has not uploaded before/after repair photographs yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {evidenceList.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ev.evidence_type === 'AFTER_REPAIR'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {ev.evidence_type.replace('_', ' ')}
                      </span>
                      {ev.is_verified_by_admin && (
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center">
                          <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                          Admin Certified
                        </span>
                      )}
                    </div>

                    <img
                      src={ev.image_url}
                      alt={ev.evidence_type}
                      className="w-full h-44 object-cover rounded-lg border border-slate-200"
                    />

                    {ev.remarks && (
                      <p className="text-[11px] text-slate-600 italic">
                        "{ev.remarks}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Citizen Feedback Form (When Resolved) */}
          {isResolved && (
            <div className="bg-gradient-to-br from-emerald-50/60 to-teal-50/40 p-6 rounded-2xl border border-emerald-200 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
                <Star className="w-4 h-4 text-emerald-600" />
                <span>Rate Municipal Resolution Service</span>
              </div>

              {feedbackSuccess ? (
                <div className="p-4 bg-emerald-100 rounded-xl text-emerald-800 text-xs font-semibold flex items-center">
                  <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-600" />
                  Thank you! Your feedback has been officially recorded in the municipal analytics system.
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Resolution Quality Rating
                    </label>
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 text-amber-400 hover:scale-110 transition"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-slate-600 ml-2">
                        {rating} out of 5 Stars
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Citizen Remarks (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      placeholder="Share your thoughts on the repair speed, quality, or community impact..."
                      className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingFeedback}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
                  >
                    {submittingFeedback ? 'Submitting...' : 'Submit Resolution Feedback'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Right 1 Col: Location Map & Status History Log */}
        <div className="space-y-6">
          {/* Map */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Reported Location
            </h3>
            <IssueMap
              issues={issueGroup ? [issueGroup] : [report]}
              height="240px"
              center={[report.latitude, report.longitude]}
              zoom={15}
            />
            <p className="text-[11px] text-slate-500 flex items-center pt-1">
              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
              {report.location_address}
            </p>
          </div>

          {/* Status History Timeline */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Official Status History
            </h3>

            <div className="space-y-4">
              {issueGroup?.status_history && issueGroup.status_history.length > 0 ? (
                issueGroup.status_history.map((hist, i) => (
                  <div key={hist.id || i} className="relative pl-5 border-l-2 border-blue-500/30 text-xs">
                    <span className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-blue-600"></span>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{new Date(hist.created_at).toLocaleString()}</span>
                      <span className="font-semibold text-slate-600 uppercase">{hist.to_status}</span>
                    </div>
                    <p className="text-slate-700 text-xs mt-1 leading-snug">{hist.remarks}</p>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 text-center py-4">
                  No status updates recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reopen Request Modal */}
      {showReopenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center space-x-2 text-rose-600 font-bold text-sm">
              <RotateCcw className="w-5 h-5" />
              <span>Request Reopening of Complaint</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              If the problem was not adequately solved or has recurred, describe why this issue should be reopened for re-inspection.
            </p>

            <form onSubmit={handleReopenSubmit} className="space-y-3">
              <textarea
                required
                rows={3}
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="Explain why the repair is incomplete or unsatisfactory..."
                className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
              />

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReopenModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReopen}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                >
                  {submittingReopen ? 'Submitting...' : 'Reopen Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackComplaintPage;

