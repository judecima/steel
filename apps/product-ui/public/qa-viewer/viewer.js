import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { t, traducirValorMetadata, crearEtiquetaDesdeIdTecnico } from './localizacion.js';

let scene, camera, renderer, controls;
let sceneDTO = null;
const materialsMap = new Map();
const layerGroups = new Map();
const objectMeshes = [];
let labelObjects = [];
let selectedMesh = null;
let boundingBoxHelper = null;
let selectionLabelSprite = null;
let debugMode = false;
let currentMode = 'estandar';
let fullIndustrialDTO = null;

function createSelectionLabel() {
    if (selectionLabelSprite) return;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    selectionLabelSprite = new THREE.Sprite(mat);
    selectionLabelSprite.scale.set(2, 0.5, 1);
    selectionLabelSprite.renderOrder = 999;
    selectionLabelSprite.visible = false;
    // We add this to scene in init() or dynamically
}

function updateSelectionLabel(hit) {
    if (!selectionLabelSprite) {
        createSelectionLabel();
        scene.add(selectionLabelSprite);
    }
    
    if (!hit || !hit.userData || !hit.userData.metadata) {
        selectionLabelSprite.visible = false;
        return;
    }

    const metadata = hit.userData.metadata;
    let labelText = metadata['Etiqueta'] || metadata['Rol'] || metadata['Tipo'] || hit.userData.type;
    
    // Si la etiqueta parece ser un ID técnico, intentar traducirla
    if (typeof labelText === 'string' && (labelText.includes('_') || labelText.includes('wall'))) {
        labelText = crearEtiquetaDesdeIdTecnico(labelText);
    }

    const canvas = selectionLabelSprite.material.map.image;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(10, 10, 236, 44);
    
    ctx.fillStyle = '#ffeb3b';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(labelText).toUpperCase(), 128, 32);
    
    selectionLabelSprite.material.map.needsUpdate = true;
    
    const box = new THREE.Box3().setFromObject(hit);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    selectionLabelSprite.position.copy(center);
    selectionLabelSprite.position.y += (size.y / 2) + 0.3;
    selectionLabelSprite.visible = true;
}

// UI Elements
const loadingEl = document.getElementById('loading');
const layersContainer = document.getElementById('layers-container');
const selectionPanel = document.getElementById('selection-panel');
const selectionContent = document.getElementById('selection-content');

// Raycaster for selection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

