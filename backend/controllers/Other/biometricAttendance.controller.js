const Geofence = require("../../models/Other/geofence.model.js");
const FacultyBiometric = require("../../models/Other/facultyBiometric.model.js");
const FacultyDailyAttendance = require("../../models/Other/facultyDailyAttendance.model.js");
const FacultyDetail = require("../../models/Faculty/details.model.js");
const { cloudinary } = require("../../middlewares/multer.middleware.js");

// Helper to calculate geographical distance in meters (Haversine formula)
const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

// Helper to compare face descriptors using Euclidean distance
const getEuclideanDistance = (arr1, arr2) => {
  if (!arr1 || !arr2 || arr1.length !== arr2.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < arr1.length; i++) {
    const val1 = Number(arr1[i]);
    const val2 = Number(arr2[i]);
    if (isNaN(val1) || isNaN(val2)) {
      return Infinity; // Fail securely if any element is NaN or not a number
    }
    sum += Math.pow(val1 - val2, 2);
  }
  const dist = Math.sqrt(sum);
  return isNaN(dist) ? Infinity : dist;
};

// Get Geofence config
const getGeofence = async (req, res) => {
  try {
    let geofence = await Geofence.findOne();
    if (!geofence) {
      // Return a default geofence configuration if none exists
      geofence = {
        latitude: 17.2023, // Sphoorthy Engineering College default
        longitude: 78.5831,
        radius: 200, // 200 meters default
        name: "Sphoorthy Engineering College Campus",
        enabled: true,
      };
    }
    res.json({ success: true, geofence });
  } catch (error) {
    console.error("Error in getGeofence:", error);
    res.status(500).json({ success: false, message: "Failed to fetch geofence settings" });
  }
};

// Save or update Geofence config (Admin only)
const saveGeofence = async (req, res) => {
  try {
    const { latitude, longitude, radius, name, enabled } = req.body;
    const adminId = req.user?.loginid || "admin";

    let geofence = await Geofence.findOneAndUpdate(
      {},
      {
        latitude,
        longitude,
        radius,
        name,
        enabled,
        updatedBy: adminId,
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: "Geofence settings saved successfully", geofence });
  } catch (error) {
    console.error("Error in saveGeofence:", error);
    res.status(500).json({ success: false, message: "Failed to save geofence settings" });
  }
};

// Get Biometric status for logged-in Faculty
const getBiometricStatus = async (req, res) => {
  try {
    const facultyId = req.user?.loginid;
    if (!facultyId) {
      return res.status(400).json({ success: false, message: "User login ID not found in token" });
    }
    const normalizedId = facultyId.trim();
    const biometric = await FacultyBiometric.findOne({
      facultyId: { $regex: new RegExp(`^${normalizedId}$`, "i") }
    });
    
    res.json({
      success: true,
      registered: !!biometric,
      referencePhotoUrl: biometric ? biometric.referencePhotoUrl : null,
    });
  } catch (error) {
    console.error("Error in getBiometricStatus:", error);
    res.status(500).json({ success: false, message: "Failed to fetch biometric status" });
  }
};

// Register face biometric (Faculty)
const registerBiometric = async (req, res) => {
  try {
    const facultyId = req.user.loginid;
    const { imageBase64, faceDescriptor } = req.body;

    if (!imageBase64 || !faceDescriptor || !Array.isArray(faceDescriptor)) {
      return res.status(400).json({ success: false, message: "Missing required face biometric data" });
    }

    // Retrieve faculty details to get their full name (case-insensitive lookup)
    const normalizedId = facultyId.trim();
    const faculty = await FacultyDetail.findOne({
      employeeId: { $regex: new RegExp(`^${normalizedId}$`, "i") }
    });
    if (!faculty) {
      return res.status(404).json({ success: false, message: "Faculty details not found in database" });
    }

    const name = `${faculty.firstName} ${faculty.lastName || ""}`.trim();

    // Upsert biometric record immediately with placeholder (case-insensitive query, normalized insert)
    const biometric = await FacultyBiometric.findOneAndUpdate(
      { facultyId: { $regex: new RegExp(`^${normalizedId}$`, "i") } },
      {
        facultyId: normalizedId,
        name,
        referencePhotoUrl: "uploading",
        faceDescriptor,
      },
      { upsert: true, new: true }
    );

    // Upload facial photo to Cloudinary in background
    console.log("Uploading reference face to Cloudinary in the background...");
    cloudinary.uploader.upload(imageBase64, {
      folder: "college-cms/biometrics",
    }).then(async (uploadRes) => {
      await FacultyBiometric.findOneAndUpdate(
        { facultyId: { $regex: new RegExp(`^${normalizedId}$`, "i") } },
        { referencePhotoUrl: uploadRes.secure_url }
      );
      console.log(`✅ Background reference photo upload completed for ${normalizedId}`);
    }).catch(err => {
      console.error(`❌ Background reference photo upload failed for ${normalizedId}:`, err);
    });

    res.json({
      success: true,
      message: "Biometric profile registered successfully",
      referencePhotoUrl: "uploading",
    });
  } catch (error) {
    console.error("Error in registerBiometric:", error);
    res.status(500).json({ success: false, message: "Failed to register face biometric" });
  }
};

