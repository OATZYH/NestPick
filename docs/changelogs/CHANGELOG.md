# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.2.1] - 2026-09-08

### Added
- **Listing Modal 2-Column Responsive Layout (`components/dashboard/listing-modal.tsx`)**:
  - Expanded dialog container to wider responsive breakpoints (`sm:max-w-4xl lg:max-w-5xl`).
  - Organized form sections into a 2-column grid on desktop (`lg:grid-cols-2 gap-6`): Property Info & Financials on the left, Pipeline Status, Amenities, Contacts, and Inspection Notes on the right.
  - Added interactive section headers with tooltips (`Tooltip`, `TooltipTrigger`, `TooltipContent`) explaining each category.
  - Added shadcn `Select` component (`components/ui/select.tsx`) powered by `@radix-ui/react-select`.
- **Maps Panel Show/Hide Toggle (`components/dashboard/maps-panel.tsx`, `store/maps-store.ts`)**:
  - Added `togglePanelVisible` action to Zustand maps store.
  - Enabled manual collapse and restoration of the floating maps panel on both desktop and mobile.
  - Added floating restore button with listing count badge (`PanelLeftOpen`) when panel is closed.
- **Mobile Sidebar Trigger (`components/dashboard/map-controls.tsx`)**:
  - Added mobile-only trigger button (`sm:hidden`) in top-right map controls to open the navigation drawer sheet on smaller screens.

### Changed & Fixed
- **Sidebar Header & Collapse Behavior (`components/dashboard/sidebar.tsx`)**:
  - Replaced redundant dropdown menu on the logo with a plain branding logo link.
  - Fixed sidebar toggle button alignment and spacing in `SidebarHeader`.
  - Switched sidebar collapse mode from `offcanvas` to `icon`, preserving a 48px navigation rail when collapsed instead of disappearing off-screen.
  - Added centered trigger button in the icon rail and hover tooltips for all navigation items.
- **Listing Modal UI Fixes (`components/dashboard/listing-modal.tsx`)**:
  - Converted pipeline status selection from badge chips into a clean `<Select>` dropdown with color status indicators.
  - Removed numeric prefixes (`1. `, `2. `, etc.) from all modal section titles.
  - Fixed Project Amenities component by replacing rigid 6-column fixed grid with `flex flex-wrap gap-2` chips with Lucide icons and active check indicators, preventing label truncation.

---

## [0.2.0] - 2026-09-07

### Added
- **Prisma ORM 7 Integration**:
  - Defined PostgreSQL models in `prisma/schema.prisma` (`Listing`, `PriceHistory`, `Contract`, `ViewingLog`, `CenterPoint`, `PropertyType`, `PipelineStatus`) with cascade delete constraints and indexes.
  - Created singleton database client in `lib/prisma.ts` using `@prisma/adapter-pg` driver adapter with connection pooling and adaptive SSL (disabled for localhost/Docker, enabled for cloud databases).
  - Added Prisma 7 CLI configuration in `prisma7.config.ts`.
  - Migrated `scripts/seed.ts` to type-safe Prisma upsert operations.
- **Docker Compose Local Database**:
  - Configured PostgreSQL 17 Alpine in `docker-compose.yml` (`nestpick-postgres`) on port `5432` with healthcheck and volume persistence.
  - Added local `.env.example` template and cleaned cloud credentials from `.env.local` / `.env`.
- **New NPM Scripts**:
  - `db:up` and `db:down` for Docker container lifecycle.
  - `prisma:push`, `prisma:generate`, `prisma:migrate`, `prisma:studio`, `db:seed`, and `postinstall`.

### Removed
- Removed unused dependencies `ajv` and `@radix-ui/react-scroll-area`.

---

## [0.1.1] - 2026-09-07

### Changed
- Rebranded project name from "maps" to **NestPick**:
  - Updated package name in `package.json` to `nestpick`.
  - Updated application title and metadata in `app/layout.tsx` to "NestPick - Condo & Apartment Hunting Tracker".
  - Updated branding in sidebar (`components/dashboard/sidebar.tsx`) and floating panel (`components/dashboard/maps-panel.tsx`).
  - Updated LocalStorage persistence key in `store/maps-store.ts` to `nestpick-store-v1`.

---

## [0.1.0] - 2026-09-07

### Initial Release: Modern Maps Condo & Apartment Hunting Tracker

Transformed the template into a production-ready single-user condo/apartment hunting tracker for Bangkok rentals, while strictly preserving the template's layout architecture (collapsible sidebar, floating card panel, and full MapLibre background map).

