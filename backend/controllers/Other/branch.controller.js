//branch.controller.js
const Branch = require("../../models/Other/branch.model");
const HODCredential = require("../../models/HOD/credential.model");
const bcrypt = require("bcrypt");

const getBranch = async (req, res) => {
    try {
        let branches = await Branch.find();

        const data = {
            success: true,
            message: "All Branches Loaded!",
            branches,
        };
        res.json(data);
    } catch (error) {
        console.error(error.message);
        console.log(error)
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }

}

const addBranch = async (req, res) => {
    let { name } = req.body;
    try {
        let branch = await Branch.findOne({ name });
        if (branch) {
            const data = {
                success: false,
                message: "Already Exists!",
            };
            res.status(400).json(data);
        } else {
            const newBranch = await Branch.create(req.body);
            
            // Auto-create HOD Credential
            const loginid = `hod_${newBranch.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
            const hashedPassword = await bcrypt.hash('hod123', 10);
            await HODCredential.create({
              loginid,
              password: hashedPassword,
              branch: newBranch.name
            });

            const data = {
                success: true,
                message: "Branch Added and HOD created!",
            };
            res.json(data);
        }
    } catch (error) {
        console.error(error.message);
        console.log(error)
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

const deleteBranch = async (req, res) => {
    try {
        let mark = await Branch.findByIdAndDelete(req.params.id);
        if (!mark) {
            return res
                .status(400)
                .json({ success: false, message: "No Branch Data Exists!" });
        }

        // Delete HOD Credential
        const loginid = `hod_${mark.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        await HODCredential.findOneAndDelete({ loginid });

        const data = {
            success: true,
            message: "Branch and HOD Deleted!",
        };
        res.json(data);
    } catch (error) {
        console.error(error.message);
        console.log(error)
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

module.exports = { getBranch, addBranch, deleteBranch }