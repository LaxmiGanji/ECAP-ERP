const mongoose = require("mongoose");

const studentDetails = new mongoose.Schema({
  enrollmentNo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  firstName: {
    type: String,
    required: false,
    trim: true
  },
  middleName: {
    type: String,
    required: false,
    trim: true
  },
  lastName: {
    type: String,
    required: false,
    trim: true
  },
  email: {
    type: String,
    required: false,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  FatherName: {
    type: String,
    required: false,
    trim: true
  },
  MotherName: {
    type: String,
    required: false,
    trim: true
  },
  FatherPhoneNumber: {
    type: String,
    required: false,
    trim: true
  },
  MotherPhoneNumber: {
    type: String,
    required: false,
    trim: true
  },
  semester: {
    type: Number,
    required: true
  },
  branch: {
    type: String,
    required: true,
    trim: true
  },
  batch: {
    type: Number,
    required: true,
    index: true
  },
  regulation: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  gender: {
    type: String,
    required: false,
    trim: true
  },
  profile: {
    type: String,
    required: false
  },
  section: {
    type: String,
    required: false,
    trim: true
  },
  tenthPercentage: {
    type: Number,
    required: false
  },
  twelfthPercentage: {
    type: Number,
    required: false
  },
  cgpa: {
    type: Number,
    required: false
  },
  activeBacklogs: {
    type: Number,
    required: false,
    default: 0
  },
  resumeLink: {
    type: String,
    required: false,
    trim: true
  },
  linkedinLink: {
    type: String,
    required: false,
    trim: true
  },
  certifications: {
    type: [String],
    required: false,
    default: []
  },
  books: {
    type: [{
      bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Library",
        required: true
      },
      issueDate: {
        type: Date,
        default: Date.now
      },
      returnDate: {
        type: Date
      },
      status: {
        type: String,
        enum: ['issued', 'returned'],
        default: 'issued'
      }
    }],
    default: []
  },
  transport: {
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TransportRoute"
    },
    routeName: {
      type: String,
      trim: true
    },
    busNumber: {
      type: String,
      trim: true
    },
    busName: {
      type: String,
      trim: true
    },
    stopName: {
      type: String,
      trim: true
    },
    fare: {
      type: Number,
      min: 0
    },
    paymentReference: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ["pending", "active", "cancelled"],
      default: "pending"
    },
    // Seat Allocation Fields
    seatNumber: {
      type: String,
      trim: true
    },
    seatType: {
      type: String,
      enum: ["window", "aisle", "front", "back", "emergency"],
      default: "window"
    },
    seatSection: {
      type: String,
      enum: ["male", "female", "staff", "general"],
      default: "general"
    },
    seatRow: {
      type: Number,
      min: 1
    },
    seatPosition: {
      type: Number,
      min: 1
    },
    seatLabel: {
      type: String,
      trim: true
    },
    allocationDate: {
      type: Date
    },
    allocatedBy: {
      type: String,
      trim: true
    },
    allocationNotes: {
      type: String,
      trim: true
    },
    isSeatConfirmed: {
      type: Boolean,
      default: false
    },
    seatConfirmedDate: {
      type: Date
    },
    seatSwapRequest: {
      requestedSeat: {
        type: String,
        trim: true
      },
      requestedWith: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student Detail"
      },
      requestDate: {
        type: Date
      },
      status: {
        type: String,
        enum: ["pending", "approved", "rejected", "cancelled"],
        default: "pending"
      },
      notes: {
        type: String,
        trim: true
      }
    },
    // Attendance tracking for seat validation
    seatAttendance: [{
      date: {
        type: Date,
        required: true
      },
      present: {
        type: Boolean,
        default: true
      },
      markedBy: {
        type: String,
        trim: true
      },
      notes: {
        type: String,
        trim: true
      }
    }],
    seatAbsenceCount: {
      type: Number,
      default: 0,
      min: 0
    },
    // Payment for seat
    seatFee: {
      amount: {
        type: Number,
        min: 0
      },
      paymentReference: {
        type: String,
        trim: true
      },
      paymentDate: {
        type: Date
      },
      paymentStatus: {
        type: String,
        enum: ["pending", "paid", "partial", "waived"],
        default: "pending"
      }
    },
    paidOn: {
      type: Date
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  // Additional fields for transport preferences
  transportPreferences: {
    preferredSeatType: {
      type: String,
      enum: ["window", "aisle", "front", "back", "any"],
      default: "any"
    },
    preferredGenderSection: {
      type: String,
      enum: ["male", "female", "mixed", "any"],
      default: "any"
    },
    medicalConditions: {
      type: String,
      trim: true
    },
    requiresSpecialSeating: {
      type: Boolean,
      default: false
    },
    specialSeatingNotes: {
      type: String,
      trim: true
    },
    emergencyContactOnBus: {
      name: {
        type: String,
        trim: true
      },
      phone: {
        type: String,
        trim: true
      },
      relation: {
        type: String,
        trim: true
      }
    }
  },
  // Graduation & Alumni fields
  isGraduated: {
    type: Boolean,
    default: false,
    index: true
  },
  graduationYear: {
    type: String,
    trim: true
  },
  graduatedAt: {
    type: Date
  },
  // Backlogs for placement tracking
  activeBacklogs: {
    type: Number,
    default: 0,
    min: 0
  },
  backlogDetails: {
    type: String,
    default: "",
    trim: true
  },
  // Transport history
  transportHistory: [{
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TransportRoute"
    },
    routeName: {
      type: String,
      trim: true
    },
    busNumber: {
      type: String,
      trim: true
    },
    busName: {
      type: String,
      trim: true
    },
    stopName: {
      type: String,
      trim: true
    },
    seatNumber: {
      type: String,
      trim: true
    },
    seatType: {
      type: String,
      enum: ["window", "aisle", "front", "back", "emergency"]
    },
    fare: {
      type: Number,
      min: 0
    },
    paymentReference: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled", "transferred"]
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    reasonForChange: {
      type: String,
      trim: true
    }
  }]
}, { timestamps: true });

