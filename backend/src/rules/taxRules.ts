// backend/src/rules/taxRules.ts
// Motore a regole per il regime forfettario – IoForfettario

export type CategoriaForfettario = "PROFESSIONISTA" | "ARTIGIANO" | "COMMERCIANTE";
export type GestionePrevidenza = "GESTIONE_SEPARATA" | "ARTIGIANI_COMMERCIANTI";

export interface UserTaxProfile {
  category: CategoriaForfettario;
  previdenza: GestionePrevidenza;
  hasCassaProfessionale: boolean;
  aliquotaImpostaSostitutiva: number; // es. 0.05 o 0.15
}

export interface FiscalYearInput {
  year: number;
  fatturato: number;
  contributiVersatiPrecedente: number;
  imposteVersatePrecedente: number;
  ccIAA: number;
  rivalsaCassaTotale?: number;
}

export interface FiscalYearResult {
  year: number;
  redditoImponibileLordo: number;
  redditoImponibileNetto: number;
  contributiInpsFissi: number;
  contributiInpsPercentuali: number;
  contributiTotaliVersatiAnnoPrecedente: number;
  impostaSostitutivaLorda: number;
  saldoImpostaSostitutiva: number; // può essere anche NEGATIVO (crediti)
  primoAccontoImposta: number;
  secondoAccontoImposta: number;
  primoAccontoContributi: number;
  secondoAccontoContributi: number;
  creditoDaCompensare?: number;
  totaleF24Giugno: number;
  totaleF24Novembre: number;
  warnings: string[];
}

export interface MultiYearInput {
  profile: UserTaxProfile;
  ccIAA: number;
  anni: Array<{ year: number; fatturato: number }>;
}

export interface MultiYearResult {
  profile: UserTaxProfile;
  ccIAA: number;
  anni: FiscalYearResult[];
}

export const TAX_CONFIG = {
  // Coefficienti di redditività
  coeffProfessionista: 0.78,
  coeffArtigiano: 0.86,
  coeffCommerciante: 0.4,

  // Gestioni previdenziali
  aliquotaPercGestioneSeparata: 0.2607,

  contributiFissiAnnuiArtigiani: 4549.7,
  sogliaContributiPercArtigiani: 18415.01,
  aliquotaPercArtigiani: 0.2448,

  contributiFissiAnnuiCommercianti: 4549.7,
  sogliaContributiPercCommercianti: 18415.01,
  aliquotaPercCommercianti: 0.2448,

  // Acconti
  accontoPercentuale: 0.5,

  // Tetto massimo regime forfettario
  tettoForfettarioAnnuale: 85000,
};

// ---------- Utility interna ----------

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

// ---------- Motore di calcolo per singolo anno ----------

