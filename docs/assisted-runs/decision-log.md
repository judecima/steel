# Decision Log

## Decision 2026-05-02 — Initial Technical Decisions

### Context
Establishing the foundation for the Steel Frame Engine.

### Decision
1. Separar generación constructiva de validación estructural.
2. Usar reglas configurables y no hardcodeadas.
3. Usar hard veto antes de scoring.
4. Usar scoring explicable multi-componente.
5. Usar beam search configurable para planificación global.
6. Mantener IA como asistente, nunca como fuente de verdad estructural.

### Reason
Ensure safety, modularity, and explicit rule management.

### Alternatives Considered
- Hardcoded rules (rejected due to inflexibility).
- AI as truth source (rejected due to safety and certification risks).

### Consequences
Requires robust testing and validation layers, but provides safety and configurability.

### Status
Accepted
