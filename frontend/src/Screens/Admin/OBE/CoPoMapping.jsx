// components/OBE/CoPoMapping.jsx
import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { 
  FiBook, 
  FiGitBranch, 
  FiCalendar, 
  FiLink, 
  FiInfo, 
  FiDownload,
  FiFileText 
} from "react-icons/fi";
import { baseApiURL } from "../../../baseUrl";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const CoPoMapping = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [coPoMappings, setCoPoMappings] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPOInfo, setShowPOInfo] = useState(false);
  const [coAttainments, setCoAttainments] = useState([]);
  const [poAttainments, setPoAttainments] = useState([]);

  // Program Outcomes Data
  const poData = [
    { poNumber: 'PO1', title: 'Engineering knowledge', description: 'An ability to apply knowledge of mathematics (including probability, statistics and discrete mathematics), science, and engineering for solving Engineering problems and Knowledge.' },
    { poNumber: 'PO2', title: 'Problem analysis', description: 'An ability to design, simulate and conduct experiments, as well as to analyze and interpret data including hardware and software components.' },
    { poNumber: 'PO3', title: 'Design / development of solutions', description: 'An ability to design a complex electronic system or process to meet desired specifications and needs.' },
    { poNumber: 'PO4', title: 'Conduct investigations of complex Problem', description: 'An ability to identify, formulate, comprehend, analyze, design synthesis of the information to solve complex engineering problems and provide valid conclusions.' },
    { poNumber: 'PO5', title: 'Modern tool usage', description: 'An ability to use the techniques, skills and modern engineering tools necessary for engineering practice' },
    { poNumber: 'PO6', title: 'The engineer and society', description: 'An understanding of professional, health, safety, legal,' },
    { poNumber: 'PO7', title: 'Environment and sustainability', description: 'The broad education necessary to understand the impact of engineering solutions in a global, economic, environmental and demonstrate the knowledge need for sustainable development' },
    { poNumber: 'PO8', title: 'Ethics', description: 'Apply ethical principles, responsibility and norms of the engineering practice.' },
    { poNumber: 'PO9', title: 'Individual and team work', description: 'An ability to function on multi-disciplinary teams.' },
    { poNumber: 'PO10', title: 'Communication', description: 'An ability to communicate and present effectively' },
    { poNumber: 'PO11', title: 'Project management and finance', description: 'An ability to use the modern engineering tools, techniques, skills and management principles to do work as a member and leader in a team, to manage projects in multi-disciplinary environments' },
    { poNumber: 'PO12', title: 'Life-long learning', description: 'A recognition of the need for, and an ability to engage in, to resolve contemporary issues and acquire lifelong learning' }
  ];

  useEffect(() => {
    getSubjectsHandler();
  }, []);

  const getSubjectsHandler = () => {
    setLoading(true);
    axios
      .get(`${baseApiURL()}/subject/getSubject`)
      .then((response) => {
        if (response.data.success) {
          setSubjects(response.data.subject);
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleSubjectSelect = (subject) => {
    setSelectedSubject(subject);
    setLoading(true);
    
    // Fetch both CO-PO mappings and attainments in parallel
    Promise.all([
      axios.get(`${baseApiURL()}/subject/getCoPoMappings/${subject._id}`),
      axios.get(`${baseApiURL()}/coattainment/attainments/${subject._id}`)
    ])
      .then(([mappingResponse, attainmentResponse]) => {
        if (mappingResponse.data.success) {
          setCoPoMappings(mappingResponse.data.coPoMatrix || {});
        } else {
          toast.error(mappingResponse.data.message);
        }
        
        if (attainmentResponse.data.success) {
          const coAtt = attainmentResponse.data.coAttainments || [];
          setCoAttainments(coAtt);

          // Compute PO attainments locally using weighted-average formula:
          // PO = Σ(CO_attainment × strength) / Σ(strength)
          const computedPo = computePoFromCoAttainments(coAtt, mappingResponse.data.coPoMatrix || {});
          setPoAttainments(computedPo);

          // Also set any server-provided PO attainments for reference (optional)
          // setPoAttainments(attainmentResponse.data.poAttainments || computedPo);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        toast.error(error.response?.data?.message || error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleStrengthChange = async (coNumber, poNumber) => {
    if (!selectedSubject) return;

    const currentStrength = coPoMappings[coNumber]?.[poNumber] || null;
    let nextStrength;
    
    // Cycle through: null → 3 → 2 → 1 → null
    if (currentStrength === null) nextStrength = 3;
    else if (currentStrength === 3) nextStrength = 2;
    else if (currentStrength === 2) nextStrength = 1;
    else nextStrength = null;

    try {
      const response = await axios.put(
        `${baseApiURL()}/subject/updateCoPoMapping/${selectedSubject._id}`,
        { 
          coNumber, 
          poNumber, 
          strength: nextStrength 
        }
      );

      if (response.data.success) {
        // Update local state
        const updatedMappings = { ...coPoMappings };
        if (!updatedMappings[coNumber]) updatedMappings[coNumber] = {};
        updatedMappings[coNumber][poNumber] = nextStrength;
        setCoPoMappings(updatedMappings);
        
        // Update attainments if returned from server
        if (response.data.poAttainments) {
          setPoAttainments(response.data.poAttainments);
        }
        
        toast.success("Mapping updated successfully");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const getStrengthColor = (strength) => {
    switch (strength) {
      case 3: return 'bg-green-500 hover:bg-green-600';
      case 2: return 'bg-yellow-500 hover:bg-yellow-600';
      case 1: return 'bg-red-500 hover:bg-red-600';
      default: return 'bg-gray-200 hover:bg-gray-300';
    }
  };

  const getStrengthText = (strength) => {
    switch (strength) {
      case 3: return 'Strong';
      case 2: return 'Medium';
      case 1: return 'Weak';
      default: return 'Not Mapped';
    }
  };

  const exportToExcel = () => {
    if (!selectedSubject || !selectedSubject.courseOutcomes?.length) {
      toast.error("No data available to export");
      return;
    }

    try {
      // Prepare worksheet data
      const wsData = [];
      
      // Header row 1: PO Numbers
      const headerRow1 = ['CO Number', 'CO Description'];
      poData.forEach(po => {
        headerRow1.push(`${po.poNumber}`);
      });
      wsData.push(headerRow1);
      
      // Header row 2: PO Titles (abbreviated)
      const headerRow2 = ['', ''];
      poData.forEach(po => {
        const shortTitle = po.title.split(' ').slice(0, 2).join(' ');
        headerRow2.push(shortTitle);
      });
      wsData.push(headerRow2);
      
      // Data rows for each CO
      selectedSubject.courseOutlements.forEach(co => {
        const row = [
          co.coNumber,
          co.description || ''
        ];
        
        poData.forEach(po => {
          const strength = coPoMappings[co.coNumber]?.[po.poNumber] || null;
          let strengthText = '';
          if (strength === 3) strengthText = 'Strong (3)';
          else if (strength === 2) strengthText = 'Medium (2)';
          else if (strength === 1) strengthText = 'Weak (1)';
          else strengthText = 'Not Mapped';
          
          row.push(strengthText);
        });
        
        wsData.push(row);
      });
      
      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Set column widths
      const colWidths = [
        { wch: 12 }, // CO Number
        { wch: 60 }, // CO Description
        ...poData.map(() => ({ wch: 15 })) // PO columns
      ];
      ws['!cols'] = colWidths;
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'CO-PO Mapping');
      
      // Add summary sheet
      const summaryData = [
        ['Subject Information', ''],
        ['Subject Code', selectedSubject.code],
        ['Subject Name', selectedSubject.name],
        ['Branch', selectedSubject.branch?.name || 'N/A'],
        ['Semester', selectedSubject.semester],
        ['Date Exported', new Date().toLocaleDateString()],
        ['', ''],
        ['Mapping Summary', ''],
        ['Strong Mappings', Object.keys(coPoMappings).reduce((acc, co) => {
          return acc + Object.values(coPoMappings[co]).filter(val => val === 3).length;
        }, 0)],
        ['Medium Mappings', Object.keys(coPoMappings).reduce((acc, co) => {
          return acc + Object.values(coPoMappings[co]).filter(val => val === 2).length;
        }, 0)],
        ['Weak Mappings', Object.keys(coPoMappings).reduce((acc, co) => {
          return acc + Object.values(coPoMappings[co]).filter(val => val === 1).length;
        }, 0)],
        ['Total Mappings', Object.keys(coPoMappings).reduce((acc, co) => {
          return acc + Object.values(coPoMappings[co]).filter(val => val !== null).length;
        }, 0)],
        ['Total Possible Mappings', selectedSubject.courseOutcomes?.length * 12],
        ['Mapping Coverage', `${((Object.keys(coPoMappings).reduce((acc, co) => {
          return acc + Object.values(coPoMappings[co]).filter(val => val !== null).length;
        }, 0) / (selectedSubject.courseOutcomes?.length * 12)) * 100).toFixed(1)}%`]
      ];
      
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      summaryWs['!cols'] = [{ wch: 25 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
      
      // Generate Excel file
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
      
      // Convert to blob and save
      const buf = new ArrayBuffer(wbout.length);
      const view = new Uint8Array(buf);
      for (let i = 0; i < wbout.length; i++) view[i] = wbout.charCodeAt(i) & 0xFF;
      
      const blob = new Blob([buf], { type: 'application/octet-stream' });
      
      const fileName = `CO-PO_Mapping_${selectedSubject.code}_${new Date().toISOString().split('T')[0]}.xlsx`;
      saveAs(blob, fileName);
      
      toast.success("Excel file exported successfully!");
      
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Failed to export Excel file");
    }
  };

  const exportToCSV = () => {
    if (!selectedSubject || !selectedSubject.courseOutcomes?.length) {
      toast.error("No data available to export");
      return;
    }

    try {
      // Prepare CSV data
      let csvContent = "data:text/csv;charset=utf-8,";
      
      // Header
      const headers = ['CO Number', 'CO Description', ...poData.map(po => po.poNumber)];
      csvContent += headers.join(',') + '\r\n';
      
      // Data rows
      selectedSubject.courseOutcomes.forEach(co => {
        const row = [
          `"${co.coNumber}"`,
          `"${(co.description || '').replace(/"/g, '""')}"`,
          ...poData.map(po => {
            const strength = coPoMappings[co.coNumber]?.[po.poNumber] || null;
            return strength !== null ? strength : '';
          })
        ];
        csvContent += row.join(',') + '\r\n';
      });
      
      // Create download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `CO-PO_Mapping_${selectedSubject.code}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("CSV file exported successfully!");
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      toast.error("Failed to export CSV file");
    }
  };

  // Compute PO attainments locally using weighted average formula
  const computePoFromCoAttainments = (coAttainmentsArr, coPoMatrix) => {
    // po keys PO1..PO12
    const poKeys = Array.from({ length: 12 }, (_, i) => `PO${i + 1}`);
    const result = [];

    poKeys.forEach((po) => {
      let totalAttainment = 0;
      let mappedCount = 0;

      (coAttainmentsArr || []).forEach((coObj) => {
        const coNum = coObj.coNumber;
        const coAtt = Number(coObj.attainment) || 0;
        const strength = (coPoMatrix && coPoMatrix[coNum]) ? coPoMatrix[coNum][po] : null;
        if (strength !== null && typeof strength !== 'undefined') {
          const s = Number(strength) || 0;
          if (s > 0) {
            totalAttainment += (coAtt * s) / 3;
            mappedCount += s;
          }
        }
      });

      const attainment = mappedCount > 0 ? parseFloat(((totalAttainment / mappedCount) * 100).toFixed(2)) : 0;
      result.push({ poNumber: po, attainment });
    });

    return result;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">CO-PO Mapping</h1>
            <p className="text-gray-600 mt-2">Map Course Outcomes to Program Outcomes</p>
          </div>
          <div className="flex items-center space-x-3">
            {selectedSubject && (
              <div className="flex items-center space-x-2">
                
                <button
                  onClick={exportToCSV}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                >
                  <FiFileText size={18} />
                  <span>Export CSV</span>
                </button>
              </div>
            )}
            <button
              onClick={() => setShowPOInfo(!showPOInfo)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200"
            >
              <FiInfo size={18} />
              <span>PO Details</span>
            </button>
          </div>
        </div>
      </div>

      {/* PO Info Modal */}
      {showPOInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Program Outcomes (POs) Details</h2>
                <button
                  onClick={() => setShowPOInfo(false)}
                  className="text-white hover:text-gray-200 text-xl"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                {poData.map((po) => (
                  <div key={po.poNumber} className="border-l-4 border-purple-500 pl-4 py-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-bold text-purple-700">{po.poNumber}</span>
                      <span className="font-semibold text-gray-800">{po.title}</span>
                    </div>
                    <p className="text-gray-600 text-sm">{po.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column - Subject Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <FiBook className="text-purple-600 text-lg" />
              <h2 className="text-xl font-semibold text-gray-800">Select Subject</h2>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {subjects.map((subject) => (
                  <div
                    key={subject._id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                      selectedSubject?._id === subject._id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleSubjectSelect(subject)}
                  >
                    <h3 className="font-medium text-gray-900">{subject.code} - {subject.name}</h3>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <FiGitBranch className="text-green-500" />
                        <span>{subject.branch?.name || 'N/A'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FiCalendar className="text-purple-500" />
                        <span>Sem {subject.semester}</span>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-between">
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                        {subject.courseOutcomes?.length || 0} COs
                      </span>
                      {subject.coPoMappings?.length > 0 && (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                          {subject.coPoMappings.length} Mappings
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                
                {subjects.length === 0 && (
                  <div className="text-center py-8">
                    <FiBook className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No subjects found. Add subjects first.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
            <div className="flex items-center space-x-2 mb-4">
              <FiLink className="text-purple-600 text-lg" />
              <h3 className="text-lg font-semibold text-gray-800">Mapping Legend</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center text-white font-bold">
                  3
                </div>
                <span className="text-gray-700">Strong</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-yellow-500 rounded flex items-center justify-center text-white font-bold">
                  2
                </div>
                <span className="text-gray-700">Medium</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center text-white font-bold">
                  1
                </div>
                <span className="text-gray-700">Weak</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-gray-700 font-bold">
                  _
                </div>
                <span className="text-gray-700">Not Mapped</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                <strong>Instructions:</strong> Click on any cell to cycle through mapping strengths.
              </p>
              <p className="text-sm text-gray-500 mt-1">
                <strong>Export:</strong> Use the Export buttons to download data in Excel or CSV format.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - CO-PO Matrix */}
        <div className="lg:col-span-3">
          {selectedSubject ? (
            <div className="space-y-8">
              {/* Subject Info */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {selectedSubject.code} - {selectedSubject.name}
                    </h2>
                    <div className="flex items-center space-x-6 mt-2">
                      <span className="text-gray-600">
                        <FiGitBranch className="inline mr-1" />
                        {selectedSubject.branch?.name}
                      </span>
                      <span className="text-gray-600">
                        <FiCalendar className="inline mr-1" />
                        Semester {selectedSubject.semester}
                      </span>
                      <span className="text-gray-600">
                        <FiLink className="inline mr-1" />
                        {selectedSubject.courseOutcomes?.length || 0} Course Outcomes
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Total Mappings</div>
                    <div className="text-3xl font-bold text-purple-600">
                      {Object.keys(coPoMappings).reduce((acc, co) => {
                        return acc + Object.values(coPoMappings[co]).filter(val => val !== null).length;
                      }, 0)}
                    </div>
                  </div>
                </div>
              </div>

              {/* CO-PO Mapping Matrix */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                  </div>
                ) : selectedSubject.courseOutcomes?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200" id="co-po-table">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            CO \ PO
                          </th>
                          {poData.map((po) => (
                            <th key={po.poNumber} className="px-4 py-4 text-center">
                              <div className="flex flex-col items-center">
                                <span className="font-bold text-purple-700">{po.poNumber}</span>
                                <span className="text-xs text-gray-500 truncate max-w-[100px]">
                                  {po.title.split(' ')[0]}
                                </span>
                              </div>
                            </th>
                          ))}

                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedSubject.courseOutcomes.map((co) => {
                          const coAttain = coAttainments.find(c => c.coNumber === co.coNumber);
                          return (
                            <tr key={co.coNumber} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 w-12 h-12 bg-purple-100 text-purple-800 rounded-lg flex items-center justify-center font-bold">
                                    {co.coNumber}
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{co.coNumber}</div>
                                    <div className="text-xs text-gray-500 truncate max-w-xs">
                                      {co.description}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              {poData.map((po) => {
                                const strength = coPoMappings[co.coNumber]?.[po.poNumber] || null;
                                return (
                                  <td key={`${co.coNumber}-${po.poNumber}`} className="px-4 py-4 text-center">
                                    <button
                                      onClick={() => handleStrengthChange(co.coNumber, po.poNumber)}
                                      className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold transition-all duration-200 ${getStrengthColor(
                                        strength
                                      )} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
                                      title={`${co.coNumber} ↔ ${po.poNumber}\n${getStrengthText(strength)}\nClick to change`}
                                    >
                                      {strength || '_'}
                                    </button>
                                  </td>
                                );
                              })}

                            </tr>
                          );
                        })}

                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FiLink className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No Course Outcomes</h3>
                    <p className="text-gray-500">
                      This subject doesn't have any Course Outcomes defined yet.
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      Add Course Outcomes first in the Course Outcomes tab.
                    </p>
                  </div>
                )}
              </div>

              {/* Summary Statistics */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Mapping Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-700">
                      {Object.keys(coPoMappings).reduce((acc, co) => {
                        return acc + Object.values(coPoMappings[co]).filter(val => val === 3).length;
                      }, 0)}
                    </div>
                    <div className="text-sm text-green-600">Strong Mappings</div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-yellow-700">
                      {Object.keys(coPoMappings).reduce((acc, co) => {
                        return acc + Object.values(coPoMappings[co]).filter(val => val === 2).length;
                      }, 0)}
                    </div>
                    <div className="text-sm text-yellow-600">Medium Mappings</div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-red-700">
                      {Object.keys(coPoMappings).reduce((acc, co) => {
                        return acc + Object.values(coPoMappings[co]).filter(val => val === 1).length;
                      }, 0)}
                    </div>
                    <div className="text-sm text-red-600">Weak Mappings</div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-700">
                      {selectedSubject.courseOutcomes?.length * 12 - 
                       Object.keys(coPoMappings).reduce((acc, co) => {
                         return acc + Object.values(coPoMappings[co]).filter(val => val !== null).length;
                       }, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Unmapped</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <FiLink className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h3 className="text-xl font-medium text-gray-700 mb-3">Select a Subject</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Choose a subject from the list to view and manage CO-PO mappings.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoPoMapping;