import { PlanoTableDTO, Vector2 } from './types';

export class TablesBuilder {
    static build(
        title: string,
        headers: string[],
        rows: string[][],
        position: Vector2,
        width: number
    ): PlanoTableDTO {
        return {
            title,
            headers,
            rows,
            position,
            width
        };
    }
}
