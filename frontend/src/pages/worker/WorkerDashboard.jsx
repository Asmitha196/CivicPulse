import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { assignmentsService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Wrench,
  Clock,
  CheckCircle2,
  MapPin,
  ArrowRight,
  AlertTriangle,
  Camera,
  Layers
} from 'lucide-react';

const WorkerDashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const res = await assignmentsService.getMyTasks();
        setTasks(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadTasks();
  }, []);

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter === 'ALL') return true;
    return t.status === statusFilter;
  });

  const activeCount = tasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'PENDING' || t.status === 'ACCEPTED').length;
  const submittedCount = tasks.filter((t) => t.status === 'SUBMITTED').length;
  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 rounded-2xl p-6 text-white shadow-lg shadow-orange-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-200">
            Field Technician Console
          </span>
          <h1 className="text-2xl font-extrabold mt-1">Hello, {user?.full_name}!</h1>
          <p className="text-xs text-amber-100 mt-1 max-w-lg">
            Manage your on-site repair dispatches, record field progress remarks, and upload before/after photographic proof for municipal verification.
          </p>
        </div>

        <div className="p-3 bg-white/10 rounded-xl border border-white/20 text-center shrink-0">
          <span className="block text-[11px] text-amber-100 font-bold uppercase tracking-wider">
            Active Tasks
          </span>
          <span className="text-2xl font-black text-white">{activeCount}</span>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase text-slate-400">In Progress</span>
          <h3 className="text-xl font-bold text-amber-600 mt-0.5">{activeCount}</h3>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase text-slate-400">Under Review</span>
          <h3 className="text-xl font-bold text-purple-600 mt-0.5">{submittedCount}</h3>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase text-slate-400">Completed</span>
          <h3 className="text-xl font-bold text-emerald-600 mt-0.5">{completedCount}</h3>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        {['ALL', 'PENDING', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              statusFilter === st
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {st === 'ALL' ? 'All Assigned' : st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Task Cards List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading assigned tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No tasks in this category</h4>
            <p className="text-xs text-slate-400">All current work assignments are up to date.</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const issue = task.issue_group;
            if (!issue) return null;

            return (
              <div
                key={task.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-black text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                      {issue.reference_code}
                    </span>
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {issue.category?.name || 'Category'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        issue.priority === 'CRITICAL'
                          ? 'bg-red-100 text-red-800'
                          : issue.priority === 'HIGH'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {issue.priority}
                    </span>
                  </div>

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

                <div>
                  <h3 className="text-base font-bold text-slate-900">{issue.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                    {issue.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <span className="flex items-center truncate max-w-sm">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                    {issue.location_address || 'Job Site Location'}
                  </span>

                  <Link
                    to={`/worker/tasks/${task.id}`}
                    className="inline-flex items-center px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition shrink-0"
                  >
                    Open Work Console
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default WorkerDashboard;

