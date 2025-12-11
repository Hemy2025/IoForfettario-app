import { useMemo, useState } from "react";
import type { StoredUserProfile } from "./types/taxProfile";

const BACKEND_URL = "http://localhost:3001";

interface FiscalYearResult {
  year: number;
  redditoImponibileLordo: number;
  redditoImponibileNetto: number;
  contributiInpsFissi: number;
  contributiInpsPercentuali: number;
  contributiTotaliVersatiAnnoPrecedente: number;
  impostaSostitutivaLorda: number;
  saldoImpostaSostitutiva: number;
  primoAccontoImposta: number;
  secondoAccontoImposta: number;
  primoAccontoContributi: number;
  secondoAccontoContributi: number;
  importoRivalsaCassa?: number;
  creditoDaCompensare?: number;
  totaleF24Giugno: number;
  totaleF24Novembre: number;
  warnings: string[];
}

interface InvoiceRow {
  id: string;
  data: string;
  importo: number;
  accantonamentoSuggerito: number;
  residuo85kDopo: number;
  superaSoglia: boolean;
  nearSoglia: boolean;
}

interface InvoiceFormProps {
  profile: StoredUserProfile;
  year: number;
  contributiPrev: number;
  impostePrev: number;
  cciaa: number;
  onFatturatoUpdated?: (totale: number) => void;
}

function formatCurrency(value: number | undefined | null): string {
  if (value == null || isNaN(value)) return "0,00 €";
  return value.toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  });
}

function totalBurden(r: FiscalYearResult): number {
  return (
    r.impostaSostitutivaLorda +
    r.contributiInpsFissi +
    r.contributiInpsPercentuali +
    r.primoAccontoImposta +
    r.secondoAccontoImposta +
    r.primoAccontoContributi +
    r.secondoAccontoContributi
  );
}

