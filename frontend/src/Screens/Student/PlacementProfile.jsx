import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { baseApiURL } from '../../baseUrl';

const StudentPlacementProfile = () => {
    const [profile, setProfile] = useState({
        enrollmentNo: '', branch: '', resumeLink: '', tenthPercentage: '', twelfthPercentage: '', cgpa: '', activeBacklogs: 0, githubLink: '', linkedinLink: ''
    });
    const [drives, setDrives] = useState([]);
    const [applications, setApplications] = useState([]);
    const [trainings, setTrainings] = useState([]);

    useEffect(() => {
        fetchProfile();
        fetchEligibleDrives();
        fetchMyApplications();
        fetchTrainings();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${baseApiURL()}/student/placement/profile`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.success && res.data.profile) {
                setProfile(res.data.profile);
            }
        } catch (error) {
            console.error('No profile found or error fetching profile');
        }
    };

    const fetchEligibleDrives = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${baseApiURL()}/placement/drives/get`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.success) {
                // Here we would ideally filter on backend, but for simplicity we fetch all and filter or just show all active
                setDrives(res.data.drives);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchMyApplications = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${baseApiURL()}/placement/applications/student/my-applications`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.success) {
                setApplications(res.data.applications);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchTrainings = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${baseApiURL()}/placement/training/get`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.success) {
                setTrainings(res.data.trainings);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${baseApiURL()}/student/placement/profile`, profile, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.success) {
                toast.success(res.data.message);
                fetchProfile();
            }
        } catch (error) {
            toast.error('Error updating profile');
        }
    };

    const handleApply = async (driveId) => {
        try {
            const token = localStorage.getItem('token');
            // get student id from token inside backend, or pass it. 
            // In our backend `req.user.id` is available, but the model needs `student: req.user.id`. 
            // Wait, we need to send student ID. 
            // The backend application.controller.js needs `student` in req.body for addApplication.
            // Let's modify the payload to include it if possible, or update backend to use req.user.id.
            const userStr = localStorage.getItem('token'); // We can decode token to get ID, or we can send a request to a dedicated apply endpoint.
            
            // To be robust, let's decode token manually or assume backend can handle it.
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const decodedToken = JSON.parse(jsonPayload);
            const studentId = decodedToken.id;

            const res = await axios.post(`${baseApiURL()}/placement/applications/add`, { drive: driveId, student: studentId }, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.success) {
                toast.success('Applied successfully');
                fetchMyApplications();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error applying to drive');
        }
    };

    const handleRegisterTraining = async (trainingId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${baseApiURL()}/placement/training/register/${trainingId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.success) {
                toast.success('Registered successfully');
                fetchTrainings(); // refresh to update UI state if needed
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error registering for training');
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-3xl font-bold mb-6 text-blue-900">Placement Hub</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Profile Section */}
                <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
                    <h3 className="text-xl font-bold mb-4 border-b pb-2">My Placement Profile</h3>
                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Enrollment No.</label>
                                <input type="text" name="enrollmentNo" value={profile.enrollmentNo} onChange={handleChange} className="w-full p-2 border rounded mt-1" required />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Branch</label>
                                <input type="text" name="branch" value={profile.branch} onChange={handleChange} className="w-full p-2 border rounded mt-1" required />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">10th Percentage</label>
                                <input type="number" step="0.1" name="tenthPercentage" value={profile.tenthPercentage} onChange={handleChange} className="w-full p-2 border rounded mt-1" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">12th Percentage</label>
                                <input type="number" step="0.1" name="twelfthPercentage" value={profile.twelfthPercentage} onChange={handleChange} className="w-full p-2 border rounded mt-1" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Current CGPA</label>
                                <input type="number" step="0.01" name="cgpa" value={profile.cgpa} onChange={handleChange} className="w-full p-2 border rounded mt-1" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Active Backlogs</label>
                                <input type="number" name="activeBacklogs" value={profile.activeBacklogs} onChange={handleChange} className="w-full p-2 border rounded mt-1" />
                            </div>
                            <div className="col-span-2">
                                <label className="text-sm font-medium text-gray-700">Resume Link (GDrive/Dropbox)</label>
                                <input type="url" name="resumeLink" value={profile.resumeLink} onChange={handleChange} className="w-full p-2 border rounded mt-1" />
                            </div>
                            <div className="col-span-2">
                                <label className="text-sm font-medium text-gray-700">LinkedIn Profile</label>
                                <input type="url" name="linkedinLink" value={profile.linkedinLink} onChange={handleChange} className="w-full p-2 border rounded mt-1" />
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 transition">Save Profile</button>
                    </form>
                </div>

                {/* Drives and Applications Section */}
                <div className="space-y-8">
                    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
                        <h3 className="text-xl font-bold mb-4 border-b pb-2">Available Drives</h3>
                        <div className="space-y-4">
                            {drives.filter(d => d.status === 'Upcoming' || d.status === 'Ongoing').map(drive => {
                                const hasApplied = applications.some(app => app.drive._id === drive._id);
                                return (
                                    <div key={drive._id} className="border p-4 rounded bg-gray-50 flex justify-between items-center">
                                        <div>
                                            <h4 className="font-bold text-lg">{drive.title} <span className="text-sm font-normal text-gray-500">at {drive.company?.name}</span></h4>
                                            <p className="text-sm text-gray-600">Deadline: {new Date(drive.registrationDeadline).toLocaleDateString()}</p>
                                        </div>
                                        <button 
                                            onClick={() => handleApply(drive._id)}
                                            disabled={hasApplied}
                                            className={`px-4 py-2 rounded text-sm font-medium ${hasApplied ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                                        >
                                            {hasApplied ? 'Applied' : 'Apply Now'}
                                        </button>
                                    </div>
                                );
                            })}
                            {drives.length === 0 && <p className="text-gray-500 text-sm">No drives available right now.</p>}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
                        <h3 className="text-xl font-bold mb-4 border-b pb-2">My Applications</h3>
                        <div className="space-y-4">
                            {applications.map(app => (
                                <div key={app._id} className="border p-4 rounded bg-gray-50 flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold text-lg">{app.drive?.title} <span className="text-sm font-normal text-gray-500">at {app.drive?.company?.name || 'Company'}</span></h4>
                                        <p className="text-sm text-gray-600">Applied On: {new Date(app.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold
                                        ${app.status === 'Applied' ? 'bg-blue-100 text-blue-800' :
                                          app.status === 'Shortlisted' ? 'bg-yellow-100 text-yellow-800' :
                                          app.status === 'Selected' ? 'bg-green-100 text-green-800' :
                                          app.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}
                                    >
                                        {app.status}
                                    </span>
                                </div>
                            ))}
                            {applications.length === 0 && <p className="text-gray-500 text-sm">You haven't applied to any drives yet.</p>}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
                        <h3 className="text-xl font-bold mb-4 border-b pb-2">Training Sessions</h3>
                        <div className="space-y-4">
                            {trainings.map(t => {
                                // To accurately check if registered we need student ID. We have it in token or we can just guess based on error.
                                // A better way is to check t.registeredStudents.includes(studentId). Let's extract studentId.
                                const token = localStorage.getItem('token');
                                const base64Url = token.split('.')[1];
                                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                                const studentId = JSON.parse(decodeURIComponent(atob(base64).split('').map(function(c) {
                                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                                }).join(''))).id;
                                
                                const isRegistered = t.registeredStudents?.includes(studentId);

                                return (
                                    <div key={t._id} className="border p-4 rounded bg-gray-50 flex justify-between items-center">
                                        <div>
                                            <h4 className="font-bold text-lg">{t.title} <span className="text-sm font-normal text-teal-600">[{t.type}]</span></h4>
                                            <p className="text-sm text-gray-600">Date: {new Date(t.date).toLocaleDateString()} | Venue: {t.venue}</p>
                                            <p className="text-sm text-gray-600">Trainer: {t.trainerName}</p>
                                        </div>
                                        <button 
                                            onClick={() => handleRegisterTraining(t._id)}
                                            disabled={isRegistered}
                                            className={`px-4 py-2 rounded text-sm font-medium ${isRegistered ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-teal-600 text-white hover:bg-teal-700'}`}
                                        >
                                            {isRegistered ? 'Registered' : 'Register Now'}
                                        </button>
                                    </div>
                                );
                            })}
                            {trainings.length === 0 && <p className="text-gray-500 text-sm">No training sessions scheduled right now.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentPlacementProfile;
