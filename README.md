# Network Navigator — Power BI Custom Visual

A force-directed graph visual for Power BI that lets you explore node-link data interactively. Pan, zoom, search nodes by text, and navigate relationship networks with full **bi-directional cross-filtering** support — clicking a node filters other visuals on the page, and selections in other visuals highlight matching nodes here.

![Network Navigator](/assets/screenshot.png?raw=true)

---

## What It Does

Network Navigator renders a network of nodes and edges from any tabular data that has a "source" and "target" column (e.g. email sender/receiver, transaction from/to, route origin/destination).

**Core capabilities:**

- **Force-directed layout** — nodes repel each other and edges act as springs, naturally clustering related nodes and separating unrelated ones. Layout can be animated live or precomputed statically.
- **Pan & zoom** — drag to pan, scroll to zoom. Configurable zoom limits.
- **Text search** — type in the filter box to enlarge matching nodes, making them easy to spot in dense graphs.
- **Node sizing** — map a numeric measure to node radius (e.g. transaction volume, email frequency).
- **Node coloring** — map a color field per node; source and target nodes can each have their own color.
- **Label coloring** — separate color control for node text labels.
- **Edge weight** — map a numeric measure to edge thickness.
- **Edge color weight** — map a numeric measure to edge color along a configurable gradient.
- **Bi-directional cross-filtering** — click a node to filter/highlight other visuals; other visuals' selections dim non-matching nodes here.

---

## Data Fields

Drag columns from your dataset into these field wells:

| Field | Required | Description |
|---|---|---|
| **Source Node** | Yes | Name/ID of the originating node in each relationship row |
| **Target Node** | Yes | Name/ID of the destination node in each relationship row |
| **Edge Weight** | No | Numeric value controlling edge thickness |
| **Edge Color Weight** | No | Numeric value controlling edge color along the start→end gradient |
| **Source Node Weight** | No | Numeric value controlling source node circle radius |
| **Source Node Color** | No | Color string for the source node circle |
| **Source Node Label Color** | No | Color string for the source node label |
| **Target Node Weight** | No | Numeric value controlling target node circle radius |
| **Target Node Color** | No | Color string for the target node circle |
| **Target Node Label Color** | No | Color string for the target node label |
| **Filter** | No | Column used as the cross-filter target when clicking nodes |

> **Tip:** If you don't assign a Filter column, the Source Node column is used as the filter target by default.

The visual caps rendering at **1,000 source nodes** by default (configurable up to 30,000). Rows beyond that limit are dropped.

---

## Format Pane Settings

All settings live in the **Layout** and **Search** groups in the Power BI Format pane.

### Layout

| Setting | Default | Description |
|---|---|---|
| Animate | on | Live-animate the force simulation. Turn off for large/static graphs. |
| Max nodes | 1000 | Cap the number of nodes rendered (max 30,000). |
| Max node size | — | Clamp the largest node radius (px). |
| Min node size | 1 | Clamp the smallest node radius (px). |
| Link Distance | 10 | Rest length of edges in the force simulation (1–30). |
| Link Strength | 2 | Spring strength pulling connected nodes together (1–20). |
| Gravity | 0.1 | Strength of the centering force (0.1–10). |
| Charge | -120 | Repulsion between nodes; more negative = more spread out. |
| Labels | off | Show node name labels. Always visible on hover regardless. |
| Min/Max Zoom | 0.1 / 100 | Scroll zoom limits. |
| Default Label Color | blue | Fallback label color when no label-color field is mapped. |
| Font Size | 8pt | Node label font size. |
| Min/Max Edge Weight | — | Clamp the data range before mapping to edge width. |
| Min/Max Edge Width | 1 / 5 | Pixel width range for the edge thickness mapping. |
| Min/Max Edge Color Weight | — | Clamp the data range before mapping to edge color. |
| Edge Start/End Color | light/dark | Color gradient endpoints for edge color mapping. |

### Search

| Setting | Default | Description |
|---|---|---|
| Case Insensitive | on | Whether the text filter ignores case. |

---

## Bi-Directional Cross-Filtering

Network Navigator supports **both directions** of Power BI's cross-filtering system.

### Outbound — Network Navigator → other visuals
Click any node. Network Navigator broadcasts the selection via `selectionManager.select()` (cross-highlight: dims non-matching data in other visuals) and `host.applyJsonFilter()` (cross-filter: actually filters rows in other visuals). Click the same node again, or press the **×** button, to clear.

### Inbound — other visuals → Network Navigator
When another visual on the page makes a selection, Power BI routes it here in two ways:

