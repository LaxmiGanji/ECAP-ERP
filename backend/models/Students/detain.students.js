const mongoose = require("mongoose");

const detainStudentsSchema = new mongoose.Schema({
  originalStudentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student Detail",
    required: true
  },
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
    required: false,
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
  }],
  detentionDate: {
    type: Date,
    default: Date.now
  },
  detainedBy: {
    type: String,
    trim: true
  },
  detentionReason: {
    type: String,
    trim: true,
    default: "Student detained"
  }
}, { timestamps: true });

// Indexes for faster queries
detainStudentsSchema.index({ enrollmentNo: 1 });
detainStudentsSchema.index({ branch: 1, semester: 1, batch: 1 });
detainStudentsSchema.index({ detentionDate: -1 });

// Virtual for full name
detainStudentsSchema.virtual('fullName').get(function() {
  return `${this.firstName || ''} ${this.middleName || ''} ${this.lastName || ''}`.trim();
});

module.exports = mongoose.model("Detain Student", detainStudentsSchema);