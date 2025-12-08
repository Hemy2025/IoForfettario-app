// backend/tests/taxRules.test.ts
// Test del motore a regole per il regime forfettario – IoForfettario

import {
  computeFiscalYear,
  TAX_CONFIG,
  type UserTaxProfile,
  type FiscalYearInput,
} from "../src/rules/taxRules";

/**
 * NOTA IMPORTANTE:
 * Questi test sono allineati ai valori attuali di TAX_CONFIG.
 * Se in futuro aggiorni TAX_CONFIG (contributi fissi, soglie, aliquote),
 * vanno aggiornati anche i valori attesi nei test.
 */

describe("Motore forfettario – Caso A: Professionista, Gestione Separata", () => {
  it("Anno 0 – Professionista in gestione separata", () => {
    // Assicuriamoci che la gestione separata non applichi contributi % in questo test
    TAX_CONFIG.aliquotaPercGestioneSeparata = 0;

    const profile: UserTaxProfile = {
      category: "PROFESSIONISTA",
      previdenza: "GESTIONE_SEPARATA",
      hasCassaProfessionale: false,
      aliquotaImpostaSostitutiva: 0.05, // 5%
    };

    const input: FiscalYearInput = {
      year: 2025,
      fatturato: 60000,
      contributiVersatiPrecedente: 0,
      imposteVersatePrecedente: 0,
      ccIAA: 60,
      rivalsaCassaTotale: undefined,
    };

    const result = computeFiscalYear(profile, input);

    // Calcoli attesi (coerenti con TAX_CONFIG):
    //
    // coeff redditività professionista: 0.78
    // redditoLordo = 60.000 * 0.78 = 46.800
    //
    // contributi gestione separata: 0 (aliquotaPercGestioneSeparata = 0)
    //
    // redditoNetto = 46.800
    //
    // imposta lorda = 46.800 * 5% = 2.340
    // saldoImposta = 2.340 (Anno 0, nessuna imposta pregressa)
    //
    // acconti (50% + 50%):
    // primoAccontoImposta  = 1.170
    // secondoAccontoImposta = 1.170
    //
    // F24 giugno = saldoImposta + contributi% (0) + primo acconto + ccIAA
    //            = 2.340 + 1.170 + 60 = 3.570
    //
    // F24 novembre = secondo acconto = 1.170

    expect(result.year).toBe(2025);

    expect(result.redditoImponibileLordo).toBeCloseTo(46800, 2);
    expect(result.redditoImponibileNetto).toBeCloseTo(46800, 2);

    expect(result.contributiInpsFissi).toBeCloseTo(0, 2);
    expect(result.contributiInpsPercentuali).toBeCloseTo(0, 2);
    expect(result.contributiTotaliVersatiAnnoPrecedente).toBeCloseTo(0, 2);

    expect(result.impostaSostitutivaLorda).toBeCloseTo(2340, 2);
    expect(result.saldoImpostaSostitutiva).toBeCloseTo(2340, 2);

    expect(result.primoAccontoImposta).toBeCloseTo(1170, 2);
    expect(result.secondoAccontoImposta).toBeCloseTo(1170, 2);

    expect(result.primoAccontoContributi).toBeCloseTo(0, 2);
    expect(result.secondoAccontoContributi).toBeCloseTo(0, 2);

    expect(result.importoRivalsaCassa ?? 0).toBeCloseTo(0, 2);
    expect(result.creditoDaCompensare ?? 0).toBeCloseTo(0, 2);

    expect(result.totaleF24Giugno).toBeCloseTo(3570, 2);
    expect(result.totaleF24Novembre).toBeCloseTo(1170, 2);

    expect(result.warnings.length).toBe(0);
  });

  it("Anno 1 – Professionista in gestione separata (uso corretto di contributi/imposte anno precedente)", () => {
    TAX_CONFIG.aliquotaPercGestioneSeparata = 0;

    const profile: UserTaxProfile = {
      category: "PROFESSIONISTA",
      previdenza: "GESTIONE_SEPARATA",
      hasCassaProfessionale: false,
      aliquotaImpostaSostitutiva: 0.05,
    };

    // Anno 0 per ottenere i valori pregressi
    const year0: FiscalYearInput = {
      year: 2025,
      fatturato: 60000,
      contributiVersatiPrecedente: 0,
      imposteVersatePrecedente: 0,
      ccIAA: 60,
      rivalsaCassaTotale: undefined,
    };
    const resYear0 = computeFiscalYear(profile, year0);

    // Anno 1
    const year1: FiscalYearInput = {
      year: 2026,
      fatturato: 65000,
      contributiVersatiPrecedente:
        resYear0.contributiInpsPercentuali +
        resYear0.primoAccontoContributi +
        resYear0.secondoAccontoContributi,
      imposteVersatePrecedente:
        resYear0.impostaSostitutivaLorda +
        resYear0.primoAccontoImposta +
        resYear0.secondoAccontoImposta,
      ccIAA: 60,
      rivalsaCassaTotale: undefined,
    };

    const result = computeFiscalYear(profile, year1);

    // Valori attesi (con aliquotaGestioneSeparata = 0):
    //
    // redditoLordo = 65.000 * 0.78 = 50.700
    // contributiVersatiPrecedente = 0
    // redditoNetto = 50.700
    // impostaLorda = 50.700 * 5% = 2.535
    //
    // imposteVersatePrecedente (Anno 0):
    //   = 2.340 + 1.170 + 1.170 = 4.680
    // saldoImposta = 2.535 - 4.680 = -2.145 (credito)
    //
    // F24 Giugno:
    //   = saldoImposta (-2.145)
    //   + contributi% (0)
    //   + primo acconto imposta (1.267,5)
    //   + ccIAA (60)
    //   = -817,5
    //
    // F24 Novembre:
    //   = secondo acconto imposta = 1.267,5

    expect(result.redditoImponibileLordo).toBeCloseTo(50700, 2);
    expect(result.redditoImponibileNetto).toBeCloseTo(50700, 2);

    expect(result.impostaSostitutivaLorda).toBeCloseTo(2535, 2);
    expect(result.saldoImpostaSostitutiva).toBeCloseTo(-2145, 2);

    expect(result.creditoDaCompensare ?? 0).toBeCloseTo(2145, 2);

    expect(result.totaleF24Giugno).toBeCloseTo(-817.5, 2);
    expect(result.totaleF24Novembre).toBeCloseTo(1267.5, 2);
  });
});

