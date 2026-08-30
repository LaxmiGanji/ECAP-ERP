const Material = require("../../models/Other/material.model");
const cloudinary = require("cloudinary").v2;

// Get materials by branch, semester, regulation, or subject (for students)
const getMaterial = async (req, res) => {
    try {
        const { subject, branch, semester, regulation } = req.body;
        let query = {};
        
        if (subject && subject !== "select") query.subject = new RegExp(`^${subject}$`, "i");
        if (branch) query.branch = new RegExp(branch, "i");
        if (semester) query.semester = parseInt(semester, 10) || semester;
        if (regulation) query.regulation = new RegExp(regulation, "i");

        let material = await Material.find(query).sort({ createdAt: -1 });
        
        // Intelligent Fallback: If strict regulation filtering returns 0, match branch & semester
        if ((!material || material.length === 0) && regulation && (branch || semester)) {
            const fallbackQuery = {};
            if (branch) fallbackQuery.branch = new RegExp(branch, "i");
            if (semester) fallbackQuery.semester = parseInt(semester, 10) || semester;
            if (subject && subject !== "select") fallbackQuery.subject = new RegExp(`^${subject}$`, "i");
            material = await Material.find(fallbackQuery).sort({ createdAt: -1 });
        }

        res.json({ 
            success: true, 
            message: material && material.length > 0 ? "Material Found!" : "No materials available for current selection.", 
            material: material || [] 
        });
    } catch (error) {
        console.error("Error in getMaterial:", error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

// Get materials uploaded by specific faculty with filters
const getFacultyMaterials = async (req, res) => {
    try {
        const { faculty, subject, branch, semester } = req.query;
        
        console.log("📚 Getting faculty materials for:", faculty);
        
        if (!faculty) {
            return res.status(400).json({ 
                success: false, 
                message: "Faculty name is required" 
            });
        }

        // Build query
        let query = { faculty: faculty };
        
        if (subject && subject !== '') {
            query.subject = subject;
        }
        if (branch && branch !== '') {
            query.branch = branch;
        }
        if (semester && semester !== '') {
            query.semester = parseInt(semester);
        }

        console.log("🔍 Query:", query);

        const materials = await Material.find(query).sort({ createdAt: -1 });
        
        console.log(`✅ Found ${materials.length} materials for faculty ${faculty}`);
        
        res.json({
            success: true,
            count: materials.length,
            materials
        });
    } catch (error) {
        console.error("❌ Error fetching faculty materials:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch materials",
            error: error.message 
        });
    }
}

// Add material (updated to include branch and semester)
const addMaterial = async (req, res) => {
    try {
        console.log("\n📝 === ADD MATERIAL REQUEST ===");
        console.log("Body:", req.body);
        console.log("File object:", req.file);
        
        let { faculty, subject, title, branch, semester } = req.body;

        // Validate required fields
        if (!faculty || !subject || !title || !branch || !semester) {
            console.log("❌ Missing required fields");
            return res.status(400).json({ 
                success: false, 
                message: "Faculty, subject, title, branch, and semester are required!" 
            });
        }

        if (!req.file) {
            console.log("❌ No file provided in request");
            return res.status(400).json({ success: false, message: "File is required!" });
        }

        console.log("✅ File received from multer:");
        console.log("  - Filename:", req.file.filename);
        console.log("  - Original name:", req.file.originalname);
        console.log("  - Path (Cloudinary URL):", req.file.path);
        console.log("  - secure_url:", req.file.secure_url);

        // Determine file URL with fallbacks for different multer-storage-cloudinary versions
        const fileUrl = req.file.path || req.file.secure_url || req.file.url;

        if (!fileUrl) {
            console.log("❌ Cloudinary URL not found on req.file. Full req.file:", req.file);
            return res.status(400).json({ success: false, message: "File upload to Cloudinary failed!" });
        }

        console.log("📊 Creating material in database...");
        const materialData = {
            faculty,
            link: fileUrl,
            subject,
            title,
            branch,
            semester: parseInt(semester)
        };
        console.log("Material data to save:", materialData);

        const material = await Material.create(materialData);
        console.log("✅ Material saved successfully:", material._id);

        res.json({
            success: true,
            message: "Material Added Successfully!",
            material
        });
    } catch (error) {
        console.error("❌ ERROR in addMaterial:", error);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        
        res.status(500).json({ 
            success: false, 
            message: "Internal Server Error",
            details: error.message 
        });
    }
}

// Update material
const updateMaterial = async (req, res) => {
    try {
        let { faculty, link, subject, title, branch, semester } = req.body;
        
        let material = await Material.findByIdAndUpdate(
            req.params.id, 
            {
                faculty,
                link,
                subject,
                title,
                branch,
                semester
            },
            { new: true }
        );
        
        if (!material) {
            return res
                .status(404)
                .json({ success: false, message: "No Material Found!" });
        }
        
        res.json({
            success: true,
            message: "Material Updated Successfully!",
            material
        });
    } catch (error) {
        console.error(error.message);
        console.log(error)
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

const { deleteCloudFile } = require("../../utils/cloudDelete");

// Delete material
const deleteMaterial = async (req, res) => {
    try {
        console.log("🗑️ Deleting material with ID:", req.params.id);
        
        let material = await Material.findByIdAndDelete(req.params.id);
        
        if (!material) {
            return res
                .status(404)
                .json({ success: false, message: "No Material Found!" });
        }
        
        // Delete file from AWS S3 or Cloudinary
        if (material.link) {
            await deleteCloudFile(material.link);
        }
        
        console.log("✅ Material deleted successfully from database");
        
        res.json({
            success: true,
            message: "Material Deleted Successfully!",
            material
        });
    } catch (error) {
        console.error("❌ Error deleting material:", error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}



// Get all materials with filters (for faculty view)
const getAllMaterials = async (req, res) => {
    try {
        const { faculty, subject, branch, semester } = req.query;
        
        let query = {};
        
        if (faculty && faculty !== '') {
            query.faculty = faculty;
        }
        if (subject && subject !== '') {
            query.subject = subject;
        }
        if (branch && branch !== '') {
            query.branch = branch;
        }
        if (semester && semester !== '') {
            query.semester = parseInt(semester);
        }

        const materials = await Material.find(query).sort({ createdAt: -1 });
        
        res.json({
            success: true,
            count: materials.length,
            materials
        });
    } catch (error) {
        console.error("Error fetching all materials:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch materials",
            error: error.message 
        });
    }
}

module.exports = { 
    getMaterial, 
    addMaterial, 
    updateMaterial, 
    deleteMaterial,
    getFacultyMaterials,
    getAllMaterials 
};