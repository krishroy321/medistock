# MediStock Product-Shell Prototype Design

## Goal

Build a polished local prototype for MediStock, a pharmacy inventory and expiry
intelligence product. The prototype should feel like a real medical-tech SaaS
product while demonstrating the key inventory, expiry, and visual 3D workflows
without requiring a backend.

## Architecture

- React Router provides the landing route and workspace routes:
  `/`, `/app/dashboard`, `/app/inventory`, `/app/expiry`, and `/app/reports`.
- Existing Zustand state manages filters, selected medicine, theme, modal state,
  and local interaction updates.
- Existing deterministic data modules remain the source of truth for medicines,
  suppliers, analytics, transactions, and derived dashboard metrics.
- Tailwind v4 tokens in `src/index.css` define the visual system. Manrope and
  Inter remain the display and UI fonts.
- React Three Fiber is limited to the landing hero and visual inventory section.
  Reusable product primitives provide bottles, boxes, blister packs, and shelf
  composition. A CSS fallback remains available for reduced motion or WebGL
  failure.
- GSAP handles page entrance, hero reveal, and major scene/card choreography;
  ordinary controls use CSS transitions.

## Components and data flow

### Shared shell

The workspace shell includes sidebar navigation, top bar, search, notification
control, theme toggle, and responsive mobile navigation.

### Landing experience

The landing page includes the hero copy and 3D scene, floating KPI cards, a trust
strip, feature cards, a visual inventory preview, a CTA panel, and footer.

### Workspace experience

Workspace pages include KPI cards, an inventory table, status badges, expiry
timeline, low-stock panel, charts, and recent activity. Table rows and 3D
products open a shared medicine detail modal.

### Interaction model

Search and status/category filters update shared derived inventory selectors.
Restock and mark-reviewed actions update local state and provide toast feedback.
Medicine records power KPIs, chart series, alerts, supplier references, and
transaction rows without duplicating values.

## Reliability and accessibility

- Empty and error states are explicit for tables, charts, and modals.
- Interactive controls have labels, keyboard focus states, and escape/close
  behavior where relevant.
- Status colors are paired with text, not used as the only signal.
- WebGL failure and reduced motion degrade to a usable CSS presentation.

## Validation

Run:

```bash
npm run build
npm run lint
```

Perform a browser smoke pass covering landing-to-dashboard navigation, inventory
filtering, opening a medicine modal, theme toggling, and responsive layout.

## Approved implementation decisions

- Product scope: single-pharmacy operations with local Zustand persistence.
- Delivery approach: route-first product shell, followed by workflow pages and
  the focused 3D experience.
- Routes: `/`, `/dashboard`, `/inventory`, `/expiry-alerts`, `/suppliers`, and
  `/reports`.
- Zustand remains the source of truth for medicines, suppliers, transactions,
  notifications, filters, selected medicine, and local mutations. Derived
  selectors keep all pages consistent.
- The shared shell includes a responsive sidebar, topbar, notification drawer,
  profile menu, mobile navigation, and route outlet.
- The 3D scene is limited to the landing hero and a compact dashboard visual.
  It uses a labeled focal bottle, pharmacy inventory objects, shared
  geometries/materials, capped DPR, reduced-motion checks, lazy loading, and a
  CSS fallback for WebGL failure.
- Reports export client-side CSV files from current application data; no
  backend-shaped fake export success is permitted.
- Validation includes build/lint plus browser checks for every route, filters,
  modal actions, export, responsive layout, console errors, and reduced-motion
  or WebGL fallback behavior.
