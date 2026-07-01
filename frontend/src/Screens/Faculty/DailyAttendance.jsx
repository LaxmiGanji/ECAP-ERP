import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { baseApiURL } from "../../baseUrl";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  FiMapPin,
  FiCamera,
  FiUserCheck,
  FiClock,
  FiAlertTriangle,
  FiCheckCircle,
  FiLogOut,
  FiCalendar,
  FiActivity,
  FiArrowRight,
  FiImage,
  FiX
} from "react-icons/fi";

const DailyAttendance = () => {
  const [geofence, setGeofence] = useState(null);
  const [distance, setDistance] = useState(null);
  const [userCoords, setUserCoords] = useState(null);
  const [isInside, setIsInside] = useState(false);
  const [locationStatus, setLocationStatus] = useState("Checking location...");
  const [locationError, setLocationError] = useState(null);

  // Biometric details
  const [isRegistered, setIsRegistered] = useState(false);
  const [checkingBiometric, setCheckingBiometric] = useState(true);
  const [refPhotoUrl, setRefPhotoUrl] = useState("");
  const [registerMethod, setRegisterMethod] = useState("camera"); // 'camera' or 'upload'
  const [uploadedImageSrc, setUploadedImageSrc] = useState(null);

  const toggleRegisterMethod = (method) => {
    setRegisterMethod(method);
    setUploadedImageSrc(null);
    setHasFace(false);
    latestDescriptor.current = null;
    stopCamera();
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      setUploadedImageSrc(event.target.result);
      detectFaceOnUploadedImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const detectFaceOnUploadedImage = async (base64Data) => {
    if (!window.faceapi || !modelsLoaded) {
      toast.error("Facial recognition engine not fully loaded yet.");
      return;
    }

    const toastId = toast.loading("Analyzing photo for biometric markers...");

    try {
      const faceapi = window.faceapi;
      const img = new Image();
      img.src = base64Data;
      img.onload = async () => {
        const detection = await faceapi
          .detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.30 }))
          .withFaceLandmarks()
          .withFaceDescriptor();

        toast.dismiss(toastId);

        if (detection) {
          setHasFace(true);
          latestDescriptor.current = Array.from(detection.descriptor);
          toast.success("Facial signature verified and locked!");
        } else {
          setHasFace(false);
          latestDescriptor.current = null;
          setUploadedImageSrc(null);
          toast.error("No face detected in the image. Please upload a clear photo showing your face.");
        }
      };
    } catch (error) {
      toast.dismiss(toastId);
      console.error("Face upload analysis error:", error);
      toast.error("Failed to process photo biometric markers.");
    }
  };

  // Face API & Camera details
  const [faceApiReady, setFaceApiReady] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [hasFace, setHasFace] = useState(false);

  // Mark status
  const [myLogs, setMyLogs] = useState([]);
  const [todayLog, setTodayLog] = useState(null);
  const [markingType, setMarkingType] = useState("checkin"); // 'checkin' or 'checkout'
  const [markingLoading, setMarkingLoading] = useState(false);

  // Map settings
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  // Refs for media
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectionInterval = useRef(null);
  const latestDescriptor = useRef(null);
  const mediaStreamRef = useRef(null);

  // 1. Fetch Geofence and Biometric status
  useEffect(() => {
    fetchGeofenceAndBiometrics();
    fetchMyLogs();
    getCurrentLocation();

    // Clean up camera and detection interval on unmount
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchGeofenceAndBiometrics = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Get geofence
      const fenceRes = await axios.get(`${baseApiURL()}/biometric-attendance/geofence`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (fenceRes.data.success) {
        setGeofence(fenceRes.data.geofence);
      }

      // Get biometric status
      const bioRes = await axios.get(`${baseApiURL()}/biometric-attendance/biometric-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (bioRes.data.success) {
        setIsRegistered(bioRes.data.registered);
        setRefPhotoUrl(bioRes.data.referencePhotoUrl || "");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load attendance configurations");
    } finally {
      setCheckingBiometric(false);
    }
  };

  const fetchMyLogs = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${baseApiURL()}/biometric-attendance/my-logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setMyLogs(res.data.logs);

        // Check if checked-in today
        const todayStr = getTodayDateString();
        const todayRecord = res.data.logs.find((l) => l.date === todayStr);
        if (todayRecord) {
          setTodayLog(todayRecord);
          // If checked in but not checked out, next step is checkout
          if (todayRecord.status === "Checked-In") {
            setMarkingType("checkout");
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // 2. Fetch user location
  const getCurrentLocation = () => {
    setLocationStatus("Detecting location...");
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationStatus("Geolocation not supported");
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ latitude, longitude });
        setLocationStatus("Location verified");
      },
      (error) => {
        console.error("GPS error:", error);
        let msg = "Could not fetch GPS location. Make sure GPS/Location permission is enabled.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Location permission denied. Please allow location access in your browser settings.";
        }
        setLocationStatus("Location error");
        setLocationError(msg);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // 3. Geofence Distance Calculation
  useEffect(() => {
    if (!userCoords || !geofence) return;

    const lat1 = userCoords.latitude;
    const lon1 = userCoords.longitude;
    const lat2 = geofence.latitude;
    const lon2 = geofence.longitude;

    // Haversine formula
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;

    setDistance(dist);

    // Geofencing is strictly enforced for all daily biometric attendance
    setIsInside(dist <= geofence.radius);
  }, [userCoords, geofence]);

  // Load Leaflet and display user vs geofence on Map
  useEffect(() => {
    if (!userCoords || !geofence) return;

    // Load leaflet script
    const loadLeafletMap = () => {
      if (window.L) {
        setMapLoaded(true);
        return;
      }

      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    };

    loadLeafletMap();
  }, [userCoords, geofence]);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !userCoords || !geofence) return;

    const L = window.L;

    // Clear previous map
    if (mapInstance.current) {
      mapInstance.current.remove();
    }

    const map = L.map(mapRef.current).setView([geofence.latitude, geofence.longitude], 16);
    mapInstance.current = map;

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    }).addTo(map);

    // Geofence Circle
    L.circle([geofence.latitude, geofence.longitude], {
      color: "#4f46e5",
      fillColor: "#818cf8",
      fillOpacity: 0.25,
      radius: geofence.radius,
    }).addTo(map);

    // College Marker
    L.marker([geofence.latitude, geofence.longitude], {
      title: "College Center",
    }).addTo(map);

    // Faculty User Marker
    const userIcon = L.divIcon({
      className: "custom-div-icon",
      html: `<div style='background-color: ${isInside ? "#10b981" : "#ef4444"}; width: 14px; height: 14px; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.3);'></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    L.marker([userCoords.latitude, userCoords.longitude], {
      icon: userIcon,
      title: "Your Location",
    }).addTo(map);

    // Fit bounds to show both college and user
    const bounds = L.latLngBounds([
      [geofence.latitude, geofence.longitude],
      [userCoords.latitude, userCoords.longitude]
    ]);
    map.fitBounds(bounds.pad(0.2));

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [mapLoaded, userCoords, geofence, isInside]);

  // 4. Load face-api.js dynamically
  useEffect(() => {
    // Load models if user is not registered (to allow registration from anywhere) OR if user is inside geofence
    if (isRegistered && !isInside) return;

    const loadFaceApi = () => {
      if (window.faceapi) {
        setFaceApiReady(true);
        loadModels();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.js";
      script.onload = () => {
        setFaceApiReady(true);
        loadModels();
      };
      document.head.appendChild(script);
    };

    loadFaceApi();
  }, [isInside]);

  const loadModels = async () => {
    try {
      const faceapi = window.faceapi;
      console.log("Loading face-api.js models from public directory...");
      await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
      setModelsLoaded(true);
      console.log("Face API models loaded successfully");
    } catch (error) {
      console.error("Error loading face models:", error);
      toast.error("Failed to load facial recognition models.");
    }
  };

  // 5. Camera actions
  const startCamera = async () => {
    try {
      setCameraActive(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Start detecting faces
      startFaceDetection();
    } catch (error) {
      console.error("Webcam access error:", error);
      toast.error("Could not access camera. Please allow camera permissions.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (detectionInterval.current) {
      clearInterval(detectionInterval.current);
      detectionInterval.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
    setHasFace(false);
    latestDescriptor.current = null;
  };

  // 6. Face Detection Loop (Optimized to detect basic face presence only)
  const startFaceDetection = () => {
    if (detectionInterval.current) clearInterval(detectionInterval.current);

    detectionInterval.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || !window.faceapi || !modelsLoaded) return;

      const faceapi = window.faceapi;
      const video = videoRef.current;
      if (video.readyState < 2) return;
      const canvas = canvasRef.current;

      // Sync canvas dimensions
      if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const displaySize = { width: video.videoWidth, height: video.videoHeight };
      
      // Fast single face detection without landmarks or descriptors
      const detection = await faceapi.detectSingleFace(
        video,
        new faceapi.SsdMobilenetv1Options({ minConfidence: 0.22 })
      );

      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (detection) {
        setHasFace(true);

        // Draw futuristic UI target box over face
        const resized = faceapi.resizeResults(detection, displaySize);
        const box = resized.box;
        
        ctx.strokeStyle = "#818cf8"; // Indigo line color
        ctx.lineWidth = 3.5;
        // Corner borders
        const len = 15;
        // Top-left
        ctx.beginPath(); ctx.moveTo(box.x, box.y + len); ctx.lineTo(box.x, box.y); ctx.lineTo(box.x + len, box.y); ctx.stroke();
        // Top-right
        ctx.beginPath(); ctx.moveTo(box.x + box.width - len, box.y); ctx.lineTo(box.x + box.width, box.y); ctx.lineTo(box.x + box.width, box.y + len); ctx.stroke();
        // Bottom-left
        ctx.beginPath(); ctx.moveTo(box.x, box.y + box.height - len); ctx.lineTo(box.x, box.y + box.height); ctx.lineTo(box.x + len, box.y + box.height); ctx.stroke();
        // Bottom-right
        ctx.beginPath(); ctx.moveTo(box.x + box.width - len, box.y + box.height); ctx.lineTo(box.x + box.width, box.y + box.height); ctx.lineTo(box.x + box.width, box.y + box.height - len); ctx.stroke();
      } else {
        setHasFace(false);
      }
    }, 450); // Lighter interval for smooth camera rendering
  };

  // Capture current webcam snapshot as Base64 Image
  const getCapturedSnapshot = () => {
    if (!videoRef.current) return null;
    const video = videoRef.current;
    
    // Create temporary canvas to grab frame
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const ctx = tempCanvas.getContext("2d");
    
    // Mirror image for consistency
    ctx.translate(tempCanvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
    
    return tempCanvas.toDataURL("image/jpeg", 0.9);
  };

  // 7. Register face biometric template (Optimized: extracts descriptor on-demand)
  const handleRegisterBiometric = async () => {
    let descriptor = null;
    let imageBase64 = null;

    if (registerMethod === "camera") {
      if (!cameraActive) {
        toast.error("Camera is not active.");
        return;
      }
      
      const toastId = toast.loading("Capturing and analyzing facial biometric signature...");
      setMarkingLoading(true);
      try {
        const faceapi = window.faceapi;
        let detection = null;
        let retries = 5;

        while (retries > 0 && !detection) {
          detection = await faceapi
            .detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.22 }))
            .withFaceLandmarks()
            .withFaceDescriptor();
          if (!detection) {
            retries--;
            if (retries > 0) {
              await new Promise((resolve) => setTimeout(resolve, 150));
            }
          }
        }

        toast.dismiss(toastId);

        if (!detection) {
          toast.error("No face detected in the webcam frame. Please look directly at the camera and try again.");
          setMarkingLoading(false);
          return;
        }

        descriptor = Array.from(detection.descriptor);
        imageBase64 = getCapturedSnapshot();
      } catch (error) {
        toast.dismiss(toastId);
        console.error("Camera face analysis error:", error);
        toast.error("Failed to analyze webcam biometric template.");
        setMarkingLoading(false);
        return;
      }
    } else {
      // If using upload method, face was already validated
      if (!latestDescriptor.current || !uploadedImageSrc) {
        toast.error("Please upload an image and wait for face validation.");
        return;
      }
      descriptor = latestDescriptor.current;
      imageBase64 = uploadedImageSrc;
      setMarkingLoading(true);
    }

    if (!imageBase64 || !descriptor) {
      setMarkingLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${baseApiURL()}/biometric-attendance/register-biometric`,
        {
          imageBase64,
          faceDescriptor: descriptor,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        toast.success("Facial biometrics registered successfully!");
        setIsRegistered(true);
        setRefPhotoUrl(res.data.referencePhotoUrl);
        stopCamera();
        fetchGeofenceAndBiometrics(); // refresh status
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Biometric registration failed");
    } finally {
      setMarkingLoading(false);
    }
  };

  // 8. Submit attendance check-in/check-out (Optimized: extracts descriptor on-demand)
  const handleMarkAttendance = async () => {
    if (!isInside) {
      toast.error("Cannot mark attendance. You are outside the geofence boundary.");
      return;
    }

    if (!cameraActive) {
      toast.error("Camera is not active.");
      return;
    }

    const toastId = toast.loading("Verifying your facial biometric signature...");
    setMarkingLoading(true);

    let descriptor = null;
    let imageBase64 = null;

    try {
      const faceapi = window.faceapi;
      let detection = null;
      let retries = 5;

      while (retries > 0 && !detection) {
        detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.22 }))
          .withFaceLandmarks()
          .withFaceDescriptor();
        if (!detection) {
          retries--;
          if (retries > 0) {
            await new Promise((resolve) => setTimeout(resolve, 150));
          }
        }
      }

      toast.dismiss(toastId);

      if (!detection) {
        toast.error("No face detected in the webcam frame. Please look directly at the camera and try again.");
        setMarkingLoading(false);
        return;
      }

      descriptor = Array.from(detection.descriptor);
      imageBase64 = getCapturedSnapshot();
    } catch (error) {
      toast.dismiss(toastId);
      console.error("Camera face verification error:", error);
      toast.error("Failed to verify facial biometric signature.");
      setMarkingLoading(false);
      return;
    }

    if (!imageBase64 || !descriptor) {
      setMarkingLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      const now = new Date();
      // Date in YYYY-MM-DD local format
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const dayVal = String(now.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${dayVal}`;

      // Time in HH:MM:SS format
      const hours = String(now.getHours()).padStart(2, "0");
      const mins = String(now.getMinutes()).padStart(2, "0");
      const secs = String(now.getSeconds()).padStart(2, "0");
      const timeStr = `${hours}:${mins}:${secs}`;

      // Day of week
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dayStr = dayNames[now.getDay()];

      const res = await axios.post(
        `${baseApiURL()}/biometric-attendance/mark-attendance`,
        {
          imageBase64,
          faceDescriptor: descriptor,
          latitude: userCoords.latitude,
          longitude: userCoords.longitude,
          date: dateStr,
          time: timeStr,
          day: dayStr,
          type: markingType,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        toast.success(res.data.message);
        stopCamera();
        fetchMyLogs(); // Refresh logs and daily state
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Verification and marking failed");
    } finally {
      setMarkingLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-[#f8fafc] min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center">
            <FiClock className="mr-3 text-indigo-600" /> Daily Attendance portal
          </h1>
          <p className="text-slate-500 mt-2">
            Submit your daily check-in and check-out logs securely. Verification is completed using geofencing
            and facial biometric verification.
          </p>
        </div>

        {/* Dashboard Status Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Geofence Check and Camera Actions */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. Location verification card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200"
            >
              <h2 className="text-lg font-bold text-slate-800 flex items-center border-b border-slate-100 pb-3">
                <FiMapPin className="text-indigo-600 mr-2" /> 1. Geofence Verification
              </h2>

              <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                {locationError ? (
                  <div className="flex items-start space-x-3 text-rose-600">
                    <FiAlertTriangle className="text-2xl mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm">GPS Error</h4>
                      <p className="text-xs text-rose-500 mt-0.5">{locationError}</p>
                    </div>
                  </div>
                ) : !userCoords ? (
                  <div className="flex items-center space-x-3 text-slate-400">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500"></div>
                    <span className="text-sm font-semibold">{locationStatus}</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${isInside ? "bg-emerald-500" : "bg-rose-500"}`}
                      ></span>
                      <span className="text-sm font-bold text-slate-700">
                        {isInside ? "Within College Geofence Zone" : "Outside College Geofence Zone"}
                      </span>
                    </div>
                    {distance !== null && (
                      <p className="text-xs text-slate-400 font-semibold">
                        Distance from Campus center:{" "}
                        <span className="text-slate-700 font-black">{Math.round(distance)} meters</span>
                        {geofence && ` (Allowed radius: ${geofence.radius}m)`}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={getCurrentLocation}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center space-x-1"
                  >
                    <FiActivity /> <span>Retry GPS Check</span>
                  </button>
                </div>
              </div>

              {/* Render Leaflet map inline */}
              {userCoords && geofence && (
                <div className="mt-4 h-48 rounded-2xl overflow-hidden border border-slate-100 z-10" ref={mapRef} />
              )}
            </motion.div>

            {/* 2. Biometric scanner */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200"
            >
              <h2 className="text-lg font-bold text-slate-800 flex items-center border-b border-slate-100 pb-3">
                <FiCamera className="text-indigo-600 mr-2" /> 2. Biometric Facial Verification
              </h2>

              {checkingBiometric ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
                </div>
              ) : (isRegistered && !isInside) ? (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 p-5 rounded-2xl flex items-start space-x-3 mt-4">
                  <FiAlertTriangle className="text-xl mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm">Access Blocked</h4>
                    <p className="text-xs mt-0.5 text-rose-600 leading-relaxed">
                      You are outside the geofence boundaries. You must be present on the campus to verify biometric markers and submit your daily attendance.
                    </p>
                  </div>
                </div>
              ) : !faceApiReady || !modelsLoaded ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
                  <p className="text-slate-400 text-xs font-semibold">Initializing face scanner libraries...</p>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  {/* Tab Selector if not registered */}
                  {!isRegistered && (
                    <div className="flex border-b border-slate-200 pb-2 mb-4 text-xs font-bold text-slate-400 gap-6">
                      <button
                        type="button"
                        onClick={() => toggleRegisterMethod("camera")}
                        className={`pb-2 transition-all cursor-pointer ${
                          registerMethod === "camera"
                            ? "text-indigo-600 border-b-2 border-indigo-600"
                            : "border-b-2 border-transparent hover:text-slate-600"
                        }`}
                      >
                        Webcam Capture
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleRegisterMethod("upload")}
                        className={`pb-2 transition-all cursor-pointer ${
                          registerMethod === "upload"
                            ? "text-indigo-600 border-b-2 border-indigo-600"
                            : "border-b-2 border-transparent hover:text-slate-600"
                        }`}
                      >
                        Upload Photo File
                      </button>
                    </div>
                  )}

                  {/* Render camera interface if method is camera, OR check-in/out (which always uses camera) */}
                  {(isRegistered || registerMethod === "camera") ? (
                    cameraActive ? (
                      <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video w-full flex items-center justify-center border border-slate-800 shadow-inner">
                        {/* Video Stream */}
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover transform -scale-x-100"
                        />
                        
                        {/* Dynamic Bounding Box overlay canvas */}
                        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

                        {/* Align visual overlay guide */}
                        <div className="absolute inset-0 flex items-center justify-center border-4 border-transparent pointer-events-none">
                          <div className="w-56 h-56 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center bg-black/5">
                            {!hasFace && (
                              <span className="text-[10px] text-white/70 font-bold bg-black/60 px-3 py-1 rounded-full animate-pulse">
                                Align Face Here
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Face locked tag */}
                        {hasFace && (
                          <div className="absolute top-4 left-4 bg-emerald-500 text-white text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider shadow-md">
                            Face Target Locked
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 aspect-video w-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                        <div className="bg-white p-4 rounded-3xl shadow-sm mb-4">
                          <FiCamera size={32} className="text-indigo-500" />
                        </div>
                        <h4 className="text-slate-700 font-bold mb-1">Camera Inactive</h4>
                        <p className="text-xs max-w-xs mb-6">
                          Activate your front camera to {isRegistered ? "mark daily check-in/out verification" : "register your face profile"}.
                        </p>
                        
                        <button
                          type="button"
                          onClick={startCamera}
                          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all text-xs flex items-center space-x-2 shadow-lg shadow-indigo-600/10"
                        >
                          <FiCamera /> <span>Turn On Camera</span>
                        </button>
                      </div>
                    )
                  ) : (
                    /* Registration via Upload File */
                    <div className="space-y-4">
                      {uploadedImageSrc ? (
                        <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-video w-full flex items-center justify-center border border-slate-200 shadow-inner">
                          <img src={uploadedImageSrc} alt="Face Upload Preview" className="w-full h-full object-contain" />
                          <button
                            type="button"
                            onClick={() => {
                              setUploadedImageSrc(null);
                              setHasFace(false);
                              latestDescriptor.current = null;
                            }}
                            className="absolute top-4 right-4 bg-black/60 text-white rounded-full p-2 hover:bg-black/80 transition-all cursor-pointer border border-white/10"
                          >
                            <FiX size={16} />
                          </button>
                          {hasFace && (
                            <div className="absolute top-4 left-4 bg-emerald-500 text-white text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider shadow-md">
                              Face Locked & Verified
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 flex flex-col items-center justify-center text-slate-400 text-center">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            id="face-upload"
                            className="hidden"
                          />
                          <label htmlFor="face-upload" className="cursor-pointer flex flex-col items-center w-full h-full">
                            <div className="bg-white p-5 rounded-3xl shadow-sm mb-4 border border-slate-100 hover:scale-105 transition-transform">
                              <FiImage size={36} className="text-indigo-600" />
                            </div>
                            <h4 className="text-slate-700 font-bold mb-1">Choose Photo File</h4>
                            <p className="text-xs max-w-xs mb-2">
                              Select a clear passport-style facial photo from your device.
                            </p>
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider border border-slate-200">
                              Browse Files
                            </span>
                          </label>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Controls Row */}
                  {((registerMethod === "camera" && cameraActive) || (registerMethod === "upload" && uploadedImageSrc) || (isRegistered && cameraActive)) && (
                    <div className="flex space-x-3">
                      {isRegistered || registerMethod === "camera" ? (
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-all"
                        >
                          Cancel Scanning
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setUploadedImageSrc(null);
                            setHasFace(false);
                            latestDescriptor.current = null;
                          }}
                          className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-all"
                        >
                          Clear File
                        </button>
                      )}

                      {!isRegistered ? (
                        <button
                          type="button"
                          onClick={handleRegisterBiometric}
                          disabled={markingLoading}
                          className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/10"
                        >
                          {markingLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <FiUserCheck /> <span>Register Face Baseline</span>
                            </>
                          )}
                        </button>
                      ) : (
                        /* Only Camera is allowed for check-in / check-out */
                        cameraActive && (
                          <button
                            type="button"
                            onClick={handleMarkAttendance}
                            disabled={markingLoading}
                            className={`flex-[2] py-3 text-white text-xs font-bold rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center space-x-2 shadow-lg ${
                              markingType === "checkin"
                                ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/10"
                                : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10"
                            }`}
                          >
                            {markingLoading ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                            ) : markingType === "checkin" ? (
                              <>
                                <FiUserCheck /> <span>Verify & Mark Check-In</span>
                              </>
                            ) : (
                              <>
                                <FiLogOut /> <span>Verify & Mark Check-Out</span>
                              </>
                            )}
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}
            </motion.div>

          </div>

          {/* Registration status and log timeline */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Daily Status and Bio profile */}
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200"
            >
              <h2 className="text-lg font-bold text-slate-800 flex items-center border-b border-slate-100 pb-3">
                <FiActivity className="text-indigo-600 mr-2" /> Registration & Today's Status
              </h2>

              <div className="mt-4 space-y-4">
                {/* Biometric Status badge */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Biometric Database</h4>
                    <p className="text-sm font-bold text-slate-700 mt-1">
                      {isRegistered ? "Registered Profile Verified" : "Awaiting Face Registration"}
                    </p>
                  </div>
                  {isRegistered && refPhotoUrl && refPhotoUrl !== "uploading" ? (
                    <img
                      src={refPhotoUrl}
                      alt="Face Baseline"
                      className="w-10 h-10 rounded-xl object-cover border border-indigo-200 shadow-sm"
                    />
                  ) : isRegistered && refPhotoUrl === "uploading" ? (
                    <div className="w-10 h-10 rounded-xl bg-slate-150 flex items-center justify-center border border-slate-200">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 border-t-transparent"></div>
                    </div>
                  ) : (
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black ${
                        isRegistered ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600 animate-pulse"
                      }`}
                    >
                      {isRegistered ? "Active" : "Pending"}
                    </span>
                  )}
                </div>

                {/* Today Attendance state */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-150 pb-2">
                    Today's Attendance Status
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Check-In</p>
                      {todayLog && todayLog.checkInTime ? (
                        <p className="text-sm font-black text-slate-800 flex items-center mt-1">
                          <FiClock className="text-indigo-500 mr-1" /> {todayLog.checkInTime}
                        </p>
                      ) : (
                        <p className="text-xs font-bold text-slate-400 italic mt-1">--:--:--</p>
                      )}
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Check-Out</p>
                      {todayLog && todayLog.checkOutTime ? (
                        <p className="text-sm font-black text-slate-800 flex items-center mt-1">
                          <FiLogOut className="text-emerald-500 mr-1" /> {todayLog.checkOutTime}
                        </p>
                      ) : todayLog && todayLog.checkInTime ? (
                        <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full inline-block mt-1 animate-pulse">
                          Pending
                        </span>
                      ) : (
                        <p className="text-xs font-bold text-slate-400 italic mt-1">--:--:--</p>
                      )}
                    </div>
                  </div>

                  {/* Mode switcher manually if both are available */}
                  {isRegistered && todayLog && todayLog.checkInTime && !todayLog.checkOutTime && (
                    <div className="pt-2 border-t border-slate-150 flex items-center justify-between text-xs font-bold text-slate-400">
                      <span>Ready to check-out for the day</span>
                      <FiArrowRight />
                    </div>
                  )}
                  {isRegistered && todayLog && todayLog.checkInTime && todayLog.checkOutTime && (
                    <div className="pt-2 border-t border-slate-150 text-xs font-bold text-emerald-600 flex items-center justify-center space-x-1">
                      <FiCheckCircle /> <span>Attendance Completed for today!</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Attendance Log History */}
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200"
            >
              <h2 className="text-lg font-bold text-slate-800 flex items-center border-b border-slate-100 pb-3">
                <FiCalendar className="text-indigo-600 mr-2" /> Recent Verification Logs
              </h2>

              <div className="mt-4 space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {myLogs.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs italic">
                    No recent check-ins found.
                  </div>
                ) : (
                  myLogs.map((log) => (
                    <div
                      key={log._id}
                      className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 flex justify-between items-center transition-colors"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-700">
                          {log.date} ({log.day})
                        </p>
                        <div className="flex items-center space-x-3 text-[10px] text-slate-400 font-semibold mt-1">
                          <span className="flex items-center">
                            <FiClock className="mr-0.5" /> In: {log.checkInTime || "--:--"}
                          </span>
                          {log.checkOutTime && (
                            <span className="flex items-center text-emerald-600">
                              <FiLogOut className="mr-0.5" /> Out: {log.checkOutTime}
                            </span>
                          )}
                        </div>
                      </div>

                      <span
                        className={`text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-wider ${
                          log.status === "Completed"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-indigo-50 text-indigo-600"
                        }`}
                      >
                        {log.status === "Completed" ? "Completed" : "In Office"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default DailyAttendance;
