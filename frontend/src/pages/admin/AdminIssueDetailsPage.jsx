import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  issuesService,
  assignmentsService,
  evidenceService,
  feedbackService,
  authService
} from '../../services/api';
import IssueMap from '../../components/maps/IssueMap';
import {
  Shield,
  ShieldCheck,
  AlertTriangle,
  User,
  Users,
  Wrench,
  CheckCircle2,
  Camera,
  Star,
  Clock,
  ArrowRight,
  ChevronLeft,
  MapPin,
  Sparkles,
  Loader2,
  XCircle
} from 'lucide-react';

const AdminIssueDetailsPage = () => {
  const { id } = useParams();

  const [issue, setIssue] = useState(null);
  const [evidenceList, setEvidenceList] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Priority verification modal state
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [newPriority, setNewPriority] = useState('HIGH');
  const [verifyRemarks, setVerifyRemarks] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Worker assignment modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Evidence verification state
  const [verifyingEvidenceId, setVerifyingEvidenceId] = useState(null);

  const loadData = async () => {
    try {
      const [issRes, evRes, fbRes, wrkRes] = await Promise.all([
        issuesService.getById(id),
        evidenceService.getByIssueId(id),
        feedbackService.getByIssueId(id),
        authService.getWorkers()
      ]);
      setIssue(issRes.data);
      setEvidenceList(evRes.data || []);
      setFeedbacks(fbRes.data || []);
      setWorkers(wrkRes.data || []);

      if (issRes.data?.priority) {
        setNewPriority(issRes.data.priority);
      }
      if (wrkRes.data?.length > 0) {
        setSelectedWorkerId(wrkRes.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Handle Verify Severity & Priority
  const handleVerifyPriority = async (e) => {
    e.preventDefault();
    setVerifying(true);
    try {
      await issuesService.verify(issue.id, {
        priority: newPriority,
        verification_remarks: verifyRemarks
      });
      setShowVerifyModal(false);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to verify priority.");
    } finally {
      setVerifying(false);
    }
  };

  // Handle Worker Assignment
  const handleAssignWorker = async (e) => {
    e.preventDefault();
    if (!selectedWorkerId) return;
    setAssigning(true);
    try {
      await assignmentsService.assign({
        issue_group_id: issue.id,
        worker_id: selectedWorkerId,
        notes: assignNotes
      });
      setShowAssignModal(false);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to assign worker.");
    } finally {
      setAssigning(false);
    }
  };

  // Handle Administrator Evidence Certification (RESOLVE)
  const handleVerifyEvidence = async (evidenceId, isApproved) => {
    setVerifyingEvidenceId(evidenceId);
    try {
      await evidenceService.verify(evidenceId, {
        is_verified: isApproved,
        remarks: isApproved ? "Administrator inspected and certified repair." : "Evidence rejected as insufficient."
      });
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to certify repair evidence.");
    } finally {
      setVerifyingEvidenceId(null);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading issue details...</div>;
  }

  if (!issue) {
    return (
      <div className="py-16 text-center space-y-2">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">Issue Group Not Found</h3>
        <Link to="/admin" className="text-xs text-blue-600 hover:underline">
          Return to Admin Dashboard
        </Link>
      </div>
    );
  }

  const isResolved = issue.status === 'RESOLVED';

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/admin"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Admin Console
        </Link>
      </div>

      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-sm font-black text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
              {issue.reference_code}
            </span>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded">
              {issue.category?.name || 'Civic'}
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                issue.priority === 'CRITICAL'
                  ? 'bg-red-100 text-red-800'
                  : issue.priority === 'HIGH'
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              Priority: {issue.priority}
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                isResolved ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
              }`}
            >
              Status: {issue.status}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">{issue.title}</h1>

          <div className="flex items-center text-xs text-slate-500 space-x-3">
            <span className="flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
              {issue.location_address || 'Reported Location'}
            </span>
            <span>•</span>
            <span>{issue.reports?.length || 1} Linked Citizen Complaint(s)</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {!isResolved && (
            <>
              <button
                type="button"
                onClick={() => setShowVerifyModal(true)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition flex items-center"
              >
                <ShieldCheck className="w-4 h-4 mr-1.5" />
                Verify Severity & Priority
              </button>

              <button
                type="button"
                onClick={() => setShowAssignModal(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center"
              >
                <Wrench className="w-4 h-4 mr-1.5" />
                Dispatch Field Worker
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Grid: Details, Evidence Certification, Linked Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Linked Citizen Complaints Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Linked Citizen Complaints ({issue.reports?.length || 0})
                </h3>
                <p className="text-xs text-slate-500">
                  All individual citizen reports consolidated into this master issue group
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {issue.reports?.map((rep) => (
                <div key={rep.id} className="py-3 flex items-start space-x-3 text-xs">
                  {rep.image_url ? (
                    <img
                      src={rep.image_url}
                      alt={rep.title}
                      className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                      <Camera className="w-5 h-5" />
                    </div>
                  )}

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-blue-700">{rep.complaint_id}</span>
                      <span className="text-[10px] text-slate-400">{new Date(rep.created_at).toLocaleDateString()}</span>
                    </div>
                    <h5 className="font-bold text-slate-800">{rep.title}</h5>
                    <p className="text-slate-600 leading-snug">{rep.description}</p>
                    <div className="text-[10px] text-slate-400 flex items-center">
                      <User className="w-3 h-3 mr-1" />
                      Reported by {rep.citizen?.full_name || 'Citizen'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Evidence Verification Console (Section 5.D) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
                  <Camera className="w-4 h-4" />
                  <span>Mandatory Repair Proof</span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Resolution Evidence Verification
                </h3>
                <p className="text-xs text-slate-500">
                  Require photographic verification by municipal administrator before an issue can be closed.
                </p>
              </div>
            </div>

            {evidenceList.length === 0 ? (
              <div className="py-8 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs text-slate-400">
                No repair evidence photos uploaded by field technician yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {evidenceList.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3"
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

                      {ev.is_verified_by_admin ? (
                        <span className="text-xs font-bold text-emerald-600 flex items-center">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Officially Certified
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Awaiting Review
                        </span>
                      )}
                    </div>

                    <img
                      src={ev.image_url}
                      alt={ev.evidence_type}
                      className="w-full h-44 object-cover rounded-lg border border-slate-200"
                    />

                    {ev.remarks && (
                      <p className="text-xs text-slate-600 italic">"{ev.remarks}"</p>
                    )}

                    {/* Admin verification buttons */}
                    {!ev.is_verified_by_admin && (
                      <div className="pt-2 flex items-center space-x-2 border-t border-slate-200">
                        <button
                          type="button"
                          disabled={verifyingEvidenceId === ev.id}
                          onClick={() => handleVerifyEvidence(ev.id, true)}
                          className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                          Certify Repair & Resolve Issue
                        </button>

                        <button
                          type="button"
                          disabled={verifyingEvidenceId === ev.id}
                          onClick={() => handleVerifyEvidence(ev.id, false)}
                          className="py-2 px-3 rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-semibold"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Citizen Feedback Viewer */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Citizen Feedback & Reopen Requests ({feedbacks.length})
            </h3>

            {feedbacks.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                No feedback received from citizens for this issue yet.
              </div>
            ) : (
              <div className="space-y-3">
                {feedbacks.map((fb) => (
                  <div
                    key={fb.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= fb.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                            }`}
                          />
                        ))}
                        <span className="font-bold text-slate-700 ml-1.5">{fb.rating}/5 Stars</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(fb.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {fb.comments && <p className="text-slate-700 italic">"{fb.comments}"</p>}

                    {fb.request_reopen && (
                      <div className="p-2 bg-rose-50 border border-rose-200 text-rose-800 rounded font-semibold text-[11px]">
                        ⚠️ Citizen Requested Reopening: {fb.reopen_reason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Location Map & Status History */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Geographic Coordinates
            </h3>
            <IssueMap issues={[issue]} height="250px" center={[issue.latitude, issue.longitude]} zoom={15} />
            <p className="text-[11px] text-slate-500 pt-1 flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
              {issue.location_address}
            </p>
          </div>

          {/* Status History */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Audit Status History
            </h3>
            <div className="space-y-4">
              {issue.status_history?.map((hist, i) => (
                <div key={hist.id || i} className="relative pl-5 border-l-2 border-purple-500/30 text-xs">
                  <span className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-purple-600"></span>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{new Date(hist.created_at).toLocaleString()}</span>
                    <span className="font-bold text-purple-700 uppercase">{hist.to_status}</span>
                  </div>
                  <p className="text-slate-700 text-xs mt-1 leading-snug">{hist.remarks}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Verify Severity Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center space-x-2 text-purple-700 font-bold text-sm">
              <ShieldCheck className="w-5 h-5" />
              <span>Verify Severity & Priority</span>
            </div>

            <form onSubmit={handleVerifyPriority} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign Final Priority
                </label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl outline-none"
                >
                  <option value="LOW">LOW (Cosmetic / Minor)</option>
                  <option value="MEDIUM">MEDIUM (Standard municipal SLA)</option>
                  <option value="HIGH">HIGH (Severe disturbance)</option>
                  <option value="CRITICAL">CRITICAL (Public safety hazard)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Verification Remarks
                </label>
                <textarea
                  rows={3}
                  value={verifyRemarks}
                  onChange={(e) => setVerifyRemarks(e.target.value)}
                  placeholder="Notes from municipal inspection..."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifying}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
                >
                  {verifying ? 'Saving...' : 'Confirm Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Field Worker Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center space-x-2 text-blue-700 font-bold text-sm">
              <Wrench className="w-5 h-5" />
              <span>Dispatch Municipal Field Technician</span>
            </div>

            <form onSubmit={handleAssignWorker} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Field Worker
                </label>
                <select
                  required
                  value={selectedWorkerId}
                  onChange={(e) => setSelectedWorkerId(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl outline-none"
                >
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.full_name} ({w.phone || 'Field Lead'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dispatch Instructions & Equipment Notes
                </label>
                <textarea
                  rows={3}
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="Instructions for crew (e.g. Bring bitumen roller, clear traffic cones)..."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                >
                  {assigning ? 'Dispatching...' : 'Assign Worker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminIssueDetailsPage;