async function init() {
    // 1. Setup basic scene
    const container = document.getElementById('canvas-container');
    scene = new THREE.Scene();
    scene.background = new THREE.Color('#1a1a1a');

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    // Helpers
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    gridHelper.position.y = -0.01; // Slightly below zero to avoid z-fighting with tracks
    gridHelper.name = 'gridHelper';
    scene.add(gridHelper);

    const axisHelper = new THREE.AxesHelper(5);
    axisHelper.name = 'axisHelper';
    scene.add(axisHelper);

    // Camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 8, 10);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Load Data
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');

    const jsonPaths = projectId 
        ? [`/api/proyectos/${projectId}/render`]
        : [
            '../../render-scene.json',
            '/render-scene.json',
            './render-scene.json'
        ];

    let response = null;
    let successfulPath = null;
    let lastError = null;

    for (const p of jsonPaths) {
        try {
            console.log(`[QA-Viewer] Attempting to load JSON from: ${p}`);
            const res = await fetch(p);
            if (res.ok) {
                response = res;
                successfulPath = p;
                console.log(`[QA-Viewer] Successfully loaded JSON from: ${p}`);
                break;
            } else {
                console.log(`[QA-Viewer] Fetch status for ${p}: ${res.status}`);
                lastError = `HTTP ${res.status}`;
            }
        } catch (err) {
            console.log(`[QA-Viewer] Fetch failed for ${p}:`, err.message);
            lastError = err.message;
        }
    }

    try {
        if (!response) {
            throw new Error(lastError || 'All fetch attempts failed');
        }
        const data = await response.json();
        console.log('[VIEWER] projectId', projectId);
        console.log('[VIEWER] render response', data);

        if (data && data.ok === false) {
            throw new Error(data.message || data.code || 'Error en el servidor');
        }

        // Backward compatibility rule
        fullIndustrialDTO = data.ok === true ? data.scene : data;
        
        // Handle composition: if it's the new DTO, use escenaBase as the default sceneDTO
        if (fullIndustrialDTO.escenaBase) {
            sceneDTO = fullIndustrialDTO.escenaBase;
            currentMode = fullIndustrialDTO.modoInicial || 'estandar';
        } else {
            // Legacy support
            sceneDTO = fullIndustrialDTO;
            currentMode = 'estandar';
            // Mock a multi-mode structure for legacy
            fullIndustrialDTO = {
                escenaBase: sceneDTO,
                modoInicial: 'estandar',
                modos: {
                    estandar: { objects: [], labels: [], overlays: {}, metadata: {} }
                }
            };
        }

        buildSceneFromDTO();
        loadingEl.style.display = 'none';
        
        // Sincronizar selector de modo si existe
        const modeSelector = document.getElementById('mode-selector');
        if (modeSelector) modeSelector.value = currentMode;

    } catch (err) {
        console.error("[VIEWER] render error", err);
        loadingEl.innerHTML = `Error: ${err.message}<br><br>Attempted paths:<br>${jsonPaths.join('<br>')}<br><br>Last error: ${err.message}<br><br>Did you run 'npm run render:export'?`;
        loadingEl.style.color = '#ff4da6';
        loadingEl.style.display = 'block'; // Ensure it's visible to show the error
        // Important: If we are here, we stop the spinner by making sure loadingEl has text content but we could also hide a spinner if it was a separate CSS element.
        // In this viewer, loadingEl IS the spinner/overlay.
    }

    // Events
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('pointerdown', onPointerDown);
    
    // Doble Click para insertar aberturas / muros internos (Fase 9F)
    window.addEventListener('dblclick', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        
        const visibleMeshes = objectMeshes.filter(m => {
            let p = m;
            while(p) {
                if(!p.visible) return false;
                p = p.parent;
            }
            return true;
        });

        const intersects = raycaster.intersectObjects(visibleMeshes, false);
        
        // 1. Check for hits on existing objects
        if (intersects.length > 0) {
            const hit = intersects[0].object;
            const data = hit.userData;
            const point = intersects[0].point;

            if (data.type === 'abertura' || data.type === 'opening') {
                window.parent.postMessage({
                    type: 'VIEWER_OPENING_CLICK',
                    openingId: data.sourceId,
                    wallId: data.wallId,
                    metadata: data.metadata
                }, '*');
                return;
            }
            
            if (data.type === 'muro' || data.type === 'panel' || data.type === 'wall') {
                window.parent.postMessage({
                    type: 'VIEWER_WALL_CLICK',
                    entityType: data.type,
                    wallId: data.wallId || (data.type === 'muro' ? data.sourceId : null),
                    panelId: data.type === 'panel' ? data.sourceId : null,
                    point: point,
                    metadata: data.metadata
                }, '*');
                return;
            }
        }

        // 2. Check for hits on floor (if no mesh was hit)
        const gridHelper = scene.getObjectByName('gridHelper');
        if (gridHelper) {
            const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
            const floorIntersect = new THREE.Vector3();
            if (raycaster.ray.intersectPlane(floorPlane, floorIntersect)) {
                window.parent.postMessage({
                    type: 'VIEWER_FLOOR_CLICK',
                    point: floorIntersect
                }, '*');
            }
        }
    });

    setupUIControls();

    // Loop
    animate();
}

