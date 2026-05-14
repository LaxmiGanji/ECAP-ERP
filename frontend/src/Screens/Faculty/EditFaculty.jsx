import { useEffect, useState } from "react";
import axios from "axios";
import { baseApiURL } from "../../baseUrl";
import { toast } from "react-hot-toast";
import { useLocation } from "react-router-dom";
import { getFileUrl } from "../../utils/fileUrl";

const EditFaculty = () => {
  const router = useLocation();
  const [faculty, setFaculty] = useState(null);
  const [formData, setFormData] = useState({});
  const [profileFile, setProfileFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load faculty details
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await axios.post(
          `${baseApiURL()}/${router.state.type}/details/getDetails`,
          { employeeId: router.state.loginid },
          { headers: { "Content-Type": "application/json" } }
        );
        if (res.data.success && res.data.user.length > 0) {
          setFaculty(res.data.user[0]);
          setFormData(res.data.user[0]);
        } else {
          toast.error(res.data.message || "Failed to load details");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error fetching details");
      }
    };
    fetchDetails();
  }, [router.state.loginid, router.state.type]);

  // Handle text input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle profile picture change
  const handleFileChange = (e) => {
    setProfileFile(e.target.files[0]);
  };

  // Submit updated details
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!faculty?._id) {
      toast.error("Faculty ID not found");
      return;
    }

    const form = new FormData();
    Object.keys(formData).forEach((key) => {
      form.append(key, formData[key]);
    });
    if (profileFile) {
      form.append("profile", profileFile);
    }

    try {
      setLoading(true);
      const res = await axios.put(
        `${baseApiURL()}/faculty/details/updateDetails/${faculty._id}`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      if (res.data.success) {
        toast.success("Profile updated successfully");
      } else {
        toast.error(res.data.message || "Update failed");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error updating details");
    } finally {
      setLoading(false);
    }
  };

  if (!faculty) {
    return <p className="p-6">Loading faculty details...</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Edit My Details</h1>
      <form
        className="bg-white p-6 rounded-lg shadow-lg space-y-4"
        onSubmit={handleSubmit}
      >
        {/* Profile Preview */}
        <div>
          <img
            src={
              profileFile
                ? URL.createObjectURL(profileFile)
                : getFileUrl(faculty.profile)
            }
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover mb-2"
          />
          <input type="file" accept="image/*" onChange={handleFileChange} />
        </div>

        {/* First Name */}
        <div>
          <label className="block text-sm font-medium">First Name</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Middle Name */}
        <div>
          <label className="block text-sm font-medium">Middle Name</label>
          <input
            type="text"
            name="middleName"
            value={formData.middleName || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm font-medium">Last Name</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-sm font-medium">Phone Number</label>
          <input
            type="number"
            name="phoneNumber"
            value={formData.phoneNumber || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Department */}
        <div>
          <label className="block text-sm font-medium">Department</label>
          <input
            type="text"
            name="department"
            value={formData.department || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium">Gender</label>
          <select
            name="gender"
            value={formData.gender || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

        {/* Experience */}
        <div>
          <label className="block text-sm font-medium">Experience (Years)</label>
          <input
            type="number"
            name="experience"
            value={formData.experience || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Post */}
        <div>
          <label className="block text-sm font-medium">Post</label>
          <input
            type="text"
            name="post"
            value={formData.post || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* PAN */}
        <div>
          <label className="block text-sm font-medium">PAN Card</label>
          <input
            type="text"
            name="panCard"
            value={formData.panCard || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* JNTU ID */}
        <div>
          <label className="block text-sm font-medium">JNTU ID</label>
          <input
            type="text"
            name="jntuId"
            value={formData.jntuId || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* AICTE ID */}
        <div>
          <label className="block text-sm font-medium">AICTE ID</label>
          <input
            type="text"
            name="aicteId"
            value={formData.aicteId || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {loading ? "Updating..." : "Update Details"}
        </button>
      </form>
    </div>
  );
};

export default EditFaculty;
