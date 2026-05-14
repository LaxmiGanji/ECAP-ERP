const placementDetails = require("../../models/Placement/details.model");

const addDetails = async (req, res) => {
    try {
        let user = await placementDetails.findOne({ employeeId: req.body.employeeId });
        if (user) {
            return res.status(400).json({
                success: false,
                message: "Details With This EmployeeId Already Exists",
            });
        }
        user = await placementDetails.create(req.body);
        const data = {
            success: true,
            message: "Details Added Successfull!",
            user,
        };
        res.json(data);
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

const getDetails = async (req, res) => {
    try {
        let user = await placementDetails.find();
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "No Placement In-charge Details Found",
            });
        }
        const data = {
            success: true,
            message: "Details Found!",
            user,
        };
        res.json(data);
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

const updateDetails = async (req, res) => {
    try {
        let user = await placementDetails.findByIdAndUpdate(req.params.id, req.body);
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "No Placement In-charge Details Found",
            });
        }
        const data = {
            success: true,
            message: "Details Updated Successfull!",
        };
        res.json(data);
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

const deleteDetails = async (req, res) => {
    try {
        let user = await placementDetails.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "No Placement In-charge Details Found",
            });
        }
        const data = {
            success: true,
            message: "Details Deleted Successfull!",
        };
        res.json(data);
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

module.exports = { addDetails, getDetails, updateDetails, deleteDetails }
