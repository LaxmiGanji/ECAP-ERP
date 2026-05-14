const adminDetails = require("../../models/Admin/details.model.js")
const { validatePhoneNumber, validateEmail } = require("../../utils/validation.js");

const getDetails = async (req, res) => {
    try {
        let user = await adminDetails.find(req.body);
        if (!user) {
            return res
                .status(400)
                .json({ success: false, message: "No Admin Found" });
        }
        const data = {
            success: true,
            message: "Admin Details Found!",
            user,
        };
        res.json(data);
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

const addDetails = async (req, res) => {
    try {
        const { phoneNumber, email } = req.body;
        if (!validatePhoneNumber(phoneNumber)) {
            return res.status(400).json({ success: false, message: "Invalid phone number. Must be 10 digits starting with 6-9." });
        }
        if (!validateEmail(email)) {
            return res.status(400).json({ success: false, message: "Invalid email format." });
        }
        console.log('File object:', JSON.stringify(req.file, null, 2));
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        let user = await adminDetails.findOne({ employeeId: req.body.employeeId });
        if (user) {
            return res.status(400).json({
                success: false,
                message: "Admin With This EmployeeId Already Exists",
            });
        }
        const profileFilename = req.file ? req.file.path : null;
        user = await adminDetails.create({ ...req.body, profile: profileFilename });
        const data = {
            success: true,
            message: "Admin Details Added!",
            user,
        };
        res.json(data);
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: "Internal Server Error1" });
    }
}

const updateDetails = async (req, res) => {
    try {
        const { phoneNumber, email } = req.body;
        if (phoneNumber && !validatePhoneNumber(phoneNumber)) {
            return res.status(400).json({ success: false, message: "Invalid phone number. Must be 10 digits starting with 6-9." });
        }
        if (email && !validateEmail(email)) {
            return res.status(400).json({ success: false, message: "Invalid email format." });
        }
        let user;
        if (req.file) {
            user = await adminDetails.findByIdAndUpdate(req.params.id, { ...req.body, profile: req.file.path });
        } else {
            user = await adminDetails.findByIdAndUpdate(req.params.id, req.body);
        }
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "No Admin Found",
            });
        }
        const data = {
            success: true,
            message: "Updated Successfull!",
        };
        res.json(data);
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}


const deleteDetails = async (req, res) => {
    try {
        let user = await adminDetails.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "No Admin Found",
            });
        }
        const data = {
            success: true,
            message: "Deleted Successfull!",
        };
        res.json(data);
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

const getCount = async (req, res) => {
    try {
        let user = await studentDetails.count(req.body);
        const data = {
            success: true,
            message: "Count Successfull!",
            user,
        };
        res.json(data);
    } catch (error) {
        res
            .status(500)
            .json({ success: false, message: "Internal Server Error", error });
    }
}

module.exports = { getDetails, addDetails, updateDetails, deleteDetails, getCount }