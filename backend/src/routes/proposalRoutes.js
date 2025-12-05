import express from "express";
import Proposal from "../models/Proposal.js";
import Vendor from "../models/Vendor.js";
import { sendRfpEmailToVendor } from "../services/mailerService.js";
import Rfp from "../models/RFP.js";
import {
  ollamaExtractProposal,
  ollamaScoreProposals,
} from "../services/ollamaService.js";

const router = express.Router();

// Simple heuristic score (fallback if Ollama scoring fails) 
function fallbackComputeScore(proposal, rfp) {
  const price = proposal.price ?? null;
  const days = proposal.deliveryDays ?? null;
  const warranty = proposal.warrantyMonths ?? null;

  let score = 0;
  let weightTotal = 0;

  if (price != null) {
    const targetBudget = rfp?.structured?.budget || price;
    const ratio = targetBudget / price;
    const priceScore = Math.max(0, Math.min(1.5, ratio));
    score += priceScore * 40;
    weightTotal += 40;
  }

  if (days != null) {
    const targetDays = rfp?.structured?.deliveryTimelineDays || days;
    const ratio = targetDays / days;
    const deliveryScore = Math.max(0, Math.min(1.5, ratio));
    score += deliveryScore * 35;
    weightTotal += 35;
  }

  if (warranty != null) {
    const targetWarranty = rfp?.structured?.warrantyMonths || warranty;
    const ratio = warranty / targetWarranty;
    const warrantyScore = Math.max(0, Math.min(1.5, ratio));
    score += warrantyScore * 25;
    weightTotal += 25;
  }

  if (!weightTotal) return 0;
  return Number(((score / weightTotal) * 10).toFixed(1)); // 0–10
}

router.post("/send", async (req, res) => {
  try {
    const { rfpId, vendorIds } = req.body;
    if (!rfpId) {
      return res.status(400).json({ error: "rfpId is required" });
    }

    const rfp = await Rfp.findById(rfpId);
    if (!rfp) {
      return res.status(404).json({ error: "RFP not found" });
    }

    let vendors;

    // If vendorIds provided, send only to those
    if (Array.isArray(vendorIds) && vendorIds.length > 0) {
      vendors = await Vendor.find({ _id: { $in: vendorIds } });
    } else {
      // fallback: all vendors
      vendors = await Vendor.find();
    }

    if (!vendors.length) {
      return res.status(400).json({ error: "No vendors to send to" });
    }

    const results = await Promise.allSettled(
      vendors.map(async (v) => {
        // 1) Create Proposal record
        const proposal = await Proposal.create({
          rfpId,
          vendorId: v._id,
          status: "sent",
        });

        // 2) Try to send email
        try {
          await sendRfpEmailToVendor({ vendor: v, rfp });
          return {
            vendorId: v._id,
            email: v.email,
            ok: true,
            proposalId: proposal._id,
          };
        } catch (emailErr) {
          console.error(
            `Failed to send RFP email to ${v.email}:`,
            emailErr.message
          );
          return {
            vendorId: v._id,
            email: v.email,
            ok: false,
            error: emailErr.message,
            proposalId: proposal._id,
          };
        }
      })
    );

    const flatResults = results.map((r) =>
      r.status === "fulfilled" ? r.value : { ok: false, error: "Unknown" }
    );
    const sent = flatResults.filter((r) => r.ok).length;
    const failed = flatResults.length - sent;

    res.status(201).json({
      sent,
      failed,
      results: flatResults,
    });
  } catch (err) {
    console.error("Error sending RFP:", err);
    res.status(500).json({ error: "Failed to send RFP to vendors" });
  }
});

router.get("/", async (req, res) => {
  try {
    const { rfpId } = req.query;
    const filter = rfpId ? { rfpId } : {};
    const proposals = await Proposal.find(filter)
      .populate("vendorId")
      .sort({ createdAt: -1 });

    res.json(proposals);
  } catch (err) {
    console.error("Error fetching proposals:", err);
    res.status(500).json({ error: "Failed to fetch proposals" });
  }
});

