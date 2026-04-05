const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({
  groupAddress: { type: String, required: true },
  groupName: { type: String, required: true },
  reporterAddress: { type: String, required: true },
  reporterName: { type: String, required: true },
  defaulterAddress: { type: String, required: true },
  defaulterName: { type: String, required: true },
  complaintText: { type: String, required: true },
  cycle: { type: Number, required: true },
  status: { type: String, enum: ["pending", "reviewed", "resolved"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Complaint", complaintSchema);
