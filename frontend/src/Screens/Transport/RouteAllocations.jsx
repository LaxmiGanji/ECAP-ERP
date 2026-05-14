import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { baseApiURL } from "../../baseUrl";

const RouteAllocations = () => {
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [allocations, setAllocations] = useState(null);
  const [seatMap, setSeatMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAllocations, setLoadingAllocations] = useState(false);
  const [loadingSeatMap, setLoadingSeatMap] = useState(false);
  const [activeTab, setActiveTab] = useState("allocations"); // "allocations" or "seats"
  const [showSeatConfig, setShowSeatConfig] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [seatConfig, setSeatConfig] = useState({
    seatsPerRow: 3,
    aislePosition: 2,
    frontRowsForStaff: 1,
    maleSectionStart: 2,
    maleSectionEnd: 0,
    femaleSectionStart: 0,
    femaleSectionEnd: 0
  });

  const fetchRouteSummaries = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${baseApiURL()}/transport/routes/summaries`);
      if (res.data.success) {
        setRoutes(res.data.routes || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to load routes data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRouteAllocations = async (routeId) => {
    try {
      setLoadingAllocations(true);
      const route = routes.find(r => r._id === routeId);
      setSelectedRoute(route);
      
      const res = await axios.get(`${baseApiURL()}/transport/routes/${routeId}/allocations`);
      if (res.data.success) {
        setAllocations(res.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to load allocations data.");
    } finally {
      setLoadingAllocations(false);
    }
  };

  const fetchSeatMap = async (routeId) => {
    try {
      setLoadingSeatMap(true);
      const res = await axios.get(`${baseApiURL()}/transport/routes/${routeId}/seatmap`);
      if (res.data.success) {
        setSeatMap(res.data);
        setSeatConfig(res.data.seatConfig || {
          seatsPerRow: 3,
          aislePosition: 2,
          frontRowsForStaff: 1
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to load seat map.");
    } finally {
      setLoadingSeatMap(false);
    }
  };

  const handleRouteSelect = async (routeId) => {
    const route = routes.find(r => r._id === routeId);
    setSelectedRoute(route);
    await fetchRouteAllocations(routeId);
    if (activeTab === "seats") {
      await fetchSeatMap(routeId);
    }
  };

  const handleTabChange = async (tab) => {
    setActiveTab(tab);
    if (tab === "seats" && selectedRoute) {
      await fetchSeatMap(selectedRoute._id);
    }
  };

  const handleSeatClick = (seat) => {
    if (seat.isOccupied) {
      setSelectedStudent(seat.allocation);
      setSelectedSeat(seat);
    } else if (!seat.isReserved) {
      setSelectedSeat(seat);
      setSelectedStudent(null);
    }
  };

  const assignSeatToStudent = async (enrollmentNo) => {
    if (!selectedSeat || !selectedRoute) {
      toast.error("Please select a seat first.");
      return;
    }

    try {
      const res = await axios.post(`${baseApiURL()}/transport/routes/assign-seat`, {
        routeId: selectedRoute._id,
        enrollmentNo,
        seatNumber: selectedSeat.seatNumber,
        seatType: selectedSeat.type
      });

      if (res.data.success) {
        toast.success(res.data.message);
        // Refresh data
        await fetchRouteAllocations(selectedRoute._id);
        await fetchSeatMap(selectedRoute._id);
        setSelectedStudent(null);
        setSelectedSeat(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to assign seat.");
    }
  };

  const removeSeatAssignment = async (enrollmentNo) => {
    if (!window.confirm("Remove seat assignment for this student?")) {
      return;
    }

    try {
      const res = await axios.post(`${baseApiURL()}/transport/routes/remove-seat`, {
        routeId: selectedRoute._id,
        enrollmentNo
      });

      if (res.data.success) {
        toast.success(res.data.message);
        // Refresh data
        await fetchRouteAllocations(selectedRoute._id);
        await fetchSeatMap(selectedRoute._id);
        setSelectedStudent(null);
        setSelectedSeat(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to remove seat assignment.");
    }
  };

  const autoAssignSeats = async () => {
    if (!window.confirm("Auto-assign seats to all unassigned students? This will assign seats based on gender sections.")) {
      return;
    }

    try {
      const res = await axios.post(`${baseApiURL()}/transport/routes/${selectedRoute._id}/auto-assign`);
      if (res.data.success) {
        toast.success(res.data.message);
        // Refresh data
        await fetchRouteAllocations(selectedRoute._id);
        await fetchSeatMap(selectedRoute._id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to auto-assign seats.");
    }
  };

  const updateSeatConfig = async () => {
    try {
      const res = await axios.put(`${baseApiURL()}/transport/routes/${selectedRoute._id}/seat-config`, seatConfig);
      if (res.data.success) {
        toast.success("Seat configuration updated.");
        await fetchSeatMap(selectedRoute._id);
        setShowSeatConfig(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update seat configuration.");
    }
  };

  useEffect(() => {
    fetchRouteSummaries();
  }, []);

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Bus Allocations & Seat Management</h1>
        <p className="text-gray-600">
          View students allocated to each bus, manage seat assignments, and track seat distribution by gender.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Routes List */}
        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">All Buses</h2>
            <button
              onClick={fetchRouteSummaries}
              className="text-sm text-blue-600 hover:underline"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-gray-200 rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : routes.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-xl">
              No routes available.
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {routes.map(route => (
                <div
                  key={route._id}
                  onClick={() => handleRouteSelect(route._id)}
                  className={`border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedRoute?._id === route._id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {route.busNumber} • {route.routeName}
                      </h3>
                      <p className="text-sm text-gray-500">{route.busName}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      route.status === 'active' ? 'bg-green-100 text-green-700' :
                      route.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {route.status}
                    </span>
                  </div>

                  {/* Capacity Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Capacity: {route.allocatedSeats}/{route.capacity}</span>
                      <span>Left: {route.seatsLeft}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${(route.allocatedSeats / route.capacity) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Gender Distribution */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-blue-50 rounded-lg">
                      <div className="font-semibold text-blue-700">{route.maleCount}</div>
                      <div className="text-blue-600">Boys</div>
                    </div>
                    <div className="text-center p-2 bg-pink-50 rounded-lg">
                      <div className="font-semibold text-pink-700">{route.femaleCount}</div>
                      <div className="text-pink-600">Girls</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <div className="font-semibold text-gray-700">{route.otherCount}</div>
                      <div className="text-gray-600">Other</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-6">
          {!selectedRoute ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-5xl mb-4">🚌</div>
              <h3 className="text-xl font-semibold mb-2">Select a Bus</h3>
              <p>Choose a bus from the list to view allocated students and manage seat assignments.</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {selectedRoute.busNumber} - {selectedRoute.routeName}
                  </h2>
                  <p className="text-gray-600">{selectedRoute.busName}</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
                  >
                    Print List
                  </button>
                  
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => handleTabChange("allocations")}
                      className={`px-4 py-2 text-sm font-medium ${
                        activeTab === "allocations"
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      Allocations
                    </button>
                    <button
                      onClick={() => handleTabChange("seats")}
                      className={`px-4 py-2 text-sm font-medium ${
                        activeTab === "seats"
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      Seat Map
                    </button>
                  </div>
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === "allocations" ? (
                loadingAllocations ? (
                  <div className="space-y-6">
                    <div className="animate-pulse">
                      <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
                        ))}
                      </div>
                      <div className="h-64 bg-gray-200 rounded-xl"></div>
                    </div>
                  </div>
                ) : allocations ? (
                  <div className="space-y-6">
                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-blue-600">Boys Allocated</div>
                            <div className="text-2xl font-bold text-blue-700">
                              {allocations.statistics.male}
                            </div>
                          </div>
                          <div className="text-2xl">👨</div>
                        </div>
                        <div className="mt-2 text-sm text-blue-600">
                          Seats Left: {allocations.statistics.maleSeatsLeft}
                        </div>
                      </div>

                      <div className="bg-pink-50 border border-pink-100 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-pink-600">Girls Allocated</div>
                            <div className="text-2xl font-bold text-pink-700">
                              {allocations.statistics.female}
                            </div>
                          </div>
                          <div className="text-2xl">👩</div>
                        </div>
                        <div className="mt-2 text-sm text-pink-600">
                          Seats Left: {allocations.statistics.femaleSeatsLeft}
                        </div>
                      </div>

                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-gray-600">Total Allocated</div>
                            <div className="text-2xl font-bold text-gray-700">
                              {allocations.statistics.totalAllocated}
                            </div>
                          </div>
                          <div className="text-2xl">👥</div>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          Seats Left: {allocations.statistics.seatsLeft}
                        </div>
                      </div>
                    </div>

                    {/* Allocated Students */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="border-b border-gray-200 bg-gray-50 p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-800">Allocated Students ({allocations.statistics.totalAllocated})</h3>
                          <button
                            onClick={autoAssignSeats}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                          >
                            Auto Assign Seats
                          </button>
                        </div>
                      </div>

                      {/* Boys Section */}
                      {allocations.allocations.male.length > 0 && (
                        <div className="p-4 border-b border-gray-200">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-blue-600">👨</span>
                            <h4 className="font-semibold text-gray-800">Boys ({allocations.allocations.male.length})</h4>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="text-left p-3 text-sm font-medium text-gray-700">Seat No.</th>
                                  <th className="text-left p-3 text-sm font-medium text-gray-700">Enrollment No.</th>
                                  <th className="text-left p-3 text-sm font-medium text-gray-700">Name</th>
                                  <th className="text-left p-3 text-sm font-medium text-gray-700">Branch/Sem</th>
                                  <th className="text-left p-3 text-sm font-medium text-gray-700">Stop</th>
                                  <th className="text-left p-3 text-sm font-medium text-gray-700">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {allocations.allocations.male.map((student, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50">
                                    <td className="p-3 text-sm">
                                      {student.seatNumber ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                          {student.seatNumber}
                                        </span>
                                      ) : (
                                        <span className="text-gray-400">Not assigned</span>
                                      )}
                                    </td>
                                    <td className="p-3 text-sm">{student.enrollmentNo}</td>
                                    <td className="p-3 text-sm font-medium">{student.name}</td>
                                    <td className="p-3 text-sm">{student.branch} • Sem {student.semester}</td>
                                    <td className="p-3 text-sm">{student.stopName}</td>
                                    <td className="p-3 text-sm">
                                      {student.seatNumber ? (
                                        <button
                                          onClick={() => removeSeatAssignment(student.enrollmentNo)}
                                          className="text-red-600 hover:text-red-800 text-sm"
                                        >
                                          Remove Seat
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => {
                                            setSelectedStudent(student);
                                            handleTabChange("seats");
                                          }}
                                          className="text-blue-600 hover:text-blue-800 text-sm"
                                        >
                                          Assign Seat
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Girls Section */}
                      {allocations.allocations.female.length > 0 && (
                        <div className="p-4 border-b border-gray-200">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-pink-600">👩</span>
                            <h4 className="font-semibold text-gray-800">Girls ({allocations.allocations.female.length})</h4>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="text-left p-3 text-sm font-medium text-gray-700">Seat No.</th>
                                  <th className="text-left p-3 text-sm font-medium text-gray-700">Enrollment No.</th>
                                  <th className="text-left p-3 text-sm font-medium text-gray-700">Name</th>
                                  <th className="text-left p-3 text-sm font-medium text-gray-700">Branch/Sem</th>
                                  <th className="text-left p-3 text-sm font-medium text-gray-700">Stop</th>
                                  <th className="text-left p-3 text-sm font-medium text-gray-700">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {allocations.allocations.female.map((student, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50">
                                    <td className="p-3 text-sm">
                                      {student.seatNumber ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                          {student.seatNumber}
                                        </span>
                                      ) : (
                                        <span className="text-gray-400">Not assigned</span>
                                      )}
                                    </td>
                                    <td className="p-3 text-sm">{student.enrollmentNo}</td>
                                    <td className="p-3 text-sm font-medium">{student.name}</td>
                                    <td className="p-3 text-sm">{student.branch} • Sem {student.semester}</td>
                                    <td className="p-3 text-sm">{student.stopName}</td>
                                    <td className="p-3 text-sm">
                                      {student.seatNumber ? (
                                        <button
                                          onClick={() => removeSeatAssignment(student.enrollmentNo)}
                                          className="text-red-600 hover:text-red-800 text-sm"
                                        >
                                          Remove Seat
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => {
                                            setSelectedStudent(student);
                                            handleTabChange("seats");
                                          }}
                                          className="text-blue-600 hover:text-blue-800 text-sm"
                                        >
                                          Assign Seat
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Other Gender Section */}
                      {allocations.allocations.other.length > 0 && (
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-gray-600">👥</span>
                            <h4 className="font-semibold text-gray-800">Other ({allocations.allocations.other.length})</h4>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="text-left p-3 text-sm font-medium text-gray-700">Seat No.</th>
                                  <th className="text-left p-3 text-sm font-medium text-gray-700">Enrollment No.</th>
                                  <th className="text-left p-3 text-sm font-medium text-gray-700">Name</th>
                                  <th className="text-left p-3 text-sm font-medium text-gray-700">Branch/Sem</th>
                                  <th className="text-left p-3 text-sm font-medium text-gray-700">Stop</th>
                                  <th className="text-left p-3 text-sm font-medium text-gray-700">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {allocations.allocations.other.map((student, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50">
                                    <td className="p-3 text-sm">
                                      {student.seatNumber ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                          {student.seatNumber}
                                        </span>
                                      ) : (
                                        <span className="text-gray-400">Not assigned</span>
                                      )}
                                    </td>
                                    <td className="p-3 text-sm">{student.enrollmentNo}</td>
                                    <td className="p-3 text-sm font-medium">{student.name}</td>
                                    <td className="p-3 text-sm">{student.branch} • Sem {student.semester}</td>
                                    <td className="p-3 text-sm">{student.stopName}</td>
                                    <td className="p-3 text-sm">
                                      {student.seatNumber ? (
                                        <button
                                          onClick={() => removeSeatAssignment(student.enrollmentNo)}
                                          className="text-red-600 hover:text-red-800 text-sm"
                                        >
                                          Remove Seat
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => {
                                            setSelectedStudent(student);
                                            handleTabChange("seats");
                                          }}
                                          className="text-blue-600 hover:text-blue-800 text-sm"
                                        >
                                          Assign Seat
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {allocations.statistics.totalAllocated === 0 && (
                        <div className="p-8 text-center text-gray-500">
                          <div className="text-4xl mb-4">👤</div>
                          <h4 className="text-lg font-semibold mb-2">No Students Allocated</h4>
                          <p>This bus doesn't have any students allocated yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null
              ) : (
                // Seat Map Tab
                <div className="space-y-6">
                  {/* Seat Map Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Seat Map</h3>
                      <p className="text-sm text-gray-600">
                        Click on seats to assign students. Green = Occupied, Blue = Available, Gray = Reserved
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowSeatConfig(!showSeatConfig)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
                      >
                        {showSeatConfig ? "Hide Config" : "Seat Config"}
                      </button>
                      <button
                        onClick={autoAssignSeats}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                      >
                        Auto Assign
                      </button>
                    </div>
                  </div>

                  {/* Seat Configuration Modal */}
                  {showSeatConfig && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-800 mb-3">Seat Configuration</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Seats per Row</label>
                          <input
                            type="number"
                            min="1"
                            max="5"
                            value={seatConfig.seatsPerRow}
                            onChange={(e) => setSeatConfig({...seatConfig, seatsPerRow: parseInt(e.target.value)})}
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Aisle Position</label>
                          <input
                            type="number"
                            min="1"
                            max={seatConfig.seatsPerRow}
                            value={seatConfig.aislePosition}
                            onChange={(e) => setSeatConfig({...seatConfig, aislePosition: parseInt(e.target.value)})}
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Staff Rows</label>
                          <input
                            type="number"
                            min="0"
                            max="3"
                            value={seatConfig.frontRowsForStaff}
                            onChange={(e) => setSeatConfig({...seatConfig, frontRowsForStaff: parseInt(e.target.value)})}
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            onClick={updateSeatConfig}
                            className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                          >
                            Update Config
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Selected Student Info */}
                  {selectedStudent && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-blue-800">Selected Student</h4>
                          <p className="text-sm text-blue-600">
                            {selectedStudent.name} ({selectedStudent.enrollmentNo})
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {selectedSeat && (
                            <span className="text-sm text-blue-700">
                              Selected Seat: <strong>{selectedSeat.seatNumber}</strong>
                            </span>
                          )}
                          <button
                            onClick={() => assignSeatToStudent(selectedStudent.enrollmentNo)}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                          >
                            Assign to Selected Seat
                          </button>
                          <button
                            onClick={() => setSelectedStudent(null)}
                            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Seat Map Visualization */}
                  {loadingSeatMap ? (
                    <div className="animate-pulse">
                      <div className="h-64 bg-gray-200 rounded-xl"></div>
                    </div>
                  ) : seatMap ? (
                    <div className="space-y-6">
                      {/* Bus Layout */}
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
                                  <button
                                    key={seatIndex}
                                    onClick={() => handleSeatClick(seat)}
                                    className={`
                                      w-16 h-16 rounded-lg flex flex-col items-center justify-center
                                      font-semibold text-sm transition-all transform hover:scale-105
                                      ${seat.isOccupied 
                                        ? 'bg-green-100 border-2 border-green-300 text-green-800 hover:bg-green-200' 
                                        : seat.isReserved
                                        ? 'bg-gray-200 border-2 border-gray-300 text-gray-500 cursor-not-allowed'
                                        : selectedSeat?.seatNumber === seat.seatNumber
                                        ? 'bg-blue-100 border-2 border-blue-400 text-blue-800'
                                        : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300'
                                      }
                                    `}
                                    disabled={seat.isReserved}
                                  >
                                    <div>{seat.seatNumber}</div>
                                    {seat.isOccupied && (
                                      <div className="text-xs mt-1 truncate max-w-full px-1">
                                        {seat.allocation?.enrollmentNo}
                                      </div>
                                    )}
                                    {seat.section === 'male' && !seat.isOccupied && !seat.isReserved && (
                                      <div className="text-xs text-blue-600">♂</div>
                                    )}
                                    {seat.section === 'female' && !seat.isOccupied && !seat.isReserved && (
                                      <div className="text-xs text-pink-600">♀</div>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Legend */}
                        <div className="mt-8 pt-4 border-t border-gray-300">
                          <div className="flex flex-wrap gap-4 justify-center">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                              <span className="text-sm text-gray-600">Occupied</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
                              <span className="text-sm text-gray-600">Available (Male)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-white border border-pink-300 rounded"></div>
                              <span className="text-sm text-gray-600">Available (Female)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-gray-200 border border-gray-300 rounded"></div>
                              <span className="text-sm text-gray-600">Reserved</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-blue-100 border border-blue-400 rounded"></div>
                              <span className="text-sm text-gray-600">Selected</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Statistics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                          <div className="text-2xl font-bold text-gray-800">
                            {seatMap.statistics.occupiedSeats}
                          </div>
                          <div className="text-sm text-gray-600">Occupied Seats</div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                          <div className="text-2xl font-bold text-gray-800">
                            {seatMap.statistics.availableSeats}
                          </div>
                          <div className="text-sm text-gray-600">Available Seats</div>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                          <div className="text-2xl font-bold text-blue-700">
                            {seatMap.statistics.maleSeats}
                          </div>
                          <div className="text-sm text-blue-600">Male Section</div>
                        </div>
                        <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 text-center">
                          <div className="text-2xl font-bold text-pink-700">
                            {seatMap.statistics.femaleSeats}
                          </div>
                          <div className="text-sm text-pink-600">Female Section</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-4xl mb-4">💺</div>
                      <h4 className="text-lg font-semibold mb-2">No Seat Map Available</h4>
                      <p>Seat map data could not be loaded for this bus.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RouteAllocations;