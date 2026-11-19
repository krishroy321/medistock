# MediStock Product-Shell Prototype Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the complete local MediStock pharmacy inventory, expiry-alert, supplier, and reporting application on the existing React foundation.

**Architecture:** Use React Router for the landing/workspace routes, Zustand for shared UI and medicine state, and deterministic local data as the single source for derived metrics. Keep React Three Fiber focused on the landing and visual inventory scenes, with CSS fallbacks for reduced motion or WebGL failure; use GSAP only for major entrances and scene choreography.

**Tech Stack:** React 19, Vite, Tailwind CSS v4, React Router 7, Zustand 5, React Three Fiber, Drei, Three.js, GSAP, Lucide React, Recharts.

---

### Task 1: Establish the shared data and store contract

**Files:**
- Create or modify: `src/data/medicines.js`
- Create or modify: `src/data/analytics.js`
- Create or modify: `src/data/transactions.js`
- Create or modify: `src/data/suppliers.js`
- Create or modify: `src/lib/inventory.js`
- Create or modify: `src/store/useStore.js`

**Step 1: Inspect existing data and store files**

Confirm which modules already contain usable records and preserve their exports where possible.

**Step 2: Define the medicine record shape**

Ensure each medicine contains stable `id`, `name`, `genericName`, `category`, `form`, `stock`, `minimumStock`, `expiryDate`, `supplierId`, `unitPrice`, `batch`, and `status`-derivable values.

**Step 3: Add derived inventory selectors**

Implement pure helpers for stock status, expiry status, dashboard totals, category counts, and filtered/search-sorted medicine lists. Keep date logic in `src/lib/date.js`.

**Step 4: Add Zustand UI state**

Expose theme, active filters, search term, selected medicine, modal state, reviewed alerts, restock action, and a toast queue. Keep action updates immutable and deterministic.

**Step 5: Validate the contract**

Run `npm run build`.

Expected: the existing starter still builds while the new data/store modules are unused.

**Step 6: Commit**

```bash
git add src/data src/lib/inventory.js src/store/useStore.js
git commit -m "feat: establish inventory data contract"
```

### Task 2: Build the shared UI primitives and application shell

**Files:**
- Create or modify: `src/components/ui/*`
- Create or modify: `src/components/layout/PageContainer.jsx`
- Create or modify: `src/components/layout/nav.js`
- Create or modify: `src/components/layout/TransitionOutlet.jsx`
- Create: `src/components/layout/AppShell.jsx`
- Create: `src/components/layout/Sidebar.jsx`
- Create: `src/components/layout/Topbar.jsx`
- Create: `src/components/layout/MobileNav.jsx`
- Modify: `src/index.css`

**Step 1: Add shell primitives**

Build accessible Button, Card, Badge, Input, Dropdown, Modal, Toast, and AnimatedNumber primitives that use the existing tokens and support `className` composition.

**Step 2: Add navigation metadata**

Define label, route, icon, and active matching data for Dashboard, Inventory, Expiry Alerts, and Reports.

**Step 3: Implement desktop shell**

Create a fixed-width sidebar, responsive topbar, content outlet, notification control, theme toggle, and page title region.

**Step 4: Implement mobile navigation**

Add a keyboard-accessible drawer that closes on route selection and escape.

**Step 5: Add route transition behavior**

Use the existing GSAP helper to animate content entrance without blocking route rendering.

**Step 6: Validate**

Run `npm run lint`.

Expected: no lint errors in the new shell and primitives.

**Step 7: Commit**

```bash
git add src/components/ui src/components/layout src/index.css
git commit -m "feat: add responsive application shell"
```

### Task 3: Build the reusable 3D product scene

**Files:**
- Create or modify: `src/components/3d/*`
- Create: `src/components/3d/ProductBottle.jsx`
- Create: `src/components/3d/ProductBox.jsx`
- Create: `src/components/3d/BlisterPack.jsx`
- Create: `src/components/3d/PharmacyShelf.jsx`
- Create: `src/components/3d/SceneFallback.jsx`
- Create: `src/components/3d/PharmacyScene.jsx`

**Step 1: Create product primitives**

Use low-complexity rounded geometry, paper/plastic/metal materials, and text or mesh labels to represent bottles, boxes, blisters, capsules, and tablets.

**Step 2: Add shelf composition**

Arrange products into a shelf scene with restrained studio lighting, shadows, and a neutral backdrop.

**Step 3: Add interaction state**

Expose hover/select callbacks, cursor-responsive tilt, idle rotation, and an accessible fallback label for each product.

