import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { baseApiURL } from '../../baseUrl';

const Drives = () => {
    const [drives, setDrives] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [formData, setFormData] = useState({
        company: '', title: '', driveDate: '', registrationDeadline: '', mode: 'Offline', minCGPA: 0, min10thPercentage: 0, min12thPercentage: 0
    });

    useEffect(() => {
        fetchDrives();
        fetchCompanies();
    }, []);

    const fetchDrives = async () => {
        try {
            const res = await axios.get(`${baseApiURL()}/placement/drives/get`);
            if (res.data.success) {
                setDrives(res.data.drives);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchCompanies = async () => {
        try {
            const res = await axios.get(`${baseApiURL()}/placement/companies/get`);
            if (res.data.success) {
                setCompanies(res.data.companies);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            ...formData,
            eligibilityCriteria: {
                minCGPA: formData.minCGPA,
                min10thPercentage: formData.min10thPercentage,
                min12thPercentage: formData.min12thPercentage
            }
        };
        try {
            const res = await axios.post(`${baseApiURL()}/placement/drives/add`, payload);
            if (res.data.success) {
                toast.success(res.data.message);
                fetchDrives();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error adding drive');
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Placement Drives Management</h2>
            <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 p-6 rounded-lg shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select name="company" value={formData.company} onChange={handleChange} required className="p-2 border rounded">
                        <option value="">Select Company</option>
                        {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                    <input type="text" name="title" placeholder="Job Title" value={formData.title} onChange={handleChange} required className="p-2 border rounded" />
                    <input type="date" name="driveDate" placeholder="Drive Date" value={formData.driveDate} onChange={handleChange} required className="p-2 border rounded" />
                    <input type="date" name="registrationDeadline" placeholder="Deadline" value={formData.registrationDeadline} onChange={handleChange} required className="p-2 border rounded" />
                    <select name="mode" value={formData.mode} onChange={handleChange} className="p-2 border rounded">
                        <option value="Offline">Offline</option>
                        <option value="Online">Online</option>
                        <option value="Hybrid">Hybrid</option>
                    </select>
                    <input type="number" step="0.1" name="minCGPA" placeholder="Min CGPA" value={formData.minCGPA} onChange={handleChange} className="p-2 border rounded" />
                </div>
                <button type="submit" className="mt-4 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">Add Drive</button>
            </form>

            <div className="grid grid-cols-1 gap-4">
                {drives.map(drive => (
                    <div key={drive._id} className="border p-4 rounded-lg shadow hover:shadow-md transition flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-xl">{drive.title} <span className="text-sm font-normal text-gray-500">at {drive.company?.name}</span></h3>
                            <p className="text-sm text-gray-600">Date: {new Date(drive.driveDate).toLocaleDateString()} | Mode: {drive.mode}</p>
                        </div>
                        <div>
                            <span className={`px-3 py-1 rounded-full text-sm ${drive.status === 'Upcoming' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{drive.status}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Drives;
