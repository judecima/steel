# Current State — Steel Frame Engine

## Current Phase
*   **Fase 8A: Generador Base de Planos Técnicos (PDF)** - **COMPLETO**
*   **Fase 8B: Planos Avanzados y Detalles** - PENDIENTE

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