**Step 4: Add scene fallback**

Render a CSS product composition when reduced motion is enabled or the canvas cannot mount. Do not silently hide the experience.

**Step 5: Validate**

Run `npm run build`.

Expected: Three.js bundles successfully without runtime import errors.

**Step 6: Commit**

```bash
git add src/components/3d
git commit -m "feat: add interactive pharmacy product scenes"
```

### Task 4: Implement the landing page

**Files:**
- Create or modify: `src/components/landing/*`
- Create: `src/pages/LandingPage.jsx`
- Modify: `src/App.jsx`
- Modify: `src/main.jsx`

**Step 1: Add landing route**

Configure `/` and the workspace routes with React Router, preserving a clear fallback route.

**Step 2: Build hero section**

Add the eyebrow, headline, supporting copy, primary and secondary CTAs, `PharmacyScene`, and the three floating KPI cards.

**Step 3: Add landing sections**

Implement trust strip, feature cards, visual inventory preview, CTA panel, and footer with responsive spacing and restrained accent use.

**Step 4: Add GSAP reveals**

Animate hero content, KPI cards, and section entrances with cleanup and reduced-motion guards.

**Step 5: Validate**

Run `npm run build` and inspect the page in a browser at `/`.

Expected: the hero is usable on desktop and narrow viewport widths; CTAs navigate to the workspace.

**Step 6: Commit**

```bash
git add src/App.jsx src/main.jsx src/pages/LandingPage.jsx src/components/landing
git commit -m "feat: build MediStock landing experience"
```

### Task 5: Implement dashboard workspace

**Files:**
- Create or modify: `src/pages/app/DashboardPage.jsx`
- Create or modify: `src/components/dashboard/*`
- Create: `src/components/dashboard/KpiCard.jsx`
- Create: `src/components/dashboard/ExpiryTimeline.jsx`
- Create: `src/components/dashboard/LowStockPanel.jsx`
- Create: `src/components/dashboard/ActivityFeed.jsx`
- Create: `src/components/dashboard/InventoryChart.jsx`

**Step 1: Add dashboard route and page container**

Use `AppShell` and a page header with the current date and a compact summary.

**Step 2: Build KPI cards**

Derive total units, inventory value, expiring-soon count, and low-stock count from shared selectors.

**Step 3: Build operational panels**

Add expiry timeline, low-stock table, recent activity, and a Recharts trend chart driven by the analytics module.

**Step 4: Add empty/error states**

Provide readable fallbacks for missing series or empty alert lists.

**Step 5: Validate**

Run `npm run lint` and browser smoke-test dashboard navigation.

**Step 6: Commit**

```bash
git add src/pages/app/DashboardPage.jsx src/components/dashboard
git commit -m "feat: add inventory intelligence dashboard"
```

### Task 6: Implement inventory and medicine detail workflows

**Files:**
- Create or modify: `src/pages/app/InventoryPage.jsx`
- Create or modify: `src/components/inventory/*`
- Create: `src/components/inventory/InventoryToolbar.jsx`
- Create: `src/components/inventory/InventoryTable.jsx`
- Create: `src/components/inventory/MedicineDetailModal.jsx`
- Create: `src/components/inventory/VisualInventory.jsx`

**Step 1: Add inventory route**

Render the shared shell and page heading.

**Step 2: Add toolbar controls**

Implement search, category filter, status filter, sort, and clear behavior through Zustand state.

**Step 3: Add inventory table**

Render medicine name, category/form, stock, minimum, expiry, supplier, and status with keyboard-accessible rows.

**Step 4: Add detail modal**

Show batch, supplier, unit price, stock health, expiry, and actions for restock and mark reviewed. Close on escape and backdrop click.

**Step 5: Add visual inventory**

Render the shelf scene and connect product hover/select state to the same detail modal.

**Step 6: Validate**

Browser smoke-test filter changes, row selection, modal close, restock feedback, and visual product selection.

**Step 7: Commit**

```bash
git add src/pages/app/InventoryPage.jsx src/components/inventory
git commit -m "feat: add interactive inventory workflows"
```

### Task 7: Implement expiry alerts and reports pages

**Files:**
- Create or modify: `src/pages/app/ExpiryPage.jsx`
- Create or modify: `src/pages/app/ReportsPage.jsx`
- Create or modify: `src/components/expiry/*`
- Create or modify: `src/components/reports/*`

**Step 1: Build expiry page**

Group medicines by urgency, show date buckets, and expose mark-reviewed/detail actions.

**Step 2: Build reports page**

