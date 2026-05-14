const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const transportCredential = require("../../models/Transport/credential.model.js");

const loginHandler = async (req, res) => {
  const { loginid, password } = req.body;
  try {
    const user = await transportCredential.findOne({ loginid });
    if (!user) {
      return res.status(400).json({ success: false, message: "Wrong Credentials" });
    }

    // Compare hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, message: "Wrong Credentials" });
    }

    const token = jwt.sign(
      { id: user.id, loginid: user.loginid, role: 'transport' },
      process.env.JWT_SECRET || "fallback_secret_for_dev_only",
      { expiresIn: '1d' }
    );

    res.json({
      success: true,
      message: "Login Successful!",
      loginid: user.loginid,
      id: user.id,
      token: token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const registerHandler = async (req, res) => {
  const { loginid, password } = req.body;
  try {
    let user = await transportCredential.findOne({ loginid });
    if (user) {
      return res
        .status(400)
        .json({ success: false, message: "Transport Incharge with this Login ID already exists" });
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    user = await transportCredential.create({ loginid, password: hashedPassword });
    res.json({
      success: true,
      message: "Register Successful!",
      loginid: user.loginid,
      id: user.id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const updateHandler = async (req, res) => {
  try {
    let updateData = { ...req.body };
    if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    const user = await transportCredential.findByIdAndUpdate(req.params.id, updateData);
    if (!user) {
      return res.status(400).json({ success: false, message: "No Transport Incharge Exists!" });
    }
    res.json({ success: true, message: "Updated Successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const deleteHandler = async (req, res) => {
  try {
    const user = await transportCredential.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(400).json({ success: false, message: "No Transport Incharge Exists!" });
    }
    res.json({ success: true, message: "Deleted Successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = { loginHandler, registerHandler, updateHandler, deleteHandler };

