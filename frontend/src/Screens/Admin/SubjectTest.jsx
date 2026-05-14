import { useEffect, useState } from "react";
import axios from "axios";
import { baseApiURL } from "../../baseUrl";
import toast from "react-hot-toast";

const SubjectTest = () => {
  const [subjects, setSubjects] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [filteredSubjects, setFilteredSubjects] = useState([]);

  useEffect(() => {
    // Load all subjects
    axios
      .get(`${baseApiURL()}/subject/getSubject`)
      .then((response) => {
        if (response.data.success) {
          setSubjects(response.data.subject);
          setFilteredSubjects(response.data.subject);
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      });

    // Load all branches
    axios
      .get(`${baseApiURL()}/branch/getBranch`)
      .then((response) => {
        if (response.data.success) {
          setBranches(response.data.branches);
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      });
  }, []);

  const handleBranchChange = (e) => {
    const branchId = e.target.value;
    setSelectedBranch(branchId);

    if (branchId) {
      // Filter subjects by selected branch
      const filtered = subjects.filter(subject => subject.branch?._id === branchId);
      setFilteredSubjects(filtered);
    } else {
      // Show all subjects if no branch is selected
      setFilteredSubjects(subjects);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6">
            <h1 className="text-2xl font-bold text-white">Subject-Branch Relationship Test</h1>
            <p className="text-blue-100 text-sm">Test the new subject-branch relationship functionality</p>
          </div>

          <div className="p-8">
            <div className="mb-6">
              <label htmlFor="branchSelect" className="block text-sm font-medium text-gray-700 mb-2">
                Select Branch to Filter Subjects
              </label>
              <select
                id="branchSelect"
                value={selectedBranch}
                onChange={handleBranchChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Branches</option>
                {branches.map((branch) => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Subjects {selectedBranch ? `for Selected Branch` : `(All Branches)`}
              </h2>
              <div className="grid gap-4">
                {filteredSubjects.map((subject) => (
                  <div
                    key={subject._id}
                    className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {subject.code} - {subject.name}
                        </h3>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Branch: {subject.branch?.name || 'N/A'}
                          </span>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                            Semester: {subject.semester}
                          </span>
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                            Classes: {subject.total}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {filteredSubjects.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No subjects found for the selected criteria.
                </div>
              )}
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Summary</h3>
              <div className="text-sm text-blue-700">
                <p>Total Subjects: {subjects.length}</p>
                <p>Filtered Subjects: {filteredSubjects.length}</p>
                <p>Selected Branch: {selectedBranch ? branches.find(b => b._id === selectedBranch)?.name : 'All Branches'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectTest; 