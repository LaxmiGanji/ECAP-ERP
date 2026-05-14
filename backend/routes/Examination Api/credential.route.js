const express = require("express");
const {
  loginHandler,
  registerHandler,
  getAll,
  updateHandler,
  deleteHandler,
} = require("../../controllers/Examination/credential.controller.js");
const router = express.Router();

router.post("/login", loginHandler);
router.post("/register", registerHandler);
router.get("/list", getAll);
router.put("/update/:id", updateHandler);
router.delete("/delete/:id", deleteHandler);

module.exports = router;
