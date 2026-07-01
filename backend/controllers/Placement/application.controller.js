const applicationModel = require("../../models/Placement/application.model");
const StudentDetail = require("../../models/Students/details.model");
const StudentCredential = require("../../models/Students/credential.model");
const studentProfileModel = require("../../models/Placement/studentProfile.model");

const addApplication = async (req, res) => {
    try {
        // Get student detail ID from the authenticated user
        // Based on your auth middleware, the user might be stored differently
        let studentDetailId = req.user?.studentDetailId;
        
        // If user is from credential model, find the corresponding student detail
        if (req.user?.loginid && !studentDetailId) {
            const studentDetail = await StudentDetail.findOne({ 
                enrollmentNo: req.user.loginid 
            });
            if (studentDetail) {
                studentDetailId = studentDetail._id;
            } else {
                studentDetailId = req.user?.id;
            }
        } else if (!studentDetailId) {
            studentDetailId = req.user?.id;
        }
        
        if (!studentDetailId) {
            return res.status(400).json({
                success: false,
                message: "Student not found"
            });
        }
        
        const applicationData = {
            ...req.body,
            student: studentDetailId
        };
        
        const application = await applicationModel.create(applicationData);
        
        // Populate the created application
        const populatedApplication = await applicationModel.findById(application._id)
            .populate({
                path: "student",
                model: "Student Detail",
                select: "enrollmentNo firstName middleName lastName email branch semester batch phoneNumber"
            })
            .populate("drive", "title companyName");
            
        res.json({
            success: true,
            message: "Application submitted successfully",
            application: populatedApplication
        });
    } catch (error) {
        console.log(error);
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                message: "You have already applied for this drive" 
            });
        }
        res.status(500).json({ 
            success: false, 
            message: "Internal Server Error",
            error: error.message 
        });
    }
};

const getApplicationsForDrive = async (req, res) => {
    try {
        console.log("Fetching applications for drive:", req.params.driveId);
        
        const applications = await applicationModel.find({ drive: req.params.driveId })
            .populate({
                path: "student",
                model: "Student Detail",
                select: "enrollmentNo firstName middleName lastName email branch semester batch phoneNumber"
            })
            .populate("drive", "title companyName")
            .sort({ createdAt: -1 });
        
        console.log("Found applications:", applications.length);
        
        // Fetch placement profiles to get resume links
        const enrollmentNos = applications
            .map(app => app.student?.enrollmentNo)
            .filter(Boolean);
            
        const profiles = await studentProfileModel.find({ enrollmentNo: { $in: enrollmentNos } });
        
        // Map profiles by enrollmentNo for fast lookup
        const profileMap = {};
        profiles.forEach(p => {
            profileMap[p.enrollmentNo] = p.resumeLink;
        });
        
        // Attach resumeLink to each student object
        const applicationsWithResume = applications.map(app => {
            const appObj = app.toObject();
            if (appObj.student && appObj.student.enrollmentNo) {
                appObj.student.resumeLink = profileMap[appObj.student.enrollmentNo] || null;
            }
            return appObj;
        });
        
        // Log first application to debug
        if (applicationsWithResume.length > 0) {
            console.log("Sample application student data (with resume):", applicationsWithResume[0].student);
        }
            
        res.json({
            success: true,
            applications: applicationsWithResume
        });
    } catch (error) {
        console.error("Error in getApplicationsForDrive:", error);
        res.status(500).json({ 
            success: false, 
            message: "Internal Server Error",
            error: error.message 
        });
    }
};

const updateApplicationStatus = async (req, res) => {
    try {
        const { status, offerLetterLink, feedback } = req.body;
        const application = await applicationModel.findByIdAndUpdate(
            req.params.id, 
            { status, offerLetterLink, feedback }, 
            { new: true }
        ).populate({
            path: "student",
            model: "Student Detail",
            select: "enrollmentNo firstName lastName email"
        }).populate("drive", "title companyName");
        
        if (!application) {
            return res.status(404).json({ 
                success: false, 
                message: "Application not found" 
            });
        }
        
        const appObj = application.toObject();
        if (appObj.student && appObj.student.enrollmentNo) {
            const profile = await studentProfileModel.findOne({ enrollmentNo: appObj.student.enrollmentNo });
            appObj.student.resumeLink = profile ? profile.resumeLink : null;
        }
        
        res.json({
            success: true,
            message: "Application updated successfully",
            application: appObj
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ 
            success: false, 
            message: "Internal Server Error" 
        });
    }
};

const getStudentApplications = async (req, res) => {
    try {
        // Get student detail ID from authenticated user
        let studentDetailId = req.user?.studentDetailId;
        
        // If user is from credential model, find the corresponding student detail
        if (req.user?.loginid && !studentDetailId) {
            const studentDetail = await StudentDetail.findOne({ 
                enrollmentNo: req.user.loginid 
            });
            if (studentDetail) {
                studentDetailId = studentDetail._id;
            } else {
                studentDetailId = req.user?.id;
            }
        } else if (!studentDetailId) {
            studentDetailId = req.user?.id;
        }
        
        console.log("Student Detail ID:", studentDetailId);
        
        if (!studentDetailId) {
            return res.status(404).json({
                success: true,
                applications: [],
                message: "No applications found"
            });
        }
        
        const applications = await applicationModel.find({ student: studentDetailId })
            .populate("drive", "title companyName description eligibilityCriteria applicationDeadline")
            .sort({ createdAt: -1 });
        
        console.log(`Found ${applications.length} applications for student`);
            
        res.json({
            success: true,
            applications
        });
    } catch (error) {
        console.error("Error in getStudentApplications:", error);
        res.status(500).json({ 
            success: false, 
            message: "Internal Server Error",
            error: error.message 
        });
    }
};

const getApplicationById = async (req, res) => {
    try {
        const application = await applicationModel.findById(req.params.id)
            .populate({
                path: "student",
                model: "Student Detail",
                select: "enrollmentNo firstName lastName email branch semester batch phoneNumber"
            })
            .populate("drive", "title companyName description eligibilityCriteria applicationDeadline");
            
        if (!application) {
            return res.status(404).json({ 
                success: false, 
                message: "Application not found" 
            });
        }
        
        const appObj = application.toObject();
        if (appObj.student && appObj.student.enrollmentNo) {
            const profile = await studentProfileModel.findOne({ enrollmentNo: appObj.student.enrollmentNo });
            appObj.student.resumeLink = profile ? profile.resumeLink : null;
        }
        
        res.json({
            success: true,
            application: appObj
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ 
            success: false, 
            message: "Internal Server Error" 
        });
    }
};

const deleteApplication = async (req, res) => {
    try {
        const application = await applicationModel.findByIdAndDelete(req.params.id);
        
        if (!application) {
            return res.status(404).json({ 
                success: false, 
                message: "Application not found" 
            });
        }
        
        res.json({
            success: true,
            message: "Application deleted successfully"
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ 
            success: false, 
            message: "Internal Server Error" 
        });
    }
};

module.exports = { 
    addApplication, 
    getApplicationsForDrive, 
    updateApplicationStatus, 
    getStudentApplications,
    getApplicationById,
    deleteApplication
};