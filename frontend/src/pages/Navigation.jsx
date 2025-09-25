

import axios from 'axios';
import { NavBar } from 'components';
import React, { useEffect, useState } from 'react';

// Import leaflet styles (make sure leaflet is installed in your project)




export default function Navigation() {
    const [latitude, setLatitude] = useState(null);
    const [longitude, setLongitude] = useState(null);
    const [response, setResponse] = useState({});
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
            // eslint-disable-next-line
        }, []);

        useEffect(() => {
            if (latitude && longitude) {
                // Calculate distance to Ganga Aarti
                setDistance(haversineDistance(latitude, longitude, GANGA_AARTI_LAT, GANGA_AARTI_LON));
                const userToken = localStorage.getItem('userToken');
                axios
                    .post('http://localhost:1212/updateLocation', {
                        lat: latitude,
                        lon: longitude,
                    }, {
                        headers: {
                            'Authorization': userToken || ''
                        }
                    })
                    .then((res) => {
                        setResponse(res.data);
                    });
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
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-yellow-100 pb-10">
                <NavBar />
                <div className="max-w-3xl mx-auto px-4 mt-8">
                    <div className="rounded-2xl shadow-lg bg-white/90 p-6">
                        <h1 className="text-2xl font-bold text-blue-700 mb-4">Navigation & Location</h1>
                        <div className="mb-4 text-gray-700">
                            {latitude && longitude ? (
                                <>
                                    <span className="font-semibold">Your Location:</span> <span>Latitude: {latitude}, Longitude: {longitude}</span>
                                </>
                            ) : (
                                <span>Fetching your location...</span>
                            )}
                        </div>
                        {/* Map Section */}
                                    <div className="mb-4 rounded-lg overflow-hidden shadow border border-blue-100">
                                        {mapCenter && (
                                            <iframe
                                                title="Map"
                                                width="100%"
                                                height="350"
                                                style={{ border: 0 }}
                                                loading="lazy"
                                                allowFullScreen
                                                src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapCenter.lon-0.01}%2C${mapCenter.lat-0.01}%2C${mapCenter.lon+0.01}%2C${mapCenter.lat+0.01}&layer=mapnik&marker=${mapCenter.lat}%2C${mapCenter.lon}&marker=${GANGA_AARTI_LAT}%2C${GANGA_AARTI_LON}`}
                                            ></iframe>
                                        )}
                                    </div>
                                                <div className="mb-2 flex items-center gap-4">
                                                    <span className="font-semibold">Distance from Ganga Aarti:</span>
                                                    <span className="ml-2 text-blue-700 font-bold">
                                                        {distance !== null ? `${distance} km` : 'Not available'}
                                                    </span>
                                                    <button
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors"
                                                        onClick={handleLocateAarti}
                                                    >
                                                        Locate Ganga Aarti
                                                    </button>
                                                    <button
                                                        className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors"
                                                        onClick={handleLocateMe}
                                                        disabled={!latitude || !longitude}
                                                    >
                                                        Locate Me
                                                    </button>
                                                </div>
                    </div>
                </div>
            </div>
        );
    }
