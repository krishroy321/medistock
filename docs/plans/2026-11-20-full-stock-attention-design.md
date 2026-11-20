# Full-Stock Pharmacy Shelf and Operational Attention Design

## Goal

Make the 3D pharmacy shelf a navigable representation of every active medicine
batch in the Zustand store, and make the dashboard's urgent work immediately
actionable without introducing alerts that are not supported by inventory data.

## Pharmacy shelf

- Zustand `medicines` remains the only inventory source. The scene includes all
  non-quarantined batches, including zero-stock batches so operators can still
  identify and manage them.
- Retain the hybrid paged rack: three shelf rows with nine packages on desktop,
  six on tablet, and three on mobile. Every page uses the existing medicine
  package components and has a medicine name, quantity, and stock/expiry status
  label attached to each package. Existing per-form package mapping remains.
- Keep all batches reachable using shelf pagination, searchable inventory
  filtering, and a direct target-batch jump. Page counts and labels describe the
  active filtered set, not just a featured sample.
- The dashboard can page the complete active stock instead of stopping at its
  first featured batches. Landing remains a curated six-item overview, as it is
  a product introduction rather than the full operational inventory.
- A selected or attention-linked batch is brought onto the correct shelf page,
  focused in the scene, and opened in the existing inventory detail modal.
- Preserve the WebGL fallback, reduced-motion behavior, and demand rendering.

## Operational attention

- Replace the dashboard's low-priority, late-page alert strip with a prominent
  “What needs attention?” panel beside/adjacent to the shelf near the top of the
  page, while retaining existing KPI, expiry, sales, and stock-flow content.
- Derive actionable entries from active, non-quarantined Zustand medicines:
  expired batches first; then out-of-stock and critical expiry (within seven
  days); warning-level expiry (8–30 days) and low-stock batches; finally
  informational stock approaching reorder when quantity is at least minimum
  and below 1.5 times minimum. Do not synthesize items for empty groups.
- Each entry identifies the batch and explains the real condition with current
  quantity, expiry date/days, minimum stock, or batch number as appropriate.
  Expired stock routes to its existing detail/quarantine workflow; low/out of
  stock items offer the existing restock/detail workflows; other expiry items
  open the existing medicine detail modal.
- Selecting an entry navigates to inventory with its medicine ID. Inventory
  locates the batch on the correct shelf page, selects/focuses it, and opens the
  existing detail modal; this avoids a duplicate modal or a second data store.

## Components and data flow

`useStore.medicines` → active/filtered batch list → paged `PharmacyScene` →
form-specific medicine package → attached name/quantity/status. Store updates,
filtering, and deletion must update shelf contents and page bounds naturally.

`useStore.medicines` → pure attention-item derivation using existing status and
date helpers → prioritized dashboard actions → existing inventory detail and
restock/quarantine workflows.

Use the existing Drei/R3F scene, package models, app navigation, and
`MedicineDetailModal`. Avoid rendering the full inventory as simultaneous
independent high-detail objects; page the rack and maintain readable labels.

## Validation

- Test the pure attention derivation against expired, <=7-day expiry, 8–30-day
  expiry, low/out-of-stock, approaching-reorder, healthy, and quarantined
  medicines. Confirm ordering, non-duplication, and empty states.
- Verify all active medicine IDs are traversable across shelf pages at desktop,
  tablet, and mobile layouts, with current quantity/status labels and package
  form mapping. Verify inventory search and edits reflect immediately.
- Follow an attention item through navigation to shelf focus and the existing
  detail modal; verify restock and expired-stock action paths.
- Run `npm run lint` and `npm run build`, then visually inspect `/`,
  `/dashboard`, `/inventory`, and `/expiry-alerts` in the running browser.
