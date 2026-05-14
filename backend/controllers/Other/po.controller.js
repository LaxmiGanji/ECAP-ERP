// controllers/Other/po.controller.js
const PO = require("../../models/Other/po.model");

// Initialize POs (run once)
const initializePOs = async (req, res) => {
  try {
    const pos = [
      {
        poNumber: 'PO1',
        title: 'Engineering knowledge',
        description: 'An ability to apply knowledge of mathematics (including probability, statistics and discrete mathematics), science, and engineering for solving Engineering problems and Knowledge.'
      },
      {
        poNumber: 'PO2',
        title: 'Problem analysis',
        description: 'An ability to design, simulate and conduct experiments, as well as to analyze and interpret data including hardware and software components.'
      },
      {
        poNumber: 'PO3',
        title: 'Design / development of solutions',
        description: 'An ability to design a complex electronic system or process to meet desired specifications and needs.'
      },
      {
        poNumber: 'PO4',
        title: 'Conduct investigations of complex Problem',
        description: 'An ability to identify, formulate, comprehend, analyze, design synthesis of the information to solve complex engineering problems and provide valid conclusions.'
      },
      {
        poNumber: 'PO5',
        title: 'Modern tool usage',
        description: 'An ability to use the techniques, skills and modern engineering tools necessary for engineering practice'
      },
      {
        poNumber: 'PO6',
        title: 'The engineer and society',
        description: 'An understanding of professional, health, safety, legal,'
      },
      {
        poNumber: 'PO7',
        title: 'Environment and sustainability',
        description: 'The broad education necessary to understand the impact of engineering solutions in a global, economic, environmental and demonstrate the knowledge need for sustainable development'
      },
      {
        poNumber: 'PO8',
        title: 'Ethics',
        description: 'Apply ethical principles, responsibility and norms of the engineering practice.'
      },
      {
        poNumber: 'PO9',
        title: 'Individual and team work',
        description: 'An ability to function on multi-disciplinary teams.'
      },
      {
        poNumber: 'PO10',
        title: 'Communication',
        description: 'An ability to communicate and present effectively'
      },
      {
        poNumber: 'PO11',
        title: 'Project management and finance',
        description: 'An ability to use the modern engineering tools, techniques, skills and management principles to do work as a member and leader in a team, to manage projects in multi-disciplinary environments'
      },
      {
        poNumber: 'PO12',
        title: 'Life-long learning',
        description: 'A recognition of the need for, and an ability to engage in, to resolve contemporary issues and acquire lifelong learning'
      }
    ];

    // Clear existing POs and insert new ones
    await PO.deleteMany({});
    const createdPOs = await PO.insertMany(pos);

    res.json({
      success: true,
      message: "POs initialized successfully",
      pos: createdPOs
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

// Get all POs
const getPOs = async (req, res) => {
  try {
    const pos = await PO.find().sort({ poNumber: 1 });
    
    res.json({
      success: true,
      pos
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

module.exports = { initializePOs, getPOs };