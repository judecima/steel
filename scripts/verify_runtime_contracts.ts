import fs from "fs";
import path from "path";

const root = process.cwd();

function read(relative: string) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function fail(message: string): never {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function assert(condition: boolean, message: string) {
  if (!condition) fail(message);
  console.log(`✅ ${message}`);
}

const viewer = read("apps/product-ui/public/qa-viewer/viewer.js");
const viewerPage = read("apps/product-ui/src/app/proyectos/[id]/viewer/page.tsx");
const openingsRoute = read("apps/product-ui/src/app/api/proyectos/[id]/aberturas/route.ts");
const internalRoute = read("apps/product-ui/src/app/api/proyectos/[id]/internal-walls/route.ts");

assert(!viewer.includes("data.type === 'panel'") && !viewer.includes('data.type === "panel"'), "viewer no usa panel como abertura");
assert(viewer.includes("VIEWER_EXTERNAL_WALL_DBLCLICK"), "viewer emite evento muro exterior");
assert(viewer.includes("VIEWER_INTERIOR_PANEL_DBLCLICK"), "viewer emite evento panel interior");
assert(viewer.includes("VIEWER_FLOOR_DBLCLICK"), "viewer emite evento piso");
assert(viewer.includes("normalizeWallId"), "viewer normaliza wallId");

assert(viewerPage.includes("VIEWER_EXTERNAL_WALL_DBLCLICK"), "page maneja muro exterior");
assert(viewerPage.includes("VIEWER_INTERIOR_PANEL_DBLCLICK"), "page maneja panel interior");
assert(viewerPage.includes("VIEWER_FLOOR_DBLCLICK"), "page maneja piso");

assert(!openingsRoute.includes("require("), "aberturas no usa require dinámico");
assert(openingsRoute.includes("mapUIConfigToEngineInput"), "aberturas usa mapper común");
assert(openingsRoute.includes("normalizeWallId"), "aberturas normaliza wallId");
assert(openingsRoute.indexOf("EngineFacade.generate") < openingsRoute.indexOf("saveProject"), "aberturas genera antes de guardar");
assert(!openingsRoute.includes("warning: 'Regeneración fallida'"), "aberturas no devuelve ok true con warning");

assert(internalRoute.includes("mapUIConfigToEngineInput"), "internal-walls usa mapper común");
assert(internalRoute.indexOf("EngineFacade.generate") < internalRoute.indexOf("saveProject"), "internal-walls genera antes de guardar");
assert(internalRoute.includes("INTERNAL_WALL_TOO_SHORT"), "internal-walls valida longitud mínima");

console.log("\n✅ Runtime contracts OK");
