import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { baseApiURL } from '../../baseUrl';

const Companies = () => {
    const [companies, setCompanies] = useState([]);
    const [formData, setFormData] = useState({
        name: '', website: '', contactPerson: '', contactEmail: '', contactPhone: '', address: '', industryType: '', description: ''
    });

    useEffect(() => {
        fetchCompanies();
    }, []);

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
        try {
            const res = await axios.post(`${baseApiURL()}/placement/companies/add`, formData);
            if (res.data.success) {
                toast.success(res.data.message);
                fetchCompanies();
                setFormData({ name: '', website: '', contactPerson: '', contactEmail: '', contactPhone: '', address: '', industryType: '', description: '' });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error adding company');
        }
    };

    const handleDelete = async (id) => {
        try {
            const res = await axios.delete(`${baseApiURL()}/placement/companies/delete/${id}`);
            if (res.data.success) {
                toast.success(res.data.message);
                fetchCompanies();
            }
        } catch (error) {
            toast.error('Error deleting company');
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Companies Management</h2>
            <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 p-6 rounded-lg shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" name="name" placeholder="Company Name" value={formData.name} onChange={handleChange} required className="p-2 border rounded" />
                    <input type="text" name="website" placeholder="Website" value={formData.website} onChange={handleChange} className="p-2 border rounded" />
                    <input type="text" name="contactPerson" placeholder="Contact Person" value={formData.contactPerson} onChange={handleChange} className="p-2 border rounded" />
                    <input type="email" name="contactEmail" placeholder="Contact Email" value={formData.contactEmail} onChange={handleChange} className="p-2 border rounded" />
                    <input type="text" name="contactPhone" placeholder="Contact Phone" value={formData.contactPhone} onChange={handleChange} className="p-2 border rounded" />
                    <input type="text" name="industryType" placeholder="Industry Type" value={formData.industryType} onChange={handleChange} className="p-2 border rounded" />
                </div>
                <button type="submit" className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add Company</button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {companies.map(company => (
                    <div key={company._id} className="border p-4 rounded-lg shadow hover:shadow-md transition">
                        <h3 className="font-bold text-xl">{company.name}</h3>
                        <p className="text-sm text-gray-600">{company.industryType}</p>
                        <p className="mt-2 text-sm">{company.contactPerson}</p>
                        <a href={company.website} target="_blank" rel="noreferrer" className="text-blue-500 text-sm hover:underline">{company.website}</a>
                        <button onClick={() => handleDelete(company._id)} className="mt-4 text-red-500 text-sm hover:underline">Delete</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Companies;
