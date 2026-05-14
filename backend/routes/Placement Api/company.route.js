const express = require("express");
const router = express.Router();
const { addCompany, getCompanies, updateCompany, deleteCompany } = require("../../controllers/Placement/company.controller");

router.post("/add", addCompany);
router.get("/get", getCompanies);
router.put("/update/:id", updateCompany);
router.delete("/delete/:id", deleteCompany);

module.exports = router;