function buildSceneFromDTO() {
    const modeData = fullIndustrialDTO.modos[currentMode] || { objects: [], labels: [], overlays: {}, metadata: {} };
    console.log(`[QA-Viewer] Building scene for mode: ${currentMode}`, {
        base_objects: sceneDTO.objects.length,
        mode_objects: modeData.objects.length,
        mode_labels: modeData.labels.length
    });

    // Limpiar escena anterior si existe
    clearCurrentScene();

    // Separate statistics
    const stats = {};
    sceneDTO.layers.forEach(l => {
        stats[l.id] = { objects: 0, labels: 0, warnings: 0 };
    });
    
    const allObjects = [...sceneDTO.objects, ...modeData.objects];
    const allLabels = [...sceneDTO.labels, ...modeData.labels];

    allObjects.forEach(obj => { if(stats[obj.layer]) stats[obj.layer].objects++; });
    allLabels.forEach(lbl => { if(stats[lbl.layer]) stats[lbl.layer].labels++; });
    sceneDTO.warnings.forEach(w => { if(stats[w.layer]) stats[w.layer].warnings++; });

    // We map DTO layers to THREE.Group
    sceneDTO.layers.forEach(layer => {
        const group = new THREE.Group();
        group.name = layer.id;
        group.visible = layer.visibleByDefault;
        scene.add(group);
        layerGroups.set(layer.id, group);
        
        // Build UI checkboxes
        const lbl = document.createElement('label');
        lbl.className = 'layer-item';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = layer.visibleByDefault;
        
        const s = stats[layer.id];
        const hasContent = s.objects > 0 || s.labels > 0 || s.warnings > 0;
        
        if (!hasContent) {
            cb.disabled = true;
            cb.checked = false;
        }

        cb.onchange = (e) => {
            group.visible = e.target.checked;
        };
        lbl.appendChild(cb);
        
        const span = document.createElement('span');
        const total = s.objects + s.labels + s.warnings;
        span.textContent = ` ${layer.name} (${total})`;
        
        // Title for detailed breakdown (Title remains in Spanish)
        span.title = formatearEstadisticasCapa(s, true);
        
        if (!hasContent) span.style.color = '#777';
        else if (s.warnings > 0 && s.objects === 0) span.style.color = '#ffeb3b';
        
        lbl.appendChild(span);
        layersContainer.appendChild(lbl);
    });

    // Helper for materials (We infer color from ID if needed, or we hardcode some QA defaults)
    const getMaterial = (matId) => {
        if (materialsMap.has(matId)) return materialsMap.get(matId);
        
        // Map based on matId naming convention from config
        let color = 0xcccccc;
        let opacity = 1.0;
        let transparent = false;
        
        if (matId.includes('wall')) { color = 0x00BFFF; opacity = 0.1; transparent = true; }
        else if (matId.includes('panel')) { color = 0x32CD32; opacity = 0.1; transparent = true; }
        else if (matId.includes('opening')) { color = 0xFF6347; opacity = 0.2; transparent = true; }
        else if (matId.includes('header')) { color = 0xFFD700; opacity = 1.0; }
        else if (matId.includes('track')) { color = 0xD3D3D3; }
        else if (matId.includes('king')) { color = 0xA9A9A9; }
        else if (matId.includes('jack')) { color = 0x808080; }
        else if (matId.includes('cripple')) { color = 0x696969; }
        else if (matId.includes('foundation')) { color = 0x555555; }
        else if (matId.includes('warn') || matId.includes('fail')) { color = 0xFF0000; opacity = 0.8; transparent = true; }
        else if (matId.includes('pass')) { color = 0x2ecc71; opacity = 0.8; transparent = true; }
        else if (matId.includes('rev')) { color = 0xf1c40f; opacity = 0.8; transparent = true; }
        else if (matId.includes('inspect')) { color = 0xffffff; opacity = 0.1; transparent = true; }
        else if (matId.includes('ext_beam')) { color = 0x8e44ad; opacity = 0.7; transparent = true; }

        const mat = new THREE.MeshStandardMaterial({
            color: color,
            transparent: transparent,
            opacity: opacity,
            side: THREE.DoubleSide
        });
        materialsMap.set(matId, mat);
        return mat;
    };

    // Build Objects (Base + Mode)
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    
    function createTrapezoidGeometry(width, heightStart, heightEnd, depth) {
        const geometry = new THREE.BufferGeometry();
        const halfW = width / 2;
        const halfD = depth / 2;
        const hAvg = (heightStart + heightEnd) / 2;
        const halfHAvg = hAvg / 2;

        const vertices = new Float32Array([
            // Front (Z+)
            -halfW, -halfHAvg,  halfD, // 0
             halfW, -halfHAvg,  halfD, // 1
             halfW, -halfHAvg + heightEnd,   halfD, // 2
            -halfW, -halfHAvg + heightStart, halfD, // 3
            // Back (Z-)
            -halfW, -halfHAvg, -halfD, // 4
             halfW, -halfHAvg, -halfD, // 5
             halfW, -halfHAvg + heightEnd,  -halfD, // 6
            -halfW, -halfHAvg + heightStart, -halfD, // 7
        ]);

        const indices = [
            0, 1, 2,  0, 2, 3, // Front
            4, 6, 5,  4, 7, 6, // Back
            0, 3, 7,  0, 7, 4, // Left
            1, 5, 6,  1, 6, 2, // Right
            3, 2, 6,  3, 6, 7, // Top
            0, 4, 5,  0, 5, 1  // Bottom
        ];

        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        return geometry;
    }

    allObjects.forEach(obj => {
        const mat = getMaterial(obj.material).clone();
        let geometry;
        let scale = new THREE.Vector3(1, 1, 1);

        if (obj.heightStart !== undefined && obj.heightEnd !== undefined && obj.heightStart !== obj.heightEnd) {
            geometry = createTrapezoidGeometry(obj.dimensions.x, obj.heightStart, obj.heightEnd, obj.dimensions.z);
        } else {
            geometry = boxGeometry;
            scale.set(obj.dimensions.x, obj.dimensions.y, obj.dimensions.z);
        }

        const mesh = new THREE.Mesh(geometry, mat);
        mesh.scale.copy(scale);
        
        // Position
        mesh.position.set(obj.position.x, obj.position.y, obj.position.z);
        
        // Rotation
        mesh.rotation.set(obj.rotation.x, obj.rotation.y, obj.rotation.z);
        
        // Data
        mesh.userData = {
            ...obj,
            wallId: obj.metadata?.['Muro'] || obj.metadata?.['WallId'] || (obj.type === 'muro' ? obj.sourceId : null),
            isWall: obj.type === 'muro' || obj.type === 'wall',
            isPanel: obj.type === 'panel',
            isOpening: obj.type === 'abertura' || obj.type === 'opening'
        };
        
        // Edges
        const edges = new THREE.LineSegments(
            new THREE.EdgesGeometry(geometry),
            new THREE.LineBasicMaterial({ color: 0x000000, opacity: 0.2, transparent: true })
        );
        edges.scale.copy(scale);
        mesh.add(edges);

        // Add to layer
        if (layerGroups.has(obj.layer)) {
            layerGroups.get(obj.layer).add(mesh);
        } else {
            console.warn(`[QA-Viewer] Objeto ${obj.id} no tiene grupo de capa válido (${obj.layer}). Usando grupo fallback.`);
            const fallback = layerGroups.get('layer_other') || layerGroups.values().next().value || scene;
            fallback.add(mesh);
        }

        objectMeshes.push(mesh);
    });

    const statsContainer = document.getElementById('stats-container');
    if (statsContainer) {
        let statsHtml = `<div class="prop-row"><span class="prop-label">${t('ui', 'total_objects')}:</span> <span class="prop-value">${allObjects.length}</span></div>`;
        for (const [layerId, s] of Object.entries(stats)) {
            if (s.objects === 0 && s.labels === 0 && s.warnings === 0) continue;
            const layer = sceneDTO.layers.find(l => l.id === layerId);
            const layerName = layer ? layer.name : layerId.replace('layer_', '');
            
            const detail = formatearEstadisticasCapa(s);
            statsHtml += `<div class="prop-row"><span class="prop-label">${layerName}:</span> <span class="prop-value">${detail}</span></div>`;
        }
        statsContainer.innerHTML = statsHtml;
    }

    // Combine labels
    allLabels.forEach(label => {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label.text, 128, 40);
        
        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
        const sprite = new THREE.Sprite(mat);
        
        sprite.position.set(label.position.x, label.position.y, label.position.z);
        sprite.scale.set(2, 0.5, 1);
        
        if (layerGroups.has(label.layer)) {
            layerGroups.get(label.layer).add(sprite);
        } else {
            scene.add(sprite);
        }
        
        labelObjects.push(sprite);
    });

    // Overlays especiales de Inspección (Solo en modo inspección o si debugMode)
    const inspectionOverlays = modeData.overlays?.inspeccion || [];
    if (inspectionOverlays.length > 0 && (currentMode === 'inspeccion' || debugMode)) {
        inspectionOverlays.forEach(obj => {
            const mat = getMaterial(obj.material).clone();
            const mesh = new THREE.Mesh(boxGeometry, mat);
            mesh.scale.set(obj.dimensions.x, obj.dimensions.y, obj.dimensions.z);
            mesh.position.set(obj.position.x, obj.position.y, obj.position.z);
            mesh.rotation.set(obj.rotation.x, obj.rotation.y, obj.rotation.z);
            mesh.userData = obj;
            
            const edges = new THREE.LineSegments(
                new THREE.EdgesGeometry(boxGeometry),
                new THREE.LineBasicMaterial({ color: 0x00ffff, opacity: 0.5, transparent: true })
            );
            mesh.add(edges);

            if (layerGroups.has(obj.layer)) {
                layerGroups.get(obj.layer).add(mesh);
            } else {
                scene.add(mesh);
            }
            objectMeshes.push(mesh);
        });
    }

    // Overlays Estructurales (Solo en modo estructural)
    const structuralOverlays = modeData.overlays?.estructural || [];
    if (structuralOverlays.length > 0 && (currentMode === 'estructural')) {
        // En esta versión, los marcadores ya están en modeData.objects
        // Si quisiéramos efectos extra, los añadiríamos aquí.
    }

    // Setup camera target to center of model
    if (sceneDTO.objects.length > 0) {
        const box = new THREE.Box3().setFromObject(layerGroups.get('layer_framing') || scene);
        const center = box.getCenter(new THREE.Vector3());
        controls.target.copy(center);
        camera.position.set(center.x + 5, center.y + 5, center.z + 8);
        controls.update();
    }
}

