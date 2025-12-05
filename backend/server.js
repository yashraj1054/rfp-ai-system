import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

import rfpRoutes from "./src/routes/rfpRoutes.js";
import vendorRoutes from "./src/routes/vendorRoutes.js";
import proposalRoutes from "./src/routes/proposalRoutes.js";

dotenv.config();

const app = express();

// CORS Middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

app.use(express.json());

// Logging Middleware
app.use((req, res, next) => {
  console.log(req.method, req.path);
  next();
});

// Routes
app.use("/api/rfps", rfpRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/proposals", proposalRoutes);

app.get("/", (req, res) => {
  res.send("RFP AI Backend running");
});

const PORT = process.env.PORT || 5001;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log("Server running on port", PORT));
  })
  .catch((err) => console.error("MongoDB error:", err));
