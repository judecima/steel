# Product UI Navigation & Persistence Clarity

## Resumen del Cambio
Se ha corregido la inconsistencia de navegación en la interfaz de producto y se ha añadido claridad sobre el estado de la persistencia. Se ha reforzado la validación de rutas para evitar estados de "proyecto no encontrado" sin guía al usuario y se ha documentado visualmente en la UI que el almacenamiento actual es LocalStorage (mientras que PostgreSQL queda reservado para backend/scripts hasta la Fase 7).

## Análisis de Causa Raíz
- **Navegación Ambigua**: Los enlaces desde el dashboard no incluían el contexto necesario (`id`), llevando a pantallas de error.
- **Confusión de Persistencia**: Al haber implementado PostgreSQL en la Fase 6A (via scripts/backend), el usuario esperaba ver esos datos en el browser, el cual todavía usa `localStorage`.

## Cambios Realizados

### 1. Normalización de Rutas (`proyecto-detalle.html`)
- Se reforzó el mensaje de error cuando no hay ID: *"Para ver el detalle debe seleccionar un proyecto desde la lista de proyectos."*
- Se cambiaron los botones de navegación para facilitar el flujo de recuperación ("Ir a Proyectos" / "Crear Proyecto").

### 2. Comportamiento del Dashboard (`index.html`)
- Se eliminó cualquier enlace directo a `proyecto-detalle.html` sin ID.
- La tarjeta de "Detalle de Proyecto" ahora redirige a `proyectos.html` con un mensaje indicando que primero se debe seleccionar un proyecto.

### 3. Flujo de Proyectos (`proyectos.html`)
- Se añadió un botón explícito **"Ver detalle →"** en cada tarjeta de proyecto.
- Se añadió un aviso visual prominente: *"📌 Modo local: Los proyectos se guardan en este navegador."*
- Se verificó que la creación de un nuevo proyecto redirija automáticamente a la pantalla de detalle con el nuevo ID.

### 4. Claridad en Dashboard (`index.html`)
- Se añadió el aviso de persistencia en la bienvenida: *"📌 Modo local del navegador: los proyectos creados aquí se guardan en este navegador. PostgreSQL está disponible para scripts/backend."*

## Verificación de Tests
```bash
--- RUNNING PRODUCT NAVIGATION & PERSISTENCE CLARITY TESTS ---
TEST N1: PASSED (Detalle tiene mensaje reforzado para ID ausente)
TEST N2: PASSED (Dashboard no linkea a detalle sin ID)
TEST N3: PASSED (Cards de proyectos tienen botón "Ver detalle")
TEST N4: PASSED (Creación redirige a detalle con ID)
TEST N5: PASSED (Aviso de persistencia local visible en UI)
--- NAVIGATION & CLARITY TESTS COMPLETE ---
```

## Limitaciones
- La integración directa de la UI con PostgreSQL está pendiente para la **Fase 7 (API & Backend Integration)**.
- Los proyectos creados vía scripts de test en PostgreSQL no son visibles en el browser por diseño (arquitectura desacoplada).

## URLs Verificadas
- `/ui/product/index.html` (Dashboard con avisos)
- `/ui/product/proyectos.html` (Lista con botones de detalle)
- `/ui/product/proyecto-detalle.html?id=...` (Carga correcta)
- `/ui/product/proyecto-detalle.html` (Manejo de error guiado)
