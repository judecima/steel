import { HouseInput, WallRole, Abertura } from '../src/core/types';

export const GlobalPlanningFixtures = {
    // 1. Una casa cuadrada básica para pruebas de repetición
    squareHouse: (): HouseInput => ({
        width: 10,
        length: 10,
        minHeight: 2.6,
        roofType: 'one_slope',
        roofSlope: 0,
        openings: [] // Sin aberturas, completamente uniforme
    }),

    // 2. Una casa que fuerza un conflicto de esquina
    cornerConflictHouse: (): HouseInput => ({
        width: 4.0,
        length: 4.0,
        minHeight: 2.6,
        roofType: 'one_slope',
        roofSlope: 0,
        openings: []
    }),

    // 3. Una casa grande para pruebas de crecimiento de beam acotado
    largeHouse: (): HouseInput => ({
        width: 12,
        length: 12,
        minHeight: 2.6,
        roofType: 'one_slope',
        roofSlope: 0,
        openings: [
            { wallId: 'wall_north', type: 'ventana', width: 2.0, height: 1.0, position: 5.0, sillHeight: 1.0 },
            { wallId: 'wall_east', type: 'puerta', width: 1.0, height: 2.0, position: 5.0 },
            { wallId: 'wall_south', type: 'ventana', width: 2.0, height: 1.0, position: 5.0, sillHeight: 1.0 },
            { wallId: 'wall_west', type: 'puerta', width: 1.0, height: 2.0, position: 5.0 }
        ]
    })
};
