const express = require("express");
const router = express.Router();
const Complaint = require("../models/Complaint");
const authMiddleware = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");

const str = (v) => (typeof v === "string" ? v.trim() : "");
const isAddress = (v) => /^0x[a-fA-F0-9]{40}$/.test(str(v));

// Submit a new complaint (any authenticated user; the on-chain action is the
// real authority — this just stores a record).
router.post("/complaints", authMiddleware, async (req, res) => {
  try {
    const { groupAddress, groupName, reporterAddress, reporterName,
      defaulterAddress, defaulterName, complaintText, cycle } = req.body;

    // Validate required fields + types (prevents injection / malformed records)
    if (!isAddress(groupAddress) || !isAddress(reporterAddress) || !isAddress(defaulterAddress)) {
      return res.status(400).json({ error: "Invalid or missing address fields" });
    }
    const text = str(complaintText);
    if (!text) return res.status(400).json({ error: "Complaint text is required" });
    if (text.length > 2000) return res.status(400).json({ error: "Complaint text too long" });

    const cycleNum = Number(cycle);

    const complaint = new Complaint({
      groupAddress: str(groupAddress),
      groupName: str(groupName).slice(0, 200) || "Unknown Group",
      reporterAddress: str(reporterAddress),
      reporterName: str(reporterName).slice(0, 200) || "Unknown",
      defaulterAddress: str(defaulterAddress),
      defaulterName: str(defaulterName).slice(0, 200) || "Unknown",
      complaintText: text,
      cycle: Number.isFinite(cycleNum) ? cycleNum : 0,
      status: "pending"
    });

    await complaint.save();
    res.json({ message: "Complaint submitted successfully", complaint });
  } catch (error) {
    console.error("Error submitting complaint:", error);
    res.status(500).json({ error: "Failed to submit complaint" });
  }
});

// Get ALL complaints — admin only (contains personal data across all groups).
router.get("/complaints", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).json({ error: "Failed to fetch complaints" });
  }
});

// Get complaints for a specific group (authenticated users).
router.get("/complaints/:groupAddress", authMiddleware, async (req, res) => {
  try {
    const { groupAddress } = req.params;
    if (!isAddress(groupAddress)) {
      return res.status(400).json({ error: "Invalid group address" });
    }
    const complaints = await Complaint.find({ groupAddress }).sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    console.error("Error fetching group complaints:", error);
    res.status(500).json({ error: "Failed to fetch complaints" });
  }
});

module.exports = router;
