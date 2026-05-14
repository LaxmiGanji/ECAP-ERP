const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const PrincipalCredential = require("../../models/Principal/credential.model.js");

const loginHandler = async (req, res) => {
    let { loginid, password } = req.body;
    try {
        let user = await PrincipalCredential.findOne({ loginid });
        if (!user) {
            return res.status(400).json({ success: false, message: "Wrong Credentials" });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ success: false, message: "Wrong Credentials" });
        }
        const token = jwt.sign(
            { id: user.id, loginid: user.loginid, role: 'principal' },
            process.env.JWT_SECRET || "fallback_secret_for_dev_only",
            { expiresIn: '1d' }
        );

        res.json({
            success: true,
            message: "Login Successfull!",
            loginid: user.loginid,
            id: user.id,
            token: token
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

const registerHandler = async (req, res) => {
    let { loginid, password } = req.body;
    try {
        let user = await PrincipalCredential.findOne({ loginid });
        if (user) {
            return res.status(400).json({ success: false, message: "Principal With This LoginId Already Exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        user = await PrincipalCredential.create({ loginid, password: hashedPassword });
        res.json({ success: true, message: "Register Successfull!", loginid: user.loginid });
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

module.exports = { loginHandler, registerHandler }
