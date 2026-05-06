import { ProjectResult } from '../../core/types';
import { IndustrialPackageDTO } from './types';
import { IndustrialBOMBuilder } from './bom-industrial-builder';
import { CutListBuilder } from './cutlist-builder';
import { PanelPackageBuilder } from './panel-package-builder';
import { AssemblySheetBuilder } from './montaje-sheet-builder';

export class PackageBuilder {
    static build(project: ProjectResult): IndustrialPackageDTO {
        const bom = IndustrialBOMBuilder.build(project);
        const cutList = CutListBuilder.build(project);
        const paneles = PanelPackageBuilder.buildAll(project, cutList.piezas);
        const montaje = AssemblySheetBuilder.build(project);

        return {
            projectId: 'PROYECTO-CERTIFICADO-V1',
            bom,
            cutList,
            paneles,
            montaje,
            generadoEn: new Date().toISOString()
        };
    }
}
