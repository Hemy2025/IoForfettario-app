import { useState } from "react";

function App() {
  const [fatturato, setFatturato] = useState(60000);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function calcola() {
    setLoading(true);
    setError(null);
    setResult(null);

    const profile = {
      category: "PROFESSIONISTA",
      previdenza: "GESTIONE_SEPARATA",
      hasCassaProfessionale: false,
      aliquotaImpostaSostitutiva: 0.05,
    };

    const yearInput = {
      year: 2025,
      fatturato,
      contributiVersatiPrecedente: 0,
      imposteVersatePrecedente: 0,
      ccIAA: 60,
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

      // il backend risponde { result: {...} }
      setResult(data.result);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Errore imprevisto");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "2.2rem", marginBottom: "1rem" }}>Simulatore Fiscale – MVP</h1>

      <label style={{ marginRight: "0.5rem" }}>Fatturato annuo (€)</label>
      <input
        type="number"
        value={fatturato}
        onChange={(e) => setFatturato(Number(e.target.value))}
        style={{ padding: "0.3rem 0.5rem" }}
      />

      <button
        onClick={calcola}
        disabled={loading}
        style={{
          marginLeft: "1rem",
          padding: "0.4rem 0.9rem",
          borderRadius: "6px",
          border: "1px solid #1d4ed8",
          background: loading ? "#93c5fd" : "#2563eb",
          color: "white",
          cursor: loading ? "default" : "pointer",
        }}
      >
        {loading ? "Calcolo..." : "Calcola"}
      </button>

      {error && (
        <div
          style={{
            marginTop: "1rem",
            padding: "0.6rem 0.8rem",
            background: "#fee2e2",
            color: "#991b1b",
            borderRadius: "4px",
            maxWidth: "600px",
          }}
        >
          Errore: {error}
        </div>
      )}

      {result && (
        <pre
          style={{
            background: "#f3f4f6",
            padding: "1rem",
            marginTop: "1.5rem",
            maxWidth: "800px",
            overflowX: "auto",
          }}
        >
{JSON.stringify(result, null, 2)}
        </pre>
      )}

      {!result && !error && !loading && (
        <p style={{ marginTop: "1rem", color: "#6b7280" }}>
          Inserisci il fatturato e clicca su <strong>Calcola</strong> per vedere il risultato
          prodotto dal motore fiscale (stesso modello dei fogli Excel).
        </p>
      )}
    </div>
  );
}

export default App;