import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";
import { baseApiURL } from "../../baseUrl";
import { FiAward, FiBook } from "react-icons/fi";

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
  }, [userData?.enrollmentNo]);

  if (loading) {
    return (
      <div className="w-full py-12 flex justify-center items-center">
        <div className="text-center space-y-3">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="text-xs text-slate-500 font-medium">Fetching academic marks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* 🌟 Header Banner */}
      <div className="bento-header-banner flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2 text-slate-900">
            <FiAward className="text-indigo-600" />
            <span>Academic Performance Marks</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">Internal and external examination scores {userData?.semester ? `for Semester ${userData.semester}` : ''}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Internal Marks Bento Card */}
        {internal && Object.keys(internal).length > 0 && (
          <div className="bento-card bg-white border border-slate-200 shadow-sm overflow-hidden rounded-2xl">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FiBook className="text-indigo-600 w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">Internal Marks</h3>
              </div>
              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg text-xs border border-indigo-100">
                Out of 40
              </span>
            </div>
            <div className="p-6 divide-y divide-slate-100">
              {Object.entries(internal).map(([subject, marks], index) => (
                <div
                  key={index}
                  className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0"
                >
                  <span className="text-slate-800 font-semibold text-sm">{subject}</span>
                  <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-3.5 py-1 rounded-full text-xs font-bold shadow-xs">
                    {marks}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* External Marks Bento Card */}
        {external && Object.keys(external).length > 0 && (
          <div className="bento-card bg-white border border-slate-200 shadow-sm overflow-hidden rounded-2xl">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FiAward className="text-purple-600 w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">External Marks</h3>
              </div>
              <span className="px-2.5 py-1 bg-purple-50 text-purple-700 font-bold rounded-lg text-xs border border-purple-100">
                Out of 60
              </span>
            </div>
            <div className="p-6 divide-y divide-slate-100">
              {Object.entries(external).map(([subject, marks], index) => (
                <div
                  key={index}
                  className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0"
                >
                  <span className="text-slate-800 font-semibold text-sm">{subject}</span>
                  <span className="bg-purple-50 text-purple-700 border border-purple-100 px-3.5 py-1 rounded-full text-xs font-bold shadow-xs">
                    {marks}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(!internal || Object.keys(internal).length === 0) && 
         (!external || Object.keys(external).length === 0) && (
          <div className="col-span-full bento-card p-12 text-center bg-white border border-slate-200">
            <FiAward className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-bold text-slate-900">No Marks Available</p>
            <p className="text-xs text-slate-500 font-medium mt-1">Examination scores haven't been published yet for your current semester.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Marks;