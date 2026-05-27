const studentDetails = require("../models/Students/details.model.js");

/**
 * Filters a list of subjects so that for any branch and semester:
 * - If there are active students, we only keep subjects matching those students' regulations.
 * - If there are no students, we keep all subjects for that branch and semester.
 */
const filterSubjectsByStudentRegulation = async (subjects) => {
  try {
    // 1. Get unique (branch, semester, regulation) from active students
    const studentRegs = await studentDetails.aggregate([
      {
        $group: {
          _id: { branch: "$branch", semester: "$semester" },
          regulations: { $addToSet: "$regulation" }
        }
      }
    ]);

    // 2. Create a lookup map: branch_semester -> array of regulations
    const lookup = {};
    studentRegs.forEach(item => {
      if (item._id && item._id.branch) {
        const key = `${item._id.branch.trim().toLowerCase()}_${item._id.semester}`;
        lookup[key] = item.regulations || [];
      }
    });

    // 3. Filter subjects
    return subjects.filter(subject => {
      // Get branch name from populated branch object, or fallback to branch if string
      const branchName = subject.branch?.name || (typeof subject.branch === 'string' ? subject.branch : null);
      if (!branchName) return true; // Keep if no branch name is available

      const key = `${branchName.trim().toLowerCase()}_${subject.semester}`;
      const studentRegulations = lookup[key];

      // If no students exist for this branch and semester, keep the subject
      if (!studentRegulations || studentRegulations.length === 0) {
        return true;
      }

      // If subject has no regulation defined, keep it to be safe, otherwise match
      return !subject.regulation || studentRegulations.includes(subject.regulation);
    });
  } catch (error) {
    console.error("Error filtering subjects by student regulation:", error);
    return subjects; // Fallback to original subjects on error
  }
};

module.exports = {
  filterSubjectsByStudentRegulation
};
