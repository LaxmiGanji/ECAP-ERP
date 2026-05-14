import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { baseApiURL } from "../../baseUrl";
import { FiTruck, FiUser, FiMail } from "react-icons/fi";

const TransportIncharge = () => {
  const [data, setData] = useState({
    transportId: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    gender: "",
  });

  const resetForm = () => {
    setData({
      transportId: "",
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      gender: "",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!data.transportId || !data.firstName || !data.lastName || !data.email || !data.phoneNumber || !data.gender) {
      toast.error("Please fill in all fields");
      return;
    }
    toast.loading("Creating Transport Incharge...");

    axios
      .post(`${baseApiURL()}/transport/details/addDetails`, data)
      .then((response) => {
        if (response.data.success) {
          axios
            .post(`${baseApiURL()}/transport/auth/register`, {
              loginid: data.transportId,
              password: data.transportId,
            })
            .then((res) => {
              toast.dismiss();
              if (res.data.success) {
                toast.success("Transport Incharge added with default credentials.");
                resetForm();
              } else {
                toast.error(res.data.message);
              }
            })
            .catch((error) => {
              toast.dismiss();
              toast.error(error.response?.data?.message || "Unable to register credentials.");
            });
        } else {
          toast.dismiss();
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.dismiss();
        toast.error(error.response?.data?.message || "Unable to save details.");
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 flex items-center gap-3">
          <div className="bg-white/20 p-3 rounded-full">
            <FiTruck className="text-white text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Add Transport Incharge</h1>
            <p className="text-blue-100 text-sm">
              Capture basic information and auto-create login credentials (ID used as default password).
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-4 text-blue-700">
              <FiUser />
              <h2 className="text-lg font-semibold">Personal Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">First Name *</label>
                <input
                  type="text"
                  value={data.firstName}
                  onChange={(e) => setData({ ...data, firstName: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Last Name *</label>
                <input
                  type="text"
                  value={data.lastName}
                  onChange={(e) => setData({ ...data, lastName: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Transport ID *</label>
                <input
                  type="text"
                  value={data.transportId}
                  onChange={(e) => setData({ ...data, transportId: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Gender *</label>
                <select
                  value={data.gender}
                  onChange={(e) => setData({ ...data, gender: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4 text-blue-700">
              <FiMail />
              <h2 className="text-lg font-semibold">Contact Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Email *</label>
                <input
                  type="email"
                  value={data.email}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={data.phoneNumber}
                  onChange={(e) => setData({ ...data, phoneNumber: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 border rounded-lg text-gray-600 hover:bg-gray-50"
            >
              Reset
            </button>
            <button
              type="submit"
              className="px-8 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
            >
              Save Transport Incharge
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransportIncharge;