1. **`supportsHighlight`** (primary): Power BI sets non-null values in `dataView.table.highlights` for rows that match the external selection. Network Navigator maps those rows back to node names via per-node `rowIndices` and dims all non-matching nodes to 20% opacity.
2. **`registerOnSelectCallback`** (secondary/best-effort): Power BI calls back with `ISelectionId[]` when another visual selects. Network Navigator matches these directly against its own node identities. Works best when both visuals share the same underlying table.

Non-matching nodes and their labels drop to **20% opacity**. Edges between two fully-dimmed nodes drop to **10% opacity**. Clearing the external selection restores everything to full opacity.

---

## What's Great About It

- **No server required** — fully client-side, runs inside the Power BI sandbox.
- **Large graphs** — up to 30,000 nodes with data reduction built into `dataViewMappings`.
- **Rich edge styling** — width and color independently mapped to separate measures.
- **Tunable physics** — all D3 force simulation parameters exposed in the format pane.
- **Non-destructive search** — text filter enlarges matching nodes rather than hiding others, preserving context.
- **Persistent selection** — node selection survives page refreshes via Power BI's `general.filter` stored object.
- **Modern stack** — D3 v7, PowerBI API v5, TypeScript, no jQuery.

---

## Known Limitations

- **No tooltips** — hover shows label text only; the Power BI tooltip card is not implemented.
- **No context menu** — right-click drill-through/etc. is not implemented.
- **No high-contrast mode** — colors are not adapted for Power BI accessibility themes.
- **No keyboard navigation** — nodes cannot be selected with the keyboard.
- **No Format Pane v2** — uses the legacy format pane API; the new schema is not yet implemented (pbiviz warns about this).
- **Single selection only** — only one node can be selected at a time.
- **Edges are visually undirected** — edges render as straight lines with no directional arrowhead despite the source/target model.
- **No isolated nodes** — nodes with no edges are not rendered.
- **Static layout doesn't reflow on resize** — when animation is off, the precomputed layout does not recompute after the visual is resized.

---

## Upgrade History

### v3.1.0.0 — This fork, UX polish

**Label visibility, clear-selection button, and stray-text fix:**
- **Labels on by default** — `labels: true`, black (`#000000`), 10pt (matching the 14px search box font). Previously labels were off and blue.
- **"Clear Selection" button** — dedicated button below the search bar that deselects the active node and lifts the cross-filter on other visuals. The `×` inside the search box now only clears the text filter.
- **Removed stray "yes" text** — leftover `link.append('svg:text').text('yes')` code was appending `<text>` as children of `<line>` SVG elements (invalid SVG), causing browsers to render them stacked at (0,0) — the top of the visual.
- **Fixed hover-label behavior** — mouseover/mouseout now shows/hides the label of the specific hovered node (not just the first text element in the SVG).
- **Node label font** — `Segoe UI` / system-ui (matches the search box) via `.node-label` CSS class.
- **Label stroke removed** — previously both fill and stroke were set to the label color, making text look slightly blurry at small sizes. Now only fill is used.

### Original v3.0.0 — Microsoft (deprecated)
- D3 v3.5.12 force-directed graph
- jQuery-based DOM manipulation
- PowerBI Visuals API v1.x / v3.x
- Outbound cross-filtering only (click → filter other visuals)
- No longer maintained by Microsoft

### v3.0.0.0 — This fork, Phase 1+2

**PowerBI API upgrade + bi-directional filtering:**
- `powerbi-visuals-api` upgraded `~1.x` → `~5.11.1`
- `powerbi-models` upgraded `^1.10.5` → `^2.2.0`
- Added `"supportsHighlight": true` to `capabilities.json` (enables inbound highlight routing)
- Added `"privileges": []` required by API v5 schema
- Implemented inbound cross-highlight via `dataView.table.highlights` + `rowIndices` tracking per node
- Implemented inbound cross-highlight via `registerOnSelectCallback`
- Added `setHighlightMode()` / `redrawHighlights()` to `NetworkNavigator` for opacity-based dimming
- Added `dimmed` property to `INetworkNavigatorNode`
- Outbound now also calls `selectionManager.select()` (cross-highlight) in addition to `applyJsonFilter()` (cross-filter)
- Build fix: `pbiviz package --skip-api` works around Yarn Berry hoisting
- Build fix: 4-part version format (`3.0.0.0`) required by pbiviz

### v3.0.0.0 — This fork, Phase 3

