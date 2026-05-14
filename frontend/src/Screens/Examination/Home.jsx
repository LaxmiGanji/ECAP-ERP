import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { Toaster } from "react-hot-toast";
import Profile from "./Profile";
import AddExaminationFaculty from "./AddExaminationFaculty";
import ViewExaminationFaculty from "./ViewExaminationFaculty"; // Add this import

const Home = () => {
  const router = useLocation();
  const navigate = useNavigate();
  const [selectedMenu, setSelectedMenu] = useState("My Profile");
  const [load, setLoad] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (router.state === null) {
      navigate("/");
    }
    setLoad(true);
  }, [navigate, router.state]);

  const renderContent = () => {
    switch (selectedMenu) {
      case "My Profile":
        return <Profile />;
      case "Add Faculty":
        return <AddExaminationFaculty />;
      case "View Faculty": // Add this case
        return <ViewExaminationFaculty />;
      default:
        return <Profile />;
    }
  };

  return (
    <>
      {load && (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
          <Navbar />
          <Sidebar
            selectedMenu={selectedMenu}
            setSelectedMenu={setSelectedMenu}
            userType="Examination"
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
          />

          {/* Main Content Area */}
          <div className={`transition-all duration-300 ${isSidebarCollapsed ? "md:ml-16" : "md:ml-64"} ml-0`}>
            <div className="p-4 md:p-8">
              {/* Dashboard Header - Show only on Profile or when no specific content */}
              {selectedMenu === "My Profile" && (
                <div className="mb-8">
                  <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 md:px-8 py-6">
                      <h1 className="text-2xl md:text-3xl font-bold text-white">Examination Dashboard</h1>
                      <p className="text-purple-100 mt-2 text-sm md:text-base">
                        Manage Examination Faculty and access examination tools.
                      </p>
                    </div>

                    <div className="p-4 md:p-8">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        <div 
                          onClick={() => setSelectedMenu("Add Faculty")}
                          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-blue-100 text-sm font-medium">Add Faculty</p>
                              <p className="text-lg font-semibold">Add new exam staff</p>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        <div 
                          onClick={() => setSelectedMenu("View Faculty")}
                          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-purple-100 text-sm font-medium">View Faculty</p>
                              <p className="text-lg font-semibold">Manage existing staff</p>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-green-100 text-sm font-medium">Profile</p>
                              <p className="text-lg font-semibold">View Your Details</p>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.761 0 5.346.828 7.379 2.246M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Show different headers for different sections */}
              {selectedMenu === "Add Faculty" && (
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Add New Examination Faculty</h2>
                  <p className="text-gray-600">Fill in the details to add a new faculty member</p>
                </div>
              )}

              {selectedMenu === "View Faculty" && (
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">View Examination Faculty</h2>
                  <p className="text-gray-600">View and manage all examination faculty members</p>
                </div>
              )}

              {/* Content Area - Remove the extra white container for View Faculty since it has its own */}
              {selectedMenu === "View Faculty" ? (
                <ViewExaminationFaculty />
              ) : (
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                  {renderContent()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <Toaster position="bottom-center" />
    </>
  );
};

export default Home;