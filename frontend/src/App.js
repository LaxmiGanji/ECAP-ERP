import Login from "./components/Login";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { Provider } from "react-redux";
import mystore from "./redux/store";
import StudentHome from "./Screens/Student/Home";
import FacultyHome from "./Screens/Faculty/Home";
import AdminHome from "./Screens/Admin/Home";
import LibraryHome from "./Screens/Library/Home";
import TransportHome from "./Screens/Transport/Home";
import ExaminationHome from "./Screens/Examination/Home";
import Payment from "./Screens/Student/Payment";
import PlacementHome from "./Screens/Placement/Home";
import HODHome from "./Screens/HOD/Home";
import PrincipalHome from "./Screens/Principal/Home";
import AccountsHome from "./Screens/Accounts/Home";
import ParentPortal from "./Screens/Common/ParentPortal";
import Portfolio3D from "./Screens/Common/Portfolio3D";

const HashRedirect = () => {
  useEffect(() => {
    if (window.location.hash && window.location.hash.includes("portfolio")) {
      window.location.href = "/portfolio";
    }
  }, []);
  return null;
};

const App = () => {
  return (
    <>
      <Provider store={mystore}>
        <Router>
          <HashRedirect />
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/portfolio" element={<Portfolio3D />} />
            <Route path="portfolio" element={<Portfolio3D />} />
            <Route path="student" element={<StudentHome />} />
            <Route path="faculty" element={<FacultyHome />} />
            <Route path="admin" element={<AdminHome />} />
            <Route path="library" element={<LibraryHome />} />
            <Route path="transport" element={<TransportHome />} />
            <Route path="examination" element={<ExaminationHome />} />
            <Route path="payment" element={<Payment />} />
            <Route path="placement/*" element={<PlacementHome />} />
            <Route path="hod/*" element={<HODHome />} />
            <Route path="principal/*" element={<PrincipalHome />} />
            <Route path="accounts/*" element={<AccountsHome />} />
            <Route path="parent/dashboard/:token" element={<ParentPortal />} />
          </Routes>
        </Router>
      </Provider>
      {/* Watermark */}
      <div className="fixed right-5 bottom-2 opacity-20 md:opacity-25 text-[10px] md:text-lg font-bold font-mono pointer-events-none z-50 text-slate-800">
        Developed by Laxmi
      </div>
    </>
  );
};

export default App;
