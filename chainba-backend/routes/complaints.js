const express = require("express");
const router = express.Router();
const Complaint = require("../models/Complaint");
const { authMiddleware } = require("../middleware/auth");

// Submit a new complaint (leader only)
router.post("/complaints", authMiddleware, async (req, res) => {
  try {
    const {
      groupAddress,
      groupName,
      reporterAddress,
      reporterName,
      defaulterAddress,
      defaulterName,
      complaintText,
      cycle
    } = req.body;

    // Validate required fields
    if (!groupAddress || !reporterAddress || !defaulterAddress || !complaintText) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Create new complaint
    const complaint = new Complaint({
      groupAddress,
      groupName: groupName || "Unknown Group",
      reporterAddress,
      reporterName: reporterName || "Unknown",
      defaulterAddress,
      defaulterName: defaulterName || "Unknown",
      complaintText,
      cycle: cycle || 0,
      status: "pending"
    });

    await complaint.save();
    res.json({ message: "Complaint submitted successfully", complaint });
  } catch (error) {
    console.error("Error submitting complaint:", error);
    res.status(500).json({ error: "Failed to submit complaint" });
  }
});

// Get all complaints (admin only - for future use)
router.get("/complaints", authMiddleware, async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).json({ error: "Failed to fetch complaints" });
  }
});

// Get complaints for a specific group
router.get("/complaints/:groupAddress", authMiddleware, async (req, res) => {
  try {
    const { groupAddress } = req.params;
    const complaints = await Complaint.find({ groupAddress }).sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    console.error("Error fetching group complaints:", error);
    res.status(500).json({ error: "Failed to fetch complaints" });
  }
});

module.exports = router;
