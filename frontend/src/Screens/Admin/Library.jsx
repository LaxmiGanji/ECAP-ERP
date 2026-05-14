import { useState } from "react";
import AddLibrary from './Library/AddLibrary';
import EditLibrary from './Library/EditLibrary';
import ViewLibrary from './Library/ViewLibrary';

const Library = () => {
    const [selected, setSelected] = useState("add");
    
    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Library Management</h1>
                        <p className="text-gray-600 mt-2">Manage library resources and student access</p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
                <div className="flex border-b border-gray-200">
                    <button
                        className={`flex-1 px-6 py-4 text-center font-medium transition-all duration-200 ${
                            selected === "add"
                                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                        onClick={() => setSelected("add")}
                    >
                        <div className="flex items-center justify-center space-x-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span>Add Student</span>
                        </div>
                    </button>
                    <button
                        className={`flex-1 px-6 py-4 text-center font-medium transition-all duration-200 ${
                            selected === "edit"
                                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                        onClick={() => setSelected("edit")}
                    >
                        <div className="flex items-center justify-center space-x-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Edit Student</span>
                        </div>
                    </button>
                    <button
                        className={`flex-1 px-6 py-4 text-center font-medium transition-all duration-200 ${
                            selected === "view"
                                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                        onClick={() => setSelected("view")}
                    >
                        <div className="flex items-center justify-center space-x-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>View Student</span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                {selected === "add" && <AddLibrary />}
                {selected === "edit" && <EditLibrary />}
                {selected === "view" && <ViewLibrary />}
            </div>
        </div>
    );
};

export default Library;