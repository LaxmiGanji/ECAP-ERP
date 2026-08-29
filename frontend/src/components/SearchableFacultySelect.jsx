import React, { useState, useEffect, useRef } from "react";
import { FiSearch, FiChevronDown, FiX } from "react-icons/fi";

const SearchableFacultySelect = ({ faculties = [], value, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);

  const getFullName = (f) => {
    if (!f) return "";
    return [f.firstName, f.middleName, f.lastName].filter(Boolean).join(" ").trim();
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredFaculties = faculties.filter((f) => {
    const full = `${getFullName(f)} ${f.employeeId || ''}`.toLowerCase();
    return full.includes(searchTerm.toLowerCase());
  });

  // Find matching faculty by full name, partial name, or legacy first+last name
  const selectedFacultyObj = faculties.find(f => {
    const full = getFullName(f);
    const legacy = `${f.firstName || ''} ${f.lastName || ''}`.trim();
    return full === value || legacy === value || f.employeeId === value;
  });

  const displayValue = selectedFacultyObj
    ? `${getFullName(selectedFacultyObj)} (${selectedFacultyObj.employeeId || 'ID'})`
    : value;

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          disabled={disabled}
          placeholder={disabled ? "N/A for Special Period" : "Search & Select Faculty..."}
          value={isOpen ? searchTerm : (displayValue || "")}
          onFocus={() => {
            if (!disabled) {
              setIsOpen(true);
              setSearchTerm("");
            }
          }}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen && !disabled) setIsOpen(true);
          }}
          className={`w-full text-xs font-semibold rounded-xl bg-white border border-slate-300 pr-8 pl-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
            disabled ? "bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200" : ""
          }`}
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          {isOpen ? <FiSearch size={14} /> : <FiChevronDown size={14} />}
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1.5 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-1 text-xs divide-y divide-slate-100">
          <div
            className="px-3 py-2 text-slate-400 hover:bg-slate-50 cursor-pointer font-medium italic flex items-center justify-between"
            onClick={() => {
              onChange("");
              setIsOpen(false);
            }}
          >
            <span>-- Clear Selection --</span>
            <FiX size={12} />
          </div>

          {filteredFaculties.length === 0 ? (
            <div className="px-3 py-2.5 text-slate-400 font-medium text-center">
              No matching faculty found
            </div>
          ) : (
            filteredFaculties.map((f) => {
              const fullName = getFullName(f);
              const isSelected = value === fullName || value === `${f.firstName || ''} ${f.lastName || ''}`.trim();
              return (
                <div
                  key={f._id || f.employeeId}
                  className={`px-3 py-2.5 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer font-semibold transition-colors flex items-center justify-between ${
                    isSelected ? "bg-indigo-50 text-indigo-700 font-bold" : "text-slate-700"
                  }`}
                  onClick={() => {
                    onChange(fullName);
                    setIsOpen(false);
                  }}
                >
                  <span>{fullName}</span>
                  <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50/80 border border-indigo-100 px-1.5 py-0.5 rounded-md">
                    {f.employeeId}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableFacultySelect;
