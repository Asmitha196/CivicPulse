import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Crosshair, MapPin, Check } from 'lucide-react';

const pickerIcon = L.divIcon({
  className: 'location-picker-marker',
  html: `
    <div style="
      background-color: #2563eb;
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid #ffffff;
      box-shadow: 0 4px 10px rgba(37, 99, 235, 0.4);
    ">
      <div style="
        width: 10px;
        height: 10px;
        background-color: #ffffff;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Map click handler
const MapClickHandler = ({ onLocationSelected }) => {
  useMapEvents({
    click(e) {
      onLocationSelected(parseFloat(e.latlng.lat.toFixed(6)), parseFloat(e.latlng.lng.toFixed(6)));
    },
  });
  return null;
};

// Map center synchronizer
const MapCenterUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);
  return null;
};

const LocationPicker = ({
  latitude,
  longitude,
  onChange,
  height = '320px',
  defaultCenter = [12.9716, 77.5946]
}) => {
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState(false);

  const currentLat = latitude || defaultCenter[0];
  const currentLng = longitude || defaultCenter[1];

  const fetchAddress = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          const parts = [
            data.address?.road || data.address?.suburb,
            data.address?.neighbourhood || data.address?.city_district || data.address?.suburb,
            data.address?.city || data.address?.town || data.address?.state
          ].filter(Boolean);
          const formatted = parts.length > 0 ? parts.join(', ') : data.display_name.split(',').slice(0, 3).join(',');
          return formatted;
        }
      }
    } catch (e) {
      // Offline fallback
    }
    return `Civic Ward Sector (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  };

  const handleLocationUpdate = async (lat, lng) => {
    const address = await fetchAddress(lat, lng);
    onChange(lat, lng, address);
  };

  const handleGpsDetect = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));
        await handleLocationUpdate(lat, lng);
        setGpsLoading(false);
        setGpsSuccess(true);
        setTimeout(() => setGpsSuccess(false), 3000);
      },
      (error) => {
        console.error("GPS detection error:", error);
        setGpsLoading(false);
        alert("Could not access GPS location. You can click on the map to set the exact position.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center text-xs text-slate-500">
          <MapPin className="w-3.5 h-3.5 mr-1 text-blue-600" />
          <span>Click anywhere on the map to position the pin</span>
        </div>

        <button
          type="button"
          onClick={handleGpsDetect}
          disabled={gpsLoading}
          className={`inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
            gpsSuccess
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : 'bg-white hover:bg-slate-50 text-blue-600 border-blue-200 shadow-sm'
          }`}
        >
          {gpsSuccess ? (
            <>
              <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              GPS Locked!
            </>
          ) : (
            <>
              <Crosshair className={`w-3.5 h-3.5 mr-1.5 ${gpsLoading ? 'animate-spin' : ''}`} />
              {gpsLoading ? 'Detecting GPS...' : 'Use My Current GPS'}
            </>
          )}
        </button>
      </div>

      <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-inner" style={{ height }}>
        <MapContainer
          center={[currentLat, currentLng]}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapCenterUpdater center={[currentLat, currentLng]} />
          <MapClickHandler onLocationSelected={handleLocationUpdate} />

          {latitude && longitude && (
            <Marker position={[latitude, longitude]} icon={pickerIcon} />
          )}
        </MapContainer>

        {/* Coordinates indicator banner */}
        <div className="absolute bottom-2 left-2 z-[400] bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md border border-slate-200 text-[11px] font-mono text-slate-700 shadow-sm">
          Lat: {currentLat.toFixed(4)}, Lon: {currentLng.toFixed(4)}
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;