router.patch("/:id/respond", async (req, res) => {
  try {
    const { responseText } = req.body;
    const proposal = await Proposal.findById(req.params.id).populate("vendorId");
    if (!proposal) return res.status(404).json({ error: "Proposal not found" });

    let extracted = {};
    try {
      extracted = await ollamaExtractProposal(responseText);
      console.log("Ollama proposal extracted:", extracted);
    } catch (aiErr) {
      console.error("Ollama proposal extraction failed:", aiErr);
      extracted = {};
    }

    // Regex patch for missing fields
    const text = responseText.toLowerCase();

    // Price
    if (extracted.price == null) {
      const priceMatch = responseText.match(/([$₹]|inr|rs\.?)\s?([\d,]+)/i);
      if (priceMatch) {
        extracted.price = Number(priceMatch[2].replace(/,/g, ""));
      }
    }

    // Delivery days
    if (extracted.deliveryDays == null) {
      const delMatch = text.match(/(\d+)\s*(day|days)/i);
      if (delMatch) extracted.deliveryDays = Number(delMatch[1]);
    }

    // Warranty months
    if (extracted.warrantyMonths == null) {
      const wYearMatch = text.match(/(\d+)\s*(year|years)\s*warranty/);
      const wMonthMatch = text.match(/(\d+)\s*months?\s*warranty/);
      if (wMonthMatch) {
        extracted.warrantyMonths = Number(wMonthMatch[1]);
      } else if (wYearMatch) {
        extracted.warrantyMonths = Number(wYearMatch[1]) * 12;
      }
    }

    // Payment terms
    if (!extracted.paymentTerms) {
      const payMatch = responseText.match(/net\s*\d+/i);
      if (payMatch) {
        extracted.paymentTerms = payMatch[0];
      }
    }

    // Notes
    if (!extracted.notes) {
      extracted.notes = responseText;
    }

    const updated = await Proposal.findByIdAndUpdate(
      req.params.id,
      {
        price: extracted.price ?? null,
        deliveryDays: extracted.deliveryDays ?? null,
        warrantyMonths: extracted.warrantyMonths ?? null,
        paymentTerms: extracted.paymentTerms ?? "",
        notes: extracted.notes ?? responseText,
        status: "responded",
      },
      { new: true }
    ).populate("vendorId");

    res.json(updated);
  } catch (err) {
    console.error("Error responding:", err);
    res.status(500).json({ error: "Failed to record response" });
  }
});

router.get("/compare", async (req, res) => {
  try {
    const { rfpId } = req.query;
    if (!rfpId) {
      return res.status(400).json({ error: "rfpId is required" });
    }

    const rfp = await Rfp.findById(rfpId);
    if (!rfp) return res.status(404).json({ error: "RFP not found" });

    const proposals = await Proposal.find({
      rfpId,
      status: "responded",
    }).populate("vendorId");

    if (!proposals.length) {
      return res.json({
        rfp,
        proposals: [],
        source: "none",
      });
    }

    let scoredMap = new Map();
    let source = "ollama";

    try {
      const aiResult = await ollamaScoreProposals(rfp, proposals);
      const scoresArr = aiResult?.scores || [];

      for (const s of scoresArr) {
        scoredMap.set(s.proposalId, {
          score: s.score,
          isRecommended: !!s.isRecommended,
          reason: s.reason || "",
        });
      }

      if (!scoresArr.length) {
        throw new Error("Empty scores from Ollama");
      }
    } catch (aiErr) {
      console.error("Ollama scoring failed, using fallback:", aiErr);
      source = "fallback";

      proposals.forEach((p) => {
        const score = fallbackComputeScore(p, rfp);
        scoredMap.set(p._id.toString(), {
          score,
          isRecommended: false,
          reason: "Score computed using heuristic fallback.",
        });
      });

      let bestId = null;
      let bestScore = -Infinity;
      for (const [id, data] of scoredMap.entries()) {
        if (data.score > bestScore) {
          bestScore = data.score;
          bestId = id;
        }
      }
      if (bestId) {
        scoredMap.get(bestId).isRecommended = true;
      }
    }

    const enriched = proposals
      .map((p) => {
        const extra = scoredMap.get(p._id.toString()) || {
          score: 0,
          isRecommended: false,
          reason: "",
        };
        return {
          ...p.toObject(),
          score: extra.score,
          isRecommended: extra.isRecommended,
          aiReason: extra.reason,
        };
      })
      .sort((a, b) => b.score - a.score);

    res.json({
      rfp,
      proposals: enriched,
      source,
    });
  } catch (err) {
    console.error("Error in comparison:", err);
    res.status(500).json({ error: "Failed to compare proposals" });
  }
});

export default router;
