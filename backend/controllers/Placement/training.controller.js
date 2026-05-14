const trainingModel = require("../../models/Placement/training.model");

const addTraining = async (req, res) => {
    try {
        const training = await trainingModel.create(req.body);
        res.json({
            success: true,
            message: "Training session added successfully",
            training
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const getTrainings = async (req, res) => {
    try {
        const trainings = await trainingModel.find();
        res.json({
            success: true,
            trainings
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const updateTraining = async (req, res) => {
    try {
        const training = await trainingModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!training) {
            return res.status(404).json({ success: false, message: "Training session not found" });
        }
        res.json({
            success: true,
            message: "Training updated successfully",
            training
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const deleteTraining = async (req, res) => {
    try {
        const training = await trainingModel.findByIdAndDelete(req.params.id);
        if (!training) {
            return res.status(404).json({ success: false, message: "Training session not found" });
        }
        res.json({
            success: true,
            message: "Training deleted successfully"
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const registerForTraining = async (req, res) => {
    try {
        const studentId = req.user.id;
        const trainingId = req.params.id;
        
        const training = await trainingModel.findById(trainingId);
        if (!training) {
            return res.status(404).json({ success: false, message: "Training session not found" });
        }
        
        if (training.registeredStudents.includes(studentId)) {
            return res.status(400).json({ success: false, message: "Already registered" });
        }
        
        training.registeredStudents.push(studentId);
        await training.save();
        
        res.json({
            success: true,
            message: "Registered successfully"
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

module.exports = { addTraining, getTrainings, updateTraining, deleteTraining, registerForTraining };
