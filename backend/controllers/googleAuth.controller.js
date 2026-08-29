const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");

const StudentDetail = require("../models/Students/details.model.js");
const FacultyDetail = require("../models/Faculty/details.model.js");
const AdminDetail = require("../models/Admin/details.model.js");
const ExaminationDetail = require("../models/Examination/details.model.js");
const LibraryDetail = require("../models/Library/details.model.js");
const TransportDetail = require("../models/Transport/details.model.js");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || "PLACEHOLDER_CLIENT_ID");

const googleLogin = async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ success: false, message: "No Google token provided" });
  }

  try {
    // 1. Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
    });
    
    const payload = ticket.getPayload();
    const email = payload.email;

    if (!email) {
       return res.status(400).json({ success: false, message: "Could not retrieve email from Google" });
    }

    const emailTrimmed = email.trim();
    const emailQuery = { email: { $regex: new RegExp(`^${emailTrimmed.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}$`, "i") } };

    // 2. Search all models for this email (case-insensitive)
    let user = null;
    let role = null;
    let loginid = null;

    user = await StudentDetail.findOne(emailQuery);
    if (user) { role = "student"; loginid = user.enrollmentNo; }

    if (!user) {
      user = await FacultyDetail.findOne(emailQuery);
      if (user) { role = "faculty"; loginid = user.employeeId; }
    }
    if (!user) {
      user = await AdminDetail.findOne(emailQuery);
      if (user) { role = "admin"; loginid = user.employeeId; }
    }
    if (!user) {
      user = await ExaminationDetail.findOne(emailQuery);
      if (user) { role = "examination"; loginid = user.employeeId; }
    }
    if (!user) {
      user = await LibraryDetail.findOne(emailQuery);
      if (user) { role = "library"; loginid = user.employeeId; }
    }
    if (!user) {
      user = await TransportDetail.findOne(emailQuery);
      if (user) { role = "transport"; loginid = user.employeeId; }
    }

    // 3. If no match
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Your Google email is not registered with any role in our system.",
      });
    }

    // 4. Generate JWT
    const token = jwt.sign(
      { id: user._id, loginid: loginid, role: role },
      process.env.JWT_SECRET || "fallback_secret_for_dev_only",
      { expiresIn: "1d" }
    );

    // 5. Send successful response mapping exactly what frontend expects
    // Note: React frontend checks for response.data.loginid, response.data.token, etc.
    const data = {
      success: true,
      message: "Google Login Successful!",
      loginid: loginid,
      id: user._id,
      role: role.charAt(0).toUpperCase() + role.slice(1), // Ex: 'Student'
      token: token,
    };
    
    res.json(data);

  } catch (error) {
    console.error("Google verify error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error during Google Auth" });
  }
};

module.exports = { googleLogin };
