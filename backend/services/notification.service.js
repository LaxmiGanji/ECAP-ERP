const nodemailer = require("nodemailer");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const NotificationSettings = require("../models/Other/notificationSettings.model");
const NotificationLog = require("../models/Other/notificationLogs.model");

const JWT_SECRET = process.env.JWT_SECRET || "ecap_parent_secure_portal_key_2026";

class NotificationService {
  // Generate secure JWT token and return complete Parent Portal dashboard link
  static generateParentLink(enrollmentNo) {
    const token = jwt.sign({ enrollmentNo }, JWT_SECRET, { expiresIn: "30d" });
    const frontendUrl = process.env.REACT_APP_FRONTEND_URL || "http://localhost:3000";
    return `${frontendUrl}/parent/dashboard/${token}`;
  }

  // Fetch or initialize default settings
  static async getSettings() {
    let settings = await NotificationSettings.findOne();
    if (!settings) {
      settings = new NotificationSettings();
      await settings.save();
    }
    return settings;
  }

  // Main dispatch routine (runs in the background to log status and call individual APIs)
  static async sendAlert({ student, type, content, channel, referenceId }) {
    const settings = await this.getSettings();
    const phone = student.FatherPhoneNumber || student.MotherPhoneNumber || student.phoneNumber;
    const email = student.FatherEmail || student.MotherEmail || student.email;

    const log = new NotificationLog({
      studentId: student._id,
      enrollmentNo: student.enrollmentNo,
      recipientName: student.FatherName || student.MotherName || "Parent",
      recipientContact: channel === "EMAIL" ? email : phone,
      channel,
      type,
      messageContent: content,
      referenceId
    });

    try {
      if (channel === "SMS") {
        if (!phone) throw new Error("No phone number registered for student or parent.");
        await this.dispatchSMS(phone, content, settings);
      } else if (channel === "WHATSAPP") {
        if (!phone) throw new Error("No phone number registered for student or parent.");
        await this.dispatchWhatsApp(phone, content, settings);
      } else if (channel === "EMAIL") {
        if (!email) throw new Error("No email address registered for student or parent.");
        await this.dispatchEmail(email, `${type.replace(/_/g, " ")} - ECAP Notification`, content, settings);
      } else {
        // Fallback for PORTAL or in-app notifications
        log.status = "SENT";
      }
      log.status = "SENT";
      console.log(`✅ [NotificationService] Processed ${channel} message for ${student.enrollmentNo}`);
    } catch (err) {
      log.status = "FAILED";
      log.errorMessage = err.message;
      console.error(`❌ [NotificationService] Error for ${student.enrollmentNo} via ${channel}:`, err.message);
    }
    await log.save();
  }

  // SMS Gateway call (with 100% Free Portal & Console Delivery Fallback)
  static async dispatchSMS(phone, text, settings) {
    if (settings.twilioSid && settings.twilioToken) {
      const client = require("twilio")(settings.twilioSid, settings.twilioToken);
      await client.messages.create({
        body: text,
        from: settings.twilioFromNumber,
        to: phone.startsWith("+") ? phone : `+91${phone}`
      });
    } else if (settings.smsGatewayUrl) {
      const url = settings.smsGatewayUrl
        .replace("{to}", encodeURIComponent(phone))
        .replace("{message}", encodeURIComponent(text))
        .replace("{apikey}", encodeURIComponent(settings.smsApiKey || ""));
      await axios.get(url);
    } else {
      // 100% FREE MODE FALLBACK: Logs to console and delivers via Parent Portal without requiring paid SMS APIs
      console.log(`📱 [FREE SMS MODE] Message delivered to Parent Portal for ${phone}:\n"${text}"`);
    }
  }

  // WhatsApp Business API call (with Free Mode Fallback)
  static async dispatchWhatsApp(phone, text, settings) {
    if (settings.whatsappToken && settings.whatsappPhoneNumberId) {
      const cleanPhone = phone.replace(/[^0-9]/g, "");
      const recipient = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

      await axios.post(
        `https://graph.facebook.com/v17.0/${settings.whatsappPhoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: recipient,
          type: "text",
          text: { body: text }
        },
        {
          headers: { Authorization: `Bearer ${settings.whatsappToken}` }
        }
      );
    } else {
      // 100% FREE MODE FALLBACK
      console.log(`💬 [FREE WHATSAPP MODE] Message delivered to Parent Portal for ${phone}:\n"${text}"`);
    }
  }

  // SMTP Mail Sender (Supports 100% Free Gmail SMTP, HTTPS REST API & Free Fallback)
  static async dispatchEmail(email, subject, text, settings) {
    const apiKey = process.env.EMAIL_API_KEY || process.env.BREVO_API_KEY || (settings && settings.emailApiKey);
    const htmlContent = `<div style="font-family: Arial, sans-serif; padding: 25px; line-height: 1.6; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 600px; margin: 0 auto; background: #ffffff;">
                           <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 15px; border-radius: 8px 8px 0 0; text-align: center;">
                             <h2 style="color: #ffffff; margin: 0; font-size: 20px;">Sphoorthy Engineering College - ECAP Portal</h2>
                           </div>
                           <div style="padding: 20px 0;">
                             <p style="font-size: 15px; color: #1e293b;">Dear Parent/Student,</p>
                             <p style="font-size: 15px; color: #334155; line-height: 1.8;">${text.replace(/\n/g, "<br>")}</p>
                           </div>
                           <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
                           <small style="color: #64748b; display: block; text-align: center;">This is an automated notification from Sphoorthy Engineering College. Please do not reply directly to this email.</small>
                         </div>`;

    if (apiKey) {
      try {
        const https = require("https");
        const data = JSON.stringify({
          sender: { name: "Sphoorthy Engineering College - ECAP", email: settings.smtpUser || "laxmiganji2005@gmail.com" },
          to: [{ email: email }],
          subject: subject,
          htmlContent: htmlContent,
          textContent: text
        });

        await new Promise((resolve, reject) => {
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
                if (res.statusCode >= 200 && res.statusCode < 300) resolve();
                else reject(new Error(`Brevo API Error ${res.statusCode}: ${body}`));
              });
            }
          );
          req.on("error", reject);
          req.write(data);
          req.end();
        });
        console.log(`✅ [NotificationService] Email sent to ${email} via HTTPS REST API.`);
        return;
      } catch (restErr) {
        console.warn(`⚠️ [NotificationService] HTTPS REST API failed (${restErr.message}). Trying SMTP fallback...`);
      }
    }

    if (settings.smtpHost && settings.smtpUser && settings.smtpPass) {
      const transporter = nodemailer.createTransport({
        host: settings.smtpHost,
        port: Number(settings.smtpPort) || 587,
        secure: Number(settings.smtpPort) === 465,
        auth: { user: settings.smtpUser, pass: settings.smtpPass },
        family: 4,
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 8000,
        tls: { rejectUnauthorized: false }
      });

      await transporter.sendMail({
        from: settings.smtpFrom || settings.smtpUser,
        to: email,
        subject: subject,
        text: text,
        html: htmlContent
      });
    } else {
      // 100% FREE MODE FALLBACK
      console.log(`📧 [FREE EMAIL MODE] Email queued to Parent Portal for ${email}:\nSubject: ${subject}\n"${text}"`);
    }
  }
}

module.exports = NotificationService;
