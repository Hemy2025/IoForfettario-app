import { useEffect, useState } from "react";
import Onboarding from "./Onboarding";
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

const defaultProfile: StoredUserProfile = {
  category: "PROFESSIONISTA",
  previdenza: "GESTIONE_SEPARATA",
  hasCassaProfessionale: false,
  aliquotaImpostaSostitutiva: 0.05,
};

function formatCurrency(value: number | undefined | null): string {
  if (value == null || isNaN(value)) return "0,00 €";
  return value.toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  });
}

function App() {
  const [profile, setProfile] = useState<StoredUserProfile>(defaultProfile);

  const [year, setYear] = useState<number>(2025);
  const [fatturato, setFatturato] = useState<number>(60000);
  const [contributiPrev, setContributiPrev] = useState<number>(0);
  const [impostePrev, setImpostePrev] = useState<number>(0);
  const [cciaa, setCciaa] = useState<number>(60);

  const [result, setResult] = useState<FiscalYearResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Carica profilo salvato
  useEffect(() => {
    try {
      const raw = localStorage.getItem("ioforfettario.profile");
      if (raw) {
        const parsed = JSON.parse(raw) as StoredUserProfile;
        setProfile(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handleProfileSave = (p: StoredUserProfile) => {
    setProfile(p);
    try {
      localStorage.setItem("ioforfettario.profile", JSON.stringify(p));
    } catch {
      /* ignore */
    }
  };

  const handleCalculate = async () => {
    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const body = {
        profile,
        yearInput: {
          year,
          fatturato,
          contributiVersatiPrecedente: contributiPrev,
          imposteVersatePrecedente: impostePrev,
          ccIAA: cciaa,
        },
      };

      const res = await fetch(`${BACKEND_URL}/api/fiscal/year`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(`Errore HTTP ${res.status}`);
      }

      const data = (await res.json()) as FiscalYearResult;
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        "Si è verificato un errore nel calcolo. Verifica che il backend sia avviato sulla porta 3001."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-root">
      <div className="app-shell">
        {/* HEADER */}
        <header className="app-header">
          <div>
            <div className="app-title">IoForfettario</div>
            <div className="app-subtitle">
              MVP – simulatore fiscale collegato al motore a regole validato.
            </div>
          </div>
          <div className="app-badge">Workspace: Demo pre-lancio</div>
        </header>

        <div className="app-grid">
          {/* COLONNA SINISTRA – ONBOARDING + FORM ANNO */}
          <section className="card">
            <div className="onboarding-wrap">
              <div className="onboarding-title">
                Profilo fiscale (onboarding rapido)
              </div>
              <Onboarding profile={profile} onProfileChange={handleProfileSave} />
            </div>

            <div className="card-header">
              <div>
                <div className="card-title">Parametri simulazione anno fiscale</div>
                <div className="card-caption">
                  Imposta i dati contabili. Il motore fiscale utilizza le stesse
                  logiche dei fogli Excel interni.
                </div>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label className="form-label">Anno</label>
                <input
                  className="form-input"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value) || 0)}
                />
              </div>

              <div className="form-field">
                <label className="form-label">Fatturato annuo (€)</label>
                <input
                  className="form-input"
                  type="number"
                  value={fatturato}
                  onChange={(e) => setFatturato(Number(e.target.value) || 0)}
                />
              </div>

              <div className="form-field">
                <label className="form-label">
                  Contributi versati anno precedente (€)
                </label>
                <input
                  className="form-input"
                  type="number"
                  value={contributiPrev}
                  onChange={(e) => setContributiPrev(Number(e.target.value) || 0)}
                />
              </div>

              <div className="form-field">
                <label className="form-label">
                  Imposte versate anno precedente (€)
                </label>
                <input
                  className="form-input"
                  type="number"
                  value={impostePrev}
                  onChange={(e) => setImpostePrev(Number(e.target.value) || 0)}
                />
              </div>

              <div className="form-field">
                <label className="form-label">CCIAA (quota annua, €)</label>
                <input
                  className="form-input"
                  type="number"
                  value={cciaa}
                  onChange={(e) => setCciaa(Number(e.target.value) || 0)}
                />
              </div>
            </div>

            <button
              className="primary-button"
              onClick={handleCalculate}
              disabled={loading}
            >
              {loading
                ? "Calcolo in corso…"
                : "Calcola imposte, contributi e F24"}
            </button>

            {errorMsg && <div className="status-bar">{errorMsg}</div>}
          </section>

          {/* COLONNA DESTRA – RISULTATI */}
          <section className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Risultato simulazione</div>
                <div className="card-caption">
                  I dati provengono direttamente dal motore fiscale validato
                  (stessa logica degli Excel interni).
                </div>
              </div>
            </div>

            {result ? (
              <>
                <div className="result-grid">
                  <div className="result-pill">
                    <div className="result-label">
                      Reddito imponibile lordo / netto
                    </div>
                    <div className="result-value">
                      Lordo: {formatCurrency(result.redditoImponibileLordo)}
                    </div>
                    <div className="result-subvalue">
                      Netto: {formatCurrency(result.redditoImponibileNetto)}
                    </div>
                  </div>

                  <div className="result-pill">
                    <div className="result-label">Contributi INPS totali</div>
                    <div className="result-value">
                      {formatCurrency(
                        result.contributiInpsFissi +
                          result.contributiInpsPercentuali
                      )}
                    </div>
                    <div className="result-subvalue">
                      Fissi: {formatCurrency(result.contributiInpsFissi)} · %
                      : {formatCurrency(result.contributiInpsPercentuali)}
                    </div>
                  </div>

                  <div className="result-pill">
                    <div className="result-label">Imposta sostitutiva lorda</div>
                    <div className="result-value">
                      {formatCurrency(result.impostaSostitutivaLorda)}
                    </div>
                    <div className="result-subvalue">
                      Saldo: {formatCurrency(result.saldoImpostaSostitutiva)}
                    </div>
                  </div>

                  <div className="result-pill highlight-green">
                    <div className="result-label">Totale F24 – giugno</div>
                    <div className="result-value">
                      {formatCurrency(result.totaleF24Giugno)}
                    </div>
                    <div className="result-subvalue">
                      Include saldo + 1° acconti + CCIAA
                    </div>
                  </div>

                  <div className="result-pill highlight-amber">
                    <div className="result-label">Totale F24 – novembre</div>
                    <div className="result-value">
                      {formatCurrency(result.totaleF24Novembre)}
                    </div>
                    <div className="result-subvalue">
                      Secondi acconti imposta + contributi
                    </div>
                  </div>
                </div>

                <div className="result-info">
                  Anno fiscale simulato: <strong>{result.year}</strong>. Eventuali
                  messaggi dal motore:{" "}
                  {result.warnings.length
                    ? result.warnings.join(" · ")
                    : "nessun warning rilevante."}
                </div>
              </>
            ) : (
              <div className="result-info">
                Inserisci il profilo fiscale, imposta i parametri dell&apos;anno e
                premi &quot;Calcola imposte, contributi e F24&quot; per vedere il
                dettaglio dei calcoli.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default App;