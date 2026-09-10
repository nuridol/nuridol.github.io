# DESIGN.md (tools/)

UI and visual design specifications for web utilities under `tools/`.
Refer to this document whenever styling, modifying, or implementing pages in `tools/`.

---

## 1. Design Philosophy

- **High Information Density**: Present maximum operational data in the viewport without unnecessary scrolling or blank space.
- **Clean Minimalism**: Keep title bars and action areas free of redundant buttons, banners, or decorative clutter.
- **Consistency across Locales**: Maintain exact visual, structural, and interaction parity across Korea (KR), Japan (JP), and Hong Kong (HK) pages.

---

## 2. Core Libraries & Theme

- **CSS Framework**: Bootstrap 5.3.3 (`data-bs-*` attributes, light theme by default)
- **Icons**: Bootstrap Icons 1.11.3 (`bi bi-*` syntax exclusively)
- **Zero jQuery**: Native browser APIs and CSS for all visual interactions

---

## 3. Color Tokens & Visual Elements

| Component / State | Token / Value | Description |
|---|---|---|
| **Status Bar Background** | `#cff4fc` | Option 1 Soft Info Blue, calm pastel cyan |
| **Status Bar Border** | `1px solid #9eeaf9` | Soft sky blue border |
| **Status Bar Text** | `#055160` (font-weight 500) | Deep teal text for crisp contrast |
| **Debug Badge** | `<span class="badge bg-danger">MOCK DEBUG</span>` | High-visibility red badge for mock data mode |
| **Refresh Button (`#refresh`)** | Background `#ffc107`, border `#ffc107`, text `#212529` | Warm amber/orange. Retains `#ffc107` on focus/active |
| **Refresh Hover** | Background `#e0a800`, border `#d39e00` | Slightly darker amber |
| **In-Stock Cell (`.in-stock`)** | Background `#c3e6cb !important`, text `#155724 !important` | Solid soft green, prevents striped-table clash |
| **Out-of-Stock Cell** | Text `#adb5bd`, icon `<i class="bi bi-dash"></i>` | Muted grey dash |
| **Watched Cell (`.watched`)** | Outline `2px solid #0d6efd`, offset `-2px` | Vibrant blue cell outline indicator |
| **Watched Badge** | `.badge.bg-primary.py-2.px-2` | Clickable pill badge with remove icon (`bi-x-circle`) |
| **Footer Background** | `#f8f9fa`, border-top `1px solid #dee2e6` | Muted neutral grey footer |

---

## 4. Component Layout Specifications

### Top Navigation Bar
- **Class**: `.navbar.navbar-expand-lg.navbar-light.bg-light.fixed-top.shadow-sm.py-1`
- **Brand**: `NuRi's Tools` (`fw-bold py-0 fs-6`)
- **Nav Links** (`font-size: 0.85rem`, `py-1`):
  - `Iframe` (`<i class="bi bi-code-slash me-1"></i>`)
  - `YouTube` (`<i class="bi bi-youtube me-1"></i>`)
  - `Pickup(KR)` (`<i class="bi bi-apple me-1"></i>`)
  - `Pickup(JP)` (`<i class="bi bi-apple me-1"></i>`)
  - `Pickup(HK)` (`<i class="bi bi-apple me-1"></i>`)
- **Active State**: `.active.fw-semibold`

### Title Bar
- Single-row flex container (`d-flex align-items-center justify-content-between pt-1 pb-1 mb-2 border-bottom`)
- **Left**: Title text (`h5.mb-0.fw-bold.fs-6`), Pickup badge (`#pickupLink` with `.badge.bg-danger`), country pill badge (`KR` / `JP` / `HK`)
- **Right**: Action buttons only:
  - Loading spinner (`#loadingSpinner`)
  - Refresh button (`#refresh`, orange, icon-only `<i class="bi bi-arrow-clockwise"></i>`)
  - Debug toggle button (`#btnDebugToggle`, icon-only `<i class="bi bi-bug"></i>` / `<i class="bi bi-bug-fill"></i>`, local only)
  - *No additional buttons or text should be added to the title bar.*

### Model Navigation Tabs
- Scrollable container: `.model-nav-wrap` with horizontal scrolling (`overflow-x: auto; white-space: nowrap`)
- Thin scrollbar (`height: 3px; thumb: #ccc`)
- Nav links: `.nav-link` with `font-size: 0.78rem; padding: 0.2rem 0.6rem;`

### Stock Table
- Wrapper: `.table-box-wrap` with `max-height: calc(100vh - 225px); overflow: auto;`
- Font size: `0.7rem; white-space: nowrap;`
- Header: Sticky `thead th` (`top: 0; z-index: 10; background-color: #f1f3f5;`)
- Model name column:
  - Header: Sticky `th.model-header` (`left: 0; z-index: 11; background-color: #e9ecef;`)
  - Body: Sticky `tbody th.model-name` (`left: 0; z-index: 5; background-color: #fff;`)
  - Anchor link inside: `color: inherit; text-decoration: none;` with hover underline (`color: var(--bs-primary)`)
- Data cells (`td`): `padding: 0.15rem 0.35rem; min-width: 68px; cursor: pointer; text-align: center;`

### Watch Panel (`#watchPanel`)
- Borderless card with light background: `.card.border-0.bg-light.py-1.px-2.mb-2`
- Header controls:
  - Title: `<i class="bi bi-bell me-1"></i>Watch items`
  - Subtitle: `(클릭 시 추가/삭제)` (`font-size: 0.68rem; text-muted`)
  - Right container (`#watchControls`): Audio checkbox (`#audiocheck`, `font-size: 0.72rem`) and `WATCH` toggle button (`#watchButton`, `.btn-danger` / `.btn-success`, `font-size: 0.72rem`)
- Log textarea: `#logtext` with `.font-monospace`, `rows="2"`, `font-size: 0.7rem`

### Converters (`if_convert.html`, `ut_convert.html`)
- Content wrapper: `.container.py-3` with `max-width: 800px`
- Section title: `h4.fw-bold` with small subtitle (`text-muted fs-6`)
- Input / Result textareas: `.font-monospace`, `font-size: 0.85rem`
- Copy button: `.btn.btn-outline-secondary.btn-sm.py-0.px-2.fw-semibold` aligned with result label, transitions to `.btn-success` upon copy
