import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

import {
  computeFiscalYear,
  computeAccantonamentoPerFattura,
  type UserTaxProfile,
  type FiscalYearInput,
  type YearTaxContext,
} from "./rules/taxRules";

const app = express();

app.use(cors());
app.use(bodyParser.json());

/**
 * Health check usato dal Dev Check nel frontend
 */
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "ioforfettario-backend",
  });
});

/**
 * Calcolo annuo – usa computeFiscalYear del motore a regole
 *
 * BODY:
 * {
 *   profile: UserTaxProfile;
 *   yearInput: FiscalYearInput;
 * }
 */
app.post("/api/calc/annual", (req, res) => {
  try {
    const { profile, yearInput } = req.body || {};

    if (!profile || !yearInput) {
      return res
        .status(400)
        .json({ error: "Missing 'profile' or 'yearInput' in request body" });
    }

    const result = computeFiscalYear(
      profile as UserTaxProfile,
      yearInput as FiscalYearInput
    );

    return res.json({ result });
  } catch (err) {
    console.error("Error in /api/calc/annual:", err);
    return res
      .status(500)
      .json({ error: "Internal error while computing annual taxes" });
  }
});

/**
 * Calcolo accantonamento per singola fattura – usa computeAccantonamentoPerFattura
 *
 * BODY:
 * {
 *   context: YearTaxContext;
 *   importoFattura: number;
 * }
 *
 * Il context viene costruito dal frontend a partire da:
 *  - profilo fiscale
 *  - input anno fiscale
 *  - fatturato cumulato anno (YTD) prima della fattura
 */
app.post("/api/calc/invoice", (req, res) => {
  try {
    const { context, importoFattura } = req.body || {};

    if (!context || typeof importoFattura !== "number") {
      return res.status(400).json({
        error: "Missing 'context' or 'importoFattura' in request body",
      });
    }

    const result = computeAccantonamentoPerFattura(
      context as YearTaxContext,
      importoFattura
    );

    return res.json({ result });
  } catch (err) {
    console.error("Error in /api/calc/invoice:", err);
    return res
      .status(500)
      .json({ error: "Internal error while computing invoice saving" });
  }
});

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`IoForfettario backend mock running on port ${PORT}`);
});