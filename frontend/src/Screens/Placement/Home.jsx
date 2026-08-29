/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { toast, Toaster } from "react-hot-toast";
import axios from "axios";
import { baseApiURL } from "../../baseUrl";

import Companies from "./Companies";
import Drives from "./Drives";
import Applications from "./Applications";
import Training from "./Training";
import Dashboard from "./Dashboard";
import Reports from "./Reports";

const PlacementHome = () => {
  const router = useLocation();
  const navigate = useNavigate();
  const [load, setLoad] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState("Dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    companiesCount: 0,
    drivesCount: 0,
    studentsPlaced: 0,
  });

  useEffect(() => {
    const activeToken = localStorage.getItem("token");
    if (router.state === null && !activeToken) {
      navigate("/");
    }
    setLoad(true);
  }, [navigate, router.state]);

  const renderContent = () => {
    switch (selectedMenu) {
      case "Dashboard":
        return <Dashboard />;
      case "Companies":
        return <Companies />;
      case "Drives":
        return <Drives />;
      case "Applications":
        return <Applications />;
      case "Training":
        return <Training />;
      case "Reports":
        return <Reports />;
      default:
        return <Dashboard />;
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
            userType="Placement" 
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
          />
          
          {/* Main Content Area */}
          <div className={`transition-all duration-300 ${isSidebarCollapsed ? "md:ml-16" : "md:ml-64"} ml-0 pt-20`}>
            <div className="p-4 md:p-8">
              {/* Content Area */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      )}
      <Toaster position="bottom-center" />
    </>
  );
};

export default PlacementHome;
