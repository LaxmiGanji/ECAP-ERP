import { useEffect, useState } from "react";
import axios from "axios";
import { baseApiURL } from "../../baseUrl";
import { toast } from "react-hot-toast";
import { useLocation } from "react-router-dom";
import { getFileUrl } from "../../utils/fileUrl";

const EditStudent = () => {
  const router = useLocation();
  const [student, setStudent] = useState(null);
  const [formData, setFormData] = useState({});
  const [profileFile, setProfileFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load student details
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await axios.post(
          `${baseApiURL()}/student/details/getDetails`,
          { enrollmentNo: router.state.loginid },
          { headers: { "Content-Type": "application/json" } }
        );
        if (res.data.success && res.data.user.length > 0) {
          setStudent(res.data.user[0]);
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
  }, [router.state.loginid]);

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
    if (!student?._id) {
      toast.error("Student ID not found");
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
        `${baseApiURL()}/student/details/updateDetails/${student._id}`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      if (res.data.success) {
        toast.success("Profile updated successfully");
        // Update the student data with the new changes
        setStudent(res.data.user || formData);
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

  if (!student) {
    return <p className="p-6">Loading student details...</p>;
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
                : getFileUrl(student.profile)
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
            required
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
            required
          />
        </div>

        {/* Branch */}
        <div>
          <label className="block text-sm font-medium">Branch</label>
          <input
            type="text"
            name="branch"
            value={formData.branch || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            disabled
          />
        </div>

        {/* Semester */}
        <div>
          <label className="block text-sm font-medium">Semester</label>
          <input
            type="number"
            name="semester"
            value={formData.semester || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            disabled
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
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Father's Name */}
        <div>
          <label className="block text-sm font-medium">Father's Name</label>
          <input
            type="text"
            name="FatherName"
            value={formData.FatherName || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Mother's Name */}
        <div>
          <label className="block text-sm font-medium">Mother's Name</label>
          <input
            type="text"
            name="MotherName"
            value={formData.MotherName || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Father's Phone */}
        <div>
          <label className="block text-sm font-medium">Father's Phone</label>
          <input
            type="number"
            name="FatherPhoneNumber"
            value={formData.FatherPhoneNumber || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Mother's Phone */}
        <div>
          <label className="block text-sm font-medium">Mother's Phone</label>
          <input
            type="number"
            name="MotherPhoneNumber"
            value={formData.MotherPhoneNumber || ""}
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

export default EditStudent;