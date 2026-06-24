const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patientName: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    reason: { type: String, default: "General Consultation" },
    doctor: { type: String, default: "Dr. Smith" },
    status: {
      type: String,
      enum: ["confirmed", "pending", "cancelled"],
      default: "confirmed",
    },
    source: {
      type: String,
      enum: ["manual", "dashboard", "bolna-voice-agent"],
      default: "manual",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Appointment", appointmentSchema);
