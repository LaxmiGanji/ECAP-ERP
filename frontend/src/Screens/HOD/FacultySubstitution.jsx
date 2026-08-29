import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { baseApiURL } from '../../baseUrl';
import MyFacultyTimeTable from '../Faculty/MyFacultyTimeTable';
import { FiSearch, FiUser } from 'react-icons/fi';

const FacultySubstitution = ({ branch }) => {
  const [faculties, setFaculties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFaculties();
  }, []);

  const fetchFaculties = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseApiURL()}/faculty/details/getDetails2`);
      if (response.data.success) {
        setFaculties(response.data.faculties || []);
      }
    } catch (error) {
      console.error("Error fetching faculties:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFaculties = faculties.filter(f => {
    const matchesBranch = !branch || f.department === branch || f.branch === branch;
    const fullName = `${f.firstName || ''} ${f.middleName || ''} ${f.lastName || ''}`.toLowerCase();
    const empId = (f.employeeId || '').toLowerCase();
    const query = searchTerm.toLowerCase();
    const matchesSearch = fullName.includes(query) || empId.includes(query);
    return matchesBranch && matchesSearch;
  });

  return (
    <div className="p-4 md:p-8">
      {!selectedFaculty ? (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Faculty Substitution Management</h2>
            <p className="text-gray-500 mb-8">Search for a faculty member to manage their substitutions and timetable augmentation.</p>
            
            <div className="relative mb-8">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
              <input
                type="text"
                placeholder="Search by name or Employee ID..."
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
                {filteredFaculties.map(faculty => (
                  <div
                    key={faculty.employeeId}
                    onClick={() => setSelectedFaculty(faculty)}
                    className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-blue-50 cursor-pointer transition-all border border-transparent hover:border-blue-200 group"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <FiUser className="text-xl" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{faculty.firstName} {faculty.lastName}</p>
                      <p className="text-sm text-gray-500">{faculty.employeeId} • {faculty.department}</p>
                    </div>
                  </div>
                ))}
                {filteredFaculties.length === 0 && (
                  <div className="col-span-full py-10 text-center text-gray-400">
                    No faculty found matching your search.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          <button
            onClick={() => setSelectedFaculty(null)}
            className="mb-6 flex items-center text-blue-600 font-bold hover:text-blue-800 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Search
          </button>
          
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold">Viewing Timetable: {selectedFaculty.firstName} {selectedFaculty.lastName}</h3>
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs">HOD Management Mode</span>
            </div>
            <MyFacultyTimeTable facultyId={selectedFaculty.employeeId} isHODView={true} />
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultySubstitution;
