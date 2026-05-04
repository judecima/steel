export const STRUCTURAL_ASSUMPTIONS = {
  loads: {
    dead_load_roof_kn_m2: 0.5,
    live_load_roof_kn_m2: 1.0,
    wind_pressure_kn_m2: 1.0, // Placeholder
  },
  thresholds: {
    header_span_level_A_max: 1.2, // Small spans
    header_span_level_B_max: 2.4, // Medium spans
    header_span_level_C_max: 3.6, // Large spans
    roof_span_truss_requirement: 4.0, // Spans over 4m require truss
  },
  simplifications: {
    axial_only_studs: true,
    simply_supported_headers: true,
  },
  defaults: {
    steel_grade: 'F-24', // Base steel yield 240 MPa
    fy_mpa: 240,
    elastic_modulus_mpa: 200000,
  }
};
