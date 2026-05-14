import React, { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import axios from "axios";
import { toast } from "react-hot-toast";
import { baseApiURL } from "../../baseUrl";

const QrScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const [manualEntry, setManualEntry] = useState({
    enrollmentNo: "",
    date: new Date().toISOString().split("T")[0],
    status: "present",
    notes: ""
  });
  const scannerRef = useRef(null);

  useEffect(() => {
    // Initialize scanner
    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        qrbox: {
          width: 250,
          height: 250,
        },
        fps: 5,
      },
      false
    );

    scannerRef.current = scanner;

    const onScanSuccess = async (decodedText) => {
      try {
        setLoading(true);
        const response = await axios.post(
          `${baseApiURL()}/transport/attendance/scan`,
          { qrData: decodedText },
          {
            headers: { "Content-Type": "application/json" },
          }
        );

        if (response.data.success) {
          toast.success(response.data.message);
          setScanResult(response.data);
          
          // Add to scan history
          setScanHistory(prev => [response.data, ...prev.slice(0, 9)]);
          
          // Clear result after 3 seconds
          setTimeout(() => {
            setScanResult(null);
          }, 3000);
        } else {
          toast.error(response.data.message);
        }
      } catch (error) {
        console.error("Scan error:", error);
        toast.error(error.response?.data?.message || "Scan failed");
      } finally {
        setLoading(false);
      }
    };

    const onScanFailure = (error) => {
      // Handle scan failure silently
      console.warn("QR scan error:", error);
    };

    scanner.render(onScanSuccess, onScanFailure);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, []);

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualEntry.enrollmentNo) {
      toast.error("Please enter enrollment number");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${baseApiURL()}/transport/attendance/manual`,
        manualEntry,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        setScanResult(response.data);
        setManualEntry({
          enrollmentNo: "",
          date: new Date().toISOString().split("T")[0],
          status: "present",
          notes: ""
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Manual entry failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">QR Code Scanner</h2>
        <p className="text-gray-600 mb-6">Scan student QR codes to mark attendance</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scanner Section */}
          <div className="space-y-4">
            <div className="bg-gray-100 rounded-xl p-4">
              <div id="reader" className="w-full"></div>
            </div>
            
            {loading && (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}

            {scanResult && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">✅</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-green-800">Attendance Recorded</h4>
                    <p className="text-green-700">{scanResult.message}</p>
                    {scanResult.student && (
                      <div className="mt-2 space-y-1 text-sm">
                        <p><span className="font-medium">Name:</span> {scanResult.student.name}</p>
                        <p><span className="font-medium">Enrollment:</span> {scanResult.student.enrollmentNo}</p>
                        <p><span className="font-medium">Bus:</span> {scanResult.student.busNumber}</p>
                        <p><span className="font-medium">Seat:</span> {scanResult.student.seatNumber}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Manual Entry Section */}
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-800 mb-4">Manual Attendance Entry</h3>
              
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Enrollment Number
                  </label>
                  <input
                    type="text"
                    value={manualEntry.enrollmentNo}
                    onChange={(e) => setManualEntry(prev => ({
                      ...prev,
                      enrollmentNo: e.target.value.toUpperCase()
                    }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter enrollment number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={manualEntry.date}
                    onChange={(e) => setManualEntry(prev => ({
                      ...prev,
                      date: e.target.value
                    }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={manualEntry.status}
                    onChange={(e) => setManualEntry(prev => ({
                      ...prev,
                      status: e.target.value
                    }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="present">Present</option>
                    <option value="late">Late</option>
                    <option value="absent">Absent</option>
                    <option value="excused">Excused</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={manualEntry.notes}
                    onChange={(e) => setManualEntry(prev => ({
                      ...prev,
                      notes: e.target.value
                    }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="2"
                    placeholder="Any additional notes..."
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Mark Attendance"}
                </button>
              </form>
            </div>

            {/* Recent Scans */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Recent Scans</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {scanHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No scans yet</p>
                ) : (
                  scanHistory.map((scan, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{scan.student?.name || scan.attendance?.enrollmentNo}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(scan.attendance?.date || Date.now()).toLocaleTimeString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        scan.attendance?.status === "present" 
                          ? "bg-green-100 text-green-800" 
                          : scan.attendance?.status === "late"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {scan.attendance?.status || "present"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <h3 className="font-semibold text-blue-800 mb-2">How to Use</h3>
        <ul className="space-y-2 text-blue-700">
          <li className="flex items-start gap-2">
            <span>1.</span>
            <span>Allow camera access when prompted</span>
          </li>
          <li className="flex items-start gap-2">
            <span>2.</span>
            <span>Position the student's QR code within the scanner frame</span>
          </li>
          <li className="flex items-start gap-2">
            <span>3.</span>
            <span>Attendance will be automatically recorded upon successful scan</span>
          </li>
          <li className="flex items-start gap-2">
            <span>4.</span>
            <span>Use manual entry for students without QR codes</span>
          </li>
          <li className="flex items-start gap-2">
            <span>5.</span>
            <span>Ensure you have an active internet connection</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default QrScanner;