function setupUIControls() {
    document.getElementById('toggle-wireframe').addEventListener('change', (e) => {
        const isWireframe = e.target.checked;
        objectMeshes.forEach(m => {
            if (m.material) {
                m.material.wireframe = isWireframe;
            }
        });
    });

    document.getElementById('toggle-grid').addEventListener('change', (e) => {
        const helper = scene.getObjectByName('gridHelper');
        if (helper) helper.visible = e.target.checked;
    });

    document.getElementById('toggle-axis').addEventListener('change', (e) => {
        const helper = scene.getObjectByName('axisHelper');
        if (helper) helper.visible = e.target.checked;
    });

    document.getElementById('toggle-labels').addEventListener('change', (e) => {
        const isVisible = e.target.checked;
        labelObjects.forEach(l => {
            l.visible = isVisible;
        });
    });

    const roofOpacityToggle = document.getElementById('toggle-roof-opacity');
    if (roofOpacityToggle) {
        roofOpacityToggle.addEventListener('change', (e) => {
            const isHigh = e.target.checked;
            materialsMap.forEach((mat, key) => {
                if (key.includes('roof')) {
                    mat.opacity = isHigh ? 0.8 : 0.2;
                    mat.transparent = true;
                    mat.needsUpdate = true;
                }
            });
        });
    }

    const btnFocus = document.getElementById('btn-focus');
    if (btnFocus) {
        btnFocus.addEventListener('click', () => {
            console.log('[QA-Viewer] Click en Enfocar. Mesh seleccionado:', selectedMesh ? selectedMesh.userData.id : 'ninguno');
            if (selectedMesh) {
                const box = new THREE.Box3().setFromObject(selectedMesh);
                const center = box.getCenter(new THREE.Vector3());
                
                // Animación suave del target
                controls.target.copy(center);
                
                const size = box.getSize(new THREE.Vector3()).length();
                const dist = Math.max(size * 2, 2);
                
                // Posicionar cámara relativa al objeto
                const offset = new THREE.Vector3(dist, dist, dist);
                camera.position.copy(center.clone().add(offset));
                
                controls.update();
            } else {
                alert("Seleccione un objeto primero.");
            }
        });
    }

    const btnIsolate = document.getElementById('btn-isolate');
    if (btnIsolate) {
        let isIsolated = false;
        btnIsolate.addEventListener('click', () => {
            if (!isIsolated) {
                console.log('[QA-Viewer] Aislando capa...');
                if (selectedMesh) {
                    const targetLayer = selectedMesh.userData.layer;
                    
                    // Ocultar todos los grupos excepto el objetivo
                    layerGroups.forEach((group, key) => {
                        group.visible = (key === targetLayer);
                    });
                    
                    // Ocultar también objetos que pudieran estar sueltos en la escena
                    objectMeshes.forEach(m => {
                        if (m.userData.layer !== targetLayer) m.visible = false;
                        else m.visible = true;
                    });
                    labelObjects.forEach(l => {
                        // Las etiquetas suelen estar en grupos, pero por si acaso
                        if (l.visible) { // Si el toggle global de etiquetas lo permite
                             // ...
                        }
                    });

                    btnIsolate.textContent = "Restaurar Capas";
                    isIsolated = true;
                } else {
                    alert("Seleccione un objeto primero.");
                }
            } else {
                console.log('[QA-Viewer] Restaurando capas...');
                layerGroups.forEach(g => g.visible = true);
                objectMeshes.forEach(m => m.visible = true);
                btnIsolate.textContent = "Aislar Capa";
                isIsolated = false;
                
                // Sincronizar checkboxes de la UI
                const checkboxes = document.querySelectorAll('#layers-container input[type="checkbox"]');
                checkboxes.forEach(cb => cb.checked = true);
            }
        });
    }

    // Export Downloads
    const downloadButtons = document.querySelectorAll('.btn-download');
    downloadButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const fileName = btn.getAttribute('data-file');
            
            const urlParams = new URLSearchParams(window.location.search);
            const projectId = urlParams.get('id');

            // Use project-aware API path
            const filePath = projectId 
                ? `/api/exports/${projectId}/${fileName}`
                : `./exports/${fileName}`;

            console.log(`[QA-Viewer] Click en descarga. Archivo: ${fileName}, URL resuelta: ${filePath}`);
            
            console.log(`[QA-Viewer] Intentando descargar: ${filePath}`);
            const statusEl = document.getElementById('export-status');
            
            try {
                const response = await fetch(filePath);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                if (statusEl) {
                    statusEl.textContent = `Descargado: ${fileName}`;
                    statusEl.style.color = '#2ecc71';
                }
            } catch (err) {
                console.error(`[QA-Viewer] Error al descargar ${fileName}:`, err);
                if (statusEl) {
                    statusEl.textContent = `No disponible (${err.message}) — ejecutar npm run export:industrial`;
                    statusEl.style.color = '#ff4da6';
                }
            }
        });
    });

    const toggleDebugMode = document.getElementById('toggle-debug-mode');
    if (toggleDebugMode) {
        toggleDebugMode.addEventListener('change', (e) => {
            debugMode = e.target.checked;
            if (selectedMesh) {
                showSelectionInfo(selectedMesh.userData);
            }
        });
    }

    const modeSelector = document.getElementById('mode-selector');
    if (modeSelector) {
        modeSelector.addEventListener('change', (e) => {
            const newMode = e.target.checked ? e.target.value : e.target.value; // Simplificado
            switchMode(e.target.value);
        });
    }
}

