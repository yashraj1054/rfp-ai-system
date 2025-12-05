import mongoose from "mongoose";

const proposalSchema = new mongoose.Schema(
  {
    rfpId: { type: mongoose.Schema.Types.ObjectId, ref: "Rfp", required: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
    status: {
      type: String,
      enum: ["sent", "responded"],
      default: "sent",
    },
    price: Number,
    deliveryDays: Number,
    notes: String,
    warrantyMonths:  Number,
    paymentTerms: String,

  },
  { timestamps: true }
);

export default mongoose.model("Proposal", proposalSchema);