### Added
- **Data Models & Types (`types/hunting.ts`)**:
  - Full TypeScript models for `Listing`, `PriceHistory`, `Contract`, `ViewingLog`, `Amenities`, `CenterPoint`, `PropertyType`, and `PipelineStatus`.
  - Added support for 4 property types: `condo`, `apartment`, `dorm`, `house`.
  - Added 6-stage tracking pipeline: `interested` → `viewing_scheduled` → `viewed` → `negotiating` → `decided` → `rejected`.
- **Bangkok Rental Mock Dataset (`mock-data/condos.ts`)**:
  - 8 realistic property listings across Bangkok (Sukhumvit, Asoke, Phrom Phong, Ari, Samyan, Rama 9, Sathorn) with high-res photos, lease terms, price histories, viewing logs, and contact information.
  - 4 default reference points: Workplace (Siam / CentralWorld), BTS Asok Interchange, Chulalongkorn University, Silom/Sathorn CBD.
- **Zustand State Store (`store/maps-store.ts`)**:
  - LocalStorage persistence for user listings, center points, active target, and comparisons.
  - Haversine distance calculator relative to the user's active reference center point.
  - Actions for adding/updating/deleting listings, price history offers, viewing notes, contracts, and center points.
  - Multi-criteria sorting: Nearest to Target, Rent (Low-High / High-Low), Size, Inspection Rating, Date Added, and Name.
- **Floating Listing Information Panel (`components/dashboard/maps-panel.tsx`)**:
  - Compact cards with photos, rent badges, floor/size specs, target distance, and pipeline status.
  - Tabbed detail view:
    - **Specs**: Amenities checklist, unblocked view, pros/cons notes.
    - **Pricing History**: Timeline of initial prices vs negotiated counter-offers, with an inline "+ Offer" logger.
    - **Lease Contract**: Duration, dates, deposit refund conditions, pet/smoking/guest policies, early termination terms.
    - **Visit Logs**: Inspection dates, star ratings (1–5), notes on water pressure/noise/sunlight, with inline "+ Log Visit" form.
    - **Direct Contacts**: One-click phone calling and direct LINE chat launcher (`line.me/ti/p/~...`).
- **Interactive Map Dashboard (`components/dashboard/map-view.tsx`)**:
  - Rent price pill badges and status-colored markers.
  - Pulsing landmark pin for the active Reference Center Point.
  - Rich hover preview cards showing thumbnail, rent, size, and distance.
  - OSRM route line drawing connecting the listing to the target center point.
- **Spreadsheet Table View (`components/dashboard/table-view.tsx` • `/table`)**:
  - Google Sheets / Excel UX with sortable columns, alternating row highlights, and sticky header.
  - Inline pipeline status dropdown directly inside the table cell.
  - Quick action to select and fly to the place on the map.
- **Side-by-Side Comparison Matrix (`components/dashboard/compare-view.tsx` • `/compare`)**:
  - Side-by-side comparison across up to 4 listings.
  - Weighted Scoring Engine with dynamic sliders (Budget, Distance, Room Size, Amenities) calculating a 0–100 match score and highlighting the #1 Top Match with a trophy badge.
- **Navigation Sidebar (`components/dashboard/sidebar.tsx`)**:
  - Updated navigation items: Map View (`/`), Spreadsheet Table (`/table`), Compare (`/compare`), Favorites (`/favorites`), Recent (`/recents`).
  - Filters for property types and pipeline stages with item counts.
  - Target Reference Point indicator card.
- **Modals**:
  - `ListingModal`: Comprehensive dialog to create or edit full listing records and pricing terms.
  - `CenterPointModal`: Dialog to manage reference center points (workplace, university, transit, landmark).
  - Radix UI Dialog (`components/ui/dialog.tsx`) and Radix UI Tabs (`components/ui/tabs.tsx`).

### Fixed & Optimized
- **Dependency Conflicts (`package.json`)**:
  - Removed breaking `"brace-expansion": "^5.0.6"` and `"@isaacs/brace-expansion": "^5.0.1"` overrides that caused `TypeError: expand is not a function` in ESLint 9's config array parser.
  - Removed unused root `"minimatch": "^10.2.3"`.
- **ESLint 9 / Next.js 16 Configuration (`eslint.config.mjs`)**:
  - Replaced legacy `@eslint/eslintrc` `FlatCompat` wrapper with native `import nextConfig from "eslint-config-next"` export.
- **React 19 Rules & Build Stability**:
  - Resolved `react-hooks/purity` error in `components/ui/sidebar.tsx` by eliminating `Math.random()` inside render.
  - Resolved variable access order in `components/dashboard/map-view.tsx` for `drawRoute`.
  - Replaced unescaped quotes in `components/dashboard/table-view.tsx``.
- **Map View Controls (`components/dashboard/map-controls.tsx`)**:
  - Updated default compass/reset view to center onto Bangkok and the active reference target point instead of world coordinates `(20, 0)`.
