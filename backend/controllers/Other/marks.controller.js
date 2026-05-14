const Marks = require("../../models/Other/marks.model.js");

const getMarks = async (req, res) => {
    try {
        let Mark = await Marks.find(req.body);
        if (!Mark) {
            return res
                .status(400)
                .json({ success: false, message: "Marks Not Available" });
        }
        const data = {
            success: true,
            message: "All Marks Loaded!",
            Mark,
        };
        res.json(data);
    } catch (error) {
        console.error(error.message);
        console.log(error)
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}
// Get marks by multiple enrollments
const getMarksByEnrollments = async (req, res) => {
    try {
        const { enrollments, subject, examType } = req.body;
        
        if (!enrollments || !Array.isArray(enrollments) || enrollments.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Enrollments array is required" 
            });
        }

        const marks = await Marks.find({ 
            enrollmentNo: { $in: enrollments } 
        });

        // If subject and examType are provided, filter the marks
        let filteredMarks = marks;
        if (subject && examType) {
            const examField = examType === "internal" ? "internal" : "external";
            filteredMarks = marks.filter(mark => 
                mark[examField] && mark[examField][subject] !== undefined
            );
        }

        res.json({ 
            success: true, 
            message: "Marks loaded successfully",
            marks: filteredMarks 
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ 
            success: false, 
            message: "Internal Server Error" 
        });
    }
};
const addMarks = async (req, res) => {
    let { enrollmentNo, internal, external } = req.body;
    try {
        let existingMarks = await Marks.findOne({ enrollmentNo });
        if (existingMarks) {
            if (internal) {
                existingMarks.internal = { ...existingMarks.internal, ...internal }
            }
            if (external) {
                existingMarks.external = { ...existingMarks.external, ...external }
            }
            await existingMarks.save()
            const data = {
                success: true,
                message: "Marks Added!",
            };
            res.json(data);
        } else {
            await Marks.create(req.body);
            const data = {
                success: true,
                message: "Marks Added!",
            };
            res.json(data);
        }
    } catch (error) {
        console.error(error.message);
        console.log(error)
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

const deleteMarks = async (req, res) => {
    try {
        let mark = await Marks.findByIdAndDelete(req.params.id);
        if (!mark) {
            return res
                .status(400)
                .json({ success: false, message: "No Marks Data Exists!" });
        }
        const data = {
            success: true,
            message: "Marks Deleted!",
        };
        res.json(data);
    } catch (error) {
        console.error(error.message);
        console.log(error)
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

module.exports = { getMarks, addMarks, deleteMarks, getMarksByEnrollments }