import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    company: String,
  },
  { timestamps: true }
);

export default mongoose.model("Vendor", vendorSchema);
