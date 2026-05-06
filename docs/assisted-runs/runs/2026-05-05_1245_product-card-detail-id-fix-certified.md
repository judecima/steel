# Product Card Detail ID Fix — Certified

## Resumen del Cambio
Se ha realizado una reingeniería completa de la navegación de las tarjetas de proyecto para eliminar comportamientos inconsistentes y asegurar que el ID del proyecto se transmita siempre en la URL. Se ha eliminado la "navegación mixta" (combinación de `<a>` y `onclick`) en favor de enlaces `<a>` puros y limpios, protegidos por guardias duras en tiempo de ejecución.

## Análisis de Causa Raíz
1.  **Navegación Mixta**: La presencia de manejadores `onclick` junto con atributos `href` causaba conflictos en algunos entornos de navegador, a veces disparando la navegación antes de procesar el parámetro.
2.  **Burbujeo de Eventos**: Botones internos (como "Ver detalle") podían interceptar el clic de formas no deseadas.
3.  **Sidebar Redirects**: En la página de detalle, algunos enlaces del sidebar (como "Configuración") apuntaban a la URL base sin ID, lo que "limpiaba" la URL si el usuario hacía clic estando ya en la página.
4.  **Falta de Guardias**: Proyectos con IDs corruptos o faltantes en LocalStorage intentaban navegar a URLs inválidas.

## Cambios Realizados

### 1. Refactor de Tarjetas (`proyectos.html`)
- **Enlaces Puros**: Se eliminaron los manejadores `onclick` de navegación. Ahora se usa exclusivamente `<a href="...">`.
- **Neutralización de Botones Internos**: Se añadió `pointer-events: none;` al botón visual "Ver detalle" para que el clic siempre sea capturado por el enlace padre `<a>`.
- **Guardia Dura**: Si un proyecto no tiene ID, el sistema no renderiza un enlace, sino una tarjeta de error estática: *"⚠️ Proyecto inválido: falta ID"*.

### 2. Contexto en Sidebar (`proyecto-detalle.html`)
- Se actualizaron los enlaces del sidebar para que todos (incluyendo "Configuración") mantengan el contexto del ID actual mediante JavaScript al cargar la página.

### 3. Diagnóstico en Tiempo de Ejecución
- Se añadieron logs de depuración filtrables (`[DEBUG]`) que muestran exactamente qué proyectos se están cargando y con qué IDs, facilitando la auditoría sin necesidad de herramientas externas.

## Verificación de Tests
```bash
--- RUNNING STRICT PRODUCT NAVIGATION TESTS ---
TEST S1: PASSED (Cards usan <a> puro sin onclick de navegación)
TEST S2: PASSED (Guardia dura para IDs faltantes presente)
TEST S3: PASSED (Botón interno neutralizado para evitar burbujeo conflictivo)
TEST S4: PASSED (Redirección tras creación usa helper seguro)
--- STRICT NAVIGATION TESTS COMPLETE ---
```

## Antes vs Después (Generación de HTML)
- **Antes**: `<a class="project-card" href="proyecto-detalle.html?id=123" onclick="...">`
- **Después**: `<a class="project-card" href="proyecto-detalle.html?id=123">` (Limpio y determinista).
