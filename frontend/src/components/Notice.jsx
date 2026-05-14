import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { IoMdLink } from "react-icons/io";
import { HiOutlineCalendar } from "react-icons/hi";
import { useLocation } from "react-router-dom";
import { IoAddOutline } from "react-icons/io5";
import { MdDeleteOutline, MdEditNote, MdClose } from "react-icons/md";
import toast from "react-hot-toast";
import { baseApiURL } from "../baseUrl";

const Notice = () => {
  const router = useLocation();
  const [notice, setNotice] = useState([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(false);
  const [id, setId] = useState("");
  const [data, setData] = useState({
    title: "",
    description: "",
    type: "student",
    link: "",
  });

  const getNoticeHandler = useCallback(() => {
    let data = {};
    if (router.pathname.replace("/", "") === "student") {
      data = { type: ["student", "both"] };
    } else {
      data = { type: ["student", "both", "faculty"] };
    }

    const headers = { "Content-Type": "application/json" };
    axios
      .get(`${baseApiURL()}/notice/getNotice`, { headers, params: data })
      .then((response) => {
        if (response.data.success) {
          setNotice(response.data.notice);
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.dismiss();
        toast.error(error.response?.data?.message || "Error fetching notices");
      });
  }, [router.pathname]);

  useEffect(() => {
    getNoticeHandler();
  }, [getNoticeHandler]);

  const addNoticeHandler = (e) => {
    e.preventDefault();
    if (!data.title.trim() || !data.description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    toast.loading("Adding Notice");
    const headers = { "Content-Type": "application/json" };

    axios
      .post(`${baseApiURL()}/notice/addNotice`, data, { headers })
      .then((response) => {
        toast.dismiss();
        if (response.data.success) {
          toast.success(response.data.message);
          getNoticeHandler();
          setOpen(false);
          setData({ title: "", description: "", type: "student", link: "" });
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.dismiss();
        toast.error(error.response?.data?.message || "Error adding notice");
      });
  };

  const deleteNoticeHandler = (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this notice?");
    if (!confirmDelete) return;

    toast.loading("Deleting Notice");
    const headers = { "Content-Type": "application/json" };

    axios
      .delete(`${baseApiURL()}/notice/deleteNotice/${id}`, { headers })
      .then((response) => {
        toast.dismiss();
        if (response.data.success) {
          toast.success(response.data.message);
          getNoticeHandler();
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.dismiss();
        toast.error(error.response?.data?.message || "Error deleting notice");
      });
  };

  const updateNoticeHandler = (e) => {
    e.preventDefault();
    if (!data.title.trim() || !data.description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    toast.loading("Updating Notice");
    const headers = { "Content-Type": "application/json" };

    axios
      .put(`${baseApiURL()}/notice/updateNotice/${id}`, data, { headers })
      .then((response) => {
        toast.dismiss();
        if (response.data.success) {
          toast.success(response.data.message);
          getNoticeHandler();
          setOpen(false);
          setEdit(false);
          setData({ title: "", description: "", type: "student", link: "" });
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.dismiss();
        toast.error(error.response?.data?.message || "Error updating notice");
      });
  };

  const setOpenEditSectionHandler = (index) => {
    setEdit(true);
    setOpen(true);
    setData({
      title: notice[index].title,
      description: notice[index].description,
      type: notice[index].type,
      link: notice[index].link,
    });
    setId(notice[index]._id);
  };

  const openHandler = () => {
    setOpen(!open);
    setEdit(false);
    setData({ title: "", description: "", type: "student", link: "" });
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Notice Board</h1>
            <p className="text-gray-600 mt-2">Stay updated with important announcements</p>
          </div>
          {(router.pathname === "/faculty" || router.pathname === "/admin") && (
            <button
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
              onClick={openHandler}
            >
              <IoAddOutline className="text-xl" />
              <span>Add Notice</span>
            </button>
          )}
        </div>
      </div>

      {/* Notice Form */}
      {open && (
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  {edit ? "Edit Notice" : "Add New Notice"}
                </h2>
                <button
                  onClick={openHandler}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <MdClose className="text-xl" />
                </button>
              </div>
            </div>
            <form className="p-6 space-y-6" onSubmit={edit ? updateNoticeHandler : addNoticeHandler}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Notice Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={data.title}
                    onChange={(e) => setData({ ...data, title: e.target.value })}
                    placeholder="Enter notice title"
                  />
                </div>
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                    Notice Type *
                  </label>
                  <select
                    id="type"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={data.type}
                    onChange={(e) => setData({ ...data, type: e.target.value })}
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Notice Description *
                </label>
                <textarea
                  id="description"
                  required
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={data.description}
                  onChange={(e) => setData({ ...data, description: e.target.value })}
                  placeholder="Enter notice description"
                />
              </div>
              <div>
                <label htmlFor="link" className="block text-sm font-medium text-gray-700 mb-2">
                  Notice Link (Optional)
                </label>
                <input
                  type="url"
                  id="link"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={data.link}
                  onChange={(e) => setData({ ...data, link: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={openHandler}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {edit ? "Update Notice" : "Add Notice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notice List */}
      <div className="space-y-4">
        {notice.length > 0 ? (
          notice.map((item, index) => (
            <div key={item._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-xl font-semibold text-gray-800">{item.title}</h3>
                    {item.link && (
                      <button
                        onClick={() => window.open(item.link)}
                        className="text-blue-500 hover:text-blue-700 transition-colors"
                        title="Open Link"
                      >
                        <IoMdLink className="text-xl" />
                      </button>
                    )}
                  </div>
                  <p className="text-gray-600 mb-4">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {item.type}
                      </span>
                      <div className="flex items-center text-sm text-gray-500">
                        <HiOutlineCalendar className="mr-1" />
                        {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    {(router.pathname === "/faculty" || router.pathname === "/admin") && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setOpenEditSectionHandler(index)}
                          className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Notice"
                        >
                          <MdEditNote className="text-xl" />
                        </button>
                        <button
                          onClick={() => deleteNoticeHandler(item._id)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Notice"
                        >
                          <MdDeleteOutline className="text-xl" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiOutlineCalendar className="text-gray-400 text-2xl" />
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">No Notices Found</h3>
            <p className="text-gray-500">No notices have been posted yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notice;
