import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { MdOutlineDelete, MdAdd, MdSchool } from "react-icons/md";
import { baseApiURL } from "../../baseUrl";

const Branch = () => {
  const [data, setData] = useState({
    name: "",
  });
  const [selected, setSelected] = useState("add");
  const [branch, setBranch] = useState();

  useEffect(() => {
    getBranchHandler();
  }, []);

  const getBranchHandler = () => {
    axios
      .get(`${baseApiURL()}/branch/getBranch`)
      .then((response) => {
        if (response.data.success) {
          setBranch(response.data.branches);
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        console.log(error);
        toast.error(error.message);
      });
  };

  const addBranchHandler = () => {
    if (!data.name.trim()) {
      toast.error("Please enter a branch name");
      return;
    }

    toast.loading("Adding Branch");
    const headers = {
      "Content-Type": "application/json",
    };
    axios
      .post(`${baseApiURL()}/branch/addBranch`, data, {
        headers: headers,
      })
      .then((response) => {
        toast.dismiss();
        if (response.data.success) {
          toast.success(response.data.message);
          setData({ name: "" });
          getBranchHandler();
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.dismiss();
        toast.error(error.response?.data?.message || "Error adding branch");
      });
  };

  const deleteBranchHandler = (id) => {
    const alert = prompt("Are You Sure? Type CONFIRM to continue");
    if (alert === "CONFIRM") {
      toast.loading("Deleting Branch");
      const headers = {
        "Content-Type": "application/json",
      };
      axios
        .delete(`${baseApiURL()}/branch/deleteBranch/${id}`, {
          headers: headers,
        })
        .then((response) => {
          toast.dismiss();
          if (response.data.success) {
            toast.success(response.data.message);
            getBranchHandler();
          } else {
            toast.error(response.data.message);
          }
        })
        .catch((error) => {
          toast.dismiss();
          toast.error(error.response?.data?.message || "Error deleting branch");
        });
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Branch Management</h1>
            <p className="text-gray-600 mt-2">Add and manage academic branches</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="flex border-b border-gray-200">
          <button
            className={`flex-1 px-6 py-4 text-center font-medium transition-all duration-200 ${
              selected === "add"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
            onClick={() => setSelected("add")}
          >
            <div className="flex items-center justify-center space-x-2">
              <MdAdd className="w-5 h-5" />
              <span>Add Branch</span>
            </div>
          </button>
          <button
            className={`flex-1 px-6 py-4 text-center font-medium transition-all duration-200 ${
              selected === "view"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
            onClick={() => setSelected("view")}
          >
            <div className="flex items-center justify-center space-x-2">
              <MdSchool className="w-5 h-5" />
              <span>View Branches</span>
            </div>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {selected === "add" && (
          <div className="p-8">
            <div className="max-w-md mx-auto">
              <div className="mb-6">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Branch Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter branch name"
                />
              </div>
              <button
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                onClick={addBranchHandler}
              >
                Add Branch
              </button>
            </div>
          </div>
        )}

        {selected === "view" && (
          <div className="p-8">
            <div className="space-y-4">
              {branch && branch.length > 0 ? (
                branch.map((item, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 flex justify-between items-center hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <MdSchool className="text-white text-xl" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{item.name}</h3>
                        <p className="text-sm text-gray-600">Branch ID: {item._id}</p>
                      </div>
                    </div>
                    <button
                      className="p-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                      onClick={() => deleteBranchHandler(item._id)}
                      title="Delete Branch"
                    >
                      <MdOutlineDelete className="text-xl" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <MdSchool className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No Branches Found</h3>
                  <p className="text-gray-500">Add your first branch to get started</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Branch;
