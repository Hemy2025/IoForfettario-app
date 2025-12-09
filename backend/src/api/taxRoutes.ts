// backend/src/api/taxRoutes.ts
// Rotte REST del motore fiscale (regime forfettario)

import { Router, Request, Response } from "express";
import {
  computeFiscalYear,
  computeMultiYear,
  type UserTaxProfile,
  type FiscalYearInput,
  type MultiYearInput,
} from "../rules/taxRules";

export const taxRouter = Router();

// Calcolo singolo anno
taxRouter.post("/calc-year", (req: Request, res: Response) => {
  try {
    const { profile, yearInput } = req.body as {
      profile: UserTaxProfile;
      yearInput: FiscalYearInput;
    };

    if (!profile || !yearInput) {
      return res.status(400).json({
        error: "Missing 'profile' or 'yearInput'.",
      });
    }

    const result = computeFiscalYear(profile, yearInput);
    return res.json({ result });
  } catch (err) {
    console.error("Error in /api/tax/calc-year:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Calcolo multi-anno
taxRouter.post("/calc-multi-year", (req: Request, res: Response) => {
  try {
    const { input } = req.body as { input: MultiYearInput };

    if (!input) {
      return res.status(400).json({ error: "Missing 'input'." });
    }

    const result = computeMultiYear(input);
    return res.json({ result });
  } catch (err) {
    console.error("Error in /api/tax/calc-multi-year:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});