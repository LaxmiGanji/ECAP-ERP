const studentProfileModel = require("../../models/Placement/studentProfile.model");
const studentDetailsModel = require("../../models/Students/details.model");

const addOrUpdateProfile = async (req, res) => {
    try {
        const studentId = req.user.id;
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
        const studentId = req.user?.id;
        const loginid = req.user?.loginid;
        
        let profile = (await studentProfileModel.findOne({ studentId }).lean()) || {};
        let studentDetail = (await studentDetailsModel.findOne({ enrollmentNo: loginid }).lean()) || {};

        const mergedProfile = {
            enrollmentNo: studentDetail.enrollmentNo || profile.enrollmentNo || loginid || "N/A",
            branch: studentDetail.branch || profile.branch || "N/A",
            tenthPercentage: studentDetail.tenthPercentage !== undefined ? studentDetail.tenthPercentage : profile.tenthPercentage,
            twelfthPercentage: studentDetail.twelfthPercentage !== undefined ? studentDetail.twelfthPercentage : profile.twelfthPercentage,
            cgpa: studentDetail.cgpa !== undefined ? studentDetail.cgpa : profile.cgpa,
            activeBacklogs: studentDetail.activeBacklogs !== undefined ? studentDetail.activeBacklogs : (profile.activeBacklogs || 0),
            resumeLink: studentDetail.resumeLink || profile.resumeLink || "",
            linkedinLink: studentDetail.linkedinLink || profile.linkedinLink || profile.githubLink || "",
        };

        res.json({
            success: true,
            profile: mergedProfile
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

module.exports = { addOrUpdateProfile, getProfile };
