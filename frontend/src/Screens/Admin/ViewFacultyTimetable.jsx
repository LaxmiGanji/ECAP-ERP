// ViewFacultyTimetable.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { baseApiURL } from '../../baseUrl';
import toast from 'react-hot-toast';

const ViewFacultyTimetable = ({ facultyId }) => {
  const [timetable, setTimetable] = useState({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
  });
  const [loading, setLoading] = useState(true);
  const [facultyInfo, setFacultyInfo] = useState({
    name: '',
    department: '',
    employeeId: ''
  });


  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    if (facultyId) {
      loadFacultyTimetable();
    }
  }, [facultyId]);

  const loadFacultyTimetable = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${baseApiURL()}/faculty/details/getDetails`, { 
        employeeId: facultyId 
      });

      
      if (response.data.success && response.data.user[0]) {
        const faculty = response.data.user[0];
        setFacultyInfo({
          name: `${faculty.firstName} ${faculty.middleName ? faculty.middleName + " " : ""}${faculty.lastName}`,
          department: faculty.department,
          employeeId: faculty.employeeId
      });

        // Initialize empty timetable structure
        const newTimetable = {
          Monday: [],
          Tuesday: [],
          Wednesday: [],
          Thursday: [],
          Friday: [],
          Saturday: [],
        };

        // Populate with data if exists
        if (faculty.timetable && Array.isArray(faculty.timetable)) {
          faculty.timetable.forEach(dayData => {
            if (dayData.day && dayData.periods) {
              newTimetable[dayData.day] = dayData.periods;
            }
          });
        }

        setTimetable(newTimetable);
      } else {
        toast.error("No timetable data found for this faculty");
      }
    } catch (error) {
      console.error("Error loading faculty timetable:", error);
      toast.error("Failed to load faculty timetable");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format time (e.g., "09:00" -> "9:00 AM")
  const formatTime = (timeString) => {
    if (!timeString) return '';
    
    try {
      const [hours, minutes] = timeString.split(':');
      const hourNum = parseInt(hours, 10);
      const period = hourNum >= 12 ? 'PM' : 'AM';
      const displayHour = hourNum % 12 || 12;
      
      return `${displayHour}:${minutes} ${period}`;
    } catch (e) {
      return timeString; // Return original if formatting fails
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      {/* Faculty Info Header */}
      <div className="bg-blue-50 px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">
          {facultyInfo.name || 'Faculty Timetable'}
        </h2>
        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
          <div>
            <span className="font-medium">Employee ID:</span> {facultyInfo.employeeId || 'N/A'}
          </div>
          <div>
            <span className="font-medium">Department:</span> {facultyInfo.department || 'N/A'}
          </div>
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Day
              </th>
              {Array.from({ 
                length: Math.max(...daysOfWeek.map(day => timetable[day].length), 1) 
              }).map((_, i) => (
                <th 
                  key={i} 
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Period {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {daysOfWeek.map((day) => (
              <tr key={day} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                  {day}
                </td>
                {timetable[day].map((period, index) => (
                  <td key={index} className="px-6 py-4 whitespace-nowrap">
                    {period.subject ? (
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <div className="font-medium text-sm text-gray-900">
                          {period.subject}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {period.branch} - Sem {period.semester} Sec {period.section}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {formatTime(period.startTime)} - {formatTime(period.endTime)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm italic">No class scheduled</div>
                    )}
                  </td>
                ))}
                {/* Fill empty cells if no periods */}
                {Array.from({ 
                  length: Math.max(0, Math.max(...daysOfWeek.map(d => timetable[d].length)) - timetable[day].length) 
                }).map((_, i) => (
                  <td key={`empty-${i}`} className="px-6 py-4">
                    <div className="text-gray-400 text-sm italic">-</div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {Object.values(timetable).every(day => day.length === 0) && (
        <div className="p-8 text-center text-gray-500">
          <svg 
            className="mx-auto h-12 w-12 text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1} 
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No timetable found</h3>
          <p className="mt-1 text-sm text-gray-500">
            This faculty member doesn't have any scheduled classes yet.
          </p>
        </div>
      )}
    </div>
  );
};

export default ViewFacultyTimetable;