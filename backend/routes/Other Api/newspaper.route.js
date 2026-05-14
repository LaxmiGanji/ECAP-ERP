const express = require("express");
const {
  createNewspaper,
  getNewspapers,
  updateNewspaper,
  deleteNewspaper,
  markNewspaperReceived,
} = require("../../controllers/Other/newspaper.controller.js");

const router = express.Router();

router.get("/", getNewspapers);
router.post("/", createNewspaper);
router.put("/:id", updateNewspaper);
router.delete("/:id", deleteNewspaper);
router.post("/:id/receive", markNewspaperReceived);

module.exports = router;

