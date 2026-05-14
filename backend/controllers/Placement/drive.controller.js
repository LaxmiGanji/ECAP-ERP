const driveModel = require("../../models/Placement/drive.model");
const studentProfileModel = require("../../models/Placement/studentProfile.model");

const addDrive = async (req, res) => {
    try {
        const drive = await driveModel.create(req.body);
        res.json({
            success: true,
            message: "Drive added successfully",
            drive
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const getDrives = async (req, res) => {
    try {
        const drives = await driveModel.find().populate("company");
        res.json({
            success: true,
            drives
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const updateDrive = async (req, res) => {
    try {
        const drive = await driveModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!drive) {
            return res.status(404).json({ success: false, message: "Drive not found" });
        }
        res.json({
            success: true,
            message: "Drive updated successfully",
            drive
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const deleteDrive = async (req, res) => {
    try {
        const drive = await driveModel.findByIdAndDelete(req.params.id);
        if (!drive) {
            return res.status(404).json({ success: false, message: "Drive not found" });
        }
        res.json({
            success: true,
            message: "Drive deleted successfully"
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const getEligibleStudents = async (req, res) => {
    try {
        const drive = await driveModel.findById(req.params.id);
        if (!drive) {
            return res.status(404).json({ success: false, message: "Drive not found" });
        }
        
        const criteria = drive.eligibilityCriteria;
        let query = {};
        
        if (criteria.minCGPA) query.cgpa = { $gte: criteria.minCGPA };
        if (criteria.maxBacklogs !== undefined) query.activeBacklogs = { $lte: criteria.maxBacklogs };
        if (criteria.allowedBranches && criteria.allowedBranches.length > 0) {
            query.branch = { $in: criteria.allowedBranches };
        }
        if (criteria.min10thPercentage) query.tenthPercentage = { $gte: criteria.min10thPercentage };
        if (criteria.min12thPercentage) query.twelfthPercentage = { $gte: criteria.min12thPercentage };

        const eligibleStudents = await studentProfileModel.find(query).populate("studentId", "loginid");
        
        res.json({
            success: true,
            eligibleStudents
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

module.exports = { addDrive, getDrives, updateDrive, deleteDrive, getEligibleStudents };
