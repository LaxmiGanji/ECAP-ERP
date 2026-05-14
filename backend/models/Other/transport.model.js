const mongoose = require("mongoose");

const stopSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    landmark: { type: String, trim: true },
    distanceKm: { type: Number, min: 0 },
    fare: { type: Number, min: 0 },
    arrivalTime: { type: String, trim: true },
    code: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { _id: false }
);

const allocationSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student Detail" },
    enrollmentNo: { type: String, trim: true },
    stopName: { type: String, trim: true },
    farePaid: { type: Number, min: 0 },
    paymentReference: { type: String, trim: true },
    paidOn: { type: Date, default: Date.now },
    seatNumber: { type: String, trim: true }, // Add seat number
    seatType: { type: String, enum: ["window", "aisle", "front", "back"], default: "window" }, // Add seat type
    allocatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "TransportDetail" }, // Who allocated the seat
    allocationDate: { type: Date, default: Date.now },
  },
  { _id: false }
);

// Add seat configuration schema
const seatConfigurationSchema = new mongoose.Schema(
  {
    totalSeats: { type: Number, required: true },
    seatsPerRow: { type: Number, default: 3 },
    totalRows: { type: Number },
    aislePosition: { type: Number, default: 2 }, // Which seat number is the aisle (1-indexed)
    frontRowsForStaff: { type: Number, default: 0 }, // How many front rows reserved for staff
    maleSectionStart: { type: Number, default: 1 }, // Starting row for male section
    maleSectionEnd: { type: Number }, // Ending row for male section
    femaleSectionStart: { type: Number }, // Starting row for female section
    femaleSectionEnd: { type: Number }, // Ending row for female section
    reservedSeats: [{ // For special cases
      seatNumber: { type: String, required: true },
      reason: { type: String },
      reservedFor: { type: String }
    }]
  },
  { _id: false }
);

const transportSchema = new mongoose.Schema(
  {
    busNumber: { type: String, required: true, trim: true, unique: true },
    busName: { type: String, required: true, trim: true },
    driverName: { type: String, trim: true },
    driverPhone: { type: String, trim: true },
    capacity: { type: Number, required: true, min: 1 },
    routeName: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    baseFare: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["active", "maintenance", "inactive"],
      default: "active",
    },
    stops: {
      type: [stopSchema],
      validate: [(stops) => stops.length > 0, "At least one stop is required"],
    },
    allocatedSeats: { type: Number, default: 0, min: 0 },
    allocations: { type: [allocationSchema], default: [] },
    seatConfig: { type: seatConfigurationSchema }, // Add seat configuration
    autoAssignSeats: { type: Boolean, default: true }, // Auto assign seats on enrollment
    seatAssignmentLocked: { type: Boolean, default: false }, // Lock seat assignments
  },
  { timestamps: true }
);

// Pre-save middleware to calculate seat configuration if not provided
transportSchema.pre('save', function(next) {
  if (this.isModified('capacity') && !this.seatConfig) {
    this.seatConfig = {
      totalSeats: this.capacity,
      seatsPerRow: 3, // Default: 3 seats per row (2 window, 1 aisle)
      totalRows: Math.ceil(this.capacity / 3),
      aislePosition: 2,
      frontRowsForStaff: 1, // First row for staff/driver
      maleSectionStart: 2, // After staff row
      maleSectionEnd: Math.ceil(this.capacity / 6) + 1, // Half capacity for males
      femaleSectionStart: Math.ceil(this.capacity / 6) + 2,
      femaleSectionEnd: Math.ceil(this.capacity / 3)
    };
  }
  next();
});

module.exports = mongoose.model("TransportRoute", transportSchema);