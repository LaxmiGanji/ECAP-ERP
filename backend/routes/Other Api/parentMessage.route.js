const express = require("express");
const router = express.Router();
const {
  lookupStudent,
  sendParentMessage,
  getMessageHistory
} = require("../../controllers/Other/parentMessage.controller");

// Search/Lookup student by enrollment roll number
router.get("/lookup/:enrollmentNo", lookupStudent);

// Send message to parent
router.post("/send", sendParentMessage);

// Get message history
router.get("/history", getMessageHistory);

module.exports = router;
