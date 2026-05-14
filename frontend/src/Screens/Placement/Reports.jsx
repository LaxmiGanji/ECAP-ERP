import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { baseApiURL } from '../../baseUrl';

const Reports = () => {
    return (
        <div className="p-6">
            <h2 className="text-3xl font-bold mb-6 text-blue-900">Placement Reports</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Reports Coming Soon</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                    The advanced reporting functionality is currently under construction. Future updates will allow you to generate and download comprehensive CSV and Excel reports of student applications, drive performance metrics, and training session attendance.
                </p>
                <button className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-md opacity-50 cursor-not-allowed">
                    Generate Report (Coming Soon)
                </button>
            </div>
        </div>
    );
};

export default Reports;
