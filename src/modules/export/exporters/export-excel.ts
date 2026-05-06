export class ExcelExporter {
    static generateSpreadsheet(sheets: Record<string, any[]>): string {
        // En un entorno real, esto usaría xlsx (SheetJS)
        // Aquí generamos un formato TSV (Tab-Separated Values) que Excel abre nativamente
        let output = '';
        for (const [name, data] of Object.entries(sheets)) {
            output += `HOJA: ${name}\n`;
            if (data.length > 0) {
                const headers = Object.keys(data[0]);
                output += headers.join('\t') + '\n';
                data.forEach(row => {
                    output += headers.map(h => row[h]).join('\t') + '\n';
                });
            }
            output += '\n';
        }
        return output;
    }
}
