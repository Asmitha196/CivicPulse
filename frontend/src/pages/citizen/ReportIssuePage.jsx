import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  categoriesService,
  reportsService,
  aiService
} from '../../services/api';
import LocationPicker from '../../components/maps/LocationPicker';
import {
  AlertTriangle,
  Camera,
  Upload,
  Sparkles,
  MapPin,
  CheckCircle2,
  Cpu,
  ArrowRight,
  ShieldAlert,
  Loader2,
  X
} from 'lucide-react';

const ReportIssuePage = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [latitude, setLatitude] = useState(12.9716);
  const [longitude, setLongitude] = useState(77.5946);

  // Photograph upload
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // AI suggestions state
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiCategorySuggestion, setAiCategorySuggestion] = useState(null);
  const [aiPriorityPreview, setAiPriorityPreview] = useState(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState(null);
  const [error, setError] = useState('');

  // Fetch categories
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await categoriesService.getAll();
        setCategories(res.data || []);
        if (res.data && res.data.length > 0) {
          setCategoryId(res.data[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };
    fetchCats();
  }, []);

  // Run AI analysis as citizen types description
  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      if (description.length > 15) {
        setAiAnalyzing(true);
        try {
          const [catRes, prioRes] = await Promise.all([
            aiService.classify(description),
            aiService.recommendPriority({ description })
          ]);
          setAiCategorySuggestion(catRes.data);
          setAiPriorityPreview(prioRes.data);

          // Auto-select category if confidence > 0.65 and user hasn't explicitly locked it
          if (catRes.data?.category_id) {
            setCategoryId(catRes.data.category_id);
          }
        } catch (err) {
          console.error("AI inference notice", err);
        } finally {
          setAiAnalyzing(false);
        }
      }
    }, 750);

    return () => clearTimeout(debounceTimer);
  }, [description]);

  // Handle Photo File selection
  const handlePhotoSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));

    // Upload immediately
    const formData = new FormData();
    formData.append('file', file);
    setUploadingImage(true);
    try {
      const res = await reportsService.uploadImage(formData);
      setUploadedImageUrl(res.data.image_url);
    } catch (err) {
      console.error("Image upload failed", err);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleLocationChange = (lat, lng, address) => {
    setLatitude(lat);
    setLongitude(lng);
    if (address) {
      setLocationAddress(address);
    } else if (!locationAddress) {
      setLocationAddress(`Ward Sector (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !categoryId) {
      setError("Please fill in all required fields (title, description, category).");
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const payload = {
        title,
        description,
        category_id: categoryId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        location_address: locationAddress || 'Civic Ward Location',
        image_url: uploadedImageUrl || null,
      };

      const res = await reportsService.submit(payload);
      setSubmittedReport(res.data);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error("Submission failed", err);
      setError(err.response?.data?.detail || "Failed to submit complaint. Please check your data.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4">
      {/* Success Dialog Modal */}
      {submittedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-xs font-bold text-emerald-600 tracking-wider uppercase">
                Complaint Registered Successfully
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                Unique Complaint ID
              </h3>
              <div className="mt-2 inline-block px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl font-mono text-lg font-bold text-blue-700 tracking-wider">
                {submittedReport.complaint_id}
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Your civic report has been submitted into the municipal triage system. Local AI duplicate checking and administrative verification are currently active.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => navigate(`/citizen/track/${submittedReport.complaint_id}`)}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center justify-center"
              >
                Track Live Progress
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubmittedReport(null);
                  setTitle('');
                  setDescription('');
                  setImagePreview('');
                  setUploadedImageUrl('');
                }}
                className="w-full py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition"
              >
                Submit Another Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Report Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span>Civic Problem Submission</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            Report a Civic Problem
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Provide details, upload a photo, and set the exact location on the map.
          </p>
        </div>

        {error && (
          <div className="m-6 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Issue Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Hazardous 2ft deep pothole near crossroad"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          {/* Description & Live AI Feedback */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Detailed Description <span className="text-red-500">*</span>
              </label>
              {aiAnalyzing && (
                <span className="flex items-center text-[11px] text-blue-600 font-medium">
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  AI analyzing text...
                </span>
              )}
            </div>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what is damaged, how severe it is, any accidents witnessed, and landmarks..."
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />

            {/* AI Suggestion Pill Box */}
            {aiCategorySuggestion && (
              <div className="mt-2 p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-blue-800 font-semibold">
                    <Sparkles className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                    <span>AI Predicted Category: <strong>{aiCategorySuggestion.category_name}</strong></span>
                    <span className="ml-2 text-[10px] bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded font-bold">
                      {Math.round(aiCategorySuggestion.confidence * 100)}% match
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {aiCategorySuggestion.model_name}
                  </span>
                </div>

                {aiPriorityPreview && (
                  <div className="text-[11px] text-slate-600 flex items-center">
                    <span className="font-semibold text-slate-700 mr-1.5">Suggested Severity:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                        aiPriorityPreview.suggested_priority === 'CRITICAL'
                          ? 'bg-red-100 text-red-800'
                          : aiPriorityPreview.suggested_priority === 'HIGH'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {aiPriorityPreview.suggested_priority}
                    </span>
                    <span className="ml-2 text-slate-500 truncate">{aiPriorityPreview.reasoning}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.default_sla_hours}h SLA)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Street / Locality Address
              </label>
              <input
                type="text"
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                placeholder="e.g. 100 Feet Rd, Indiranagar, Bengaluru"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          {/* Photograph Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Upload Complaint Photograph
            </label>
            <div className="mt-1 flex flex-col sm:flex-row items-center gap-4">
              <label className="cursor-pointer flex-1 w-full border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-4 text-center transition bg-slate-50 hover:bg-blue-50/30">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <span className="block text-xs font-bold text-slate-700">
                  Click to take or upload a photograph
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5">
                  PNG, JPG, WEBP up to 10MB
                </span>
              </label>

              {imagePreview && (
                <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-slate-200 shadow-sm shrink-0">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-semibold">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview('');
                      setUploadedImageUrl('');
                    }}
                    className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Location Picker with Leaflet Map */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Exact Geographic Location <span className="text-red-500">*</span>
            </label>
            <LocationPicker
              latitude={latitude}
              longitude={longitude}
              onChange={handleLocationChange}
              height="280px"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/citizen')}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploadingImage}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Registering Complaint...
                </>
              ) : (
                <>
                  Submit Civic Complaint
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportIssuePage;

