import fs from 'fs';
import path from 'path';

async function main() {
  const scenePath = path.join(process.cwd(), 'render-scene.json');
  if (!fs.existsSync(scenePath)) {
    console.error('render-scene.json not found');
    return;
  }

  const scene = JSON.parse(fs.readFileSync(scenePath, 'utf8'));
  const allObjects: any[] = [];
  const allLabels: any[] = [];

  function findObjects(obj: any) {
    if (!obj) return;
    if (Array.isArray(obj)) {
      obj.forEach(item => findObjects(item));
    } else if (typeof obj === 'object') {
      if (obj.id && (obj.layer || obj.layerId)) {
        allObjects.push(obj);
      }
      if (obj.text && (obj.layer || obj.layerId)) {
        allLabels.push(obj);
      }
      Object.values(obj).forEach(val => findObjects(val));
    }
  }

  findObjects(scene);

  const targetLayers = ['layer_fundaciones', 'layer_anclajes'];
  
  console.log('--- TARGET LAYER AUDIT ---');
  targetLayers.forEach(id => {
    const layerObjects = allObjects.filter(o => (o.layer || o.layerId) === id);
    const layerLabels = allLabels.filter(l => (l.layer || l.layerId) === id);
    
    console.log(`Layer: ${id}`);
    console.log(`  Objects: ${layerObjects.length}`);
    console.log(`  Labels:  ${layerLabels.length}`);
    
    layerObjects.forEach(d => {
      console.log(`    - [${d.type}] ID: ${d.id}, sourceId: ${d.sourceId}`);
      console.log(`      Pos: ${JSON.stringify(d.position)}, Dim: ${JSON.stringify(d.dimensions)}`);
    });
    layerLabels.forEach(l => {
      console.log(`    - [LABEL] Text: ${l.text}, Pos: ${JSON.stringify(l.position)}`);
    });
    console.log('');
  });
}

main().catch(console.error);
