const mongoose = require("mongoose");

const complainSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },

  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },

  phone: {
    type: String,
    trim: true,
  },

  category: {
    type: String,
    enum: ["Product Issue", "Delivery Delay", "Service Quality", "Suggestion", "Other"],
    default: "Other",
  },

  message: {
    type: String,
    required: true,
    trim: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Complain = mongoose.model("Complaint", complainSchema);

module.exports = Complain;
