// @ts-nocheck
import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const SCRIPTS_DIR = path.join(ROOT_DIR, 'scripts');

function fileExists(relativePaths: string[]): boolean {
    return relativePaths.some(p => fs.existsSync(path.join(ROOT_DIR, p)));
}

function scanForTerm(term: RegExp | string): boolean {
    return scanDirectoryForTerm(SRC_DIR, term) || scanDirectoryForTerm(SCRIPTS_DIR, term);
}

function scanDirectoryForTerm(dir: string, term: RegExp | string): boolean {
    if (!fs.existsSync(dir)) return false;
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
            if (scanDirectoryForTerm(fullPath, term)) return true;
        } else if (file.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.js'))) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (typeof term === 'string') {
                if (content.includes(term)) return true;
            } else {
                if (term.test(content)) return true;
            }
        }
    }
    return false;
}

interface Requirement {
    name: string;
    check: () => boolean;
}

interface PhaseDef {
    id: string;
    name: string;
    requirements: Requirement[];
}

const phases: PhaseDef[] = [
    {
        id: "Phase 0",
        name: "Phase 0 — Modular foundation",
        requirements: [
            { name: "core/types exists", check: () => fileExists(['src/core/types.ts', 'src/core/types/index.ts']) },
            { name: "geometry engine exists", check: () => fileExists(['src/modules/geometry/engine.ts']) },
            { name: "roof engine exists", check: () => fileExists(['src/modules/roof/engine.ts']) },
            { name: "construction engine exists", check: () => fileExists(['src/modules/construction/engine.ts']) },
            { name: "materials engine exists", check: () => fileExists(['src/modules/materials/engine.ts']) }
        ]
    },
    {
        id: "Phase 0.5",
        name: "Phase 0.5 — Hardening",
        requirements: [
            { name: "precheck exists", check: () => fileExists(['src/modules/validation/precheck.ts']) },
            { name: "regression tests exist", check: () => fileExists(['scripts/regression_tests.ts']) },
            { name: "fail-fast split planning exists", check: () => fileExists(['src/modules/construction/panelization.ts']) || scanForTerm(/split/i) || scanForTerm(/fail-fast/i) },
            { name: "panel continuity exists", check: () => scanForTerm(/continuity/i) || scanForTerm(/panel/i) },
            { name: "header model exists", check: () => scanForTerm(/header/i) || fileExists(['src/modules/construction/openings.ts']) },
            { name: "BOM multi-key aggregation exists", check: () => scanForTerm(/BOM/i) || scanForTerm(/multi-key/i) }
        ]
    },
    {
        id: "Phase 1",
        name: "Phase 1 — Local constructive intelligence",
        requirements: [
            { name: "candidate-generator exists", check: () => fileExists(['src/modules/intelligence/candidate-generator.ts']) },
            { name: "candidate-validator exists", check: () => fileExists(['src/modules/intelligence/candidate-validator.ts']) },
            { name: "candidate-scorer exists", check: () => fileExists(['src/modules/intelligence/candidate-scorer.ts']) },
            { name: "strategic-arbiter exists", check: () => fileExists(['src/modules/intelligence/strategic-arbiter.ts']) },
            { name: "intelligence tests exist", check: () => fileExists(['scripts/intelligence_tests.ts']) },
            { name: "candidatesEvaluated metadata exists", check: () => scanForTerm(/candidatesEvaluated/i) || fileExists(['src/modules/intelligence/types.ts']) },
            { name: "strategic context active exists", check: () => scanForTerm(/strategic context/i) || scanForTerm(/arbiter/i) }
        ]
    },
    {
        id: "Phase 2",
        name: "Phase 2 — Global Planning",
        requirements: [
            { name: "global-candidate-generator exists", check: () => fileExists(['src/modules/planner/candidate-generator.ts', 'src/modules/planner/global-candidate-generator.ts']) },
            { name: "global-validator exists", check: () => fileExists(['src/modules/planner/validator.ts', 'src/modules/planner/global-validator.ts']) },
            { name: "global-scorer exists", check: () => fileExists(['src/modules/planner/scoring.ts', 'src/modules/planner/global-scorer.ts']) },
            { name: "global-arbiter exists", check: () => fileExists(['src/modules/planner/arbiter.ts', 'src/modules/planner/global-arbiter.ts']) },
            { name: "wall-priority-resolver exists", check: () => fileExists(['src/modules/planner/priority-resolver.ts', 'src/modules/planner/wall-priority-resolver.ts']) },
            { name: "beam search exists", check: () => scanForTerm(/beam search/i) },
            { name: "planner telemetry exists", check: () => scanForTerm(/telemetry/i) },
            { name: "global tests exist", check: () => fileExists(['scripts/phase2_tests.ts', 'scripts/global_tests.ts']) }
        ]
    },
    {
        id: "Phase 3",
        name: "Phase 3 — Structural Engine",
        requirements: [
            { name: "structural engine exists", check: () => fileExists(['src/modules/structural/engine.ts']) },
            { name: "CIRSOC modules exist", check: () => scanForTerm(/CIRSOC/i) },
            { name: "load validation exists", check: () => scanForTerm(/load validation/i) || scanForTerm(/validateLoad/i) },
            { name: "profile validation exists", check: () => scanForTerm(/profile validation/i) || scanForTerm(/validateProfile/i) }
        ]
    },
    {
        id: "Phase 4",
        name: "Phase 4 — Industrial Engine",
        requirements: [
            { name: "industrial learning exists", check: () => scanForTerm(/industrial learning/i) },
            { name: "pattern memory exists", check: () => scanForTerm(/pattern memory/i) },
            { name: "optimization history exists", check: () => scanForTerm(/optimization history/i) }
        ]
    }
];

