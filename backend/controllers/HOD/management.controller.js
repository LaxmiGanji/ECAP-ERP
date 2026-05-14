const FacultyDetail = require("../../models/Faculty/details.model.js");
const StudentDetail = require("../../models/Students/details.model.js");
const Notice = require("../../models/Other/notice.model.js");

// Faculty Management (Branch Specific)
const getBranchFaculty = async (req, res) => {
  try {
    const { branch } = req.params;
    const faculties = await FacultyDetail.find({ department: branch });
    res.json({ success: true, faculties });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Student Management (Branch Specific)
const getBranchStudents = async (req, res) => {
  try {
    const { branch } = req.params;
    const students = await StudentDetail.find({ branch: branch });
    res.json({ success: true, students });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Notices (Branch Specific)
const getBranchNotices = async (req, res) => {
  try {
    const { branch } = req.params;
    const notices = await Notice.find({ $or: [{ branch: branch }, { branch: "All" }] });
    res.json({ success: true, notices });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  getBranchFaculty,
  getBranchStudents,
  getBranchNotices
};
