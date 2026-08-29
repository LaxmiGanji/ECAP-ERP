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
                {/* Profile Section (Read-Only Summary Fetched from My Profile) */}
                <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100 space-y-4">
                    <div className="flex justify-between items-center border-b pb-3">
                        <h3 className="text-xl font-bold text-gray-900">My Placement Profile</h3>
                        <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-bold border border-indigo-100">
                            Fetched from My Profile
                        </span>
                    </div>

                    <div className="bg-indigo-50/70 p-3 rounded-lg border border-indigo-100 text-xs text-indigo-900 font-medium">
                        💡 <strong>Note:</strong> Academic credentials and resume links are managed directly under your <strong>My Profile</strong> tab.
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="bg-gray-50 p-3 rounded border">
                            <span className="text-gray-500 font-medium block">Enrollment No.</span>
                            <span className="font-bold text-gray-900 text-sm">{profile.enrollmentNo || "N/A"}</span>
                        </div>

                        <div className="bg-gray-50 p-3 rounded border">
                            <span className="text-gray-500 font-medium block">Branch</span>
                            <span className="font-bold text-gray-900 text-sm">{profile.branch || "N/A"}</span>
                        </div>

                        <div className="bg-gray-50 p-3 rounded border">
                            <span className="text-gray-500 font-medium block">10th Percentage</span>
                            <span className="font-bold text-indigo-700 text-sm">
                                {profile.tenthPercentage !== undefined && profile.tenthPercentage !== null && profile.tenthPercentage !== "" ? `${profile.tenthPercentage}%` : "N/A"}
                            </span>
                        </div>

                        <div className="bg-gray-50 p-3 rounded border">
                            <span className="text-gray-500 font-medium block">12th Percentage</span>
                            <span className="font-bold text-indigo-700 text-sm">
                                {profile.twelfthPercentage !== undefined && profile.twelfthPercentage !== null && profile.twelfthPercentage !== "" ? `${profile.twelfthPercentage}%` : "N/A"}
                            </span>
                        </div>

                        <div className="bg-gray-50 p-3 rounded border">
                            <span className="text-gray-500 font-medium block">Current CGPA</span>
                            <span className="font-bold text-blue-700 text-sm">
                                {profile.cgpa !== undefined && profile.cgpa !== null && profile.cgpa !== "" ? profile.cgpa : "N/A"}
                            </span>
                        </div>

                        <div className="bg-gray-50 p-3 rounded border">
                            <span className="text-gray-500 font-medium block">Active Backlogs</span>
                            <span className={`font-bold text-sm ${profile.activeBacklogs > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                                {profile.activeBacklogs ?? 0}
                            </span>
                        </div>

                        <div className="col-span-2 bg-gray-50 p-3 rounded border">
                            <span className="text-gray-500 font-medium block mb-1">Resume Link</span>
                            {profile.resumeLink ? (
                                <a href={profile.resumeLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold text-xs underline truncate block">
                                    {profile.resumeLink}
                                </a>
                            ) : (
                                <span className="text-gray-400 font-medium">Not Uploaded (Add in My Profile)</span>
                            )}
                        </div>

                        <div className="col-span-2 bg-gray-50 p-3 rounded border">
                            <span className="text-gray-500 font-medium block mb-1">LinkedIn Profile</span>
                            {profile.linkedinLink ? (
                                <a href={profile.linkedinLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold text-xs underline truncate block">
                                    {profile.linkedinLink}
                                </a>
                            ) : (
                                <span className="text-gray-400 font-medium">Not Added (Add in My Profile)</span>
                            )}
                        </div>
                    </div>
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