**D3 v3→v7 migration + jQuery removal:**
- D3 upgraded from v3.5.12 → v7.9.0:
  - `d3.layout.force()` → `d3.forceSimulation()` + `d3.forceLink()`
  - `d3.behavior.zoom()` → `d3.zoom()`
  - `d3.behavior.drag()` → `d3.drag()`
  - `d3.scale.linear()` → `d3.scaleLinear()`
  - Event callbacks updated to D3 v7 signature: `(event, datum)` instead of `(datum)` + global `d3.event`
  - Zoom transform: `.scale()/.translate()` setters → `zoom.transform(d3.zoomIdentity...)`
  - Drag: `d.px`/`d.py` floating positions → `d.fx`/`d.fy` fixed positions
- jQuery removed from all packages — replaced with vanilla DOM APIs
- `GraphElement.ts` rewritten to construct the DOM template via `document.createElement`
- `visual.ts`: `JQuery` type → `HTMLElement`, `$()` → `document.createElement`
- `network-navigator` pre-compiled to `dist/` (required because pbiviz webpack's `resolve.symlinks: false` blocks ts-loader from compiling TypeScript from Yarn-symlinked `node_modules`)

---

## How to Build

### Prerequisites

- **Node.js 18+**
- **Yarn Berry (v3.2.1)** — bundled in `.yarn/releases/yarn-3.2.1.cjs`, no global install needed
- **`powerbi-visuals-tools`** installed globally:
  ```bash
  npm install -g powerbi-visuals-tools
  ```

### First-time setup

```bash
# Clone
git clone https://github.com/lightningthief873/network_navigator.git
cd network_navigator

# Install dependencies (use the bundled yarn)
node .yarn/releases/yarn-3.2.1.cjs install
# or just `yarn install` if your shell resolves .yarnrc.yml
```

### Build and package

```bash
# Step 1: Compile the core library to dist/
cd packages/network-navigator
node ../../node_modules/typescript/bin/tsc -p tsconfig.json
cd ../..

# Step 2: Package the Power BI visual
cd packages/network-navigator-powerbi
pbiviz package --skip-api
# Output: packages/network-navigator-powerbi/dist/*.pbiviz
```

### Development workflow

```bash
# After changing packages/network-navigator/src/**:
cd packages/network-navigator && node ../../node_modules/typescript/bin/tsc -p tsconfig.json

# After changing packages/network-navigator-powerbi/src/**:
cd packages/network-navigator-powerbi && pbiviz package --skip-api

# Live reload dev server (requires a valid SSL cert — see pbiviz docs):
pbiviz start
```

### Why `--skip-api`?
Yarn Berry hoists `powerbi-visuals-api` to the root `node_modules`. pbiviz checks the local `packages/network-navigator-powerbi/node_modules/` and, when it can't find it there, tries to run `npm install` — which fails inside a Yarn workspace. `--skip-api` skips that existence check.

### Why pre-compile `network-navigator`?
pbiviz's webpack config sets `resolve.symlinks: false`. Yarn workspace symlinks `@essex/network-navigator` → `node_modules/@essex/network-navigator` → `packages/network-navigator`. With symlinks not followed, ts-loader sees the resolved path as being under `node_modules/` and refuses to compile TypeScript files there (its default exclusion rule). Pre-compiling the library to `dist/` (plain CommonJS JS + `.d.ts`) lets webpack consume it as ordinary JavaScript without needing ts-loader.

---

## How to Load in Power BI

1. After building, the `.pbiviz` file is in `packages/network-navigator-powerbi/dist/`. A pre-built copy is committed there for convenience.
2. In Power BI Desktop: **Visualizations pane** → **"..."** → **"Import a visual from a file"** → select the `.pbiviz`.
3. In Power BI Service: same menu in edit mode.
4. The visual appears in your Visualizations pane. Drag it onto the canvas.
5. Assign at least **Source Node** and **Target Node** columns in the Fields pane.

### Cross-filter interaction setup
To control which visuals Network Navigator filters when you click a node:
- Select the Network Navigator visual → **Format** tab → **Edit interactions**.
- Set each other visual's interaction type to **Filter** or **Highlight** as desired.

---

## Repository Structure

```
.
├── packages/
│   ├── network-navigator/               # Core D3 graph library (framework-agnostic)
│   │   ├── src/
│   │   │   ├── NetworkNavigator.ts      # Main graph class: simulation, zoom, drag, rendering
│   │   │   ├── VisualSettings.ts        # Typed settings model (DataViewObjectsParser)
│   │   │   ├── interfaces.ts            # INetworkNavigatorNode, INetworkNavigatorLink, etc.
│   │   │   ├── defaults.ts              # Default config values and min/max ranges
│   │   │   ├── determineDomain.ts       # Helper: auto-detect data domain for scales
│   │   │   ├── templates/
│   │   │   │   └── GraphElement.ts      # Vanilla DOM template (search box + SVG container)
│   │   │   └── base/
│   │   │       └── EventEmitter.ts      # Simple typed event emitter
│   │   ├── dist/                        # Pre-compiled CommonJS output (committed — required by pbiviz build)
│   │   └── tsconfig.json
│   │
│   └── network-navigator-powerbi/       # Power BI visual wrapper
│       ├── src/
│       │   ├── visual.ts                # IVisual implementation: update(), cross-filter wiring
│       │   ├── configs/
│       │   │   ├── converter.ts         # DataView → INetworkNavigatorData conversion
│       │   │   ├── models.ts            # INetworkNavigatorSelectableNode (adds filter/identity/rowIndices)
│       │   │   └── DATA_ROLES.ts        # Field well role name constants
│       │   └── style/
│       │       └── visual.less          # Visual CSS
│       ├── capabilities.json            # Field wells, format pane objects, supportsHighlight
│       ├── pbiviz.json                  # Visual metadata (GUID, version, API version)
│       └── dist/                        # Packaged .pbiviz output (committed for easy distribution)
│
├── .yarn/                               # Yarn Berry runtime and plugins
├── package.json                         # Workspace root
└── README.md
```

---

## For Developers — Extending the Visual

### Adding a new format pane property

1. Add the property to `capabilities.json` under `objects.layout.properties` (or `objects.search.properties`).
2. Add the corresponding typed field to `LayoutSettings` (or `SearchSettings`) in `packages/network-navigator/src/VisualSettings.ts`.
3. If the property affects the force simulation, handle the value change in the `set configuration` setter in `NetworkNavigator.ts`:
   - Compare old (`this._configuration.layout.x`) vs. new (`newConfig.layout.x`).
   - Update the relevant D3 force via `this.simulation.force('name')`.
   - Call `this.simulation.alpha(0.3).restart()` (animated mode) or `this.reflow(...)` (static mode).
4. Rebuild both packages.

### Adding a new data field

1. Add a new role to `capabilities.json` → `dataRoles` and to `dataViewMappings.table.rows.select`.
2. Add the role name constant to `packages/network-navigator-powerbi/src/configs/DATA_ROLES.ts`.
3. In `converter.ts`, read the column index via `colMap[roles.newRole.name]` and use `row[newRoleIdx]` in the row loop.
4. Extend `INetworkNavigatorSelectableNode` in `models.ts` or `INetworkNavigatorLink` in `interfaces.ts` to carry the new value.
5. Use the new field in `NetworkNavigator.ts` when building node/edge SVG attributes.

### Cross-filtering internals

**Outbound** (node click → other visuals):
- `selectionManager.select([node.identity])` → cross-highlight (dims non-matching rows in other visuals without filtering them out)
- `host.applyJsonFilter(node.filter, 'general', 'filter', FilterAction.merge)` → cross-filter (removes non-matching rows from other visuals)

**Inbound** (other visual → Network Navigator):
- `supportsHighlight: true` + `dataView.table.highlights` in `update()`: Power BI populates this with non-null values for rows matching the external selection. `converter.ts` stores `rowIndices[]` on each node so that `applyHighlights()` in `visual.ts` can map highlighted rows back to node names, then calls `networkNavigator.setHighlightMode(Set<nodeName>)`.
- `selectionManager.registerOnSelectCallback(ids => ...)`: receives incoming `ISelectionId[]`; matched against `node.identity.getKey()` in `handleExternalSelection()`.

Both inbound paths call `NetworkNavigator.setHighlightMode(Set<string>)`, which sets `node.dimmed = true` for non-matching nodes and calls `redrawHighlights()` to update SVG opacity.

### Key dependencies

| Package | Version | Purpose |
|---|---|---|
| `powerbi-visuals-api` | ~5.11.1 | Power BI custom visual host API |
| `powerbi-models` | ^2.2.0 | Filter model types (`AdvancedFilter`, etc.) |
| `d3` | ^7.9.0 | Force simulation, zoom, drag, scales, SVG rendering |
| `lodash-es` | ^4.17.21 | `debounce` for text filter and selection events |
| `powerbi-visuals-utils-dataviewutils` | 2.4.1 | `DataViewObjectsParser` for typed format pane settings |
| `powerbi-visuals-tools` (global) | 7.x | `pbiviz` CLI — builds and packages the visual |

---

## License

MIT — see [LICENSE](LICENSE) for details.

Original work © Microsoft Corporation. Upgrades and bi-directional filtering additions by [lightningthief873](https://github.com/lightningthief873).
