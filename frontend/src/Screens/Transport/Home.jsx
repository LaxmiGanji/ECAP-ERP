import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navbar from "../../components/Navbar";
import ManageRoutes from "./ManageRoutes";
import Profile from "./Profile";
import RouteAllocations from "./RouteAllocations"; // Add this import
import QrScanner from "./QrScanner";

const Home = () => {
  const router = useLocation();
  const navigate = useNavigate();
  const [load, setLoad] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState("My Profile");

  useEffect(() => {
    if (!router.state) {
      navigate("/");
    } else {
      setLoad(true);
    }
  }, [navigate, router.state]);

  return (
    <>
      {load && (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
          <Navbar />
          <div className="max-w-7xl mx-auto py-6 md:py-10 px-2 md:px-4">
            <div className="flex flex-wrap gap-2 md:gap-4 justify-center mb-6 md:mb-8">
              {["My Profile", "Manage Routes", "View Allocations", "QrScanner"].map((menu) => (
                <button
                  key={menu}
                  onClick={() => setSelectedMenu(menu)}
                  className={`px-4 md:px-6 py-2 md:py-3 rounded-full text-sm md:text-base font-semibold shadow transition whitespace-nowrap ${
                    selectedMenu === menu
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {menu}
                </button>
              ))}
            </div>

            {selectedMenu === "My Profile" && <Profile />}
            {selectedMenu === "Manage Routes" && <ManageRoutes />}
            {selectedMenu === "View Allocations" && <RouteAllocations />}
            {selectedMenu === "QrScanner" && <QrScanner />}
          </div>
        </div>
      )}
      <Toaster position="bottom-center" />
    </>
  );
};

export default Home;