// backend/src/api/taxRoutes.ts
import express, { Application, Request, Response } from "express";
import {
  computeMultiYear,
  type MultiYearInput,
  TAX_CONFIG,
  type UserTaxProfile,
} from "../rules/taxRules";

export function registerTaxRoutes(app: Application) {
  const router = express.Router();

  // Config fiscale di base (utile anche per la UI)
  router.get("/config", (_req: Request, res: Response) => {
    res.json(TAX_CONFIG);
  });

  // Calcolo fiscale multi-anno
  const computeHandler = (req: Request, res: Response) => {
    try {
      const body = req.body as {
        profile: UserTaxProfile;
        ccIAA?: number;
        anni: Array<{ year: number; fatturato: number }>;
      };

      if (!body || !body.profile || !body.anni) {
        return res.status(400).json({
          error: "Dati mancanti per il calcolo (profile, anni).",
        });
      }

      const input: MultiYearInput = {
        profile: body.profile,
        ccIAA: body.ccIAA ?? 60,
        anni: body.anni,
      };

      const result = computeMultiYear(input);
      res.json(result);
    } catch (err) {
      console.error("Errore /api/tax/compute:", err);
      res.status(500).json({ error: "Errore interno nel calcolo fiscale." });
    }
  };

  router.post("/compute", computeHandler);
  router.post("/calc", computeHandler); // alias, nel dubbio

  app.use("/api/tax", router);
}