import axios from "axios";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import { setUserData } from "../../redux/actions";
import { baseApiURL } from "../../baseUrl";
import toast from "react-hot-toast";
import { getFileUrl } from "../../utils/fileUrl";

const Profile = () => {
  const [showPass, setShowPass] = useState(false);
  const router = useLocation();
  const [data, setData] = useState();
  const dispatch = useDispatch();
  const [password, setPassword] = useState({
    new: "",
    current: "",
  });
  const [backlogs, setBacklogs] = useState({ activeBacklogs: 0, backlogDetails: "" });
  const [savingBacklogs, setSavingBacklogs] = useState(false);

  useEffect(() => {
    const headers = {
      "Content-Type": "application/json",
    };
    axios
      .post(
        `${baseApiURL()}/${router.state.type}/details/getDetails`,
        { enrollmentNo: router.state.loginid },
        {
          headers: headers,
        }
      )
      .then((response) => {
        if (response.data.success) {
          setData(response.data.user[0]);
          console.log(response.data.user[0]);
          const u = response.data.user[0];
          setBacklogs({
            activeBacklogs: u.activeBacklogs || 0,
            backlogDetails: u.backlogDetails || "",
          });
          dispatch(
            setUserData({
              fullname: `${u.firstName} ${u.middleName} ${u.lastName}`,
              semester: u.semester,
              enrollmentNo: u.enrollmentNo,
              branch: u.branch,
            })
          );
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }, [dispatch, router.state.loginid, router.state.type]);

  const checkPasswordHandler = (e) => {
    e.preventDefault();
    const headers = {
      "Content-Type": "application/json",
    };
    axios
      .post(
        `${baseApiURL()}/student/auth/login`,
        { loginid: router.state.loginid, password: password.current },
        {
          headers: headers,
        }
      )
      .then((response) => {
        if (response.data.success) {
          changePasswordHandler(response.data.id);
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.error(error.response.data.message);
        console.error(error);
      });
  };

  const changePasswordHandler = (id) => {
    const headers = {
      "Content-Type": "application/json",
    };
    axios
      .put(
        `${baseApiURL()}/student/auth/update/${id}`,
        { loginid: router.state.loginid, password: password.new },
        {
          headers: headers,
        }
      )
      .then((response) => {
        if (response.data.success) {
          toast.success(response.data.message);
          setPassword({ new: "", current: "" });
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.error(error.response.data.message);
        console.error(error);
      });
  };

  const saveBacklogsHandler = async (e) => {
    e.preventDefault();
    setSavingBacklogs(true);
    try {
      const response = await axios.put(
        `${baseApiURL()}/student/details/updateBacklogs`,
        { enrollmentNo: router.state.loginid, activeBacklogs: backlogs.activeBacklogs, backlogDetails: backlogs.backlogDetails },
        { headers: { "Content-Type": "application/json" } }
      );
      if (response.data.success) {
        toast.success("Backlogs updated successfully!");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Failed to update backlogs");
    } finally {
      setSavingBacklogs(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {data && (
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
            <div className="flex items-center">
              <img
                src={getFileUrl(data?.profile)}
                alt="Student profile"
                className="h-24 w-24 rounded-full border-4 border-white mr-4 object-cover"
              />
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {data.firstName} {data.middleName} {data.lastName}
                </h1>
                <p className="text-blue-100">Enrollment No: {data.enrollmentNo}</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">Branch</p>
                <p className="font-medium">{data.branch}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Semester</p>
                <p className="font-medium">{data.semester}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone Number</p>
                <p className="font-medium">{data.phoneNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email Address</p>
                <p className="font-medium">{data.email}</p>
              </div>
            </div>
            {/* Backlogs Management */}
            <div className="mt-8 border border-orange-200 bg-orange-50 rounded-xl p-5">
              <h2 className="text-base font-bold text-orange-800 mb-1 flex items-center gap-2">
                📋 Active Backlogs
              </h2>
              <p className="text-xs text-orange-600 mb-4">Update your current active backlogs. This will be visible to Placement coordinators.</p>
              <form onSubmit={saveBacklogsHandler} className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-1">No. of Active Backlogs</label>
                    <input
                      type="number"
                      min="0"
                      value={backlogs.activeBacklogs}
                      onChange={(e) => setBacklogs({ ...backlogs, activeBacklogs: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Backlog Subject Details</label>
                  <textarea
                    value={backlogs.backlogDetails}
                    onChange={(e) => setBacklogs({ ...backlogs, backlogDetails: e.target.value })}
                    placeholder="e.g. Maths III, Physics Lab..."
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingBacklogs}
                  className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-5 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {savingBacklogs ? "Saving..." : "Save Backlogs"}
                </button>
              </form>
            </div>

            <div className="mt-8">
              <button
                className={`${
                  showPass
                    ? "bg-red-100 text-red-600 hover:bg-red-200"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                } px-4 py-2 rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? "Close Change Password" : "Change Password"}
              </button>
            </div>
            {showPass && (
              <form
                className="mt-6 space-y-4"
                onSubmit={checkPasswordHandler}
              >
                <div className="relative">
                  <input
                    type="password"
                    value={password.current}
                    onChange={(e) =>
                      setPassword({ ...password, current: e.target.value })
                    }
                    placeholder="Current Password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="relative">
                  <input
                    type="password"
                    value={password.new}
                    onChange={(e) =>
                      setPassword({ ...password, new: e.target.value })
                    }
                    placeholder="New Password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  type="submit"
                >
                  Change Password
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
