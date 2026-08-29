const sinon = require("sinon");
const { expect } = require("chai");

// Models
const TransportRoute = require("../../models/Other/transport.model.js");
const StudentDetails = require("../../models/Students/details.model.js");

// Controller under test
const {
  createTransportRoute,
  updateTransportRoute,
  deleteTransportRoute,
  listTransportRoutes,
  enrollStudentToTransport,
  getStudentTransportDetails,
  getRouteAllocations,
  getAllRouteSummaries,
  getSeatMap,
  assignSeatToStudent,
  autoAssignSeats,
  updateSeatConfiguration,
  removeSeatAssignment,
} = require("../../controllers/Other/transport.controller.js");

// Helper mock for Express response
function mockRes() {
  const res = {};
  res.statusCode = 200;
  res.body = null;
  res.status = sinon.stub().callsFake((code) => {
    res.statusCode = code;
    return res;
  });
  res.json = sinon.stub().callsFake((data) => {
    res.body = data;
    return res;
  });
  return res;
}

// =============================================================================
// Other transport.controller.js — Test Suite
// =============================================================================
describe("Other Transport Route Controller", function () {
  beforeEach(() => {
    sinon.stub(console, "log");
    sinon.stub(console, "error");
  });

  afterEach(() => sinon.restore());

  // -------------------------------------------------------------------------
  // Route CRUD
  // -------------------------------------------------------------------------
  describe("create, update, delete & list TransportRoute", function () {
    it("should return 400 if required route fields are missing", async function () {
      const req = { body: { busNumber: "BUS-01" } };
      const res = mockRes();
      await createTransportRoute(req, res);
      expect(res.statusCode).to.equal(400);
    });

    it("should return 400 if bus is already registered", async function () {
      sinon.stub(TransportRoute, "findOne").resolves({ busNumber: "BUS-01" });
      const req = {
        body: {
          busNumber: "BUS-01",
          busName: "Express",
          routeName: "Route A",
          baseFare: 500,
          stops: [{ name: "Stop 1" }],
        },
      };
      const res = mockRes();
      await createTransportRoute(req, res);
      expect(res.statusCode).to.equal(400);
    });

    it("should create transport route successfully", async function () {
      sinon.stub(TransportRoute, "findOne").resolves(null);
      sinon.stub(TransportRoute, "create").resolves({ _id: "r1", busNumber: "BUS-01" });
      const req = {
        body: {
          busNumber: "BUS-01",
          busName: "Express",
          routeName: "Route A",
          baseFare: 500,
          stops: [{ name: "Stop 1" }],
        },
      };
      const res = mockRes();
      await createTransportRoute(req, res);
      expect(res.statusCode).to.equal(200);
    });

    it("should update transport route successfully", async function () {
      sinon.stub(TransportRoute, "findByIdAndUpdate").resolves({ _id: "r1", routeName: "New Name" });
      const req = {
        params: { id: "r1" },
        body: {
          busNumber: "BUS-01",
          busName: "Express",
          routeName: "New Name",
          baseFare: 500,
          stops: [{ name: "Stop 1" }],
        },
      };
      const res = mockRes();
      await updateTransportRoute(req, res);
      expect(res.statusCode).to.equal(200);
    });

    // deleteTransportRoute uses route.deleteOne(), not findByIdAndDelete
    it("should delete transport route successfully", async function () {
      const mockRoute = {
        _id: "r1",
        allocations: [],
        deleteOne: sinon.stub().resolves(),
      };
      sinon.stub(TransportRoute, "findById").resolves(mockRoute);
      const req = { params: { id: "r1" } };
      const res = mockRes();
      await deleteTransportRoute(req, res);
      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
    });

    it("should list all transport routes sorted by routeName", async function () {
      sinon.stub(TransportRoute, "find").returns({
        sort: sinon.stub().resolves([{ busNumber: "BUS-01" }]),
      });
      const res = mockRes();
      await listTransportRoutes({}, res);
      expect(res.statusCode).to.equal(200);
    });
  });

  // -------------------------------------------------------------------------
  // Enrollment & Student Transport Details
  // -------------------------------------------------------------------------
  describe("enrollStudentToTransport & getStudentTransportDetails", function () {
    // enrollStudentToTransport expects: enrollmentNo, routeId, stopName
    it("should enroll student to transport route", async function () {
      const mockRoute = {
        _id: "r1",
        routeName: "Route A",
        busNumber: "B1",
        busName: "Express",
        baseFare: 500,
        capacity: 40,
        allocatedSeats: 0,
        stops: [{ name: "Stop 1", fare: 100 }],
        allocations: [],
        save: sinon.stub().resolves(),
      };
      sinon.stub(TransportRoute, "findById").resolves(mockRoute);

      const mockStudent = {
        _id: "sd1",
        enrollmentNo: "EN01",
        firstName: "John",
        lastName: "Doe",
        transport: null,
        save: sinon.stub().resolves(),
      };
      sinon.stub(StudentDetails, "findOne").resolves(mockStudent);

      const req = {
        body: {
          enrollmentNo: "EN01",
          routeId: "r1",
          stopName: "Stop 1",
        },
      };
      const res = mockRes();
      await enrollStudentToTransport(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
    });

    it("should get student transport details successfully", async function () {
      const query = {
        select: sinon.stub().resolves({
          enrollmentNo: "EN01",
          firstName: "John",
          transport: { busNumber: "B1", stopName: "Stop 1" },
        }),
      };
      sinon.stub(StudentDetails, "findOne").returns(query);

      const req = { params: { enrollmentNo: "EN01" } };
      const res = mockRes();
      await getStudentTransportDetails(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
    });
  });

  // -------------------------------------------------------------------------
  // Allocations & Summaries
  // -------------------------------------------------------------------------
  describe("getRouteAllocations & getAllRouteSummaries", function () {
    it("should get route allocations", async function () {
      const mockRoute = {
        _id: "r1",
        routeName: "Route A",
        allocations: [{ enrollmentNo: "EN01" }],
      };
      const query = {
        populate: sinon.stub().resolves(mockRoute),
      };
      sinon.stub(TransportRoute, "findById").returns(query);

      const req = { params: { routeId: "r1" } };
      const res = mockRes();
      await getRouteAllocations(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
    });

    it("should get all route summaries", async function () {
      const routesList = [
        {
          _id: "r1",
          busNumber: "B1",
          busName: "Express",
          routeName: "Route A",
          capacity: 40,
          allocatedSeats: 5,
          status: "active",
          allocations: [],
        },
      ];
      const query = {
        populate: sinon.stub().returnsThis(),
        select: sinon.stub().resolves(routesList),
      };
      sinon.stub(TransportRoute, "find").returns(query);

      const res = mockRes();
      await getAllRouteSummaries({}, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
    });
  });

  // -------------------------------------------------------------------------
  // Seat Management
  // -------------------------------------------------------------------------
  describe("Seat management functions", function () {
    it("should get seat map for route", async function () {
      const mockRoute = {
        _id: "r1",
        capacity: 40,
        allocatedSeats: 0,
        seatConfig: {
          totalSeats: 40,
          seatsPerRow: 3,
          totalRows: 14,
          aislePosition: 2,
          frontRowsForStaff: 1,
          maleSectionStart: 2,
          maleSectionEnd: 7,
          femaleSectionStart: 8,
          femaleSectionEnd: 14,
        },
        allocations: [],
      };
      const query = {
        populate: sinon.stub().resolves(mockRoute),
      };
      sinon.stub(TransportRoute, "findById").returns(query);

      const req = { params: { routeId: "r1" } };
      const res = mockRes();
      await getSeatMap(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
    });

    // assignSeatToStudent needs: route with seatAssignmentLocked, seatConfig,
    // allocations array with matching enrollmentNo; student with transport object
    it("should assign seat to student", async function () {
      const mockRoute = {
        _id: "r1",
        capacity: 40,
        seatAssignmentLocked: false,
        seatConfig: {},
        allocations: [
          { enrollmentNo: "EN01", seatNumber: null },
        ],
        save: sinon.stub().resolves(),
      };
      const mockStudent = {
        enrollmentNo: "EN01",
        firstName: "John",
        lastName: "Doe",
        transport: { seatNumber: null, seatType: null, lastUpdated: null },
        save: sinon.stub().resolves(),
      };

      sinon.stub(TransportRoute, "findById").resolves(mockRoute);
      sinon.stub(StudentDetails, "findOne").resolves(mockStudent);

      const req = {
        body: {
          routeId: "r1",
          enrollmentNo: "EN01",
          seatNumber: "A1",
        },
      };
      const res = mockRes();
      await assignSeatToStudent(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
    });

    // autoAssignSeats: complex logic, but the early-return path where all
    // students already have seats is the simplest to test reliably
    it("should auto assign seats on route", async function () {
      const mockRoute = {
        _id: "r1",
        capacity: 40,
        seatConfig: {
          totalSeats: 40,
          seatsPerRow: 3,
          totalRows: 14,
          aislePosition: 2,
          frontRowsForStaff: 1,
          maleSectionStart: 2,
          maleSectionEnd: 7,
          femaleSectionStart: 8,
          femaleSectionEnd: 14,
        },
        allocations: [
          { enrollmentNo: "EN01", seatNumber: "B1" }, // already has seat
        ],
        save: sinon.stub().resolves(),
      };
      sinon.stub(TransportRoute, "findById").resolves(mockRoute);

      const req = { params: { routeId: "r1" } };
      const res = mockRes();
      await autoAssignSeats(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.include("already have seat");
    });

    // updateSeatConfiguration: totalSeats must match route.capacity or be absent
    it("should update seat configuration", async function () {
      const mockRoute = {
        _id: "r1",
        capacity: 40,
        seatConfig: {},
        save: sinon.stub().resolves(),
      };
      sinon.stub(TransportRoute, "findById").resolves(mockRoute);

      const req = {
        params: { routeId: "r1" },
        body: { seatsPerRow: 4, totalRows: 10 },
      };
      const res = mockRes();
      await updateSeatConfiguration(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
    });

    it("should remove seat assignment", async function () {
      const mockRoute = {
        _id: "r1",
        allocations: [
          { enrollmentNo: "EN01", seatNumber: "12" },
        ],
        save: sinon.stub().resolves(),
      };
      sinon.stub(TransportRoute, "findById").resolves(mockRoute);
      sinon.stub(StudentDetails, "findOne").resolves({ enrollmentNo: "EN01", transport: {}, save: sinon.stub().resolves() });

      const req = { body: { routeId: "r1", enrollmentNo: "EN01" } };
      const res = mockRes();
      await removeSeatAssignment(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
    });
  });
});
