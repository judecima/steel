import { HouseInput, WallRole, Opening } from '../src/core/types';

export const GlobalPlanningFixtures = {
    // 1. A basic square house for repetition testing
    squareHouse: (): HouseInput => ({
        width: 10,
        length: 10,
        minHeight: 2.6,
        roofType: 'one_slope',
        roofSlope: 0,
        openings: [] // No openings, completely uniform
    }),

    // 2. A house that forces a corner conflict
    cornerConflictHouse: (): HouseInput => ({
        width: 4.0,
        length: 4.0,
        minHeight: 2.6,
        roofType: 'one_slope',
        roofSlope: 0,
        openings: []
    }),

    // 3. A large house for bounded beam growth testing
    largeHouse: (): HouseInput => ({
        width: 12,
        length: 12,
        minHeight: 2.6,
        roofType: 'one_slope',
        roofSlope: 0,
        openings: [
            { wallId: 'wall_north', type: 'window', width: 2.0, height: 1.0, position: 5.0, sillHeight: 1.0 },
            { wallId: 'wall_east', type: 'door', width: 1.0, height: 2.0, position: 5.0 },
            { wallId: 'wall_south', type: 'window', width: 2.0, height: 1.0, position: 5.0, sillHeight: 1.0 },
            { wallId: 'wall_west', type: 'door', width: 1.0, height: 2.0, position: 5.0 }
        ]
    })
};