function clearCurrentScene() {
    // Eliminar mallas
    objectMeshes.forEach(m => {
        if (m.parent) m.parent.remove(m);
    });
    objectMeshes.length = 0;

    // Eliminar etiquetas
    labelObjects.forEach(l => {
        if (l.parent) l.parent.remove(l);
    });
    labelObjects.length = 0;

    // Eliminar grupos de capas
    layerGroups.forEach(g => {
        scene.remove(g);
    });
    layerGroups.clear();

    // Limpiar UI de capas
    if (layersContainer) layersContainer.innerHTML = '';
}

async function switchMode(mode) {
    console.log(`[QA-Viewer] Switching to mode: ${mode}`);
    currentMode = mode;
    
    // En una implementación real, esto podría disparar un fetch o una regeneración
    // Por ahora, recargamos la escena con los metadatos que ya tenemos
    buildSceneFromDTO();
    
    // Si es modo Taller o Montaje, podríamos mostrar paneles adicionales en la UI
    updateIndustrialUI(mode);
}

function updateIndustrialUI(mode) {
    const statsContainer = document.getElementById('stats-container');
    if (!statsContainer) return;

    const modeData = fullIndustrialDTO.modos[mode] || { metadata: {} };
    
    // Header con el nombre del modo traducido
    let modeHeader = `<div style="margin-bottom: 15px; padding: 10px; background: #333; border-radius: 4px; border-left: 4px solid #4da6ff;">
        <div style="font-size: 11px; text-transform: uppercase; color: #888;">Modo Activo</div>
        <div style="font-size: 16px; font-weight: bold; color: #fff;">${t('modos', mode)}</div>
    </div>`;
    
    statsContainer.innerHTML = modeHeader + statsContainer.innerHTML;

    if (mode === 'taller' && modeData.metadata.taller) {
        let html = '<h4 style="color:#fff; border-bottom:1px solid #444;">Resumen de Taller</h4>';
        modeData.metadata.taller.paneles.forEach(p => {
            html += `<div style="margin-bottom:10px; padding:5px; background:#222; border-radius:4px;">
                <div style="font-weight:bold; color:#4da6ff;">${crearEtiquetaDesdeIdTecnico(p.panelId)}</div>
                <div style="font-size:11px; color:#aaa;">Materiales (m lin):</div>`;
            for (const [prof, len] of Object.entries(p.bomSummary)) {
                html += `<div class="prop-row"><span class="prop-label">${prof}:</span> <span class="prop-value">${len.toFixed(2)}</span></div>`;
            }
            html += `</div>`;
        });
        statsContainer.innerHTML += html;
    }

    if (mode === 'montaje' && modeData.metadata.montaje) {
        let html = '<h4 style="color:#fff; border-bottom:1px solid #444;">Pasos de Montaje</h4>';
        modeData.metadata.montaje.pasos.forEach(s => {
            html += `<div style="margin-bottom:8px; padding:8px; background:#222; border-left:3px solid #ffeb3b; border-radius:0 4px 4px 0; cursor:pointer;" onclick="window.focusStep('${s.id}')">
                <div style="font-weight:bold; color:#fff;">${s.order}. ${s.title}</div>
                <div style="font-size:12px; color:#ccc;">${s.description}</div>
            </div>`;
        });
        statsContainer.innerHTML += html;
    }
}

