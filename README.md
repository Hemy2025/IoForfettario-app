# IoForfettario – Full MVP Application  
Automazione fiscale per il Regime Forfettario. Fatturazione elettronica. Integrazione PSD2.

IoForfettario è un’applicazione fintech progettata per **automatizzare completamente** la gestione fiscale degli autonomi in regime forfettario, offrendo:

- calcolo automatico imposte, contributi, F24, acconti e reddito imponibile
- generazione fac-simile F24 PDF (prossima release)
- ciclo completo di fatturazione elettronica (integrazione Aruba API – mock incluso)
- connessione ai conti correnti tramite PSD2 (Fabrick – mock incluso)
- onboarding, prova gratuita 30 giorni, dashboard fiscale, accantonamenti
- flussi dedicati per commercialisti partner e backoffice amministrativo

Questo repository contiene l’**MVP completo** e funzionante, strutturato come un **monorepo** con backend Node/TypeScript e frontend React (in fase di sviluppo).

---

# 📌 Stato del progetto

- ✔ Motore fiscale 100% completo e validato tramite foglio Excel
- ✔ Backend mock API pienamente funzionante (tax, PSD2, fatture elettroniche)
- ✔ Test automatici Jest tutti superati
- ✔ Architettura repository definita
- ⏳ Frontend React in fase di implementazione
- ⏳ Integrazione reale con Aruba e Fabrick (previa sottoscrizione contratti)

---

# 🧠 Funzionalità principali (MVP)

### 🔢 **1. Motore Fiscale Completo (Regime Forfettario)**
- coefficienti di redditività (0.78, 0.86, 0.40)
- gestione contributi INPS:
  - gestione separata
  - artigiani / commercianti (contributi fissi + percentuali su eccedenza)
  - casse professionali + rivalsa 4%
- imposta sostitutiva 5% / 15%
- acconti 50% + 50%
- calcolo saldo F24 giugno + novembre
- propagazione multi-anno (Anno 0 → Anni successivi)

### 🧾 **2. Mock Fatturazione Elettronica (Aruba-like API)**
- invio fattura (`POST /api/fatture/invia`)
- stato fattura (`GET /api/fatture/:id`)
- generazione PDF mock
- archivio fatture

### 🏦 **3. Mock PSD2 (Fabrick-like API)**
- elenco conti correnti (`GET /api/bank/accounts`)
- movimenti per conto (`GET /api/bank/accounts/:id/transactions`)
- categorie transazioni
- saldo aggiornato

### 🧑‍💻 **4. Backend REST Node/TypeScript**
- Express.js
- architettura modulare
- test Jest integrati

### 🧭 **5. Frontend React (in sviluppo)**
- onboarding con prova gratuita 30 giorni
- richiesta carta al termine del trial
- dashboard fiscale con simulatore in tempo reale
- gestione fatture, movimenti, accantonamenti

---

# 🏗 Architettura generale

```text
┌─────────────────────────────────────────────────────────┐
│                         Frontend                        │
│                 (React SPA – in sviluppo)               │
│                                                         │
│ • Onboarding + Trial                                    │
│ • Dashboard Fiscale (simulatore anno corrente)          │
│ • Conti PSD2 + Movimenti                                │
│ • Emissione fatture elettroniche                        │
│ • Profilo fiscale                                       │
└───────────────▲─────────────────────────────────────────┘
                │ REST API (HTTPS)
                ▼
┌─────────────────────────────────────────────────────────┐
│                       Backend NodeTS                    │
│                                                         │
│  /api/tax/...        → Motore fiscale IoForfettario     │
│  /api/bank/...       → Mock PSD2 Fabrick                │
│  /api/fatture/...    → Mock SDI Aruba                   │
│                                                         │
└───────────────▲─────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────┐
│                 Provider esterni (reali)                │
│               (attivazione prevista)                    │
│                                                         │
│ • Aruba FatturaPA API                                   │
│ • Fabrick PSD2 AIS/PIS                                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
## 📁 Struttura del repository
IoForfettario-app/
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── taxRoutes.ts        # Rotte motore fiscale
│   │   │   ├── mockBank.ts         # Mock API PSD2
│   │   │   └── mockFatture.ts      # Mock API fatture elettroniche
│   │   ├── rules/
│   │   │   └── taxRules.ts         # Motore fiscale completo
│   │   └── server.ts               # Server Express principale
│   ├── tests/
│   │   └── taxRules.test.ts        # Test Jest (validazione Excel → codice)
│   ├── package.json
│   ├── jest.config.cjs
│   └── tsconfig.json
│
├── docs/
│   └── rules-spec.md               # Documento tecnico del motore a regole
│
└── README.md                       # Questo documento