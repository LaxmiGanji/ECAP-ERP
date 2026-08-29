const sinon = require("sinon");
const { expect } = require("chai");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Models
const placementCredential = require("../../models/Placement/credential.model.js");
const placementDetails = require("../../models/Placement/details.model.js");
const companyModel = require("../../models/Placement/company.model.js");
const driveModel = require("../../models/Placement/drive.model.js");
const studentProfileModel = require("../../models/Placement/studentProfile.model.js");
const applicationModel = require("../../models/Placement/application.model.js");
const trainingModel = require("../../models/Placement/training.model.js");
const StudentDetail = require("../../models/Students/details.model.js");

// Controllers
const {
  loginHandler,
  registerHandler,
  updateHandler,
  deleteHandler,
} = require("../../controllers/Placement/credential.controller.js");

const {
  addDetails,
  getDetails,
  updateDetails,
  deleteDetails,
} = require("../../controllers/Placement/details.controller.js");

const {
  addCompany,
  getCompanies,
  updateCompany,
  deleteCompany,
} = require("../../controllers/Placement/company.controller.js");

const {
  addDrive,
  getDrives,
  updateDrive,
  deleteDrive,
  getEligibleStudents,
} = require("../../controllers/Placement/drive.controller.js");

const {
  addApplication,
  getApplicationsForDrive,
  updateApplicationStatus,
  getStudentApplications,
  getApplicationById,
  deleteApplication,
} = require("../../controllers/Placement/application.controller.js");

const {
  addOrUpdateProfile,
  getProfile,
} = require("../../controllers/Placement/studentProfile.controller.js");

const {
  addTraining,
  getTrainings,
  updateTraining,
  deleteTraining,
  registerForTraining,
} = require("../../controllers/Placement/training.controller.js");

