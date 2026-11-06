import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportsService, categoriesService } from '../../services/api';
import {
  Search,
  Filter,
  FileText,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  Eye,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

const AdminReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [repRes, catRes] = await Promise.all([
          reportsService.getAll(),
          categoriesService.getAll()
        ]);
        setReports(repRes.data || []);
        setCategories(catRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.complaint_id.toLowerCase().includes(search.toLowerCase()) ||
      (r.location_address && r.location_address.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = selectedCategory ? r.category_id === selectedCategory : true;
    const matchesStatus = selectedStatus ? r.status === selectedStatus : true;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          All Citizen Complaints
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Consolidated registry of community complaints submitted across all wards
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search complaint ID or keywords..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none bg-white text-slate-700"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none bg-white text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="LINKED">LINKED</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>
        </div>
      </div>

      {/* Table view */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Complaint ID</th>
                <th className="px-5 py-3.5">Issue Title</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Location</th>
                <th className="px-5 py-3.5">AI Analysis</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading reports...
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No complaints matching your query.
                  </td>
                </tr>
              ) : (
                filteredReports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {r.complaint_id}
                    </td>

                    <td className="px-5 py-4 font-medium text-slate-900 max-w-xs truncate">
                      {r.title}
                    </td>

                    <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold">
                        {r.category?.name || 'General'}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-500 max-w-[180px] truncate">
                      {r.location_address || 'Civic Ward'}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      {r.ai_suggestion?.duplicate_detected ? (
                        <span className="inline-flex items-center text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Potential Duplicate
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-mono">
                          Prio: {r.ai_suggestion?.suggested_priority || 'MED'}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          r.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'LINKED'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <Link
                        to={r.issue_group_id ? `/admin/issues/${r.issue_group_id}` : '#'}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminReportsPage;

