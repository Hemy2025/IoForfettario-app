// backend/tests/taxRules.test.ts
// Test del motore a regole per il regime forfettario – Caso A

import {
  computeFiscalYear,
  type UserTaxProfile,
  type FiscalYearInput,
} from "../src/rules/taxRules";

describe("Motore forfettario – Caso A: Professionista, Gestione Separata, Anno 0", () => {
  it("calcola correttamente imponibile, imposta e F24 per un professionista in gestione separata", () => {
    // PROFILO UTENTE:
    // - Professionista
    // - Gestione separata
    // - Aliquota imposta sostitutiva: 5%
    const profile: UserTaxProfile = {
      category: "PROFESSIONISTA",
      previdenza: "GESTIONE_SEPARATA",
      hasCassaProfessionale: false,
      aliquotaImpostaSostitutiva: 0.05,
    };

    // INPUT ANNO 0:
    // - Fatturato: 60.000 €
    // - Nessun contributo versato in precedenza
    // - Nessuna imposta versata in precedenza
    // - CCIAA: 60 €
    const input: FiscalYearInput = {
      year: 2025,
      fatturato: 60000,
      contributiVersatiPrecedente: 0,
      imposteVersatePrecedente: 0,
      ccIAA: 60,
      rivalsaCassaTotale: undefined,
    };

    const result = computeFiscalYear(profile, input);

    // Aspettative (coerenti con TAX_CONFIG attuale):
    //
    // coefficiente redditività professionista: 0.78
    // redditoLordo = 60.000 * 0.78 = 46.800
    //
    // contributi INPS gestione separata: 0, perché TAX_CONFIG.aliquotaPercGestioneSeparata = 0
    //
    // redditoNetto = 46.800 - 0 - 0 = 46.800
    //
    // imposta lorda = 46.800 * 5% = 2.340
    //
    // saldo imposta (Anno 0, nessuna imposta versata):
    // saldoImposta = 2.340 - 0 = 2.340
    //
    // acconti (50% + 50% sulla base imposta lorda):
    // primoAccontoImposta  = 2.340 * 0.5 = 1.170
    // secondoAccontoImposta = 2.340 * 0.5 = 1.170
    //
    // contributi percentuali = 0, quindi acconti contributi = 0
    //
    // F24 giugno:
    // totaleF24Giugno = saldoImposta
    //                 + contributiPercentuali (0)
    //                 + primoAccontoImposta
    //                 + primoAccontoContributi (0)
    //                 + ccIAA (60)
    //               = 2.340 + 1.170 + 60 = 3.570
    //
    // F24 novembre:
    // totaleF24Novembre = secondoAccontoImposta + secondoAccontoContributi (0)
    //                   = 1.170

    expect(result.year).toBe(2025);

    // Redditi
    expect(result.redditoImponibileLordo).toBeCloseTo(46800, 2);
    expect(result.redditoImponibileNetto).toBeCloseTo(46800, 2);

    // Contributi
    expect(result.contributiInpsFissi).toBeCloseTo(0, 2);
    expect(result.contributiInpsPercentuali).toBeCloseTo(0, 2);
    expect(result.contributiTotaliVersatiAnnoPrecedente).toBeCloseTo(0, 2);

    // Imposte
    expect(result.impostaSostitutivaLorda).toBeCloseTo(2340, 2);
    expect(result.saldoImpostaSostitutiva).toBeCloseTo(2340, 2);

    // Acconti
    expect(result.primoAccontoImposta).toBeCloseTo(1170, 2);
    expect(result.secondoAccontoImposta).toBeCloseTo(1170, 2);

    expect(result.primoAccontoContributi).toBeCloseTo(0, 2);
    expect(result.secondoAccontoContributi).toBeCloseTo(0, 2);

    // Rivalsa e crediti
    expect(result.importoRivalsaCassa ?? 0).toBeCloseTo(0, 2);
    expect(result.creditoDaCompensare ?? 0).toBeCloseTo(0, 2);

    // F24
    expect(result.totaleF24Giugno).toBeCloseTo(3570, 2);
    expect(result.totaleF24Novembre).toBeCloseTo(1170, 2);

    // Nessun warning previsto per questo caso
    expect(result.warnings.length).toBe(0);
  });
});
