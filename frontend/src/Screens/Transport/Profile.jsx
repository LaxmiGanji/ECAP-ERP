import axios from "axios";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { baseApiURL } from "../../baseUrl";
import { setUserData } from "../../redux/actions";

const Profile = () => {
  const router = useLocation();
  const dispatch = useDispatch();
  const [data, setData] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [password, setPassword] = useState({ current: "", new: "" });

  useEffect(() => {
    if (!router.state?.loginid) {
      return;
    }
    const headers = { "Content-Type": "application/json" };
    axios
      .post(
        `${baseApiURL()}/transport/details/getDetails`,
        { transportId: router.state.loginid },
        { headers }
      )
      .then((response) => {
        if (response.data.success) {
          const profile = response.data.user[0];
          setData(profile);
          dispatch(
            setUserData({
              fullname: `${profile.firstName} ${profile.lastName}`,
              transportId: profile.transportId,
            })
          );
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        console.error(error);
        toast.error("Unable to load profile.");
      });
  }, [dispatch, router.state]);

  const checkPasswordHandler = (e) => {
    e.preventDefault();
    const headers = { "Content-Type": "application/json" };
    axios
      .post(
        `${baseApiURL()}/transport/auth/login`,
        { loginid: router.state.loginid, password: password.current },
        { headers }
      )
      .then((response) => {
        if (response.data.success) {
          changePasswordHandler(response.data.id);
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Unable to verify current password.");
      });
  };

  const changePasswordHandler = (id) => {
    const headers = { "Content-Type": "application/json" };
    axios
      .put(
        `${baseApiURL()}/transport/auth/update/${id}`,
        { loginid: router.state.loginid, password: password.new },
        { headers }
      )
      .then((response) => {
        if (response.data.success) {
          toast.success(response.data.message);
          setPassword({ current: "", new: "" });
          setShowPass(false);
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Unable to update password.");
      });
  };

  if (!data) {
    return (
      <div className="bg-white rounded-2xl shadow p-8">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-xl rounded-lg overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-500 to-blue-600 p-6">
        <h1 className="text-3xl font-bold text-white">
          {data.firstName} {data.lastName}
        </h1>
        <p className="text-blue-100">Transport ID: {data.transportId}</p>
      </div>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium">{data.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Phone Number</p>
            <p className="font-medium">{data.phoneNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Gender</p>
            <p className="font-medium">{data.gender}</p>
          </div>
        </div>

        <div className="border-t pt-6">
          <button
            className={`px-4 py-2 rounded-full ${
              showPass ? "bg-red-100 text-red-600" : "bg-blue-600 text-white"
            }`}
            onClick={() => setShowPass((prev) => !prev)}
          >
            {showPass ? "Close Change Password" : "Change Password"}
          </button>
          {showPass && (
            <form className="mt-6 space-y-4" onSubmit={checkPasswordHandler}>
              <input
                type="password"
                value={password.current}
                onChange={(e) => setPassword({ ...password, current: e.target.value })}
                placeholder="Current Password"
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="password"
                value={password.new}
                onChange={(e) => setPassword({ ...password, new: e.target.value })}
                placeholder="New Password"
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
              >
                Update Password
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;

