import { useEffect, useState } from "react";

/**
 * Tipi base per il profilo fiscale (versione frontend)
 */
type CategoriaForfettario = "PROFESSIONISTA" | "ARTIGIANO" | "COMMERCIANTE";
type PrevidenzaForfettario =
  | "GESTIONE_SEPARATA"
  | "ARTIGIANI_COMMERCIANTI"
  | "CASSA_PROFESSIONALE";

interface UserTaxProfile {
  category: CategoriaForfettario;
  previdenza: PrevidenzaForfettario;
  hasCassaProfessionale: boolean;
  aliquotaImpostaSostitutiva: number;
}

/**
 * Forma del form anno fiscale (stringhe per gli input)
 */
interface FiscalYearInputForm {
  year: string;
  fatturato: string;
  contributiVersatiPrecedente: string;
  imposteVersatePrecedente: string;
  ccIAA: string;
}

/**
 * Payload che mandiamo al backend per computeFiscalYear
 * (mappato dal form qui sopra)
 */
interface FiscalYearInputBackend {
  year: number;
  fatturato: number;
  contributiVersatiPrecedente: number;
  imposteVersatePrecedente: number;
  ccIAA: number;
}

/**
 * Risposta health
 */
interface HealthResponse {
  status: string;
  service: string;
}

/**
 * Risultato annuale dal motore (campo usato nella UI)
 * Tenendo i campi opzionali non rischiamo errori se in futuro cambiano.
 */
interface AnnualResult {
  redditoImponibileLordo?: number;
  redditoImponibileNetto?: number;
  contributiInpsTotali?: number;
  impostaSostitutivaLorda?: number;
  totaleF24Giugno?: number;
  totaleF24Novembre?: number;
  saldoImpostaSostitutiva?: number;
  [key: string]: any;
}

/**
 * Risultato accantonamento fattura – campi usati nei test backend
 */
interface InvoiceSavingResult {
  fatturatoYtdPrima?: number;
  fatturatoYtdDopo?: number;
  residuoFatturabile?: number;
  accantonamentoTotale?: number;
  percentualeSuFattura?: number; // 0–1
  haSuperatoSoglia?: boolean;
  [key: string]: any;
}

/**
 * Util per formattare importi
 */
function formatCurrency(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "-";
  return value.toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  });
}

/**
 * Stili “design system” molto semplici ma coerenti
 */

const pageStyle: React.CSSProperties = {
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  minHeight: "100vh",
  margin: 0,
  background: "#020617", // sfondo scuro
  color: "#e5e7eb",
};

const shellStyle: React.CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "24px 20px 40px",
};

const badgeWorkspaceStyle: React.CSSProperties = {
  padding: "4px 10px",
  borderRadius: "999px",
  border: "1px solid rgba(148,163,184,0.4)",
  fontSize: "0.75rem",
  color: "#cbd5f5",
  background:
    "radial-gradient(circle at top left, rgba(129,140,248,0.35), transparent 60%) rgba(15,23,42,0.9)",
};

const sectionCardStyle: React.CSSProperties = {
  borderRadius: "18px",
  padding: "18px 18px 16px",
  background:
    "radial-gradient(circle at top left, rgba(51,65,85,0.7), rgba(15,23,42,1))",
  border: "1px solid rgba(30,64,175,0.6)",
  boxShadow: "0 24px 60px rgba(0,0,0,0.65)",
};

const subCardStyle: React.CSSProperties = {
  borderRadius: "14px",
  padding: "14px 14px 12px",
  backgroundColor: "rgba(15,23,42,0.9)",
  border: "1px solid rgba(51,65,85,0.9)",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.8rem",
  marginBottom: "4px",
  color: "#9ca3af",
};

const inputBaseStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: "999px",
  border: "1px solid rgba(55,65,81,0.9)",
  backgroundColor: "rgba(15,23,42,0.9)",
  color: "#e5e7eb",
  padding: "8px 12px",
  fontSize: "0.85rem",
  outline: "none",
};