function onPointerDown(event) {
    // EVITAR CLICK-THROUGH: Si el clic es en la interfaz, no procesar raycasting
    if (event.target.closest('#ui-panel') || 
        event.target.closest('#selection-panel') || 
        event.target.tagName === 'BUTTON' ||
        event.target.tagName === 'SELECT' ||
        event.target.tagName === 'INPUT') {
        return;
    }

    // Calculate mouse position in normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Raycast
    raycaster.setFromCamera(mouse, camera);

    // Only intersect visible objects
    const visibleMeshes = objectMeshes.filter(m => {
        let p = m;
        while(p) {
            if(!p.visible) return false;
            p = p.parent;
        }
        return true;
    });

    const intersects = raycaster.intersectObjects(visibleMeshes, false);

    if (intersects.length > 0) {
        // Find first intersection that is not a wireframe or edges if possible, but basic mesh is fine
        const hit = intersects[0].object;
        selectedMesh = hit;
        showSelectionInfo(hit.userData);
        updateSelectionLabel(hit);
        
        if (!boundingBoxHelper) {
            boundingBoxHelper = new THREE.BoxHelper(hit, 0xffff00);
            scene.add(boundingBoxHelper);
        } else {
            boundingBoxHelper.setFromObject(hit);
            boundingBoxHelper.visible = true;
        }

        // Simple highlight logic
        objectMeshes.forEach(m => {
            if (m.material && m.material.emissive) {
                m.material.emissive.setHex(0x000000);
            }
        });
        if (hit.material && hit.material.emissive) {
            hit.material.emissive.setHex(0x333333);
        }
    } else {
        selectedMesh = null;
        updateSelectionLabel(null);
        selectionPanel.style.display = 'none';
        if (boundingBoxHelper) boundingBoxHelper.visible = false;
        objectMeshes.forEach(m => {
            if (m.material && m.material.emissive) {
                m.material.emissive.setHex(0x000000);
            }
        });
    }
}

