import { EngineFacade } from '../src/modules/product/engine-facade';
import { HouseInput } from '../src/core/types';
import { logger } from '../src/utils/logger';

async function testPhase9F() {
    console.log('--- STARTING PHASE 9F INTEGRATION TESTS ---');

    const input: HouseInput = {
        width: 4.0,
        length: 12.0,
        minHeight: 2.6,
        roofType: 'one_slope',
        roofSlope: 10,
        openings: [
            { wallId: 'wall_east', type: 'window', width: 1.2, height: 1.0, position: 2.0, sillHeight: 0.9 },
            { wallId: 'wall_east', type: 'door', width: 0.9, height: 2.0, position: 6.0, sillHeight: 0 }
        ],
        internalWalls: [
            {
                id: 'iw_1',
                startXmm: 2000,
                startZmm: 0,
                endXmm: 2000,
                endZmm: 4000,
                heightMm: 2600,
                thicknessMm: 100,
                openings: []
            }
        ]
    };

    console.log('1. Testing EngineFacade.generate with Internal Walls...');
    try {
        const result = EngineFacade.generate(input);
        
        console.log('   - Walls generated:', result.house.muros.length + (result.house.murosInternos?.length || 0));
        console.log('   - Internal wall present:', (result.house.murosInternos?.length || 0) === 1 ? 'OK' : 'FAIL');
        console.log('   - Industrial segments:', result.construction.metadata.industrialSegments?.length || 0);
        console.log('   - Opening frames:', result.construction.metadata.openingFrames?.length || 0);

        // Verify long wall splitting (12m wall should be split into at least 3 panels of 4m)
        const frontWallPanels = result.construction.panels.filter(p => p.wallId === 'wall_east');
        console.log('   - East wall (12m) panels:', frontWallPanels.length);
        if (frontWallPanels.length >= 3) {
            console.log('   - Industrial Panelization: OK (Wall split into max 4m segments)');
        } else {
            console.log('   - Industrial Panelization: FAIL (Wall NOT split correctly)');
        }

        // Verify Opening Frame members
        const firstPanelWithOpening = result.construction.panels.find(p => p.aberturas.length > 0);
        if (firstPanelWithOpening) {
            const hasKings = firstPanelWithOpening.studs.some(s => s.metadata?.industrialRole === 'king');
            const hasJacks = firstPanelWithOpening.studs.some(s => s.metadata?.industrialRole === 'jack');
            console.log('   - Structural Framing (Kings):', hasKings ? 'OK' : 'FAIL');
            console.log('   - Structural Framing (Jacks):', hasJacks ? 'OK' : 'FAIL');
        }

        console.log('\n2. Testing 1D Cut Optimizer...');
        const allStuds = result.construction.panels.flatMap(p => p.studs);
        const segments = allStuds.map(s => s.height * 1000);
        
        const { optimizeProfileCuts } = require('../apps/product-ui/src/lib/engine/cutlist/profileCutOptimizer');
        const optimization = optimizeProfileCuts(segments, 6000);
        const totalUsed = segments.reduce((a: number, b: number) => a + b, 0);
        const totalStock = optimization.length * 6000;
        const efficiency = totalStock > 0 ? totalUsed / totalStock : 0;
        
        console.log('   - Total segments to cut:', segments.length);
        console.log('   - Optimized bars (6m):', optimization.length);
        console.log('   - Efficiency:', (efficiency * 100).toFixed(1) + '%');

        console.log('\n--- PHASE 9F TESTS COMPLETED ---');
    } catch (error: any) {
        console.error('!!! PHASE 9F TESTS FAILED:', error.message);
        process.exit(1);
    }
}

testPhase9F();
