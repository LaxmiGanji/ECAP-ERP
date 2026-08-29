import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { BiArrowBack } from "react-icons/bi";
import { baseApiURL } from "../../baseUrl";
import { sortEnrollmentNo } from "../../utils/enrollmentSorter";

const ViewMarks = ({ setShowViewMarks, branch: lockedBranch }) => {
  const [studentData, setStudentData] = useState([]);
  const [branch, setBranch] = useState([]);
  const [filter, setFilter] = useState({
    branch: lockedBranch || "-- Select --",
    semester: "-- Select --",
  });

  const getBranchData = () => {
    const headers = { "Content-Type": "application/json" };
    axios
      .get(`${baseApiURL()}/branch/getBranch`, { headers })
      .then((response) => {
        if (response.data.success) {
          setBranch(response.data.branches);
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        console.error(error);
        toast.error(error.message);
      });
  };

  const loadMarksData = () => {
    if (filter.branch === "-- Select --" || filter.semester === "-- Select --") {
      toast.error("Please select branch and semester");
      return;
    }

    toast.loading("Loading Marks Data");
    const headers = { "Content-Type": "application/json" };

    // First get all marks
    axios
      .post(`${baseApiURL()}/marks/getMarks`, {}, { headers })
      .then((marksResponse) => {
        if (marksResponse.data.success) {
          // Then get students for the selected branch and semester
          axios
            .post(
              `${baseApiURL()}/student/details/getDetails`,
              { branch: filter.branch, semester: filter.semester },
              { headers }
            )
            .then((studentsResponse) => {
              toast.dismiss();
              if (studentsResponse.data.success) {
                // Combine and sort student data by enrollment number
                const rawStudents = studentsResponse.data.user || [];
                const sortedStudents = sortEnrollmentNo(rawStudents);

                const combinedData = sortedStudents.map((student) => {
                  const studentMarks = marksResponse.data.Mark.find(
                    (mark) => mark.enrollmentNo === student.enrollmentNo
                  );
                  return {
                    ...student,
                    internal: studentMarks?.internal || {},
                    external: studentMarks?.external || {},
                  };
                });
                setStudentData(combinedData);
              } else {
                toast.error(studentsResponse.data.message);
              }
            })
            .catch((error) => {
              toast.dismiss();
              console.error(error);
              toast.error(error.message);
            });
        } else {
          toast.dismiss();
          toast.error(marksResponse.data.message);
        }
      })
      .catch((error) => {
        toast.dismiss();
        console.error(error);
        toast.error(error.message);
      });
  };

  useEffect(() => {
    getBranchData();
  }, []);

  return (
    <div className="w-full space-y-6 p-2 md:p-4">
      {/* Header */}
      <div className="bento-header-banner flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900">View Published Marks</h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">Review internal and external examination scores for students</p>
        </div>
        <button
          className="flex items-center space-x-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
          onClick={() => setShowViewMarks(false)}
        >
          <BiArrowBack className="text-indigo-600" />
          <span>Back to Manage</span>
        </button>
      </div>

      {/* Filter Bento Card */}
      <div className="bento-card p-6 bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="branch" className="block text-xs font-bold text-slate-600 mb-1">
              Select Branch
            </label>
            <select
              id="branch"
              className={`w-full ${lockedBranch ? 'bg-slate-100 cursor-not-allowed text-slate-500' : ''}`}
              value={filter.branch}
              disabled={!!lockedBranch}
              onChange={(e) => setFilter({ ...filter, branch: e.target.value })}
            >
              <option>-- Select --</option>
              {branch &&
                branch.length > 0 &&
                branch.map((b) => (
                  <option value={b.name} key={b.name}>
                    {b.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label htmlFor="semester" className="block text-xs font-bold text-slate-600 mb-1">
              Select Semester
            </label>
            <select
              id="semester"
              className="w-full"
              value={filter.semester}
              onChange={(e) => setFilter({ ...filter, semester: e.target.value })}
            >
              <option>-- Select --</option>
              {[...Array(8).keys()].map((i) => (
                <option value={i + 1} key={i}>
                  Semester {i + 1}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
            onClick={loadMarksData}
          >
            Load Marks Data
          </button>
        </div>
      </div>

      {/* Marks Table */}
      {studentData.length > 0 && (
        <div className="bento-card p-0 bg-white border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-xs font-bold uppercase tracking-wider">
                  <th className="p-4 border-b border-slate-800">Enrollment No</th>
                  <th className="p-4 border-b border-slate-800">Student Name</th>
                  <th className="p-4 border-b border-slate-800">Subject</th>
                  <th className="p-4 border-b border-slate-800 text-center">Internal Marks</th>
                  <th className="p-4 border-b border-slate-800 text-center">External Marks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {studentData.map((student) => {
                  const internalSubjects = student.internal ? Object.keys(student.internal) : [];
                  const externalSubjects = student.external ? Object.keys(student.external) : [];
                  const allSubjects = [...new Set([...internalSubjects, ...externalSubjects])];

                  if (allSubjects.length === 0) {
                    return (
                      <tr key={student.enrollmentNo} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-mono font-bold text-indigo-600">{student.enrollmentNo}</td>
                        <td className="p-4 font-semibold text-slate-900">
                          {[student.firstName, student.middleName, student.lastName].filter(Boolean).join(" ")}
                        </td>
                        <td colSpan="3" className="p-4 text-center italic text-slate-400">
                          No marks available
                        </td>
                      </tr>
                    );
                  }

                  return allSubjects.map((subject, index) => (
                    <tr key={`${student.enrollmentNo}-${subject}`} className="hover:bg-slate-50/80 transition-colors">
                      {index === 0 && (
                        <>
                          <td
                            rowSpan={allSubjects.length}
                            className="p-4 font-mono font-bold text-indigo-600 border-r border-slate-100 align-top"
                          >
                            {student.enrollmentNo}
                          </td>
                          <td
                            rowSpan={allSubjects.length}
                            className="p-4 font-semibold text-slate-900 border-r border-slate-100 align-top"
                          >
                            {[student.firstName, student.middleName, student.lastName].filter(Boolean).join(" ")}
                          </td>
                        </>
                      )}
                      <td className="p-4 font-medium text-slate-800">{subject}</td>
                      <td className="p-4 text-center font-bold text-emerald-600">
                        {student.internal?.[subject] !== undefined ? student.internal[subject] : "-"}
                      </td>
                      <td className="p-4 text-center font-bold text-blue-600">
                        {student.external?.[subject] !== undefined ? student.external[subject] : "-"}
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewMarks;