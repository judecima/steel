import * as fs from 'fs';
import * as path from 'path';

const EXPORTS_DIR = path.join(process.cwd(), 'tools/qa-viewer/exports');

interface AuditResult {
  filename: string;
  exists: boolean;
  sizeBytes: number;
  valid: boolean;
  reason: string;
}

const EXPECTED_FILES = [
  'BOM.csv',
  'CUTLIST.csv',
  'Proyecto.json',
  'Montaje.txt',
  'reporte.tsv',
  'planos-tecnicos.pdf',
  'planos-package.json'
];

function auditFile(filename: string): AuditResult {
  const filePath = path.join(EXPORTS_DIR, filename);
  const exists = fs.existsSync(filePath);
  
  if (!exists) {
    return { filename, exists: false, sizeBytes: 0, valid: false, reason: 'File not found' };
  }

  const stats = fs.statSync(filePath);
  const size = stats.size;
  let valid = true;
  let reason = 'OK';

  if (size === 0) {
    valid = false;
    reason = 'Empty file';
  } else if (filename.endsWith('.pdf') && size < 5120) { // 5KB
    valid = false;
    reason = 'PDF suspiciously small (< 5KB)';
  } else if (filename.endsWith('.json')) {
    try {
      JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {
      valid = false;
      reason = 'Invalid JSON';
    }
  } else if (filename.endsWith('.csv') || filename.endsWith('.tsv')) {
    const content = fs.readFileSync(filePath, 'utf-8');
    if (!content.includes('\n') && content.length > 0) {
       // Just one line (maybe only header)
    }
    if (content.trim().length === 0) {
      valid = false;
      reason = 'Empty text content';
    }
  }

  return { filename, exists, sizeBytes: size, valid, reason };
}

async function runAudit() {
  console.log('--- INDUSTRIAL EXPORT AUDIT ---');
  console.log(`Directory: ${EXPORTS_DIR}\n`);

  const results = EXPECTED_FILES.map(auditFile);
  
  console.table(results);

  const allValid = results.every(r => r.valid);
  if (allValid) {
    console.log('\n[SUCCESS] All files are present and valid.');
  } else {
    console.log('\n[FAILURE] Some files are missing or invalid.');
  }
}

runAudit();