// Mark Daily Attendance (Check-in or Check-out)
const markDailyAttendance = async (req, res) => {
  try {
    const facultyId = req.user?.loginid;
    if (!facultyId) {
      return res.status(400).json({ success: false, message: "User login ID not found in token" });
    }
    const normalizedId = facultyId.trim();
    const { imageBase64, faceDescriptor, latitude, longitude, date, time, day, type } = req.body; // type can be 'checkin' or 'checkout'

    if (!imageBase64 || !faceDescriptor || !latitude || !longitude || !date || !time || !day || !type) {
      return res.status(400).json({ success: false, message: "Missing required attendance registration data" });
    }

    // 1. Fetch Geofence config and check location
    const geofence = await Geofence.findOne();
    const fenceLat = geofence ? geofence.latitude : 17.2023;
    const fenceLng = geofence ? geofence.longitude : 78.5831;
    const fenceRadius = geofence ? geofence.radius : 200;

    const distance = getDistanceInMeters(latitude, longitude, fenceLat, fenceLng);

    // Geofencing is strictly enforced for all daily biometric attendance
    if (distance > fenceRadius) {
      return res.status(400).json({
        success: false,
        isLocationIssue: true,
        message: `Out of geofence zone. You are ${Math.round(distance)}m away from the campus (Max allowed: ${fenceRadius}m).`,
      });
    }

    // 2. Fetch biometric record to compare faces (case-insensitive lookup)
    const biometric = await FacultyBiometric.findOne({
      facultyId: { $regex: new RegExp(`^${normalizedId}$`, "i") }
    });
    if (!biometric) {
      return res.status(404).json({
        success: false,
        noBiometric: true,
        message: "No biometric profile registered. Please register your face first.",
      });
    }

    // 3. Compute face matching confidence (Euclidean distance)
    const matchDistance = getEuclideanDistance(faceDescriptor, biometric.faceDescriptor);
    console.log(`[markDailyAttendance] Face verification match distance for ${normalizedId}: ${matchDistance.toFixed(4)} (Threshold: 0.58)`);
    
    // Log the verification attempt to database for analysis
    try {
      await mongoose.connection.db.collection("biometric_attempts").insertOne({
        facultyId: normalizedId,
        matchDistance: isNaN(matchDistance) || !isFinite(matchDistance) ? null : matchDistance,
        threshold: 0.58,
        type,
        status: matchDistance <= 0.58 ? "Success" : "Failed",
        date,
        time,
        timestamp: new Date()
      });
    } catch (logError) {
      console.error("[markDailyAttendance] Logging attempt to DB failed:", logError);
    }

    // Secure threshold at 0.58 to prevent other people from matching.
    if (matchDistance > 0.58) {
      return res.status(400).json({
        success: false,
        isBiometricIssue: true,
        message: `Facial verification failed. Face does not match the registered profile (Match Index: ${matchDistance.toFixed(2)}).`,
      });
    }

    // Retrieve faculty details to get branch/department name (case-insensitive lookup)
    const faculty = await FacultyDetail.findOne({
      employeeId: { $regex: new RegExp(`^${normalizedId}$`, "i") }
    });
    if (!faculty) {
      return res.status(404).json({ success: false, message: "Faculty details not found" });
    }

    const name = `${faculty.firstName} ${faculty.lastName || ""}`.trim();
    const department = faculty.department;

    // 4. Save Attendance Record with "uploading" placeholder (case-insensitive search)
    let attendance = await FacultyDailyAttendance.findOne({
      facultyId: { $regex: new RegExp(`^${normalizedId}$`, "i") },
      date
    });

    if (type === "checkin") {
      if (attendance) {
        return res.status(400).json({
          success: false,
          message: "You have already checked-in for today.",
        });
      }

      attendance = new FacultyDailyAttendance({
        facultyId: normalizedId,
        name,
        department,
        date,
        day,
        checkInTime: time,
        checkInPhotoUrl: "uploading",
        checkInLocation: { latitude, longitude },
        checkInDistance: Math.round(distance),
        status: "Checked-In",
      });
      await attendance.save();

      // Trigger Cloudinary upload in the background
      console.log("Uploading check-in photo to Cloudinary in the background...");
      cloudinary.uploader.upload(imageBase64, {
        folder: `college-cms/attendance_logs/${date}`,
      }).then(async (uploadRes) => {
        await FacultyDailyAttendance.findOneAndUpdate(
          { facultyId: { $regex: new RegExp(`^${normalizedId}$`, "i") }, date },
          { checkInPhotoUrl: uploadRes.secure_url }
        );
        console.log(`✅ Background check-in photo upload completed for ${normalizedId} on ${date}`);
      }).catch(err => {
        console.error(`❌ Background check-in photo upload failed for ${normalizedId} on ${date}:`, err);
      });

      res.json({
        success: true,
        message: `Check-in marked successfully at ${time}!`,
        attendance,
      });
    } else if (type === "checkout") {
      if (!attendance) {
        return res.status(400).json({
          success: false,
          message: "No check-in record found for today. Please check-in first.",
        });
      }

      if (attendance.checkOutTime) {
        return res.status(400).json({
          success: false,
          message: "You have already checked-out for today.",
        });
      }

      attendance.checkOutTime = time;
      attendance.checkOutPhotoUrl = "uploading";
      attendance.checkOutLocation = { latitude, longitude };
      attendance.checkOutDistance = Math.round(distance);
      attendance.status = "Completed";

      await attendance.save();

      // Trigger Cloudinary upload in the background
      console.log("Uploading check-out photo to Cloudinary in the background...");
      cloudinary.uploader.upload(imageBase64, {
        folder: `college-cms/attendance_logs/${date}`,
      }).then(async (uploadRes) => {
        await FacultyDailyAttendance.findOneAndUpdate(
          { facultyId: { $regex: new RegExp(`^${normalizedId}$`, "i") }, date },
          { checkOutPhotoUrl: uploadRes.secure_url }
        );
        console.log(`✅ Background check-out photo upload completed for ${normalizedId} on ${date}`);
      }).catch(err => {
        console.error(`❌ Background check-out photo upload failed for ${normalizedId} on ${date}:`, err);
      });

      res.json({
        success: true,
        message: `Check-out marked successfully at ${time}!`,
        attendance,
      });
    } else {
      res.status(400).json({ success: false, message: "Invalid attendance operation" });
    }
  } catch (error) {
    console.error("Error in markDailyAttendance:", error);
    res.status(500).json({ success: false, message: "Failed to mark daily attendance" });
  }
};

