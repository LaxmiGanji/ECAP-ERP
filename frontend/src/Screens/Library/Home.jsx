import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Profile from "./Profile";
import AddBook from './AddBook';
import { Toaster } from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import NewsPaper from "./NewsPaper";
import StudentData from "./StudentData";
import FacultyData from "./FacultyData";
import LibraryRAGAssistant from "../Student/LibraryRAGAssistant";

const Home = () => {
  const [selectedMenu, setSelectedMenu] = useState("My Profile");
  const router = useLocation();
  const navigate = useNavigate();
  const [load, setLoad] = useState(false);
  useEffect(() => {
    const activeToken = localStorage.getItem("token");
    if (router.state === null && !activeToken) {
      navigate("/");
    }
    setLoad(true);
  }, [navigate, router.state]);
  return (
    <section>
      {load && (
        <>
          <Navbar />
          <div className="max-w-6xl mx-auto">
            <ul className="flex flex-wrap justify-center items-center gap-4 w-full mx-auto my-8 px-4">
              <li
                className={`text-center rounded-lg px-4 py-3 min-w-[150px] cursor-pointer transition-all duration-300 shadow-sm ${
                  selectedMenu === "My Profile"
                    ? "bg-blue-600 text-white shadow-blue-200"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                }`}
                onClick={() => setSelectedMenu("My Profile")}
              >
                My Profile
              </li>
              <li
                className={`text-center rounded-lg px-4 py-3 min-w-[150px] cursor-pointer transition-all duration-300 shadow-sm ${
                  selectedMenu === "AI RAG Assistant"
                    ? "bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-indigo-200"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                }`}
                onClick={() => setSelectedMenu("AI RAG Assistant")}
              >
                🤖 AI RAG & Web Assistant
              </li>
              <li
                className={`text-center rounded-lg px-4 py-3 min-w-[150px] cursor-pointer transition-all duration-300 shadow-sm ${
                  selectedMenu === "AddBook"
                    ? "bg-blue-600 text-white shadow-blue-200"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                }`}
                onClick={() => setSelectedMenu("AddBook")}
              >
                Add Book
              </li>
              <li
                className={`text-center rounded-lg px-4 py-3 min-w-[150px] cursor-pointer transition-all duration-300 shadow-sm ${
                  selectedMenu === "NewsPaper"
                    ? "bg-blue-600 text-white shadow-blue-200"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                }`}
                onClick={() => setSelectedMenu("NewsPaper")}
              >
                Newspapers
              </li>
              <li
                className={`text-center rounded-lg px-4 py-3 min-w-[150px] cursor-pointer transition-all duration-300 shadow-sm ${
                  selectedMenu === "StudentData"
                    ? "bg-blue-600 text-white shadow-blue-200"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                }`}
                onClick={() => setSelectedMenu("StudentData")}
              >
                Issue / Return
              </li>
              <li
                className={`text-center rounded-lg px-4 py-3 min-w-[150px] cursor-pointer transition-all duration-300 shadow-sm ${
                  selectedMenu === "FacultyData"
                    ? "bg-blue-600 text-white shadow-blue-200"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                }`}
                onClick={() => setSelectedMenu("FacultyData")}
              >
                Faculty Directory
              </li>
            </ul>
            {selectedMenu === "AddBook" && < AddBook />}
            {selectedMenu === "My Profile" && <Profile />}
            {selectedMenu === "AI RAG Assistant" && <LibraryRAGAssistant />}
            {selectedMenu === "NewsPaper" && <NewsPaper />}
            {selectedMenu === "StudentData" && <StudentData />}
            {selectedMenu === "FacultyData" && <FacultyData />}
          </div>
        </>
      )}
      <Toaster position="bottom-center" />
    </section>
  )
}

export default Home