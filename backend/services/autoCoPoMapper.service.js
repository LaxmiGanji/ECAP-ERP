// services/autoCoPoMapper.service.js
/**
 * Service for Automatic CO-PO Mapping using NLP keyword taxonomy and Bloom's Taxonomy verbs.
 */

const PO_TAXONOMY = {
  PO1: {
    name: 'Engineering Knowledge',
    keywords: [
      'math', 'mathematics', 'calculus', 'linear algebra', 'probability', 'statistics',
      'physics', 'science', 'engineering', 'fundamentals', 'formula', 'equation',
      'calculate', 'compute', 'theoretical', 'concepts', 'principles', 'core', 'basics',
      'algorithm', 'data structure', 'logic', 'model', 'mechanics', 'thermodynamics'
    ],
    strongKeywords: ['calculate', 'compute', 'apply fundamentals', 'derive', 'formulate equation']
  },
  PO2: {
    name: 'Problem Analysis',
    keywords: [
      'analyze', 'analysis', 'identify', 'formulate', 'review', 'research', 'literature',
      'problem', 'decompose', 'evaluate', 'diagnose', 'examine', 'inspect', 'investigate root cause',
      'compare', 'assess', 'classify', 'categorize', 'troubleshoot'
    ],
    strongKeywords: ['analyze', 'evaluate', 'diagnose', 'troubleshoot', 'decompose']
  },
  PO3: {
    name: 'Design / Development of Solutions',
    keywords: [
      'design', 'develop', 'solution', 'synthesis', 'construct', 'architecture', 'build',
      'prototype', 'component', 'process', 'system', 'schema', 'create', 'draft', 'model design',
      'implementation', 'specification', 'interface', 'circuit', 'pipeline', 'workflow'
    ],
    strongKeywords: ['design', 'construct', 'architecture', 'build prototype', 'develop solution']
  },
  PO4: {
    name: 'Conduct Investigations of Complex Problems',
    keywords: [
      'investigate', 'experiment', 'test', 'simulation', 'simulate', 'empirical', 'data analysis',
      'measure', 'interpretation', 'synthesis of information', 'valid conclusion', 'hypothesis',
      'verification', 'validation', 'benchmark', 'testing', 'experimentation'
    ],
    strongKeywords: ['investigate', 'experiment', 'simulate', 'benchmark', 'validate']
  },
  PO5: {
    name: 'Modern Tool Usage',
    keywords: [
      'tool', 'software', 'ide', 'cad', 'matlab', 'simulator', 'framework', 'library',
      'technology', 'automated', 'workbench', 'instrument', 'modern tools', 'git', 'docker',
      'api', 'npm', 'python', 'java', 'react', 'node', 'database', 'cloud', 'vscode'
    ],
    strongKeywords: ['use tool', 'software', 'framework', 'simulator', 'modern tool']
  },
  PO6: {
    name: 'The Engineer and Society',
    keywords: [
      'society', 'public health', 'safety', 'legal', 'cultural', 'societal', 'community',
      'compliance', 'risk', 'standard', 'safety regulation', 'social impact', 'welfare',
      'human factor', 'public policy'
    ],
    strongKeywords: ['public health', 'safety', 'societal impact', 'legal compliance']
  },
  PO7: {
    name: 'Environment and Sustainability',
    keywords: [
      'environment', 'sustainable', 'sustainability', 'green', 'eco', 'carbon',
      'environmental impact', 'renewable', 'energy efficiency', 'waste', 'ecosystem',
      'recycling', 'climate', 'footprint'
    ],
    strongKeywords: ['sustainable', 'sustainability', 'environmental impact', 'green tech']
  },
  PO8: {
    name: 'Ethics',
    keywords: [
      'ethics', 'ethical', 'moral', 'code of conduct', 'plagiarism', 'integrity',
      'professional standards', 'privacy', 'copyright', 'security policy', 'fair use',
      'confidentiality', 'cyber ethics'
    ],
    strongKeywords: ['ethics', 'ethical', 'code of conduct', 'plagiarism', 'integrity']
  },
  PO9: {
    name: 'Individual and Team Work',
    keywords: [
      'team', 'group', 'collaborate', 'collaboration', 'member', 'leader', 'multi-disciplinary',
      'teamwork', 'peer', 'group project', 'role', 'teamwork', 'leadership'
    ],
    strongKeywords: ['teamwork', 'collaborate', 'group project', 'multi-disciplinary team']
  },
  PO10: {
    name: 'Communication',
    keywords: [
      'communicate', 'communication', 'present', 'presentation', 'report', 'document',
      'documentation', 'speak', 'write', 'technical writing', 'summary', 'express',
      'oral', 'written', 'diagram', 'seminar'
    ],
    strongKeywords: ['present', 'technical writing', 'documentation', 'report', 'communicate']
  },
  PO11: {
    name: 'Project Management and Finance',
    keywords: [
      'management', 'project', 'cost', 'finance', 'budget', 'milestone', 'schedule',
      'planning', 'resource', 'estimation', 'agile', 'sprint', 'lifecycle', 'risk management',
      'project plan', 'economic'
    ],
    strongKeywords: ['project management', 'finance', 'budget', 'cost estimation', 'schedule']
  },
  PO12: {
    name: 'Life-long Learning',
    keywords: [
      'lifelong', 'learning', 'modern trends', 'self-directed', 'future tech', 'adaptive',
      'continuous learning', 'emerging technology', 'adapt', 'keep updated', 'self-study',
      'independent learning', 'stay updated'
    ],
    strongKeywords: ['lifelong learning', 'continuous learning', 'self-directed', 'emerging technology']
  }
};

