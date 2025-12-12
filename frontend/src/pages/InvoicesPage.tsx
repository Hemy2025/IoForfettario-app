// frontend/src/pages/InvoicesPage.tsx

import { useMemo, useState } from "react";
import type { InvoiceItem, StoredUserProfile, YearTaxContext } from "../types/taxProfile";
import { computeAccantonamento } from "../api/taxApi";

const LS_PROFILE = "iof_user_profile_v1";
const LS_INVOICES = "iof_invoices_v1";

function euro(x: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(x);
}

function uid() {
  return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
}

export default function InvoicesPage() {
  const profile: StoredUserProfile | null = useMemo(() => {
    const p = localStorage.getItem(LS_PROFILE);
    return p ? (JSON.parse(p) as StoredUserProfile) : null;
  }, []);

  const [invoices, setInvoices] = useState<InvoiceItem[]>(() => {
    const inv = localStorage.getItem(LS_INVOICES);
    return inv ? (JSON.parse(inv) as InvoiceItem[]) : [];
  });

  const [dateIso, setDateIso] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [descrizione, setDescrizione] = useState<string>("Consulenza");
  const [importo, setImporto] = useState<number>(1000);

  const [lastAdvice, setLastAdvice] = useState<string>("");
  const [err, setErr] = useState<string>("");

  const fatturatoYtd = useMemo(() => invoices.reduce((s, x) => s + (Number(x.importo) || 0), 0), [invoices]);
  const residuo85k = useMemo(() => 85000 - fatturatoYtd, [fatturatoYtd]);

  function persist(next: InvoiceItem[]) {
    setInvoices(next);
    localStorage.setItem(LS_INVOICES, JSON.stringify(next));
  }

  async function addInvoice() {
    setErr("");
    setLastAdvice("");

    if (!profile) {
      setErr("Profilo fiscale non trovato. Vai in Onboarding.");
      return;
    }

    const inv: InvoiceItem = {
      id: uid(),
      dateIso,
      descrizione,
      importo: Number(importo) || 0,
    };

    const next = [...invoices, inv].sort((a, b) => a.dateIso.localeCompare(b.dateIso));
    persist(next);

    // Suggerimento accantonamento (backend) — best effort
    const year = new Date(dateIso).getFullYear();

    const ctx: YearTaxContext = {
      profile,
      yearInput: {
        year,
        fatturato: 0, // non usato qui, ma lo teniamo per compatibilità
        contributiVersatiPrecedente: 0,
        imposteVersatePrecedente: 0,
        ccIAA: 60,
      },
      fatturatoYtd: fatturatoYtd, // prima della fattura
    };

    const r = await computeAccantonamento(ctx, inv.importo);
    if (r.ok && r.data) {
      const d = r.data;
      setLastAdvice(
        `Accantonamento suggerito su questa fattura: ${euro(d.accantonamentoTotale)} • Residuo 85k dopo: ${euro(
          d.residuoFatturabile
        )} ${d.haSuperatoSoglia ? "⚠️ (superata soglia)" : ""}`
      );
    } else {
      setLastAdvice("Fattura salvata. (Nota: suggerimento accantonamento non disponibile: backend/endpoint non raggiungibile)");
    }
  }

  function remove(id: string) {
    persist(invoices.filter((x) => x.id !== id));
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xl font-semibold">Fatture</div>
            <div className="text-sm text-slate-300">Inserisci fatture manuali (poi Aruba).</div>
          </div>
          <div className="text-sm text-slate-300">
            YTD: <span className="font-semibold text-white">{euro(fatturatoYtd)}</span> • Residuo 85k:{" "}
            <span className="font-semibold text-white">{euro(residuo85k)}</span>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <div>
            <div className="text-xs text-slate-400">Data</div>
            <input
              className="mt-1 w-full rounded-xl bg-slate-900 px-3 py-2 ring-1 ring-slate-700 focus:outline-none"
              type="date"
              value={dateIso}
              onChange={(e) => setDateIso(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <div className="text-xs text-slate-400">Descrizione</div>
            <input
              className="mt-1 w-full rounded-xl bg-slate-900 px-3 py-2 ring-1 ring-slate-700 focus:outline-none"
              value={descrizione}
              onChange={(e) => setDescrizione(e.target.value)}
              placeholder="Es. consulenza, sviluppo, ecc."
            />
          </div>
          <div>
            <div className="text-xs text-slate-400">Importo</div>
            <input
              className="mt-1 w-full rounded-xl bg-slate-900 px-3 py-2 ring-1 ring-slate-700 focus:outline-none"
              type="number"
              value={importo}
              onChange={(e) => setImporto(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <button
            className="rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-slate-900 hover:brightness-110 transition"
            onClick={addInvoice}
          >
            Aggiungi fattura + suggerimento accantonamento
          </button>

          {lastAdvice && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-sm text-slate-200">
              {lastAdvice}
            </div>
          )}
        </div>

        {err && (
          <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-100">
            {err}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="text-lg font-semibold">Lista fatture</div>

        {invoices.length === 0 ? (
          <div className="mt-3 text-sm text-slate-300">Nessuna fattura inserita.</div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-950/50 text-slate-300">
                <tr>
                  <th className="px-4 py-3 text-left">Data</th>
                  <th className="px-4 py-3 text-left">Descrizione</th>
                  <th className="px-4 py-3 text-right">Importo</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((x) => (
                  <tr key={x.id} className="border-t border-slate-800">
                    <td className="px-4 py-3">{x.dateIso}</td>
                    <td className="px-4 py-3">{x.descrizione}</td>
                    <td className="px-4 py-3 text-right font-semibold">{euro(x.importo)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="rounded-xl bg-rose-500/15 px-3 py-2 ring-1 ring-rose-500/30 hover:bg-rose-500/20 transition"
                        onClick={() => remove(x.id)}
                      >
                        Rimuovi
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}