import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link, useLocation } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Clock, MapPin, Eye } from 'lucide-react';

// Create custom colored pin icons
const createPriorityIcon = (priority, status) => {
  let color = '#3b82f6'; // default medium blue
  if (status === 'RESOLVED') {
    color = '#10b981'; // green
  } else if (priority === 'CRITICAL') {
    color = '#ef4444'; // red
  } else if (priority === 'HIGH') {
    color = '#f97316'; // orange
  } else if (priority === 'LOW') {
    color = '#64748b'; // slate
  }

  const svgHtml = `
    <div style="
      background-color: ${color};
      width: 28px;
      height: 28px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #ffffff;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
    ">
      <div style="
        width: 10px;
        height: 10px;
        background-color: #ffffff;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-map-marker',
    html: svgHtml,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
};

// Component to dynamically fit map bounds to markers
const MapBoundsAdjuster = ({ issues }) => {
  const map = useMap();

  useEffect(() => {
    if (issues && issues.length > 0) {
      const validPoints = issues
        .filter((i) => i.latitude && i.longitude)
        .map((i) => [i.latitude, i.longitude]);

      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [issues, map]);

  return null;
};

const IssueMap = ({ issues = [], height = '500px', center = [12.9716, 77.5946], zoom = 12 }) => {
  const location = useLocation();
  const isAdminView = location.pathname.startsWith('/admin');

  // Interactive Map Filters
  const [priorityFilter, setPriorityFilter] = React.useState('ALL');
  const [statusFilter, setStatusFilter] = React.useState('ALL');

  const safeIssues = Array.isArray(issues) ? issues : [];

  const filteredIssues = safeIssues.filter((iss) => {
    const matchesPriority =
      priorityFilter === 'ALL' ? true : iss.priority === priorityFilter;
    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'RESOLVED'
        ? iss.status === 'RESOLVED'
        : iss.status !== 'RESOLVED';
    return matchesPriority && matchesStatus;
  });

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm" style={{ height }}>
      {/* Floating Interactive Filter Chips */}
      <div className="absolute top-3 right-3 z-[400] flex flex-wrap items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 shadow-md text-xs">
        <span className="text-[10px] font-bold text-slate-400 uppercase px-1">Filter:</span>
        {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPriorityFilter(p)}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
              priorityFilter === p
                ? p === 'CRITICAL'
                  ? 'bg-red-600 text-white shadow-sm'
                  : p === 'HIGH'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {p === 'ALL' ? 'All Priorities' : p}
          </button>
        ))}

        <div className="h-3 w-px bg-slate-300 mx-0.5"></div>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'RESOLVED' ? 'ALL' : 'RESOLVED')}
          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
            statusFilter === 'RESOLVED'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {statusFilter === 'RESOLVED' ? '✓ Showing Resolved' : 'Show Resolved'}
        </button>
      </div>

      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBoundsAdjuster issues={filteredIssues} />

        {filteredIssues.map((issue) => {
          if (!issue.latitude || !issue.longitude) return null;

          const isResolved = issue.status === 'RESOLVED';
          const icon = createPriorityIcon(issue.priority, issue.status);

          return (
            <Marker
              key={issue.id}
              position={[issue.latitude, issue.longitude]}
              icon={icon}
            >
              <Popup className="civic-map-popup">
                <div className="p-1 min-w-[220px] max-w-[280px]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {issue.reference_code || 'Issue'}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isResolved
                          ? 'bg-emerald-100 text-emerald-800'
                          : issue.priority === 'CRITICAL'
                          ? 'bg-red-100 text-red-800'
                          : issue.priority === 'HIGH'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {isResolved ? 'Resolved' : issue.priority}
                    </span>
                  </div>

                  <h4 className="font-semibold text-slate-900 text-sm mb-1 leading-snug">
                    {issue.title}
                  </h4>

                  <p className="text-slate-600 text-xs line-clamp-2 mb-2">
                    {issue.description}
                  </p>

                  <div className="flex items-center text-slate-500 text-[11px] mb-3">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                    <span className="truncate">{issue.location_address || 'Reported Location'}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {issue.category?.name || 'Civic Issue'}
                    </span>
                    {isAdminView ? (
                      <Link
                        to={`/admin/issues/${issue.id}`}
                        className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Details
                      </Link>
                    ) : issue.reports && issue.reports[0] ? (
                      <Link
                        to={`/citizen/track/${issue.reports[0].complaint_id}`}
                        className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Track
                      </Link>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-mono">
                        {issue.reference_code}
                      </span>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default IssueMap;

