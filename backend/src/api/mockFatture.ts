// backend/src/api/mockFatture.ts
// Mock API per simulare l'invio e gestione di una fattura elettronica (simile Aruba)

import { Router, Request, Response } from "express";
import { randomUUID } from "crypto";

export const fattureMockRouter = Router();

interface FatturaMock {
  id: string;
  numero: string;
  data: string;
  cliente: any;
  imponibile: number;
  iva: number;
  totale: number;
  status: string;
  pdfUrl: string;
  createdAt: string;
  lastUpdate: string;
}

const store = new Map<string, FatturaMock>();

// POST /api/fatture/invia
fattureMockRouter.post("/invia", (req: Request, res: Response) => {
  try {
    const { numero, data, cliente, imponibile, iva, totale } = req.body;

    if (!numero || !data || !cliente || !imponibile || !totale) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    const fattura: FatturaMock = {
      id,
      numero,
      data,
      cliente,
      imponibile,
      iva: iva ?? 0,
      totale,
      status: "INVIATA",
      createdAt: now,
      lastUpdate: now,
      pdfUrl: `https://mock.ioforfettario/fatture/${id}.pdf`,
    };

    store.set(id, fattura);

    return res.status(201).json({
      id,
      status: fattura.status,
      pdfUrl: fattura.pdfUrl,
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/fatture/:id
fattureMockRouter.get("/:id", (req: Request, res: Response) => {
  const fattura = store.get(req.params.id);

  if (!fattura) {
    return res.status(404).json({ error: "Fattura non trovata" });
  }

  return res.json(fattura);
});