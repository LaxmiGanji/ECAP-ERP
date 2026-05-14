import { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { baseApiURL } from "../../../baseUrl";
import { FiUser, FiMail, FiBook } from "react-icons/fi";

const AddLibrary = () => {
    const [data, setData] = useState({
        libraryId: "",
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        gender: ""
      });

      const addLibraryProfile = (e) => {
        e.preventDefault();
        if (!data.libraryId || !data.firstName || !data.lastName || !data.email || !data.phoneNumber || !data.gender) {
            toast.error("Please fill in all fields");
            return;
        }
    
        toast.loading("Adding Librarian");
    
        axios
            .post(`${baseApiURL()}/library/details/addDetails`, data) // Send JSON instead of FormData
            .then((response) => {
                toast.dismiss();
                if (response.data.success) {
                    toast.success(response.data.message);
                    // Register the librarian for authentication
                    axios
                        .post(`${baseApiURL()}/library/auth/register`, {
                            loginid: data.libraryId,
                            password: data.libraryId,
                        })
                        .then((res) => {
                            if (res.data.success) {
                                toast.success(res.data.message);
                                resetForm();
                            } else {
                                toast.error(res.data.message);
                            }
                        })
                        .catch((error) => {
                            toast.error(error.response?.data?.message || "An error occurred while registering.");
                        });
                } else {
                    toast.error(response.data.message);
                }
            })
            .catch((error) => {
                toast.dismiss();
                toast.error(error.response?.data?.message || "An error occurred while adding librarian.");
            });
    };
    

      const resetForm = () => {
        setData({
          libraryId: "",
          firstName: "",
          lastName: "",
          email: "",
          phoneNumber: "",
          gender: ""
        });
      };
    
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <FiBook className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Add New Librarian</h1>
                <p className="text-blue-100 text-sm">Enter librarian information below</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={addLibraryProfile} className="p-8">
            <div className="space-y-8">
              {/* Personal Information Section */}
              <div>
                <div className="flex items-center space-x-2 mb-6">
                  <FiUser className="text-blue-600 text-lg" />
                  <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstname" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstname"
                      required
                      value={data.firstName}
                      onChange={(e) => setData({ ...data, firstName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastname" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastname"
                      required
                      value={data.lastName}
                      onChange={(e) => setData({ ...data, lastName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter last name"
                    />
                  </div>
                  <div>
                    <label htmlFor="libraryId" className="block text-sm font-medium text-gray-700 mb-2">
                      Library ID *
                    </label>
                    <input
                      type="number"
                      id="libraryId"
                      required
                      value={data.libraryId}
                      onChange={(e) => setData({ ...data, libraryId: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter library ID"
                    />
                  </div>
                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                      Gender *
                    </label>
                    <select
                      id="gender"
                      required
                      value={data.gender}
                      onChange={(e) => setData({ ...data, gender: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div>
                <div className="flex items-center space-x-2 mb-6">
                  <FiMail className="text-blue-600 text-lg" />
                  <h2 className="text-xl font-semibold text-gray-800">Contact Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={data.email}
                      onChange={(e) => setData({ ...data, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      required
                      value={data.phoneNumber}
                      onChange={(e) => setData({ ...data, phoneNumber: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset Form
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Add Librarian
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddLibrary