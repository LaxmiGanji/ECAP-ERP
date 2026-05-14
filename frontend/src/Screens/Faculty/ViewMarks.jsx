import axios from "axios";
import { useEffect, useState } from "react";
import Heading from "../../components/Heading";
import toast from "react-hot-toast";
import { BiArrowBack } from "react-icons/bi";
import { baseApiURL } from "../../baseUrl";

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
                // Combine the data
                const combinedData = studentsResponse.data.user.map((student) => {
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
    <div className="w-full mx-auto flex justify-center items-start flex-col my-10">
      <div className="relative flex justify-between items-center w-full">
        <Heading title={`View Marks`} />
        <button
          className="absolute right-2 flex justify-center items-center border-2 border-red-500 px-3 py-2 rounded text-red-500"
          onClick={() => setShowViewMarks(false)}
        >
          <span className="mr-2">
            <BiArrowBack className="text-red-500" />
          </span>
          Back
        </button>
      </div>
      <div className="mt-10 w-full flex justify-evenly items-center gap-x-6">
        <div className="w-full">
          <label htmlFor="branch" className="leading-7 text-base">
            Select Branch
          </label>
          <select
            id="branch"
            className={`px-2 py-3 rounded-sm text-base w-full mt-1 ${lockedBranch ? 'bg-gray-100 cursor-not-allowed' : 'bg-blue-50'}`}
            value={filter.branch}
            disabled={!!lockedBranch}
            onChange={(e) => setFilter({ ...filter, branch: e.target.value })}
          >
            <option defaultValue>-- Select --</option>
            {branch &&
              branch.length > 0 &&
              branch.map((branch) => (
                <option value={branch.name} key={branch.name}>
                  {branch.name}
                </option>
              ))}
          </select>
        </div>
        <div className="w-full">
          <label htmlFor="semester" className="leading-7 text-base">
            Select Semester
          </label>
          <select
            id="semester"
            className="px-2 bg-blue-50 py-3 rounded-sm text-base w-full mt-1"
            value={filter.semester}
            onChange={(e) => setFilter({ ...filter, semester: e.target.value })}
          >
            <option defaultValue>-- Select --</option>
            {[...Array(8).keys()].map((i) => (
              <option value={i + 1} key={i}>
                {i + 1} Semester
              </option>
            ))}
          </select>
        </div>
      </div>
      <button
        className="bg-blue-500 px-6 py-3 mt-8 mx-auto rounded text-white"
        onClick={loadMarksData}
      >
        Load Marks Data
      </button>

      {studentData.length > 0 && (
        <div className="w-full mt-8 overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2">Enrollment No</th>
                <th className="border border-gray-300 p-2">Name</th>
                <th className="border border-gray-300 p-2">Subject</th>
                <th className="border border-gray-300 p-2">Internal Marks</th>
                <th className="border border-gray-300 p-2">External Marks</th>
              </tr>
            </thead>
            <tbody>
              {studentData.map((student) => {
                // Get all unique subjects from internal and external marks
                const internalSubjects = student.internal ? Object.keys(student.internal) : [];
                const externalSubjects = student.external ? Object.keys(student.external) : [];
                const allSubjects = [...new Set([...internalSubjects, ...externalSubjects])];

                if (allSubjects.length === 0) {
                  return (
                    <tr key={student.enrollmentNo}>
                      <td className="border border-gray-300 p-2">{student.enrollmentNo}</td>
                      <td className="border border-gray-300 p-2">
                        {student.firstName} {student.lastName}
                      </td>
                      <td colSpan="3" className="border border-gray-300 p-2 text-center">
                        No marks available
                      </td>
                    </tr>
                  );
                }

                return allSubjects.map((subject, index) => (
                  <tr key={`${student.enrollmentNo}-${subject}`}>
                    {index === 0 && (
                      <>
                        <td
                          rowSpan={allSubjects.length}
                          className="border border-gray-300 p-2"
                        >
                          {student.enrollmentNo}
                        </td>
                        <td
                          rowSpan={allSubjects.length}
                          className="border border-gray-300 p-2"
                        >
                          {student.firstName} {student.middleName} {student.lastName}
                        </td>
                      </>
                    )}
                    <td className="border border-gray-300 p-2">{subject}</td>
                    <td className="border border-gray-300 p-2">
                      {student.internal?.[subject] || "-"}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {student.external?.[subject] || "-"}
                    </td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ViewMarks;