const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const alumniCredential = require("../../models/Alumni/credential.model.js");

const loginHandler = async (req, res) => {
    let { loginid, password } = req.body;
    try {
        let user = await alumniCredential.findOne({ loginid });
        if (!user) {
            return res.status(400).json({ success: false, message: "Wrong Credentials" });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ success: false, message: "Wrong Credentials" });
        }
        const token = jwt.sign(
            { id: user.id, loginid: user.loginid, role: 'alumni' },
            process.env.JWT_SECRET || "fallback_secret_for_dev_only",
            { expiresIn: '7d' }
        );
        res.json({
            success: true,
            message: "Login Successful!",
            loginid: user.loginid,
            enrollmentNo: user.enrollmentNo,
            id: user.id,
            token: token
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

module.exports = { loginHandler };
