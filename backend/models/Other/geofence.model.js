const mongoose = require("mongoose");

const geofenceSchema = new mongoose.Schema(
  {
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    radius: {
      type: Number,
      required: true,
      default: 100, // radius in meters
    },
    name: {
      type: String,
      default: "College Campus",
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: String, // Admin username/ID
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Geofence", geofenceSchema);
