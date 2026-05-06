export class CSVExporter {
    static toCSV(data: any[], defaultHeaders?: string[]): string {
        if (data.length === 0) {
            const headerLine = defaultHeaders ? defaultHeaders.join(',') : 'Mensaje';
            return `${headerLine}\n# Sin datos disponibles. Regenerar proyecto.`;
        }
        
        const headers = defaultHeaders || Object.keys(data[0]);
        const rows = data.map(obj => 
            headers.map(header => {
                const val = obj[header];
                if (val === undefined || val === null) return '""';
                return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
            }).join(',')
        );
        
        return [headers.join(','), ...rows].join('\n');
    }
}
