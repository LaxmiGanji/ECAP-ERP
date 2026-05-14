const transportDetails = require("../../models/Transport/details.model.js");
const { validatePhoneNumber, validateEmail } = require("../../utils/validation.js");

const getDetails = async (req, res) => {
  try {
    const user = await transportDetails.find(req.body);
    if (!user) {
      return res.status(400).json({ success: false, message: "No Transport Incharge Found" });
    }
    res.json({ success: true, message: "Transport details found!", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const addDetails = async (req, res) => {
  try {
    const { phoneNumber, email } = req.body;
    if (!validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number. Must be 10 digits starting with 6-9.",
      });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format." });
    }

    const requiredFields = ["transportId", "firstName", "lastName", "email", "phoneNumber", "gender"];
    const missing = requiredFields.filter((field) => !req.body[field]);
    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(", ")}`,
      });
    }

    let user = await transportDetails.findOne({ transportId: req.body.transportId });
    if (user) {
      return res
        .status(400)
        .json({ success: false, message: "Transport Incharge with this ID already exists." });
    }

    user = await transportDetails.create(req.body);
    res.json({ success: true, message: "Transport details added!", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

const deleteDetails = async (req, res) => {
  try {
    const user = await transportDetails.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(400).json({ success: false, message: "No Transport Incharge Found" });
    }
    res.json({ success: true, message: "Deleted Successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getCount = async (_req, res) => {
  try {
    const user = await transportDetails.count();
    res.json({ success: true, message: "Count Successful!", user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error", error });
  }
};

module.exports = { getDetails, addDetails, deleteDetails, getCount };
//