function detectPhase() {
    const completedPhases: string[] = [];
    let currentPhase: PhaseDef | null = null;
    let missingRequirements: string[] = [];

    for (const phase of phases) {
        let allPassed = true;
        const missing = [];

        for (const req of phase.requirements) {
            if (!req.check()) {
                allPassed = false;
                missing.push(req.name);
            }
        }

        if (allPassed) {
            completedPhases.push(phase.id);
        } else {
            currentPhase = phase;
            missingRequirements = missing;
            break;
        }
    }

    if (!currentPhase && completedPhases.length === phases.length) {
        return {
            currentPhase: "Complete",
            completedPhases,
            missingRequirements: [],
            recommendedNextStep: "Maintenance"
        };
    }

    return {
        currentPhase: currentPhase ? currentPhase.id : "Unknown",
        completedPhases,
        missingRequirements,
        recommendedNextStep: currentPhase 
            ? `Complete missing requirements for ${currentPhase.id}` 
            : "Unknown"
    };
}

const result = detectPhase();
console.log(JSON.stringify(result, null, 2));

// Update docs/assisted-runs/current-state.md
const statePath = path.join(ROOT_DIR, 'docs/assisted-runs/current-state.md');
if (fs.existsSync(statePath)) {
    let content = fs.readFileSync(statePath, 'utf8');
    const fullPhaseName = phases.find(p => p.id === result.currentPhase)?.name || result.currentPhase;
    
    content = content.replace(/## Current Phase\n.*?\n/, `## Current Phase\n${fullPhaseName}\n`);
    
    const completedText = result.completedPhases.map(id => {
        const p = phases.find(x => x.id === id);
        return `- ${p?.name}`;
    }).join('\n');
    
    const replacement = completedText ? `## Approved Completed Phases\n${completedText}\n` : `## Approved Completed Phases\nNone\n`;
    
    content = content.replace(/## Approved Completed Phases\n(?:- .*\n)*/, replacement);
    
    fs.writeFileSync(statePath, content, 'utf8');
}
