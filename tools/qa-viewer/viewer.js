import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let sceneDTO = null;
const materialsMap = new Map();
const layerGroups = new Map();
const objectMeshes = [];
let labelObjects = [];

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
    const jsonPaths = [
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
        sceneDTO = await response.json();
        buildSceneFromDTO();
        loadingEl.style.display = 'none';
    } catch (err) {
        console.error("[QA-Viewer] Failed to load render-scene.json:", err);
        loadingEl.innerHTML = `Error loading render-scene.json.<br><br>Attempted paths:<br>${jsonPaths.join('<br>')}<br><br>Last error: ${err.message}<br><br>Did you run 'npm run render:export'?`;
        loadingEl.style.color = '#ff4da6';
    }

    // Events
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('pointerdown', onPointerDown);
    setupUIControls();

    // Loop
    animate();
}

function buildSceneFromDTO() {
    // Reconstruct materials matching config logic
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
        cb.onchange = (e) => {
            group.visible = e.target.checked;
        };
        lbl.appendChild(cb);
        lbl.appendChild(document.createTextNode(` ${layer.name}`));
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
        else if (matId.includes('warn')) { color = 0xFF0000; opacity = 0.8; transparent = true; }

        const mat = new THREE.MeshStandardMaterial({
            color: color,
            transparent: transparent,
            opacity: opacity,
            side: THREE.DoubleSide
        });
        materialsMap.set(matId, mat);
        return mat;
    };

    // Build Objects
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    
    sceneDTO.objects.forEach(obj => {
        const mat = getMaterial(obj.material).clone();
        const mesh = new THREE.Mesh(boxGeometry, mat);
        
        // Scale to dimensions
        mesh.scale.set(obj.dimensions.x, obj.dimensions.y, obj.dimensions.z);
        
        // Position
        mesh.position.set(obj.position.x, obj.position.y, obj.position.z);
        
        // Rotation
        mesh.rotation.set(obj.rotation.x, obj.rotation.y, obj.rotation.z);
        
        // Data
        mesh.userData = obj;
        
        // Edges
        const edges = new THREE.LineSegments(
            new THREE.EdgesGeometry(boxGeometry),
            new THREE.LineBasicMaterial({ color: 0x000000, opacity: 0.2, transparent: true })
        );
        mesh.add(edges);

        // Add to layer
        if (layerGroups.has(obj.layer)) {
            layerGroups.get(obj.layer).add(mesh);
        } else {
            scene.add(mesh);
        }

        objectMeshes.push(mesh);
    });

    // Simple Labels (Sprite based)
    sceneDTO.labels.forEach(label => {
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
}

function onPointerDown(event) {
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
        showSelectionInfo(hit.userData);
        
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
        selectionPanel.style.display = 'none';
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
    html += `<div class="prop-row"><span class="prop-label">ID:</span> <span class="prop-value">${data.id}</span></div>`;
    html += `<div class="prop-row"><span class="prop-label">Type:</span> <span class="prop-value">${data.type}</span></div>`;
    html += `<div class="prop-row"><span class="prop-label">SourceId:</span> <span class="prop-value">${data.sourceId}</span></div>`;
    html += `<div class="prop-row"><span class="prop-label">Layer:</span> <span class="prop-value">${data.layer}</span></div>`;
    
    if (data.metadata) {
        html += `<h4 style="margin: 10px 0 5px 0; font-size: 13px; color: #fff;">Metadata</h4>`;
        for (const [k, v] of Object.entries(data.metadata)) {
            html += `<div class="prop-row"><span class="prop-label">${k}:</span> <span class="prop-value">${v}</span></div>`;
        }
    }
    
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

init();
