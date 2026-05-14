import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { baseApiURL } from "../../baseUrl";
import QRCode from "react-qr-code";

const Transport = () => {
  const router = useLocation();
  const enrollmentNo = router.state?.loginid;

  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingRoute, setSavingRoute] = useState("");
  const [transportChoice, setTransportChoice] = useState(null);
  const [stopSelections, setStopSelections] = useState({});
  const [paymentRefs, setPaymentRefs] = useState({});
  const [seatMap, setSeatMap] = useState(null);
  const [showSeatMap, setShowSeatMap] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [showAttendanceHistory, setShowAttendanceHistory] = useState(false);

  const headers = useMemo(() => ({ "Content-Type": "application/json" }), []);

  useEffect(() => {
    if (!enrollmentNo) {
      setLoading(false);
      return;
    }
    fetchRoutes();
    fetchStudentChoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrollmentNo]);

  const fetchRoutes = async () => {
    try {
      const res = await axios.get(`${baseApiURL()}/transport/routes`, { headers });
      if (res.data.success) {
        // Filter out sensitive information before setting routes
        const filteredRoutes = res.data.routes.map(route => ({
          ...route,
          capacity: undefined, // Remove capacity from student view
          allocatedSeats: undefined, // Remove allocated seats count
          seatConfig: undefined // Remove seat configuration
        }));
        setRoutes(filteredRoutes || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to load buses.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentChoice = async () => {
    try {
      const res = await axios.get(`${baseApiURL()}/transport/student/${enrollmentNo}`, { headers });
      if (res.data.success && res.data.transport) {
        setTransportChoice(res.data.transport);
        // If student has a seat number, fetch seat map
        if (res.data.transport.routeId && res.data.transport.seatNumber) {
          fetchSeatMap(res.data.transport.routeId);
        }
        // Fetch attendance history if student has transport
        if (res.data.transport.status === "active") {
          fetchAttendanceHistory();
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSeatMap = async (routeId) => {
    try {
      const res = await axios.get(`${baseApiURL()}/transport/routes/${routeId}/seatmap`);
      if (res.data.success) {
        // Filter seat map to only show relevant information
        const filteredSeatMap = {
          ...res.data,
          seatConfig: undefined, // Remove seat configuration
          statistics: {
            // Only show limited statistics
            occupiedSeats: res.data.statistics.occupiedSeats,
            // Hide total seats, male/female seat counts
          }
        };
        setSeatMap(filteredSeatMap);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAttendanceHistory = async () => {
    try {
      const res = await axios.get(`${baseApiURL()}/transport/attendance/history/${enrollmentNo}`, { headers });
      if (res.data.success) {
        setAttendanceHistory(res.data.attendanceHistory || []);
      }
    } catch (error) {
      console.error("Error fetching attendance history:", error);
    }
  };

  const generateStudentQR = async () => {
    if (!enrollmentNo) {
      toast.error("Session expired. Login again.");
      return;
    }

    try {
      const res = await axios.get(`${baseApiURL()}/transport/attendance/qr/${enrollmentNo}`, { headers });
      if (res.data.success) {
        setQrData(res.data);
        setShowQR(true);
        toast.success("QR code generated successfully!");
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      console.error("QR generation error:", error);
      toast.error("Unable to generate QR code");
    }
  };

  const downloadQR = () => {
    if (!qrData) return;
    
    const svg = document.getElementById("qr-code-svg");
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `transport-pass-${enrollmentNo}-${Date.now()}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
        toast.success("QR code downloaded!");
      };
      
      img.src = "data:image/svg+xml;base64," + btoa(svgData);
    }
  };

  const handleStopChange = (routeId, stopName) => {
    setStopSelections((prev) => ({ ...prev, [routeId]: stopName }));
  };

  const handlePaymentRefChange = (routeId, value) => {
    setPaymentRefs((prev) => ({ ...prev, [routeId]: value }));
  };

  const handleEnroll = async (route) => {
    if (!enrollmentNo) {
      toast.error("Session expired. Login again.");
      return;
    }
    const selectedStop = stopSelections[route._id];
    if (!selectedStop) {
      toast.error("Select a stop/station first.");
      return;
    }

    try {
      setSavingRoute(route._id);
      const payload = {
        enrollmentNo,
        routeId: route._id,
        stopName: selectedStop,
        paymentReference: paymentRefs[route._id],
      };
      const res = await axios.post(`${baseApiURL()}/transport/enroll`, payload, { headers });
      if (res.data.success) {
        toast.success("Transport preference saved.");
        setTransportChoice(res.data.transport);
        // Refresh seat map after enrollment
        if (res.data.transport.routeId) {
          fetchSeatMap(res.data.transport.routeId);
        }
        // Fetch attendance history
        fetchAttendanceHistory();
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Unable to save preference.");
    } finally {
      setSavingRoute("");
    }
  };

  // Function to render the seat map
  const renderSeatMap = () => {
    if (!seatMap || !transportChoice?.seatNumber) return null;

    const studentSeat = seatMap.seatMap
      .flatMap(row => row.seats)
      .find(seat => seat.seatNumber === transportChoice.seatNumber);

    return (
      <div className="mt-6 bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Your Seat Details</h3>
          <button
            onClick={() => setShowSeatMap(!showSeatMap)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            {showSeatMap ? "Hide Seat Map" : "Show Seat Map"}
          </button>
        </div>

        {/* Seat Information Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="text-3xl">💺</div>
                <div>
                  <p className="text-sm text-blue-600">Your Assigned Seat</p>
                  <p className="text-3xl font-bold text-blue-800">{transportChoice.seatNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                  Seat Type: <span className="font-medium capitalize">{transportChoice.seatType || 'window'}</span>
                </span>
                {studentSeat && (
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    Section: <span className="font-medium capitalize">{studentSeat.section}</span>
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-600">Seat Location</p>
              {studentSeat && (
                <p className="text-lg font-semibold text-blue-800">
                  Row {studentSeat.row}, Position {studentSeat.position}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bus Seat Map */}
        {showSeatMap && seatMap && (
          <div className="space-y-6">
            <div className="bg-gray-100 border-2 border-gray-300 rounded-2xl p-6">
              {/* Driver Area */}
              <div className="flex justify-center mb-6">
                <div className="bg-gray-300 px-6 py-2 rounded-lg">
                  <span className="text-sm font-medium">🚌 Driver & Staff Area</span>
                </div>
              </div>

              {/* Seats Grid */}
              <div className="space-y-4">
                {seatMap.seatMap.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex items-center gap-4">
                    <div className="w-16 text-sm font-medium text-gray-600">
                      Row {row.rowNumber}
                    </div>
                    <div className="flex-1 flex items-center justify-center gap-3">
                      {row.seats.map((seat, seatIndex) => (
                        <div
                          key={seatIndex}
                          className={`
                            w-16 h-16 rounded-lg flex flex-col items-center justify-center
                            font-semibold text-sm relative
                            ${seat.isOccupied && seat.seatNumber === transportChoice.seatNumber
                              ? 'bg-gradient-to-br from-blue-100 to-blue-200 border-4 border-blue-400 text-blue-800 shadow-lg'
                              : seat.isOccupied
                              ? 'bg-green-100 border-2 border-green-300 text-green-800'
                              : seat.isReserved
                              ? 'bg-gray-200 border-2 border-gray-300 text-gray-500'
                              : 'bg-white border-2 border-gray-300 text-gray-700'
                            }
                          `}
                        >
                          <div>{seat.seatNumber}</div>
                          {seat.isOccupied && (
                            <div className="text-xs mt-1 truncate max-w-full px-1">
                              {seat.allocation?.enrollmentNo === enrollmentNo ? "YOU" : "Occupied"}
                            </div>
                          )}
                          
                          {/* Highlight student's seat */}
                          {seat.seatNumber === transportChoice.seatNumber && (
                            <div className="absolute -top-2 -right-2">
                              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                <span className="text-xs text-white font-bold">★</span>
                              </div>
                            </div>
                          )}
                          
                          {/* Gender indicators - show for empty seats only */}
                          {!seat.isOccupied && !seat.isReserved && (
                            <>
                              {seat.section === 'male' && (
                                <div className="text-xs text-blue-600">♂</div>
                              )}
                              {seat.section === 'female' && (
                                <div className="text-xs text-pink-600">♀</div>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-8 pt-4 border-t border-gray-300">
                <div className="flex flex-wrap gap-4 justify-center">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-blue-400 rounded"></div>
                    <span className="text-sm text-gray-600">Your Seat</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                    <span className="text-sm text-gray-600">Occupied</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
                    <span className="text-sm text-gray-600">Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-200 border border-gray-300 rounded"></div>
                    <span className="text-sm text-gray-600">Reserved</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Limited Statistics - Only show occupied seats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-800">
                  {transportChoice.seatNumber}
                </div>
                <div className="text-sm text-blue-600">Your Seat Number</div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-gray-800">
                  {seatMap.statistics.occupiedSeats || 0}
                </div>
                <div className="text-sm text-gray-600">Students on Board</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render QR Code Modal
  const renderQRCode = () => {
    if (!qrData || !showQR) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">Your Transport Pass QR</h3>
            <button
              onClick={() => setShowQR(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              &times;
            </button>
          </div>
          
          <div className="space-y-4">
            {/* QR Code */}
            <div className="flex justify-center p-4 bg-white border-2 border-gray-200 rounded-xl">
              <QRCode
                id="qr-code-svg"
                value={qrData.qrString}
                size={256}
                level="H"
                fgColor="#1e40af"
                bgColor="#ffffff"
              />
            </div>
            
            {/* Student Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Student Details</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <p className="font-medium text-gray-800">{qrData.student.name}</p>
                </div>
                <div>
                  <span className="text-gray-600">Enrollment:</span>
                  <p className="font-medium text-gray-800">{qrData.student.enrollmentNo}</p>
                </div>
                <div>
                  <span className="text-gray-600">Branch:</span>
                  <p className="font-medium text-gray-800">{qrData.student.branch}</p>
                </div>
                <div>
                  <span className="text-gray-600">Semester:</span>
                  <p className="font-medium text-gray-800">{qrData.student.semester}</p>
                </div>
                <div>
                  <span className="text-gray-600">Bus:</span>
                  <p className="font-medium text-gray-800">{qrData.student.busNumber}</p>
                </div>
                <div>
                  <span className="text-gray-600">Seat:</span>
                  <p className="font-medium text-gray-800">{qrData.student.seatNumber || "Not assigned"}</p>
                </div>
              </div>
            </div>
            
            {/* Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
              <h5 className="font-semibold text-yellow-800 text-sm mb-1">Instructions:</h5>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li className="flex items-start gap-1">
                  <span>•</span>
                  <span>Show this QR code to the transport incharge while boarding</span>
                </li>
                <li className="flex items-start gap-1">
                  <span>•</span>
                  <span>QR code refreshes automatically for security</span>
                </li>
                <li className="flex items-start gap-1">
                  <span>•</span>
                  <span>Keep this code confidential</span>
                </li>
              </ul>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={downloadQR}
                className="flex-1 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium"
              >
                📥 Download QR
              </button>
              <button
                onClick={generateStudentQR}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                🔄 Refresh QR
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Attendance History
  const renderAttendanceHistory = () => {
    if (!showAttendanceHistory || attendanceHistory.length === 0) return null;

    return (
      <div className="mt-6 bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Attendance History</h3>
          <button
            onClick={() => setShowAttendanceHistory(false)}
            className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700"
          >
            Hide History
          </button>
        </div>

        <div className="space-y-3">
          {attendanceHistory.map((record, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  record.status === 'present' ? 'bg-green-100 text-green-600' :
                  record.status === 'late' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-red-100 text-red-600'
                }`}>
                  {record.status === 'present' ? '✓' : 
                   record.status === 'late' ? '⚠' : '✗'}
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    {new Date(record.date).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                  <p className="text-sm text-gray-500">
                    {record.scannedBy ? `Scanned by: ${record.scannedBy}` : 'Manual entry'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-800 capitalize">{record.status}</p>
                <p className="text-sm text-gray-500">
                  {record.time ? new Date(record.time).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'Time not recorded'}
                </p>
                {record.minutesLate > 0 && (
                  <p className="text-xs text-yellow-600">Late by {record.minutesLate} minutes</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {attendanceHistory.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No attendance records found
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-800">College Transport</h1>
        <p className="text-gray-600">
          Explore available buses, review their stops, and confirm your seat by paying the stop-specific fee.
        </p>
      </div>

      {transportChoice && (
        <div className="bg-white border border-green-200 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-4xl">🚌</div>
                <div>
                  <p className="text-sm uppercase tracking-wide text-green-600 font-semibold">
                    My Active Pass
                  </p>
                  <h2 className="text-2xl font-bold text-gray-800 mt-1">
                    {transportChoice.routeName} • {transportChoice.busNumber}
                  </h2>
                  <p className="text-gray-500">
                    Boarding at <span className="font-semibold text-gray-800">{transportChoice.stopName}</span>
                  </p>
                </div>
              </div>
              
              {/* Seat Information */}
              {transportChoice.seatNumber && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 inline-block">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">💺</div>
                    <div>
                      <p className="text-sm text-blue-600">Assigned Seat</p>
                      <p className="text-2xl font-bold text-blue-800">{transportChoice.seatNumber}</p>
                      <p className="text-xs text-blue-500 capitalize">{transportChoice.seatType || 'window'} seat</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="text-right space-y-3">
              <div>
                <p className="text-sm text-gray-500">Paid Amount</p>
                <p className="text-3xl font-bold text-green-600">₹{transportChoice.fare}</p>
                {transportChoice.paymentReference && (
                  <p className="text-xs text-gray-500 mt-1">
                    Ref: {transportChoice.paymentReference}
                  </p>
                )}
              </div>
              
              <div className="flex flex-col gap-2">
                {transportChoice.seatNumber && (
                  <button
                    onClick={() => setShowSeatMap(!showSeatMap)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                  >
                    {showSeatMap ? "Hide Seat Map" : "View Seat Map"}
                  </button>
                )}
                
                <button
                  onClick={generateStudentQR}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-green-700 flex items-center justify-center gap-2"
                >
                  <span>📱</span> Show QR Pass
                </button>
                
                <button
                  onClick={() => setShowAttendanceHistory(!showAttendanceHistory)}
                  className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
                >
                  <span>📋</span> Attendance History
                </button>
              </div>
            </div>
          </div>
          
          {/* Render seat map below the main card */}
          {transportChoice.seatNumber && renderSeatMap()}
          
          {/* Render attendance history */}
          {renderAttendanceHistory()}
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : !routes.length ? (
          <div className="text-center py-12 bg-white border border-dashed rounded-2xl text-gray-500">
            Transport routes are not published yet. Check back later.
          </div>
        ) : (
          routes.map((route) => {
            const selectedStop = route.stops.find(
              (stop) => stop.name === stopSelections[route._id]
            );
            
            // Check if student is already allocated to this route with seat number
            const studentAllocation = route.allocations?.find(
              alloc => alloc.enrollmentNo === enrollmentNo
            );
            const hasSeatAssignment = studentAllocation?.seatNumber;

            // Calculate availability status without showing numbers
            const availabilityStatus = () => {
              if (route.allocatedSeats >= route.capacity) {
                return { status: "full", text: "Fully Booked", color: "text-red-600" };
              } else if (route.allocatedSeats >= route.capacity * 0.8) {
                return { status: "limited", text: "Limited Seats", color: "text-yellow-600" };
              } else {
                return { status: "available", text: "Seats Available", color: "text-green-600" };
              }
            };
            
            const availability = availabilityStatus();

            return (
              <div key={route._id} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-800">
                      {route.routeName} • {route.busNumber}
                    </h2>
                    <p className="text-gray-500">{route.busName}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Show availability status instead of seat count */}
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Availability</p>
                      <p className={`text-xl font-bold ${availability.color}`}>
                        {availability.text}
                      </p>
                    </div>
                    {/* Show seat number if assigned */}
                    {hasSeatAssignment && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                        <p className="text-xs text-blue-600">Your Seat</p>
                        <p className="text-lg font-bold text-blue-800">{studentAllocation.seatNumber}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-3">
                    <label className="text-sm font-semibold text-gray-700">Choose Stop / Station</label>
                    <select
                      className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      value={stopSelections[route._id] || ""}
                      onChange={(e) => handleStopChange(route._id, e.target.value)}
                      disabled={hasSeatAssignment || availability.status === "full"}
                    >
                      <option value="">Select stop</option>
                      {route.stops.map((stop) => (
                        <option key={stop.code || stop.name} value={stop.name}>
                          {stop.name}
                          {typeof stop.distanceKm === "number" && ` • ${stop.distanceKm} km`}
                          {typeof stop.fare === "number" && ` • ₹${stop.fare}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-700">Payment Reference</label>
                    <input
                      type="text"
                      placeholder="Txn / UPI Ref (optional)"
                      value={paymentRefs[route._id] || ""}
                      onChange={(e) => handlePaymentRefChange(route._id, e.target.value)}
                      className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      disabled={hasSeatAssignment || availability.status === "full"}
                    />
                  </div>
                </div>

                <div className="bg-gray-50 border rounded-xl p-4">
                  <p className="text-sm text-gray-500 mb-2">Route Overview</p>
                  <div className="flex flex-wrap gap-3 text-sm">
                    {route.stops.map((stop) => (
                      <span
                        key={stop.code || stop.name}
                        className={`px-3 py-1 rounded-full border ${
                          stopSelections[route._id] === stop.name ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-700"
                        }`}
                      >
                        {stop.name}
                        {typeof stop.fare === "number" && <span className="ml-1 text-xs">₹{stop.fare}</span>}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Estimated Fare</p>
                    <p className="text-2xl font-bold text-gray-800">
                      ₹
                      {typeof selectedStop?.fare === "number"
                        ? selectedStop.fare
                        : route.baseFare}
                    </p>
                    <p className="text-xs text-gray-500">
                      Longer routes cost more so you only pay for the distance you travel.
                    </p>
                    {/* Show seat type if assigned */}
                    {hasSeatAssignment && (
                      <div className="mt-2">
                        <p className="text-xs text-green-600">
                          ✅ Seat assigned: {studentAllocation.seatNumber} ({studentAllocation.seatType || 'window'})
                        </p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleEnroll(route)}
                    disabled={savingRoute === route._id || hasSeatAssignment || availability.status === "full"}
                    className={`px-6 py-3 rounded-xl font-semibold shadow transition ${
                      hasSeatAssignment
                        ? 'bg-green-600 text-white cursor-default'
                        : availability.status === "full"
                        ? 'bg-red-600 text-white cursor-not-allowed'
                        : savingRoute === route._id
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {hasSeatAssignment
                      ? `Seat ${studentAllocation.seatNumber} Assigned`
                      : availability.status === "full"
                      ? "Fully Booked"
                      : savingRoute === route._id
                      ? "Processing..."
                      : "Select & Pay"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* QR Code Modal */}
      {renderQRCode()}
    </div>
  );
};

export default Transport;