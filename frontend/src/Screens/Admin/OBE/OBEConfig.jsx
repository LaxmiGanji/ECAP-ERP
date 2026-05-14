// components/OBE/OBEConfig.jsx
import React, { useState, useEffect } from 'react';
import CourseOutcome from './CourseOutcome';
import CoPoMapping from './CoPoMapping';
import { FiBook, FiLink, FiSettings } from 'react-icons/fi';

const OBEConfig = ({ branch }) => {
  const [activeTab, setActiveTab] = useState('course-outcomes');

  const tabs = [
    { 
      id: 'course-outcomes', 
      label: 'Course Outcomes', 
      icon: <FiBook className="w-5 h-5" />,
      description: 'Define and manage Course Outcomes for subjects'
    },
    { 
      id: 'co-po-mapping', 
      label: 'CO-PO Mapping', 
      icon: <FiLink className="w-5 h-5" />,
      description: 'Map Course Outcomes to Program Outcomes'
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'course-outcomes':
        return <CourseOutcome branch={branch} />;
      case 'co-po-mapping':
        return <CoPoMapping branch={branch} />;
      default:
        return <CourseOutcome branch={branch} />;
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <FiSettings className="text-blue-600 text-2xl" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">OBE Configuration</h1>
            <p className="text-gray-600">Outcome Based Education Management System</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="flex border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`flex-1 px-6 py-4 text-center transition-all duration-200 ${
                activeTab === tab.id 
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <div className="flex items-center justify-center space-x-2">
                {tab.icon}
                <span className="font-medium">{tab.label}</span>
              </div>
            </button>
          ))}
        </div>
        
        {/* Tab Description */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            {tabs.find(tab => tab.id === activeTab)?.icon}
            <div>
              <h3 className="font-semibold text-gray-800">
                {tabs.find(tab => tab.id === activeTab)?.label}
              </h3>
              <p className="text-sm text-gray-600">
                {tabs.find(tab => tab.id === activeTab)?.description}
              </p>
            </div>
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

export default OBEConfig;