function showSelectionInfo(data) {
    if (!data || !data.id) return;
    selectionPanel.style.display = 'block';
    
    let html = '';
    const label = data.metadata && data.metadata['Etiqueta'] ? data.metadata['Etiqueta'] : crearEtiquetaDesdeIdTecnico(data.id);
    
    html += `<div class="prop-row"><span class="prop-label">${t('ui', 'objeto')}:</span> <span class="prop-value" style="font-weight:bold; color:#fff;">${label}</span></div>`;
    html += `<div class="prop-row"><span class="prop-label">${t('ui', 'type')}:</span> <span class="prop-value">${t('tipos', data.type)}</span></div>`;
    
    const visibleSourceId = crearEtiquetaDesdeIdTecnico(data.sourceId);
    html += `<div class="prop-row"><span class="prop-label">${t('ui', 'id_fuente')}:</span> <span class="prop-value">${visibleSourceId}</span></div>`;
    
    const layer = sceneDTO.layers.find(l => l.id === data.layer);
    const layerName = layer ? layer.name : data.layer;
    html += `<div class="prop-row"><span class="prop-label">${t('ui', 'capa')}:</span> <span class="prop-value">${layerName}</span></div>`;
    
    // IDs Técnicos (Sección separada solo en modo debug)
    let technicalIdsHtml = '';
    if (debugMode) {
        technicalIdsHtml += `<h4 style="margin: 15px 0 5px 0; font-size: 13px; color: #ffeb3b; border-bottom: 1px solid #550; padding-bottom: 2px;">IDs técnicos</h4>`;
        technicalIdsHtml += `<div class="prop-row"><span class="prop-label">ID render:</span> <span class="prop-value" style="font-size:11px; color:#aaa;">${data.id}</span></div>`;
        if (visibleSourceId !== data.sourceId) {
            technicalIdsHtml += `<div class="prop-row"><span class="prop-label">ID fuente interno:</span> <span class="prop-value" style="font-size:11px; color:#aaa;">${data.sourceId}</span></div>`;
        }
    }

    if (data.metadata) {
        html += `<h4 style="margin: 10px 0 5px 0; font-size: 13px; color: #fff; border-bottom: 1px solid #444; padding-bottom: 2px;">${t('ui', 'metadata')}</h4>`;
        for (const [k, v] of Object.entries(data.metadata)) {
            // Evitar duplicar si ya se mostraron arriba o si son técnicos
            if (k === 'Etiqueta' || k === 'ID Técnico' || k === 'id' || k === 'sourceId') continue;
            if (k.toLowerCase().includes('interno')) {
                if (debugMode) {
                    technicalIdsHtml += `<div class="prop-row"><span class="prop-label">${k}:</span> <span class="prop-value" style="font-size:11px; color:#aaa;">${v}</span></div>`;
                }
                continue;
            }
            
            // Traducir clave
            const translatedKey = t('metadatos', k);
            
            // Traducir valor
            let translatedValue = traducirValorMetadata(k, v);
            
            // Si el valor es un ID técnico (de muro, panel, etc), intentar traducirlo para visualización primaria
            if (typeof v === 'string' && (k.toLowerCase().includes('id') || v.includes('_'))) {
                const labelValue = crearEtiquetaDesdeIdTecnico(v);
                if (labelValue !== v) {
                    // Mostrar etiqueta primaria
                    html += `<div class="prop-row"><span class="prop-label">${translatedKey}:</span> <span class="prop-value">${labelValue}</span></div>`;
                    continue;
                }
            }
            
            html += `<div class="prop-row"><span class="prop-label">${translatedKey}:</span> <span class="prop-value">${translatedValue}</span></div>`;
        }
    }
    
    html += technicalIdsHtml;
    selectionContent.innerHTML = html;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

/**
 * Formatea las estadísticas de una capa en un string legible en español.
 * @param {Object} s Estadísticas {objects, labels, warnings}
 * @param {boolean} plainText Si es true, no usa HTML
 */
function formatearEstadisticasCapa(s, plainText = false) {
    const parts = [];
    if (s.objects > 0) parts.push(`${t('ui', 'objetos')}: ${s.objects}`);
    if (s.labels > 0) parts.push(`${t('ui', 'etiquetas')}: ${s.labels}`);
    if (s.warnings > 0) {
        const warnText = `${t('ui', 'advertencias')}: ${s.warnings}`;
        parts.push(plainText ? warnText : `<span style="color:#ffeb3b">${warnText}</span>`);
    }
    return parts.join(plainText ? ', ' : '<br>');
}

    // Startup diagnostics for exports
    checkExports();

async function checkExports() {
    const statusEl = document.getElementById('export-status');
    if (!statusEl) return;
    
    statusEl.textContent = "Verificando archivos de exportación...";
    const buttons = document.querySelectorAll('.btn-download');
    let availableCount = 0;
    
    for (const btn of buttons) {
        const fileName = btn.getAttribute('data-file');
        
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('id');
        
        const filePath = projectId 
            ? `/api/exports/${projectId}/${fileName}`
            : `./exports/${fileName}`;
        
        try {
            const response = await fetch(filePath, { method: 'HEAD' });
            if (response.ok) {
                btn.style.border = "2px solid #2ecc71";
                availableCount++;
            } else {
                btn.style.opacity = "0.5";
                btn.title = `No disponible (HTTP ${response.status})`;
            }
        } catch (err) {
            btn.style.opacity = "0.5";
            btn.title = `Error: ${err.message}`;
        }
    }
    
    if (availableCount === buttons.length) {
        statusEl.textContent = "✅ Todos los archivos de exportación están disponibles.";
        statusEl.style.color = "#2ecc71";
    } else {
        statusEl.textContent = `⚠️ Solo ${availableCount}/${buttons.length} archivos disponibles. Ejecute 'npm run export:industrial'.`;
        statusEl.style.color = "#ffeb3b";
    }
}

init();
