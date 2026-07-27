const StudentDetails = require("../../models/Students/details.model");
const ParentMessage = require("../../models/Other/parentMessage.model");
const NotificationService = require("../../services/notification.service");

// Lookup student details & messaging history by enrollment roll number
const lookupStudent = async (req, res) => {
  try {
    const { enrollmentNo } = req.params;
    if (!enrollmentNo) {
      return res.status(400).json({ success: false, message: "Enrollment roll number is required" });
    }

    const trimmedRoll = enrollmentNo.trim();
    const student = await StudentDetails.findOne({
      enrollmentNo: { $regex: new RegExp(`^${trimmedRoll}$`, "i") }
    }).select("enrollmentNo firstName middleName lastName branch semester section FatherName MotherName FatherPhoneNumber MotherPhoneNumber phoneNumber email profile batch regulation");

    if (!student) {
      return res.status(404).json({ success: false, message: `Student with enrollment roll '${trimmedRoll}' not found.` });
    }

    const parentPortalLink = NotificationService.generateParentLink(student.enrollmentNo);

    // Fetch previous parent messages for this student
    const recentMessages = await ParentMessage.find({ enrollmentNo: student.enrollmentNo })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      student: {
        _id: student._id,
        enrollmentNo: student.enrollmentNo,
        fullName: `${student.firstName || ''} ${student.middleName || ''} ${student.lastName || ''}`.trim(),
        firstName: student.firstName,
        lastName: student.lastName,
        branch: student.branch,
        semester: student.semester,
        section: student.section || "A",
        batch: student.batch,
        regulation: student.regulation,
        email: student.email,
        phoneNumber: student.phoneNumber,
        FatherName: student.FatherName || "Not Provided",
        FatherPhoneNumber: student.FatherPhoneNumber || "Not Provided",
        MotherName: student.MotherName || "Not Provided",
        MotherPhoneNumber: student.MotherPhoneNumber || "Not Provided",
        profile: student.profile
      },
      parentPortalLink,
      recentMessages
    });
  } catch (error) {
    console.error("Error looking up student for parent message:", error);
    res.status(500).json({ success: false, message: "Internal server error during student lookup", error: error.message });
  }
};

// Send message to student parent
const sendParentMessage = async (req, res) => {
  try {
    const { 
      enrollmentNo, 
      recipientType = "Primary", 
      subject, 
      message, 
      category = "General", 
      channels = ["PORTAL"],
      senderId,
      senderName,
      senderRole
    } = req.body;

    if (!enrollmentNo || !subject || !message) {
      return res.status(400).json({ success: false, message: "Enrollment roll, subject, and message are required." });
    }

    const trimmedRoll = enrollmentNo.trim();
    const student = await StudentDetails.findOne({
      enrollmentNo: { $regex: new RegExp(`^${trimmedRoll}$`, "i") }
    });

    if (!student) {
      return res.status(404).json({ success: false, message: `Student with enrollment roll '${trimmedRoll}' not found.` });
    }

    // Determine recipient name and phone based on recipientType
    let recipientName = "Parent";
    let recipientPhone = student.FatherPhoneNumber || student.MotherPhoneNumber || student.phoneNumber || "";

    if (recipientType === "Father") {
      recipientName = student.FatherName || "Father";
      recipientPhone = student.FatherPhoneNumber || student.phoneNumber || "";
    } else if (recipientType === "Mother") {
      recipientName = student.MotherName || "Mother";
      recipientPhone = student.MotherPhoneNumber || student.phoneNumber || "";
    } else if (recipientType === "Both") {
      recipientName = `Parents (${student.FatherName || 'Father'} & ${student.MotherName || 'Mother'})`.replace(/ & Mother\)/, ")").replace(/\(Father & \)/, ")");
      recipientPhone = student.FatherPhoneNumber || student.MotherPhoneNumber || student.phoneNumber || "";
    } else {
      recipientName = student.FatherName || student.MotherName || "Parent";
    }

    // Determine sender details
    const resolvedSenderId = senderId || req.user?.id || req.user?.loginid || "system";
    const resolvedSenderName = senderName || req.user?.name || req.user?.firstName || "College Management";
    const resolvedSenderRole = senderRole || req.user?.role || "Faculty";

    // Generate Parent Portal Link
    const portalLink = NotificationService.generateParentLink(student.enrollmentNo);

    // Save Parent Message
    const newMessage = new ParentMessage({
      studentId: student._id,
      enrollmentNo: student.enrollmentNo,
      studentName: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
      recipientType,
      recipientName,
      recipientPhone,
      senderId: resolvedSenderId,
      senderName: resolvedSenderName,
      senderRole: resolvedSenderRole,
      subject: subject.trim(),
      message: message.trim(),
      category,
      sentVia: Array.isArray(channels) && channels.length > 0 ? channels : ["PORTAL"],
      parentPortalLink: portalLink
    });

    await newMessage.save();

    // Trigger Notifications asynchronously if requested (SMS, WhatsApp, Email)
    const alertContent = `[ECAP Notice - ${category}] ${subject}\n\nDear Parent of ${student.firstName || student.enrollmentNo},\n${message}\n\nView Portal: ${portalLink}`;

    if (Array.isArray(channels)) {
      for (const ch of channels) {
        if (["SMS", "WHATSAPP", "EMAIL"].includes(ch)) {
          NotificationService.sendAlert({
            student,
            type: `PARENT_MSG_${category.toUpperCase()}`,
            content: alertContent,
            channel: ch,
            referenceId: newMessage._id
          }).catch(err => console.error(`Error sending ${ch} alert for parent message:`, err.message));
        }
      }
    }

    res.json({
      success: true,
      message: `Message sent successfully to parent of ${student.firstName || student.enrollmentNo}!`,
      data: newMessage
    });
  } catch (error) {
    console.error("Error sending message to parent:", error);
    res.status(500).json({ success: false, message: "Failed to send message to parent", error: error.message });
  }
};

// Get messaging history
const getMessageHistory = async (req, res) => {
  try {
    const { enrollmentNo, senderId, senderRole, category, limit = 50 } = req.query;
    const filter = {};

    if (enrollmentNo) {
      filter.enrollmentNo = { $regex: new RegExp(`^${enrollmentNo.trim()}$`, "i") };
    }
    if (senderId) {
      filter.senderId = senderId;
    }
    if (senderRole) {
      filter.senderRole = senderRole;
    }
    if (category && category !== "All") {
      filter.category = category;
    }

    const messages = await ParentMessage.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({
      success: true,
      count: messages.length,
      messages
    });
  } catch (error) {
    console.error("Error fetching parent message history:", error);
    res.status(500).json({ success: false, message: "Error fetching message history", error: error.message });
  }
};

module.exports = {
  lookupStudent,
  sendParentMessage,
  getMessageHistory
};