// Express res mock helper
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
// Comprehensive Placement Controllers — Test Suite
// =============================================================================
describe("Comprehensive Placement Controllers", function () {
  beforeEach(() => {
    sinon.stub(console, "log");
    sinon.stub(console, "error");
  });

  afterEach(() => sinon.restore());

  // -------------------------------------------------------------------------
  // 1. Credential Controller
  // -------------------------------------------------------------------------
  describe("Placement Credential Controller", function () {
    it("loginHandler - should return 400 if user not found", async function () {
      sinon.stub(placementCredential, "findOne").resolves(null);
      const req = { body: { loginid: "plc01", password: "p" } };
      const res = mockRes();
      await loginHandler(req, res);
      expect(res.statusCode).to.equal(400);
    });

    it("loginHandler - should return 400 if password invalid", async function () {
      sinon.stub(placementCredential, "findOne").resolves({ password: "hash" });
      sinon.stub(bcrypt, "compare").resolves(false);
      const req = { body: { loginid: "plc01", password: "p" } };
      const res = mockRes();
      await loginHandler(req, res);
      expect(res.statusCode).to.equal(400);
    });

    it("loginHandler - should return 200 on valid login", async function () {
      sinon.stub(placementCredential, "findOne").resolves({ id: "p1", loginid: "plc01", password: "hash" });
      sinon.stub(bcrypt, "compare").resolves(true);
      sinon.stub(jwt, "sign").returns("token");
      const req = { body: { loginid: "plc01", password: "p" } };
      const res = mockRes();
      await loginHandler(req, res);
      expect(res.statusCode).to.equal(200);
    });

    it("loginHandler - should return 500 on error", async function () {
      sinon.stub(placementCredential, "findOne").rejects(new Error("DB"));
      const req = { body: { loginid: "plc01" } };
      const res = mockRes();
      await loginHandler(req, res);
      expect(res.statusCode).to.equal(500);
    });

    it("registerHandler - should return 400 if user already exists", async function () {
      sinon.stub(placementCredential, "findOne").resolves({ loginid: "plc01" });
      const req = { body: { loginid: "plc01", password: "p" } };
      const res = mockRes();
      await registerHandler(req, res);
      expect(res.statusCode).to.equal(400);
    });

    it("registerHandler - should register user successfully", async function () {
      sinon.stub(placementCredential, "findOne").resolves(null);
      sinon.stub(bcrypt, "hash").resolves("hash");
      sinon.stub(placementCredential, "create").resolves({ loginid: "plc01", id: "p1" });
      const req = { body: { loginid: "plc01", password: "p" } };
      const res = mockRes();
      await registerHandler(req, res);
      expect(res.statusCode).to.equal(200);
    });

    it("updateHandler - should update user credentials with password hash", async function () {
      sinon.stub(bcrypt, "hash").resolves("newhash");
      sinon.stub(placementCredential, "findByIdAndUpdate").resolves({ id: "p1" });
      const req = { params: { id: "p1" }, body: { password: "newpass" } };
      const res = mockRes();
      await updateHandler(req, res);
      expect(res.statusCode).to.equal(200);
    });

    it("updateHandler - should return 400 if user not found", async function () {
      sinon.stub(placementCredential, "findByIdAndUpdate").resolves(null);
      const req = { params: { id: "ghost" }, body: {} };
      const res = mockRes();
      await updateHandler(req, res);
      expect(res.statusCode).to.equal(400);
    });

    it("deleteHandler - should delete user and return 400 if not found", async function () {
      sinon.stub(placementCredential, "findByIdAndDelete").onFirstCall().resolves({ id: "p1" }).onSecondCall().resolves(null);
      const req = { params: { id: "p1" } };
      const res1 = mockRes();
      await deleteHandler(req, res1);
      expect(res1.statusCode).to.equal(200);

      const res2 = mockRes();
      await deleteHandler(req, res2);
      expect(res2.statusCode).to.equal(400);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Details Controller
  // -------------------------------------------------------------------------
  describe("Placement Details Controller", function () {
    it("addDetails - duplicate employeeId check and creation", async function () {
      sinon.stub(placementDetails, "findOne").onFirstCall().resolves({ employeeId: "EMP" }).onSecondCall().resolves(null);
      sinon.stub(placementDetails, "create").resolves({ employeeId: "EMP" });

      const req = { body: { employeeId: "EMP" } };
      const res1 = mockRes();
      await addDetails(req, res1);
      expect(res1.statusCode).to.equal(400);

      const res2 = mockRes();
      await addDetails(req, res2);
      expect(res2.statusCode).to.equal(200);
    });

    it("getDetails - null check and details return", async function () {
      sinon.stub(placementDetails, "find").onFirstCall().resolves(null).onSecondCall().resolves([{ employeeId: "EMP" }]);

      const req = {};
      const res1 = mockRes();
      await getDetails(req, res1);
      expect(res1.statusCode).to.equal(400);

      const res2 = mockRes();
      await getDetails(req, res2);
      expect(res2.statusCode).to.equal(200);
    });

    it("updateDetails & deleteDetails - handles success and not found", async function () {
      sinon.stub(placementDetails, "findByIdAndUpdate").onFirstCall().resolves({ id: "d1" }).onSecondCall().resolves(null);
      sinon.stub(placementDetails, "findByIdAndDelete").onFirstCall().resolves({ id: "d1" }).onSecondCall().resolves(null);

      const req = { params: { id: "d1" }, body: {} };
      const resUp1 = mockRes();
      await updateDetails(req, resUp1);
      expect(resUp1.statusCode).to.equal(200);

      const resUp2 = mockRes();
      await updateDetails(req, resUp2);
      expect(resUp2.statusCode).to.equal(400);

      const resDel1 = mockRes();
      await deleteDetails(req, resDel1);
      expect(resDel1.statusCode).to.equal(200);

      const resDel2 = mockRes();
      await deleteDetails(req, resDel2);
      expect(resDel2.statusCode).to.equal(400);
    });
  });

  // -------------------------------------------------------------------------
  // 3. Company Controller
  // -------------------------------------------------------------------------
  describe("Placement Company Controller", function () {
    it("addCompany, getCompanies, updateCompany, deleteCompany", async function () {
      sinon.stub(companyModel, "create").resolves({ name: "C1" });
      sinon.stub(companyModel, "find").resolves([{ name: "C1" }]);
      sinon.stub(companyModel, "findByIdAndUpdate").onFirstCall().resolves({ name: "C2" }).onSecondCall().resolves(null);
      sinon.stub(companyModel, "findByIdAndDelete").onFirstCall().resolves({ id: "c1" }).onSecondCall().resolves(null);

      const req1 = { body: { name: "C1" } };
      const res1 = mockRes();
      await addCompany(req1, res1);
      expect(res1.statusCode).to.equal(200);

      const req2 = {};
      const res2 = mockRes();
      await getCompanies(req2, res2);
      expect(res2.statusCode).to.equal(200);

      const req3 = { params: { id: "c1" }, body: { name: "C2" } };
      const res3 = mockRes();
      await updateCompany(req3, res3);
      expect(res3.statusCode).to.equal(200);

      const res3b = mockRes();
      await updateCompany(req3, res3b);
      expect(res3b.statusCode).to.equal(404);

      const req4 = { params: { id: "c1" } };
      const res4 = mockRes();
      await deleteCompany(req4, res4);
      expect(res4.statusCode).to.equal(200);

      const res4b = mockRes();
      await deleteCompany(req4, res4b);
      expect(res4b.statusCode).to.equal(404);
    });
  });

  // -------------------------------------------------------------------------
  // 4. Drive Controller
  // -------------------------------------------------------------------------
  describe("Placement Drive Controller", function () {
    it("addDrive, getDrives, updateDrive, deleteDrive", async function () {
      sinon.stub(driveModel, "create").resolves({ title: "D1" });
      const popQuery = { populate: sinon.stub().resolves([{ title: "D1" }]) };
      sinon.stub(driveModel, "find").returns(popQuery);
      sinon.stub(driveModel, "findByIdAndUpdate").onFirstCall().resolves({ title: "D1" }).onSecondCall().resolves(null);
      sinon.stub(driveModel, "findByIdAndDelete").onFirstCall().resolves({ id: "d1" }).onSecondCall().resolves(null);

      const res1 = mockRes();
      await addDrive({ body: {} }, res1);
      expect(res1.statusCode).to.equal(200);

      const res2 = mockRes();
      await getDrives({}, res2);
      expect(res2.statusCode).to.equal(200);

      const res3 = mockRes();
      await updateDrive({ params: { id: "d1" }, body: {} }, res3);
      expect(res3.statusCode).to.equal(200);

      const res3b = mockRes();
      await updateDrive({ params: { id: "d1" }, body: {} }, res3b);
      expect(res3b.statusCode).to.equal(404);

      const res4 = mockRes();
      await deleteDrive({ params: { id: "d1" } }, res4);
      expect(res4.statusCode).to.equal(200);

      const res4b = mockRes();
      await deleteDrive({ params: { id: "d1" } }, res4b);
      expect(res4b.statusCode).to.equal(404);
    });

    it("getEligibleStudents - filtering logic and 404 check", async function () {
      sinon.stub(driveModel, "findById").onFirstCall().resolves(null).onSecondCall().resolves({
        eligibilityCriteria: {
          minCGPA: 7.0,
          maxBacklogs: 1,
          allowedBranches: ["CSE", "ECE"],
          min10thPercentage: 70,
          min12thPercentage: 70,
        },
      });

      const profQuery = { populate: sinon.stub().resolves([{ studentId: { loginid: "EN01" } }]) };
      sinon.stub(studentProfileModel, "find").returns(profQuery);

      const req = { params: { id: "d1" } };
      const res1 = mockRes();
      await getEligibleStudents(req, res1);
      expect(res1.statusCode).to.equal(404);

      const res2 = mockRes();
      await getEligibleStudents(req, res2);
      expect(res2.statusCode).to.equal(200);
      expect(res2.body.eligibleStudents).to.have.lengthOf(1);
    });
  });

  // -------------------------------------------------------------------------
  // 5. Application Controller
  // -------------------------------------------------------------------------
  describe("Placement Application Controller", function () {
    it("addApplication - student identification & duplicate check", async function () {
      sinon.stub(StudentDetail, "findOne").resolves({ _id: "sd1", enrollmentNo: "EN01" });
      sinon.stub(applicationModel, "create")
        .onFirstCall().resolves({ _id: "app1" })
        .onSecondCall().rejects({ code: 11000 });

      const popChain = {
        populate: sinon.stub().returnsThis(),
      };
      popChain.populate = sinon.stub().returns({
        populate: sinon.stub().resolves({ _id: "app1" }),
      });
      sinon.stub(applicationModel, "findById").returns(popChain);

      const req1 = { user: { loginid: "EN01" }, body: { drive: "d1" } };
      const res1 = mockRes();
      await addApplication(req1, res1);
      expect(res1.statusCode).to.equal(200);

      const res2 = mockRes();
      await addApplication(req1, res2);
      expect(res2.statusCode).to.equal(400);
      expect(res2.body.message).to.include("already applied");

      const reqNoUser = { user: {} };
      const res3 = mockRes();
      await addApplication(reqNoUser, res3);
      expect(res3.statusCode).to.equal(400);
    });

    it("getApplicationsForDrive", async function () {
      const appDoc = {
        toObject: () => ({ student: { enrollmentNo: "EN01" } }),
      };
      const driveAppsQuery = {
        populate: sinon.stub().returnsThis(),
        sort: sinon.stub().resolves([appDoc]),
      };

      driveAppsQuery.populate = sinon.stub().returns({
        populate: sinon.stub().returns({
          sort: sinon.stub().resolves([appDoc]),
        }),
      });

      sinon.stub(applicationModel, "find").returns(driveAppsQuery);
      sinon.stub(studentProfileModel, "find").resolves([{ enrollmentNo: "EN01", resumeLink: "http://resume.pdf" }]);

      const resDriveApps = mockRes();
      await getApplicationsForDrive({ params: { driveId: "d1" } }, resDriveApps);
      expect(resDriveApps.statusCode).to.equal(200);
    });

    it("updateApplicationStatus", async function () {
      const appDoc = {
        toObject: () => ({ student: { enrollmentNo: "EN01" } }),
      };
      const updateAppQuery = {
        populate: sinon.stub().returnsThis(),
      };
      updateAppQuery.populate = sinon.stub().returns({
        populate: sinon.stub().resolves(appDoc),
      });
      sinon.stub(applicationModel, "findByIdAndUpdate").returns(updateAppQuery);
      sinon.stub(studentProfileModel, "findOne").resolves({ resumeLink: "http://resume.pdf" });

      const resUp = mockRes();
      await updateApplicationStatus({ params: { id: "app1" }, body: { status: "Selected" } }, resUp);
      expect(resUp.statusCode).to.equal(200);
    });

    it("getStudentApplications", async function () {
      sinon.stub(StudentDetail, "findOne").resolves({ _id: "sd1" });
      const studAppsQuery = {
        populate: sinon.stub().returnsThis(),
        sort: sinon.stub().resolves([]),
      };
      studAppsQuery.populate = sinon.stub().returns({
        sort: sinon.stub().resolves([]),
      });
      sinon.stub(applicationModel, "find").returns(studAppsQuery);

      const resStudApps = mockRes();
      await getStudentApplications({ user: { loginid: "EN01" } }, resStudApps);
      expect(resStudApps.statusCode).to.equal(200);
    });

    it("getApplicationById", async function () {
      const appDoc = {
        toObject: () => ({ student: { enrollmentNo: "EN01" } }),
      };
      const getByIdQuery = {
        populate: sinon.stub().returnsThis(),
      };
      getByIdQuery.populate = sinon.stub().returns({
        populate: sinon.stub().resolves(appDoc),
      });
      sinon.stub(applicationModel, "findById").returns(getByIdQuery);
      sinon.stub(studentProfileModel, "findOne").resolves({ resumeLink: "http://resume.pdf" });

      const resById = mockRes();
      await getApplicationById({ params: { id: "app1" } }, resById);
      expect(resById.statusCode).to.equal(200);
    });

    it("deleteApplication", async function () {
      sinon.stub(applicationModel, "findByIdAndDelete").onFirstCall().resolves({ _id: "app1" }).onSecondCall().resolves(null);

      const resDel = mockRes();
      await deleteApplication({ params: { id: "app1" } }, resDel);
      expect(resDel.statusCode).to.equal(200);

      const resDel404 = mockRes();
      await deleteApplication({ params: { id: "app1" } }, resDel404);
      expect(resDel404.statusCode).to.equal(404);
    });
  });

  // -------------------------------------------------------------------------
  // 6. Student Profile Controller
  // -------------------------------------------------------------------------
  describe("Placement Student Profile Controller", function () {
    it("addOrUpdateProfile - updates profile when existing", async function () {
      sinon.stub(studentProfileModel, "findOne").resolves({ studentId: "s1" });
      sinon.stub(studentProfileModel, "findOneAndUpdate").resolves({ studentId: "s1", cgpa: 9.0 });

      const reqUser = { user: { id: "s1" }, body: { cgpa: 9.0 } };
      const res = mockRes();
      await addOrUpdateProfile(reqUser, res);
      expect(res.statusCode).to.equal(200);
      expect(res.body.message).to.include("updated");
    });

    it("addOrUpdateProfile - creates profile when new", async function () {
      sinon.stub(studentProfileModel, "findOne").resolves(null);
      sinon.stub(studentProfileModel, "create").resolves({ studentId: "s1", cgpa: 8.5 });

      const reqUser = { user: { id: "s1" }, body: { cgpa: 8.5 } };
      const res = mockRes();
      await addOrUpdateProfile(reqUser, res);
      expect(res.statusCode).to.equal(200);
      expect(res.body.message).to.include("created");
    });

    it("getProfile - 404 when not found and 200 when found", async function () {
      sinon.stub(studentProfileModel, "findOne").onFirstCall().resolves(null).onSecondCall().resolves({ studentId: "s1" });

      const res1 = mockRes();
      await getProfile({ user: { id: "s1" } }, res1);
      expect(res1.statusCode).to.equal(404);

      const res2 = mockRes();
      await getProfile({ user: { id: "s1" } }, res2);
      expect(res2.statusCode).to.equal(200);
    });
  });

  // -------------------------------------------------------------------------
  // 7. Training Controller
  // -------------------------------------------------------------------------
  describe("Placement Training Controller", function () {
    it("addTraining, getTrainings, updateTraining, deleteTraining, registerForTraining", async function () {
      sinon.stub(trainingModel, "create").resolves({ title: "Java Training" });
      sinon.stub(trainingModel, "find").resolves([{ title: "Java Training" }]);
      sinon.stub(trainingModel, "findByIdAndUpdate").onFirstCall().resolves({ id: "t1" }).onSecondCall().resolves(null);
      sinon.stub(trainingModel, "findByIdAndDelete").onFirstCall().resolves({ id: "t1" }).onSecondCall().resolves(null);

      const res1 = mockRes();
      await addTraining({ body: {} }, res1);
      expect(res1.statusCode).to.equal(200);

      const res2 = mockRes();
      await getTrainings({}, res2);
      expect(res2.statusCode).to.equal(200);

      const res3 = mockRes();
      await updateTraining({ params: { id: "t1" }, body: {} }, res3);
      expect(res3.statusCode).to.equal(200);

      const res3b = mockRes();
      await updateTraining({ params: { id: "t1" }, body: {} }, res3b);
      expect(res3b.statusCode).to.equal(404);

      const res4 = mockRes();
      await deleteTraining({ params: { id: "t1" } }, res4);
      expect(res4.statusCode).to.equal(200);

      const res4b = mockRes();
      await deleteTraining({ params: { id: "t1" } }, res4b);
      expect(res4b.statusCode).to.equal(404);

      const trainingDoc = {
        registeredStudents: ["otherStudent"],
        save: sinon.stub().resolves(),
      };
      sinon.stub(trainingModel, "findById")
        .onFirstCall().resolves(null)
        .onSecondCall().resolves({ registeredStudents: ["s1"] })
        .onThirdCall().resolves(trainingDoc);

      const reqReg = { user: { id: "s1" }, params: { id: "t1" } };
      const resReg1 = mockRes();
      await registerForTraining(reqReg, resReg1);
      expect(resReg1.statusCode).to.equal(404);

      const resReg2 = mockRes();
      await registerForTraining(reqReg, resReg2);
      expect(resReg2.statusCode).to.equal(400);

      const resReg3 = mockRes();
      await registerForTraining(reqReg, resReg3);
      expect(resReg3.statusCode).to.equal(200);
    });
  });
});
