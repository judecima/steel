export const PLANO_CONFIG = {
    // Sheet sizes in points (72 DPI)
    SIZES: {
        A3: { width: 1190.55, height: 841.89 }, // Landscape
        A4: { width: 595.28, height: 841.89 }
    },
    
    MARGINS: {
        top: 40,
        bottom: 40,
        left: 60, // Wider for binding
        right: 40
    },
    
    COLORS: {
        solera: '#FF0000',      // Rojo
        montante: '#00AA00',    // Verde
        dintel: '#FF0000',      // Rojo
        anclaje: '#FF00FF',     // Magenta
        rigidizacion: '#0000FF',// Azul
        cota: '#000000',        // Negro
        texto: '#000000',
        warning: '#FF8800',     // Naranja
        border: '#444444'
    },
    
    LINE_WEIGHTS: {
        thick: 1.5,
        medium: 1.0,
        thin: 0.5,
        hairline: 0.25
    },
    
    FONTS: {
        title: 14,
        subtitle: 11,
        normal: 9,
        small: 7,
        tiny: 5
    },
    
    DISCLAIMER: 'Documento preliminar. Requiere revisión y firma de profesional competente antes de fabricación o montaje.',
    SYSTEM_NAME: 'Steel Frame Engine'
};

export const TRADUCCIONES = {
    STUD: 'MONTANTE',
    TRACK: 'SOLERA',
    HEADER: 'DINTEL',
    KING_STUD: 'MONTANTE PRINCIPAL',
    JACK_STUD: 'MONTANTE DE APOYO',
    CRIPPLE_STUD: 'MONTANTE CORTO',
    SILL: 'SOLERA VENTANA'
};
