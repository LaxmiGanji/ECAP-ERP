const express = require("express");
const { getNotice, addNotice, updateNotice, deleteNotice } = require("../../controllers/Other/notice.controller");
const upload = require("../../middlewares/multer.middleware.js");
const router = express.Router();

router.get("/getNotice", getNotice);
router.post("/addNotice", upload.single("notice"), addNotice);
router.put("/updateNotice/:id", updateNotice);
router.delete("/deleteNotice/:id", deleteNotice);

module.exports = router;
