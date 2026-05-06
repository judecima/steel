# Run Log: Fase 7.5A Detalle Runtime Handler Repair

**Date:** 2026-05-05 21:16  
**Status:** SUCCESS  
**Phase:** 7.5A (Regression Fix)

## Root Cause
The regression was caused by two main factors:
1.  **Unclosed Script Tags**: During the progressive layout refactor, the main script tags in `proyectos.html` and `proyecto-detalle.html` were accidentally left open (missing `</script>` before a `</div>`). This caused a `SyntaxError` that blocked all subsequent function declarations.
2.  **Global Scope Isolation**: Functions used in inline `onclick`/`onchange` handlers were not explicitly attached to the `window` object, leading to `ReferenceError` when called from the DOM.

## Functions Exposed
The following functions are now explicitly available in the global `window` scope:
- `cambiarEstado`
- `regenerarProyecto`
- `marcarCambioPendiente`
- `probarRegenerarAPI`
- `abrirModal`
- `cerrarModal`
- `crearProyecto`
- `abrirProyecto`
- `init`

## Files Modified
- `ui/product/proyecto-detalle.html`: Fixed script tags, added global error guard, and exposed handlers.
- `ui/product/proyectos.html`: Fixed script tags and ensured exposure.
- `ui/product/index.html`: Standardized dashboard navigation links to `/ui/product/proyectos.html`.
- `scripts/product_ux_tests.ts`: Added automated checks for global exposure and static handler validity.

## Tests Executed
- **Automated**: `scripts/product_ux_tests.ts` (Passed 9/9).
- **Certification**: `scripts/product_routing_certification_tests.ts` (Passed 8/8).
- **API**: `npm run test:api` (Passed 7/7).

## Browser Verification Result
- **Success**: "+ Nuevo Proyecto" modal opens correctly.
- **Success**: Configuration changes trigger the warning banner.
- **Success**: "Regenerar Proyecto" and "Aplicar Estado" buttons function without errors.
- **Success**: Global error listener captures and displays "función no disponible" panel for undefined calls.
- **Success**: Active project persistence correctly recovers ID from storage when missing in URL.
