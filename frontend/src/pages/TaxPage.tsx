// frontend/src/pages/TaxPage.tsx

import { useMemo, useState } from "react";
import type { StoredUserProfile, InvoiceItem, FiscalYearInput } from "../types/taxProfile";
import { computeYear } from "../api/taxApi";

const LS_PROFILE = "iof_user_profile_v1";
const LS_INVOICES = "iof_invoices_v1";

function euro(x: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(x);
}

export default function TaxPage() {
  const profile: StoredUserProfile | null = useMemo(() => {
    const p = localStorage.getItem(LS_PROFILE);
    return p ? (JSON.parse(p) as StoredUserProfile) : null;
  }, []);

  const invoices: InvoiceItem[] = useMemo(() => {
    const inv = localStorage.getItem(LS_INVOICES);
    return inv ? (JSON.parse(inv) as InvoiceItem[]) : [];
  }, []);

  const currentYear = new Date().getFullYear();
  const fatturatoYear = useMemo(() => {
    return invoices
      .filter((x) => new Date(x.dateIso).getFullYear() === currentYear)
      .reduce((s, x) => s + (Number(x.importo) || 0), 0);
  }, [invoices, currentYear]);

  const [ccIAA, setCcIAA] = useState<number>(60);
  const [contributiPrev, setContributiPrev] = useState<number>(0);
  const [impostePrev, setImpostePrev] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState<any>(null);

  async function run() {
    setErr("");
    setResult(null);

    if (!profile) {
      setErr("Profilo fiscale non trovato. Completa l’onboarding.");
      return;
    }

    const input: FiscalYearInput = {
      year: currentYear,
      fatturato: fatturatoYear,
      contributiVersatiPrecedente: Number(contributiPrev) || 0,
      imposteVersatePrecedente: Number(impostePrev) || 0,
      ccIAA: Number(ccIAA) || 0,
      rivalsaCassaTotale: undefined,
    };

    setLoading(true);
    const r = await computeYear(profile, input);
    setLoading(false);

    if (!r.ok) {
      setErr(
        `Si è verificato un errore nel calcolo. Verifica che il backend sia avviato sulla porta 3001 e che esista l’endpoint /api/tax/compute-year. Dettaglio: ${r.error}`
      );
      return;
    }

    setResult(r.data);
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xl font-semibold">Imposte & F24</div>
            <div className="text-sm text-slate-300">
              Calcolo annuale usando il backend fiscale (mock).
            </div>
          </div>
          <div className="text-sm text-slate-300">
            Fatturato anno {currentYear}: <span className="font-semibold text-white">{euro(fatturatoYear)}</span>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div>
            <div className="text-xs text-slate-400">CCIAA</div>
            <input
              className="mt-1 w-full rounded-xl bg-slate-900 px-3 py-2 ring-1 ring-slate-700 focus:outline-none"
              type="number"
              value={ccIAA}
              onChange={(e) => setCcIAA(Number(e.target.value))}
            />
          </div>
          <div>
            <div className="text-xs text-slate-400">Contributi versati anno precedente</div>
            <input
              className="mt-1 w-full rounded-xl bg-slate-900 px-3 py-2 ring-1 ring-slate-700 focus:outline-none"
              type="number"
              value={contributiPrev}
              onChange={(e) => setContributiPrev(Number(e.target.value))}
            />
          </div>
          <div>
            <div className="text-xs text-slate-400">Imposte versate anno precedente</div>
            <input
              className="mt-1 w-full rounded-xl bg-slate-900 px-3 py-2 ring-1 ring-slate-700 focus:outline-none"
              type="number"
              value={impostePrev}
              onChange={(e) => setImpostePrev(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="mt-4">
          <button
            className="rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-slate-900 hover:brightness-110 transition disabled:opacity-60"
            onClick={run}
            disabled={loading}
          >
            {loading ? "Calcolo in corso…" : "Calcola imposte, contributi e F24"}
          </button>
        </div>

        {err && (
          <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-100">
            {err}
          </div>
        )}
      </div>

      {result && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="text-lg font-semibold">Risultato</div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Card label="Reddito lordo" value={euro(result.redditoImponibileLordo)} />
            <Card label="Reddito netto" value={euro(result.redditoImponibileNetto)} />
            <Card label="Imposta lorda" value={euro(result.impostaSostitutivaLorda)} />
            <Card label="Saldo imposta" value={euro(result.saldoImpostaSostitutiva)} />
            <Card label="F24 Giugno" value={euro(result.totaleF24Giugno)} />
            <Card label="F24 Novembre" value={euro(result.totaleF24Novembre)} />
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl ring-1 ring-slate-800">
            <table className="w-full text-sm">
              <tbody>
                <Row k="Contributi fissi" v={euro(result.contributiInpsFissi)} />
                <Row k="Contributi percentuali" v={euro(result.contributiInpsPercentuali)} />
                <Row k="Primo acconto imposta" v={euro(result.primoAccontoImposta)} />
                <Row k="Secondo acconto imposta" v={euro(result.secondoAccontoImposta)} />
                <Row k="Primo acconto contributi" v={euro(result.primoAccontoContributi)} />
                <Row k="Secondo acconto contributi" v={euro(result.secondoAccontoContributi)} />
                {typeof result.creditoDaCompensare === "number" && (
                  <Row k="Credito da compensare" v={euro(result.creditoDaCompensare)} />
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-5">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <tr className="border-t border-slate-800">
      <td className="px-4 py-3 text-slate-300">{k}</td>
      <td className="px-4 py-3 text-right font-semibold">{v}</td>
    </tr>
  );
}