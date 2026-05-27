// controllers/Other/subject.controller.js
const Subject = require("../../models/Other/subject.model");
const coattainmentService = require("../../services/coattainment.service");
const { filterSubjectsByStudentRegulation } = require("../../utils/subjectFilter");

const getSubject = async (req, res) => {
    try {
        let subject = await Subject.find().populate('branch', 'name').select('name code sectionTotals semester branch regulation courseOutcomes coPoMappings _id');
        if (!subject || subject.length === 0) {
            return res
                .status(400)
                .json({ success: false, message: "No Subject Available" });
        }
        
        // Filter subjects dynamically according to student regulations
        subject = await filterSubjectsByStudentRegulation(subject);
        const data = {
            success: true,
            message: "All Subject Loaded!",
            subject,
        };
        res.json(data);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

const getSubjectById = async (req, res) => {
    try {
        const { id } = req.params;
        let subject = await Subject.findById(id).populate('branch', 'name').select('name code sectionTotals semester branch regulation courseOutcomes coPoMappings _id');
        if (!subject) {
            return res
                .status(404)
                .json({ success: false, message: "Subject not found" });
        }
        const data = {
            success: true,
            message: "Subject Loaded!",
            subject,
        };
        res.json(data);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

const getSubjectsByBranch = async (req, res) => {
    try {
        const { branchId } = req.params;
        const { semester, regulation } = req.query;
        
        let query = { branch: branchId };
        if (semester) query.semester = Number(semester);
        if (regulation) query.regulation = regulation;

        let subjects = await Subject.find(query).populate('branch', 'name').select('name code sectionTotals semester branch regulation courseOutcomes coPoMappings _id');
        if (!subjects || subjects.length === 0) {
            return res
                .status(400)
                .json({ success: false, message: "No Subjects Available for this Branch" });
        }

        // Filter subjects dynamically according to student regulations
        subjects = await filterSubjectsByStudentRegulation(subjects);
        const data = {
            success: true,
            message: "Subjects Loaded for Branch!",
            subjects,
        };
        res.json(data);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

const updateSubject = async (req, res) => {
    try {
        const { name, code, sectionTotals, semester, branch, regulation, section, total } = req.body;
        
        // Find the existing subject first
        let subject = await Subject.findById(req.params.id);
        if (!subject) {
            return res.status(404).json({ 
                success: false, 
                message: "Subject not found!" 
            });
        }

        // Update basic fields
        if (name !== undefined) subject.name = name;
        if (code !== undefined) subject.code = code;
        if (semester !== undefined) subject.semester = Number(semester);
        if (branch !== undefined) subject.branch = branch;
        if (regulation !== undefined) subject.regulation = regulation;
        
        // Update section totals if provided as array
        if (sectionTotals !== undefined && Array.isArray(sectionTotals)) {
            subject.sectionTotals = sectionTotals;
        }
        
        // Update specific section total if provided
        if (section && total !== undefined) {
            await subject.updateSectionTotal(section, Number(total));
        } else {
            await subject.save();
        }
        
        const updatedSubject = await Subject.findById(req.params.id);
        
        res.json({
            success: true,
            message: "Subject Updated Successfully",
            subject: updatedSubject
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ 
            success: false, 
            message: "Internal Server Error",
            error: error.message 
        });
    }
}

const addSubject = async (req, res) => {
    console.log("Received Data:", req.body);
    let { name, code, sectionTotals, semester, branch, regulation } = req.body;
   
    try {
        // Convert semester to Number
        semester = Number(semester);
        
        let existingSubject = await Subject.findOne({ code });
        if (existingSubject) {
            return res.status(400).json({ success: false, message: "Subject Already Exists" });
        }
        
        // Initialize sectionTotals if not provided
        if (!sectionTotals || !Array.isArray(sectionTotals)) {
            sectionTotals = [];
        }
        
        const subject = await Subject.create({ 
            name, 
            code, 
            sectionTotals,
            semester,
            branch,
            regulation,
            courseOutcomes: [],
            coPoMappings: []
        });
       
        res.json({ 
            success: true, 
            message: "Subject Added!",
            subject
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

const deleteSubject = async (req, res) => {
    try {
        let subject = await Subject.findByIdAndDelete(req.params.id);
        if (!subject) {
            return res
                .status(400)
                .json({ success: false, message: "No Subject Exists!" });
        }
        const data = {
            success: true,
            message: "Subject Deleted!",
        };
        res.json(data);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

// New method to get section total
const getSectionTotal = async (req, res) => {
    try {
        const { subjectId, section } = req.params;
        
        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(404).json({ 
                success: false, 
                message: "Subject not found!" 
            });
        }
        
        const sectionTotal = subject.getSectionTotal(section);
        
        res.json({
            success: true,
            sectionTotal,
            section
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ 
            success: false, 
            message: "Internal Server Error" 
        });
    }
}

// Updated method to update section total with different increment types
const updateSectionTotal = async (req, res) => {
    try {
        const { subjectId } = req.params;
        const { section, total, isIncrement = true, incrementType = 'BY_VALUE' } = req.body;

        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(404).json({ 
                success: false, 
                message: "Subject not found!" 
            });
        }

        // Find the section in sectionTotals
        let sectionObj = subject.sectionTotals.find(sec => sec.section === section);
        
        if (sectionObj) {
            if (isIncrement) {
                if (incrementType === 'BY_ONE') {
                    // Increment by 1 (for manual attendance)
                    sectionObj.total = (sectionObj.total || 0) + 1;
                } else {
                    // Increment by the provided value (for Excel import)
                    sectionObj.total = (sectionObj.total || 0) + Number(total);
                }
            } else {
                // Set absolute value (for first import or override)
                sectionObj.total = Number(total);
            }
        } else {
            // If section not found, add new
            let initialTotal = 0;
            if (isIncrement) {
                if (incrementType === 'BY_ONE') {
                    initialTotal = 1;
                } else {
                    initialTotal = Number(total);
                }
            } else {
                initialTotal = Number(total);
            }
            subject.sectionTotals.push({ section, total: initialTotal });
        }

        await subject.save();

        const updatedSubject = await Subject.findById(subjectId);

        res.json({
            success: true,
            message: `Section ${section} total updated successfully`,
            sectionTotal: sectionObj ? sectionObj.total : Number(total),
            subject: updatedSubject
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ 
            success: false, 
            message: "Internal Server Error",
            error: error.message 
        });
    }
}

// New method for manual attendance - increment by 1 only
const incrementSectionTotalByOne = async (req, res) => {
    try {
        const { subjectId } = req.params;
        const { section } = req.body;

        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(404).json({ 
                success: false, 
                message: "Subject not found!" 
            });
        }

        // Find the section in sectionTotals
        let sectionObj = subject.sectionTotals.find(sec => sec.section === section);
        
        if (sectionObj) {
            // Always increment by 1 for manual attendance
            sectionObj.total = (sectionObj.total || 0) + 1;
        } else {
            // If section not found, create with initial value of 1
            subject.sectionTotals.push({ section, total: 1 });
        }

        await subject.save();

        const updatedSubject = await Subject.findById(subjectId);

        res.json({
            success: true,
            message: `Section ${section} total incremented by 1`,
            sectionTotal: sectionObj ? sectionObj.total : 1,
            subject: updatedSubject
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ 
            success: false, 
            message: "Internal Server Error",
            error: error.message 
        });
    }
}

// Add Course Outcome
const addCourseOutcome = async (req, res) => {
    try {
        const { subjectId } = req.params;
        const { coNumber, description } = req.body;

        if (!coNumber || !description) {
            return res.status(400).json({
                success: false,
                message: "CO Number and Description are required"
            });
        }

        // Validate CO number format
        const coRegex = /^CO\d+$/i;
        if (!coRegex.test(coNumber)) {
            return res.status(400).json({
                success: false,
                message: "CO Number should be in format: CO1, CO2, etc."
            });
        }

        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(404).json({ 
                success: false, 
                message: "Subject not found!" 
            });
        }

        // Check if CO already exists
        const existingCO = subject.courseOutcomes.find(co => 
            co.coNumber.toUpperCase() === coNumber.toUpperCase()
        );

        if (existingCO) {
            // Update existing CO
            existingCO.description = description;
            await subject.save();
            
            res.json({
                success: true,
                message: `Course Outcome ${coNumber} updated successfully`,
                subject: subject
            });
        } else {
            // Add new CO
            subject.courseOutcomes.push({ 
                coNumber: coNumber.toUpperCase(), 
                description 
            });
            await subject.save();
            
            res.json({
                success: true,
                message: `Course Outcome ${coNumber} added successfully`,
                subject: subject
            });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ 
            success: false, 
            message: "Internal Server Error",
            error: error.message 
        });
    }
};

// Delete Course Outcome
const deleteCourseOutcome = async (req, res) => {
    try {
        const { subjectId, coNumber } = req.params;

        if (!coNumber) {
            return res.status(400).json({
                success: false,
                message: "CO Number is required"
            });
        }

        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(404).json({ 
                success: false, 
                message: "Subject not found!" 
            });
        }

        // Check if CO exists
        const coExists = subject.courseOutcomes.find(co => 
            co.coNumber.toUpperCase() === coNumber.toUpperCase()
        );

        if (!coExists) {
            return res.status(404).json({
                success: false,
                message: `Course Outcome ${coNumber} not found`
            });
        }

        // Remove CO
        subject.courseOutcomes = subject.courseOutcomes.filter(
            co => co.coNumber.toUpperCase() !== coNumber.toUpperCase()
        );

        // Remove associated CO-PO mappings
        subject.coPoMappings = subject.coPoMappings.filter(
            mapping => mapping.coNumber.toUpperCase() !== coNumber.toUpperCase()
        );

        await subject.save();

        res.json({
            success: true,
            message: `Course Outcome ${coNumber} deleted successfully`,
            subject: subject
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ 
            success: false, 
            message: "Internal Server Error",
            error: error.message 
        });
    }
};

// Update CO-PO Mapping
const updateCoPoMapping = async (req, res) => {
    try {
        const { subjectId } = req.params;
        const { coNumber, poNumber, strength } = req.body;

        if (!coNumber || !poNumber) {
            return res.status(400).json({
                success: false,
                message: "CO Number and PO Number are required"
            });
        }

        // Validate PO number
        const poRegex = /^PO(1[0-2]|[1-9])$/;
        if (!poRegex.test(poNumber)) {
            return res.status(400).json({
                success: false,
                message: "PO Number should be between PO1 and PO12"
            });
        }

        // Validate strength if provided
        if (strength !== undefined && strength !== null) {
            if (![1, 2, 3].includes(Number(strength))) {
                return res.status(400).json({
                    success: false,
                    message: "Strength must be 1 (Weak), 2 (Medium), or 3 (Strong)"
                });
            }
        }

        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(404).json({ 
                success: false, 
                message: "Subject not found!" 
            });
        }

        // Check if CO exists
        const coExists = subject.courseOutcomes.find(co => 
            co.coNumber.toUpperCase() === coNumber.toUpperCase()
        );

        if (!coExists) {
            return res.status(404).json({
                success: false,
                message: `Course Outcome ${coNumber} not found in this subject`
            });
        }

        // Remove existing mapping for this CO-PO combination
        subject.coPoMappings = subject.coPoMappings.filter(
            mapping => !(
                mapping.coNumber.toUpperCase() === coNumber.toUpperCase() && 
                mapping.poNumber.toUpperCase() === poNumber.toUpperCase()
            )
        );

        // Add new mapping if strength is provided
        if (strength !== null && strength !== undefined) {
            subject.coPoMappings.push({
                coNumber: coNumber.toUpperCase(),
                poNumber: poNumber.toUpperCase(),
                strength: Number(strength)
            });
        }

        await subject.save();

        // Recalculate PO attainments based on new mapping
        const updatedSubject = await Subject.findById(subjectId);
        const poAttainments = await coattainmentService.calculatePOAttainments(updatedSubject);

        res.json({
            success: true,
            message: strength !== null 
                ? `CO-PO mapping updated: ${coNumber} → ${poNumber} (Strength: ${strength})`
                : `CO-PO mapping removed: ${coNumber} → ${poNumber}`,
            subject: updatedSubject,
            poAttainments: poAttainments
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ 
            success: false, 
            message: "Internal Server Error",
            error: error.message 
        });
    }
};

// Get CO-PO Mappings for a subject
const getCoPoMappings = async (req, res) => {
    try {
        const { subjectId } = req.params;

        const subject = await Subject.findById(subjectId)
            .populate('branch', 'name')
            .select('name code semester branch courseOutcomes coPoMappings _id');

        if (!subject) {
            return res.status(404).json({ 
                success: false, 
                message: "Subject not found!" 
            });
        }

        // Create a matrix of CO-PO mappings
        const coPoMatrix = {};
        
        // Initialize all COs in matrix
        subject.courseOutcomes.forEach(co => {
            coPoMatrix[co.coNumber] = {};
            
            // Initialize all POs (PO1 to PO12) with null for this CO
            for (let i = 1; i <= 12; i++) {
                const poNum = `PO${i}`;
                coPoMatrix[co.coNumber][poNum] = null;
            }
        });

        // Fill in existing mappings
        subject.coPoMappings.forEach(mapping => {
            if (coPoMatrix[mapping.coNumber]) {
                coPoMatrix[mapping.coNumber][mapping.poNumber] = mapping.strength;
            }
        });

        res.json({
            success: true,
            message: "CO-PO mappings retrieved successfully",
            subject: {
                _id: subject._id,
                name: subject.name,
                code: subject.code,
                semester: subject.semester,
                branch: subject.branch,
                courseOutcomes: subject.courseOutcomes,
                coPoMappings: subject.coPoMappings
            },
            coPoMatrix: coPoMatrix,
            summary: {
                totalCOs: subject.courseOutcomes.length,
                totalMappings: subject.coPoMappings.length,
                strongMappings: subject.coPoMappings.filter(m => m.strength === 3).length,
                mediumMappings: subject.coPoMappings.filter(m => m.strength === 2).length,
                weakMappings: subject.coPoMappings.filter(m => m.strength === 1).length
            }
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ 
            success: false, 
            message: "Internal Server Error",
            error: error.message 
        });
    }
};

// Get all subjects with CO-PO mappings summary


module.exports = { 
    getSubject, 
    getSubjectById,
    getSubjectsByBranch, 
    addSubject, 
    deleteSubject, 
    updateSubject,
    getSectionTotal,
    updateSectionTotal,
    incrementSectionTotalByOne,
    addCourseOutcome,
    deleteCourseOutcome,
    updateCoPoMapping,
    getCoPoMappings,
};