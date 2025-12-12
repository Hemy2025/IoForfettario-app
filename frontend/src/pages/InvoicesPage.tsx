// frontend/src/pages/InvoicesPage.tsx
import { useMemo, useState } from "react";

const LS_INVOICES = "iof_invoices_v1";
const LS_PROFILE = "iof_user_profile_v1";

type Invoice = {
  id: string;
  dateIso: string;
  amount: number;
};

function eur(x: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(x);
}

function loadInvoices(): Invoice[] {
  try {
    const raw = localStorage.getItem(LS_INVOICES);
    return raw ? (JSON.parse(raw) as Invoice[]) : [];
  } catch {
    return [];
  }
}

function saveInvoices(items: Invoice[]) {
  localStorage.setItem(LS_INVOICES, JSON.stringify(items));
}

export default function InvoicesPage() {
  const [items, setItems] = useState<Invoice[]>(() => loadInvoices());
  const [amount, setAmount] = useState<number>(1000);
  const [toast, setToast] = useState<string | null>(null);

  const fatturato = useMemo(() => items.reduce((s, x) => s + x.amount, 0), [items]);

  const residuo = useMemo(() => {
    const tetto = 85000;
    return tetto - fatturato;
  }, [fatturato]);

  // MVP: suggerimento semplice (poi lo colleghiamo al backend “accantonamento per fattura”)
  const suggerimentoAccantonamento = useMemo(() => {
    // fallback prudenziale 30% finché non agganciamo endpoint dedicato
    return Math.max(0, amount * 0.3);
  }, [amount]);

  function addInvoice() {
    if (!amount || amount <= 0) {
      setToast("Inserisci un importo valido.");
      return;
    }

    const inv: Invoice = {
      id: crypto.randomUUID(),
      dateIso: new Date().toISOString(),
      amount,
    };

    const next = [inv, ...items];
    setItems(next);
    saveInvoices(next);

    setToast(
      `Fattura registrata. Suggerimento: metti da parte ${eur(
        suggerimentoAccantonamento
      )} per stare tranquillo.`
    );
    setTimeout(() => setToast(null), 3500);
  }

  const hasProfile = useMemo(() => !!localStorage.getItem(LS_PROFILE), []);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 shadow">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Le tue fatture</h1>
            <p className="mt-1 text-slate-300">
              Ogni fattura aggiorna la tua situazione e ti suggerisce quanto accantonare.
            </p>
            {!hasProfile && (
              <p className="mt-2 text-sm text-amber-300">
                Nota: non hai ancora salvato il profilo fiscale. Vai su “Il tuo profilo”.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm">
            <div className="text-slate-400">Residuo per restare nel forfettario</div>
            <div className="mt-1 text-lg font-semibold">
              {eur(Math.max(0, residuo))}{" "}
              <span className="text-xs text-slate-400">su € 85.000</span>
            </div>
            {residuo < 0 && (
              <div className="mt-2 text-xs text-rose-300">
                Hai superato il limite: serve valutare il passaggio di regime.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add invoice */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 shadow">
        <div className="grid gap-4 md:grid-cols-3 md:items-end">
          <div className="md:col-span-2">
            <label className="text-sm font-semibold">Importo fattura</label>
            <input
              type="number"
              className="mt-2 w-full rounded-2xl bg-slate-950/40 px-4 py-3 ring-1 ring-slate-700 focus:outline-none focus:ring-emerald-500/40"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min={0}
              step={50}
            />
            <div className="mt-2 text-xs text-slate-400">
              Suggerimento prudenziale (MVP): accantona circa <b>{eur(suggerimentoAccantonamento)}</b>.
            </div>
          </div>

          <button
            onClick={addInvoice}
            className="rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-slate-900 hover:brightness-110 transition ring-1 ring-emerald-400/30"
          >
            Aggiorna la mia situazione
          </button>
        </div>

        {toast && (
          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            {toast}
          </div>
        )}
      </div>

      {/* List */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 shadow">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Storico</div>
          <div className="text-sm text-slate-300">
            Totale fatturato: <b>{eur(fatturato)}</b>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4 text-sm text-slate-300">
              Nessuna fattura ancora. Aggiungine una per iniziare.
            </div>
          ) : (
            items.map((x) => (
              <div
                key={x.id}
                className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/30 p-4"
              >
                <div className="text-sm text-slate-300">
                  {new Date(x.dateIso).toLocaleDateString("it-IT")}
                </div>
                <div className="text-sm font-semibold">{eur(x.amount)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}