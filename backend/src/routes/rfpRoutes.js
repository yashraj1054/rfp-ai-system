import express from "express";
import Rfp from "../models/RFP.js";
import { ollamaExtractRfp } from "../services/ollamaService.js";

const router = express.Router();

function basicParseRfp(naturalText) {
  const text = naturalText.toLowerCase();
  const budgetMatch = naturalText.match(/([$₹]|inr|rs\.?)\s?([\d,]+)/i);
  const budget = budgetMatch ? Number(budgetMatch[2].replace(/,/g, "")) : null;
  const deliveryMatch = text.match(/(\d+)\s*(day|days)/i);
  const deliveryTimelineDays = deliveryMatch
    ? Number(deliveryMatch[1])
    : null;

  let warrantyMonths = null;
  const warrantyYearMatch = text.match(/(\d+)\s*(year|years)\s*warranty/);
  const warrantyMonthMatch = text.match(/(\d+)\s*months?\s*warranty/);
  if (warrantyMonthMatch) warrantyMonths = Number(warrantyMonthMatch[1]);
  else if (warrantyYearMatch) warrantyMonths = Number(warrantyYearMatch[1]) * 12;

  const paymentTermsMatch = naturalText.match(/net\s*\d+/i);
  const paymentTerms = paymentTermsMatch ? paymentTermsMatch[0] : "";

  const title =
    "RFP - " +
    naturalText.slice(0, 40) +
    (naturalText.length > 40 ? "..." : "");
  const itemsText = naturalText.slice(0, 140);

  return {
    title,
    budget,
    deliveryTimelineDays,
    warrantyMonths,
    paymentTerms,
    items: [
      {
        name: "Scope described in text",
        quantity: null,
        specs: itemsText,
      },
    ],
    otherRequirements: "",
  };
}

// GET /api/rfps
router.get("/", async (req, res) => {
  const rfps = await Rfp.find().sort({ createdAt: -1 });
  res.json(rfps);
});

// GET /api/rfps/:id
router.get("/:id", async (req, res) => {
  const rfp = await Rfp.findById(req.params.id);
  if (!rfp) return res.status(404).json({ error: "RFP not found" });
  res.json(rfp);
});



// POST /api/rfps  – create from natural language using Ollama (with fallback)
router.post("/", async (req, res) => {
  try {
    const { naturalLanguageDescription } = req.body;
    if (!naturalLanguageDescription) {
      return res
        .status(400)
        .json({ error: "naturalLanguageDescription is required" });
    }

    let structured;
    try {
      structured = await ollamaExtractRfp(naturalLanguageDescription);
      console.log("Ollama RFP structured:", structured);
    } catch (aiErr) {
      console.error("Ollama RFP extraction failed, falling back:", aiErr);
      structured = basicParseRfp(naturalLanguageDescription);
    }

    const rfp = await Rfp.create({
      title: structured.title || "Untitled RFP",
      naturalLanguageDescription,
      structured,
    });

    res.status(201).json(rfp);
  } catch (err) {
    console.error("Error creating RFP:", err);
    res.status(500).json({ error: "Failed to create RFP" });
  }
});


// PUT /api/rfps/:id  (save edits from frontend)
router.put("/:id", async (req, res) => {
  try {
    const rfp = await Rfp.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!rfp) return res.status(404).json({ error: "RFP not found" });
    res.json(rfp);
  } catch (err) {
    console.error("Error updating RFP:", err);
    res.status(500).json({ error: "Failed to update RFP" });
  }
});

export default router;