export default function InvoiceForm({
  profile,
  year,
  contributiPrev,
  impostePrev,
  cciaa,
  onFatturatoUpdated,
}: InvoiceFormProps) {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [newDate, setNewDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  });
  const [newImporto, setNewImporto] = useState<number>(0);
  const [newNote, setNewNote] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fatturatoTotale = useMemo(
    () => invoices.reduce((sum, inv) => sum + inv.importo, 0),
    [invoices]
  );

  const residuoGlobale85k = 85000 - fatturatoTotale;
  const superaGlobale = residuoGlobale85k < 0;
  const nearGlobale =
    residuoGlobale85k >= 0 && residuoGlobale85k <= 5000 && fatturatoTotale > 0;

  const handleAddInvoice = async () => {
    setErrorMsg(null);

    if (!newImporto || newImporto <= 0) {
      setErrorMsg("Inserisci un importo fattura maggiore di zero.");
      return;
    }

    setLoading(true);

    try {
      const fatturatoPrima = fatturatoTotale;
      const fatturatoDopo = fatturatoPrima + newImporto;

      const baseBody = {
        profile,
        yearInput: {
          year,
          contributiVersatiPrecedente: contributiPrev,
          imposteVersatePrecedente: impostePrev,
          ccIAA: cciaa,
        },
      };

      // Calcolo "prima" della fattura
      const resBefore = await fetch(`${BACKEND_URL}/api/fiscal/year`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...baseBody,
          yearInput: {
            ...baseBody.yearInput,
            fatturato: fatturatoPrima,
          },
        }),
      });

      if (!resBefore.ok) {
        throw new Error(`Errore HTTP (prima): ${resBefore.status}`);
      }

      const dataBefore = (await resBefore.json()) as FiscalYearResult;

      // Calcolo "dopo" la fattura
      const resAfter = await fetch(`${BACKEND_URL}/api/fiscal/year`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...baseBody,
          yearInput: {
            ...baseBody.yearInput,
            fatturato: fatturatoDopo,
          },
        }),
      });

      if (!resAfter.ok) {
        throw new Error(`Errore HTTP (dopo): ${resAfter.status}`);
      }

      const dataAfter = (await resAfter.json()) as FiscalYearResult;

      const totalBefore = totalBurden(dataBefore);
      const totalAfter = totalBurden(dataAfter);

      const accantonamentoSuggerito = Math.max(0, totalAfter - totalBefore);

      const residuoDopo = 85000 - fatturatoDopo;
      const superaSoglia = residuoDopo < 0;
      const nearSoglia = residuoDopo >= 0 && residuoDopo <= 5000;

      const newInvoice: InvoiceRow = {
        id: `${Date.now()}`,
        data: newDate,
        importo: newImporto,
        accantonamentoSuggerito,
        residuo85kDopo: residuoDopo,
        superaSoglia,
        nearSoglia,
      };

      const updated = [...invoices, newInvoice];
      setInvoices(updated);

      if (onFatturatoUpdated) {
        onFatturatoUpdated(
          updated.reduce((sum, inv) => sum + inv.importo, 0)
        );
      }

      setNewImporto(0);
      setNewNote("");

    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        "Errore nel calcolo di accantonamento fattura. Verifica che il backend sia avviato sulla porta 3001."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 24, borderTop: "1px dashed #334155", paddingTop: 16 }}>
      <div className="card-title" style={{ fontSize: 15, marginBottom: 4 }}>
        Gestione fatture & accantonamenti
      </div>
      <div className="card-caption" style={{ marginBottom: 12 }}>
        Inserisci le fatture emesse nell&apos;anno. Il sistema suggerisce
        l&apos;accantonamento per ogni fattura e mostra il residuo verso la
        soglia degli 85.000 €.
      </div>

      {/* Form nuova fattura */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 12,
          marginBottom: 8,
        }}
      >
        <div className="form-field">
          <label className="form-label">Data fattura</label>
          <input
            type="date"
            className="form-input"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
          />
        </div>

        <div className="form-field">
          <label className="form-label">Importo imponibile (€)</label>
          <input
            type="number"
            className="form-input"
            value={newImporto || ""}
            onChange={(e) => setNewImporto(Number(e.target.value) || 0)}
          />
        </div>

        <div className="form-field">
          <label className="form-label">&nbsp;</label>
          <button
            type="button"
            className="primary-button"
            style={{ marginTop: 0 }}
            onClick={handleAddInvoice}
            disabled={loading}
          >
            {loading ? "Calcolo in corso…" : "Aggiungi fattura + accantonamento"}
          </button>
        </div>
      </div>

      {errorMsg && <div className="error-bar">{errorMsg}</div>}

      {/* Riepilogo globale */}
      <div style={{ marginTop: 12, marginBottom: 8, fontSize: 13 }}>
        <strong>Fatturato cumulato anno:</strong>{" "}
        {formatCurrency(fatturatoTotale)}{" "}
        <span style={{ marginLeft: 8 }}>
          • <strong>Residuo verso 85.000 €:</strong>{" "}
          {formatCurrency(residuoGlobale85k)}
        </span>
      </div>

      {superaGlobale && (
        <div className="alert-danger">
          Attenzione: con le fatture inserite hai SUPERATO la soglia di 85.000 €.
          Potresti uscire dal regime forfettario.
        </div>
      )}
      {!superaGlobale && nearGlobale && (
        <div className="alert-warning">
          Sei vicino alla soglia di 85.000 €. Valuta con attenzione le prossime
          fatture.
        </div>
      )}

      {/* Tabella fatture */}
      {invoices.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div
            style={{
              fontSize: 12,
              color: "#9ca3af",
              marginBottom: 6,
            }}
          >
            Fatture inserite ({invoices.length})
          </div>
          <div
            style={{
              maxHeight: 220,
              overflowY: "auto",
              borderRadius: 10,
              border: "1px solid #1f2937",
            }}
          >
            <table
              style={{
                width: "100%",
                fontSize: 12,
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: "#020617",
                    position: "sticky",
                    top: 0,
                  }}
                >
                  <th
                    style={{
                      textAlign: "left",
                      padding: "8px 10px",
                      borderBottom: "1px solid #1f2937",
                    }}
                  >
                    Data
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "8px 10px",
                      borderBottom: "1px solid #1f2937",
                    }}
                  >
                    Importo
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "8px 10px",
                      borderBottom: "1px solid #1f2937",
                    }}
                  >
                    Accantonamento
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "8px 10px",
                      borderBottom: "1px solid #1f2937",
                    }}
                  >
                    Residuo 85k
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td style={{ padding: "7px 10px" }}>{inv.data}</td>
                    <td
                      style={{
                        padding: "7px 10px",
                        textAlign: "right",
                      }}
                    >
                      {formatCurrency(inv.importo)}
                    </td>
                    <td
                      style={{
                        padding: "7px 10px",
                        textAlign: "right",
                      }}
                    >
                      {formatCurrency(inv.accantonamentoSuggerito)}
                    </td>
                    <td
                      style={{
                        padding: "7px 10px",
                        textAlign: "right",
                        color: inv.superaSoglia
                          ? "#fecaca"
                          : inv.nearSoglia
                          ? "#facc15"
                          : "#9ca3af",
                      }}
                    >
                      {formatCurrency(inv.residuo85kDopo)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}