const companyModel = require("../../models/Placement/company.model");

const addCompany = async (req, res) => {
    try {
        const company = await companyModel.create(req.body);
        res.json({
            success: true,
            message: "Company added successfully",
            company
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const getCompanies = async (req, res) => {
    try {
        const companies = await companyModel.find();
        res.json({
            success: true,
            companies
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const updateCompany = async (req, res) => {
    try {
        const company = await companyModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!company) {
            return res.status(404).json({ success: false, message: "Company not found" });
        }
        res.json({
            success: true,
            message: "Company updated successfully",
            company
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const deleteCompany = async (req, res) => {
    try {
        const company = await companyModel.findByIdAndDelete(req.params.id);
        if (!company) {
            return res.status(404).json({ success: false, message: "Company not found" });
        }
        res.json({
            success: true,
            message: "Company deleted successfully"
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

module.exports = { addCompany, getCompanies, updateCompany, deleteCompany };
