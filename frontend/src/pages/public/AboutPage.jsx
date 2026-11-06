import React from 'react';
import {
  CheckCircle,
  Cpu,
  Database,
  Lock,
  MapPin,
  ShieldAlert,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AboutPage = () => {
  return (
    <div className="bg-white py-12 lg:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Problem Statement PS-14 • Architecture Overview</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How CivicPulse Works
          </h1>
          <p className="mt-4 text-slate-600 text-base leading-relaxed">
            A comprehensive, transparent civic problem reporting and resolution system engineered for Technovate 2.0.
          </p>
        </div>

        {/* Core Principles */}
        <div className="space-y-12">
          {/* Principle 1 */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Local AI Semantic Duplicate Detection
                </h3>
                <span className="text-xs text-blue-600 font-semibold">
                  Zero Paid APIs • Local Transformers & TF-IDF Vectors
                </span>
              </div>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-3">
              When multiple citizens report the same pothole, burst pipe, or overflowing garbage bin within proximity, CivicPulse calculates semantic similarity scores using local Sentence Transformers / N-gram cosine vectors and geodesic distance via PostGIS / Haversine.
            </p>
            <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-700">
              <strong className="text-slate-900">Crucial Safeguard:</strong> The AI <span className="font-semibold underline">never</span> automatically merges reports without human oversight. Potential duplicates are highlighted to the municipal administrator with similarity scores and distance metrics for approval or rejection.
            </div>
          </div>

          {/* Principle 2 */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  IssueGroup Central Entity Architecture
                </h3>
                <span className="text-xs text-purple-600 font-semibold">
                  PostgreSQL with PostGIS Geometry
                </span>
              </div>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-3">
              Rather than managing fragmented complaints independently, the <code className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-mono text-xs">IssueGroup</code> serves as the central municipal entity. Multiple citizen reports attach to the single physical problem, aggregating affected citizens, evidence photographs, and status history into one unified dispatch ticket.
            </p>
          </div>

          {/* Principle 3 */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Mandatory Resolution Verification
                </h3>
                <span className="text-xs text-emerald-600 font-semibold">
                  Photographic Evidence Before & After
                </span>
              </div>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-3">
              A complaint cannot be closed merely by a field technician clicking a button. The system enforces:
            </p>
            <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1.5 pl-2 mb-4">
              <li>Worker updates task to IN_PROGRESS.</li>
              <li>Worker uploads BEFORE-repair and mandatory AFTER-repair photographic evidence.</li>
              <li>Issue status shifts to PENDING_VERIFICATION.</li>
              <li>Municipal administrator inspects the evidence photos and explicitly certifies the resolution.</li>
              <li>All linked citizens receive verified notifications with option to rate or request reopening!</li>
            </ol>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            to="/login"
            className="inline-flex items-center px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition"
          >
            <span>Experience the Platform</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;

