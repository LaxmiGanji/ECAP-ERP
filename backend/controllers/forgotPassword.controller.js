const https = require("https");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const PasswordReset = require("../models/Other/passwordReset.model");
const NotificationSettings = require("../models/Other/notificationSettings.model");

// Helper to send email via HTTPS REST API (Port 443)
const sendViaHttpsRest = (apiKey, toEmail, subject, htmlContent, textContent, fromEmail) => {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      sender: { name: "Sphoorthy Engineering College - ECAP", email: fromEmail || "laxmiganji2005@gmail.com" },
      to: [{ email: toEmail }],
      subject: subject,
      htmlContent: htmlContent,
      textContent: textContent
    });

    console.log(`Sending email via HTTPS REST API (Port 443) to ${toEmail}...`);

    const req = https.request(
      {
        hostname: "api.brevo.com",
        port: 443,
        path: "/v3/smtp/email",
        method: "POST",
        headers: {
          "accept": "application/json",
          "api-key": apiKey,
          "content-type": "application/json",
          "content-length": Buffer.byteLength(data)
        }
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`✅ [PasswordReset] Email successfully sent via HTTPS REST API to ${toEmail}.`);
            resolve({ sentViaSMTP: true });
          } else {
            console.warn(`⚠️ [PasswordReset] HTTPS REST API returned ${res.statusCode}: ${body}`);
            resolve({ sentViaSMTP: false, error: body });
          }
        });
      }
    );

    req.on("error", (e) => {
      console.error("❌ [PasswordReset] HTTPS REST API Error:", e.message);
      resolve({ sentViaSMTP: false, error: e.message });
    });

    req.write(data);
    req.end();
  });
};

// Credential models
const studentCredential = require("../models/Students/credential.model");
const facultyCredential = require("../models/Faculty/credential.model");
const adminCredential = require("../models/Admin/credential.model");
const hodCredential = require("../models/HOD/credential.model");
const principalCredential = require("../models/Principal/credential.model");
const examinationCredential = require("../models/Examination/credential.model");
const libraryCredential = require("../models/Library/credential.model");
const transportCredential = require("../models/Transport/credential.model");
const placementCredential = require("../models/Placement/credential.model");
const accountsCredential = require("../models/Accounts/credential.model");
const alumniCredential = require("../models/Alumni/credential.model");

// Details models for email lookup
const studentDetails = require("../models/Students/details.model");
const facultyDetails = require("../models/Faculty/details.model");
const adminDetails = require("../models/Admin/details.model");
const examinationDetails = require("../models/Examination/details.model");
const libraryDetails = require("../models/Library/details.model");
const transportDetails = require("../models/Transport/details.model");
const placementDetails = require("../models/Placement/details.model");

// Helper to get models for a role
const getRoleModels = (roleName) => {
  const normalized = (roleName || "").trim().toLowerCase();
  switch (normalized) {
    case "student":
      return { credential: studentCredential, details: studentDetails, idKey: "enrollmentNo" };
    case "faculty":
      return { credential: facultyCredential, details: facultyDetails, idKey: "employeeId" };
    case "admin":
      return { credential: adminCredential, details: adminDetails, idKey: "employeeId" };
    case "hod":
      return { credential: hodCredential, details: facultyDetails, idKey: "employeeId" };
    case "principal":
      return { credential: principalCredential, details: facultyDetails, idKey: "employeeId" };
    case "examination":
      return { credential: examinationCredential, details: examinationDetails, idKey: "employeeId" };
    case "library":
      return { credential: libraryCredential, details: libraryDetails, idKey: "employeeId" };
    case "transport":
      return { credential: transportCredential, details: transportDetails, idKey: "employeeId" };
    case "placement":
      return { credential: placementCredential, details: placementDetails, idKey: "employeeId" };
    case "accounts":
      return { credential: accountsCredential, details: facultyDetails, idKey: "employeeId" };
    case "alumni":
      return { credential: alumniCredential, details: studentDetails, idKey: "enrollmentNo" };
    default:
      return null;
  }
};

