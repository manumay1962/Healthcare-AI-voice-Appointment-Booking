const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, default: "", trim: true },
    password: { type: String, required: true },
    avatar: { type: String, default: "U" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
