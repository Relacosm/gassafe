// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// API routes
app.use("/api", require("./backend/routes/api"));

// Serve React frontend in production
app.use(express.static(path.join(__dirname, "frontend/dist")));
app.get("/{*path}", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend/dist/index.html"));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 GasSafe Server running on http://localhost:${PORT}`);
  console.log(`📋 AAEP Protocol v1.0 active`);
  console.log(`🔗 Chain: ${process.env.SEPOLIA_RPC_URL ? "Sepolia testnet" : "MOCK mode"}`);
  console.log(`📊 Admin audit: http://localhost:${PORT}/api/audit`);
});
