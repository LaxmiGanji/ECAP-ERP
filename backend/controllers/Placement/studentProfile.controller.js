const studentProfileModel = require("../../models/Placement/studentProfile.model");

const addOrUpdateProfile = async (req, res) => {
    try {
        const studentId = req.user.id; // from auth middleware
        let profile = await studentProfileModel.findOne({ studentId });
        
        if (profile) {
            profile = await studentProfileModel.findOneAndUpdate({ studentId }, req.body, { new: true });
            return res.json({
                success: true,
                message: "Profile updated successfully",
                profile
            });
        } else {
            const newProfile = { ...req.body, studentId };
            profile = await studentProfileModel.create(newProfile);
            return res.json({
                success: true,
                message: "Profile created successfully",
                profile
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const getProfile = async (req, res) => {
    try {
        const studentId = req.user.id;
        const profile = await studentProfileModel.findOne({ studentId });
        if (!profile) {
            return res.status(404).json({ success: false, message: "Profile not found" });
        }
        res.json({
            success: true,
            profile
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

module.exports = { addOrUpdateProfile, getProfile };