Add inventory value, category distribution, movement trend, supplier summary, and export-style action feedback using existing local analytics.

**Step 3: Add responsive states**

Make charts and tables readable on small screens, with explicit no-data messages.

**Step 4: Validate**

Run `npm run build` and smoke-test both routes.

**Step 5: Commit**

```bash
git add src/pages/app/ExpiryPage.jsx src/pages/app/ReportsPage.jsx src/components/expiry src/components/reports
git commit -m "feat: add expiry and reporting views"
```

### Task 8: Complete visual polish and validation

**Files:**
- Modify: `src/index.css`
- Modify: `src/App.jsx`
- Modify: affected components from Tasks 2-7
- Modify: `README.md`

**Step 1: Add final responsive and reduced-motion refinements**

Check spacing, contrast, focus rings, route transitions, canvas fallback, and mobile overflow.

**Step 2: Update README**

Document the MediStock prototype, available routes, local commands, and the fact that data is deterministic/mock.

**Step 3: Run targeted validation**

```bash
npm run lint
npm run build
```

Expected: both commands exit successfully.

**Step 4: Run browser smoke pass**

Verify landing → dashboard navigation, inventory search/filter, medicine modal, restock toast, theme toggle, expiry route, reports route, and narrow viewport layout.

**Step 5: Commit**

```bash
git add README.md src
git commit -m "chore: polish and validate MediStock prototype"
```

### Task 9: Complete shared shell and notification workflows

**Files:**
- Create: `src/components/layout/AppShell.jsx`
- Create: `src/components/layout/Sidebar.jsx`
- Create: `src/components/layout/Topbar.jsx`
- Create: `src/components/layout/MobileNav.jsx`
- Create: `src/components/layout/NotificationDrawer.jsx`
- Create: `src/components/layout/ProfileMenu.jsx`
- Create: `src/components/ui/ToastViewport.jsx`
- Modify: `src/components/layout/nav.js`
- Modify: `src/store/useStore.js`

**Step 1: Add route metadata and all requested paths**

Use `/`, `/dashboard`, `/inventory`, `/expiry-alerts`, `/suppliers`, and `/reports`, with an explicit not-found route.

**Step 2: Build the responsive shell**

Implement desktop sidebar, topbar, profile menu, theme control, notification trigger, and mobile drawer with keyboard and touch support.

**Step 3: Derive notifications from live state**

Create notifications for expired batches, expiring batches, low stock, and successful local mutations. Support unread count, mark read/all, dismiss, and navigation.

**Step 4: Validate**

Run `npm run lint` and browser-test every route, drawer close behavior, theme persistence, and toast dismissal.

**Step 5: Commit**

```bash
git add src/components/layout src/components/ui/ToastViewport.jsx src/store/useStore.js src/App.jsx
git commit -m "feat: complete application shell and notifications"
```

### Task 10: Add stock-alert, edit, delete, and restock workflows

**Files:**
- Create: `src/components/inventory/StockAlertPanel.jsx`
- Create: `src/components/inventory/RestockModal.jsx`
- Create: `src/components/inventory/MedicineFormModal.jsx`
- Modify: `src/components/inventory/InventoryToolbar.jsx`
- Modify: `src/components/inventory/InventoryTable.jsx`
- Modify: `src/store/useStore.js`
- Modify: `src/lib/inventory.js`

**Step 1: Add selectors**

Implement `quantity < minimumStock`, recommended restock, category/status/expiry filters, sorting, and pagination as pure selectors.

**Step 2: Add table actions**

Wire detail, edit, delete/quarantine, and restock actions to immutable Zustand mutations with explicit validation and toasts.

**Step 3: Add restock modal**

Show current stock, minimum required, recommended quantity, supplier, expected delivery, and optional note; create a local purchase order and transaction.

**Step 4: Validate**

Browser-test search, category/stock/expiry filters, sorting, pagination, edit validation, delete confirmation, and restock state updates.

**Step 5: Commit**

```bash
git add src/components/inventory src/store/useStore.js src/lib/inventory.js
git commit -m "feat: add inventory alert and mutation workflows"
```

### Task 11: Add complete medicine details and expiry intelligence

**Files:**
- Create: `src/components/inventory/MedicineDetailModal.jsx`
- Create: `src/pages/app/ExpiryAlertsPage.jsx`
- Create: `src/components/expiry/ExpiryGroup.jsx`
- Create: `src/components/expiry/ExpiryTimeline.jsx`
- Modify: `src/components/inventory/InventoryTable.jsx`
- Modify: `src/lib/inventory.js`

**Step 1: Build detail view**

