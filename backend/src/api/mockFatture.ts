// backend/src/api/mockFatture.ts
import express, { Application, Request, Response } from "express";

export function registerMockFattureRoutes(app: Application) {
  const router = express.Router();

  // Fatture fittizie per anno
  router.get("/year/:year", (req: Request, res: Response) => {
    const year = Number(req.params.year) || new Date().getFullYear();

    res.json({
      year,
      fatture: [
        {
          numero: "1",
          data: `${year}-01-15`,
          imponibile: 1000,
          descrizione: "Consulenza gennaio",
        },
        {
          numero: "2",
          data: `${year}-02-10`,
          imponibile: 1500,
          descrizione: "Consulenza febbraio",
        },
      ],
    });
  });

  app.use("/api/mock/fatture", router);
}