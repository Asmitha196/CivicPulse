import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/api';
import { Users, Wrench, CheckCircle2, Clock, Phone, Award, BarChart3 } from 'lucide-react';

const AdminWorkersPage = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const res = await analyticsService.getStats();
        setWorkers(res.data?.worker_performance || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkers();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Field Technician Staff & Fleet
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Monitor field workforce assignment load, resolution efficiency, and completion rates
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">
            Loading workforce metrics...
          </div>
        ) : workers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">
            No field workers registered.
          </div>
        ) : (
          workers.map((worker) => (
            <div
              key={worker.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-lg">
                  {worker.name[0]}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{worker.name}</h3>
                  <div className="flex items-center text-xs text-slate-500 mt-0.5">
                    <Phone className="w-3 h-3 mr-1 text-slate-400" />
                    <span>{worker.phone}</span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <div>
                  <span className="block text-[10px] font-bold uppercase text-slate-400">Total</span>
                  <span className="text-base font-extrabold text-slate-800">{worker.total_tasks}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase text-slate-400">Active</span>
                  <span className="text-base font-extrabold text-amber-600">{worker.in_progress}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase text-slate-400">Resolved</span>
                  <span className="text-base font-extrabold text-emerald-600">{worker.completed}</span>
                </div>
              </div>

              {/* Completion Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600 flex items-center">
                    <Award className="w-3.5 h-3.5 mr-1 text-amber-500" />
                    Success Rate
                  </span>
                  <span className="text-slate-800">{worker.completion_rate}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, worker.completion_rate)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminWorkersPage;

