const Marks = require("../../models/Other/marks.model.js");
const StudentDetails = require("../../models/Students/details.model");
const NotificationService = require("../../services/notification.service");

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
            await existingMarks.save();
        } else {
            await Marks.create(req.body);
        }

        // Trigger automated results notification in background
        (async () => {
            try {
                const settings = await NotificationService.getSettings();
                if (settings.autoResultAlert) {
                    const student = await StudentDetails.findOne({ enrollmentNo });
                    if (student) {
                        const parentLink = NotificationService.generateParentLink(student.enrollmentNo);
                        
                        let marksSummary = "";
                        if (internal) {
                            marksSummary = Object.entries(internal).map(([sub, val]) => `${sub}: ${val}`).join(", ");
                        } else if (external) {
                            marksSummary = Object.entries(external).map(([sub, val]) => `${sub}: ${val}`).join(", ");
                        }

                        const text = settings.resultsTemplate
                            .replace(/{student_name}/g, `${student.firstName || ''} ${student.lastName || ''}`.trim())
                            .replace(/{exam_type}/g, internal ? "Internal Assessment" : "Semester End Exams")
                            .replace(/{marks_summary}/g, marksSummary)
                            .replace(/{portal_link}/g, parentLink);

                        const referenceId = `MARKS_${internal ? "INT" : "EXT"}_${Date.now()}`;

                        if (settings.smsEnabled) {
                            NotificationService.sendAlert({ student, type: "RESULTS", content: text, channel: "SMS", referenceId });
                        }
                        if (settings.whatsappEnabled) {
                            NotificationService.sendAlert({ student, type: "RESULTS", content: text, channel: "WHATSAPP", referenceId });
                        }
                        if (settings.emailEnabled) {
                            NotificationService.sendAlert({ student, type: "RESULTS", content: text, channel: "EMAIL", referenceId });
                        }
                    }
                }
            } catch (err) {
                console.error("Error triggering auto result notification:", err);
            }
        })();

        res.json({
            success: true,
            message: "Marks Added!",
        });
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