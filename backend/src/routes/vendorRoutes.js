import express from "express";
import Vendor from "../models/Vendor.js";

const router = express.Router();

// GET /api/vendors
router.get("/", async (req, res) => {
  try {
    const vendors = await Vendor.find().sort({ createdAt: -1 });
    console.log("Returning vendors:", vendors.length);
    res.json(vendors);
  } catch (err) {
    console.error("Error fetching vendors:", err);
    res.status(500).json({ error: "Failed to fetch vendors" });
  }
});

// POST /api/vendors
router.post("/", async (req, res) => {
  try {
    console.log("Creating vendor from body:", req.body);
    const vendor = await Vendor.create(req.body);
    res.status(201).json(vendor);
  } catch (err) {
    console.error("Error creating vendor:", err);
    res.status(400).json({ error: "Failed to create vendor" });
  }
});

export default router;
