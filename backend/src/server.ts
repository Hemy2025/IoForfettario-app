// backend/src/server.ts
// Server HTTP principale IoForfettario (mock integrazioni + motore fiscale)

import express from "express";
import cors from "cors";

import { taxRouter } from "./api/taxRoutes";
import { bankMockRouter } from "./api/mockBank";
import { fattureMockRouter } from "./api/mockFatture";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "ioforfettario-backend" });
});

// Routes
app.use("/api/tax", taxRouter);
app.use("/api/bank", bankMockRouter);
app.use("/api/fatture", fattureMockRouter);

// Porta server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`IoForfettario backend mock running on port ${PORT}`);
});