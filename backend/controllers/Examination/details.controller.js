// Examination Details Controller
const examinationDetails = require("../../models/Examination/details.model.js");
const { validatePhoneNumber } = require("../../utils/validation.js");

const getDetails = async (req, res) => {
  try {
    let user = await examinationDetails.find(req.body);
    if (!user || user.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No Examination Records Found" });
    }
    const data = {
      success: true,
      message: "Examination Details Found!",
      user,
    };
    res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const addDetails = async (req, res) => {
  try {
    console.log("Received body:", req.body);
    console.log("Received file:", req.file);
    
    const data = req.body;
    const employeeId = (data.employeeId || "").toString().trim();
    
    if (!employeeId) {
      return res.status(400).json({ success: false, message: "employeeId is required" });
    }

    const { phoneNumber } = data;
    if (!validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({ success: false, message: "Invalid phone number. Must be 10 digits starting with 6-9." });
    }

    let existing = await examinationDetails.findOne({ employeeId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Examination Record With This EmployeeId Already Exists",
      });
    }

    // Prepare the data object for creation
    const detailsData = {
      employeeId: data.employeeId,
      firstName: data.firstName,
      middleName: data.middleName || "",
      lastName: data.lastName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      department: data.department,
      gender: data.gender,
      experience: data.experience || 0,
      post: data.post,
      panCard: data.panCard || "",
      jntuId: data.jntuId || "",
      aicteId: data.aicteId || "",
      batch: data.batch || null,
    };

    // Add profile picture URL if file was uploaded
    if (req.file) {
      detailsData.profile = req.file.path || req.file.secure_url;
      console.log("Profile URL:", detailsData.profile);
    }

    const user = await examinationDetails.create(detailsData);
    
    const response = {
      success: true,
      message: "Examination Details Added!",
      user,
    };
    res.json(response);
  } catch (error) {
    console.error("Error in addDetails:", error);
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

const updateDetails = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (phoneNumber && !validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({ success: false, message: "Invalid phone number. Must be 10 digits starting with 6-9." });
    }
    
    let user = await examinationDetails.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "No Examination Record Found",
      });
    }
    const data = {
      success: true,
      message: "Updated Successfull!",
      user
    };
    res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const deleteDetails = async (req, res) => {
  try {
    let user = await examinationDetails.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "No Examination Record Found",
      });
    }
    const data = {
      success: true,
      message: "Deleted Successfull!",
    };
    res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getCount = async (req, res) => {
  try {
    let count = await examinationDetails.countDocuments(req.body);
    const data = {
      success: true,
      message: "Count Successfull!",
      count,
    };
    res.json(data);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: "Internal Server Error", error });
  }
};

module.exports = { getDetails, addDetails, updateDetails, deleteDetails, getCount };