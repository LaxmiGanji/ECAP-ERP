const express = require("express");
const router = express.Router();
const { 
    getMaterial, 
    addMaterial, 
    updateMaterial, 
    deleteMaterial,
    getFacultyMaterials,
    getAllMaterials 
} = require("../../controllers/Other/material.controller.js");
const upload = require("../../middlewares/multer.middleware.js");

// Student routes
router.post("/getMaterial", getMaterial);

// Faculty routes
router.post("/addMaterial", upload.uploadMiddleware, addMaterial);
router.get("/getFacultyMaterials", getFacultyMaterials);
router.get("/getAllMaterials", getAllMaterials);
router.put("/updateMaterial/:id", updateMaterial);
router.delete("/deleteMaterial/:id", deleteMaterial);

module.exports = router;