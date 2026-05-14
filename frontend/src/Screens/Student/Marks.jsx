import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";
import Heading from "../../components/Heading";
import { baseApiURL } from "../../baseUrl";

const Marks = () => {
  const userData = useSelector((state) => state.userData);
  const [internal, setInternal] = useState();
  const [external, setExternal] = useState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.enrollmentNo) return;

    setLoading(true);
    const headers = {
      "Content-Type": "application/json",
    };
    
    axios
      .post(
        `${baseApiURL()}/marks/getMarks`,
        { enrollmentNo: userData.enrollmentNo },
        { headers }
      )
      .then((response) => {
        setLoading(false);
        if (response.data.success && response.data.Mark && response.data.Mark.length > 0) {
          const marksData = response.data.Mark[0];
          setInternal(marksData.internal || {});
          setExternal(marksData.external || {});
        } else {
          setInternal(null);
          setExternal(null);
        }
      })
      .catch((error) => {
        setLoading(false);
        console.log(error);
        toast.error("Failed to load marks");
      });
  }, [userData.enrollmentNo]);

  if (loading) {
    return (
      <div className="w-full mx-auto mt-10 flex justify-center items-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading marks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto mt-10 flex justify-center items-start flex-col mb-10 px-4">
      <Heading title={`Marks for Semester ${userData.semester || ''}`} />
      
      <div className="mt-8 w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        {internal && Object.keys(internal).length > 0 && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <h3 className="text-xl font-semibold text-white">
                Internal Marks (Out of 40)
              </h3>
            </div>
            <div className="p-6">
              {Object.entries(internal).map(([subject, marks], index) => (
                <div
                  key={index}
                  className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0"
                >
                  <span className="text-gray-700 font-medium">{subject}</span>
                  <span className="bg-blue-100 text-blue-800 px-4 py-1 rounded-full font-semibold">
                    {marks}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {external && Object.keys(external).length > 0 && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
              <h3 className="text-xl font-semibold text-white">
                External Marks (Out of 60)
              </h3>
            </div>
            <div className="p-6">
              {Object.entries(external).map(([subject, marks], index) => (
                <div
                  key={index}
                  className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0"
                >
                  <span className="text-gray-700 font-medium">{subject}</span>
                  <span className="bg-purple-100 text-purple-800 px-4 py-1 rounded-full font-semibold">
                    {marks}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(!internal || Object.keys(internal).length === 0) && 
         (!external || Object.keys(external).length === 0) && (
          <div className="col-span-2 text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
            <svg 
              className="w-16 h-16 text-gray-400 mx-auto mb-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
              />
            </svg>
            <p className="text-lg text-gray-600">No marks available at the moment</p>
            <p className="text-sm text-gray-500 mt-2">Check back later or contact your faculty</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Marks;