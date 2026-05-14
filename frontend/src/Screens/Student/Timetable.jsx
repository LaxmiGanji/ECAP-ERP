import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { baseApiURL } from "../../baseUrl";
import { useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";

const Timetable = () => {
  const [student, setStudent] = useState(null);
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingTimetable, setFetchingTimetable] = useState(false);

  const router = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        const headers = {
          "Content-Type": "application/json",
        };
        const response = await axios.post(
          `${baseApiURL()}/${router.state.type}/details/getDetails`,
          { enrollmentNo: router.state.loginid },
          { headers }
        );
        if (response.data.success) {
          const userData = response.data.user[0];
          setStudent(userData);
          fetchTimetable(userData);
        } else {
          toast.error(response.data.message);
        }
      } catch (error) {
        console.error(error);
        toast.error("Error fetching student details.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [dispatch, router.state.loginid, router.state.type]);

  const fetchTimetable = async (studentData) => {
    if (!studentData || !studentData.branch || !studentData.semester) return;

    try {
      setFetchingTimetable(true);
      const response = await axios.post(`${baseApiURL()}/timetable/getTimetable`, {
        branch: studentData.branch,
        semester: studentData.semester,
        section: studentData.section, // Default to section A if not specified
      });

      if (response.data.success && response.data.timetable.length > 0) {
        setTimetable(response.data.timetable[0]);
      } else {
        setTimetable(null);
        toast.error("No timetable found for your branch and semester");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error fetching timetable");
    } finally {
      setFetchingTimetable(false);
    }
  };

  const maxPeriods = () => {
    if (!timetable) return 0;
    return Math.max(...timetable.schedule.map(day => day.periods.length));
  };

  if (loading || fetchingTimetable) {
    return (
      <div className="min-h-screen p-4 bg-gray-100 flex items-center justify-center">
        <h2 className="text-xl font-semibold">Loading...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gray-100">
      <h2 className="text-2xl font-bold mb-4 text-center">Your Timetable</h2>

      {student && (
        <div className="mb-4 text-center">
          <p className="text-lg">
            <span className="font-semibold">Branch:</span> {student.branch} |{" "}
            <span className="font-semibold">Semester:</span> {student.semester} |{" "}
            <span className="font-semibold">Section:</span> {student.section} | {" "}
          </p>
        </div>
      )}

      {timetable ? (
        <div className="overflow-x-auto w-full mt-6">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr>
                <th className="px-4 py-2 border">Day</th>
                {Array.from({ length: maxPeriods() }).map((_, i) => (
                  <th key={i} className="px-4 py-2 border">Period {i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timetable.schedule.map((dayEntry) => (
                <tr key={dayEntry.day}>
                  <td className="px-4 py-2 border font-semibold text-center">{dayEntry.day}</td>
                  {Array.from({ length: maxPeriods() }).map((_, i) => {
                    const period = dayEntry.periods[i];
                    return (
                      <td key={i} className="px-4 py-2 border text-sm text-center">
                        {period ? (
                          <>
                            <div><strong>{period.subject}</strong></div>
                            <div>{period.faculty.firstName} {period.faculty.middleName} {period.faculty.lastName}</div>
                            <div>{period.startTime} - {period.endTime}</div>
                          </>
                        ) : (
                          "-"
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !loading && (
          <div className="text-center text-gray-600">
            <p>No timetable available for your branch and semester.</p>
          </div>
        )
      )}
    </div>
  );
};

export default Timetable;