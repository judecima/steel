const fs = require('fs');
const path = require('path');

const currentStatePath = path.join(__dirname, '../docs/assisted-runs/current-state.md');
const validationReportPath = path.join(__dirname, '../docs/assisted-runs/validation-report.md');
const nextStepsPath = path.join(__dirname, '../docs/assisted-runs/next-steps.md');
const packageJsonPath = path.join(__dirname, '../package.json');

console.log('=== PROJECT STATE ===\n');

if (fs.existsSync(currentStatePath)) {
    const currentState = fs.readFileSync(currentStatePath, 'utf8');
    const phaseMatch = currentState.match(/## Current Phase\n(.*?)\n/);
    if (phaseMatch) {
        console.log(`FASE ACTUAL: ${phaseMatch[1]}`);
    } else {
        console.log('FASE ACTUAL: Desconocida');
    }
}

if (fs.existsSync(packageJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    console.log('\nTESTS DISPONIBLES:');
    if (pkg.scripts) {
        Object.keys(pkg.scripts).filter(k => k.startsWith('test')).forEach(k => {
            console.log(`- npm run ${k}: ${pkg.scripts[k]}`);
        });
    }
}

if (fs.existsSync(validationReportPath)) {
    console.log('\nÚLTIMO ESTADO DOCUMENTADO (Validation Report):');
    const validationReport = fs.readFileSync(validationReportPath, 'utf8');
    const lines = validationReport.split('\n').filter(l => l.trim().length > 0);
    lines.slice(1, 10).forEach(l => console.log(l));
}

if (fs.existsSync(nextStepsPath)) {
    console.log('\nPRÓXIMOS PASOS:');
    const nextSteps = fs.readFileSync(nextStepsPath, 'utf8');
    const lines = nextSteps.split('\n');
    let immediate = false;
    for (const line of lines) {
        if (line.includes('## Immediate Next Step')) {
            immediate = true;
            continue;
        }
        if (immediate && line.startsWith('## ')) break;
        if (immediate && line.trim()) {
            console.log(line.trim());
        }
    }
}
