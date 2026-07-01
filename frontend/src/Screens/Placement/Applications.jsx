import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { baseApiURL } from '../../baseUrl';

const Applications = () => {
    const [drives, setDrives] = useState([]);
    const [selectedDrive, setSelectedDrive] = useState('');
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchDrives();
    }, []);

    useEffect(() => {
        if (selectedDrive) {
            fetchApplications();
        }
    }, [selectedDrive]);

    const fetchDrives = async () => {
        try {
            const res = await axios.get(`${baseApiURL()}/placement/drives/get`);
            if (res.data.success) {
                setDrives(res.data.drives);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch drives');
        }
    };

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${baseApiURL()}/placement/applications/drive/${selectedDrive}`);
            if (res.data.success) {
                setApplications(res.data.applications);
                console.log('Applications:', res.data.applications); // Debug log
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch applications');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (appId, newStatus) => {
        try {
            const res = await axios.put(`${baseApiURL()}/placement/applications/update/${appId}/status`, 
                { status: newStatus },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            if (res.data.success) {
                toast.success(res.data.message);
                fetchApplications(); // refresh
            }
        } catch (error) {
            toast.error('Error updating status');
        }
    };

    // Helper function to get full name
    const getFullName = (student) => {
        if (!student) return 'N/A';
        const parts = [student.firstName, student.middleName, student.lastName].filter(Boolean);
        return parts.length > 0 ? parts.join(' ') : 'N/A';
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Student Applications</h2>
            
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Drive</label>
                <select 
                    value={selectedDrive} 
                    onChange={(e) => setSelectedDrive(e.target.value)}
                    className="p-2 border rounded w-full md:w-1/2"
                >
                    <option value="">-- Select Drive --</option>
                    {drives.map(drive => (
                        <option key={drive._id} value={drive._id}>
                            {drive.title} - {drive.companyName}
                        </option>
                    ))}
                </select>
            </div>

            {selectedDrive && (
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                            <p className="mt-2">Loading applications...</p>
                        </div>
                    ) : (
                        <table className="min-w-full bg-white rounded-lg overflow-hidden shadow">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="py-3 px-4 text-left">Enrollment No</th>
                                    <th className="py-3 px-4 text-left">Student Name</th>
                                    <th className="py-3 px-4 text-left">Email</th>
                                    <th className="py-3 px-4 text-left">Branch</th>
                                    <th className="py-3 px-4 text-left">Semester</th>
                                    <th className="py-3 px-4 text-left">Applied On</th>
                                    <th className="py-3 px-4 text-left">Resume</th>
                                    <th className="py-3 px-4 text-left">Status</th>
                                    <th className="py-3 px-4 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {applications.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="py-8 text-center text-gray-500">
                                            No applications found for this drive.
                                        </td>
                                    </tr>
                                ) : (
                                    applications.map(app => (
                                        <tr key={app._id} className="border-b hover:bg-gray-50">
                                            <td className="py-3 px-4 font-medium">
                                                {app.student?.enrollmentNo || 'N/A'}
                                            </td>
                                            <td className="py-3 px-4">
                                                {getFullName(app.student)}
                                            </td>
                                            <td className="py-3 px-4">
                                                {app.student?.email || 'N/A'}
                                            </td>
                                            <td className="py-3 px-4">
                                                {app.student?.branch || 'N/A'}
                                            </td>
                                            <td className="py-3 px-4">
                                                {app.student?.semester || 'N/A'}
                                            </td>
                                            <td className="py-3 px-4">
                                                {new Date(app.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="py-3 px-4">
                                                {app.student?.resumeLink ? (
                                                    <a 
                                                        href={app.student.resumeLink} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-semibold hover:bg-blue-100 hover:text-blue-800 border border-blue-200 transition-colors shadow-sm"
                                                    >
                                                        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"></path>
                                                        </svg>
                                                        View Resume
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400 text-xs italic">Not Uploaded</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 rounded text-xs font-semibold
                                                    ${app.status === 'Applied' ? 'bg-blue-100 text-blue-800' :
                                                      app.status === 'Shortlisted' ? 'bg-yellow-100 text-yellow-800' :
                                                      app.status === 'Selected' ? 'bg-green-100 text-green-800' :
                                                      app.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                                      app.status === 'Waitlisted' ? 'bg-purple-100 text-purple-800' :
                                                      'bg-gray-100 text-gray-800'
                                                    }`}
                                                >
                                                    {app.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <select 
                                                    value={app.status} 
                                                    onChange={(e) => handleStatusUpdate(app._id, e.target.value)}
                                                    className="p-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="Applied">Applied</option>
                                                    <option value="Shortlisted">Shortlisted</option>
                                                    <option value="Selected">Selected</option>
                                                    <option value="Waitlisted">Waitlisted</option>
                                                    <option value="Rejected">Rejected</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                    
                    {/* Summary Section */}
                    {applications.length > 0 && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                            <h3 className="font-semibold mb-2">Summary</h3>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <div>
                                    <span className="text-sm text-gray-600">Total Applications:</span>
                                    <p className="font-bold">{applications.length}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600">Applied:</span>
                                    <p className="font-bold text-blue-600">
                                        {applications.filter(a => a.status === 'Applied').length}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600">Shortlisted:</span>
                                    <p className="font-bold text-yellow-600">
                                        {applications.filter(a => a.status === 'Shortlisted').length}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600">Selected:</span>
                                    <p className="font-bold text-green-600">
                                        {applications.filter(a => a.status === 'Selected').length}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600">Rejected:</span>
                                    <p className="font-bold text-red-600">
                                        {applications.filter(a => a.status === 'Rejected').length}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Applications;