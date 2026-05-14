const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const placementCredential = require("../../models/Placement/credential.model.js");

const loginHandler = async (req, res) => {
    let { loginid, password } = req.body;
    try {
        console.log("Login attempt:", loginid, password);
        let user = await placementCredential.findOne({ loginid });
        if (!user) {
            console.log("User not found");
            return res
                .status(400)
                .json({ success: false, message: "Wrong Credentials" });
        }
        // Compare hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            console.log("Password invalid. Expected hash:", user.password);
            return res
                .status(400)
                .json({ success: false, message: "Wrong Credentials" });
        }
        console.log("Login successful");
        const token = jwt.sign(
            { id: user.id, loginid: user.loginid, role: 'placement' },
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
        let user = await placementCredential.findOne({ loginid });
        if (user) {
            return res.status(400).json({
                success: false,
                message: "Placement In-charge With This LoginId Already Exists",
            });
        }
        // Hash password before saving
        const hashedPassword = await bcrypt.hash(password, 10);
        user = await placementCredential.create({
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
        if(req.body.password){
            req.body.password = await bcrypt.hash(req.body.password, 10);
        }
        let user = await placementCredential.findByIdAndUpdate(req.params.id, req.body);
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "No Placement In-charge Exists!",
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
        let user = await placementCredential.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "No Placement In-charge Exists!",
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
