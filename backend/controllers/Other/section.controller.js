// section.controller.js
const Section = require('../../models/Other/section.model');
const StudentDetails = require('../../models/Students/details.model');

// Add a new section
const addSection = async (req, res) => {
  try {
    const { name, branch, semester, capacity } = req.body;

    if (!name || !branch || !semester) {
      return res.status(400).json({
        success: false,
        message: "Section name, branch, and semester are required",
      });
    }

    const trimmedName = name.trim();
    const numSemester = Number(semester);

    // Check if section already exists for this branch and semester
    const existing = await Section.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
      branch,
      semester: numSemester,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Section "${trimmedName}" already exists for ${branch} Semester ${numSemester}`,
      });
    }

    const newSection = new Section({
      name: trimmedName,
      branch,
      semester: numSemester,
      capacity: capacity ? Number(capacity) : 60,
    });

    await newSection.save();

    res.status(201).json({
      success: true,
      message: `Section "${trimmedName}" created successfully!`,
      section: newSection,
    });
  } catch (error) {
    console.error("Error adding section:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// Get all sections with optional branch & semester filter + student counts
const getSections = async (req, res) => {
  try {
    const { branch, semester } = req.query;
    let filter = {};

    if (branch && branch !== "-- Select --") {
      filter.branch = branch;
    }
    if (semester && semester !== "-- Select --") {
      filter.semester = Number(semester);
    }

    const sections = await Section.find(filter).sort({ branch: 1, semester: 1, name: 1 });

    // Fetch student counts for each section
    const sectionsWithCounts = await Promise.all(
      sections.map(async (sec) => {
        const studentCount = await StudentDetails.countDocuments({
          branch: sec.branch,
          semester: sec.semester,
          section: sec.name,
        });
        return {
          ...sec.toObject(),
          studentCount,
        };
      })
    );

    res.json({
      success: true,
      sections: sectionsWithCounts,
    });
  } catch (error) {
    console.error("Error getting sections:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// Get section names list for dropdowns (by branch and semester)
const getSectionsByBranchAndSemester = async (req, res) => {
  try {
    const { branch, semester } = req.query;

    let filter = { isActive: true };
    let studentFilter = { section: { $exists: true, $ne: null, $ne: "" } };

    if (branch && branch !== "-- Select --") {
      filter.branch = { $regex: new RegExp(`^${branch.trim()}$`, 'i') };
      studentFilter.branch = { $regex: new RegExp(`^${branch.trim()}$`, 'i') };
    }
    if (semester && semester !== "-- Select --") {
      filter.semester = Number(semester);
      studentFilter.semester = Number(semester);
    }

    const dbSections = await Section.find(filter).sort({ name: 1 });
    const sectionNamesFromDb = dbSections.map((s) => s.name);

    // Also fetch distinct sections assigned to students in database
    const studentSections = await StudentDetails.distinct("section", studentFilter);

    // Combine and deduplicate
    const combinedSet = new Set([...sectionNamesFromDb, ...studentSections.map(s => String(s).trim())]);
    let sectionNames = Array.from(combinedSet).filter(Boolean);

    // Sort alphabetically / numerically
    sectionNames.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    // Default fallback if no dynamic sections exist for this cohort yet
    if (sectionNames.length === 0) {
      sectionNames = ["A", "B", "C", "D"];
    }

    res.json({
      success: true,
      sections: sectionNames,
      rawSections: dbSections,
    });
  } catch (error) {
    console.error("Error getting sections for dropdown:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// Update / Rename section
const updateSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, capacity, isActive } = req.body;

    const targetSection = await Section.findById(id);
    if (!targetSection) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    const oldName = targetSection.name;
    const newName = name ? name.trim() : oldName;

    // Check duplicate if name is changing
    if (newName !== oldName) {
      const duplicate = await Section.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${newName}$`, 'i') },
        branch: targetSection.branch,
        semester: targetSection.semester,
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Section "${newName}" already exists for ${targetSection.branch} Semester ${targetSection.semester}`,
        });
      }

      // Update students assigned to the old section name
      await StudentDetails.updateMany(
        {
          branch: targetSection.branch,
          semester: targetSection.semester,
          section: oldName,
        },
        { $set: { section: newName } }
      );
    }

    targetSection.name = newName;
    if (capacity !== undefined) targetSection.capacity = Number(capacity);
    if (isActive !== undefined) targetSection.isActive = Boolean(isActive);

    await targetSection.save();

    res.json({
      success: true,
      message: `Section updated successfully!`,
      section: targetSection,
    });
  } catch (error) {
    console.error("Error updating section:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// Delete section
const deleteSection = async (req, res) => {
  try {
    const { id } = req.params;

    const targetSection = await Section.findById(id);
    if (!targetSection) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    // Unassign section from students who belong to this deleted section
    await StudentDetails.updateMany(
      {
        branch: targetSection.branch,
        semester: targetSection.semester,
        section: targetSection.name,
      },
      { $unset: { section: "" } }
    );

    await Section.findByIdAndDelete(id);

    res.json({
      success: true,
      message: `Section "${targetSection.name}" deleted successfully!`,
    });
  } catch (error) {
    console.error("Error deleting section:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

module.exports = {
  addSection,
  getSections,
  getSectionsByBranchAndSemester,
  updateSection,
  deleteSection,
};
