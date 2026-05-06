# Current State — Steel Frame Engine

## Approved Completed Phases
- Phase 0 — Modular foundation
- Phase 0.5 — Safety Boundaries & Regression Hardening
- Phase 1 — Planning Layer Intelligence
- Phase 2 — Global Planning
- Phase 3 — Structural Intelligence
- Phase 3B — Diseño preliminar de dinteles avanzados
- Phase 4A — Digital Twin Core (Certified)
- Phase 4B — Visualización Industrial Avanzada (Certified)
- Phase 5 — Fabricación y Exportación Industrial (Certified)
- Phase 6 — Product UI (Certified)
- Phase 6A — Persistencia PostgreSQL y Dashboard Local (Certified)
- Phase 7 — API Local UI ↔ PostgreSQL (Certified)
- Phase 7.5A — Product UX Stabilization (Certified)
- Phase 8A — Generador Base de Planos Técnicos (Certified)
- Phase 9A — Migración Product UI a Next.js (Certified)
- Phase 9C — Migración API Express a Next.js (Certified)
- Phase 9B — Advanced UI Features (Certified)
- Phase 9D — Advanced Persistence & Production (Certified)
- Phase 9D.1 — Real Export Files & PDF Repair (Certified)

## Current Phase
*   **Fase 10: Visual Editor & BIM Export** - PENDIENTE

## Current Capabilities
- Modular foundation geometry generation
- Wall panelization with California corners
- Precheck validation to block impossible configurations
- Regression test suite (test:regression)
- Multi-dimensional quality scoring system
- Rule-based decision making for conflict resolution
- Traceable metadata and decision logs
- Deterministic beam search for global planning
- Equivalency collapse for standardization
- structural member extraction
- load generation
- preliminary load combinations
- preliminary member checks
- header escalation matrix
- roof preliminary validation
- anchor preliminary validation
- structural reporting
- multi-mode industrial visualization (Standard, Structural, Shop, Sequence, Inspection)
- dynamic mode switching without page reload
- render-ready DTO generation certified
- Industrial BOM & Consolidated CutList generation
- Panel-specific fabrication packages
- Assembly sequence sheets based on design trace
- Multi-format industrial export (CSV, JSON, PDF, Excel)
- Product-centric UI with project management and versioning
- Specialized Product Viewer modes (Cliente, Taller, Ingeniería)
- Automated production tracking at panel and wall levels
- Price-neutral budgeting system with configurable catalogs
- Multi-layer persistence architecture (PostgreSQL, File, LocalStorage)
- Local Dashboard for system health and unified navigation

## Current Limitations
- UI integration with PostgreSQL requires API layer (Fase 7)
- no final 3D editor yet
- no IFC/BIM export yet

## Safety Boundary
The engine must not claim structural validity. Outputs are constructive drafts requiring structural validation.