export function computeFiscalYear(
  profile: UserTaxProfile,
  input: FiscalYearInput
): FiscalYearResult {
  const warnings: string[] = [];

  // 1) Reddito imponibile lordo
  let redditoLordo = 0;
  if (profile.category === "PROFESSIONISTA") {
    redditoLordo = input.fatturato * TAX_CONFIG.coeffProfessionista;
  } else if (profile.category === "ARTIGIANO") {
    redditoLordo = input.fatturato * TAX_CONFIG.coeffArtigiano;
  } else {
    redditoLordo = input.fatturato * TAX_CONFIG.coeffCommerciante;
  }

  const isFirstYear =
    input.contributiVersatiPrecedente === 0 &&
    input.imposteVersatePrecedente === 0;

  // 2) Contributi previdenziali dell'anno corrente
  let contributiFissi = 0;
  let contributiPerc = 0;

  if (profile.previdenza === "GESTIONE_SEPARATA") {
    contributiFissi = 0;
    contributiPerc = redditoLordo * TAX_CONFIG.aliquotaPercGestioneSeparata;
  } else {
    if (profile.category === "ARTIGIANO") {
      contributiFissi = TAX_CONFIG.contributiFissiAnnuiArtigiani;
      const ecc = Math.max(
        0,
        redditoLordo - TAX_CONFIG.sogliaContributiPercArtigiani
      );
      contributiPerc = ecc * TAX_CONFIG.aliquotaPercArtigiani;
    } else {
      contributiFissi = TAX_CONFIG.contributiFissiAnnuiCommercianti;
      const ecc = Math.max(
        0,
        redditoLordo - TAX_CONFIG.sogliaContributiPercCommercianti
      );
      contributiPerc = ecc * TAX_CONFIG.aliquotaPercCommercianti;
    }
  }

  // 3) Reddito netto imponibile ai fini imposta sostitutiva
  let redditoNetto: number;
  if (profile.previdenza === "GESTIONE_SEPARATA") {
    // Professionista in gestione separata:
    // anno 0 → non si deducono contributi
    // anno 1+ → si deducono i contributi versati nell'anno precedente
    if (isFirstYear) {
      redditoNetto = redditoLordo;
    } else {
      redditoNetto = redditoLordo - input.contributiVersatiPrecedente;
    }
  } else {
    // Artigiani/commercianti:
    // anno 0 → si deducono contributi fissi + %
    // anno 1+ → si deducono i contributi versati anno precedente
    if (isFirstYear) {
      redditoNetto = redditoLordo - contributiFissi - contributiPerc;
    } else {
      redditoNetto = redditoLordo - input.contributiVersatiPrecedente;
    }
  }

  // 4) Imposta sostitutiva
  const impostaLorda = redditoNetto * profile.aliquotaImpostaSostitutiva;

  // saldoImposta può essere anche negativo: NON lo azzeriamo
  const saldoImposta = impostaLorda - input.imposteVersatePrecedente;

  let creditoDaCompensare: number | undefined;
  if (saldoImposta < 0) {
    creditoDaCompensare = round2(-saldoImposta);
    warnings.push(
      "Dalle imposte versate l'anno precedente risulta un credito da compensare."
    );
  }

  // 5) Acconti imposta e contributi
  const baseAccontoImposta = saldoImposta > 0 ? saldoImposta : 0;
  const primoAccImposta =
    baseAccontoImposta * TAX_CONFIG.accontoPercentuale;
  const secondoAccImposta = primoAccImposta;

  const baseAccontoContributi =
    contributiFissi + contributiPerc;
  const primoAccContributi =
    baseAccontoContributi * TAX_CONFIG.accontoPercentuale;
  const secondoAccContributi = primoAccContributi;

  // 6) Totali F24
  const totaleF24Giugno =
    (saldoImposta > 0 ? saldoImposta : 0) +
    contributiFissi +
    contributiPerc +
    primoAccImposta +
    primoAccContributi +
    input.ccIAA;

  const totaleF24Novembre = secondoAccImposta + secondoAccContributi;

  return {
    year: input.year,
    redditoImponibileLordo: round2(redditoLordo),
    redditoImponibileNetto: round2(redditoNetto),
    contributiInpsFissi: round2(contributiFissi),
    contributiInpsPercentuali: round2(contributiPerc),
    contributiTotaliVersatiAnnoPrecedente: round2(
      input.contributiVersatiPrecedente
    ),
    impostaSostitutivaLorda: round2(impostaLorda),
    saldoImpostaSostitutiva: round2(saldoImposta),
    primoAccontoImposta: round2(primoAccImposta),
    secondoAccontoImposta: round2(secondoAccImposta),
    primoAccontoContributi: round2(primoAccContributi),
    secondoAccontoContributi: round2(secondoAccContributi),
    creditoDaCompensare,
    totaleF24Giugno: round2(totaleF24Giugno),
    totaleF24Novembre: round2(totaleF24Novembre),
    warnings,
  };
}

// ---------- Motore multi-anno ----------

export function computeMultiYear(input: MultiYearInput): MultiYearResult {
  const risultati: FiscalYearResult[] = [];
  let contributiPrev = 0;
  let impostePrev = 0;

  for (const anno of input.anni) {
    const yearInput: FiscalYearInput = {
      year: anno.year,
      fatturato: anno.fatturato,
      contributiVersatiPrecedente: contributiPrev,
      imposteVersatePrecedente: impostePrev,
      ccIAA: input.ccIAA,
    };

    const res = computeFiscalYear(input.profile, yearInput);
    risultati.push(res);

    contributiPrev =
      res.contributiInpsFissi +
      res.contributiInpsPercentuali +
      res.primoAccontoContributi +
      res.secondoAccontoContributi;

    impostePrev =
      res.impostaSostitutivaLorda +
      res.primoAccontoImposta +
      res.secondoAccontoImposta;
  }

  return {
    profile: input.profile,
    ccIAA: input.ccIAA,
    anni: risultati,
  };
}