const buttonPrimaryStyle: React.CSSProperties = {
  borderRadius: "999px",
  border: "none",
  padding: "9px 18px",
  fontSize: "0.85rem",
  fontWeight: 600,
  background:
    "linear-gradient(135deg, rgba(22,163,74,1), rgba(21,128,61,1))",
  color: "#f9fafb",
  cursor: "pointer",
  boxShadow: "0 12px 40px rgba(22,163,74,0.55)",
};

const buttonSecondaryStyle: React.CSSProperties = {
  borderRadius: "999px",
  border: "1px solid rgba(148,163,184,0.6)",
  padding: "7px 14px",
  fontSize: "0.8rem",
  backgroundColor: "rgba(15,23,42,0.9)",
  color: "#e5e7eb",
  cursor: "pointer",
};

/**
 * Helpers per mappare form → payload backend
 */
function mapProfileToBackend(p: UserTaxProfile): UserTaxProfile {
  // Al momento il tipo frontend coincide con quello backend
  return p;
}

function parseYearFormToBackend(
  form: FiscalYearInputForm
): FiscalYearInputBackend {
  const num = (v: string) => Number((v || "0").replace(",", "."));
  return {
    year: num(form.year),
    fatturato: num(form.fatturato),
    contributiVersatiPrecedente: num(form.contributiVersatiPrecedente),
    imposteVersatePrecedente: num(form.imposteVersatePrecedente),
    ccIAA: num(form.ccIAA),
  };
}

/**
 * Componente principale
 */