// Helper to send password reset email
const sendResetEmail = async (email, resetLink, role, loginid) => {
  try {
    let settings = await NotificationSettings.findOne();
    const smtpHost = process.env.SMTP_HOST || (settings && settings.smtpHost) || "smtp.gmail.com";
    const smtpPort = process.env.SMTP_PORT || (settings && settings.smtpPort) || 587;
    const smtpUser = (process.env.SMTP_USER || (settings && settings.smtpUser) || "laxmiganji2005@gmail.com").trim();
    const rawPass = process.env.SMTP_PASS || (settings && settings.smtpPass) || "hvjfuoddldnuifrd";
    const smtpPass = rawPass.replace(/\s+/g, "");
    const smtpFrom = process.env.SMTP_FROM || (settings && settings.smtpFrom) || `"ECAP Portal" <${smtpUser}>`;

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; line-height: 1.6; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h2 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">Sphoorthy Engineering College</h2>
          <p style="color: #93c5fd; margin: 5px 0 0 0; font-size: 14px;">ECAP - Password Reset Request</p>
        </div>
        <div style="padding: 25px 20px;">
          <p style="font-size: 16px; color: #1e293b;">Hello <strong>${loginid}</strong> (${role}),</p>
          <p style="font-size: 15px; color: #334155; line-height: 1.8;">
            We received a request to reset your password for your ECAP account. Click the button below to set a new password. No previous password is required.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" target="_blank" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
              Reset Password
            </a>
          </div>
          <p style="font-size: 13px; color: #64748b;">
            If the button doesn't work, copy and paste this link into your browser:<br/>
            <a href="${resetLink}" style="color: #2563eb; word-break: break-all;">${resetLink}</a>
          </p>
          <p style="font-size: 13px; color: #dc2626; margin-top: 20px;">
            ⚠️ This link will expire in <strong>1 hour</strong>. If you did not request a password reset, please ignore this email.
          </p>
        </div>
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
        <small style="color: #64748b; display: block; text-align: center;">
          This is an automated security notification from Sphoorthy Engineering College ECAP System.
        </small>
      </div>
    `;

    const emailApiKey = process.env.EMAIL_API_KEY || process.env.BREVO_API_KEY || (settings && settings.emailApiKey);
    const subject = "🔒 ECAP Password Reset Request - Sphoorthy Engineering College";
    const textContent = `Hello ${loginid} (${role}),\n\nWe received a request to reset your password for your ECAP account.\n\nPlease use the link below to reset your password:\n${resetLink}\n\nThis link will expire in 1 hour.\n\nSphoorthy Engineering College ECAP System`;

    // 1. If HTTPS REST API key is configured, send via HTTPS REST API over Port 443
    if (emailApiKey) {
      const restResult = await sendViaHttpsRest(emailApiKey, email, subject, htmlContent, textContent, smtpUser);
      if (restResult.sentViaSMTP) return restResult;
    }

    // 2. Otherwise try standard SMTP transport
    if (smtpHost && smtpUser && smtpPass) {
      try {
        const transportOptions = (smtpHost || "").includes("gmail")
          ? {
              service: "gmail",
              auth: { user: smtpUser, pass: smtpPass },
              family: 4
            }
          : {
              host: smtpHost,
              port: Number(smtpPort) || 587,
              secure: Number(smtpPort) === 465,
              auth: { user: smtpUser, pass: smtpPass },
              family: 4,
              tls: { rejectUnauthorized: false }
            };

        const transporter = nodemailer.createTransport({
          ...transportOptions,
          connectionTimeout: 5000,
          greetingTimeout: 5000,
          socketTimeout: 8000
        });

        await transporter.sendMail({
          from: smtpFrom || `"ECAP System" <${smtpUser}>`,
          replyTo: smtpUser,
          to: email,
          subject: subject,
          text: textContent,
          html: htmlContent,
        });
        console.log(`✅ [PasswordReset] Email successfully sent to ${email} via SMTP.`);
        return { sentViaSMTP: true };
      } catch (smtpErr) {
        console.warn(`⚠️ [PasswordReset] SMTP sending failed (${smtpErr.message}).`);
        if (emailApiKey) {
          return await sendViaHttpsRest(emailApiKey, email, subject, htmlContent, textContent, smtpUser);
        }
        return { sentViaSMTP: false, error: smtpErr.message };
      }
    }

    console.log(`\n======================================================`);
    console.log(`📧 [ECAP PASSWORD RESET MAIL] (Free/Dev Mode)`);
    console.log(`Recipient: ${email}`);
    console.log(`Role: ${role} | Login ID: ${loginid}`);
    console.log(`Reset Link: ${resetLink}`);
    console.log(`======================================================\n`);
    return { sentViaSMTP: false, error: "SMTP host/user/pass not configured" };
  } catch (err) {
    console.error("❌ [PasswordReset] Error sending email:", err);
    return { sentViaSMTP: false, error: err.message };
  }
};

// 1. Request Password Reset Link
const requestPasswordReset = async (req, res) => {
  try {
    const { role, loginid, email: userProvidedEmail } = req.body;

    if (!role || !loginid) {
      return res.status(400).json({
        success: false,
        message: "Role and Login ID are required."
      });
    }

    const models = getRoleModels(role);
    if (!models) {
      return res.status(400).json({
        success: false,
        message: "Invalid user role specified."
      });
    }

    const trimmedLoginId = loginid.trim();

    // Check if user exists in Credential collection
    let userCred = await models.credential.findOne({ loginid: trimmedLoginId });
    if (!userCred && userProvidedEmail) {
      // Try searching details by email if user provided email
      let detailRec = await models.details.findOne({ email: userProvidedEmail.trim() });
      if (detailRec) {
        const idVal = detailRec[models.idKey] || detailRec.enrollmentNo || detailRec.employeeId;
        if (idVal) {
          userCred = await models.credential.findOne({ loginid: idVal });
        }
      }
    }

    if (!userCred) {
      return res.status(404).json({
        success: false,
        message: `No account found for ${role} with Login ID "${trimmedLoginId}".`
      });
    }

    // Determine destination email
    let destinationEmail = userProvidedEmail ? userProvidedEmail.trim() : null;

    if (!destinationEmail && models.details) {
      const detailRec = await models.details.findOne({ [models.idKey]: trimmedLoginId });
      if (detailRec && detailRec.email) {
        destinationEmail = detailRec.email;
      }
    }

    // Fallback: Check if loginid itself is formatted as an email
    if (!destinationEmail && trimmedLoginId.includes("@")) {
      destinationEmail = trimmedLoginId;
    }

    if (!destinationEmail) {
      return res.status(400).json({
        success: false,
        message: "No registered email address found for this account. Please enter your email address.",
        requireEmail: true
      });
    }

    // Generate random secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    // Delete any existing reset tokens for this user
    await PasswordReset.deleteMany({ loginid: userCred.loginid, role: role.toLowerCase() });

    // Save token
    await PasswordReset.create({
      loginid: userCred.loginid,
      role: role.toLowerCase(),
      token,
      email: destinationEmail,
      expiresAt
    });

    // Build reset link
    const frontendBaseUrl = req.headers.origin || (process.env.FRONTEND_API_LINK
      ? process.env.FRONTEND_API_LINK.replace(/\/api\/?$/, "")
      : "https://ecap-erp-frontend.onrender.com");

    const resetLink = `${frontendBaseUrl}/reset-password?token=${token}&role=${encodeURIComponent(role)}`;

    // Dispatch email
    const mailResult = await sendResetEmail(destinationEmail, resetLink, role, userCred.loginid);

    if (mailResult && mailResult.sentViaSMTP) {
      return res.json({
        success: true,
        message: `Password reset link sent to ${destinationEmail}. Please check your email inbox!`,
        email: destinationEmail
      });
    } else {
      return res.status(500).json({
        success: false,
        message: `Failed to send email to ${destinationEmail}: ${mailResult?.error || "SMTP error"}`
      });
    }

  } catch (error) {
    console.error("Error in requestPasswordReset:", error);
    return res.status(500).json({
      success: false,
      message: "Server error occurred while processing password reset request."
    });
  }
};

// 2. Verify Reset Token
const verifyResetToken = async (req, res) => {
  try {
    const { token, role } = req.query;

    if (!token) {
      return res.status(400).json({ success: false, valid: false, message: "Reset token is required." });
    }

    const trimmedToken = token.trim();
    const resetRecord = await PasswordReset.findOne({ token: trimmedToken });

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: "Invalid reset link or this link has already been used."
      });
    }

    if (new Date(resetRecord.expiresAt).getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: "This password reset link has expired. Please request a new one."
      });
    }

    return res.json({
      success: true,
      valid: true,
      loginid: resetRecord.loginid,
      role: resetRecord.role
    });

  } catch (error) {
    console.error("Error in verifyResetToken:", error);
    return res.status(500).json({
      success: false,
      valid: false,
      message: "Internal server error while verifying reset token."
    });
  }
};

// 3. Reset Password (No previous password required)
const resetPassword = async (req, res) => {
  try {
    const { token, role, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Reset token and new password are required."
      });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 4 characters long."
      });
    }

    const trimmedToken = token.trim();
    const resetRecord = await PasswordReset.findOne({ token: trimmedToken });

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid password reset token or this link was already used. Please request a new link."
      });
    }

    if (new Date(resetRecord.expiresAt).getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "This password reset link has expired. Please request a new link."
      });
    }

    const targetRole = role || resetRecord.role;
    const models = getRoleModels(targetRole);

    if (!models) {
      return res.status(400).json({
        success: false,
        message: "Invalid role associated with token."
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password in respective Credential collection
    const updatedUser = await models.credential.findOneAndUpdate(
      { loginid: resetRecord.loginid },
      { password: hashedPassword },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User account not found to update password."
      });
    }

    // Delete token so it cannot be used again
    await PasswordReset.deleteMany({ loginid: resetRecord.loginid, role: resetRecord.role });

    console.log(`✅ [PasswordReset] Password reset successfully for ${resetRecord.loginid} (${targetRole})`);

    return res.json({
      success: true,
      message: "Password has been reset successfully! You can now log in with your new password."
    });

  } catch (error) {
    console.error("Error in resetPassword:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while resetting password."
    });
  }
};

module.exports = {
  requestPasswordReset,
  verifyResetToken,
  resetPassword
};
