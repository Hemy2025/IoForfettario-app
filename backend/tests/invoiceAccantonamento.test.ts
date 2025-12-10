import {
  computeAccantonamentoPerFattura,
  TAX_CONFIG,
  type UserTaxProfile,
  type YearTaxContext,
} from "../src/rules/taxRules";

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

describe("Accantonamento per fattura – logica di base", () => {
  const profile: UserTaxProfile = {
    category: "PROFESSIONISTA",
    previdenza: "GESTIONE_SEPARATA",
    hasCassaProfessionale: false,
    aliquotaImpostaSostitutiva: 0.05,
  };

  it("calcola un accantonamento coerente e residuo sul tetto 85.000€", () => {
    const ctx: YearTaxContext = {
      profile,
      year: 2025,
      fatturatoYTD: 60000,
      contributiVersatiPrecedente: 0,
      imposteVersatePrecedente: 0,
      ccIAA: 60,
    };

    const importoFattura = 1000;

    const result = computeAccantonamentoPerFattura(ctx, importoFattura);

    expect(result.fatturatoYtdPrima).toBe(60000);
    expect(result.fatturatoYtdDopo).toBe(61000);

    const expectedResiduo =
      TAX_CONFIG.tettoForfettarioAnnuale - result.fatturatoYtdDopo;

    expect(round2(result.residuoFatturabile)).toBeCloseTo(
      round2(expectedResiduo),
      2
    );

    // L'accantonamento totale deve essere >= 0
    expect(result.accantonamentoTotale).toBeGreaterThanOrEqual(0);

    // Se la fattura è > 0, la percentuale ha senso (0 <= p <= 1, tipicamente molto meno di 1)
    expect(result.percentualeSuFattura).toBeGreaterThanOrEqual(0);
    expect(result.percentualeSuFattura).toBeLessThanOrEqual(1);

    // Con 61.000€ non dobbiamo aver superato il tetto forfettario
    expect(result.haSuperatoSoglia).toBe(false);
  });

  it("se il fatturato supera 85.000€, segnala superamento soglia", () => {
    const ctx: YearTaxContext = {
      profile,
      year: 2025,
      fatturatoYTD: 84900,
      contributiVersatiPrecedente: 0,
      imposteVersatePrecedente: 0,
      ccIAA: 60,
    };

    const importoFattura = 500;

    const result = computeAccantonamentoPerFattura(ctx, importoFattura);

    expect(result.fatturatoYtdDopo).toBe(85400);
    expect(result.haSuperatoSoglia).toBe(true);
    expect(result.residuoFatturabile).toBeLessThan(0);
  });
});