/**
 * Generate mapping strengths for a single CO description across PO1..PO12
 * @param {string} description - The description of the Course Outcome
 * @returns {Object} Mapping object e.g. { PO1: 3, PO2: 2, PO3: null, ... }
 */
function generateAutoCoPoMappingForDescription(description) {
  if (!description || typeof description !== 'string') return {};

  const cleanText = description.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const result = {};

  Object.keys(PO_TAXONOMY).forEach((poNumber) => {
    const { keywords, strongKeywords } = PO_TAXONOMY[poNumber];
    let score = 0;

    // Check standard keywords
    keywords.forEach((keyword) => {
      if (cleanText.includes(keyword.toLowerCase())) {
        score += 1;
      }
    });

    // Check strong keywords for extra weight
    strongKeywords.forEach((strongKw) => {
      if (cleanText.includes(strongKw.toLowerCase())) {
        score += 1.5;
      }
    });

    // Determine strength level (1: Weak, 2: Medium, 3: Strong, null: Not mapped)
    let strength = null;
    if (score >= 3) {
      strength = 3;
    } else if (score >= 2) {
      strength = 2;
    } else if (score >= 1) {
      strength = 1;
    }

    result[poNumber] = strength;
  });

  return result;
}

/**
 * Auto-generate and apply CO-PO mappings for all COs in a subject
 * @param {Object} subjectDoc - Mongoose subject document
 * @returns {Array} Updated coPoMappings array
 */
function autoMapSubject(subjectDoc) {
  if (!subjectDoc || !subjectDoc.courseOutcomes) return [];

  const existingMappingsMap = {};
  // Track existing mappings to avoid overwriting manually customized ones if needed,
  // or regenerate mappings for all COs. Here we build full auto mappings.
  
  const newMappings = [];

  subjectDoc.courseOutcomes.forEach((co) => {
    const autoMappings = generateAutoCoPoMappingForDescription(co.description);
    Object.entries(autoMappings).forEach(([poNumber, strength]) => {
      if (strength !== null && strength !== undefined) {
        newMappings.push({
          coNumber: co.coNumber.toUpperCase(),
          poNumber: poNumber.toUpperCase(),
          strength: strength
        });
      }
    });
  });

  return newMappings;
}

module.exports = {
  PO_TAXONOMY,
  generateAutoCoPoMappingForDescription,
  autoMapSubject
};