function App() {
  // Stato health backend
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);

  // Stato profilo fiscale
  const [profile, setProfile] = useState<UserTaxProfile>({
    category: "PROFESSIONISTA",
    previdenza: "GESTIONE_SEPARATA",
    hasCassaProfessionale: false,
    aliquotaImpostaSostitutiva: 0.05,
  });
  const [profileSavedMessage, setProfileSavedMessage] = useState<string | null>(
    null
  );

  // Stato dati anno fiscale
  const [yearForm, setYearForm] = useState<FiscalYearInputForm>({
    year: "2025",
    fatturato: "60000",
    contributiVersatiPrecedente: "0",
    imposteVersatePrecedente: "0",
    ccIAA: "60",
  });

  // Stato per fatture & accantonamento
  const [fatturaDate, setFatturaDate] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });
  const [fatturaImporto, setFatturaImporto] = useState<string>("1000");
  const [fatturatoYtd, setFatturatoYtd] = useState<number>(0);
  const [residuoTetto, setResiduoTetto] = useState<number>(85000);

  // Stato risultati / errori calcolo annuale
  const [annualResult, setAnnualResult] = useState<AnnualResult | null>(null);
  const [annualError, setAnnualError] = useState<string | null>(null);
  const [annualLoading, setAnnualLoading] = useState<boolean>(false);

  // Stato risultati / errori accantonamento fattura
  const [invoiceResult, setInvoiceResult] = useState<InvoiceSavingResult | null>(
    null
  );
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState<boolean>(false);

  /**
   * Effetto: carica profilo da localStorage (se presente)
   */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("iof_profile_v1");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.category && parsed.previdenza) {
          setProfile(parsed);
        }
      }
    } catch {
      // silenzio
    }
  }, []);

  /**
   * Effetto: health-check backend
   */
  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch("/api/health");
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = (await res.json()) as HealthResponse;
        setHealth(data);
        setHealthError(null);
      } catch (err: any) {
        setHealthError(
          err?.message ?? "Errore sconosciuto chiamando /api/health"
        );
      }
    }

    checkHealth();
  }, []);

  /**
   * Salvataggio profilo (localStorage)
   */
  function handleSaveProfile() {
    try {
      window.localStorage.setItem("iof_profile_v1", JSON.stringify(profile));
      setProfileSavedMessage("Profilo fiscale salvato ✅");
      setTimeout(() => setProfileSavedMessage(null), 2500);
    } catch {
      setProfileSavedMessage("Impossibile salvare il profilo (localStorage).");
      setTimeout(() => setProfileSavedMessage(null), 3000);
    }
  }

  /**
   * Calcolo annuo reale (chiama il backend /api/calc/annual)
   */
  async function handleAnnualCalc(e: React.FormEvent) {
    e.preventDefault();
    setAnnualLoading(true);
    setAnnualError(null);
    setInvoiceResult(null); // pulisco eventuale risultato fattura

    try {
      const profileBackend = mapProfileToBackend(profile);
      const yearInputBackend = parseYearFormToBackend(yearForm);

      const resp = await fetch("/api/calc/annual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: profileBackend,
          yearInput: yearInputBackend,
        }),
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      const data = await resp.json();
      const result: AnnualResult = data.result || {};

      setAnnualResult(result);

      // Allineo anche i contatori per la sezione fatture
      const fatturato = yearInputBackend.fatturato ?? 0;
      setFatturatoYtd(fatturato);
      setResiduoTetto(85000 - fatturato);
    } catch (err: any) {
      console.error("Errore calcolo annuale:", err);
      setAnnualError(err?.message ?? "Errore nel calcolo annuale.");
    } finally {
      setAnnualLoading(false);
    }
  }

  /**
   * Calcolo accantonamento per singola fattura
   * Chiama /api/calc/invoice, che a sua volta usa computeAccantonamentoPerFattura.
   */
  async function handleAddInvoice(e: React.FormEvent) {
    e.preventDefault();
    setInvoiceLoading(true);
    setInvoiceError(null);

    try {
      const importo = Number(fatturaImporto.replace(",", ".") || "0");
      if (!Number.isFinite(importo) || importo <= 0) {
        throw new Error("Inserisci un importo imponibile valido (> 0).");
      }

      const profileBackend = mapProfileToBackend(profile);
      const baseYearInput = parseYearFormToBackend(yearForm);

      const context = {
        profile: profileBackend,
        baseYearInput,
        fatturatoCumAnno: fatturatoYtd,
      };

      const resp = await fetch("/api/calc/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context,
          importoFattura: importo,
        }),
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      const data = await resp.json();
      const result: InvoiceSavingResult = data.result || {};

      setInvoiceResult(result);

      // Aggiorno fatturato e residuo verso 85k usando i dati restituiti
      const nuovoFatturato =
        result.fatturatoYtdDopo ?? fatturatoYtd + importo;
      const nuovoResiduo =
        result.residuoFatturabile ?? 85000 - nuovoFatturato;

      setFatturatoYtd(nuovoFatturato);
      setResiduoTetto(nuovoResiduo);
    } catch (err: any) {
      console.error("Errore calcolo accantonamento fattura:", err);
      setInvoiceError(
        err?.message ?? "Errore nel calcolo di accantonamento fattura."
      );
    } finally {
      setInvoiceLoading(false);
    }
  }

  /**
   * Render
   */
  return (
    <div style={pageStyle}>
      <div style={shellStyle}>
        {/* Header */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "1.9rem",
                fontWeight: 700,
                letterSpacing: "-0.05em",
                margin: 0,
                marginBottom: "4px",
              }}
            >
              IoForfettario
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: "0.86rem",
                color: "#9ca3af",
              }}
            >
              MVP – simulatore fiscale collegato al motore a regole validato.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={badgeWorkspaceStyle}>Workspace: Demo pre-lancio</div>
            <div
              style={{
                fontSize: "0.8rem",
                padding: "4px 9px",
                borderRadius: "999px",
                border: "1px solid rgba(55,65,81,0.8)",
                backgroundColor: "rgba(15,23,42,0.9)",
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: health ? "#bbf7d0" : healthError ? "#fecaca" : "#e5e7eb",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "999px",
                  background: health
                    ? "#22c55e"
                    : healthError
                    ? "#ef4444"
                    : "#fbbf24",
                  boxShadow: health
                    ? "0 0 0 5px rgba(34,197,94,0.35)"
                    : healthError
                    ? "0 0 0 5px rgba(239,68,68,0.35)"
                    : "0 0 0 5px rgba(251,191,36,0.35)",
                }}
              />
              {health
                ? "Backend OK · /api/health"
                : healthError
                ? "Problema nel contattare il backend"
                : "Verifica backend in corso…"}
            </div>
          </div>
        </header>

        {/* Layout 2 colonne */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1.1fr)",
            gap: "18px",
            alignItems: "flex-start",
          }}
        >
          {/* Colonna sinistra */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* PROFILO FISCALE */}
            <section style={sectionCardStyle}>
              <h2
                style={{
                  fontSize: "1.05rem",
                  margin: 0,
                  marginBottom: 4,
                  fontWeight: 650,
                }}
              >
                Profilo fiscale (onboarding rapido)
              </h2>
              <p
                style={{
                  fontSize: "0.8rem",
                  marginTop: 0,
                  marginBottom: 12,
                  color: "#9ca3af",
                }}
              >
                Seleziona categoria, gestione previdenziale e aliquota. Queste
                informazioni verranno usate come base per i calcoli.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,minmax(0,1fr))",
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                {/* Categoria */}
                <div>
                  <label style={labelStyle}>Categoria</label>
                  <select
                    value={profile.category}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        category: e.target
                          .value as UserTaxProfile["category"],
                      }))
                    }
                    style={inputBaseStyle}
                  >
                    <option value="PROFESSIONISTA">Professionista</option>
                    <option value="ARTIGIANO">Artigiano</option>
                    <option value="COMMERCIANTE">Commerciante</option>
                  </select>
                </div>
                {/* Previdenza */}
                <div>
                  <label style={labelStyle}>Previdenza</label>
                  <select
                    value={profile.previdenza}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        previdenza: e.target
                          .value as UserTaxProfile["previdenza"],
                      }))
                    }
                    style={inputBaseStyle}
                  >
                    <option value="GESTIONE_SEPARATA">Gestione separata</option>
                    <option value="ARTIGIANI_COMMERCIANTI">
                      Artigiani / Commercianti
                    </option>
                    <option value="CASSA_PROFESSIONALE">
                      Cassa professionale
                    </option>
                  </select>
                </div>
                {/* Aliquota */}
                <div>
                  <label style={labelStyle}>Aliquota imposta sostitutiva</label>
                  <select
                    value={profile.aliquotaImpostaSostitutiva}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        aliquotaImpostaSostitutiva: Number(e.target.value),
                      }))
                    }
                    style={inputBaseStyle}
                  >
                    <option value={0.05}>5% (start-up/primi 5 anni)</option>
                    <option value={0.15}>15% (ordinaria)</option>
                  </select>
                </div>
              </div>

              {/* Cassa + salva */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  marginTop: 4,
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: "0.8rem",
                    color: "#e5e7eb",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={profile.hasCassaProfessionale}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        hasCassaProfessionale: e.target.checked,
                      }))
                    }
                  />
                  Ho una cassa professionale (rivalsa 4%)
                </label>

                <button
                  type="button"
                  onClick={handleSaveProfile}
                  style={buttonSecondaryStyle}
                >
                  Salva profilo fiscale
                </button>
              </div>

              {profileSavedMessage && (
                <p
                  style={{
                    fontSize: "0.78rem",
                    marginTop: 6,
                    color: "#a7f3d0",
                  }}
                >
                  {profileSavedMessage}
                </p>
              )}
            </section>

            {/* PARAMETRI SIMULAZIONE ANNO FISCALE */}
            <section style={sectionCardStyle}>
              <h2
                style={{
                  fontSize: "1.02rem",
                  margin: 0,
                  marginBottom: 4,
                  fontWeight: 640,
                }}
              >
                Parametri simulazione anno fiscale
              </h2>
              <p
                style={{
                  fontSize: "0.8rem",
                  marginTop: 0,
                  marginBottom: 12,
                  color: "#9ca3af",
                }}
              >
                Imposta l&apos;anno e i dati contabili. Il motore fiscale usa
                gli stessi parametri dei fogli Excel interni.
              </p>

              <form
                onSubmit={handleAnnualCalc}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
                  gap: 10,
                  rowGap: 8,
                }}
              >
                {/* Anno */}
                <div>
                  <label style={labelStyle}>Anno</label>
                  <input
                    type="number"
                    value={yearForm.year}
                    onChange={(e) =>
                      setYearForm((f) => ({ ...f, year: e.target.value }))
                    }
                    style={inputBaseStyle}
                  />
                </div>
                {/* Fatturato */}
                <div>
                  <label style={labelStyle}>Fatturato annuo (€)</label>
                  <input
                    type="number"
                    value={yearForm.fatturato}
                    onChange={(e) =>
                      setYearForm((f) => ({ ...f, fatturato: e.target.value }))
                    }
                    style={inputBaseStyle}
                  />
                </div>

                {/* Contributi anno precedente */}
                <div>
                  <label style={labelStyle}>
                    Contributi versati anno precedente (€)
                  </label>
                  <input
                    type="number"
                    value={yearForm.contributiVersatiPrecedente}
                    onChange={(e) =>
                      setYearForm((f) => ({
                        ...f,
                        contributiVersatiPrecedente: e.target.value,
                      }))
                    }
                    style={inputBaseStyle}
                  />
                </div>

                {/* Imposte anno precedente */}
                <div>
                  <label style={labelStyle}>
                    Imposte versate anno precedente (€)
                  </label>
                  <input
                    type="number"
                    value={yearForm.imposteVersatePrecedente}
                    onChange={(e) =>
                      setYearForm((f) => ({
                        ...f,
                        imposteVersatePrecedente: e.target.value,
                      }))
                    }
                    style={inputBaseStyle}
                  />
                </div>

                {/* CCIAA */}
                <div>
                  <label style={labelStyle}>CCIAA (quota annua, €)</label>
                  <input
                    type="number"
                    value={yearForm.ccIAA}
                    onChange={(e) =>
                      setYearForm((f) => ({ ...f, ccIAA: e.target.value }))
                    }
                    style={inputBaseStyle}
                  />
                </div>

                {/* Bottone */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "flex-start",
                  }}
                >
                  <button
                    type="submit"
                    style={{
                      ...buttonPrimaryStyle,
                      opacity: annualLoading ? 0.6 : 1,
                    }}
                    disabled={annualLoading}
                  >
                    {annualLoading
                      ? "Calcolo in corso…"
                      : "Calcola imposte, contributi e F24"}
                  </button>
                </div>
              </form>

              {annualError && (
                <p
                  style={{
                    fontSize: "0.78rem",
                    marginTop: 8,
                    color: "#fecaca",
                  }}
                >
                  {annualError}
                </p>
              )}

              {!annualError && (
                <p
                  style={{
                    fontSize: "0.78rem",
                    marginTop: 8,
                    color: "#9ca3af",
                  }}
                >
                  Nota: il calcolo usa lo stesso motore a regole testato con
                  Jest (`computeFiscalYear`). I risultati dettagliati sono
                  mostrati nella colonna di destra.
                </p>
              )}
            </section>

            {/* FATTURE & ACCANTONAMENTO */}
            <section style={sectionCardStyle}>
              <h2
                style={{
                  fontSize: "1.02rem",
                  margin: 0,
                  marginBottom: 4,
                  fontWeight: 640,
                }}
              >
                Gestione fatture & accantonamenti
              </h2>
              <p
                style={{
                  fontSize: "0.8rem",
                  marginTop: 0,
                  marginBottom: 10,
                  color: "#9ca3af",
                }}
              >
                Inserisci le fatture emesse nell&apos;anno. Il sistema suggerisce
                l&apos;accantonamento per ogni fattura e mostra il residuo verso
                la soglia degli 85.000 €.
              </p>

              <form
                onSubmit={handleAddInvoice}
                style={{
                  ...subCardStyle,
                  display: "grid",
                  gridTemplateColumns: "1.1fr 1.1fr auto",
                  gap: 10,
                  alignItems: "flex-end",
                  marginBottom: 10,
                }}
              >
                <div>
                  <label style={labelStyle}>Data fattura</label>
                  <input
                    type="date"
                    value={fatturaDate}
                    onChange={(e) => setFatturaDate(e.target.value)}
                    style={inputBaseStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Importo imponibile (€)</label>
                  <input
                    type="number"
                    value={fatturaImporto}
                    onChange={(e) => setFatturaImporto(e.target.value)}
                    style={inputBaseStyle}
                  />
                </div>
                <div style={{ textAlign: "right" }}>
                  <button
                    type="submit"
                    style={{
                      ...buttonPrimaryStyle,
                      opacity: invoiceLoading ? 0.6 : 1,
                    }}
                    disabled={invoiceLoading}
                  >
                    {invoiceLoading
                      ? "Calcolo in corso…"
                      : "Aggiungi fattura + accantonamento"}
                  </button>
                </div>
              </form>

              {invoiceError && (
                <p
                  style={{
                    fontSize: "0.78rem",
                    marginTop: 4,
                    color: "#fecaca",
                  }}
                >
                  {invoiceError}
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  fontSize: "0.82rem",
                  marginTop: 4,
                  flexWrap: "wrap",
                }}
              >
                <span>
                  Fatturato cumulato anno:{" "}
                  <strong>{formatCurrency(fatturatoYtd)}</strong>
                </span>
                <span>
                  Residuo verso 85.000 €:{" "}
                  <strong
                    style={{
                      color: residuoTetto < 0 ? "#fecaca" : "#bbf7d0",
                    }}
                  >
                    {formatCurrency(residuoTetto)}
                  </strong>
                </span>
              </div>

              {invoiceResult && (
                <div
                  style={{
                    ...subCardStyle,
                    marginTop: 10,
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.78rem",
                      margin: 0,
                      marginBottom: 6,
                      color: "#9ca3af",
                    }}
                  >
                    Accantonamento suggerito per l&apos;ultima fattura inserita
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.9rem",
                      fontWeight: 600,
                    }}
                  >
                    Accantonamento totale:{" "}
                    {formatCurrency(invoiceResult.accantonamentoTotale)}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      marginTop: 4,
                      fontSize: "0.82rem",
                    }}
                  >
                    Percentuale sulla fattura:{" "}
                    {invoiceResult.percentualeSuFattura != null
                      ? `${(invoiceResult.percentualeSuFattura * 100).toFixed(
                          1
                        )} %`
                      : "-"}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      marginTop: 4,
                      fontSize: "0.82rem",
                    }}
                  >
                    Stato soglia 85.000 €:{" "}
                    <strong
                      style={{
                        color: invoiceResult.haSuperatoSoglia
                          ? "#fecaca"
                          : "#bbf7d0",
                      }}
                    >
                      {invoiceResult.haSuperatoSoglia ? "Superata" : "OK"}
                    </strong>
                  </p>
                </div>
              )}

              {!invoiceError && (
                <p
                  style={{
                    fontSize: "0.78rem",
                    marginTop: 8,
                    color: "#9ca3af",
                  }}
                >
                  Il calcolo tiene conto del fatturato cumulato annuo e della
                  soglia forfettaria di 85.000 €. I valori sono calcolati dallo
                  stesso motore a regole validato con i test Jest.
                </p>
              )}
            </section>
          </div>

          {/* Colonna destra: Risultato simulazione annua */}
          <div style={sectionCardStyle}>
            <h2
              style={{
                fontSize: "1.02rem",
                margin: 0,
                marginBottom: 4,
                fontWeight: 640,
              }}
            >
              Risultato simulazione annua
            </h2>
            <p
              style={{
                fontSize: "0.8rem",
                marginTop: 0,
                marginBottom: 12,
                color: "#9ca3af",
              }}
            >
              I dati qui sono alimentati dal motore fiscale validato (stessa
              logica dei fogli Excel interni).
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginTop: 4,
              }}
            >
              <div style={subCardStyle}>
                <p
                  style={{
                    fontSize: "0.8rem",
                    margin: 0,
                    marginBottom: 6,
                    color: "#9ca3af",
                  }}
                >
                  Reddito imponibile lordo / netto
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.9rem",
                    fontWeight: 600,
                  }}
                >
                  Lordo:{" "}
                  <span>
                    {formatCurrency(annualResult?.redditoImponibileLordo)}
                  </span>{" "}
                  · Netto:{" "}
                  <span>
                    {formatCurrency(annualResult?.redditoImponibileNetto)}
                  </span>
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
                  gap: 10,
                }}
              >
                <div style={subCardStyle}>
                  <p
                    style={{
                      fontSize: "0.8rem",
                      margin: 0,
                      marginBottom: 4,
                      color: "#9ca3af",
                    }}
                  >
                    Contributi INPS totali
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.9rem",
                      fontWeight: 600,
                    }}
                  >
                    {formatCurrency(annualResult?.contributiInpsTotali)}
                  </p>
                </div>

                <div style={subCardStyle}>
                  <p
                    style={{
                      fontSize: "0.8rem",
                      margin: 0,
                      marginBottom: 4,
                      color: "#9ca3af",
                    }}
                  >
                    Imposta sostitutiva lorda
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.9rem",
                      fontWeight: 600,
                    }}
                  >
                    {formatCurrency(annualResult?.impostaSostitutivaLorda)}
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
                  gap: 10,
                }}
              >
                <div style={subCardStyle}>
                  <p
                    style={{
                      fontSize: "0.8rem",
                      margin: 0,
                      marginBottom: 4,
                      color: "#9ca3af",
                    }}
                  >
                    Totale F24 – giugno
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.9rem",
                      fontWeight: 600,
                    }}
                  >
                    {formatCurrency(annualResult?.totaleF24Giugno)}
                  </p>
                </div>
                <div style={subCardStyle}>
                  <p
                    style={{
                      fontSize: "0.8rem",
                      margin: 0,
                      marginBottom: 4,
                      color: "#9ca3af",
                    }}
                  >
                    Totale F24 – novembre
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.9rem",
                      fontWeight: 600,
                    }}
                  >
                    {formatCurrency(annualResult?.totaleF24Novembre)}
                  </p>
                </div>
              </div>

              {annualResult?.saldoImpostaSostitutiva != null && (
                <div style={subCardStyle}>
                  <p
                    style={{
                      fontSize: "0.8rem",
                      margin: 0,
                      marginBottom: 4,
                      color: "#9ca3af",
                    }}
                  >
                    Saldo imposta sostitutiva
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.9rem",
                      fontWeight: 600,
                    }}
                  >
                    {formatCurrency(annualResult.saldoImpostaSostitutiva)}
                  </p>
                </div>
              )}

              {!annualResult && (
                <p
                  style={{
                    fontSize: "0.78rem",
                    marginTop: 4,
                    color: "#9ca3af",
                  }}
                >
                  Premi &quot;Calcola imposte, contributi e F24&quot; per
                  vedere il dettaglio dei calcoli per l&apos;anno selezionato.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer
          style={{
            marginTop: 18,
            fontSize: "0.78rem",
            color: "#6b7280",
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <span>v0.3 · Internal dev build (UI + motore collegato)</span>
          <span>Tax engine: Jest-tested · regime forfettario</span>
        </footer>
      </div>
    </div>
  );
}

export default App;