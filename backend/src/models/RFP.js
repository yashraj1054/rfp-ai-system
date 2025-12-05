import mongoose from "mongoose";

const rfpSchema = new mongoose.Schema(
  {
    title: String,
    naturalLanguageDescription: { type: String, required: true },
    structured: {
      budget: Number,
      deliveryTimelineDays: Number,
      items: [
        {
          name: String,
          quantity: Number,
          specs: String,
        },
      ],
      paymentTerms: String,
      warrantyMonths: Number,
      otherRequirements: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Rfp", rfpSchema);
