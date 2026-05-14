
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  FiBook,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiEdit,
  FiTrash2,
  FiCheckCircle,
} from "react-icons/fi";
import { baseApiURL } from "../../baseUrl";

const frequencies = [
  "Daily",
  "Weekly",
  "Fortnightly",
  "Monthly",
  "Quarterly",
  "Yearly",
  "Other",
];

const initialForm = {
  title: "",
  language: "English",
  frequency: "Daily",
  vendor: "",
  publisher: "",
  copies: 1,
  remarks: "",
  lastReceivedOn: "",
  isActive: true,
};

const NewsPaper = () => {
  const [papers, setPapers] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [selectedTab, setSelectedTab] = useState("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchPapers = () => {
    setLoading(true);
    axios
      .get(`${baseApiURL()}/newspaper`)
      .then((res) => {
        if (res.data.success) {
          setPapers(res.data.newspapers || []);
        } else {
          toast.error(res.data.message || "Unable to load newspapers");
        }
      })
      .catch((error) =>
        toast.error(error.response?.data?.message || "Unable to load newspapers")
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPapers();
  }, []);

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
  };

  const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString();
  };

  const filteredPapers = useMemo(() => {
    return papers
      .filter((paper) => {
        if (statusFilter === "active" && !paper.isActive) return false;
        if (statusFilter === "inactive" && paper.isActive) return false;
        const term = searchTerm.toLowerCase();
        if (!term) return true;
  return (
          paper.title?.toLowerCase().includes(term) ||
          paper.vendor?.toLowerCase().includes(term) ||
          paper.language?.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [papers, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = papers.length;
    const active = papers.filter((paper) => paper.isActive).length;
    const dueSoon = papers.filter((paper) => {
      if (!paper.nextIssueDueOn) return false;
      const diff =
        (new Date(paper.nextIssueDueOn).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return diff <= 3;
    }).length;
    return { total, active, dueSoon };
  }, [papers]);

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      return toast.error("Title is required");
    }
    setSaving(true);
    const payload = {
      ...formData,
      copies: Number(formData.copies) || 1,
      isActive: Boolean(formData.isActive),
      language: formData.language || "English",
      frequency: formData.frequency || "Daily",
    };
    if (payload.lastReceivedOn) {
      payload.lastReceivedOn = new Date(payload.lastReceivedOn).toISOString();
    } else {
      delete payload.lastReceivedOn;
    }

    const request = editingId
      ? axios.put(`${baseApiURL()}/newspaper/${editingId}`, payload)
      : axios.post(`${baseApiURL()}/newspaper`, payload);

    request
      .then((res) => {
        if (res.data.success) {
          toast.success(res.data.message || "Saved");
          resetForm();
          setSelectedTab("list");
          fetchPapers();
        } else {
          toast.error(res.data.message || "Something went wrong");
        }
      })
      .catch((error) => toast.error(error.response?.data?.message || "Save failed"))
      .finally(() => setSaving(false));
  };

  const handleEdit = (paper) => {
    setEditingId(paper._id);
    setFormData({
      title: paper.title || "",
      language: paper.language || "English",
      frequency: paper.frequency || "Daily",
      vendor: paper.vendor || "",
      publisher: paper.publisher || "",
      copies: paper.copies || 1,
      remarks: paper.remarks || "",
      lastReceivedOn: paper.lastReceivedOn
        ? new Date(paper.lastReceivedOn).toISOString().split("T")[0]
        : "",
      isActive: paper.isActive ?? true,
    });
    setSelectedTab("form");
  };

  const handleDelete = (paper) => {
    if (!window.confirm(`Delete ${paper.title}?`)) return;
    axios
      .delete(`${baseApiURL()}/newspaper/${paper._id}`)
      .then((res) => {
        if (res.data.success) {
          toast.success("Entry deleted");
          fetchPapers();
        } else {
          toast.error(res.data.message || "Deletion failed");
        }
      })
      .catch((error) => toast.error(error.response?.data?.message || "Deletion failed"));
  };

  const handleMarkReceived = (paper) => {
    axios
      .post(`${baseApiURL()}/newspaper/${paper._id}/receive`, {
        receivedOn: new Date().toISOString(),
      })
      .then((res) => {
        if (res.data.success) {
          toast.success("Receipt recorded");
          fetchPapers();
        } else {
          toast.error(res.data.message || "Unable to update");
        }
      })
      .catch((error) => toast.error(error.response?.data?.message || "Unable to update"));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 flex flex-wrap gap-4 justify-between items-center">
            <div className="flex items-center gap-3 text-white">
              <div className="bg-white/20 p-2 rounded-lg">
                <FiBook className="text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Newspapers & Magazines</h1>
                <p className="text-blue-100 text-sm">
                  Track subscriptions, arrivals, and circulation status.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {["list", "form"].map((tab) => (
                <button
                  key={tab}
                  className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                    selectedTab === tab
                      ? "bg-white text-blue-600"
                      : "text-white hover:bg-white/20"
                  }`}
                  onClick={() => setSelectedTab(tab)}
                >
                  {tab === "list" ? "View Records" : editingId ? "Edit Entry" : "Add Entry"}
                </button>
              ))}
            </div>
          </div>

          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                <p className="text-sm text-slate-500">Total Titles</p>
                <p className="text-3xl font-semibold text-slate-900">{stats.total}</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                <p className="text-sm text-slate-500">Active Subscriptions</p>
                <p className="text-3xl font-semibold text-emerald-600">{stats.active}</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                <p className="text-sm text-slate-500">Due in next 3 days</p>
                <p className="text-3xl font-semibold text-amber-600">{stats.dueSoon}</p>
              </div>
            </div>

            {selectedTab === "list" && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={fetchPapers}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex items-center gap-2"
                      disabled={loading}
                    >
                      <FiRefreshCw className={loading ? "animate-spin" : ""} />
                      Refresh
                    </button>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All statuses</option>
                      <option value="active">Active only</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="relative flex-1">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by title, language, vendor..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600 uppercase tracking-wide text-xs">
                      <tr>
                        <th className="px-4 py-3 text-left">Title</th>
                        <th className="px-4 py-3 text-left">Frequency</th>
                        <th className="px-4 py-3 text-left">Vendor</th>
                        <th className="px-4 py-3 text-left">Last Received</th>
                        <th className="px-4 py-3 text-left">Next Due</th>
                        <th className="px-4 py-3 text-left">Copies</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPapers.length === 0 && (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-4 py-6 text-center text-slate-500 text-sm"
                          >
                            {loading ? "Loading records..." : "No entries match the filters."}
                          </td>
                        </tr>
                      )}
                      {filteredPapers.map((paper) => (
                        <tr key={paper._id}>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-900">{paper.title}</p>
                            <p className="text-xs text-slate-500">
                              {paper.language} • {paper.publisher || "Publisher N/A"}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{paper.frequency}</td>
                          <td className="px-4 py-3 text-slate-600">
                            {paper.vendor || "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {formatDate(paper.lastReceivedOn)}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {formatDate(paper.nextIssueDueOn)}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{paper.copies || 1}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                paper.isActive
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              {paper.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                type="button"
                                onClick={() => handleMarkReceived(paper)}
                                className="text-emerald-600 hover:text-emerald-800"
                                title="Mark latest issue received"
                              >
                                <FiCheckCircle size={18} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEdit(paper)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Edit"
                              >
                                <FiEdit size={18} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(paper)}
                                className="text-red-500 hover:text-red-700"
                                title="Delete"
                              >
                                <FiTrash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedTab === "form" && (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-6">
                <div className="flex items-center gap-2 text-slate-800">
                  <FiPlus />
                  <h2 className="text-lg font-semibold">
                    {editingId ? "Update Subscription" : "Add New Subscription"}
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-slate-600 mb-1 block">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Eg: The Hindu"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600 mb-1 block">
                      Language
                    </label>
                    <input
                      type="text"
                      value={formData.language}
                      onChange={(e) =>
                        setFormData({ ...formData, language: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600 mb-1 block">
                      Frequency
                    </label>
                    <select
                      value={formData.frequency}
                      onChange={(e) =>
                        setFormData({ ...formData, frequency: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {frequencies.map((freq) => (
                        <option key={freq} value={freq}>
                          {freq}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600 mb-1 block">
                      Vendor / Agency
                    </label>
                    <input
                      type="text"
                      value={formData.vendor}
                      onChange={(e) =>
                        setFormData({ ...formData, vendor: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600 mb-1 block">
                      Publisher
                    </label>
                    <input
                      type="text"
                      value={formData.publisher}
                      onChange={(e) =>
                        setFormData({ ...formData, publisher: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600 mb-1 block">
                      Copies
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.copies}
                      onChange={(e) =>
                        setFormData({ ...formData, copies: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600 mb-1 block">
                      Last Received On
                    </label>
                    <input
                      type="date"
                      value={formData.lastReceivedOn}
                      onChange={(e) =>
                        setFormData({ ...formData, lastReceivedOn: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      id="isActive"
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor="isActive" className="text-sm text-slate-700">
                      Subscription active
                    </label>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600 mb-1 block">
                    Remarks
                  </label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) =>
                      setFormData({ ...formData, remarks: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Eg: Stored in reading hall rack 2"
                  />
                </div>

                <div className="flex flex-wrap gap-3 justify-end">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100"
                    disabled={saving}
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={saving}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving && <FiRefreshCw className="animate-spin" />}
                    {editingId ? "Update Entry" : "Add Entry"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsPaper;