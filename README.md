# MediStock

MediStock is a local pharmacy inventory intelligence prototype built around the idea **“Pharmacy intelligence, visualized.”** It combines shared medicine, supplier, and transaction data with inventory health, expiry risk, restocking, supplier, and reporting workflows.

## Routes

- `/` — visual product story and data-driven pharmacy scene
- `/dashboard` — inventory command center
- `/inventory` — searchable inventory table, detail, edit, delete, and restock workflows
- `/expiry-alerts` — expiry radar and operational alert groups
- `/suppliers` — supplier reliability and medicine relationships
- `/reports` — valuation, loss, consumption, supplier performance, and CSV export

## Local development

```bash
npm install
npm run dev
```

Validation:

```bash
npm run build
npm run lint
```

The application uses deterministic local data and persists user preferences and local UI state with Zustand. It is structured for a future backend, but does not require one to exercise the core workflows.
