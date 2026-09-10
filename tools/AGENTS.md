# AGENTS.md (tools/)

Operational guidelines and technical specifications for web utilities under `tools/`.

---

## 1. Directory Overview

Static web utilities hosted under `tools/`:
- **Apple Store Pickup Checker**: Real-time pickup availability checker for Korea (`stock_kr.html`), Japan (`stock_jp.html`), and Hong Kong (`stock_hk.html`).
- **Code Converters**: Tag converters for iframe-to-object (`if_convert.html`) and YouTube-to-embed (`ut_convert.html`).

---

## 2. Development Commands

- **Local Web Server**:
  ```bash
  # Run from repository root or tools directory
  python3 -m http.server 8888 --directory tools
  ```
- **Syntax Check**:
  ```bash
  node -c tools/js/*.js
  ```
- **Model Data Extractor CLI**:
  ```bash
  # Extract part numbers from Apple Store and output sorted JS
  node tools/scripts/extract_models.js --country kr --device iphone-18-pro --output tools/js/kr_iphone18pro.js
  node tools/scripts/extract_models.js --country jp --device iphone-duo --output tools/js/jp_iphoneduo.js
  node tools/scripts/extract_models.js --country hk --device iphone-18-pro --output tools/js/hk_iphone18pro.js
  ```

---

## 3. UI & Design Standards

Visual design elements, theme tokens, color palettes, and component layouts are isolated in:
- [`DESIGN.md`](DESIGN.md)

Agents modifying layout, colors, typography, or styling must strictly adhere to the specifications in `tools/DESIGN.md`.

Key technical constraints:
- **Framework**: Bootstrap 5.3.3 (`data-bs-*` attributes)
- **Icons**: Bootstrap Icons 1.11.3 (`bi bi-*` syntax exclusively)
- **Zero jQuery**: Native browser APIs and CSS for all visual interactions
- **Analytics**: GTM container `GTM-WBXWKVDB`

---

## 4. Core Systems & Implementation Patterns

### Model Part Sorting Specification
When generating or updating model part files, enforce this strict sorting hierarchy:
1. **Model Name**: `pro` first, `max` second.
2. **Capacity**: Ascending order, distinguishing GB and TB: `256GB` < `512GB` < `1TB` < `2TB`.
3. **Color**: Alphabetical order (`black` < `burgundy` < `glacier` < `silver`).

### Country-Specific Apple Store Jump URLs
When clicking the title `Pickup` badge (`#pickupLink`) or the first column model name (`th.model-name a`), jump to the corresponding country's official store buy page in a new tab:
- **KR**: `https://www.apple.com/kr/shop/buy-iphone/<device-slug>`
- **JP**: `https://www.apple.com/jp/shop/buy-iphone/<device-slug>`
- **HK**: `https://www.apple.com/hk/shop/buy-iphone/<device-slug>`
The `#pickupLink` href is updated dynamically upon SPA tab switching (`switchModel`).

### Store Seed Codes for Pickup API
- **KR**: `['R692', 'R747']` (Garosugil, Yeouido)
- **JP**: `['R079', 'R091', 'R048']` (Ginza, Shinsaibashi, Fukuoka Tenjin)
- **HK**: `['R499', 'R409']` (Causeway Bay, ifc mall)

### Local Debug Mode & Mock Data
- Mock files reside in `tools/test_data/mock_stock_<country>.json`.
- Automatically active on `localhost` or `127.0.0.1`.
- Can be manually toggled via `#btnDebugToggle`.
- Automatic fallback occurs on local servers if the live Apple API call fails.

---

## 5. Specific Rules for Tools

1. **Backward Compatibility**: Never delete legacy model files (`kr_iphone17pro.js`, etc.).
2. **Design Parity**: Maintain exact 1:1 design and architecture parity across KR, JP, and HK versions.
3. **Zero External Dependencies**: Do not reintroduce jQuery or heavy third-party bundles into `tools/`.
