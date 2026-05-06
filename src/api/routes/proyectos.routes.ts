import { Router, Request, Response } from 'express';
import { ProyectosService } from '../services/proyectos.service';
import { PlanoPackageBuilder } from '../../modules/planos/plano-package-builder';
import { PdfExporter } from '../../modules/planos/pdf-exporter';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();

// GET /api/health
router.get('/health', async (req: Request, res: Response) => {
    const isOk = await ProyectosService.healthCheck();
    if (isOk) res.json({ status: 'ok', database: 'connected' });
    else res.status(503).json({ status: 'error', database: 'disconnected' });
});

// GET /api/proyectos
router.get('/proyectos', async (req: Request, res: Response) => {
    try {
        const list = await ProyectosService.listProyectos();
        res.json(list);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/proyectos/:id
router.get('/proyectos/:id', async (req: Request, res: Response) => {
    try {
        const p = await ProyectosService.getProyecto(req.params.id);
        if (p) res.json(p);
        else res.status(404).json({ error: 'Proyecto no encontrado' });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/proyectos
router.post('/proyectos', async (req: Request, res: Response) => {
    try {
        const p = await ProyectosService.createProyecto(req.body);
        res.status(201).json(p);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// PUT /api/proyectos/:id
router.put('/proyectos/:id', async (req: Request, res: Response) => {
    try {
        const p = await ProyectosService.updateProyecto(req.params.id, req.body);
        res.json(p);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// DELETE /api/proyectos/:id
router.delete('/proyectos/:id', async (req: Request, res: Response) => {
    try {
        await ProyectosService.deleteProyecto(req.params.id);
        res.status(204).send();
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/proyectos/:id/versiones
router.post('/proyectos/:id/versiones', async (req: Request, res: Response) => {
    try {
        const v = await ProyectosService.addVersion(req.params.id, req.body);
        res.status(201).json(v);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/proyectos/:id/regenerar (Fase 7.5 Placeholder)
router.post('/proyectos/:id/regenerar', async (req: Request, res: Response) => {
    res.json({
        status: "pendiente",
        message: "Regeneración pendiente de implementar en Fase 8"
    });
});

router.post('/proyectos/:id/planos/exportar', async (req, res) => {
    try {
        const id = req.params.id;
        const proyecto = await ProyectosService.getProyecto(id);
        
        if (!proyecto) {
            return res.status(404).json({ error: 'Proyecto no encontrado' });
        }

        // Generar paquete
        const pkg = await PlanoPackageBuilder.build(proyecto);
        
        // Exportar JSON
        const exportDir = path.join(process.cwd(), 'tools/qa-viewer/exports');
        if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });
        
        const jsonPath = path.join(exportDir, 'planos-package.json');
        fs.writeFileSync(jsonPath, JSON.stringify(pkg, null, 2));

        // Exportar PDF
        const pdfBytes = await PdfExporter.export(pkg);
        const pdfPath = path.join(exportDir, 'planos-tecnicos.pdf');
        fs.writeFileSync(pdfPath, pdfBytes);

        res.json({
            ok: true,
            pdf: '/tools/qa-viewer/exports/planos-tecnicos.pdf',
            json: '/tools/qa-viewer/exports/planos-package.json'
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
