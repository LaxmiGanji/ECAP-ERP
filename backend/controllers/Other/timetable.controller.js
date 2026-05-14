// timetable.controller.js
const Timetable = require("../../models/Other/timetable.model");

const getTimetable = async (req, res) => {
    try {
        const { branch, semester, section } = req.body;

        if (!branch || !semester || !section) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        let timetable = await Timetable.findOne({ branch, semester, section }).sort({ createdAt: -1 });

        if (timetable) {
            res.json({ success: true, timetable: [timetable] });
        } else {
            res.status(404).json({ success: false, message: "Timetable Not Found" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const addTimetable = async (req, res) => {
    const { semester, branch, section, schedule, metadata } = req.body;
    
    try {
        // Parse the schedule data if it's a string
        let parsedSchedule;
        try {
            parsedSchedule = typeof schedule === 'string' ? JSON.parse(schedule) : schedule;
        } catch (parseError) {
            console.error("Error parsing schedule:", parseError);
            return res.status(400).json({ success: false, message: "Invalid schedule format" });
        }

        // Validate parsedSchedule is an array
        if (!Array.isArray(parsedSchedule)) {
            return res.status(400).json({ success: false, message: "Schedule must be an array" });
        }

        // Check if timetable already exists
        let timetable = await Timetable.findOne({ semester, branch, section });
        
        if (timetable) {
            // Update existing timetable
            timetable = await Timetable.findByIdAndUpdate(
                timetable._id,
                {
                    semester,
                    branch,
                    section,
                    schedule: parsedSchedule,
                    metadata: metadata || {}
                },
                { new: true }
            );
            
            const data = {
                success: true,
                message: "Timetable Updated Successfully!",
                timetable: timetable
            };
            res.json(data);
        } else {
            // Create new timetable
            const newTimetable = await Timetable.create({
                semester,
                branch,
                section,
                schedule: parsedSchedule,
                metadata: metadata || {}
            });
            
            const data = {
                success: true,
                message: "Timetable Added Successfully!",
                timetable: newTimetable
            };
            res.json(data);
        }
    } catch (error) {
        console.log("Error in addTimetable:", error);
        res.status(500).json({ success: false, message: "Internal Server Error: " + error.message });
    }
};

const deleteTimetable = async (req, res) => {
    try {
        let timetable = await Timetable.findByIdAndDelete(req.params.id);
        if (!timetable) {
            return res
                .status(400)
                .json({ success: false, message: "No Timetable Exists!" });
        }
        const data = {
            success: true,
            message: "Timetable Deleted!",
        };
        res.json(data);
    } catch (error) {
        console.error(error.message);
        console.log(error)
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const editTimetable = async (req, res) => {
    try {
        const { id } = req.params;
        const { semester, branch, section, schedule, metadata } = req.body;

        if (!id || !semester || !branch || !section || !schedule) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        // Parse the schedule data
        let parsedSchedule;
        try {
            parsedSchedule = typeof schedule === 'string' ? JSON.parse(schedule) : schedule;
        } catch (parseError) {
            console.error("Error parsing schedule:", parseError);
            return res.status(400).json({ success: false, message: "Invalid schedule format" });
        }

        const updatedTimetable = await Timetable.findByIdAndUpdate(
            id,
            {
                semester,
                branch,
                section,
                schedule: parsedSchedule,
                metadata: metadata || {}
            },
            { new: true }
        );

        if (!updatedTimetable) {
            return res.status(404).json({ success: false, message: "Timetable not found" });
        }

        res.json({ 
            success: true, 
            message: "Timetable updated successfully",
            timetable: updatedTimetable
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

module.exports = { getTimetable, addTimetable, deleteTimetable, editTimetable };