// ---------- Accantonamento per fattura ----------

// Per i test usiamo un tipo "aperto"
export type YearTaxContext = any;

export interface AccantonamentoResult {
  // campi usati dalla UI attuale
  accantonamentoSuggerito: number;
  fatturatoCumAggiornato: number;
  residuoVersoTetto: number;
  superaTetto: boolean;

  // campi richiesti dai test esistenti
  fatturatoYtdPrima: number;
  fatturatoYtdDopo: number;
  residuoFatturabile: number;
  accantonamentoTotale: number;
  percentualeSuFattura: number;
  haSuperatoSoglia: boolean;
}

export function computeAccantonamentoPerFattura(
  ctx: YearTaxContext,
  imponibileFattura: number
): AccantonamentoResult {
  const profile: UserTaxProfile = ctx.profile;

  // Leggi il fatturato YTD da più nomi possibili, per compatibilità con i test
  const fatturatoCumAnno: number =
    ctx.fatturatoCumAnno ??
    ctx.fatturatoYtd ??
    ctx.fatturatoYtdPrima ??
    ctx.fatturatoAnno ??
    ctx.fatturatoAnnoCorrente ??
    ctx.yearInputBase?.fatturato ??
    ctx.yearBaseInput?.fatturato ??
    ctx.baseYearInput?.fatturato ??
    0;

  // Costruiamo un "baseYearInput" robusto:
  const baseYearInput: FiscalYearInput =
    ctx.yearInputBase ||
    ctx.yearBaseInput ||
    ctx.baseYearInput || {
      year: ctx.year ?? new Date().getFullYear(),
      fatturato: fatturatoCumAnno,
      contributiVersatiPrecedente:
        ctx.contributiVersatiPrecedente ?? 0,
      imposteVersatePrecedente:
        ctx.imposteVersatePrecedente ?? 0,
      ccIAA: ctx.ccIAA ?? 0,
      rivalsaCassaTotale: ctx.rivalsaCassaTotale,
    };

  // Scenario A: prima della fattura
  const inputPrima: FiscalYearInput = {
    year: baseYearInput.year,
    fatturato: fatturatoCumAnno,
    contributiVersatiPrecedente:
      baseYearInput.contributiVersatiPrecedente ?? 0,
    imposteVersatePrecedente:
      baseYearInput.imposteVersatePrecedente ?? 0,
    ccIAA: baseYearInput.ccIAA ?? 0,
    rivalsaCassaTotale: baseYearInput.rivalsaCassaTotale,
  };

  // Scenario B: dopo la fattura
  const fatturatoDopo = fatturatoCumAnno + imponibileFattura;
  const inputDopo: FiscalYearInput = {
    ...inputPrima,
    fatturato: fatturatoDopo,
  };

  const resPrima = computeFiscalYear(profile, inputPrima);
  const resDopo = computeFiscalYear(profile, inputDopo);

  const totaleF24Prima =
    resPrima.totaleF24Giugno + resPrima.totaleF24Novembre;
  const totaleF24Dopo =
    resDopo.totaleF24Giugno + resDopo.totaleF24Novembre;

  const accantonamentoTotaleRaw = totaleF24Dopo - totaleF24Prima;
  const accantonamentoTotale =
    accantonamentoTotaleRaw >= 0 ? accantonamentoTotaleRaw : 0;

  const residuo =
    TAX_CONFIG.tettoForfettarioAnnuale - fatturatoDopo;

  const percentualeSuFattura =
    imponibileFattura > 0
      ? accantonamentoTotale / imponibileFattura
      : 0;

  const haSuperatoSoglia =
    fatturatoDopo > TAX_CONFIG.tettoForfettarioAnnuale;

  return {
    // campi per la UI
    accantonamentoSuggerito: round2(accantonamentoTotale),
    fatturatoCumAggiornato: round2(fatturatoDopo),
    residuoVersoTetto: round2(Math.max(0, residuo)),
    superaTetto: haSuperatoSoglia,

    // campi per i test
    fatturatoYtdPrima: round2(fatturatoCumAnno),
    fatturatoYtdDopo: round2(fatturatoDopo),
    residuoFatturabile: round2(residuo),
    accantonamentoTotale: round2(accantonamentoTotale),
    percentualeSuFattura,
    haSuperatoSoglia,
  };
}