describe("Motore forfettario – Caso B: Artigiano, Gestione Artigiani/Commercianti", () => {
  it("Anno 0 – Artigiano con contributi fissi + percentuali", () => {
    // Impostiamo parametri di esempio per Artigiani (da allineare a Excel/normativa reale)
    TAX_CONFIG.contributiFissiAnnuiArtigiani = 4000;
    TAX_CONFIG.sogliaContributiPercArtigiani = 17000;
    TAX_CONFIG.aliquotaPercArtigiani = 0.24;

    const profile: UserTaxProfile = {
      category: "ARTIGIANO",
      previdenza: "ARTIGIANI_COMMERCIANTI",
      hasCassaProfessionale: false,
      aliquotaImpostaSostitutiva: 0.05,
    };

    const input: FiscalYearInput = {
      year: 2025,
      fatturato: 40000,
      contributiVersatiPrecedente: 0,
      imposteVersatePrecedente: 0,
      ccIAA: 60,
      rivalsaCassaTotale: undefined,
    };

    const result = computeFiscalYear(profile, input);

    // Calcoli attesi:
    //
    // coeff redditività artigiano: 0.86
    // redditoLordo = 40.000 * 0.86 = 34.400
    //
    // contributi fissi: 4.000
    // soglia %: 17.000
    // eccedenza = 34.400 - 17.000 = 17.400
    // contributi % = 17.400 * 24% = 4.176
    //
    // redditoNetto = 34.400 - 4.000 - 4.176 = 26.224
    // imposta lorda = 26.224 * 5% = 1.311,2
    //
    // saldoImposta = 1.311,2
    //
    // acconti imposta (50/50):
    //   primo = secondo = 655,6
    //
    // acconti contributi (50/50 sulla quota %):
    //   primo = secondo = 2.088
    //
    // F24 Giugno:
    //   = saldoImposta (1.311,2)
    //   + contributi% (4.176)
    //   + primo acconto imposta (655,6)
    //   + primo acconto contributi (2.088)
    //   + ccIAA (60)
    //   = 8.290,8
    //
    // F24 Novembre:
    //   = secondo acconto imposta (655,6)
    //   + secondo acconto contributi (2.088)
    //   = 2.743,6

    expect(result.redditoImponibileLordo).toBeCloseTo(34400, 2);
    expect(result.contributiInpsFissi).toBeCloseTo(4000, 2);
    expect(result.contributiInpsPercentuali).toBeCloseTo(4176, 2);
    expect(result.redditoImponibileNetto).toBeCloseTo(26224, 2);

    expect(result.impostaSostitutivaLorda).toBeCloseTo(1311.2, 2);
    expect(result.saldoImpostaSostitutiva).toBeCloseTo(1311.2, 2);

    expect(result.primoAccontoImposta).toBeCloseTo(655.6, 2);
    expect(result.secondoAccontoImposta).toBeCloseTo(655.6, 2);

    expect(result.primoAccontoContributi).toBeCloseTo(2088, 2);
    expect(result.secondoAccontoContributi).toBeCloseTo(2088, 2);

    expect(result.totaleF24Giugno).toBeCloseTo(8290.8, 2);
    expect(result.totaleF24Novembre).toBeCloseTo(2743.6, 2);
  });

  it("Anno 1 – Artigiano con utilizzo dei contributi e imposte dell'anno precedente", () => {
    TAX_CONFIG.contributiFissiAnnuiArtigiani = 4000;
    TAX_CONFIG.sogliaContributiPercArtigiani = 17000;
    TAX_CONFIG.aliquotaPercArtigiani = 0.24;

    const profile: UserTaxProfile = {
      category: "ARTIGIANO",
      previdenza: "ARTIGIANI_COMMERCIANTI",
      hasCassaProfessionale: false,
      aliquotaImpostaSostitutiva: 0.05,
    };

    // Anno 0
    const year0: FiscalYearInput = {
      year: 2025,
      fatturato: 40000,
      contributiVersatiPrecedente: 0,
      imposteVersatePrecedente: 0,
      ccIAA: 60,
      rivalsaCassaTotale: undefined,
    };
    const resYear0 = computeFiscalYear(profile, year0);

    // Contributi e imposte versati l'anno precedente
    const contributiVersatiPrecedente =
      resYear0.contributiInpsPercentuali +
      resYear0.primoAccontoContributi +
      resYear0.secondoAccontoContributi; // 4.176 + 2.088 + 2.088 = 8.352

    const imposteVersatePrecedente =
      resYear0.impostaSostitutivaLorda +
      resYear0.primoAccontoImposta +
      resYear0.secondoAccontoImposta; // 1.311,2 + 655,6 + 655,6 = 2.622,4

    // Anno 1
    const year1: FiscalYearInput = {
      year: 2026,
      fatturato: 45000,
      contributiVersatiPrecedente,
      imposteVersatePrecedente,
      ccIAA: 60,
      rivalsaCassaTotale: undefined,
    };

    const result = computeFiscalYear(profile, year1);

    // Calcoli attesi di massima (riassunto):
    //
    // redditoLordo = 45.000 * 0.86 = 38.700
    // redditoNetto = 38.700 - 8.352 = 30.348
    // impostaLorda = 30.348 * 5% = 1.517,4
    // saldoImposta = 1.517,4 - 2.622,4 = -1.105 (credito)
    //
    // contributi% anno 1:
    //   eccedenza = 38.700 - 17.000 = 21.700
    //   contributi% = 21.700 * 24% = 5.208
    //
    // F24 Giugno e Novembre dipendono da acconti su imposta e contributi% anno 1.
    // Qui verifichiamo soprattutto:
    // - uso corretto di contributiVersatiPrecedente nel redditoNetto
    // - uso corretto di imposteVersatePrecedente nel saldoImposta

    expect(result.redditoImponibileLordo).toBeCloseTo(38700, 2);
    expect(result.redditoImponibileNetto).toBeCloseTo(30348, 2);

    expect(result.impostaSostitutivaLorda).toBeCloseTo(1517.4, 2);
    expect(result.saldoImpostaSostitutiva).toBeCloseTo(-1105, 2);

    expect(result.creditoDaCompensare ?? 0).toBeCloseTo(1105, 2);

    // Verifichiamo che i contributi percentuali siano calcolati sulla nuova eccedenza
    expect(result.contributiInpsPercentuali).toBeCloseTo(5208, 2);
  });
});

