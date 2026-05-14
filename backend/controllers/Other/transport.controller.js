const TransportRoute = require("../../models/Other/transport.model");
const StudentDetails = require("../../models/Students/details.model");

const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const sanitizeStops = (stops = [], baseFare) =>
  stops
    .filter((stop) => stop && stop.name)
    .map((stop, index) => {
      const normalizedFare = parseNumber(stop.fare, undefined);
      return {
        name: stop.name.trim(),
        landmark: stop.landmark?.trim() || "",
        distanceKm: parseNumber(stop.distanceKm, undefined),
        fare: typeof normalizedFare === "number" ? Math.max(normalizedFare, 0) : undefined,
        arrivalTime: stop.arrivalTime?.trim() || "",
        code: stop.code?.trim() || `STOP-${index + 1}`,
        notes: stop.notes?.trim() || "",
      };
    });

const sanitizeRoutePayload = (payload = {}) => {
  const capacity = parseNumber(payload.capacity, 0);
  const baseFare = parseNumber(payload.baseFare, 0);
  const stops = sanitizeStops(payload.stops, baseFare);

  return {
    busNumber: payload.busNumber?.trim(),
    busName: payload.busName?.trim() || payload.routeName?.trim(),
    driverName: payload.driverName?.trim(),
    driverPhone: payload.driverPhone?.trim(),
    capacity: capacity > 0 ? Math.floor(capacity) : 40,
    routeName: payload.routeName?.trim(),
    description: payload.description?.trim(),
    baseFare: baseFare >= 0 ? baseFare : 0,
    status: payload.status || "active",
    stops: stops.length ? stops : undefined,
  };
};

const validateRequiredFields = (payload) => {
  if (!payload.busNumber || !payload.busName || !payload.routeName || typeof payload.baseFare === "undefined") {
    return "Bus number, bus name, route name and base fare are required.";
  }
  if (!Array.isArray(payload.stops) || !payload.stops.length) {
    return "At least one stop/station is required.";
  }
  return null;
};

const createTransportRoute = async (req, res) => {
  try {
    const payload = sanitizeRoutePayload(req.body);
    const error = validateRequiredFields(payload);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const exists = await TransportRoute.findOne({ busNumber: payload.busNumber });
    if (exists) {
      return res.status(400).json({ success: false, message: "Bus already registered." });
    }

    const route = await TransportRoute.create(payload);
    res.json({ success: true, message: "Transport route created.", route });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Unable to create route." });
  }
};

const updateTransportRoute = async (req, res) => {
  try {
    const payload = sanitizeRoutePayload(req.body);
    const error = validateRequiredFields(payload);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const updated = await TransportRoute.findByIdAndUpdate(req.params.id, payload, {
      new: true,
    });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Route not found." });
    }

    res.json({ success: true, message: "Route updated.", route: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Unable to update route." });
  }
};

const deleteTransportRoute = async (req, res) => {
  try {
    const route = await TransportRoute.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ success: false, message: "Route not found." });
    }
    if (route.allocations?.length) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot delete a route with active student allocations." });
    }
    await route.deleteOne();
    res.json({ success: true, message: "Route deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Unable to delete route." });
  }
};

