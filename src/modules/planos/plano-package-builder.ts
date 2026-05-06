import { PlanosPackageDTO, PlanoSheetDTO } from './types';
import { IndiceSheet } from './sheets/indice-sheet';
import { PortadaSheet } from './sheets/portada-3d-sheet';
import { ReplanteoSolerasSheet } from './sheets/replanteo-soleras-sheet';
import { DistribucionPanelesSheet } from './sheets/distribucion-paneles-platea-sheet';
import { PanelSheet } from './sheets/panel-sheet';

export class PlanoPackageBuilder {
    static async build(proyecto: any): Promise<PlanosPackageDTO> {
        const metadata = { nombre: proyecto.nombre || 'Proyecto', cliente: proyecto.cliente || 'Cliente' };
        
        // Find active version
        const version = proyecto.historialVersiones?.find((v: any) => v.id === proyecto.versionActual) 
                     || proyecto.historialVersiones?.[0];
        
        const projectResult = version?.resultadoMotor;
        const panels = projectResult?.construction?.panels || [];
        
        const packageDto: PlanosPackageDTO = {
            proyectoId: proyecto.id || 'temp',
            nombreProyecto: metadata.nombre,
            fechaGeneracion: new Date().toISOString(),
            hojas: [],
            metadata: {}
        };

        // 1. Portada
        packageDto.hojas.push(PortadaSheet.generate(metadata));

        // 2. Replanteo Soleras
        packageDto.hojas.push(ReplanteoSolerasSheet.generate(projectResult, metadata));

        // 3. Distribución Paneles
        packageDto.hojas.push(DistribucionPanelesSheet.generate(projectResult, metadata));

        // 4. Panel Sheets (One per panel)
        panels.forEach((panel: any) => {
            packageDto.hojas.push(PanelSheet.generate(panel, metadata));
        });

        // 5. Indice (At the beginning, but generated last to know all sheets)
        const listaHojas = packageDto.hojas.map(h => ({ codigo: h.codigoHoja, titulo: h.titulo }));
        const indice = IndiceSheet.generate(metadata, listaHojas);
        packageDto.hojas.unshift(indice);

        // Update sheet numbers
        packageDto.hojas.forEach((h, i) => h.numeroHoja = i);

        return packageDto;
    }
}
