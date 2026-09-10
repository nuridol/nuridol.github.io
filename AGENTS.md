# AGENTS.md

General guidelines and operational instructions for AI coding agents working on `nuridol.github.io`.

---

## 1. Project Overview

`nuridol.github.io` is a personal GitHub Pages repository comprising:
- **Jekyll Blog / Site**: Personal blog pages, posts, layouts, and static assets at the root and under `_posts/`, `_layouts/`, `_pages/`.
- **Web Utilities (`tools/`)**: Standalone, lightweight browser-based tools including Apple Store Pickup Checkers and HTML tag converters.

For work specifically within the `tools/` directory, refer to the dedicated guidelines in:
- [`tools/AGENTS.md`](tools/AGENTS.md)

---

## 2. General Development Principles

- **Response Style**:
  - Concise, direct, and to the point.
  - Technical precision over verbosity.
  - No emojis.
- **Documentation Layers**:
  - Code → How
  - Tests → What
  - Commits → Why
  - Comments → Why not
- **Planning**: Make a plan first and proceed step by step.

---

## 3. Git & Commit Guidelines

- Write clean, descriptive commit messages following the Conventional Commits format when possible (`feat:`, `fix:`, `refactor:`, `docs:`).
- Keep changes atomic and test before committing.
- Do not commit unintended local/scratch files.
