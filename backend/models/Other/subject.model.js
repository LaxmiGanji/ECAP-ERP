// models/Other/subject.model.js
const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
  },
  // Course Outcomes for this subject
  courseOutcomes: [{
    coNumber: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    attainment: {
      type: Number,
      default: 0,
      min: 0,
      max: 3
    }
  }],
  // CO-PO Mapping with strength levels
  coPoMappings: [{
    coNumber: {
      type: String,
      required: true
    },
    poNumber: {
      type: String,
      required: true,
      enum: ['PO1', 'PO2', 'PO3', 'PO4', 'PO5', 'PO6', 'PO7', 'PO8', 'PO9', 'PO10', 'PO11', 'PO12', 'PSO1', 'PSO2', 'PSO3']
    },
    strength: {
      type: Number,
      enum: [1, 2, 3],
      default: 1
    }
  }],
  // PO Attainments (calculated from CO attainments and mappings)
  poAttainments: [{
    poNumber: {
      type: String,
      required: true,
      enum: ['PO1', 'PO2', 'PO3', 'PO4', 'PO5', 'PO6', 'PO7', 'PO8', 'PO9', 'PO10', 'PO11', 'PO12', 'PSO1', 'PSO2', 'PSO3']
    },
    attainment: {
      type: Number,
      default: 0,
      min: 0,
      max: 3
    }
  }],
  // Section-wise tracking
  sectionTotals: [{
    section: {
      type: String,
      required: true
    },
    total: {
      type: Number,
      required: true,
      default: 0
    }
  }],
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8,
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
    required: true,
  },
  regulation: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
}, { timestamps: true });

// Method to get total for a specific section
subjectSchema.methods.getSectionTotal = function(section) {
  const sectionData = this.sectionTotals.find(s => s.section === section);
  return sectionData ? sectionData.total : 0;
};

// Method to update total for a specific section
subjectSchema.methods.updateSectionTotal = function(section, newTotal) {
  const sectionIndex = this.sectionTotals.findIndex(s => s.section === section);
  if (sectionIndex >= 0) {
    this.sectionTotals[sectionIndex].total = newTotal;
  } else {
    this.sectionTotals.push({ section, total: newTotal });
  }
  return this.save();
};

// Method to add course outcome
subjectSchema.methods.addCourseOutcome = function(coNumber, description) {
  // Check if CO already exists
  const existingCO = this.courseOutcomes.find(co => co.coNumber === coNumber);
  if (existingCO) {
    existingCO.description = description;
  } else {
    this.courseOutcomes.push({ coNumber, description });
  }
  return this.save();
};

// Method to delete course outcome
subjectSchema.methods.deleteCourseOutcome = function(coNumber) {
  this.courseOutcomes = this.courseOutcomes.filter(co => co.coNumber !== coNumber);
  // Also remove associated CO-PO mappings
  this.coPoMappings = this.coPoMappings.filter(mapping => mapping.coNumber !== coNumber);
  return this.save();
};

// Method to update CO-PO mapping
subjectSchema.methods.updateCoPoMapping = function(coNumber, poNumber, strength) {
  // Remove existing mapping for this CO-PO combination
  this.coPoMappings = this.coPoMappings.filter(
    mapping => !(mapping.coNumber === coNumber && mapping.poNumber === poNumber)
  );
  
  // Add new mapping if strength is provided (if not, it means remove mapping)
  if (strength) {
    this.coPoMappings.push({
      coNumber,
      poNumber,
      strength
    });
  }
  
  return this.save();
};

// Method to get all POs mapped to a specific CO
subjectSchema.methods.getMappedPOsForCO = function(coNumber) {
  return this.coPoMappings
    .filter(mapping => mapping.coNumber === coNumber)
    .map(mapping => ({
      poNumber: mapping.poNumber,
      strength: mapping.strength
    }));
};

// Method to get all COs mapped to a specific PO
subjectSchema.methods.getMappedCOsForPO = function(poNumber) {
  return this.coPoMappings
    .filter(mapping => mapping.poNumber === poNumber)
    .map(mapping => ({
      coNumber: mapping.coNumber,
      strength: mapping.strength
    }));
};

// Virtual for overall total (maximum of all sections)
subjectSchema.virtual('total').get(function() {
  const totals = Array.isArray(this.sectionTotals) ? this.sectionTotals : [];
  return totals.length > 0 
    ? Math.max(...totals.map(s => s.total)) 
    : 0;
});

// Ensure virtuals are included in JSON output
subjectSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model("Subject", subjectSchema);