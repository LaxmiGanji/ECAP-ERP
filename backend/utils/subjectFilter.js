/**
 * Utility function for subjects.
 * Returns the subjects list without dropping any user-added subjects.
 */
const filterSubjectsByStudentRegulation = async (subjects) => {
  return subjects || [];
};

module.exports = {
  filterSubjectsByStudentRegulation
};
