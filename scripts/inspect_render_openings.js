const fs = require('fs');
const path = require('path');

function inspectOpenings() {
    const renderScenePath = path.resolve(__dirname, '../render-scene.json');
    if (!fs.existsSync(renderScenePath)) {
        console.error(`RenderSceneDTO not found at ${renderScenePath}`);
        process.exit(1);
    }

    const scene = JSON.parse(fs.readFileSync(renderScenePath, 'utf8'));
    console.log("=== JSON TRUTH AUDIT: OPENING FRAMING ===\n");

    const panels = new Set();
    const openingData = {};

    // Find all openings
    scene.objects.filter((o) => o.type === 'opening').forEach((op) => {
        const panelId = op.metadata?.panelId;
        panels.add(panelId);
        
        openingData[op.sourceId] = {
            id: op.sourceId,
            type: op.metadata?.type,
            panelId: panelId,
            framing: {
                king: 0,
                jack: 0,
                cripple_top: 0,
                cripple_bottom: 0,
                sill: 0,
                header: 0
            },
            objects: []
        };
    });

    console.log(`Openings found: ${Object.keys(openingData).length}`);

    // Map framing objects to openings
    scene.objects.forEach((obj) => {
        if (!panels.has(obj.metadata?.panelId)) return;
        
        const opening = Object.values(openingData).find((op) => op.panelId === obj.metadata?.panelId);
        if (!opening) return;

        if (obj.type === 'header') {
            opening.framing.header++;
            opening.objects.push({type: obj.type, id: obj.id, dimensions: obj.dimensions, position: obj.position});
        }
        if (obj.type === 'sill') {
            opening.framing.sill++;
            opening.objects.push({type: obj.type, id: obj.id, dimensions: obj.dimensions, position: obj.position});
        }
        if (obj.type === 'stud') {
            const role = obj.metadata?.role;
            if (role && opening.framing[role] !== undefined) {
                opening.framing[role]++;
                opening.objects.push({type: obj.type, role: role, id: obj.id, dimensions: obj.dimensions, position: obj.position});
            }
        }
    });

    // Print summary
    for (const [id, op] of Object.entries(openingData)) {
        console.log(`\nOpening: ${id} (${op.type})`);
        console.log(`Panel: ${op.panelId}`);
        console.log(`Framing Counts:`);
        console.table(op.framing);
        
        console.log(`Objects Detailed:`);
        op.objects.forEach((obj) => {
            console.log(`  - [${obj.type}] ${obj.role || ''} | Pos: (${obj.position.x.toFixed(2)}, ${obj.position.y.toFixed(2)}, ${obj.position.z.toFixed(2)}) | Dim: (${obj.dimensions.x.toFixed(2)}, ${obj.dimensions.y.toFixed(2)}, ${obj.dimensions.z.toFixed(2)})`);
        });
        
        // Group cripples to check modularity
        const topCripples = op.objects.filter((o) => o.role === 'cripple_top');
        const xPositions = topCripples.map((o) => parseFloat(o.position.x.toFixed(2))).sort();
        console.log(`  Top Cripple X-Positions: [${xPositions.join(', ')}]`);
        
        // Expected modular rhythm (0.4m spacing is standard)
        // Note: position x in DTO includes panel.offset. But delta between cripples should be ~0.4m
        if (xPositions.length > 1) {
            const deltas = [];
            for (let i = 1; i < xPositions.length; i++) {
                deltas.push((xPositions[i] - xPositions[i-1]).toFixed(2));
            }
            console.log(`  Top Cripple Deltas: [${deltas.join(', ')}]`);
        }

        // Check missing expectations
        if (op.type === 'window') {
            if (op.framing.king < 2) console.log(`  ❌ Missing KING studs! Found ${op.framing.king}`);
            if (op.framing.jack < 2) console.log(`  ❌ Missing JACK studs! Found ${op.framing.jack}`);
            if (op.framing.cripple_top < 1) console.log(`  ❌ Missing CRIPPLE_TOP! Found ${op.framing.cripple_top}`);
            if (op.framing.cripple_bottom < 1) console.log(`  ❌ Missing CRIPPLE_BOTTOM! Found ${op.framing.cripple_bottom}`);
            if (op.framing.sill < 1) console.log(`  ❌ Missing SILL! Found ${op.framing.sill}`);
            if (op.framing.header < 1) console.log(`  ❌ Missing HEADER! Found ${op.framing.header}`);
        }
        if (op.type === 'door') {
            if (op.framing.king < 2) console.log(`  ❌ Missing KING studs! Found ${op.framing.king}`);
            if (op.framing.jack < 2) console.log(`  ❌ Missing JACK studs! Found ${op.framing.jack}`);
            if (op.framing.sill > 0) console.log(`  ❌ Door should NOT have SILL! Found ${op.framing.sill}`);
            if (op.framing.cripple_bottom > 0) console.log(`  ❌ Door should NOT have CRIPPLE_BOTTOM! Found ${op.framing.cripple_bottom}`);
            if (op.framing.header < 1) console.log(`  ❌ Missing HEADER! Found ${op.framing.header}`);
        }
    }
}

inspectOpenings();
