export type ArchivoExportable = {
    id: string;
    etiqueta: string;
    archivo: string;
    estado: 'pendiente' | 'disponible' | 'error';
};

export const ARCHIVOS_EXPORTABLES: ArchivoExportable[] = [
    { id: 'bom',      etiqueta: 'Lista de Materiales (BOM)',   archivo: 'BOM.csv',      estado: 'pendiente' },
    { id: 'corte',    etiqueta: 'Lista de Corte',              archivo: 'CUTLIST.csv',  estado: 'pendiente' },
    { id: 'proyecto', etiqueta: 'Proyecto JSON',               archivo: 'Proyecto.json', estado: 'pendiente' },
    { id: 'montaje',  etiqueta: 'Instrucciones de Montaje',    archivo: 'Montaje.txt',  estado: 'pendiente' },
    { id: 'reporte',  etiqueta: 'Reporte (TSV)',               archivo: 'reporte.tsv',  estado: 'pendiente' }
];

export async function verificarEstadoExportaciones(baseUrl: string): Promise<ArchivoExportable[]> {
    const resultados: ArchivoExportable[] = [];
    for (const archivo of ARCHIVOS_EXPORTABLES) {
        try {
            const resp = await fetch(`${baseUrl}/${archivo.archivo}`, { method: 'HEAD' });
            resultados.push({ ...archivo, estado: resp.ok ? 'disponible' : 'error' });
        } catch {
            resultados.push({ ...archivo, estado: 'error' });
        }
    }
    return resultados;
}

export function descargarArchivo(baseUrl: string, archivo: ArchivoExportable): void {
    const a = document.createElement('a');
    a.href = `${baseUrl}/${archivo.archivo}`;
    a.download = archivo.archivo;
    a.click();
}
