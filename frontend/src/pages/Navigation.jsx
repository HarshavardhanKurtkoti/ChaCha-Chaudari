import axios from 'axios';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '@mantine/core';
import { useTranslation } from 'hooks/useTranslation';

export default function Navigation() {
    const { t } = useTranslation();
    const [latitude, setLatitude] = useState(null);
    const [longitude, setLongitude] = useState(null);
    const [distance, setDistance] = useState(null);
    const [mapCenter, setMapCenter] = useState(null); // {lat, lon}

    // Dashashwamedh Ghat (Ganga Aarti) coordinates
    const GANGA_AARTI_LAT = 25.3062;
    const GANGA_AARTI_LON = 83.0066;

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(success, error, { enableHighAccuracy: true });
        } else {
            console.log('Geolocation not supported');
        }
    }, []);

    useEffect(() => {
        if (latitude && longitude) {
            // Calculate distance to Ganga Aarti
            setDistance(haversineDistance(latitude, longitude, GANGA_AARTI_LAT, GANGA_AARTI_LON));
            const userToken = localStorage.getItem('userToken');
            try {
                const apiBase = import.meta?.env?.DEV ? '/api' : 'http://localhost:1212';
                const safeToken = (userToken && userToken !== 'null') ? userToken : null;
                const headers = safeToken ? { Authorization: `Bearer ${safeToken}` } : {};
                axios.post(`${apiBase}/updateLocation`, { lat: latitude, lon: longitude }, { headers }).catch(() => { });
            } catch (e) { /* ignore */ }
            // Default map center to user location
            setMapCenter({ lat: latitude, lon: longitude });
        }
    }, [latitude, longitude]);

    function success(position) {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lon);
    }

    function error() {
        setLatitude(-1);
        setLongitude(-1);
        console.log('Unable to retrieve your location');
    }

    // Haversine formula to calculate distance between two lat/lon points in km
    function haversineDistance(lat1, lon1, lat2, lon2) {
        function toRad(x) {
            return (x * Math.PI) / 180;
        }
        const R = 6371; // Radius of the Earth in km
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;
        return d.toFixed(2);
    }

    // Handler to center map on Ganga Aarti
    const handleLocateAarti = () => {
        setMapCenter({ lat: GANGA_AARTI_LAT, lon: GANGA_AARTI_LON });
    };

    // Handler to center map on user's location
    const handleLocateMe = () => {
        if (latitude && longitude) {
            setMapCenter({ lat: latitude, lon: longitude });
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white pb-10 pt-20">
            <div className="max-w-4xl mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.3 }}
                    transition={{ duration: 0.45 }}
                    className="rounded-2xl shadow-2xl bg-gray-800/50 backdrop-blur-md border border-gray-700 p-6"
                >
                    <h1 className="text-3xl font-bold text-blue-400 mb-6">{t('navigation.title')}</h1>
                    <div className="mb-6 text-gray-300 bg-gray-700/30 p-4 rounded-lg border border-gray-600">
                        {latitude && longitude ? (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <span className="font-semibold text-blue-300">{t('navigation.yourLocation')}:</span>
                                <span className="font-mono text-sm">
                                    {t('navigation.lat')}: {latitude.toFixed(4)}, {t('navigation.lon')}: {longitude.toFixed(4)}
                                </span>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-sm text-gray-400">{t('navigation.loading')}</p>
                                <Skeleton height={8} width="60%" radius="sm" color="#374151" />
                            </div>
                        )}
                    </div>
                    {/* Map Section */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: false, amount: 0.3 }}
                        transition={{ duration: 0.35 }}
                        className="mb-6 rounded-xl overflow-hidden shadow-lg border border-gray-600 ring-1 ring-white/10"
                    >
                        {mapCenter ? (
                            <iframe
                                title="Map"
                                width="100%"
                                height="400"
                                style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }} // Dark mode map hack
                                loading="lazy"
                                allowFullScreen
                                src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapCenter.lon - 0.01}%2C${mapCenter.lat - 0.01}%2C${mapCenter.lon + 0.01}%2C${mapCenter.lat + 0.01}&layer=mapnik&marker=${mapCenter.lat}%2C${mapCenter.lon}&marker=${GANGA_AARTI_LAT}%2C${GANGA_AARTI_LON}`}
                            ></iframe>
                        ) : (
                            <Skeleton height={400} radius="md" color="#1f2937" />
                        )}
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false, amount: 0.3 }}
                        transition={{ duration: 0.35 }}
                        className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-700/30 p-4 rounded-xl border border-gray-600"
                    >
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-300">{t('navigation.distance')}:</span>
                            {distance !== null ? (
                                <span className="text-2xl font-bold text-emerald-400">{`${distance} km`}</span>
                            ) : (
                                <Skeleton height={20} width={60} radius="sm" color="#374151" />
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-500 transition-all active:scale-95"
                                onClick={handleLocateAarti}
                            >
                                {t('navigation.locateAarti')}
                            </button>
                            <button
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg shadow-lg hover:bg-emerald-500 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handleLocateMe}
                                disabled={!latitude || !longitude}
                            >
                                {t('navigation.locateMe')}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
