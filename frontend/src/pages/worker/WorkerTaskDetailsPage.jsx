import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  assignmentsService,
  issuesService,
  evidenceService
} from '../../services/api';
import IssueMap from '../../components/maps/IssueMap';
import {
  Wrench,
  Camera,
  CheckCircle2,
  Clock,
  MapPin,
  ChevronLeft,
  Upload,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Send
} from 'lucide-react';

const WorkerTaskDetailsPage = () => {
  const { id } = useParams();

  const [task, setTask] = useState(null);
  const [issue, setIssue] = useState(null);
  const [evidenceList, setEvidenceList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Status update state
  const [progressRemarks, setProgressRemarks] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Evidence upload state
  const [evidenceType, setEvidenceType] = useState('AFTER_REPAIR');
  const [evidenceRemarks, setEvidenceRemarks] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [evidencePreview, setEvidencePreview] = useState('');
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [evidenceSuccess, setEvidenceSuccess] = useState('');

  const loadData = async () => {
    try {
      const res = await assignmentsService.getMyTasks();
      const currentTask = (res.data || []).find((t) => t.id === id);
      if (currentTask) {
        setTask(currentTask);
        const [issRes, evRes] = await Promise.all([
          issuesService.getById(currentTask.issue_group_id),
          evidenceService.getByIssueId(currentTask.issue_group_id)
        ]);
        setIssue(issRes.data);
        setEvidenceList(evRes.data || []);
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

  // Handle Status Update (e.g. IN_PROGRESS)
  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      await assignmentsService.updateStatus(task.id, {
        status: newStatus,
        notes: progressRemarks || `Status updated to ${newStatus} by field worker.`
      });
      setProgressRemarks('');
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle Photo Evidence Upload
  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setEvidenceFile(file);
    setEvidencePreview(URL.createObjectURL(file));
  };

  const handleUploadEvidence = async (e) => {
    e.preventDefault();
    if (!evidenceFile) {
      alert("Please select a photograph to upload.");
      return;
    }

    setUploadingEvidence(true);
    setEvidenceSuccess('');

    try {
      // 1. Upload binary file
      const formData = new FormData();
      formData.append('file', evidenceFile);
      const fileRes = await evidenceService.uploadFile(formData);
      const imageUrl = fileRes.data.image_url;

      // 2. Submit evidence record
      await evidenceService.submit({
        issue_group_id: issue.id,
        evidence_type: evidenceType,
        image_url: imageUrl,
        remarks: evidenceRemarks || `Evidence photo uploaded by field worker.`
      });

      setEvidenceSuccess("Evidence photograph submitted successfully! Municipal administrators have been notified.");
      setEvidenceFile(null);
      setEvidencePreview('');
      setEvidenceRemarks('');
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to upload evidence.");
    } finally {
      setUploadingEvidence(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading task details...</div>;
  }

  if (!task || !issue) {
    return (
      <div className="py-16 text-center space-y-2">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">Task Not Found</h3>
        <Link to="/worker" className="text-xs text-amber-600 hover:underline">
          Return to My Tasks
        </Link>
      </div>
    );
  }

  const isCompleted = task.status === 'COMPLETED';
  const isSubmitted = task.status === 'SUBMITTED';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link
          to="/worker"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Assigned Tasks
        </Link>
      </div>

      {/* Task Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-sm font-black text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              {issue.reference_code}
            </span>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              {issue.category?.name || 'Category'}
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                task.status === 'COMPLETED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : task.status === 'SUBMITTED'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              Task: {task.status}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">{issue.title}</h1>

          <p className="text-xs text-slate-500 flex items-center">
            <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
            {issue.location_address || 'Job Site Location'}
          </p>
        </div>

        {/* Task Progress Status Controls */}
        <div className="flex items-center gap-2">
          {task.status === 'PENDING' && (
            <button
              type="button"
              disabled={updatingStatus}
              onClick={() => handleStatusChange('ACCEPTED')}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition"
            >
              Accept Assignment
            </button>
          )}

          {task.status === 'ACCEPTED' && (
            <button
              type="button"
              disabled={updatingStatus}
              onClick={() => handleStatusChange('IN_PROGRESS')}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center"
            >
              <Wrench className="w-4 h-4 mr-1.5" />
              Start Work (IN_PROGRESS)
            </button>
          )}

          {isSubmitted && (
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200">
              Submitted for Admin Verification
            </span>
          )}

          {isCompleted && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Work Certified & Completed
            </span>
          )}
        </div>
      </div>

      {/* Grid: Instructions, Map & Evidence Upload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Dispatch Notes & Job Site Location */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Dispatcher Instructions</h3>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
              {task.notes || 'Proceed to site, follow standard municipal safety protocols, and document photographic evidence.'}
            </div>

            <div className="text-xs text-slate-600 space-y-1 pt-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned At:</span>
                <span className="font-semibold">{new Date(task.assigned_at).toLocaleString()}</span>
              </div>
              {task.accepted_at && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Accepted At:</span>
                  <span className="font-semibold">{new Date(task.accepted_at).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Job Site Location on Map
            </h3>
            <IssueMap issues={[issue]} height="260px" center={[issue.latitude, issue.longitude]} zoom={15} />
            <p className="text-[11px] text-slate-500 pt-1 flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
              {issue.location_address}
            </p>
          </div>
        </div>

        {/* Right: Upload Evidence Photo & Submitted Proofs */}
        <div className="space-y-6">
          {/* Upload Form */}
          {!isCompleted && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 text-amber-700 font-bold text-sm">
                <Camera className="w-4 h-4" />
                <span>Upload Repair Evidence Photograph</span>
              </div>

              {evidenceSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600 shrink-0" />
                  <span>{evidenceSuccess}</span>
                </div>
              )}

              <form onSubmit={handleUploadEvidence} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Evidence Type
                  </label>
                  <select
                    value={evidenceType}
                    onChange={(e) => setEvidenceType(e.target.value)}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-xl outline-none bg-white"
                  >
                    <option value="BEFORE_REPAIR">BEFORE Repair (Initial Site State)</option>
                    <option value="AFTER_REPAIR">AFTER Repair (Completion Proof)</option>
                    <option value="INSPECTION">INSPECTION (Quality Check)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Photograph
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer flex-1 border border-dashed border-slate-300 hover:border-amber-500 p-3 rounded-xl text-center text-xs font-bold text-slate-700 bg-slate-50 transition">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                      <span>Click to choose photograph</span>
                    </label>

                    {evidencePreview && (
                      <img
                        src={evidencePreview}
                        alt="Preview"
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Technician Remarks / Materials Used
                  </label>
                  <textarea
                    rows={2}
                    value={evidenceRemarks}
                    onChange={(e) => setEvidenceRemarks(e.target.value)}
                    placeholder="e.g. Cleared 2 cubic meters of debris, patched with 30kg bitumen mix..."
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-xl outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploadingEvidence || !evidenceFile}
                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition flex items-center justify-center disabled:opacity-50"
                >
                  {uploadingEvidence ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Uploading Evidence...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-1.5" />
                      Submit Evidence & Request Verification
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Submitted Evidence Photos */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              Submitted Photographs ({evidenceList.length})
            </h3>

            {evidenceList.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                No photographs uploaded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {evidenceList.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center space-x-3 text-xs"
                  >
                    <img
                      src={ev.image_url}
                      alt={ev.evidence_type}
                      className="w-16 h-16 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{ev.evidence_type.replace('_', ' ')}</span>
                        {ev.is_verified_by_admin ? (
                          <span className="text-[10px] font-bold text-emerald-600 flex items-center">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-600 font-bold">Pending Review</span>
                        )}
                      </div>
                      <p className="text-slate-600 text-[11px] leading-snug">{ev.remarks}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerTaskDetailsPage;

