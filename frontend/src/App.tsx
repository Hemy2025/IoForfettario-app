import { useState } from "react";

type ForfettarioCategory = "PROFESSIONISTA" | "ARTIGIANO" | "COMMERCIANTE";

type PrevidenzaTipo =
  | "GESTIONE_SEPARATA"
  | "ARTIGIANI_COMMERCIANTI"
  | "CASSA_PROFESSIONALE";

interface UserTaxProfile {
  category: ForfettarioCategory;
  previdenza: PrevidenzaTipo;
  hasCassaProfessionale: boolean;
  cassaAliquotaRivalsa?: number;
  aliquotaImpostaSostitutiva: number;
}

interface FiscalYearInput {
  year: number;
  fatturato: number;
  contributiVersatiPrecedente: number;
  imposteVersatePrecedente: number;
  ccIAA: number;
}

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
  totaleF24Giugno: number;
  totaleF24Novembre: number;
  importoRivalsaCassa?: number;
  creditoDaCompensare?: number;
  warnings: string[];
}

function App() {
  // Profilo base: professionista, gestione separata, 5%
  const [category, setCategory] =
    useState<ForfettarioCategory>("PROFESSIONISTA");
  const [previdenza, setPrevidenza] =
    useState<PrevidenzaTipo>("GESTIONE_SEPARATA");
  const [hasCassaProfessionale, setHasCassaProfessionale] = useState(false);
  const [aliquotaImposta, setAliquotaImposta] = useState(0.05);

  // Dati anno
  const [year, setYear] = useState(2025);
  const [fatturato, setFatturato] = useState(60000);
  const [contribPrecedenti, setContribPrecedenti] = useState(0);
  const [impostePrecedenti, setImpostePrecedenti] = useState(0);
  const [ccIAA, setCcIAA] = useState(60);

  // Stato UI
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FiscalYearResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function formatCurrency(v?: number) {
    if (v === undefined || Number.isNaN(v)) return "-";
    return v.toLocaleString("it-IT", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 2,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const profile: UserTaxProfile = {
      category,
      previdenza,
      hasCassaProfessionale,
      aliquotaImpostaSostitutiva: aliquotaImposta,
      cassaAliquotaRivalsa: hasCassaProfessionale ? 0.04 : undefined,
    };

    const yearInput: FiscalYearInput = {
      year,
      fatturato,
      contributiVersatiPrecedente: contribPrecedenti,
      imposteVersatePrecedente: impostePrecedenti,
      ccIAA,
    };

    try {
      const res = await fetch("/api/tax/calc-year", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, yearInput }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Errore dal server");
      }
      setResult(data.result);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Errore imprevisto");
    } finally {
      setLoading(false);
    }
  }

  const totalContributi = result
    ? result.contributiInpsFissi + result.contributiInpsPercentuali
    : 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        margin: 0,
        background: "#0f172a",
        color: "#e5e7eb",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid rgba(148,163,184,0.3)",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>IoForfettario</div>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>
            MVP – simulatore fiscale collegato al motore reale
          </div>
        </div>
        <div
          style={{
            fontSize: 12,
            color: "#9ca3af",
            padding: "6px 10px",
            borderRadius: 999,
            border: "1px solid rgba(148,163,184,0.4)",
          }}
        >
          Workspace: <strong>Demo pre-lancio</strong>
        </div>
      </header>

      {/* Corpo pagina */}
      <main
        style={{
          padding: 24,
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)",
          gap: 24,
        }}
      >
        {/* Colonna sinistra: form */}
        <section
          style={{
            background: "rgba(15,23,42,0.95)",
            borderRadius: 18,
            border: "1px solid rgba(148,163,184,0.35)",
            padding: 20,
            boxShadow: "0 18px 45px rgba(15,23,42,0.75)",
          }}
        >
          <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>
            Parametri simulazione
          </h1>
          <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16 }}>
            Imposta il tuo profilo e i dati dell&apos;anno. Il calcolo è
            allineato ai fogli Excel usati internamente.
          </p>

          <form
            onSubmit={handleSubmit}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 12,
              fontSize: 13,
            }}
          >
            {/* Sezione profilo */}
            <div
              style={{
                gridColumn: "1 / -1",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: 0.04,
                color: "#9ca3af",
                marginTop: 4,
              }}
            >
              Profilo fiscale
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4 }}>
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as ForfettarioCategory)
                }
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: 10,
                  border: "1px solid #4b5563",
                  background: "#020617",
                  color: "#e5e7eb",
                }}
              >
                <option value="PROFESSIONISTA">Professionista</option>
                <option value="ARTIGIANO">Artigiano</option>
                <option value="COMMERCIANTE">Commerciante</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4 }}>
                Previdenza
              </label>
              <select
                value={previdenza}
                onChange={(e) =>
                  setPrevidenza(e.target.value as PrevidenzaTipo)
                }
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: 10,
                  border: "1px solid #4b5563",
                  background: "#020617",
                  color: "#e5e7eb",
                }}
              >
                <option value="GESTIONE_SEPARATA">Gestione separata</option>
                <option value="ARTIGIANI_COMMERCIANTI">
                  Artigiani / Commercianti
                </option>
                <option value="CASSA_PROFESSIONALE">Cassa professionale</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4 }}>
                Aliquota imposta
              </label>
              <select
                value={aliquotaImposta}
                onChange={(e) =>
                  setAliquotaImposta(parseFloat(e.target.value))
                }
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: 10,
                  border: "1px solid #4b5563",
                  background: "#020617",
                  color: "#e5e7eb",
                }}
              >
                <option value={0.05}>5% (start-up/primi 5 anni)</option>
                <option value={0.15}>15% (regime ordinario)</option>
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
              <input
                id="cassa"
                type="checkbox"
                checked={hasCassaProfessionale}
                onChange={(e) => setHasCassaProfessionale(e.target.checked)}
              />
              <label htmlFor="cassa" style={{ fontSize: 12 }}>
                Applico rivalsa cassa (4%)
              </label>
            </div>

            {/* Sezione anno */}
            <div
              style={{
                gridColumn: "1 / -1",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: 0.04,
                color: "#9ca3af",
                marginTop: 8,
              }}
            >
              Dati anno fiscale
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4 }}>Anno</label>
              <input
                type="number"
                value={year}
                onChange={(e) =>
                  setYear(parseInt(e.target.value || "0", 10))
                }
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: 10,
                  border: "1px solid #4b5563",
                  background: "#020617",
                  color: "#e5e7eb",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4 }}>
                Fatturato annuo (€)
              </label>
              <input
                type="number"
                value={fatturato}
                onChange={(e) =>
                  setFatturato(parseFloat(e.target.value || "0"))
                }
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: 10,
                  border: "1px solid #4b5563",
                  background: "#020617",
                  color: "#e5e7eb",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4 }}>
                Contributi versati anno precedente
              </label>
              <input
                type="number"
                value={contribPrecedenti}
                onChange={(e) =>
                  setContribPrecedenti(parseFloat(e.target.value || "0"))
                }
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: 10,
                  border: "1px solid #4b5563",
                  background: "#020617",
                  color: "#e5e7eb",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4 }}>
                Imposte versate anno precedente
              </label>
              <input
                type="number"
                value={impostePrecedenti}
                onChange={(e) =>
                  setImpostePrecedenti(parseFloat(e.target.value || "0"))
                }
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: 10,
                  border: "1px solid #4b5563",
                  background: "#020617",
                  color: "#e5e7eb",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4 }}>
                CCIAA (quota annua)
              </label>
              <input
                type="number"
                value={ccIAA}
                onChange={(e) =>
                  setCcIAA(parseFloat(e.target.value || "0"))
                }
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: 10,
                  border: "1px solid #4b5563",
                  background: "#020617",
                  color: "#e5e7eb",
                }}
              />
            </div>

            <div style={{ gridColumn: "1 / -1", marginTop: 10 }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 999,
                  border: "none",
                  background: loading
                    ? "rgba(59,130,246,0.6)"
                    : "linear-gradient(135deg,#4f46e5,#06b6d4)",
                  color: "#f9fafb",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: loading ? "default" : "pointer",
                }}
              >
                {loading
                  ? "Calcolo in corso..."
                  : "Calcola imposte, contributi e F24"}
              </button>
            </div>

            {error && (
              <div
                style={{
                  gridColumn: "1 / -1",
                  marginTop: 8,
                  padding: "8px 10px",
                  borderRadius: 10,
                  background: "rgba(248,113,113,0.1)",
                  border: "1px solid rgba(248,113,113,0.6)",
                  color: "#fecaca",
                  fontSize: 12,
                }}
              >
                Errore: {error}
              </div>
            )}
          </form>
        </section>

        {/* Colonna destra: risultati */}
        <section
          style={{
            background: "rgba(15,23,42,0.95)",
            borderRadius: 18,
            border: "1px solid rgba(148,163,184,0.35)",
            padding: 20,
            boxShadow: "0 18px 45px rgba(15,23,42,0.75)",
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>
            Risultato simulazione
          </h2>
          <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16 }}>
            I dati mostrati derivano direttamente dal motore fiscale validato
            (stessa logica degli Excel interni).
          </p>

          {!result && !loading && (
            <p style={{ fontSize: 13, color: "#9ca3af" }}>
              Compila i parametri a sinistra e avvia il calcolo per vedere qui
              il dettaglio di reddito, imposta e F24.
            </p>
          )}

          {result && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0,1fr))",
                gap: 12,
                fontSize: 13,
              }}
            >
              {/* Reddito */}
              <div
                style={{
                  gridColumn: "1 / -1",
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: "rgba(15,23,42,0.9)",
                  border: "1px solid rgba(55,65,81,0.9)",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "#9ca3af",
                    marginBottom: 2,
                  }}
                >
                  Reddito imponibile lordo / netto
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 20,
                    flexWrap: "wrap",
                    alignItems: "baseline",
                  }}
                >
                  <span style={{ fontSize: 16, fontWeight: 600 }}>
                    Lordo: {formatCurrency(result.redditoImponibileLordo)}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      color: "#9ca3af",
                    }}
                  >
                    Netto: {formatCurrency(result.redditoImponibileNetto)}
                  </span>
                </div>
              </div>

              {/* Contributi totali */}
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: "rgba(15,23,42,0.9)",
                  border: "1px solid rgba(55,65,81,0.9)",
                }}
              >
                <div style={{ fontSize: 11, color: "#9ca3af" }}>
                  Contributi INPS totali
                </div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>
                  {formatCurrency(totalContributi)}
                </div>
              </div>

              {/* Imposta sostitutiva */}
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: "rgba(15,23,42,0.9)",
                  border: "1px solid rgba(55,65,81,0.9)",
                }}
              >
                <div style={{ fontSize: 11, color: "#9ca3af" }}>
                  Imposta sostitutiva lorda
                </div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>
                  {formatCurrency(result.impostaSostitutivaLorda)}
                </div>
              </div>

              {/* Saldo imposta */}
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: "rgba(15,23,42,0.9)",
                  border: "1px solid rgba(55,65,81,0.9)",
                }}
              >
                <div style={{ fontSize: 11, color: "#9ca3af" }}>
                  Saldo imposta sostitutiva
                </div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>
                  {formatCurrency(result.saldoImpostaSostitutiva)}
                </div>
              </div>

              {/* F24 giugno */}
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: "rgba(22,163,74,0.12)",
                  border: "1px solid rgba(34,197,94,0.7)",
                }}
              >
                <div style={{ fontSize: 11, color: "#a7f3d0" }}>
                  Totale F24 – giugno
                </div>
                <div style={{ fontSize: 17, fontWeight: 600 }}>
                  {formatCurrency(result.totaleF24Giugno)}
                </div>
              </div>

              {/* F24 novembre */}
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: "rgba(234,179,8,0.12)",
                  border: "1px solid rgba(250,204,21,0.8)",
                }}
              >
                <div style={{ fontSize: 11, color: "#facc15" }}>
                  Totale F24 – novembre
                </div>
                <div style={{ fontSize: 17, fontWeight: 600 }}>
                  {formatCurrency(result.totaleF24Novembre)}
                </div>
              </div>

              {/* Credito da compensare */}
              {result.creditoDaCompensare &&
                Math.abs(result.creditoDaCompensare) > 0.01 && (
                  <div
                    style={{
                      gridColumn: "1 / -1",
                      padding: "10px 12px",
                      borderRadius: 12,
                      background: "rgba(8,47,73,0.9)",
                      border: "1px solid rgba(56,189,248,0.8)",
                    }}
                  >
                    <div
                      style={{ fontSize: 11, color: "#7dd3fc", marginBottom: 2 }}
                    >
                      Credito da compensare in F24
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>
                      {formatCurrency(result.creditoDaCompensare)}
                    </div>
                  </div>
                )}

              {/* Warnings */}
              {result.warnings && result.warnings.length > 0 && (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    padding: "8px 10px",
                    borderRadius: 12,
                    background: "rgba(15,23,42,0.9)",
                    border: "1px dashed rgba(148,163,184,0.8)",
                    fontSize: 12,
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    Note del motore fiscale
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {result.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;