describe("Motore forfettario – Caso C: Commerciante, Gestione Artigiani/Commercianti", () => {
  it("Anno 0 – Commerciante con contributi fissi + percentuali", () => {
    // Parametri di esempio per Commercianti (da allineare a dati reali)
    TAX_CONFIG.contributiFissiAnnuiCommercianti = 3800;
    TAX_CONFIG.sogliaContributiPercCommercianti = 18000;
    TAX_CONFIG.aliquotaPercCommercianti = 0.24;

    const profile: UserTaxProfile = {
      category: "COMMERCIANTE",
      previdenza: "ARTIGIANI_COMMERCIANTI",
      hasCassaProfessionale: false,
      aliquotaImpostaSostitutiva: 0.15, // tipicamente 15%
    };

    const input: FiscalYearInput = {
      year: 2025,
      fatturato: 50000,
      contributiVersatiPrecedente: 0,
      imposteVersatePrecedente: 0,
      ccIAA: 60,
      rivalsaCassaTotale: undefined,
    };

    const result = computeFiscalYear(profile, input);

    // Calcoli attesi:
    //
    // coeff redditività commerciante: 0.40
    // redditoLordo = 50.000 * 0.40 = 20.000
    //
    // contributi fissi: 3.800
    // soglia %: 18.000
    // eccedenza = 20.000 - 18.000 = 2.000
    // contributi % = 2.000 * 24% = 480
    //
    // redditoNetto = 20.000 - 3.800 - 480 = 15.720
    //
    // imposta lorda (15%):
    //   = 15.720 * 15% = 2.358
    //
    // saldoImposta = 2.358
    //
    // acconti imposta (50/50):
    //   primo = secondo = 1.179
    //
    // acconti contributi%:
    //   primo = secondo = 240
    //
    // F24 Giugno:
    //   = saldoImposta (2.358)
    //   + contributi% (480)
    //   + primo acconto imposta (1.179)
    //   + primo acconto contributi (240)
    //   + ccIAA (60)
    //   = 4.317
    //
    // F24 Novembre:
    //   = secondo acconto imposta (1.179)
    //   + secondo acconto contributi (240)
    //   = 1.419

    expect(result.redditoImponibileLordo).toBeCloseTo(20000, 2);
    expect(result.contributiInpsFissi).toBeCloseTo(3800, 2);
    expect(result.contributiInpsPercentuali).toBeCloseTo(480, 2);
    expect(result.redditoImponibileNetto).toBeCloseTo(15720, 2);

    expect(result.impostaSostitutivaLorda).toBeCloseTo(2358, 2);
    expect(result.saldoImpostaSostitutiva).toBeCloseTo(2358, 2);

    expect(result.primoAccontoImposta).toBeCloseTo(1179, 2);
    expect(result.secondoAccontoImposta).toBeCloseTo(1179, 2);

    expect(result.primoAccontoContributi).toBeCloseTo(240, 2);
    expect(result.secondoAccontoContributi).toBeCloseTo(240, 2);

    expect(result.totaleF24Giugno).toBeCloseTo(4317, 2);
    expect(result.totaleF24Novembre).toBeCloseTo(1419, 2);
  });

  it("Anno 1 – Commerciante con utilizzo dei contributi e imposte anno precedente", () => {
    TAX_CONFIG.contributiFissiAnnuiCommercianti = 3800;
    TAX_CONFIG.sogliaContributiPercCommercianti = 18000;
    TAX_CONFIG.aliquotaPercCommercianti = 0.24;

    const profile: UserTaxProfile = {
      category: "COMMERCIANTE",
      previdenza: "ARTIGIANI_COMMERCIANTI",
      hasCassaProfessionale: false,
      aliquotaImpostaSostitutiva: 0.15,
    };

    // Anno 0
    const year0: FiscalYearInput = {
      year: 2025,
      fatturato: 50000,
      contributiVersatiPrecedente: 0,
      imposteVersatePrecedente: 0,
      ccIAA: 60,
      rivalsaCassaTotale: undefined,
    };
    const resYear0 = computeFiscalYear(profile, year0);

    const contributiVersatiPrecedente =
      resYear0.contributiInpsPercentuali +
      resYear0.primoAccontoContributi +
      resYear0.secondoAccontoContributi; // 480 + 240 + 240 = 960

    const imposteVersatePrecedente =
      resYear0.impostaSostitutivaLorda +
      resYear0.primoAccontoImposta +
      resYear0.secondoAccontoImposta; // 2.358 + 1.179 + 1.179 = 4.716

    // Anno 1
    const year1: FiscalYearInput = {
      year: 2026,
      fatturato: 52000,
      contributiVersatiPrecedente,
      imposteVersatePrecedente,
      ccIAA: 60,
      rivalsaCassaTotale: undefined,
    };

    const result = computeFiscalYear(profile, year1);

    // Calcoli attesi di massima:
    //
    // redditoLordo = 52.000 * 0.40 = 20.800
    // redditoNetto = 20.800 - 960 = 19.840
    // impostaLorda = 19.840 * 15% = 2.976
    // saldoImposta = 2.976 - 4.716 = -1.740 (credito)
    //
    // contributi% anno 1:
    //   eccedenza = 20.800 - 18.000 = 2.800
    //   contributi% = 2.800 * 24% = 672
    //
    // F24 Giugno e Novembre dipendono da nuovi acconti;
    // qui verifichiamo uso corretto dei valori pregressi e delle formule.

    expect(result.redditoImponibileLordo).toBeCloseTo(20800, 2);
    expect(result.redditoImponibileNetto).toBeCloseTo(19840, 2);

    expect(result.impostaSostitutivaLorda).toBeCloseTo(2976, 2);
    expect(result.saldoImpostaSostitutiva).toBeCloseTo(-1740, 2);

    expect(result.creditoDaCompensare ?? 0).toBeCloseTo(1740, 2);

    expect(result.contributiInpsPercentuali).toBeCloseTo(672, 2);
  });
});
