//branch.routes.js
const express = require("express");
const router = express.Router();
const { getBranch, addBranch, deleteBranch } = require("../../controllers/Other/branch.controller.js");

router.get("/getBranch", getBranch);
router.get("/get-all-branches", getBranch); // Alias for getting all branches
router.post("/addBranch", addBranch);
router.delete("/deleteBranch/:id", deleteBranch);

module.exports = router;