const listTransportRoutes = async (_req, res) => {
  try {
    const routes = await TransportRoute.find().sort({ routeName: 1 });
    res.json({ success: true, routes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Unable to load routes." });
  }
};

const getFareForStop = (route, stopName) => {
  const stop = route.stops.find((item) => item.name === stopName);
  if (!stop) {
    return { stop: null, fare: route.baseFare };
  }
  const fare = typeof stop.fare === "number" ? stop.fare : route.baseFare;
  return { stop, fare };
};

const enrollStudentToTransport = async (req, res) => {
  try {
    const { enrollmentNo, routeId, stopName, paymentReference, amountPaid } = req.body || {};
    if (!enrollmentNo || !routeId || !stopName) {
      return res
        .status(400)
        .json({ success: false, message: "Enrollment number, route and stop are required." });
    }

    const [route, student] = await Promise.all([
      TransportRoute.findById(routeId),
      StudentDetails.findOne({ enrollmentNo }),
    ]);

    if (!route) {
      return res.status(404).json({ success: false, message: "Route not found." });
    }
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    const allocationIndex = route.allocations.findIndex((alloc) => alloc.enrollmentNo === enrollmentNo);
    const isExistingAllocation = allocationIndex !== -1;

    if (!isExistingAllocation && route.capacity && route.allocatedSeats >= route.capacity) {
      return res.status(400).json({ success: false, message: "No seats left on this bus." });
    }

    const { stop, fare } = getFareForStop(route, stopName);
    if (!stop) {
      return res.status(400).json({ success: false, message: "Selected stop is not part of this route." });
    }

    const normalizedAmount = parseNumber(amountPaid, fare);
    const finalFare = normalizedAmount >= fare ? normalizedAmount : fare;

    if (
      student.transport?.routeId &&
      student.transport.routeId.toString() !== routeId &&
      student.transport.status === "active"
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Student is already assigned to another bus. Cancel before reassigning." });
    }

    const allocationPayload = {
      studentId: student._id,
      enrollmentNo,
      stopName: stop.name,
      farePaid: finalFare,
      paymentReference: paymentReference?.trim() || "",
      paidOn: new Date(),
    };

    if (isExistingAllocation) {
      route.allocations[allocationIndex] = {
        ...route.allocations[allocationIndex],
        ...allocationPayload,
      };
    } else {
      route.allocations.push(allocationPayload);
      route.allocatedSeats = Math.min(route.capacity, route.allocatedSeats + 1);
    }

    student.transport = {
      routeId,
      routeName: route.routeName,
      busNumber: route.busNumber,
      busName: route.busName,
      stopName: stop.name,
      fare: finalFare,
      paymentReference: allocationPayload.paymentReference,
      status: "active",
      paidOn: allocationPayload.paidOn,
      lastUpdated: new Date(),
    };

    await Promise.all([route.save(), student.save()]);

    res.json({
      success: true,
      message: "Transport preference saved.",
      transport: student.transport,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Unable to save transport selection." });
  }
};

const getStudentTransportDetails = async (req, res) => {
  try {
    const { enrollmentNo } = req.params;
    if (!enrollmentNo) {
      return res.status(400).json({ success: false, message: "Enrollment number is required." });
    }

    const student = await StudentDetails.findOne({ enrollmentNo }).select("enrollmentNo transport firstName lastName");
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    res.json({ success: true, transport: student.transport || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Unable to load transport details." });
  }
};

// NEW FUNCTION: Get allocated students for a specific route
const getRouteAllocations = async (req, res) => {
  try {
    const { routeId } = req.params;
    
    const route = await TransportRoute.findById(routeId)
      .populate({
        path: 'allocations.studentId',
        select: 'firstName lastName enrollmentNo gender phoneNumber email branch semester section'
      });
    
    if (!route) {
      return res.status(404).json({ success: false, message: "Route not found." });
    }

    // Separate allocations by gender and calculate statistics
    const allocations = route.allocations || [];
    const maleAllocations = allocations.filter(alloc => 
      alloc.studentId?.gender === 'male' || alloc.studentId?.gender === 'Male'
    );
    const femaleAllocations = allocations.filter(alloc => 
      alloc.studentId?.gender === 'female' || alloc.studentId?.gender === 'Female'
    );
    const otherAllocations = allocations.filter(alloc => 
      !['male', 'Male', 'female', 'Female'].includes(alloc.studentId?.gender)
    );

    res.json({
      success: true,
      route: {
        _id: route._id,
        busNumber: route.busNumber,
        busName: route.busName,
        routeName: route.routeName,
        capacity: route.capacity,
        allocatedSeats: route.allocatedSeats,
      },
      statistics: {
        totalAllocated: allocations.length,
        male: maleAllocations.length,
        female: femaleAllocations.length,
        other: otherAllocations.length,
        seatsLeft: route.capacity - route.allocatedSeats,
        maleSeatsLeft: Math.max(0, Math.floor(route.capacity / 2) - maleAllocations.length),
        femaleSeatsLeft: Math.max(0, Math.floor(route.capacity / 2) - femaleAllocations.length),
      },
      allocations: {
        male: maleAllocations.map(alloc => ({
          studentId: alloc.studentId?._id,
          enrollmentNo: alloc.enrollmentNo,
          name: `${alloc.studentId?.firstName || ''} ${alloc.studentId?.lastName || ''}`.trim(),
          gender: alloc.studentId?.gender,
          phoneNumber: alloc.studentId?.phoneNumber,
          email: alloc.studentId?.email,
          branch: alloc.studentId?.branch,
          semester: alloc.studentId?.semester,
          section: alloc.studentId?.section,
          stopName: alloc.stopName,
          farePaid: alloc.farePaid,
          paidOn: alloc.paidOn,
        })),
        female: femaleAllocations.map(alloc => ({
          studentId: alloc.studentId?._id,
          enrollmentNo: alloc.enrollmentNo,
          name: `${alloc.studentId?.firstName || ''} ${alloc.studentId?.lastName || ''}`.trim(),
          gender: alloc.studentId?.gender,
          phoneNumber: alloc.studentId?.phoneNumber,
          email: alloc.studentId?.email,
          branch: alloc.studentId?.branch,
          semester: alloc.studentId?.semester,
          section: alloc.studentId?.section,
          stopName: alloc.stopName,
          farePaid: alloc.farePaid,
          paidOn: alloc.paidOn,
        })),
        other: otherAllocations.map(alloc => ({
          studentId: alloc.studentId?._id,
          enrollmentNo: alloc.enrollmentNo,
          name: `${alloc.studentId?.firstName || ''} ${alloc.studentId?.lastName || ''}`.trim(),
          gender: alloc.studentId?.gender,
          phoneNumber: alloc.studentId?.phoneNumber,
          email: alloc.studentId?.email,
          branch: alloc.studentId?.branch,
          semester: alloc.studentId?.semester,
          section: alloc.studentId?.section,
          stopName: alloc.stopName,
          farePaid: alloc.farePaid,
          paidOn: alloc.paidOn,
        })),
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Unable to fetch route allocations." });
  }
};

// NEW FUNCTION: Get all routes with allocation summaries
const getAllRouteSummaries = async (req, res) => {
  try {
    const routes = await TransportRoute.find()
      .populate({
        path: 'allocations.studentId',
        select: 'gender'
      })
      .select('busNumber busName routeName capacity allocatedSeats stops status allocations');

    const summaries = routes.map(route => {
      const allocations = route.allocations || [];
      const maleAllocations = allocations.filter(alloc => 
        alloc.studentId?.gender === 'male' || alloc.studentId?.gender === 'Male'
      );
      const femaleAllocations = allocations.filter(alloc => 
        alloc.studentId?.gender === 'female' || alloc.studentId?.gender === 'Female'
      );
      const otherAllocations = allocations.filter(alloc => 
        !['male', 'Male', 'female', 'Female'].includes(alloc.studentId?.gender)
      );

      return {
        _id: route._id,
        busNumber: route.busNumber,
        busName: route.busName,
        routeName: route.routeName,
        capacity: route.capacity,
        allocatedSeats: route.allocatedSeats,
        seatsLeft: route.capacity - route.allocatedSeats,
        status: route.status,
        maleCount: maleAllocations.length,
        femaleCount: femaleAllocations.length,
        otherCount: otherAllocations.length,
        maleSeatsLeft: Math.max(0, Math.floor(route.capacity / 2) - maleAllocations.length),
        femaleSeatsLeft: Math.max(0, Math.floor(route.capacity / 2) - femaleAllocations.length),
      };
    });

    res.json({ success: true, routes: summaries });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Unable to fetch route summaries." });
  }
};

// Generate seat numbers based on configuration
const generateSeatNumber = (row, position, seatConfig) => {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];
  const rowLetter = rows[row - 1] || String(row);
  const seatType = position === seatConfig.aislePosition ? 'A' : position < seatConfig.aislePosition ? 'W' : 'W';
  return `${rowLetter}${position}`;
};

// Get seat map for a route
const getSeatMap = async (req, res) => {
  try {
    const { routeId } = req.params;
    
    const route = await TransportRoute.findById(routeId)
      .populate({
        path: 'allocations.studentId',
        select: 'firstName lastName enrollmentNo gender phoneNumber email branch semester section'
      });
    
    if (!route) {
      return res.status(404).json({ success: false, message: "Route not found." });
    }

    // Get or create seat configuration
    const seatConfig = route.seatConfig || {
      totalSeats: route.capacity,
      seatsPerRow: 3,
      totalRows: Math.ceil(route.capacity / 3),
      aislePosition: 2,
      frontRowsForStaff: 1,
      maleSectionStart: 2,
      maleSectionEnd: Math.ceil(route.capacity / 6) + 1,
      femaleSectionStart: Math.ceil(route.capacity / 6) + 2,
      femaleSectionEnd: Math.ceil(route.capacity / 3)
    };

    // Generate seat map
    const seatMap = [];
    const allocationsMap = new Map();
    
    // Create map of seat numbers to allocations
    route.allocations.forEach(alloc => {
      if (alloc.seatNumber) {
        allocationsMap.set(alloc.seatNumber, alloc);
      }
    });

    let seatCounter = 1;
    for (let row = 1; row <= seatConfig.totalRows; row++) {
      const rowSeats = [];
      
      for (let position = 1; position <= seatConfig.seatsPerRow; position++) {
        if (seatCounter > route.capacity) break;
        
        const seatNumber = generateSeatNumber(row, position, seatConfig);
        const allocation = allocationsMap.get(seatNumber);
        
        const seat = {
          seatNumber,
          seatCounter,
          row,
          position,
          type: position === seatConfig.aislePosition ? 'aisle' : 'window',
          section: row < seatConfig.femaleSectionStart ? 'male' : 'female',
          isReserved: seatConfig.reservedSeats?.some(s => s.seatNumber === seatNumber) || false,
          isOccupied: !!allocation,
          allocation: allocation ? {
            enrollmentNo: allocation.enrollmentNo,
            studentName: allocation.studentId ? 
              `${allocation.studentId.firstName} ${allocation.studentId.lastName}`.trim() : '',
            gender: allocation.studentId?.gender,
            stopName: allocation.stopName,
            farePaid: allocation.farePaid
          } : null
        };

        // Check if seat is in reserved rows
        if (row <= seatConfig.frontRowsForStaff) {
          seat.isReserved = true;
          seat.reservedFor = 'staff';
        }

        rowSeats.push(seat);
        seatCounter++;
      }
      
      seatMap.push({
        rowNumber: row,
        rowLabel: `Row ${row}`,
        seats: rowSeats
      });
    }

    res.json({
      success: true,
      seatMap,
      seatConfig,
      statistics: {
        totalSeats: route.capacity,
        occupiedSeats: route.allocatedSeats,
        availableSeats: route.capacity - route.allocatedSeats,
        maleSeats: seatConfig.maleSectionEnd - seatConfig.maleSectionStart + 1,
        femaleSeats: seatConfig.femaleSectionEnd - seatConfig.femaleSectionStart + 1,
        staffSeats: seatConfig.frontRowsForStaff * seatConfig.seatsPerRow
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Unable to fetch seat map." });
  }
};

// Assign seat to student
const assignSeatToStudent = async (req, res) => {
  try {
    const { routeId, enrollmentNo, seatNumber, seatType } = req.body;
    
    if (!routeId || !enrollmentNo || !seatNumber) {
      return res.status(400).json({ 
        success: false, 
        message: "Route ID, enrollment number and seat number are required." 
      });
    }

    const [route, student] = await Promise.all([
      TransportRoute.findById(routeId),
      StudentDetails.findOne({ enrollmentNo })
    ]);

    if (!route) {
      return res.status(404).json({ success: false, message: "Route not found." });
    }
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    // Check if seat assignment is locked
    if (route.seatAssignmentLocked) {
      return res.status(400).json({ 
        success: false, 
        message: "Seat assignments are locked for this route." 
      });
    }

    // Check if seat is already occupied
    const isSeatOccupied = route.allocations.some(alloc => 
      alloc.seatNumber === seatNumber
    );

    if (isSeatOccupied) {
      return res.status(400).json({ 
        success: false, 
        message: `Seat ${seatNumber} is already occupied.` 
      });
    }

    // Check if student is already allocated to this route
    const allocationIndex = route.allocations.findIndex(alloc => 
      alloc.enrollmentNo === enrollmentNo
    );

    if (allocationIndex === -1) {
      return res.status(400).json({ 
        success: false, 
        message: "Student is not allocated to this route." 
      });
    }

    // Check seat configuration for gender-based seating
    const seatConfig = route.seatConfig || {};
    const rowMatch = seatNumber.match(/^(\D+)(\d+)$/);
    if (rowMatch) {
      const rowLetter = rowMatch[1];
      const seatPosition = parseInt(rowMatch[2]);
      const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];
      const rowNumber = rows.indexOf(rowLetter.toUpperCase()) + 1;
      
      // Check gender-based seating rules
      const studentGender = student.gender?.toLowerCase();
      if (studentGender === 'male' || studentGender === 'm') {
        if (rowNumber < seatConfig.maleSectionStart || rowNumber > seatConfig.maleSectionEnd) {
          return res.status(400).json({ 
            success: false, 
            message: `Male students can only be seated in rows ${seatConfig.maleSectionStart} to ${seatConfig.maleSectionEnd}.` 
          });
        }
      } else if (studentGender === 'female' || studentGender === 'f') {
        if (rowNumber < seatConfig.femaleSectionStart || rowNumber > seatConfig.femaleSectionEnd) {
          return res.status(400).json({ 
            success: false, 
            message: `Female students can only be seated in rows ${seatConfig.femaleSectionStart} to ${seatConfig.femaleSectionEnd}.` 
          });
        }
      }
    }

    // Check for reserved seats
    if (seatConfig.reservedSeats?.some(s => s.seatNumber === seatNumber)) {
      return res.status(400).json({ 
        success: false, 
        message: `Seat ${seatNumber} is reserved.` 
      });
    }

    // Update allocation with seat information
    route.allocations[allocationIndex].seatNumber = seatNumber;
    route.allocations[allocationIndex].seatType = seatType || 'window';
    route.allocations[allocationIndex].allocationDate = new Date();
    route.allocations[allocationIndex].allocatedBy = req.user?._id; // Assuming you have user authentication

    // Update student transport info
    student.transport.seatNumber = seatNumber;
    student.transport.seatType = seatType || 'window';
    student.transport.lastUpdated = new Date();

    await Promise.all([route.save(), student.save()]);

    res.json({
      success: true,
      message: `Seat ${seatNumber} assigned to ${student.firstName} ${student.lastName}`,
      allocation: route.allocations[allocationIndex],
      student: {
        enrollmentNo: student.enrollmentNo,
        name: `${student.firstName} ${student.lastName}`,
        seatNumber,
        seatType: seatType || 'window'
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Unable to assign seat." });
  }
};

// Auto-assign seats for all unassigned students
const autoAssignSeats = async (req, res) => {
  try {
    const { routeId } = req.params;
    
    const route = await TransportRoute.findById(routeId);
    if (!route) {
      return res.status(404).json({ success: false, message: "Route not found." });
    }

    // Get seat configuration
    const seatConfig = route.seatConfig || {
      totalSeats: route.capacity,
      seatsPerRow: 3,
      totalRows: Math.ceil(route.capacity / 3),
      aislePosition: 2,
      frontRowsForStaff: 1,
      maleSectionStart: 2,
      maleSectionEnd: Math.ceil(route.capacity / 6) + 1,
      femaleSectionStart: Math.ceil(route.capacity / 6) + 2,
      femaleSectionEnd: Math.ceil(route.capacity / 3)
    };

    // Get all allocations without seat numbers
    const allocationsWithoutSeats = route.allocations.filter(alloc => !alloc.seatNumber);
    
    if (allocationsWithoutSeats.length === 0) {
      return res.json({
        success: true,
        message: "All students already have seat assignments.",
        assignedCount: 0
      });
    }

    // Get student details for gender
    const enrollmentNos = allocationsWithoutSeats.map(alloc => alloc.enrollmentNo);
    const students = await StudentDetails.find({ 
      enrollmentNo: { $in: enrollmentNos } 
    }).select('enrollmentNo gender firstName lastName');

    // Create map of enrollment to gender
    const studentGenderMap = new Map();
    students.forEach(student => {
      studentGenderMap.set(student.enrollmentNo, student.gender?.toLowerCase());
    });

    // Generate available seats by section
    const occupiedSeats = new Set(route.allocations.map(alloc => alloc.seatNumber).filter(Boolean));
    const availableSeats = [];
    
    // Generate all possible seat numbers
    let seatCounter = 1;
    for (let row = 1; row <= seatConfig.totalRows; row++) {
      // Skip staff rows
      if (row <= seatConfig.frontRowsForStaff) continue;
      
      for (let position = 1; position <= seatConfig.seatsPerRow; position++) {
        if (seatCounter > route.capacity) break;
        
        const seatNumber = generateSeatNumber(row, position, seatConfig);
        
        // Check if seat is available and not reserved
        if (!occupiedSeats.has(seatNumber) && 
            !seatConfig.reservedSeats?.some(s => s.seatNumber === seatNumber)) {
          
          const section = row < seatConfig.femaleSectionStart ? 'male' : 'female';
          availableSeats.push({
            seatNumber,
            row,
            position,
            section,
            type: position === seatConfig.aislePosition ? 'aisle' : 'window'
          });
        }
        seatCounter++;
      }
    }

    // Separate seats by section
    const maleSeats = availableSeats.filter(seat => seat.section === 'male');
    const femaleSeats = availableSeats.filter(seat => seat.section === 'female');

    // Separate allocations by gender
    const maleAllocations = allocationsWithoutSeats.filter(alloc => {
      const gender = studentGenderMap.get(alloc.enrollmentNo);
      return gender === 'male' || gender === 'm';
    });
    
    const femaleAllocations = allocationsWithoutSeats.filter(alloc => {
      const gender = studentGenderMap.get(alloc.enrollmentNo);
      return gender === 'female' || gender === 'f';
    });
    
    const otherAllocations = allocationsWithoutSeats.filter(alloc => {
      const gender = studentGenderMap.get(alloc.enrollmentNo);
      return !gender || !['male', 'm', 'female', 'f'].includes(gender);
    });

    let assignedCount = 0;
    const assignments = [];

    // Assign male seats
    maleAllocations.forEach((alloc, index) => {
      if (index < maleSeats.length) {
        const seat = maleSeats[index];
        alloc.seatNumber = seat.seatNumber;
        alloc.seatType = seat.type;
        alloc.allocationDate = new Date();
        assignments.push({
          enrollmentNo: alloc.enrollmentNo,
          seatNumber: seat.seatNumber,
          section: 'male'
        });
        assignedCount++;
      }
    });

    // Assign female seats
    femaleAllocations.forEach((alloc, index) => {
      if (index < femaleSeats.length) {
        const seat = femaleSeats[index];
        alloc.seatNumber = seat.seatNumber;
        alloc.seatType = seat.type;
        alloc.allocationDate = new Date();
        assignments.push({
          enrollmentNo: alloc.enrollmentNo,
          seatNumber: seat.seatNumber,
          section: 'female'
        });
        assignedCount++;
      }
    });

    // Assign remaining seats to others (try male section first, then female)
    otherAllocations.forEach((alloc, index) => {
      const allAvailableSeats = [...maleSeats, ...femaleSeats];
      if (index < allAvailableSeats.length - (maleAllocations.length + femaleAllocations.length)) {
        const seatIndex = maleAllocations.length + femaleAllocations.length + index;
        if (seatIndex < allAvailableSeats.length) {
          const seat = allAvailableSeats[seatIndex];
          alloc.seatNumber = seat.seatNumber;
          alloc.seatType = seat.type;
          alloc.allocationDate = new Date();
          assignments.push({
            enrollmentNo: alloc.enrollmentNo,
            seatNumber: seat.seatNumber,
            section: seat.section
          });
          assignedCount++;
        }
      }
    });

    // Update student records
    for (const assignment of assignments) {
      await StudentDetails.findOneAndUpdate(
        { enrollmentNo: assignment.enrollmentNo },
        { 
          $set: { 
            'transport.seatNumber': assignment.seatNumber,
            'transport.seatType': assignment.section === 'male' ? 'male_section' : 'female_section',
            'transport.lastUpdated': new Date()
          } 
        }
      );
    }

    await route.save();

    res.json({
      success: true,
      message: `Auto-assigned ${assignedCount} seats successfully.`,
      assignedCount,
      assignments,
      remainingWithoutSeats: allocationsWithoutSeats.length - assignedCount
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Unable to auto-assign seats." });
  }
};

// Update seat configuration
const updateSeatConfiguration = async (req, res) => {
  try {
    const { routeId } = req.params;
    const config = req.body;
    
    const route = await TransportRoute.findById(routeId);
    if (!route) {
      return res.status(404).json({ success: false, message: "Route not found." });
    }

    // Validate configuration
    if (config.totalSeats && config.totalSeats !== route.capacity) {
      return res.status(400).json({ 
        success: false, 
        message: `Total seats must match bus capacity (${route.capacity}).` 
      });
    }

    // Update configuration
    route.seatConfig = {
      ...route.seatConfig,
      ...config,
      totalSeats: route.capacity // Always use actual capacity
    };

    await route.save();

    res.json({
      success: true,
      message: "Seat configuration updated successfully.",
      seatConfig: route.seatConfig
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Unable to update seat configuration." });
  }
};

// Remove seat assignment
const removeSeatAssignment = async (req, res) => {
  try {
    const { routeId, enrollmentNo } = req.body;
    
    const [route, student] = await Promise.all([
      TransportRoute.findById(routeId),
      StudentDetails.findOne({ enrollmentNo })
    ]);

    if (!route) {
      return res.status(404).json({ success: false, message: "Route not found." });
    }
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    const allocationIndex = route.allocations.findIndex(alloc => 
      alloc.enrollmentNo === enrollmentNo
    );

    if (allocationIndex === -1) {
      return res.status(400).json({ 
        success: false, 
        message: "Student is not allocated to this route." 
      });
    }

    const seatNumber = route.allocations[allocationIndex].seatNumber;
    
    // Remove seat assignment
    route.allocations[allocationIndex].seatNumber = undefined;
    route.allocations[allocationIndex].seatType = undefined;
    route.allocations[allocationIndex].allocationDate = undefined;

    // Update student record
    student.transport.seatNumber = undefined;
    student.transport.seatType = undefined;
    student.transport.lastUpdated = new Date();

    await Promise.all([route.save(), student.save()]);

    res.json({
      success: true,
      message: `Seat assignment removed for ${student.firstName} ${student.lastName}`,
      student: {
        enrollmentNo: student.enrollmentNo,
        name: `${student.firstName} ${student.lastName}`
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Unable to remove seat assignment." });
  }
};

module.exports = {
  createTransportRoute,
  updateTransportRoute,
  deleteTransportRoute,
  listTransportRoutes,
  enrollStudentToTransport,
  getStudentTransportDetails,
  getRouteAllocations,
  getAllRouteSummaries,
  // Add these new functions:
  getSeatMap,
  assignSeatToStudent,
  autoAssignSeats,
  updateSeatConfiguration,
  removeSeatAssignment
};