Render all requested medicine fields, supplier, storage condition, transaction history, Stock Health, Expiry Risk, Sales Velocity, and Restock Recommendation.

**Step 2: Group expiry batches**

Render Expired, within 7 days, within 30 days, within 90 days, and Safe groups with quantity, expiry date, estimated loss, and risk.

**Step 3: Add timeline animation**

Use GSAP for subtle group/timeline entrances with reduced-motion guards. Link rows to the same detail modal.

**Step 4: Validate and commit**

Run build/lint and browser-test each group, empty states, row selection, modal Escape, and responsive timeline.

```bash
git add src/components/inventory src/pages/app/ExpiryAlertsPage.jsx src/components/expiry src/lib/inventory.js
git commit -m "feat: add medicine details and expiry alerts"
```

### Task 12: Add supplier intelligence and working reports export

**Files:**
- Create: `src/pages/app/SuppliersPage.jsx`
- Create: `src/components/suppliers/SupplierTable.jsx`
- Create: `src/components/suppliers/SupplierDetails.jsx`
- Modify: `src/pages/app/ReportsPage.jsx`
- Create: `src/components/reports/ReportCharts.jsx`
- Create: `src/lib/export.js`

**Step 1: Derive supplier metrics**

Show supplier, contact, medicines supplied, orders, last delivery, and reliability from current suppliers, medicines, purchase orders, and transactions.

**Step 2: Build report charts**

Render inventory valuation, expired loss, monthly consumption, stock turnover, supplier performance, and restocking trends with explicit empty states.

**Step 3: Implement CSV export**

Serialize current report rows with escaped fields, download a descriptive `.csv`, and show a success or error toast. Do not pretend to call a backend.

**Step 4: Validate and commit**

Browser-test supplier selection, chart tooltips, report responsiveness, and downloaded CSV contents.

```bash
git add src/pages/app/SuppliersPage.jsx src/components/suppliers src/pages/app/ReportsPage.jsx src/components/reports src/lib/export.js
git commit -m "feat: add supplier management and report exports"
```

### Task 13: Build focused Three.js scene and performance fallback

**Files:**
- Create: `src/components/3d/PharmacyScene.jsx`
- Create: `src/components/3d/MedicineBottle.jsx`
- Create: `src/components/3d/MedicineShelf.jsx`
- Create: `src/components/3d/FloatingDataCard.jsx`
- Create: `src/components/3d/ExpiryVisualization.jsx`
- Create: `src/components/3d/SceneFallback.jsx`
- Modify: `src/hooks/useEnvironment.js`

**Step 1: Build pharmacy objects**

Use reusable geometries/materials for a focal labeled bottle, boxes, blister packs, capsules, shelves, and inventory containers tied to actual medicine data.

**Step 2: Add interaction and camera transitions**

Implement idle rotation, cursor response, hover, medicine selection, information card, and GSAP camera focus.

**Step 3: Add loading and fallback**

Lazy-load the scene, cap DPR, reduce object count on mobile, honor reduced motion, and render an accessible CSS fallback on WebGL failure.

**Step 4: Validate**

Run build/lint and browser-test landing/dashboard scenes, pointer selection, reduced motion, mobile complexity, and console errors.

**Step 5: Commit**

```bash
git add src/components/3d src/hooks/useEnvironment.js
git commit -m "feat: add interactive pharmacy scene with fallback"
```

### Task 14: Final end-to-end verification

**Files:**
- Modify: only files required by discovered defects
- Review: all files under `src/`, `package.json`, `vite.config.js`, `docs/`

**Step 1: Run static checks**

```bash
npm run build
npm run lint
```

Expected: build succeeds and lint has no new warnings or errors.

**Step 2: Run the app**

```bash
npm run dev -- --host 127.0.0.1
```

Verify the server responds before browser testing.

**Step 3: Smoke-test all routes and interactions**

Verify landing navigation, dashboard KPI/chart/alerts, inventory filters/sorting/pagination/actions, expiry groups/timeline, supplier details, report export, notification drawer, profile/theme controls, and modal keyboard behavior.

**Step 4: Test responsive and reduced-motion behavior**

Check desktop, tablet, and mobile widths; confirm no horizontal overflow, touch-friendly controls, responsive tables, reduced 3D complexity, and CSS fallback.

**Step 5: Resolve defects**

Fix broken imports, console errors, route issues, React warnings, chart sizing, focus behavior, and Three.js errors. Do not rewrite working infrastructure.

**Step 6: Commit**

```bash
git add src
git commit -m "fix: complete MediStock end-to-end verification"
```
