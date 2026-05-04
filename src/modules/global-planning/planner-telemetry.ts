import { PlannerTelemetry } from './types';

export class PlannerTelemetryCollector {
    private telemetry: PlannerTelemetry;

    constructor() {
        this.telemetry = {
            generatedStates: 0,
            vetoedStates: 0,
            prunedStates: 0,
            retainedStates: 0,
            dominantPruningReasons: {},
            planningTimeMs: 0
        };
    }

    recordGeneration(count: number = 1) {
        this.telemetry.generatedStates += count;
    }

    recordVeto(count: number = 1) {
        this.telemetry.vetoedStates += count;
    }

    recordPrune(reason: string, count: number = 1) {
        this.telemetry.prunedStates += count;
        if (!this.telemetry.dominantPruningReasons[reason]) {
            this.telemetry.dominantPruningReasons[reason] = 0;
        }
        this.telemetry.dominantPruningReasons[reason] += count;
    }

    recordRetained(count: number) {
        this.telemetry.retainedStates += count; // Tracking total retained over steps
    }

    finalize(startTimeMs: number) {
        this.telemetry.planningTimeMs = Date.now() - startTimeMs;
    }

    getTelemetry(): PlannerTelemetry {
        return this.telemetry;
    }
}
