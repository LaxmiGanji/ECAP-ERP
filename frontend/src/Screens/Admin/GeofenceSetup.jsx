import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { baseApiURL } from "../../baseUrl";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { FiMapPin, FiSave, FiSettings, FiCheckCircle } from "react-icons/fi";

const GeofenceSetup = () => {
  const [lat, setLat] = useState(17.2023); // Default Sphoorthy Engineering College Lat
  const [lng, setLng] = useState(78.5831); // Default Sphoorthy Engineering College Lng
  const [radius, setRadius] = useState(200); // meters
  const [name, setName] = useState("Sphoorthy Engineering College Campus");
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);
  const circleInstance = useRef(null);

  // Fetch existing Geofence config
  useEffect(() => {
    fetchGeofenceConfig();
  }, []);

  const fetchGeofenceConfig = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${baseApiURL()}/biometric-attendance/geofence`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success && response.data.geofence) {
        const { latitude, longitude, radius: rad, name: nm, enabled: en } = response.data.geofence;
        setLat(latitude);
        setLng(longitude);
        setRadius(rad);
        setName(nm);
        setEnabled(en);
      }
    } catch (error) {
      toast.error("Failed to load geofence configuration");
    }
  };

  // Load Leaflet dynamically
  useEffect(() => {
    const loadLeaflet = () => {
      if (window.L) {
        setMapLoaded(true);
        return;
      }

      // Add CSS
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
      link.crossOrigin = "";
      document.head.appendChild(link);

      // Add JS
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
      script.crossOrigin = "";
      script.onload = () => {
        setMapLoaded(true);
      };
      document.head.appendChild(script);
    };

    loadLeaflet();
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    const L = window.L;
    
    // Cleanup existing map if any
    if (mapInstance.current) {
      mapInstance.current.remove();
    }

    // Initialize Map instance
    const map = L.map(mapRef.current).setView([lat, lng], 16);
    mapInstance.current = map;

    // Tile Layer (CartoDB Positron is extremely modern and clean!)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 20
    }).addTo(map);

    // Draggable Marker
    const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
    markerInstance.current = marker;

    // Geofence Circle
    const circle = L.circle([lat, lng], {
      color: "#4f46e5", // Indigo-600
      fillColor: "#818cf8", // Indigo-400
      fillOpacity: 0.35,
      radius: radius,
    }).addTo(map);
    circleInstance.current = circle;

    // Update coordinates on drag end
    marker.on("dragend", () => {
      const position = marker.getLatLng();
      setLat(parseFloat(position.lat.toFixed(6)));
      setLng(parseFloat(position.lng.toFixed(6)));
      circle.setLatLng(position);
      map.panTo(position);
    });

    // Update coordinates on map click
    map.on("click", (e) => {
      const position = e.latlng;
      marker.setLatLng(position);
      circle.setLatLng(position);
      setLat(parseFloat(position.lat.toFixed(6)));
      setLng(parseFloat(position.lng.toFixed(6)));
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [mapLoaded]);

  // Reactive updates for circle radius
  useEffect(() => {
    if (circleInstance.current) {
      circleInstance.current.setRadius(radius);
    }
  }, [radius]);

  // Reactive updates for marker position if loaded from DB
  const updateMapPosition = (newLat, newLng) => {
    if (mapInstance.current && markerInstance.current && circleInstance.current) {
      const newPos = [newLat, newLng];
      markerInstance.current.setLatLng(newPos);
      circleInstance.current.setLatLng(newPos);
      mapInstance.current.setView(newPos, 16);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${baseApiURL()}/biometric-attendance/geofence`,
        {
          latitude: lat,
          longitude: lng,
          radius,
          name,
          enabled,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        toast.success("Geofence settings updated successfully!");
      } else {
        toast.error(response.data.message || "Failed to update settings");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to save geofence configuration");
    } finally {
      setLoading(false);
    }
  };

  const locateAdmin = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const roundedLat = parseFloat(latitude.toFixed(6));
          const roundedLng = parseFloat(longitude.toFixed(6));
          setLat(roundedLat);
          setLng(roundedLng);
          updateMapPosition(roundedLat, roundedLng);
          toast.success("Located your current position!");
        },
        (error) => {
          toast.error("Could not fetch location. Please drag the marker manually.");
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
    }
  };

  return (
    <div className="p-4 md:p-8 bg-[#f8fafc] min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center">
            <FiSettings className="mr-3 text-indigo-600 animate-spin-slow" /> Geofence Setup
          </h1>
          <p className="text-slate-500 mt-2">
            Configure the geographical boundary (coordinates and radius) for Sphoorthy Engineering College.
            Faculty daily attendance is restricted to this zone.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Geofence Form Settings */}
          <div className="lg:col-span-4 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 space-y-6"
            >
              <h2 className="text-lg font-bold text-slate-800 flex items-center border-b border-slate-100 pb-3">
                <FiMapPin className="text-indigo-600 mr-2" /> Boundary Settings
              </h2>

              {/* Campus Name */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Campus Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700 text-sm"
                  placeholder="e.g. Sphoorthy Campus"
                />
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={lat}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setLat(val);
                      updateMapPosition(val, lng);
                    }}
                    className="w-full mt-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold text-slate-700 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={lng}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setLng(val);
                      updateMapPosition(lat, val);
                    }}
                    className="w-full mt-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold text-slate-700 text-sm"
                  />
                </div>
              </div>

              {/* Radius Slider */}
              <div>
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fence Radius</label>
                  <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-black">
                    {radius} Meters
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="10"
                  value={radius}
                  onChange={(e) => setRadius(parseInt(e.target.value))}
                  className="w-full mt-4 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-2">
                  <span>50m</span>
                  <span>500m</span>
                  <span>1000m</span>
                </div>
              </div>

              {/* Toggle switch for enabled status */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <h4 className="text-sm font-bold text-slate-700">Geofencing Enforced</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Restrict check-ins to this boundary</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEnabled(!enabled)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-all duration-300 ${
                    enabled ? "bg-indigo-600 justify-end" : "bg-slate-300 justify-start"
                  }`}
                >
                  <motion.div layout className="bg-white w-4.5 h-4.5 rounded-full shadow-sm" />
                </button>
              </div>

              {/* Actions */}
              <div className="pt-2 space-y-3">
                <button
                  type="button"
                  onClick={locateAdmin}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-4 rounded-2xl transition-all text-sm flex items-center justify-center space-x-2"
                >
                  <FiMapPin /> <span>Locate My Current Spot</span>
                </button>
                
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-2xl transition-all text-sm flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <FiSave /> <span>Save Coordinates Configuration</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>

          {/* Leaflet Map display */}
          <div className="lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl p-4 shadow-md border border-slate-100 h-[600px] flex flex-col"
            >
              <div className="mb-3 px-2 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 flex items-center">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                  Interactive Map Mode
                </span>
                <span className="text-[11px] text-slate-400 font-medium italic">
                  Drag the blue marker or click anywhere on the map to define the campus center
                </span>
              </div>
              
              <div 
                ref={mapRef} 
                className="flex-1 w-full rounded-2xl overflow-hidden border border-slate-100 z-10"
                style={{ minHeight: "450px" }}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeofenceSetup;
