export class CSVExporter {
    static toCSV(data: any[]): string {
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const rows = data.map(obj => 
            headers.map(header => {
                const val = obj[header];
                return typeof val === 'string' ? `"${val}"` : val;
            }).join(',')
        );
        
        return [headers.join(','), ...rows].join('\n');
    }
}
