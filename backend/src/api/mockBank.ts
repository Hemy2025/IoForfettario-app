// backend/src/api/mockBank.ts
import express, { Application, Request, Response } from "express";

export function registerMockBankRoutes(app: Application) {
  const router = express.Router();

  // Lista conti fittizi
  router.get("/accounts", (_req: Request, res: Response) => {
    res.json([
      {
        id: "ACC-1",
        iban: "IT00Z0123412345123456789012",
        name: "Conto principale IoForfettario",
        balance: 12345.67,
        currency: "EUR",
      },
    ]);
  });

  // Movimenti fittizi
  router.get(
    "/accounts/:id/transactions",
    (req: Request, res: Response) => {
      const { id } = req.params;
      res.json({
        accountId: id,
        transactions: [
          {
            id: "TX-1",
            date: "2025-06-16",
            description: "Incasso fattura 001",
            amount: 1200,
          },
          {
            id: "TX-2",
            date: "2025-06-20",
            description: "Pagamento F24",
            amount: -850,
          },
        ],
      });
    }
  );

  app.use("/api/mock/bank", router);
}