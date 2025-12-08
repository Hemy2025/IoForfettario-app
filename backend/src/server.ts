// backend/src/server.ts
// Server HTTP per esporre il motore forfettario via API REST

import express, { Request, Response } from "express";
import cors from "cors";
import {
  computeFiscalYear,
  computeMultiYear,
  type UserTaxProfile,
  type FiscalYearInput,
  type MultiYearInput,
} from "./rules/taxRules";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

/**
 * Endpoint di health-check
 * GET /health
 */
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "IoForfettario-tax-engine" });
});

/**
 * POST /api/forfettario/year
 *
 * Calcola un singolo anno fiscale nel regime forfettario.
 *
 * Body JSON atteso:
 * {
 *   "profile": {
 *     "category": "PROFESSIONISTA" | "ARTIGIANO" | "COMMERCIANTE",
 *     "previdenza": "GESTIONE_SEPARATA" | "ARTIGIANI_COMMERCIANTI" | "CASSA_PROFESSIONALE",
 *     "hasCassaProfessionale": boolean,
 *     "cassaAliquotaRivalsa": number, // es. 0.04 (opzionale)
 *     "aliquotaImpostaSostitutiva": number // 0.05 oppure 0.15
 *   },
 *   "input": {
 *     "year": 2025,
 *     "fatturato": 60000,
 *     "contributiVersatiPrecedente": 0,
 *     "imposteVersatePrecedente": 0,
 *     "ccIAA": 60,
 *     "rivalsaCassaTotale": 0 // opzionale
 *   }
 * }
 */
app.post("/api/forfettario/year", (req: Request, res: Response) => {
  try {
    const body = req.body as {
      profile: UserTaxProfile;
      input: FiscalYearInput;
    };

    if (!body || !body.profile || !body.input) {
      return res.status(400).json({
        error: "Missing 'profile' or 'input' in request body",
      });
    }

    const result = computeFiscalYear(body.profile, body.input);
    return res.json(result);
  } catch (err: any) {
    console.error("Error in /api/forfettario/year:", err);
    return res.status(500).json({
      error: "Internal server error",
      details: err?.message ?? String(err),
    });
  }
});

/**
 * POST /api/forfettario/multiyear
 *
 * Calcolo multi-anno (Anno 0, 1, 2, ...) con propagazione automatica.
 *
 * Body JSON atteso:
 * {
 *   "profile": { ...come sopra... },
 *   "anni": [
 *     { "year": 2025, "fatturato": 60000 },
 *     { "year": 2026, "fatturato": 65000 }
 *   ],
 *   "ccIAA": 60
 * }
 */
app.post("/api/forfettario/multiyear", (req: Request, res: Response) => {
  try {
    const body = req.body as MultiYearInput;

    if (!body || !body.profile || !body.anni || body.anni.length === 0) {
      return res.status(400).json({
        error:
          "Invalid body. Required: { profile, anni: [ { year, fatturato } ], ccIAA }",
      });
    }

    const result = computeMultiYear(body);
    return res.json(result);
  } catch (err: any) {
    console.error("Error in /api/forfettario/multiyear:", err);
    return res.status(500).json({
      error: "Internal server error",
      details: err?.message ?? String(err),
    });
  }
});

// Avvio del server
export function startServer() {
  app.listen(PORT, () => {
    console.log(`IoForfettario tax engine listening on port ${PORT}`);
  });
}

// Se il file viene eseguito direttamente (node dist/server.js)
if (require.main === module) {
  startServer();
}
