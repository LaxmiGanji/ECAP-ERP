const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const studentCredential = require("../../models/Students/credential.model.js");
const studentDetails = require("../../models/Students/details.model.js");

const loginHandler = async (req, res) => {
    let { loginid, password } = req.body;
    try {
        let user = await studentCredential.findOne({ loginid });
        if (!user) {
            return res
                .status(400)
                .json({ success: false, message: "Wrong Credentials" });
        }
        // Compare hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res
                .status(400)
                .json({ success: false, message: "Wrong Credentials" });
        }
        // Check if student has graduated
        const studentRecord = await studentDetails.findOne({ enrollmentNo: loginid });
        if (studentRecord && studentRecord.isGraduated) {
            return res.status(403).json({
                success: false,
                message: "You have graduated. Please log in to the Alumni Portal."
            });
        }
        const token = jwt.sign(
            { id: user.id, loginid: user.loginid, role: 'student' },
            process.env.JWT_SECRET || "fallback_secret_for_dev_only",
            { expiresIn: '1d' }
        );

        const data = {
            success: true,
            message: "Login Successfull!",
            loginid: user.loginid,
            id: user.id,
            token: token
        };
        res.json(data);
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

const registerHandler = async (req, res) => {
    let { loginid, password } = req.body;
    try {
        let user = await studentCredential.findOne({loginid});
        if (user) {
            return res.status(400).json({
                success: false,
                message: "User With This LoginId Already Exists",
            });
        }
        // Hash password before saving
        const hashedPassword = await bcrypt.hash(password, 10);
        user = await studentCredential.create({
            loginid,
            password: hashedPassword,
        });
        const data = {
            success: true,
            message: "Register Successfull!",
            loginid: user.loginid,
            id: user.id,
        };
        res.json(data);
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

const updateHandler = async (req, res) => {
    try {
        let updateData = { ...req.body };
        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }
        let user = await studentCredential.findByIdAndUpdate(
            req.params.id,
            updateData
        );
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "No User Exists!",
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

const deleteHandler = async (req, res) => {
    try {
        let user = await studentCredential.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "No User Exists!",
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

module.exports = { loginHandler, registerHandler, updateHandler, deleteHandler }