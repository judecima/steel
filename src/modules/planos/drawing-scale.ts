import { Vector2 } from './types';

export class DrawingScale {
    /**
     * Converts meters to PDF points based on a scale (e.g. 1:50)
     */
    static metersToPoints(meters: number, scale: number): number {
        // 1 meter = 1000 mm
        // 1 point = 1/72 inch = 0.352778 mm
        // points = (meters * 1000 / scale) / 0.352778
        return (meters * 1000 / scale) * 2.83465;
    }

    /**
     * Projects a coordinate from engineering space to viewport space
     */
    static project(point: Vector2, center: Vector2, scale: number, viewportOffset: Vector2): Vector2 {
        return {
            x: viewportOffset.x + this.metersToPoints(point.x - center.x, scale),
            y: viewportOffset.y + this.metersToPoints(point.y - center.y, scale)
        };
    }
}