// Indexes for faster queries
studentDetails.index({ 'transport.routeId': 1 });
studentDetails.index({ 'transport.seatNumber': 1 });
studentDetails.index({ 'transport.status': 1 });
studentDetails.index({ 'transport.seatSection': 1 });
studentDetails.index({ 'transport.isSeatConfirmed': 1 });
studentDetails.index({ 'transport.seatSwapRequest.status': 1 });
studentDetails.index({ branch: 1, semester: 1, batch: 1 });

// Virtual for full name
studentDetails.virtual('fullName').get(function () {
  return `${this.firstName || ''} ${this.middleName || ''} ${this.lastName || ''}`.trim();
});

// Virtual for seat information summary
studentDetails.virtual('seatInfo').get(function () {
  if (!this.transport.seatNumber) return null;
  return {
    seatNumber: this.transport.seatNumber,
    seatType: this.transport.seatType,
    section: this.transport.seatSection,
    row: this.transport.seatRow,
    position: this.transport.seatPosition,
    label: this.transport.seatLabel,
    isConfirmed: this.transport.isSeatConfirmed
  };
});

// Method to check if seat is available for swap
studentDetails.methods.isSeatAvailableForSwap = function () {
  return (
    this.transport.seatNumber &&
    this.transport.status === 'active' &&
    (!this.transport.seatSwapRequest ||
      this.transport.seatSwapRequest.status === 'rejected' ||
      this.transport.seatSwapRequest.status === 'cancelled')
  );
};

// Method to get seat display label
studentDetails.methods.getSeatDisplayLabel = function () {
  if (!this.transport.seatNumber) return 'No seat assigned';

  let label = this.transport.seatNumber;
  if (this.transport.seatLabel) {
    label += ` (${this.transport.seatLabel})`;
  }
  if (this.transport.seatType) {
    label += ` • ${this.transport.seatType.charAt(0).toUpperCase() + this.transport.seatType.slice(1)}`;
  }
  return label;
};

// Method to check if student can be assigned to gender section
studentDetails.methods.canBeAssignedToSection = function (section) {
  if (!this.gender) return true;

  const gender = this.gender.toLowerCase();
  if (section === 'male') {
    return gender === 'male' || gender === 'm';
  } else if (section === 'female') {
    return gender === 'female' || gender === 'f';
  }
  return true;
};

// Pre-save middleware to update seat label
studentDetails.pre('save', function (next) {
  if (this.transport.seatNumber && this.transport.seatRow && this.transport.seatPosition) {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];
    const rowLabel = rows[this.transport.seatRow - 1] || String(this.transport.seatRow);
    this.transport.seatLabel = `${rowLabel}${this.transport.seatPosition}`;
  }

  // Update lastUpdated timestamp
  if (this.isModified('transport')) {
    this.transport.lastUpdated = new Date();
  }

  next();
});

// Static method to find students by seat
studentDetails.statics.findBySeat = function (routeId, seatNumber) {
  return this.findOne({
    'transport.routeId': routeId,
    'transport.seatNumber': seatNumber,
    'transport.status': 'active'
  });
};

// Static method to find all students in a route
studentDetails.statics.findByRoute = function (routeId) {
  return this.find({
    'transport.routeId': routeId,
    'transport.status': 'active'
  }).sort({ 'transport.seatNumber': 1 });
};

// Static method to get seat occupancy by gender
studentDetails.statics.getSeatOccupancyByGender = function (routeId) {
  return this.aggregate([
    {
      $match: {
        'transport.routeId': mongoose.Types.ObjectId(routeId),
        'transport.status': 'active',
        'transport.seatNumber': { $exists: true, $ne: null }
      }
    },
    {
      $group: {
        _id: '$gender',
        count: { $sum: 1 },
        seatNumbers: { $push: '$transport.seatNumber' }
      }
    },
    {
      $project: {
        gender: '$_id',
        count: 1,
        seatNumbers: 1,
        _id: 0
      }
    }
  ]);
};

// Static method to find available seats in a route
studentDetails.statics.getAvailableSeats = async function (routeId, totalSeats) {
  const occupiedSeats = await this.distinct('transport.seatNumber', {
    'transport.routeId': routeId,
    'transport.status': 'active',
    'transport.seatNumber': { $exists: true, $ne: null }
  });

  // Generate all possible seat numbers (assuming A1, A2, A3, B1, B2, B3 format)
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  const seatsPerRow = 3;
  const allSeats = [];

  for (let row = 0; row < Math.ceil(totalSeats / seatsPerRow); row++) {
    for (let position = 1; position <= seatsPerRow; position++) {
      if (allSeats.length >= totalSeats) break;
      allSeats.push(`${rows[row]}${position}`);
    }
  }

  return allSeats.filter(seat => !occupiedSeats.includes(seat));
};

module.exports = mongoose.model("Student Detail", studentDetails);