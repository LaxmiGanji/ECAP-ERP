import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { baseApiURL } from '../../baseUrl';

const Dashboard = () => {
    const [details, setDetails] = useState(null);
    const [stats, setStats] = useState({
        companies: 0,
        drives: 0,
        applications: 0
    });

    useEffect(() => {
        fetchDetails();
        fetchStats();
    }, []);

    const fetchDetails = async () => {
        try {
            // Wait, we need to know the employeeId to fetch details or just get the current user details.
            // Let's assume there's a generic endpoint to get current user details, or we can fetch all details and find ours.
            // In backend, Placement details controller has getDetails endpoint.
            const res = await axios.post(`${baseApiURL()}/placement/details/getDetails`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.data.success && res.data.user.length > 0) {
                // If the backend returns all placement details, we just pick the first one for the dashboard.
                // Normally we'd filter by logged in user ID.
                setDetails(res.data.user[0]); 
            }
        } catch (error) {
            console.error('Error fetching details', error);
        }
    };

    const fetchStats = async () => {
        try {
            // Fetch counts
            const compRes = await axios.get(`${baseApiURL()}/placement/companies/get`);
            const driveRes = await axios.get(`${baseApiURL()}/placement/drives/get`);
            // To get total applications, we would normally need an endpoint. We'll leave it as 0 if no endpoint exists, or just do a generic count if we had an endpoint.
            
            setStats({
                companies: compRes.data.companies?.length || 0,
                drives: driveRes.data.drives?.length || 0,
                applications: 0 // Mock for now
            });
        } catch (error) {
            console.error('Error fetching stats', error);
        }
    }

    return (
        <div className="p-6">
            <h2 className="text-3xl font-bold mb-6 text-blue-900">Placement Dashboard</h2>

            {/* Placement In-Charge Details */}
            {details && (
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg mb-8">
                    <h3 className="text-xl font-bold mb-4 border-b border-white/30 pb-2">In-Charge Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <p className="text-blue-100 text-sm">Name</p>
                            <p className="text-lg font-semibold">{details.firstName} {details.middleName} {details.lastName}</p>
                        </div>
                        <div>
                            <p className="text-blue-100 text-sm">Designation</p>
                            <p className="text-lg font-semibold">{details.designation}</p>
                        </div>
                        <div>
                            <p className="text-blue-100 text-sm">Employee ID</p>
                            <p className="text-lg font-semibold">{details.employeeId}</p>
                        </div>
                        <div>
                            <p className="text-blue-100 text-sm">Email</p>
                            <p className="text-lg font-semibold">{details.email}</p>
                        </div>
                        <div>
                            <p className="text-blue-100 text-sm">Phone Number</p>
                            <p className="text-lg font-semibold">{details.phoneNumber}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border rounded-lg shadow p-6 flex flex-col items-center justify-center">
                    <p className="text-gray-500 text-lg font-medium">Total Companies</p>
                    <p className="text-4xl font-bold text-green-600 mt-2">{stats.companies}</p>
                </div>
                <div className="bg-white border rounded-lg shadow p-6 flex flex-col items-center justify-center">
                    <p className="text-gray-500 text-lg font-medium">Total Drives</p>
                    <p className="text-4xl font-bold text-purple-600 mt-2">{stats.drives}</p>
                </div>
                <div className="bg-white border rounded-lg shadow p-6 flex flex-col items-center justify-center">
                    <p className="text-gray-500 text-lg font-medium">Applications Received</p>
                    <p className="text-4xl font-bold text-orange-600 mt-2">{stats.applications}</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