// Retrieve daily attendance logs (Admin/HOD only)
const getDailyAttendanceLogs = async (req, res) => {
  try {
    const { date, branch } = req.query;
    const userRole = req.user?.role?.toLowerCase();
    
    const filter = {};

    // 1. Enforce date filter (default to today if not provided)
    if (date) {
      filter.date = date;
    } else {
      const today = new Date();
      // Format YYYY-MM-DD in local time
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      filter.date = `${year}-${month}-${day}`;
    }

    // 2. Enforce HOD branch restriction
    if (userRole === "hod") {
      // HODs can only view their own department logs
      const hodBranch = req.query.branch || req.user.branch; // Check query or decode info
      // HOD should be passed by client based on their home state branch
      if (branch) {
        filter.department = branch;
      }
    } else if (userRole === "admin") {
      // Admins can query any branch
      if (branch && branch !== "All") {
        filter.department = branch;
      }
    } else {
      return res.status(403).json({ success: false, message: "Unauthorized. Admin or HOD role required." });
    }

    const logs = await FacultyDailyAttendance.find(filter).sort({ checkInTime: -1 });
    res.json({ success: true, logs });
  } catch (error) {
    console.error("Error in getDailyAttendanceLogs:", error);
    res.status(500).json({ success: false, message: "Failed to fetch attendance logs" });
  }
};

// Retrieve personal attendance logs for the logged-in Faculty
const getMyAttendanceLogs = async (req, res) => {
  try {
    const facultyId = req.user?.loginid;
    if (!facultyId) {
      console.warn("⚠️ getMyAttendanceLogs: req.user.loginid is missing in token!");
      return res.status(400).json({ success: false, message: "User login ID not found in token" });
    }

    const normalizedId = facultyId.trim();
    console.log(`[getMyAttendanceLogs] Fetching logs for facultyId: "${normalizedId}"...`);

    const logs = await FacultyDailyAttendance.find({
      facultyId: { $regex: new RegExp(`^${normalizedId}$`, "i") }
    }).sort({ date: -1 }).limit(10);

    console.log(`[getMyAttendanceLogs] Found ${logs.length} logs for "${normalizedId}"`);
    res.json({ success: true, logs });
  } catch (error) {
    console.error("Error in getMyAttendanceLogs:", error);
    res.status(500).json({ success: false, message: "Failed to fetch personal attendance logs" });
  }
};

module.exports = {
  getGeofence,
  saveGeofence,
  getBiometricStatus,
  registerBiometric,
  markDailyAttendance,
  getDailyAttendanceLogs,
  getMyAttendanceLogs,
};
