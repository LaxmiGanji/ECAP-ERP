// FacultyOBEConfig.jsx
import React, { useState } from 'react';
import CourseOutcome from '../Admin/OBE/CourseOutcome';
import CoPoMapping from '../Admin/OBE/CoPoMapping';
import { FiBook, FiLink, FiSettings, FiCpu } from 'react-icons/fi';

const FacultyOBEConfig = () => {
  const [activeTab, setActiveTab] = useState('course-outcomes');

  const tabs = [
    { 
      id: 'course-outcomes', 
      label: 'Course Outcomes', 
      icon: <FiBook className="w-5 h-5" />,
      description: 'Define and manage Course Outcomes for subjects. Automatic CO-PO mapping is applied on save.'
    },
    { 
      id: 'co-po-mapping', 
      label: 'CO-PO Mapping', 
      icon: <FiLink className="w-5 h-5" />,
      description: 'View auto-mapped matrix and customize/edit CO-PO mapping strengths'
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'course-outcomes':
        return <CourseOutcome />;
      case 'co-po-mapping':
        return <CoPoMapping />;
      default:
        return <CourseOutcome />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
              <FiSettings className="text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Faculty OBE & CO-PO Mapping</h1>
              <p className="text-gray-600 text-sm mt-1">
                Manage Course Outcomes with Automatic & Editable CO-PO Mapping
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-200">
            <FiCpu className="text-emerald-600 text-sm" />
            <span>Auto-Mapping Engine Active</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`flex-1 px-6 py-4 text-center transition-all duration-200 ${
                activeTab === tab.id 
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50 font-semibold'
                  : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50 font-medium'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <div className="flex items-center justify-center space-x-2">
                {tab.icon}
                <span>{tab.label}</span>
              </div>
            </button>
          ))}
        </div>
        
        {/* Tab Description */}
        <div className="p-4 bg-gray-50/70 border-b border-gray-200">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            {tabs.find(tab => tab.id === activeTab)?.icon}
            <span className="font-medium text-gray-800">
              {tabs.find(tab => tab.id === activeTab)?.label}:
            </span>
            <span>
              {tabs.find(tab => tab.id === activeTab)?.description}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default FacultyOBEConfig;
