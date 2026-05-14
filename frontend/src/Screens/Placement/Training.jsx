import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { baseApiURL } from '../../baseUrl';

const Training = () => {
    const [trainings, setTrainings] = useState([]);
    const [formData, setFormData] = useState({
        title: '', description: '', date: '', venue: '', trainerName: '', type: 'Other'
    });

    useEffect(() => {
        fetchTrainings();
    }, []);

    const fetchTrainings = async () => {
        try {
            const res = await axios.get(`${baseApiURL()}/placement/training/get`);
            if (res.data.success) {
                setTrainings(res.data.trainings);
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
            const res = await axios.post(`${baseApiURL()}/placement/training/add`, formData);
            if (res.data.success) {
                toast.success(res.data.message);
                fetchTrainings();
                setFormData({ title: '', description: '', date: '', venue: '', trainerName: '', type: 'Other' });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error adding training');
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Training Sessions</h2>
            <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 p-6 rounded-lg shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" name="title" placeholder="Session Title" value={formData.title} onChange={handleChange} required className="p-2 border rounded" />
                    <input type="date" name="date" value={formData.date} onChange={handleChange} required className="p-2 border rounded" />
                    <input type="text" name="venue" placeholder="Venue" value={formData.venue} onChange={handleChange} className="p-2 border rounded" />
                    <input type="text" name="trainerName" placeholder="Trainer Name" value={formData.trainerName} onChange={handleChange} className="p-2 border rounded" />
                    <select name="type" value={formData.type} onChange={handleChange} className="p-2 border rounded">
                        <option value="Aptitude">Aptitude</option>
                        <option value="Coding">Coding</option>
                        <option value="Soft Skills">Soft Skills</option>
                        <option value="Mock Interview">Mock Interview</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <button type="submit" className="mt-4 bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700">Add Session</button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trainings.map(t => (
                    <div key={t._id} className="border p-4 rounded-lg shadow hover:shadow-md transition">
                        <h3 className="font-bold text-xl">{t.title}</h3>
                        <p className="text-sm text-teal-600 font-semibold">{t.type}</p>
                        <p className="mt-2 text-sm">Date: {new Date(t.date).toLocaleDateString()}</p>
                        <p className="text-sm">Trainer: {t.trainerName}</p>
                        <p className="mt-2 text-sm text-gray-500">Registered: {t.registeredStudents?.length || 0}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Training;
