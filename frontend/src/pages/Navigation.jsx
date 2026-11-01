import axios from 'axios';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '@mantine/core';
import { useTranslation } from 'hooks/useTranslation';
import { getApiUrl } from 'config/api';
import { Compass, Navigation as NavIcon, MapPin, Flame, Globe2, Radio, Info } from 'lucide-react';

export default function Navigation() {
  const { t } = useTranslation();
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [distance, setDistance] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);

  // Dashashwamedh Ghat (Varanasi Ganga Aarti) coordinates
  const GANGA_AARTI_LAT = 25.3062;
  const GANGA_AARTI_LON = 83.0107;

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(success, error, { enableHighAccuracy: true });
    } else {
      console.log('Geolocation not supported');
    }
  }, []);

  useEffect(() => {
    if (latitude && longitude && latitude !== -1 && longitude !== -1) {
      setDistance(haversineDistance(latitude, longitude, GANGA_AARTI_LAT, GANGA_AARTI_LON));
      const userToken = localStorage.getItem('userToken');
      try {
        const targetUrl = getApiUrl('/updateLocation');
        const safeToken = (userToken && userToken !== 'null') ? userToken : null;
        const headers = safeToken ? { Authorization: `Bearer ${safeToken}` } : {};
        axios.post(targetUrl, { lat: latitude, lon: longitude }, { headers }).catch(() => { });
      } catch { /* ignore */ }
      setMapCenter({ lat: latitude, lon: longitude });
    }
  }, [latitude, longitude]);

  function success(position) {
    setLatitude(position.coords.latitude);
    setLongitude(position.coords.longitude);
  }

  function error() {
    setLatitude(-1);
    setLongitude(-1);
    console.log('Unable to retrieve location');
  }

  function haversineDistance(lat1, lon1, lat2, lon2) {
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  const handleLocateAarti = () => {
    setMapCenter({ lat: GANGA_AARTI_LAT, lon: GANGA_AARTI_LON });
  };

  const handleLocateMe = () => {
    if (latitude && longitude && latitude !== -1) {
      setMapCenter({ lat: latitude, lon: longitude });
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 text-slate-100 pb-20 pt-28 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Title Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono mb-2">
              <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Ganga Basin Geodesic Radar</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold font-headline tracking-tight text-white">
              Sacred Ghats & Navigation
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Track your geographic proximity to Dashashwamedh Ghat, Varanasi for the world-renowned evening Maha Aarti ceremonies.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLocateAarti}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 font-medium text-xs sm:text-sm transition-all hover:scale-105"
            >
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Varanasi Aarti Ghat</span>
            </button>
            <button
              onClick={handleLocateMe}
              disabled={!latitude || !longitude || latitude === -1}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-ganga-600 hover:bg-ganga-500 text-white font-medium text-xs sm:text-sm shadow-glow-cyan transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
            >
              <NavIcon className="w-4 h-4" />
              <span>My Location</span>
            </button>
          </div>
        </div>

        {/* Stats & Proximity Bento Cards */}
        <div className="grid sm:grid-cols-3 gap-6">
          {/* Card 1: Distance */}
          <div className="bento-card p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs uppercase font-mono">
              <span>Geodesic Distance</span>
              <Compass className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="my-4">
              {distance !== null ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold font-headline gradient-text-cyan">{distance}</span>
                  <span className="text-slate-400 font-mono text-sm">km to Aarti</span>
                </div>
              ) : (
                <Skeleton height={36} radius="sm" color="#1e293b" />
              )}
            </div>
            <span className="text-[11px] text-slate-400">Direct great-circle radius to Dashashwamedh</span>
          </div>

          {/* Card 2: User Coordinates */}
          <div className="bento-card p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs uppercase font-mono">
              <span>Your Coordinates</span>
              <MapPin className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="my-4 font-mono text-sm">
              {latitude && longitude && latitude !== -1 ? (
                <div className="space-y-1 text-slate-200">
                  <div>LAT: <span className="text-emerald-400 font-bold">{latitude.toFixed(4)}° N</span></div>
                  <div>LON: <span className="text-emerald-400 font-bold">{longitude.toFixed(4)}° E</span></div>
                </div>
              ) : (
                <Skeleton height={36} radius="sm" color="#1e293b" />
              )}
            </div>
            <span className="text-[11px] text-slate-400">Truncated to ~11m for user privacy</span>
          </div>

          {/* Card 3: Target Ghat Info */}
          <div className="bento-card p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs uppercase font-mono">
              <span>Destination Destination</span>
              <Globe2 className="w-4 h-4 text-amber-400" />
            </div>
            <div className="my-4">
              <div className="text-base font-bold text-white">Dashashwamedh Ghat</div>
              <div className="text-xs text-amber-300 font-mono mt-0.5">25.3062° N, 83.0107° E</div>
              <div className="text-xs text-slate-400 mt-1">Evening Aarti: 6:45 PM Daily</div>
            </div>
            <span className="text-[11px] text-slate-400">Oldest & most sacred waterfront in Kashi</span>
          </div>
        </div>

        {/* Interactive Map Viewport with dark styling */}
        <div className="bento-card overflow-hidden p-1 shadow-2xl border border-white/10">
          <div className="w-full h-[460px] rounded-[22px] overflow-hidden relative bg-surface-900">
            {mapCenter ? (
              <iframe
                title="Ganga Navigation Radar"
                width="100%"
                height="100%"
                style={{ border: 0, filter: 'invert(92%) hue-rotate(180deg) contrast(105%)' }}
                loading="lazy"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapCenter.lon - 0.02}%2C${mapCenter.lat - 0.02}%2C${mapCenter.lon + 0.02}%2C${mapCenter.lat + 0.02}&layer=mapnik&marker=${mapCenter.lat}%2C${mapCenter.lon}`}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
                <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-mono">Acquiring Geodesic Signal...</span>
              </div>
            )}
            {/* Map corner badge */}
            <div className="absolute bottom-4 left-4 z-10 px-3 py-1.5 rounded-xl bg-surface-950/90 backdrop-blur-md border border-white/10 text-xs font-mono text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>OSM Cartography Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
