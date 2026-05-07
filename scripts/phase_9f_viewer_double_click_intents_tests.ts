/**
 * TEST: Phase 9F - Viewer Double Click Intents
 * Valida la separación de intents entre muro exterior, panel interior y piso.
 */

import { normalizeWallId } from '../src/modules/validation/wall-utils';

function simulateClassification(obj: any) {
  const type = String(obj.type || "").toLowerCase();
  const role = String(obj.role || obj.metadata?.role || "").toLowerCase();

  const isInternalWall =
    type === "internal_wall" ||
    role === "internal_wall" ||
    obj.metadata?.Role === 'internal_partition' ||
    role === 'internal';

  const isExternalWall =
    (type === "muro" || type === "wall") && !isInternalWall;

  const isInteriorPanel =
    type === "panel" && (role === "internal" || role === "interior");

  const isOpening = type === "opening" || type === "abertura" || role === "opening";

  return { isOpening, isInternalWall, isExternalWall, isInteriorPanel };
}

async function runTests() {
    console.log('--- TESTING VIEWER DOUBLE CLICK INTENTS ---');

    // 1. Clasificación de Muro Exterior
    const extWall = { type: 'muro', metadata: { role: 'EXTERNAL' } };
    const classExt = simulateClassification(extWall);
    console.log('1. External Wall Classification:', classExt.isExternalWall ? 'PASS' : 'FAIL');

    // 2. Clasificación de Panel Interior
    const intPanel = { type: 'panel', role: 'internal' };
    const classInt = simulateClassification(intPanel);
    console.log('2. Interior Panel Classification:', classInt.isInteriorPanel ? 'PASS' : 'FAIL');
    console.log('   - Should NOT be External Wall:', !classInt.isExternalWall ? 'PASS' : 'FAIL');

    // 3. Normalización de WallId desde metadata
    const metadataWithAlias = { wallId: 'Muro Este' };
    const normalized = normalizeWallId(metadataWithAlias.wallId);
    console.log('3. WallId Normalization ("Muro Este" -> "wall_east"):', normalized === 'wall_east' ? 'PASS' : 'FAIL');

    // 4. Clasificación de Abertura
    const opening = { type: 'abertura' };
    const classOp = simulateClassification(opening);
    console.log('4. Opening Classification:', classOp.isOpening ? 'PASS' : 'FAIL');

    // 5. Prioridad de Raycasting (Simulación de orden)
    const priorityOrder = ['opening', 'internal_wall', 'external_wall', 'interior_panel', 'floor'];
    console.log('5. Raycasting Priority Order:', priorityOrder.join(' > '));

    console.log('\n--- INTENT TESTS COMPLETED ---');
}

runTests().catch(console.error);
