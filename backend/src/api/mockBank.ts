// backend/src/api/mockBank.ts
// Mock API per integrazione PSD2 (simile a Fabrick)

import { Router, Request, Response } from "express";

export const bankMockRouter = Router();

// Mock conti correnti
const accounts = [
  {
    id: "acc_1",
    iban: "IT60X0542811101000000123456",
    name: "Conto Corrente Professionista",
    bankName: "MockBank IoForfettario",
    currency: "EUR",
    balance: 12540.55,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "acc_2",
    iban: "IT10X0542811101000000654321",
    name: "Conto Accantonamenti F24",
    bankName: "MockBank IoForfettario",
    currency: "EUR",
    balance: 8430.0,
    updatedAt: new Date().toISOString(),
  },
];

// Mock movimenti
const transactions: Record<string, any[]> = {
  acc_1: [
    {
      id: "tx_1",
      date: "2025-03-03",
      valueDate: "2025-03-03",
      amount: 2500.0,
      currency: "EUR",
      description: "Pagamento cliente - Fattura 1/2025",
      direction: "CREDIT",
      category: "ENTRATA_FATTURA",
      balanceAfter: 12000.0,
    },
    {
      id: "tx_2",
      date: "2025-03-05",
      valueDate: "2025-03-05",
      amount: -1200.0,
      currency: "EUR",
      description: "Affitto studio",
      direction: "DEBIT",
      category: "COSTI",
      balanceAfter: 10800.0,
    },
  ],
  acc_2: [
    {
      id: "tx_3",
      date: "2025-03-01",
      valueDate: "2025-03-01",
      amount: 600.0,
      currency: "EUR",
      description: "Accantonamento automatico imposte",
      direction: "CREDIT",
      category: "ACCANTONAMENTO",
      balanceAfter: 8400.0,
    },
  ],
};

// GET /api/bank/accounts
bankMockRouter.get("/accounts", (_req: Request, res: Response) => {
  res.json({ accounts });
});

// GET /api/bank/accounts/:accountId/transactions
bankMockRouter.get(
  "/accounts/:accountId/transactions",
  (req: Request, res: Response) => {
    const { accountId } = req.params;

    if (!transactions[accountId]) {
      return res.json({ accountId, transactions: [] });
    }

    return res.json({
      accountId,
      transactions: transactions[accountId],
    });
  }
);